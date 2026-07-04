# RIG OS Agency — Claude Code Handoff v2.0

**Repo**: https://github.com/RIGIntelligence/rig-os-agency  
**Branch**: `main` @ `195eca2`  
**Status**: Pushed, operational, native Mac app running  
**Date**: 2026-07-03  
**Handoff from**: Hermes (Jake RIG Agent) → Claude Code  

---

## 1. WHAT JUST SHIPPED IN V2.0

Full **5-layer deep navigation** across the core business departments. Every sidebar item now expands into sub-sections, list pages, detail views, and action execution pages that produce real results.

### Architecture of depth
```
L1: Department landing page (dashboard/summary)
L2: Function cards (e.g., Invoices, Charges, Customers, Subscriptions)
L3: List/table page with real API data
L4: Item detail (currently surfaced via DetailPanel; full detail pages to come)
L5: Actions page — executes real operations
```

### Departments with 5-layer depth
- **Revenue** → Invoices, Charges, Customers, Subscriptions, Failed Payments, Revenue Command
- **Pipeline** → Deals, Forecast, Proposals, Activities
- **Clients** → Active, Prospects
- **Agents** → Catalog, Departments, Assignments
- **Paperclip** → Inbox, Today, Upcoming, Projects

### New shared components
- `src/components/PageBreadcrumbs.tsx` — consistent L1→L2→L3 navigation
- `src/components/DepartmentUI.tsx` — StatCard, SubsectionCard, PageHeader, EmptyState, LoadingRows
- `src/components/DataTable.tsx` — reusable dense table with loading, empty, click handlers

### New API
- `src/app/api/action/route.ts` — generic action executor
  - `scope: task` → complete, delegate, note
  - `scope: deal` → forwards to `/api/agency/pipeline-deals`
  - `scope: client` → proposal, email (mailto), meeting (calendar), note, renew
  - `scope: agent` → assign task, run now (opens Copilot), configure, logs
  - `scope: invoice` → honest Stripe-not-connected message

### Real vs honest mock results
- ✅ **Task complete/delegate/note** — updates `data/paperclip-tasks.json`
- ✅ **Deal advance/close won/close lost** — updates in-memory pipeline store
- ✅ **Client proposal** — opens Jake Copilot with client context
- ✅ **Client email** — opens `mailto:` link
- ✅ **Client meeting** — opens Google Calendar
- ✅ **Agent run/assign** — opens Jake Copilot with agent context
- ✅ **Agent logs** — returns simulated logs
- ⚠️ **Invoice send/pay/void/refund** — returns honest message: "Stripe not connected"

---

## 2. RUN COMMANDS

```bash
cd ~/Developer/rig-os-agency
npm run build          # ~3 min
pm2 restart rig-os-agency

# Native app
cd ~/Developer/rig-native-app && ./build.sh
cp -R build/"RIG OS.app" /Applications/
open /Applications/"RIG OS.app"
```

### Verify
```bash
# 14 key pages + new deep routes
for route in \
  "" paperclip paperclip/inbox/list paperclip/tasks/abc/actions \
  agency/revenue agency/revenue/invoices/list agency/revenue/invoices/abc/actions \
  agency/pipeline agency/pipeline/deals/list agency/pipeline/deals/abc/actions \
  agency/clients agency/clients/active/list agency/clients/abc/actions \
  agency/agents agency/agents/catalog/list agency/agents/abc/actions \
; do
  curl -s -o /dev/null -w "/$route: %{http_code}\n" http://127.0.0.1:3737/$route
done
```

### Test action API
```bash
curl -s -X POST http://127.0.0.1:3737/api/action \
  -H "Content-Type: application/json" \
  -d '{"scope":"agent","action":"logs","id":"hermes"}'

# Advance a deal stage (requires real deal id)
curl -s -X POST http://127.0.0.1:3737/api/action \
  -H "Content-Type: application/json" \
  -d '{"scope":"deal","action":"move","id":"d-001","payload":{"stage":"negotiation"}}'
```

---

## 3. DESIGN SYSTEM — DO NOT BREAK

Same as v1.0: see `src/app/rig-light-theme.css`.

New rule: **all list pages use `DataTable`**. No ad-hoc tables.

---

## 4. HOW TO EXTEND DEPTH

Use `scripts/generate-deep-pages.js` to scaffold more list + action pages, then customize.

Example: add "Contracts" depth under Clients.
1. Run the generator pattern or manually create:
   - `src/app/agency/clients/contracts/list/page.tsx` (uses DataTable)
   - `src/app/agency/clients/contracts/[id]/actions/page.tsx` (uses action executor)
2. Add to `src/components/Sidebar.tsx` under Clients children.
3. Add API endpoints in `src/app/api/agency/clients/contracts/`.
4. Wire into `/api/action` if it needs execution.

---

## 5. NEXT SAFE ACTIONS FOR CLAUDE CODE

### 1. Replace event bus hack with direct prop passing (v1 carryover)
Files: `Shell.tsx`, `CopilotDrawer.tsx`, `TerminalPanel.tsx`, `DetailPanel.tsx`  
Goal: pass `initialPrompt` to Copilot and `initialCommand` to Terminal directly, no `window.dispatchEvent`.

### 2. Create real detail pages at L4
Currently L4 is the slide-in DetailPanel. Build full-page detail views:
- `src/app/agency/revenue/invoices/[id]/page.tsx`
- `src/app/agency/pipeline/deals/[id]/page.tsx`
- `src/app/agency/clients/[id]/page.tsx`
- `src/app/agency/agents/[id]/page.tsx`
- `src/app/paperclip/tasks/[id]/page.tsx`
Each shows full properties, history, and an "Actions" link to L5.

### 3. Make action pages update UI state properly
After an action succeeds, refresh the source list. Add `mutate()` or re-fetch pattern.

### 4. Add real creation flows
- New Invoice → form → POST `/api/agency/invoices`
- New Deal → form → POST `/api/agency/pipeline-deals`
- New Client → form → POST `/api/agency/clients`
- New Task → form → POST `/api/paperclip/tasks`

### 5. Persist data beyond in-memory
Pipeline deals currently live in memory. Move to JSON or SQLite so stage changes survive restart. Already started with `data/paperclip-tasks.json` and `data/clients.json` pattern.

### 6. Add search + filters to every list page
Use the existing filter UI pattern from Paperclip. Add `?search=` and `?status=` query params to APIs.

### 7. Add notifications for action results
When an action completes, show a toast/notification and update badge counts.

### 8. Wire Stripe for real invoice actions
When `STRIPE_SECRET_KEY` is present, invoice actions should call Stripe API. When absent, keep the honest message.

### 9. Expand to Growth and System sections
Apply the same 5-layer pattern to:
- `/rig-gtm` → Campaigns, Audiences, Offers, Experiments, Analytics
- `/rig-linkedin` → Posts, Schedule, DMs, Analytics
- `/rig-instagram` → Reels, Stories, Schedule, Analytics
- `/memory`, `/obsidian`, `/orchestration`

### 10. Build the global ⌘K command palette
A search surface that jumps to any page, opens any agent, or triggers any action.

---

## 6. QUALITY BAR

Before any PR or handoff claim:
- [ ] `npm run build` passes with no errors.
- [ ] 25+ key routes return 200 (use the verify loop above).
- [ ] Native app launches and shows the page.
- [ ] Every list row is clickable and navigates to detail or actions.
- [ ] Every action button calls `/api/action` or a real API.
- [ ] No raw secrets in code.
- [ ] Mock/limited integrations are honestly flagged in UI and API response.
- [ ] Light theme tokens used consistently.

---

## 7. CONTEXT REMINDERS

- **Mike's context**: RIGIntelligence, $10M ARR goal, 8 verticals, partner James, Truth Gate.
- **Do not**: bulk-publish LinkedIn, send DMs without explicit approval, present mock data as real.
- **Do**: produce evidence for every claim, run builds, verify routes, commit often.

---

End of handoff v2.0. Start with Section 5, item 1 (replace event bus hack).
