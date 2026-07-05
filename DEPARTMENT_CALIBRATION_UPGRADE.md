# RIG OS Agency — 1000x Department Agent Upgrade

## What Was Built

### 1. Live Agent Registry API (`/api/agents/registry`)
- Replaces static TypeScript array with dynamic PAI database reader
- Returns real-time agent status, calibration scores, proof counts
- Supports filtering by department, kind, status
- Summary with averages and distributions

### 2. Department Calibration System (`src/lib/dept-calibration.ts`)
- **Substrate**: Identity, role, boundaries, load order for each department
- **Telos**: Outcome, success metrics, failure modes
- **Memory**: Good/weak examples, decisions, patterns from PAI database
- **Quality Gates**: 4 scored gates per department with check commands
- **Proof Path**: Artifact family, required fields, verification commands
- **Calibration Score**: Real-time scoring against quality gates

### 3. Memory Promotion System (`src/lib/memory-promotion.ts`)
- Scores artifacts against department quality gates
- Promotes to PAI database as good_example (≥75%), weak_example (<40%), or pattern
- Records calibration history for trending
- Tracks promotion source and metadata

### 4. Department Calibration API (`/api/departments/calibration`)
- GET: All department calibrations with summary
- GET?department=X: Specific department detail
- GET?action=memory&department=X: Memory summary
- GET?action=score&department=X&artifact=Y: Score an artifact

### 5. Worker Slot Activation API (`/api/departments/workers`)
- Lists all 41 worker slots with real-time status
- Shows calibration scores and proof counts
- Supports filtering by department and status

### 6. Memory Promotion API (`/api/departments/memory`)
- GET: Memory summary for a department
- POST: Promote an artifact to PAI database

### 7. Agent Status API (`/api/agents/status`)
- Real-time agent status with calibration and proof data
- Summary by department with averages
- Individual agent detail with history

### 8. Department Execution API (`/api/departments/execute`)
- POST: Execute a department head with intent and context
- Runs the department harness, scores output, promotes to memory
- Returns execution result with proof path
- GET: Execution history for a department

### 9. Department Calibration Dashboard (`/agency/calibration`)
- Real-time dashboard showing all 7 departments
- Substrate, telos, memory, quality gates, worker slots
- Calibration scores and trending
- Interactive department selection

### 10. Department Head Wiring (`src/lib/dept-head-wiring.ts`)
- Connects each department to real execution surfaces
- Runs Python harnesses, scores artifacts, promotes to memory
- Records execution in PAI database
- Returns ProofPacket with hash chain

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Department Calibration Dashboard        │
│  /agency/calibration                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Agent Status │  │ Calibration  │  │   Memory     │  │
│  │     API      │  │     API      │  │     API      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│  ┌──────▼─────────────────▼─────────────────▼───────┐  │
│  │              Department Execution API              │  │
│  │  /api/departments/execute                          │  │
│  └──────────────────────┬───────────────────────────┘  │
│                          │                              │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │              Department Head Wiring                │  │
│  │  src/lib/dept-head-wiring.ts                      │  │
│  └──────────────────────┬───────────────────────────┘  │
│                          │                              │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │              Python Harness Bridge                 │  │
│  │  scripts/dept_bridge.py → rig-jtbd-packs          │  │
│  └──────────────────────┬───────────────────────────┘  │
│                          │                              │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │              PAI Database (SQLite)                 │  │
│  │  agents | agent_memory | agent_outcomes            │  │
│  │  calibration_history | worker_slots                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Calibration Flow

1. **Execute**: POST to `/api/departments/execute` with department + intent
2. **Run**: Department head runs Python harness via dept_bridge.py
3. **Score**: Artifact scored against 4 quality gates per department
4. **Promote**: Output promoted to PAI memory (good/weak/pattern)
5. **Record**: Execution recorded in agent_outcomes table
6. **Calibrate**: Calibration score updated from quality gate results
7. **Dashboard**: Real-time view at `/agency/calibration`

## Quality Gates Per Department

| Department | Gate 1 | Gate 2 | Gate 3 | Gate 4 |
|------------|--------|--------|--------|--------|
| Strategy | source_per_claim (30%) | mechanism_furnace (25%) | anti_generic (25%) | proof_packet (20%) |
| Market | icp_grounded (30%) | personalization_proof (25%) | staged_not_live (25%) | metrics_separated (20%) |
| App | test_passes (35%) | type_check (25%) | no_fabrication (20%) | proof_packet (20%) |
| Design | signature_differentiation (30%) | anti_generic (30%) | brand_aligned (20%) | proof_packet (20%) |
| LinkedIn | mike_calibration (30%) | hook_tension (25%) | no_fabrication (25%) | staged_not_published (20%) |
| Forecast | calibrated (30%) | physics_check (25%) | source_grounded (25%) | proof_packet (20%) |
| CompanyOS | sop_has_verification (30%) | exception_routed (25%) | bottleneck_identified (25%) | proof_packet (20%) |

## Files Created

1. `src/app/api/agents/registry/route.ts` — Live Agent Registry API
2. `src/lib/dept-calibration.ts` — Department Calibration System
3. `src/lib/memory-promotion.ts` — Memory Promotion System
4. `src/app/api/departments/calibration/route.ts` — Calibration API
5. `src/app/api/departments/workers/route.ts` — Worker Slot API
6. `src/app/api/departments/memory/route.ts` — Memory Promotion API
7. `src/app/api/agents/status/route.ts` — Agent Status API
8. `src/lib/dept-head-wiring.ts` — Department Head Wiring
9. `src/app/api/departments/execute/route.ts` — Department Execution API
10. `src/components/CalibrationNav.tsx` — Navigation Component
11. `src/app/agency/calibration/page.tsx` — Calibration Dashboard