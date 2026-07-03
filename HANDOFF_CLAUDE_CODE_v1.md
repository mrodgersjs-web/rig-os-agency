# RIG OS Agency — Claude Code Handoff v1.0

**Repo**: https://github.com/RIGIntelligence/rig-os-agency  
**Branch**: `main` @ `fbb9f4a`  
**Status**: Pushed, operational, native Mac app running  
**Date**: 2026-07-03  
**Handoff from**: Hermes (Jake RIG Agent) → Claude Code  

---

## 1. WHAT JUST SHIPPED

A complete visual + interaction redesign of RIG OS Agency, preserving all v1 capabilities while making it feel like a compact, high-density business application modeled on Apollo.io and Airwallex (Mobbin references).

### Files changed (16)
- `src/app/page.tsx` — Home command center, fully clickable
- `src/app/paperclip/page.tsx` — Notion-style task workspace with board/list/detail views
- `src/app/agency/revenue/page.tsx` — Stripe-connected revenue dashboard (honest mock/real states)
- `src/app/agency/briefing/page.tsx` — Jake daily briefing with system status
- `src/components/Shell.tsx` — App shell with global detail panel provider
- `src/components/Sidebar.tsx` — Compact 220px sidebar with workspace switcher + MRR card
- `src/components/TopBar.tsx` — Thin 48px Apollo-style bar with breadcrumb + actions
- `src/components/DetailPanel.tsx` — NEW: universal right-slide deep-dive panel
- `src/components/DetailContext.tsx` — NEW: global context for opening detail panels
- `src/app/rig-light-theme.css` — NEW: design token system (light theme)
- `src/app/globals.css` — imports light theme
- `src/app/api/paperclip/tasks/route.ts` — JSON fallback when SQLite unavailable
- `src/app/linkedin-post-manager/page.tsx` — fixed SSR "use client" issue
- `src/app/agency/pipeline-kanban/page.tsx` — already rebuilt earlier in session
- `src/app/api/agency/pipeline-deals/route.ts` — deal CRUD API
- `src/app/api/linkedin/image-checker/route.ts` — LinkedIn image enforcement API

### Operational verification
```
Native app:     PID live, window on screen
Server:         PM2 online, :3737 responding 200
Pages:          14/14 key pages return 200
Terminal API:   working
Hermes:         v0.18.0 ok
Telegram:       connected
Paperclip:      5 inbox, 8 today, 5 activity items
Agent fleet:    410 agents ready
```

---

## 2. ARCHITECTURE (preserve this)

```
┌─────────────────────────────────────────────┐
│  Native Mac App (Swift + WKWebView)         │
│  → loads http://127.0.0.1:3737              │
│  → /Applications/RIG OS.app                  │
├─────────────────────────────────────────────┤
│  Next.js 16 + Turbopack + React + Tailwind   │
│  → PM2 managed process "rig-os-agency"      │
│  → SQLite via better-sqlite3 (optional)     │
│  → 74 pages, 180+ API routes                │
├─────────────────────────────────────────────┤
│  Hermes Gateway :8642                        │
│  → skills, MCPs, model routing             │
├─────────────────────────────────────────────┤
│  Local Models (Ollama :11434)                │
│  → Ornith:35B, GLM-5.2, coder models        │
├─────────────────────────────────────────────┤
│  Telegram bot (Jarvis 7AM briefing)        │
└─────────────────────────────────────────────┘
```

### Key routes
- `/` — Home command center
- `/paperclip` — Task/workspace OS
- `/agency/revenue` — Stripe revenue
- `/agency/briefing` — Jake daily briefing
- `/agency/pipeline` / `/agency/pipeline-kanban` — Deal pipeline
- `/agency/agents` — Agent fleet browser
- `/agency/clients`, `/agency/proposals`, `/agency/contracts` — CRM surfaces
- `/rig-linkedin`, `/rig-instagram`, `/rig-gtm`, `/rig-strategy` — Studio surfaces

### Run commands
```bash
cd ~/Developer/rig-os-agency
npm install          # if needed
npm run build        # production build (~3 min)
pm2 restart rig-os-agency

# Native app
cd ~/Developer/rig-native-app && ./build.sh
cp -R build/"RIG OS.app" /Applications/
open /Applications/"RIG OS.app"

# Verify
curl http://127.0.0.1:3737/api/health | python3 -m json.tool
pm2 logs rig-os-agency --lines 50
```

---

## 3. DESIGN SYSTEM — DO NOT BREAK

File: `src/app/rig-light-theme.css`

Core tokens:
- `--rig-bg: #FAFAF8` — warm off-white
- `--rig-sidebar: #F4F2EE` — warm light gray
- `--rig-card: #FFFFFF` — pure white cards
- `--rig-border: #E8E5DF` — warm border
- `--rig-text: #2D2438` — RIG deep purple text
- `--rig-text-2: #4A4356` — secondary text
- `--rig-text-3: #6B6478` — tertiary text
- `--rig-text-mute: #9B94A8` — muted labels
- `--rig-gold: #C4904A` — primary action
- `--rig-emerald: #4A9D7E` — success/positive
- `--rig-red: #D93A3A` — critical/negative
- `--rig-orange: #D97706` — high priority
- `--rig-blue: #4A7C9B` — info/LinkedIn
- `--rig-purple: #7C6F8B` — agents
- `--rig-plum: #B85675` — Instagram/strategy

Design rules:
1. **Light theme only** — no dark mode variants.
2. **Compact density** — 12–14px text, 10px labels, tight padding.
3. **Cards are white** with subtle borders, 8px radius.
4. **Sidebar is 220px** — never wider.
5. **Top bar is 48px** — breadcrumb + actions only.
6. **Tables are primary** for data-dense views (Apollo pattern).
7. **Detail panels slide from right** (420px) for every clickable item.
8. **Use the `useDetail()` hook** to open deep-dive panels from any page.

---

## 4. THE DETAIL PANEL SYSTEM — USE THIS EVERYWHERE

`src/components/DetailPanel.tsx` + `src/components/DetailContext.tsx`

### How to open a detail panel from any page
```tsx
import { useDetail } from "@/components/DetailContext";

const { openDetail } = useDetail();

openDetail({
  id: "task-123",
  type: "task",        // task | email | deal | agent | client | revenue | system | department | briefing
  title: "Review NeuralSoft proposal",
  description: "$85K deal, needs proposal by Friday",
  priority: "high",
  status: "pending",
  assignee: "Jake",
  due: "2026-07-06",
  tags: ["deals", "proposals"],
  source: "Paperclip",
  data: { /* raw object for inspector */ },
});
```

### Available type-specific actions
- `task` — Mark done, Ask Jake, Run in terminal
- `email` — Reply, Draft reply with Jake
- `deal` — Move stage, Generate proposal
- `agent` — Assign work to this agent
- `system` / `department` / `briefing` — Inspect raw data

### Event bus for global actions
The DetailPanel dispatches:
- `window.dispatchEvent(new CustomEvent("open-copilot", { detail: prompt }))`
- `window.dispatchEvent(new CustomEvent("run-terminal", { detail: command }))`

Shell listens and opens Copilot/Terminal. **In future, pass prompt/command directly into the components instead of events.**

---

## 5. THE 50 QUESTIONS → BUILD DECISIONS

These 50 questions from Mike are the product spec. Do not treat them as a checklist. Group them by free energy and build the high-leverage clusters first.

### Tier 1 — Build first (highest free energy reduction)
1. **One graph + ProofPacket provenance** → answers Q2, Q25, Q47, Q48 with one primitive.
   - Every number in the UI must trace to a source (Stripe, DB, manual, mock).
   - Add a `source` field and `proof` link to every DetailItem.
   - Render source badge in DetailPanel.

2. **Jake as conductor consuming mission packets** → answers Q1, Q7.
   - A "mission packet" is: `{ intent, scope, constraints, evidence_required }`.
   - Jake emits an "evidence packet" before marking done.
   - No multi-step work without a Verifier gate.

3. **Approval surface (phone/Telegram + in-app)** → answers Q4, Q13.
   - External sends/publishes/spends always require Mike approval.
   - Studio heads can **draft and queue**, not autonomously ship.
   - Build an `/agency/approvals` page and Telegram approval flow.

4. **Operator Cockpit L1 home + ⌘K + Kanban** → answers Q5, Q6, Q12, Q26.
   - ⌘K command palette routes to any page/action/agent.
   - Kanban drag-and-drop persists to `/api/paperclip/tasks`.
   - Home page already does L1 "what matters now."

### Tier 2 — Build next (compound value)
5. **Calendar + notifications** → Q16, Q17.
   - One calendar view: deadlines, meetings, content schedule.
   - Notification center for failed payments, hot leads, agent errors.

6. **Knowledge base / memory lattice surfaced as settings** → Q18, Q24.
   - Settings page for agent personalities, model routing, API keys.
   - Memory is not vibes; it logs `(x, y, E, outcome)` and recalibrates.

7. **Document editor (Notion blocks)** → Q21.
   - Inline block editor for proposals, strategies, briefings.
   - Every document is a task/deal/client attachment.

8. **Comments + files** → Q22, Q23.
   - Comment threads on every task, deal, document.
   - File/media manager for images, videos, generated content.

### Tier 3 — Enrich later
9. Time tracking → Q20
10. Client portal → Q10, Q19
11. Offline mode → Q11 (degraded, with honest Verifier warning)
12. Predictive next-action → Q42, Q45, Q49
13. Weekly/monthly reports → Q14, Q15

### Hard doctrine gates
- **Q48 (real vs mock data)** — must be a first-class UI flag, never faked.
- **Q50 (walk away for a week)** — the ultimate product test; requires always-on runtime + Verifier.
- **Anti-Generic Force ≥ 80** — every shipped screen must not feel like a generic AI dashboard.
- **No agent reviews its own output** — Q44 requires GEV separation.

---

## 6. CLAUDE CODE — HOW TO WORK ON THIS

### Before you write code
1. Read `src/app/rig-light-theme.css` and memorize the tokens.
2. Read `src/components/DetailPanel.tsx` and `DetailContext.tsx`.
3. Run `npm run build` and confirm no errors.
4. Check `curl http://127.0.0.1:3737/api/health`.

### Adding a new page
1. Create `src/app/<route>/page.tsx` with `"use client"` if it has hooks/state.
2. Use the color constants from `rig-light-theme.css` via `var(--rig-*)`.
3. Make data items clickable via `useDetail()`.
4. Keep layout compact: full-width content, small stat cards, tables over cards.
5. Add to `Sidebar.tsx` navigation if it should be permanent.

### Adding an API route
1. Create `src/app/api/<route>/route.ts`.
2. Use `runtime = "nodejs"` and `dynamic = "force-dynamic"` if needed.
3. If SQLite is risky, add a JSON fallback like `/api/paperclip/tasks`.
4. Return honest mock/real flags where applicable.

### Modifying Copilot/Terminal
- Copilot: `src/components/CopilotDrawer.tsx` — add `jake` persona, accept `initialPrompt` prop.
- Terminal: `src/components/TerminalPanel.tsx` — accept `initialCommand` prop, remove event bus hack.

### Testing before claiming done
```bash
cd ~/Developer/rig-os-agency
npm run build
pm2 restart rig-os-agency
# Verify
for page in "" paperclip agency agency/revenue agency/briefing agency/agents; do
  curl -s -o /dev/null -w "/$page: %{http_code}\n" http://127.0.0.1:3737/$page
done
```

### Secrets / credentials
- Never commit raw secrets.
- Use `~/.hermes/.env` or `~/.jake-vault/` for OAuth/API keys.
- Google OAuth secrets were just scrubbed from history — do not re-introduce them in plaintext scripts.

---

## 7. NEXT SAFE ACTIONS (prioritized)

Do these in order. Each produces evidence.

### 1. Fix the Copilot/Terminal event bus hack
Replace `window.dispatchEvent` in `DetailPanel.tsx` with direct prop passing through `Shell`.
- Add `initialPrompt` to `CopilotDrawer`.
- Add `initialCommand` to `TerminalPanel`.
- Store prompt/command in `Shell` state and pass down.

### 2. Wire real task actions
DetailPanel task actions currently dispatch events. Make them real:
- "Mark done" → PATCH `/api/paperclip/tasks/[id]`.
- "Ask Jake" → open Copilot with task context.
- "Run in terminal" → open Terminal with a relevant command.

### 3. Add ⌘K command palette
Build a global command palette (⌘K) in `TopBar` or `Shell`.
- Search pages, agents, tasks, deals.
- Execute quick actions: "Create task", "Open revenue", "Ask Jake".

### 4. Make Paperclip drag-and-drop persist
The board view in `/paperclip` has columns but may not persist moves. Verify and fix.
- PATCH task status on drop.
- Refresh task list after move.

### 5. Add data provenance to every number
Every stat, MRR, pipeline value, agent count must show source on click.
- Add `source`, `proofUrl`, `lastUpdated` to DetailItems.
- Render in DetailPanel properties.
- Honest mock/real badge.

### 6. Build `/agency/approvals` page
- List pending approvals: sends, publishes, deals over threshold, spend.
- Approve/reject with reason.
- Wire to Telegram bot for mobile approvals.

### 7. Add calendar + notifications
- Calendar page aggregating task due dates + meeting + content schedule.
- Notification bell in TopBar with unread count.

### 8. Document editor
- Block-based editor attached to tasks/deals/clients.
- Save to SQLite/JSON.

---

## 8. QUALITY BAR

Before any PR or handoff claim:
- [ ] `npm run build` passes with no errors.
- [ ] 14 key pages return 200.
- [ ] Native app launches and shows the page.
- [ ] All clickable items use `useDetail()` and open a panel.
- [ ] No raw secrets in code.
- [ ] Mock data is clearly flagged as mock.
- [ ] Light theme tokens used, no dark-theme drift.
- [ ] Anti-Generic Force ≥ 80 (does not look like a generic admin panel).

---

## 9. CONTACT / CONTEXT

- **Mike's context**: RIGIntelligence, $10M ARR goal, 8 verticals on LinkedIn, partner James, Truth Gate (no fabricated first-person stories or metrics).
- **Current app state**: Native Mac app running, PM2 server online, light theme redesign live, detail panels wired on home page.
- **What not to do**: Do not bulk-publish LinkedIn. Do not send DMs without explicit Mike approval. Do not present mock data as real.

---

End of handoff. Start with Section 7, item 1.
