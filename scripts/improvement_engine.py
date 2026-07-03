#!/usr/bin/env python3
"""
RIG OS AGENCY — Continuous Improvement Engine
Runs 10 times a day via cron. Scans the app, finds improvements, 
implements them, and logs what it did.

Each run:
1. Scans all pages for broken links, missing data, stale content
2. Finds 10 things to improve
3. Implements what it can
4. Logs everything to the improvement journal
"""

import json
import subprocess
import os
import time
from datetime import datetime

BASE_URL = "http://127.0.0.1:3737"
LOG_FILE = os.path.expanduser("~/.rig/logs/rig-improvement-engine.log")
JOURNAL_DIR = os.path.expanduser("~/Documents/JakeStudio/Logs")

os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
os.makedirs(JOURNAL_DIR, exist_ok=True)

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def fetch(url, timeout=5):
    import urllib.request
    try:
        req = urllib.request.Request(url)
        start = time.time()
        resp = urllib.request.urlopen(req, timeout=timeout)
        elapsed = int((time.time() - start) * 1000)
        return resp.status, elapsed
    except Exception as e:
        return 0, str(e)[:100]

def check_pages():
    """Check all pages return 200"""
    import urllib.request
    pages = [
        "/", "/agency", "/agency/agents", "/agency/pipeline", "/agency/revenue",
        "/agency/clients", "/agency/proposals", "/agency/contracts", "/agency/invoices",
        "/agency/jobs", "/agency/outreach", "/agency/social", "/agency/stripe",
        "/agency/briefing", "/agency/seo", "/agency/scraping", "/agency/recall",
        "/agency/portals", "/agency/fleet", "/agency/ads", "/agency/teasers",
        "/orchestration", "/paperclip", "/memory", "/goals",
        "/hermes", "/claude", "/codex", "/jarvis",
        "/rig-linkedin", "/rig-instagram", "/rig-gtm", "/rig-design", "/rig-strategy", "/rig-app",
        "/rig-doctrine", "/rig-fleet", "/rig-goals", "/rig-lattice", "/rig-deviation",
        "/agency-agents", "/voltagents", "/fleet",
    ]
    
    issues = []
    for page in pages:
        status, detail = fetch(f"{BASE_URL}{page}")
        if status != 200:
            issues.append({"page": page, "status": status, "detail": detail})
    
    return issues

def check_apis():
    """Check critical API routes"""
    apis = [
        "/api/health",
        "/api/agency/fleet",
        "/api/system-status",
        "/api/local/chat",
        "/api/terminal",
        "/api/zai/chat",
    ]
    
    issues = []
    for api in apis:
        status, detail = fetch(f"{BASE_URL}{api}")
        if status not in (200, 405):  # 405 is OK for GET on POST endpoints
            issues.append({"api": api, "status": status, "detail": detail})
    
    return issues

def check_local_models():
    """Check Ornith and other local models are available"""
    try:
        result = subprocess.run(
            ["ollama", "ps", "--format", "json"],
            capture_output=True, text=True, timeout=5
        )
        models = json.loads(result.stdout) if result.stdout.strip() else []
        loaded = [m.get("name", "") for m in models] if isinstance(models, list) else []
        ornith_loaded = any("ornith" in m for m in loaded)
        return {
            "ornith_loaded": ornith_loaded,
            "loaded_models": loaded,
        }
    except Exception as e:
        return {"error": str(e)}

def check_hermes():
    """Check Hermes gateway is connected"""
    status, _ = fetch("http://127.0.0.1:8642/health")
    return {"hermes_up": status == 200}

def generate_improvements(issues_pages, issues_apis, models, hermes):
    """Generate 10 improvement items"""
    improvements = []
    
    # From page issues
    for issue in issues_pages[:3]:
        improvements.append({
            "area": "pages",
            "issue": f"{issue['page']} returned {issue['status']}",
            "action": f"Investigate and fix {issue['page']}",
            "priority": "high",
        })
    
    # From API issues
    for issue in issues_apis[:2]:
        improvements.append({
            "area": "apis",
            "issue": f"{issue['api']} returned {issue['status']}",
            "action": f"Fix API route {issue['api']}",
            "priority": "high",
        })
    
    # From model checks
    if not models.get("ornith_loaded"):
        improvements.append({
            "area": "models",
            "issue": "Ornith:35B not loaded in GPU memory",
            "action": "Run: ollama load ornith:35b",
            "priority": "high",
        })
    
    # From Hermes check
    if not hermes.get("hermes_up"):
        improvements.append({
            "area": "gateway",
            "issue": "Hermes gateway not responding",
            "action": "Run: hermes gateway start",
            "priority": "critical",
        })
    
    # Standard improvement items
    improvements.extend([
        {"area": "content", "issue": "Check for stale data on dashboard", "action": "Review Command Center for accuracy", "priority": "medium"},
        {"area": "agents", "issue": "Verify agent fleet count matches", "action": "Check /api/agency/fleet returns 410+ agents", "priority": "medium"},
        {"area": "cron", "issue": "Verify briefing cron is scheduled", "action": "Check hermes cron list for daily briefing", "priority": "medium"},
        {"area": "seo", "issue": "Check SEO page for recent changes", "action": "Review SEO Command for new keywords", "priority": "low"},
        {"area": "pipeline", "issue": "Check pipeline for stale deals", "action": "Review deals that haven't moved in 7+ days", "priority": "medium"},
        {"area": "revenue", "issue": "Verify revenue numbers are real", "action": "Cross-check with Stripe — no fabricated numbers", "priority": "high"},
    ])
    
    return improvements[:10]

def run():
    log("=== RIG OS Improvement Engine START ===")
    
    # Run checks
    page_issues = check_pages()
    api_issues = check_apis()
    models = check_local_models()
    hermes = check_hermes()
    
    log(f"Page issues: {len(page_issues)}")
    log(f"API issues: {len(api_issues)}")
    log(f"Ornith loaded: {models.get('ornith_loaded', False)}")
    log(f"Hermes up: {hermes.get('hermes_up', False)}")
    
    # Generate improvements
    improvements = generate_improvements(page_issues, api_issues, models, hermes)
    
    log(f"Generated {len(improvements)} improvement items:")
    for i, imp in enumerate(improvements):
        log(f"  {i+1}. [{imp['priority'].upper()}] {imp['area']}: {imp['issue']}")
        log(f"     Action: {imp['action']}")
    
    # Auto-fix what we can
    fixes_applied = []
    
    # If Ornith not loaded, load it
    if not models.get("ornith_loaded"):
        log("Auto-fixing: Loading Ornith:35B...")
        try:
            subprocess.Popen(["ollama", "load", "ornith:35b"], 
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            fixes_applied.append("Loaded Ornith:35B")
        except:
            pass
    
    # Write improvement journal entry
    entry = {
        "timestamp": datetime.now().isoformat(),
        "page_issues": page_issues,
        "api_issues": api_issues,
        "models": models,
        "hermes": hermes,
        "improvements": improvements,
        "fixes_applied": fixes_applied,
    }
    
    journal_file = os.path.join(JOURNAL_DIR, f"improvement-{datetime.now().strftime('%Y-%m-%d')}.jsonl")
    with open(journal_file, "a") as f:
        f.write(json.dumps(entry) + "\n")
    
    log(f"Journal entry written to {journal_file}")
    log(f"Fixes applied: {len(fixes_applied)}")
    log("=== RIG OS Improvement Engine END ===\n")

if __name__ == "__main__":
    run()
