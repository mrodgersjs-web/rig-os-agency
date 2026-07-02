#!/usr/bin/env python3
"""
RIG Google OAuth Re-Authorization Flow
Opens browser for each Google account to get fresh refresh tokens.
"""
import json, webbrowser, urllib.parse, http.server, threading, os
from pathlib import Path

CLIENT_ID = "28378277140-rlrsit43p9bt6e2v4povhpa5qitiln13.apps.googleusercontent.com"
CLIENT_SECRET_FILE = Path("/Users/rig128gb/.jake-vault/google_oauth_client_secret.json")
TOKENS_FILE = Path("/Users/rig128gb/.jake-vault/google_oauth_tokens.json")
ACCOUNTS = [
    {"email": "mike@rodgersintelligence.com", "label": "Business"},
    {"email": "rodgemd1@gmail.com", "label": "Legacy/Business"},
    {"email": "mrodgerjs@gmail.com", "label": "Personal"},
]
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
]
REDIRECT_PORT = 19876
REDIRECT_URI = f"http://localhost:{REDIRECT_PORT}/callback"

auth_codes = {}

class OAuthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if "/callback" in self.path:
            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            code = params.get("code", [""])[0]
            state = params.get("state", [""])[0]
            if code:
                auth_codes[state] = code
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                self.wfile.write(b"<h1>Authorization received! You can close this tab.</h1>")
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"<h1>No code received</h1>")
    def log_message(self, *args): pass

def start_server():
    server = http.server.HTTPServer(("localhost", REDIRECT_PORT), OAuthHandler)
    server.handle_request()
    server.handle_request()
    server.handle_request()

def get_auth_code(account_email):
    state = account_email
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "login_hint": account_email,
        "state": state,
    }
    auth_url = f"https://accounts.google.com/o/oauth2/auth?{urllib.parse.urlencode(params)}"
    print(f"\n{'='*60}")
    print(f"  Opening browser for: {account_email}")
    print(f"  Sign in with this exact account!")
    print(f"{'='*60}")
    webbrowser.open(auth_url)
    # Wait for callback
    import time
    for _ in range(120):  # 2 min timeout
        if state in auth_codes:
            return auth_codes[state]
        time.sleep(1)
    return None

def exchange_code(code):
    import requests
    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": CLIENT_ID,
        "client_secret": "",  # Will be filled from file or prompt
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    })
    return resp.json()

def main():
    print("RIG Google OAuth Re-Authorization")
    print("="*60)
    
    # Get client secret
    client_secret = ""
    if CLIENT_SECRET_FILE.exists():
        with open(CLIENT_SECRET_FILE) as f:
            d = json.load(f)
            client_secret = d.get("client_secret", d.get("installed",{}).get("client_secret",""))
    if not client_secret:
        # Try from existing tokens file
        if TOKENS_FILE.exists():
            with open(TOKENS_FILE) as f:
                client_secret = json.load(f).get("client_secret","")
    if not client_secret:
        print("ERROR: No client secret found. Need it to proceed.")
        return
    
    print(f"Client ID: {CLIENT_ID}")
    print(f"Scopes: {SCOPES}")
    print(f"Accounts: {[a['email'] for a in ACCOUNTS]}")
    
    # Start callback server
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    all_tokens = {}
    
    for account in ACCOUNTS:
        email = account["email"]
        print(f"\n--- Authorizing {email} ({account['label']}) ---")
        code = get_auth_code(email)
        if not code:
            print(f"FAILED: No auth code for {email}")
            continue
        
        import requests
        resp = requests.post("https://oauth2.googleapis.com/token", data={
            "client_id": CLIENT_ID,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI,
        })
        data = resp.json()
        if "access_token" in data:
            all_tokens[email] = {
                "access_token": data["access_token"],
                "refresh_token": data.get("refresh_token", ""),
                "expires_in": data.get("expires_in", 3600),
                "scope": data.get("scope", ""),
            }
            print(f"SUCCESS: Got tokens for {email}")
        else:
            print(f"FAILED: {data}")
    
    # Save all tokens
    output_file = Path("/Users/rig128gb/.jake-vault/google_oauth_all_accounts.json")
    with open(output_file, "w") as f:
        json.dump({
            "client_id": CLIENT_ID,
            "client_secret": client_secret,
            "accounts": all_tokens,
            "scopes": SCOPES,
        }, f, indent=2)
    print(f"\nAll tokens saved to {output_file}")
    print(f"Accounts authorized: {list(all_tokens.keys())}")

if __name__ == "__main__":
    main()
