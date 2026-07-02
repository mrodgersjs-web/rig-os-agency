#!/usr/bin/env python3
"""
RIG Google OAuth Fix — All 3 Accounts
Starts a local callback server, opens browser for each account,
captures auth codes, exchanges for tokens, and tests Gmail + Calendar.

USAGE: python3 scripts/google_oauth_fix_all.py

The user needs to:
1. Sign in with each account when the browser opens
2. Click "Allow" on the consent screen
3. The script handles the rest automatically
"""
import json, os, sys, time, threading, webbrowser, urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import requests

# ── Config ──────────────────────────────────────────────────────────
CLIENT_ID = "REDACTED"
CLIENT_SECRET = "REDACTED"
VAULT_DIR = Path("/Users/rig128gb/.jake-vault")
OUTPUT_FILE = VAULT_DIR / "google_oauth_all_accounts.json"
EXISTING_FILE = VAULT_DIR / "google_oauth_tokens.json"

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
]

ACCOUNTS = [
    {"email": "mike@rodgersintelligence.com", "label": "Business"},
    {"email": "rodgemd1@gmail.com", "label": "Legacy/Business"},
    {"email": "mrodgerjs@gmail.com", "label": "Personal"},
]

REDIRECT_PORT = 19876
REDIRECT_URI = f"http://localhost:{REDIRECT_PORT}/callback"

# ── Callback server ─────────────────────────────────────────────────
captured_codes = {}
current_state = None

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global captured_codes
        if "/callback" in self.path:
            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            code = params.get("code", [""])[0]
            state = params.get("state", [""])[0]
            error = params.get("error", [""])[0]
            
            if error:
                self.send_response(400)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                self.wfile.write(f"<h1>Authorization denied: {error}</h1><p>Close this tab.</p>".encode())
                return
            
            if code and state:
                captured_codes[state] = code
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                html = """<html><body style="font-family:system-ui;text-align:center;padding:40px">
                    <h1 style="color:#22c55e">Authorized!</h1>
                    <p>Token captured. You can close this tab.</p>
                    </body></html>"""
                self.wfile.write(html.encode("utf-8"))
                return
        
        self.send_response(404)
        self.end_headers()
    
    def log_message(self, *args): pass

def start_callback_server():
    server = HTTPServer(("localhost", REDIRECT_PORT), OAuthCallbackHandler)
    server.timeout = 1
    # Keep serving until we have all codes or timeout
    start = time.time()
    while time.time() - start < 300:  # 5 min total
        server.handle_request()
        if len(captured_codes) >= len(ACCOUNTS):
            break
    server.server_close()

# ── OAuth flow ──────────────────────────────────────────────────────
def build_auth_url(account_email):
    global current_state
    state = account_email  # use email as state identifier
    current_state = state
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",  # force consent to get new refresh token
        "login_hint": account_email,
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/auth?{urllib.parse.urlencode(params)}"

def exchange_code(code):
    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    })
    return resp.json()

def test_gmail(access_token):
    """Test Gmail API with the access token"""
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3",
        headers=headers
    )
    if resp.status_code == 200:
        msgs = resp.json().get("messages", [])
        results = []
        for m in msgs[:3]:
            detail = requests.get(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{m['id']}?format=metadata",
                headers=headers
            )
            if detail.status_code == 200:
                d = detail.json()
                hdrs = {h["name"]: h["value"] for h in d["payload"]["headers"]}
                results.append(f"  📧 {hdrs.get('From','?')[:35]}: {hdrs.get('Subject','?')[:40]}")
        return True, f"{len(msgs)} messages", results
    return False, f"HTTP {resp.status_code}", [resp.text[:100]]

def test_calendar(access_token):
    """Test Calendar API with the access token"""
    from datetime import datetime, timezone, timedelta
    headers = {"Authorization": f"Bearer {access_token}"}
    now = datetime.now(timezone.utc).isoformat()
    future = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    resp = requests.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        params={"timeMin": now, "timeMax": future, "singleEvents": True, "orderBy": "startTime"},
        headers=headers
    )
    if resp.status_code == 200:
        events = resp.json().get("items", [])
        results = []
        for ev in events[:5]:
            start = ev.get("start", {}).get("dateTime", ev.get("start", {}).get("date", ""))
            results.append(f"  📅 {start[:16]} → {ev.get('summary','(no title)')[:40]}")
        return True, f"{len(events)} events", results
    return False, f"HTTP {resp.status_code}", [resp.text[:100]]

# ── Main ────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  RIG Google OAuth Fix — All 3 Accounts")
    print("=" * 60)
    print(f"\n  Client ID: {CLIENT_ID}")
    print(f"  Scopes: Gmail (read+send) + Calendar (read+events)")
    print(f"  Accounts:")
    for a in ACCOUNTS:
        print(f"    • {a['email']} ({a['label']})")
    print(f"\n  ⚠️  For each account:")
    print(f"     1. Browser opens → sign in with that account")
    print(f"     2. Click 'Allow' on consent screen")
    print(f"     3. Script captures token automatically")
    print(f"\n  Starting callback server on port {REDIRECT_PORT}...")
    
    # Start callback server in background
    server_thread = threading.Thread(target=start_callback_server, daemon=True)
    server_thread.start()
    time.sleep(0.5)
    
    all_tokens = {}
    
    for i, account in enumerate(ACCOUNTS):
        email = account["email"]
        print(f"\n{'─' * 60}")
        print(f"  [{i+1}/3] Authorizing: {email}")
        print(f"{'─' * 60}")
        
        auth_url = build_auth_url(email)
        print(f"  Opening browser...")
        webbrowser.open(auth_url)
        
        # Wait for callback
        timeout = 90  # 90 seconds per account
        found = False
        for _ in range(timeout):
            if email in captured_codes:
                code = captured_codes[email]
                print(f"  ✅ Auth code received!")
                
                # Exchange for tokens
                print(f"  Exchanging code for tokens...")
                token_data = exchange_code(code)
                
                if "access_token" in token_data:
                    access_token = token_data["access_token"]
                    refresh_token = token_data.get("refresh_token", "")
                    print(f"  ✅ Tokens obtained!")
                    print(f"     Access token: {access_token[:20]}...")
                    print(f"     Refresh token: {'present' if refresh_token else 'MISSING'}")
                    print(f"     Expires in: {token_data.get('expires_in')}s")
                    
                    # Test Gmail
                    print(f"\n  Testing Gmail...")
                    gm_ok, gm_msg, gm_details = test_gmail(access_token)
                    if gm_ok:
                        print(f"  ✅ Gmail: {gm_msg}")
                        for line in gm_details:
                            print(f"  {line}")
                    else:
                        print(f"  ❌ Gmail: {gm_msg}")
                        for line in gm_details:
                            print(f"  {line}")
                    
                    # Test Calendar
                    print(f"\n  Testing Calendar...")
                    cal_ok, cal_msg, cal_details = test_calendar(access_token)
                    if cal_ok:
                        print(f"  ✅ Calendar: {cal_msg}")
                        for line in cal_details:
                            print(f"  {line}")
                    else:
                        print(f"  ❌ Calendar: {cal_msg}")
                        for line in cal_details:
                            print(f"  {line}")
                    
                    all_tokens[email] = {
                        "access_token": access_token,
                        "refresh_token": refresh_token,
                        "expires_in": token_data.get("expires_in", 3600),
                        "scope": token_data.get("scope", ""),
                        "token_type": token_data.get("token_type", "Bearer"),
                        "gmail_works": gm_ok,
                        "calendar_works": cal_ok,
                        "authorized_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                    }
                    found = True
                else:
                    print(f"  ❌ Token exchange failed: {token_data}")
                break
            time.sleep(1)
        
        if not found:
            print(f"  ❌ Timeout or denied for {email}")
    
    # Save all tokens
    print(f"\n{'=' * 60}")
    output = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "scopes": SCOPES,
        "accounts": all_tokens,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Tokens saved to: {OUTPUT_FILE}")
    print(f"  Accounts authorized: {len(all_tokens)}/{len(ACCOUNTS)}")
    
    # Also update the original tokens file for mike@rodgersintelligence.com
    if "mike@rodgersintelligence.com" in all_tokens:
        mike_tok = all_tokens["mike@rodgersintelligence.com"]
        with open(EXISTING_FILE, "w") as f:
            json.dump({
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "refresh_token": mike_tok["refresh_token"],
                "token": mike_tok["access_token"],
                "scopes": SCOPES,
            }, f, indent=2)
        print(f"  Updated original tokens file: {EXISTING_FILE}")
    
    # Summary
    print(f"\n{'=' * 60}")
    print(f"  SUMMARY")
    print(f"{'=' * 60}")
    for email, data in all_tokens.items():
        gm = "✅" if data.get("gmail_works") else "❌"
        cal = "✅" if data.get("calendar_works") else "❌"
        print(f"  {email}:")
        print(f"    Gmail: {gm}  Calendar: {cal}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
