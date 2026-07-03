# RIG OS AGENCY — 1000X BUILD-OUT PLAN
## Goal: Make this the daily driver that runs the entire business

Date: 2026-07-03
Target: $10M ARR agency operations platform

---

## WHAT EXISTS (Current 10%)
- Next.js 16 app, 46 pages, 177 API routes
- Electron desktop wrapper (RIG Agent OS.app)
- 217 Agency Agents cataloged
- 172 VoltAgent Codex subagents
- 9 Jake PAI squads (deterministic)
- Paperclip on :3100
- Live pages: Command Center, Agency Dashboard, Agent Roster, Pipeline, Stripe, Orchestration

---

## PHASE 1: RELIABILITY (TODAY — must ship first)
**Goal: Never go down. Auto-start, auto-restart, crash-proof.**

1.1 PM2 process manager for RIG OS Agency
    - Auto-start on boot via launchd
    - Auto-restart on crash (max 10 restarts/minute)
    - Health check endpoint
    - Port conflict resolution

1.2 Launchd plist for PM2 + Paperclip auto-start
    - Boots with macOS, no manual intervention
    - Survives reboots, updates, crashes

1.3 Electron desktop app points to localhost:3733 (stable port)
    - Not dependent on Hermes gateway
    - Independent of terminal sessions

1.4 Dashboard health monitoring
    - /api/health returns system status
    - Agent dispatch readiness
    - Fleet connectivity check

---

## PHASE 2: AGENT INTEGRATION (TODAY)
**Goal: All agents live and dispatchable from the dashboard.**

2.1 Agent Registry API
    - Merge 217 Agency + 172 VoltAgent + 9 Jake squads + 86 Susan = ~484 agents
    - Unified /api/agents endpoint with categories, status, invocation paths
    - Real-time status (available, busy, error)

2.2 Agent Dispatch Console
    - Click any agent to see its spec, capabilities, invocation
    - One-click deploy to Hermes/Codex/Claude
    - Agent search with category filters

2.3 Orchestration Page (upgrade existing)
    - 20-agent parallel team with live status
    - Real Modal/Hermes Swarm integration
    - Task queue with progress tracking

---

## PHASE 3: BUSINESS OPERATIONS (THIS WEEK)
**Goal: Real business data flowing through every page.**

3.1 Command Center — live briefing
    - Pull from Hermes gateway API (:8642)
    - Show: today's sessions, telegram messages, cron jobs, agent status
    - Revenue ticker from Stripe
    - Pipeline snapshot

3.2 Pipeline — real CRM data
    - Connect to Twenty CRM / local data
    - Kanban view with drag-and-drop stages
    - Lead scores from RIG scoring engine

3.3 Revenue — live Stripe data
    - MRR, ARR, recent charges, churn
    - Invoice generation
    - Client portal links

3.4 Daily Briefing — auto-generated
    - 7AM briefing via Telegram (Jarvis style)
    - Pulls from: calendar, email, pipeline, revenue, agent activity
    - Cron job generates and sends

---

## PHASE 4: COMMUNICATIONS HUB (THIS WEEK)
**Goal: All comms flow through RIG OS Agency.**

4.1 Telegram integration
    - Live message feed from gateway
    - Send/receive from dashboard
    - Bot command palette

4.2 Email integration
    - Gmail API connection (rodgemd1)
    - Thread view, outreach tracking
    - Auto-follow-up scheduling

4.3 LinkedIn integration
    - Post scheduling, DM management
    - Content calendar
    - Analytics

---

## PHASE 5: AUTONOMY ENGINE (NEXT WEEK)
**Goal: Agents that work while you sleep.**

5.1 Cron Job Manager
    - Visual cron scheduling from dashboard
    - All 50 existing jobs visible and editable
    - Kill switch per job
    - Output history per run

5.2 Goal Loop Launcher
    - All 50 goal loops launchable from UI
    - Progress tracking per loop
    - ProofPacket viewer

5.3 Fleet Manager
    - All machines visible (Mac Studios, QNAP)
    - SSH status, resource usage
    - Model routing configuration

---

## PHASE 6: CLIENT-FACING (WEEK 3-4)
**Goal: Clients see their intelligence in real-time.**

6.1 Client Portals
    - Per-client branded dashboard
    - Intelligence reports, signals, tracked companies
    - Invoice and contract access

6.2 Proposals & Contracts
    - Template engine
    - E-signature integration
    - Revenue recognition

---

## EXECUTION ORDER FOR TODAY

```
Step 1: Set up PM2 + launchd for reliability          [30 min]
Step 2: Wire agent registry API (merge all catalogs)  [45 min]
Step 3: Upgrade Agent Roster page with live data      [30 min]
Step 4: Connect Command Center to Hermes API          [30 min]
Step 5: Upgrade Orchestration page                    [30 min]
Step 6: Test end-to-end from Electron app             [15 min]
```

## KEY ARCHITECTURE DECISION

RIG OS Agency (Next.js :3737) is the PRIMARY interface.
Hermes Desktop is the CHAT CLIENT only.
Electron wraps the Next.js app for desktop experience.

```
[Mike] → [RIG Agent OS.app (Electron)] → [RIG OS Agency :3737]
                                                    ↓
                                    ┌───────────────┼───────────────┐
                                    ↓               ↓               ↓
                              [Hermes API]   [Agent Registry]  [Stripe API]
                              [:8642]        [484 agents]      [Live $]
                                    ↓               ↓               ↓
                              [Telegram]     [Codex/Claude]    [CRM Data]
                              [Cron Jobs]    [Hermes Swarm]    [Pipeline]
```
