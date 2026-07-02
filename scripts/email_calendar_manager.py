#!/usr/bin/env python3
"""
RIG Email + Calendar Manager — Multi-Account
Reads Google OAuth tokens for all accounts, refreshes them, and provides:
1. Recent emails from all inboxes
2. Email categorization
3. Calendar events merged across accounts
4. Saves state to data/email_calendar_state.json
"""
import json, os, sys, time, requests
from datetime import datetime, timedelta, timezone
from pathlib import Path

TOKENS_FILE = Path("/Users/rig128gb/.jake-vault/google_oauth_all_accounts.json")
STATE_PATH = Path("/Users/rig128gb/Developer/rig-os-agency/data/email_calendar_state.json")

def refresh_token(client_id, client_secret, refresh_token):
    """Refresh an access token using the refresh token."""
    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    })
    if resp.status_code == 200:
        return resp.json().get("access_token")
    print(f"  Refresh failed: {resp.json()}")
    return None

def fetch_emails(access_token, account, max_results=20):
    """Fetch recent emails via Gmail REST API."""
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={max_results}",
        headers=headers
    )
    if resp.status_code != 200:
        print(f"  Gmail error for {account}: {resp.status_code}")
        return []
    
    messages = resp.json().get("messages", [])
    emails = []
    for msg in messages:
        detail = requests.get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg['id']}?format=metadata",
            headers=headers
        )
        if detail.status_code == 200:
            d = detail.json()
            hdrs = {h["name"]: h["value"] for h in d["payload"]["headers"]}
            subject = hdrs.get("Subject", "(no subject)")
            sender = hdrs.get("From", "")
            snippet = d.get("snippet", "")
            
            # Categorize
            text = f"{subject} {sender} {snippet}".lower()
            if any(kw in text for kw in ["inquiry", "interested", "pricing", "audit", "consult", "meeting", "call", "demo"]):
                cat = "lead"
            elif any(kw in text for kw in ["invoice", "contract", "onboarding", "payment", "scope"]):
                cat = "client"
            elif any(kw in text for kw in ["partner", "referral", "co-sell", "affiliate", "introduction"]):
                cat = "partner"
            elif any(kw in text for kw in ["urgent", "asap", "emergency", "deadline", "today", "expires"]):
                cat = "urgent"
            else:
                cat = "newsletter"
            
            emails.append({
                "id": msg["id"],
                "account": account,
                "from": sender,
                "fromName": sender.split("<")[0].strip().strip('"') if "<" in sender else sender,
                "subject": subject,
                "snippet": snippet[:200],
                "date": hdrs.get("Date", ""),
                "category": cat,
                "unread": "UNREAD" in d.get("labelIds", []),
            })
    return emails

def fetch_calendar(access_token, account, days=7):
    """Fetch calendar events via Google Calendar REST API."""
    headers = {"Authorization": f"Bearer {access_token}"}
    now = datetime.now(timezone.utc).isoformat()
    future = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    resp = requests.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        params={"timeMin": now, "timeMax": future, "singleEvents": True, "orderBy": "startTime"},
        headers=headers
    )
    if resp.status_code != 200:
        print(f"  Calendar error for {account}: {resp.status_code}")
        return []
    
    events = []
    for ev in resp.json().get("items", []):
        start = ev.get("start", {}).get("dateTime", ev.get("start", {}).get("date", ""))
        end = ev.get("end", {}).get("dateTime", ev.get("end", {}).get("date", ""))
        events.append({
            "id": ev["id"],
            "account": account,
            "title": ev.get("summary", "(no title)"),
            "start": start,
            "end": end,
            "source": "google",
            "location": ev.get("location", ""),
            "attendees": [a.get("email", "") for a in ev.get("attendees", [])],
            "status": ev.get("status", "confirmed"),
        })
    return events

def main():
    print("[rig] Multi-Account Email + Calendar Manager")
    print("=" * 60)
    
    with open(TOKENS_FILE) as f:
        config = json.load(f)
    
    client_id = config["client_id"]
    client_secret = config["client_secret"]
    accounts = config.get("accounts", {})
    
    if not accounts:
        print("ERROR: No accounts found in tokens file")
        return
    
    all_emails = []
    all_events = []
    account_status = {}
    
    for email_addr, tok_data in accounts.items():
        print(f"\n--- {email_addr} ---")
        refresh = tok_data.get("refresh_token", "")
        if not refresh:
            print(f"  No refresh token, skipping")
            account_status[email_addr] = {"gmail": False, "calendar": False}
            continue
        
        # Refresh token
        access_token = refresh_token(client_id, client_secret, refresh)
        if not access_token:
            account_status[email_addr] = {"gmail": False, "calendar": False}
            continue
        
        print(f"  Token refreshed")
        
        # Fetch emails
        emails = fetch_emails(access_token, email_addr, max_results=20)
        all_emails.extend(emails)
        print(f"  Gmail: {len(emails)} emails")
        
        # Fetch calendar
        events = fetch_calendar(access_token, email_addr, days=7)
        all_events.extend(events)
        print(f"  Calendar: {len(events)} events")
        
        account_status[email_addr] = {"gmail": len(emails) > 0, "calendar": len(events) > 0}
    
    # Sort emails by date (most recent first)
    all_emails.sort(key=lambda e: e.get("date", ""), reverse=True)
    # Sort events by start time
    all_events.sort(key=lambda e: e.get("start", ""))
    
    # Build summary
    by_cat = {}
    unread_count = 0
    for e in all_emails:
        by_cat[e["category"]] = by_cat.get(e["category"], 0) + 1
        if e["unread"]:
            unread_count += 1
    
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_events = [e for e in all_events if e["start"].startswith(today_str)]
    
    state = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "accountStatus": account_status,
        "emails": all_emails,
        "emailSummary": {
            "total": len(all_emails),
            "unread": unread_count,
            "needsReply": len([e for e in all_emails if e["unread"] and e["category"] in ("lead", "client", "urgent", "partner")]),
            "byCategory": by_cat,
        },
        "calendarEvents": all_events,
        "calendarSummary": {
            "total": len(all_events),
            "today": len(today_events),
        },
    }
    
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)
    print(f"\n[rig] State saved to {STATE_PATH}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("  MERGED INBOX — ALL ACCOUNTS")
    print("=" * 60)
    for e in all_emails[:15]:
        flag = "NEW" if e["unread"] else "   "
        print(f"  [{flag}] [{e['category']:9s}] {e['account'][:25]:25s} | {e['fromName'][:20]:20s}: {e['subject'][:35]}")
    
    print(f"\n  {'─' * 56}")
    print(f"  CALENDAR — Next 7 days (merged)")
    print(f"  {'─' * 56}")
    for ev in all_events[:15]:
        print(f"  {ev['start'][:16]:16s} | {ev['account'][:20]:20s} | {ev['title'][:30]}")
    if not all_events:
        print("  (no events)")
    
    print(f"\n  TOTALS: {len(all_emails)} emails ({unread_count} unread) | {len(all_events)} events ({len(today_events)} today)")
    print("=" * 60)

if __name__ == "__main__":
    main()
