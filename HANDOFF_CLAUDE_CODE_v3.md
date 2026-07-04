# RIG OS Agency — Claude Code Handoff v3.1

**Repo**: https://github.com/RIGIntelligence/rig-os-agency  
**Branch**: `main` @ `f75acc4`  
**Status**: Pushed and running locally on port 3737

## What's Real Now

1. **3D Lattice Runtime with Persistence**
   - File: `src/lib/lattice.ts`
   - Missions are written atomically to `data/lattice-missions.json`
   - `initLattice()` loads state on every API call
   - `approveMission()` resumes blocked A4 cells by `missionId`

2. **A1/A2/A3/A4 Execution**
   - File: `src/app/api/lattice/execute/route.ts`
   - A1 handlers: `sum`, `health-check`, `deal-weighted-value`
   - A2 handlers: `summarize`, `score-deal` (currently deterministic mocks)
   - A3 handlers: `research-agent`, `pipeline-agent` (tool allowlist enforced)
   - A4 handlers: `strategic-decision` (approval required)

3. **AgentForge Workflow Gates**
   - File: `src/lib/agentforge.ts`
   - Every action via `/api/action` now runs gates:
     - intent-lock
     - bms-mode
     - source-required
     - approval-gate
     - proof-required (optional)
     - anti-generic (threshold 80)
     - physics-breach
   - Read actions pass with A1. External/destructive/payment actions require A3+, approval, and source URIs.

4. **A4 Approval UI**
   - File: `src/components/LatticeHUD.tsx`
   - Clicking `L4-D3-A4-I2` blocks and shows an "Approve / Deny" dialog
   - Approving re-runs the cell with the same `missionId`

## Verified Behaviors

- A4 without approval → `status: blocked`, `verdict: NO-GO`
- A4 with approval → second packet appended, `verdict: GO`
- A3 without tools → blocked
- A3 with tools → `status: done`, `verdict: GO`
- `/api/action` read → passes, executes
- `/api/action` destructive without approval → 403 blocked with gate breakdown
- `/api/action` external without sources → blocked with "No Source No Number"
- Mission state persists to disk and survives restarts

## What's Still Mocked

- A2 currently returns deterministic summaries, not real LLM calls
- Invoice scope returns an honest message about needing Stripe
- Some client/deal action fallbacks use mock data

## Next Safe Actions

1. Wire A2 handlers to `/api/local/chat` (Ollama) or `/api/models/router` for real bounded LLM output
2. Add a real Stripe handler for invoice actions
3. Add A4 approval hooks to action pages (client delete, deal cancel, external sends)
4. Add cleanup policy to `data/lattice-missions.json` (retention window)

## Test Commands

```bash
cd ~/Developer/rig-os-agency
curl -s http://127.0.0.1:3737/api/lattice | python3 -m json.tool

curl -s -X POST http://127.0.0.1:3737/api/lattice/execute \
  -H "Content-Type: application/json" \
  -d '{"coordinate":"L3-D1-A3-S","intent":"research","handler":"research-agent","context":{"topic":"AI OS","tools":["web","terminal"]}}' | python3 -m json.tool

curl -s -X POST http://127.0.0.1:3737/api/action \
  -H "Content-Type: application/json" \
  -d '{"scope":"agent","action":"logs","id":"jarvis","meta":{"intent":"read agent logs","bmsMode":"A1"}}' | python3 -m json.tool
```
