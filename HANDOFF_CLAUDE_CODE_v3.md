# RIG OS Agency — Claude Code Handoff v3.0

**Repo**: https://github.com/RIGIntelligence/rig-os-agency  
**Branch**: `main` @ `43b1ce4`  
**Status**: Pushed, operational, native Mac app running  
**Date**: 2026-07-04  
**Handoff from**: Hermes (Jake RIG Agent) → Claude Code  

---

## 1. WHAT JUST SHIPPED IN V3.0

### Direct prop passing (no more event bus)
- `Shell.tsx` now owns `copilotPrompt`/`terminalCommand` state.
- `CopilotDrawer` accepts `initialPrompt` prop.
- `TerminalPanel` accepts `initialCommand` prop.
- `DetailContext` exposes `openCopilot(prompt)` and `openTerminal(command)`.
- All action pages call context methods directly instead of `window.dispatchEvent`.

### Full L4 detail pages
- `/agency/pipeline/deals/[id]` — deal properties, AI score via A2 lattice, action links
- `/agency/clients/[id]` — client properties, services, notes, action links
- `/agency/agents/[id]` — agent capabilities, invocation path, action links
- `/paperclip/tasks/[id]` — task properties, priority/status, action links
- `/agency/revenue/invoices/[id]` — invoice properties, Stripe-honest warning, action links

### RIG 3D Lattice Runtime (the big one)
Every piece of work in the app can now be tagged with a coordinate and executed by mode.

**Files:**
- `src/lib/lattice.ts` — coordinate parser, mission store, proof packets, registry
- `src/lib/lattice-handlers.ts` — A1/A2/A3/A4 handler implementations
- `src/lib/lattice-init.ts` — ensures handlers register at runtime
- `src/app/api/lattice/route.ts` — mission CRUD + packet sealing
- `src/app/api/lattice/execute/route.ts` — coordinate execution engine
- `src/app/api/lattice/registry/route.ts` — available cells
- `src/components/LatticeHUD.tsx` — live lattice panel on home page

**Coordinate format:** `L{level}-D{diamond}-A{mode}-{step}`
- Level: 1-7
- Diamond: 1 Physical, 2 Cognitive, 3 Nature
- Mode: 1 A1, 2 A2, 3 A3, 4 A4
- Step: I1, Q1, R, S, Q2, P, I2 (IQRSQPI)

**Modes implemented:**
- **A1** — deterministic functions: `health-check`, `sum`, `deal-weighted-value`
- **A2** — bounded LLM with forced JSON schema: `summarize`, `score-deal`
- **A3** — governed agent workflow with tool allowlist: `research-agent`, `pipeline-agent`
- **A4** — strategic reasoning requiring explicit `approved: true`: `strategic-decision`

### Verified working
```bash
curl -s -X POST http://127.0.0.1:3737/api/lattice/execute \
  -H "Content-Type: application/json" \
  -d '{"coordinate":"L3-D2-A2-R","intent":"Score deal","handler":"score-deal","context":{"deal":{"stage":"proposal"}}}'
# Returns mission with GO verdict
```

---

## 2. ARCHITECTURE

```
UI (L1-L4 pages, LatticeHUD, DetailPanel)
  ↓ fetch
API Routes (/api/lattice/*, /api/action, /api/*)
  ↓ call
Lattice Runtime (src/lib/lattice.ts + handlers)
  ↓ execute
A1 function | A2 JSON LLM | A3 agent workflow | A4 strategic approval
```

---

## 3. RUN COMMANDS

```bash
cd ~/Developer/rig-os-agency
npm run build
pm2 restart rig-os-agency

# Native app
cd ~/Developer/rig-native-app && ./build.sh
cp -R build/"RIG OS.app" /Applications/
open /Applications/"RIG OS.app"
```

### Verify
```bash
# L4 detail pages
for route in agency/pipeline/deals/d-001 agency/clients/c001 agency/agents/hermes paperclip/tasks/1 agency/revenue/invoices/1; do
  curl -s -o /dev/null -w "/$route: %{http_code}\n" http://127.0.0.1:3737/$route
done

# Lattice APIs
curl -s http://127.0.0.1:3737/api/lattice/registry | python3 -m json.tool
curl -s -X POST http://127.0.0.1:3737/api/lattice/execute \
  -H "Content-Type: application/json" \
  -d '{"coordinate":"L1-D1-A1-I1","intent":"health","handler":"health-check","context":{}}'
```

---

## 4. DESIGN SYSTEM

Same as v2.0. See `src/app/rig-light-theme.css`.

---

## 5. NEXT SAFE ACTIONS FOR CLAUDE CODE

### 1. Persist missions and proof packets
Currently in-memory. Move to SQLite/JSON in `data/lattice-missions.json` so they survive restart.

### 2. Auto-tag every app action with a lattice coordinate
Every button click, every API call, every task/deal/client mutation should emit a coordinate. Example:
- "Mark task complete" → `L2-D1-A1-I2`
- "Generate proposal" → `L3-D2-A2-S`
- "Run agent" → `L4-D1-A3-I2`
- "Strategic decision" → `L7-D3-A4-I2` (requires approval)

### 3. Build the mission log page
`/agency/lattice` or `/lattice` — show all missions, coordinates, proof packets, verdicts.

### 4. Add approval UI for A4
When an action maps to A4, show an approval modal. Only proceed when Mike confirms.

### 5. Implement real A2 LLM calls
Currently A2 handlers are mocked. Wire them to `/api/local/chat` (Ornith) with JSON schema enforcement and Pydantic-style validation.

### 6. Add more A1 handlers
- `calculate-mrr`
- `stage-weight`
- `client-health-score`
- `task-priority-sort`

### 7. Add A3 tool executor
A3 handlers should actually call allowed tools (e.g., if `api-write` is allowed, call the API; if `terminal` allowed, run terminal command). Build a tool dispatcher.

### 8. Anti-Generic and deviation engines
Add a scoring endpoint `/api/deviation/score` that runs the 40 deviation engines on any artifact. Wire it into the proof packet as a gate.

### 9. Expand lattice to studios
Apply coordinates to LinkedIn, Instagram, GTM, Strategy, Engineering, Design actions.

### 10. Build the global ⌘K palette
Command palette that can:
- Jump to any page
- Trigger any lattice cell
- Show recent missions
- Open any agent

---

## 6. QUALITY BAR

Before any PR or handoff claim:
- [ ] `npm run build` passes.
- [ ] L4 detail pages return 200.
- [ ] Lattice execute returns `GO` for A1/A2/A3 (with tools)/A4 (with approved).
- [ ] No `window.dispatchEvent` for Copilot/Terminal anywhere.
- [ ] No raw secrets.
- [ ] Light theme tokens used.

---

## 7. CONTEXT

- **Mike's context**: RIGIntelligence, $10M ARR goal, Truth Gate.
- **Do not**: bulk-publish, send DMs, present mock as real.
- **Do**: tag every meaningful action with a lattice coordinate and produce proof.

---

End of handoff v3.0. Start with Section 5, item 1 (persist missions).
