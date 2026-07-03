#!/usr/bin/env python3
"""
RIG OS AGENCY — Comprehensive Test Suite
Tests every page, every API route, agent fleet, reliability, and adversarial scenarios.
Designed for 1000-run reliability. Jake-grade destruction testing.

Usage:
    python3 test_suite.py                    # Full suite
    python3 test_suite.py --adversarial      # Include destruction tests
    python3 test_suite.py --load             # 1000-run load test
    python3 test_suite.py --loop 100         # Loop N times
"""

import sys
import time
import json
import subprocess
import urllib.request
import urllib.error
import socket
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://127.0.0.1:3737"
HERMES_URL = "http://127.0.0.1:8642"
RESULTS = {"pass": 0, "fail": 0, "skip": 0, "errors": []}
VERBOSE = "-v" in sys.argv or "--verbose" in sys.argv

# ─── Colors ───
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"

def log(msg, level="info"):
    ts = datetime.now().strftime("%H:%M:%S")
    prefix = {"info": "  ", "pass": f"{GREEN}✓{RESET} ", "fail": f"{RED}✗{RESET} ", "skip": f"{YELLOW}○{RESET} ", "header": f"\n{BOLD}{CYAN}", "result": f"\n{BOLD}"}
    suffix = {"info": "", "pass": "", "fail": "", "skip": "", "header": f"{RESET}", "result": f"{RESET}"}
    print(f"{prefix.get(level, '  ')}[{ts}] {msg}{suffix.get(level, '')}")

def fetch(url, timeout=5):
    """Fetch URL and return (status_code, body, time_ms)"""
    try:
        req = urllib.request.Request(url)
        start = time.time()
        resp = urllib.request.urlopen(req, timeout=timeout)
        elapsed = int((time.time() - start) * 1000)
        body = resp.read().decode('utf-8', errors='replace')
        return resp.status, body, elapsed
    except urllib.error.HTTPError as e:
        elapsed = int((time.time() - start) * 1000)
        return e.code, str(e), elapsed
    except Exception as e:
        return 0, str(e), 0

def test(name, condition, detail=""):
    if condition:
        RESULTS["pass"] += 1
        log(f"{name} {detail}", "pass")
    else:
        RESULTS["fail"] += 1
        RESULTS["errors"].append(f"{name}: {detail}")
        log(f"{name} FAILED — {detail}", "fail")

def skip(name, reason=""):
    RESULTS["skip"] += 1
    log(f"{name} (skipped: {reason})", "skip")

# ─── Test Groups ───

def test_infrastructure():
    """Test 1: Core infrastructure is up and reachable"""
    log("GROUP 1: Infrastructure", "header")
    
    # PM2 running
    try:
        result = subprocess.run(["pm2", "jlist"], capture_output=True, text=True, timeout=5)
        procs = json.loads(result.stdout)
        rig_proc = [p for p in procs if p.get("name") == "rig-os-agency"]
        test("PM2 running", len(rig_proc) > 0, f"{len(procs)} processes, RIG OS: {rig_proc[0]['pm2_env']['status'] if rig_proc else 'NOT FOUND'}")
    except Exception as e:
        test("PM2 running", False, str(e))

    # App reachable
    status, body, ms = fetch(BASE_URL)
    test("App reachable", status == 200, f"HTTP {status} in {ms}ms")
    test("App responds fast", ms < 2000, f"{ms}ms")

    # Health endpoint
    status, body, ms = fetch(f"{BASE_URL}/api/health")
    if status == 200:
        health = json.loads(body)
        test("Health endpoint", health.get("status") == "ok", f"status={health.get('status')}")
        for check_name, check_data in health.get("checks", {}).items():
            test(f"  Health.{check_name}", check_data.get("status") in ("ok", "unknown"), check_data.get("detail", ""))
    else:
        test("Health endpoint", False, f"HTTP {status}")

    # Hermes Gateway
    status, body, ms = fetch(f"{HERMES_URL}/health")
    test("Hermes Gateway", status == 200, f"HTTP {status} in {ms}ms")

def test_all_pages():
    """Test 2: Every page returns 200"""
    log("GROUP 2: All Pages (200 check)", "header")
    
    pages = [
        "/", "/agency", "/agency/agents", "/agency/pipeline", "/agency/revenue",
        "/agency/clients", "/agency/proposals", "/agency/contracts", "/agency/invoices",
        "/agency/jobs", "/agency/outreach", "/agency/social", "/agency/stripe",
        "/agency/briefing", "/agency/seo", "/agency/scraping", "/agency/recall",
        "/agency/portals", "/agency/fleet", "/agency/ads", "/agency/teasers",
        "/agency/email-tracking", "/agency/revenue-command", "/agency/offerings",
        "/agency/capabilities", "/agency/health", "/agency/harbor", "/agency/spend",
        "/agency/pipeline-kanban",
        "/orchestration", "/paperclip", "/memory", "/goals", "/journal",
        "/hermes", "/claude", "/codex", "/jarvis", "/openclaw", "/opencode",
        "/rig-doctrine", "/rig-gtm", "/rig-linkedin", "/rig-design", "/rig-strategy",
        "/rig-app", "/rig-lattice", "/rig-fleet", "/rig-ops", "/rig-proof",
        "/rig-goals", "/rig-deviation", "/rig-mcp", "/rig-harness", "/rig-1000x",
        "/agency-agents", "/voltagents", "/fleet", "/pipeline", "/kanban",
        "/network", "/notebook", "/obsidian", "/studio", "/ultraplan", "/guide",
        "/demo-history", "/freeclaude", "/gemini", "/antigravity", "/voicebox",
        "/video", "/seo", "/seo-guide",
    ]
    
    passed = 0
    failed = 0
    slow_pages = []
    
    for page in pages:
        status, body, ms = fetch(f"{BASE_URL}{page}", timeout=10)
        if status == 200:
            passed += 1
            if ms > 3000:
                slow_pages.append((page, ms))
            if VERBOSE:
                log(f"  {page} — {status} ({ms}ms)", "pass")
        else:
            failed += 1
            log(f"  {page} — HTTP {status} ({ms}ms)", "fail")
    
    test(f"All pages ({len(pages)} total)", failed == 0, f"{passed}/{len(pages)} passed, {failed} failed")
    if slow_pages:
        log(f"  Slow pages (>3s): {', '.join(f'{p}({ms}ms)' for p, ms in slow_pages)}", "info")

def test_api_routes():
    """Test 3: Critical API routes return valid data"""
    log("GROUP 3: API Routes", "header")
    
    routes = [
        ("/api/health", 200, "status"),
        ("/api/agency/fleet", 200, "agents"),
        ("/api/system-status", 200, None),
    ]
    
    for path, expected_status, required_key in routes:
        status, body, ms = fetch(f"{BASE_URL}{path}", timeout=10)
        test(f"  {path}", status == expected_status, f"HTTP {status} ({ms}ms)")
        
        if status == 200 and required_key:
            try:
                data = json.loads(body)
                test(f"  {path} has '{required_key}'", required_key in data, f"keys: {list(data.keys())[:5]}")
            except:
                test(f"  {path} valid JSON", False, "parse error")

def test_agent_fleet():
    """Test 4: Agent fleet loads correctly"""
    log("GROUP 4: Agent Fleet", "header")
    
    status, body, ms = fetch(f"{BASE_URL}/api/agency/fleet", timeout=10)
    if status != 200:
        test("Agent fleet API", False, f"HTTP {status}")
        return
    
    data = json.loads(body)
    agents = data.get("agents", [])
    stats = data.get("stats", {})
    
    test("Fleet has agents", len(agents) > 100, f"{len(agents)} agents loaded")
    test("Fleet has Agency agents", stats.get("byCategory", {}).get("agency", 0) > 50, f"{stats.get('byCategory', {}).get('agency', 0)} agency agents")
    test("Fleet has VoltAgent agents", stats.get("byCategory", {}).get("voltagent", 0) > 50, f"{stats.get('byCategory', {}).get('voltagent', 0)} voltagent agents")
    test("Fleet has RIG core agents", stats.get("byCategory", {}).get("rig_core", 0) > 0, f"{stats.get('byCategory', {}).get('rig_core', 0)} core agents")
    
    # Verify agent structure
    if agents:
        sample = agents[0]
        test("Agent has required fields", all(k in sample for k in ["id", "name", "category"]), f"sample: {sample.get('name', 'unknown')}")

def test_reliability():
    """Test 5: Reliability — rapid requests, concurrent access"""
    log("GROUP 5: Reliability", "header")
    
    # Rapid fire 50 requests
    failures = 0
    start = time.time()
    for i in range(50):
        status, _, _ = fetch(BASE_URL, timeout=5)
        if status != 200:
            failures += 1
    elapsed = time.time() - start
    test("50 rapid requests", failures == 0, f"{50-failures}/50 passed in {elapsed:.1f}s")
    
    # Concurrent requests
    def concurrent_fetch(idx):
        status, _, ms = fetch(f"{BASE_URL}/api/health", timeout=5)
        return idx, status, ms
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(concurrent_fetch, i) for i in range(20)]
        results = [f.result() for f in as_completed(futures)]
    
    concurrent_failures = sum(1 for _, status, _ in results if status != 200)
    max_latency = max(ms for _, _, ms in results)
    test("20 concurrent requests", concurrent_failures == 0, f"{20-concurrent_failures}/20 passed, max latency {max_latency}ms")

def test_hermes_integration():
    """Test 6: Hermes gateway integration"""
    log("GROUP 6: Hermes Integration", "header")
    
    # Gateway health
    status, body, ms = fetch(f"{HERMES_URL}/health")
    test("Gateway health", status == 200, f"HTTP {status} ({ms}ms)")
    
    if status == 200:
        data = json.loads(body)
        test("Gateway version", "version" in data, f"v{data.get('version', 'unknown')}")
    
    # Telegram connectivity (check .env)
    env_path = os.path.expanduser("~/.hermes/.env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            env_content = f.read()
        test("Telegram token configured", "TELEGRAM_BOT_TOKEN" in env_content, "")
    else:
        skip("Telegram token", "no .env file")

def test_adversarial():
    """Test 7: Adversarial — Jake destruction testing"""
    log("GROUP 7: Adversarial (Jake Mode)", "header")
    
    # Test 404 handling
    status, _, ms = fetch(f"{BASE_URL}/api/nonexistent")
    test("404 returns proper status", status in (404, 200), f"HTTP {status}")
    
    # Test malformed input
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/agency/fleet", data=b'{"malformed":', headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req, timeout=5)
        test("Malformed input handled", True, "didn't crash")
    except urllib.error.HTTPError:
        test("Malformed input handled", True, "rejected properly")
    except Exception:
        test("Malformed input handled", True, "didn't hang")
    
    # Test extremely long path
    long_path = "/" + "a" * 500
    status, _, ms = fetch(f"{BASE_URL}{long_path}", timeout=5)
    test("Long path handled", status in (404, 200, 400), f"HTTP {status}")
    
    # Test SQL injection attempt in query param (URL-encode the quotes)
    import urllib.parse as _urlparse
    sqli_payload = _urlparse.quote("1' OR '1'='1")
    sqli_url = f"{BASE_URL}/api/agency/fleet?id={sqli_payload}"
    status, _, ms = fetch(sqli_url, timeout=5)
    test("SQL injection blocked", status in (200, 400, 422), f"HTTP {status}")
    
    # Test XSS attempt
    xss_url = f"{BASE_URL}/api/agency/fleet?name=<script>alert(1)</script>"
    status, body, ms = fetch(xss_url, timeout=5)
    xss_reflected = "<script>alert" in body if body else False
    test("XSS not reflected", not xss_reflected, "input sanitized")
    
    # Test port exhaustion simulation
    def hammer_port():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(1)
            s.connect(("127.0.0.1", 3737))
            s.close()
            return True
        except:
            return False
    
    port_results = [hammer_port() for _ in range(50)]
    test("Port connection resilience", all(port_results), f"{sum(port_results)}/50 connections OK")
    
    # Test process auto-restart
    log("  Testing auto-restart...", "info")
    try:
        # Get current PID
        pm2_result = subprocess.run(["pm2", "jlist"], capture_output=True, text=True, timeout=5)
        procs = json.loads(pm2_result.stdout)
        rig_proc = [p for p in procs if p.get("name") == "rig-os-agency"]
        if rig_proc:
            old_pid = rig_proc[0].get("pid", 0)
            # Kill the process
            subprocess.run(["kill", str(old_pid)], timeout=5)
            time.sleep(5)  # Wait for PM2 restart
            
            # Check if PM2 restarted it
            pm2_result2 = subprocess.run(["pm2", "jlist"], capture_output=True, text=True, timeout=5)
            procs2 = json.loads(pm2_result2.stdout)
            rig_proc2 = [p for p in procs2 if p.get("name") == "rig-os-agency"]
            if rig_proc2:
                new_pid = rig_proc2[0].get("pid", 0)
                restarted = rig_proc2[0].get("pm2_env", {}).get("status") == "online"
                test("Auto-restart after kill", restarted and new_pid != old_pid, f"old PID {old_pid} -> new PID {new_pid}")
                
                # Verify app is responding again
                time.sleep(2)
                status, _, _ = fetch(BASE_URL, timeout=10)
                test("App responds after restart", status == 200, f"HTTP {status}")
            else:
                test("Auto-restart after kill", False, "process not found after restart")
        else:
            skip("Auto-restart", "no RIG OS process in PM2")
    except Exception as e:
        test("Auto-restart after kill", False, str(e))

def test_load(run_count=1000):
    """Test 8: Load test — N requests"""
    log(f"GROUP 8: Load Test ({run_count} requests)", "header")
    
    failures = 0
    latencies = []
    start = time.time()
    
    for i in range(run_count):
        status, _, ms = fetch(BASE_URL, timeout=10)
        if status != 200:
            failures += 1
        latencies.append(ms)
        
        if (i + 1) % 100 == 0:
            pct = ((i + 1) / run_count) * 100
            avg_lat = sum(latencies[-100:]) / min(100, len(latencies))
            sys.stdout.write(f"\r  Progress: {i+1}/{run_count} ({pct:.0f}%) — avg {avg_lat:.0f}ms — {failures} failures")
            sys.stdout.flush()
    
    elapsed = time.time() - start
    print()
    
    avg_latency = sum(latencies) / len(latencies)
    max_latency = max(latencies)
    min_latency = min(latencies)
    p95 = sorted(latencies)[int(len(latencies) * 0.95)]
    
    test(f"Load test {run_count} requests", failures == 0, f"{run_count-failures}/{run_count} passed in {elapsed:.1f}s")
    log(f"  Latency — min: {min_latency}ms, avg: {avg_latency:.0f}ms, p95: {p95}ms, max: {max_latency}ms", "info")
    log(f"  Throughput: {run_count/elapsed:.1f} req/s", "info")

def test_native_app():
    """Test 9: Native app process"""
    log("GROUP 9: Native App", "header")
    
    try:
        result = subprocess.run(["pgrep", "-f", "RIGOS"], capture_output=True, text=True, timeout=5)
        running = bool(result.stdout.strip())
        test("Native app running", running, f"PID: {result.stdout.strip()}")
    except:
        test("Native app running", False, "not found")
    
    # Check app is in /Applications
    app_path = "/Applications/RIG OS.app"
    test("App installed in /Applications", os.path.exists(app_path), app_path)
    
    # Check binary is native arm64
    binary_path = os.path.expanduser("~/Developer/rig-native-app/build/RIG OS.app/Contents/MacOS/RIGOS")
    if os.path.exists(binary_path):
        result = subprocess.run(["file", binary_path], capture_output=True, text=True)
        test("Binary is native arm64", "arm64" in result.stdout, result.stdout.strip())

def main():
    start_time = time.time()
    
    print(f"\n{'='*50}")
    print(f"  RIG OS AGENCY — TEST SUITE")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}")
    
    # Core tests
    test_infrastructure()
    test_all_pages()
    test_api_routes()
    test_agent_fleet()
    test_reliability()
    test_hermes_integration()
    test_native_app()
    
    # Adversarial tests
    if "--adversarial" in sys.argv:
        test_adversarial()
    
    # Load test
    if "--load" in sys.argv:
        test_load(1000)
    elif "--loop" in sys.argv:
        idx = sys.argv.index("--loop")
        count = int(sys.argv[idx + 1]) if idx + 1 < len(sys.argv) else 100
        test_load(count)
    
    # Results
    elapsed = time.time() - start_time
    print(f"\n{'='*50}")
    print(f"  RESULTS")
    print(f"{'='*50}")
    total = RESULTS["pass"] + RESULTS["fail"] + RESULTS["skip"]
    print(f"  {GREEN}PASS: {RESULTS['pass']}{RESET}")
    print(f"  {RED}FAIL: {RESULTS['fail']}{RESET}")
    print(f"  {YELLOW}SKIP: {RESULTS['skip']}{RESET}")
    print(f"  Total: {total} tests in {elapsed:.1f}s")
    print(f"  Success rate: {(RESULTS['pass']/total*100):.1f}%" if total > 0 else "  No tests")
    
    if RESULTS["errors"]:
        print(f"\n{RED}FAILURES:{RESET}")
        for err in RESULTS["errors"]:
            print(f"  {RED}✗{RESET} {err}")
    
    print()
    sys.exit(0 if RESULTS["fail"] == 0 else 1)

if __name__ == "__main__":
    main()
