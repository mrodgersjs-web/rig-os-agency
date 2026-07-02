# RIG Agent OS — 100-Turn 1000x Improvement Campaign
## Master Plan v3.0.0

**Owner:** Mike Rodgers  
**Agent:** Jake RIG Agent (Hermes)  
**Coordinate:** L6-D2-A3-S  
**Generated:** 2026-07-02  
**Goal:** Make RIG Agent OS the deterministic control plane that runs Rodgers Intelligence Group toward $10M ARR.

---

## Campaign Architecture

7 tracks × 15 turns = 105 turns. We run the first 100 with overlap and compounding.

| # | Track | Focus | Lead Agent(s) | Output |
|---|-------|-------|---------------|--------|
| 1 | Revenue Architecture | Pipeline velocity, pricing, proposals, contracts, invoices, daily revenue rituals | Hermes + Codex + GTM agents | RevenueCommandCenter v2 |
| 2 | Agent Swarm Wiring | Cross-agent dispatch, handoffs, shared memory, goal ownership, VoltAgent builds | Hermes + VoltAgent + Codex | Swarm dispatch layer |
| 3 | Deviation/Chaos Engines | 40 engines wired into every decision surface | Hermes + Susan (RIG-L) | Deviation gate pipeline |
| 4 | Meta-Harness Binding | Auto-spawn goals, track progress, seal proof packets | Hermes + meta-harness worker | Goal loop scheduler |
| 5 | Daily Operations | Jarvis 7AM briefing, health checks, on-call, spend alerts | Hermes + Jarvis | Ops dashboard |
| 6 | ProofPacket Governance | Every revenue/GTM/build action produces a sealed packet | Hermes + Codex | Proof registry |
| 7 | Anti-Generic Quality | ≥80/85 AGF, corpus dedup, second-agent verifier | Hermes + Agency agents | Quality gate API |

---

## Track 1 — Revenue Architecture (Turns 1-15)

| Turn | Action | Expected Revenue Impact | Owner | Success Metric |
|------|--------|------------------------|-------|----------------|
| 1 | Wire `/agency/revenue-command` to read real Stripe balance + prospects DB + pipeline value | Baseline truth | Hermes | ARR number matches ledger within $1K |
| 2 | Add lead scoring API that consumes Apollo/CRM + website behavior + email engagement | Prioritize top 20% | Codex | Top 20 leads scored ≥0.75 |
| 3 | Build proposal factory v2 with templates per vertical + dynamic pricing + e-signature hook | 3x proposal output | Codex | 5 proposals/day generated |
| 4 | Connect contract lifecycle to dashboard: draft → send → sign → invoice | Faster close | Hermes | Contract cycle < 48h visible |
| 5 | Invoice auto-generation from signed contracts + Stripe payment link | Cash collection | Codex | Invoice sent within 1h of signature |
| 6 | Pricing experiments UI: 3-tier packages per vertical with A/B labels | Higher ACV | Hermes | 2 pricing tests live |
| 7 | GTM channel activation queue: LinkedIn, email, warm intro, ad retarget per lead | Multi-touch | Hermes | 25 daily activations queued |
| 8 | Follow-up cascade engine with reply detection + sentiment + SLA | Reply lift | Codex | 8-touch sequence per lead |
| 9 | Competitor audit auto-run per opportunity with battlecard output | Win rate | Hermes | Battlecard attached to each proposal |
| 10 | Revenue forecast model using pipeline stage probabilities | Forecast accuracy | Codex | Weekly forecast vs actual ±10% |
| 11 | Spend reduction dashboard tied to real subscriptions + usage | Margin protection | Hermes | $10K/year savings flagged |
| 12 | Jobs/applied tracker integrated with proposal pipeline | Capacity mgmt | Codex | Pipeline coverage ratio visible |
| 13 | Daily revenue ritual page: 3 priorities, 1 love text, 1 proof packet | Focus | Jarvis | Ritual completed by 8AM |
| 14 | CRM enrichment API using Apollo + LinkedIn + website signals | Data quality | Hermes | 90% of leads have enriched fields |
| 15 | First-flight GTM report: leads → touches → replies → calls → proposals → contracts | Full funnel | Hermes | End-to-end funnel dashboard live |

---

## Track 2 — Agent Swarm Wiring (Turns 1-15)

| Turn | Action | Integration Point | Owner | Deterministic Test |
|------|--------|-------------------|-------|-------------------|
| 1 | Add `/api/agency/swarm/dispatch` endpoint that accepts task + picks agent by role | Hermes → subagents | Codex | POST returns chosen agent + run_id |
| 2 | Build shared goal queue in SQLite: tasks with owner, status, proof_id, priority | All agents | Codex | Query returns unclaimed tasks |
| 3 | VoltAgent codex subagent manifest loaded into `/api/agency/voltagents` | Codex builds | Hermes | List matches `voltagent_inventory.json` |
| 4 | Agency agents inventory loaded into `/api/agency/agents` with role routing | Role dispatch | Hermes | `/rig-fleet` shows 232 agents |
| 5 | Handoff schema JSON: output of one agent must validate against next agent's input | Chain integrity | Codex | Pydantic validator passes |
| 6 | Cross-agent memory bridge: each session pushes summary to Obsidian vault | Shared context | Hermes | New note appears in `Logs/YYYY-MM-DD.md` |
| 7 | Agent heartbeat API: claude/hermes/codex/opencode/jarvis report status every 60s | Fleet health | Codex | `/api/agency/heartbeat` returns green/red |
| 8 | Dispatch rules for GTM vs build vs strategy vs design tasks | Auto-routing | Hermes | 10 sample tasks route correctly |
| 9 | Build `/api/agency/agents/run` to execute a single agent task with proof packet | Execution layer | Codex | Returns packet with exit code |
| 10 | Multi-agent consensus vote for high-stakes decisions (> $5K or public action) | Decision quality | Hermes | 3 agents vote, median score recorded |
| 11 | Error escalation path: agent failure → Jarvis alert → Mike override | Safety | Hermes | Simulated failure triggers alert |
| 12 | Agent billing ledger: track compute/model spend per agent/task | Cost control | Codex | Monthly spend by agent visible |
| 13 | Auto-archive completed tasks with full proof chain | Memory compounding | Hermes | Archive query returns last 100 tasks |
| 14 | RIG agent factory UI to spawn new Agency/VoltAgent roles | Scalability | Codex | New agent TOML generated + validated |
| 15 | Swarm orchestrator page: live view of running agents, queues, and outcomes | Visibility | Hermes | Page updates every 5s |

---

## Track 3 — Deviation/Chaos Engines (Turns 1-15)

| Turn | Engine(s) | Decision Surface | Gate Condition |
|------|-----------|-------------------|----------------|
| 1 | 36 Speed of Light | Information propagation in agent handoffs | No handoff > 5 min stale |
| 2 | 32 Pauli Exclusion | Duplicate work detection | Two agents cannot claim same task |
| 3 | 38 Phase Transition | Pipeline stage changes | Alert if stage moves backward |
| 4 | 31 Quantum Tunneling | Stuck deal recovery | Auto-escalate deals idle > 7 days |
| 5 | 15 Source-Per-Claim | Revenue numbers in UI | Every $ cites file/API path |
| 6 | 13 Anti-Slop Auditor | Generated emails/posts | AGF ≥ 80 internal / ≥ 85 public |
| 7 | 16 Falsification Pre-Register | Pricing experiments | Hypothesis logged before test |
| 8 | 20 Compounding Edge | Daily 1% improvements | Track cumulative lift |
| 9 | 27 Resource Allocator | Compute/model budget | Spend weighted by need × trust |
| 10 | 22 Bee Foraging | Lead exploration | Balance new leads vs nurture |
| 11 | 24 Genetic Diversity Pump | Content/campaign angles | ≥ 5 angle variants per campaign |
| 12 | 35 Hawking Radiation | Black-box model outputs | Surface reasoning per output |
| 13 | 10 Temporal Horizon | Forecast validity | Stale forecast > 7 days flagged |
| 14 | 18 Brier Calibrator | Probability estimates | Score predictions monthly |
| 15 | 40 Vacuum Fluctuation | Creative ideation | Generate 10 novel ideas/week |

---

## Track 4 — Meta-Harness Binding (Turns 1-15)

| Turn | Action | Schedule / Trigger | Dashboard Widget |
|------|--------|-------------------|------------------|
| 1 | `/api/agency/goal/spawn` accepts goal spec YAML and returns run_id | API call | Goal queue table |
| 2 | SQLite `goals` table with schema: id, spec, status, owner, proof_id, priority | Persistent | Schema visible in health |
| 3 | `mission-control` runs daily at 6AM via launchd | 6AM daily | Status report widget |
| 4 | Auto-promote recurring goals (> 3 repeats) to SOP/skill | On 3rd repeat | Skill registry update |
| 5 | Goal progress tracker: % complete, last action, next action, blockers | Every goal update | Progress bars |
| 6 | Proof packet auto-seal on goal completion | On status=done | Proof hash shown |
| 7 | Daily goal review page for Mike: top 3 + blockers + proof | 7AM | Review card |
| 8 | Weekly meta-review: which loops ran, which failed, why | Friday 5PM | Week-in-review |
| 9 | Goal dependencies graph: which goals block others | On spawn | Network graph |
| 10 | Auto-retry failed goals with exponential backoff | On failure | Retry queue |
| 11 | Goal templates per studio (GTM, LinkedIn, Design, Strategy, App) | On template select | Template picker |
| 12 | `rig-fullbuild` loop bound to app release pipeline | On release | Release gate |
| 13 | Temporal workflow for long-running goals (> 24h) | Worker schedule | Workflow list |
| 14 | Goal cost tracking: model/API/compute spend per goal | On completion | Cost column |
| 15 | Meta-harness health page: all gates, workers, cron, launchd | Continuous | Health grid |

---

## Track 5 — Daily Operations (Turns 1-15)

| Turn | Action | Data Source | Trigger | Human Override |
|------|--------|-------------|---------|----------------|
| 1 | Jarvis 7AM briefing generator: overnight work, revenue, GTM, priorities, love text | Multi-source | 7AM daily | Mike can edit before send |
| 2 | Auto-start Agent OS on login | launchd | Login | Can disable in settings |
| 3 | System health check every 5 min: disk, memory, services, ports | Local system | 5 min cron | Alert if red |
| 4 | Service dependency map: which service needs which | Config | On health check | Downstream alerts |
| 5 | On-call rotation for agent failures: Jarvis → Hermes → Mike | Failure queue | Critical failure | Mike always has override |
| 6 | Incident triage UI: classify, severity, owner, runbook | Incident API | Alert | Manual reclassify |
| 7 | Spend alerts: model/API/compute > daily budget | Stripe + provider APIs | Threshold breach | Pause or approve |
| 8 | Daily backup check: vault, repos, databases | Backup scripts | 4AM | Verify restore test |
| 9 | LinkedIn DM morning/afternoon/evening cadence | Cron | 3x daily | Mike approves sends |
| 10 | SEO publishing ritual: generate → QC → schedule | Content pipeline | Daily | Final approval gate |
| 11 | Receipt ledger reconciliation: every claimed number must match ledger | `receipt_ledger.json` | Daily | Manual exception |
| 12 | Love text scheduler for James with auto-suggest + manual send | Calendar/CRM | 7AM | Mike taps send |
| 13 | Overnight work summary: what each agent did, what succeeded, what failed | Agent logs | 6AM | Review and redirect |
| 14 | Capacity dashboard: which agents are overloaded, which idle | Task queue | Continuous | Rebalance |
| 15 | End-of-day closeout ritual: capture notes, commit vault, seal proof | EOD trigger | 10PM | Manual closeout |

---

## Track 6 — ProofPacket Governance (Turns 1-15)

| Turn | Action | Stores | Schema Field | UI |
|------|--------|--------|--------------|-----|
| 1 | Every `/api/run` command returns a mini proof packet | `~/.rig-agent-os/data/proofs/` | run_id, cmd, stdout_hash | RIG Ops log |
| 2 | ProofPacket registry SQLite table | SQLite | schema_version, run_id, coordinate | `/rig-proof` page |
| 3 | Seal function: sort_keys=True sha256 hash | Registry | proof_hash, timestamp | Seal button |
| 4 | Gate results stored per packet | Registry | gates: [{name, status}] | Gate table |
| 5 | Deviation scores per packet | Registry | robust_mad_z, rig_l, anti_generic | Deviation card |
| 6 | Approval status per packet | Registry | approval required/approved_by | Approval badge |
| 7 | Source citation enforcement: no claim without URI/path | Validation | sources[] | Source inspector |
| 8 | Packet indexing by agent, goal, coordinate, date | Registry | Search API | Filter bar |
| 9 | Packet diff: compare two packets for regression | Registry | Diff view | Compare tool |
| 10 | Failed packet retention: never delete to make tests pass | Policy | retention: forever | Compliance note |
| 11 | Packet export to Obsidian vault as decision record | Vault | Note in `Proofs/` | Auto-link |
| 12 | Public/private classification for packets | Registry | visibility | Privacy badge |
| 13 | Packet-driven rollback: failed proof blocks deploy/send | Gate-D | verdict | Block banner |
| 14 | ProofPacket templates per goal loop | Registry | template_id | Template picker |
| 15 | Daily proof digest: new packets, failures, approvals needed | Digest | summary | 7AM email |

---

## Track 7 — Anti-Generic Quality (Turns 1-15)

| Turn | Action | Where Applied | AGF Target | Test |
|------|--------|---------------|------------|------|
| 1 | AGF scorer API: input text → score 0-100 with specific fails | `/api/agency/agf` | ≥80 internal / ≥85 public | 10 sample posts |
| 2 | Common angle detector: block "Everyone claims..." patterns | Content gen | No match | Regex test |
| 3 | Corpus deduplication against ALL past posts/articles | Content gen | ≤10% similarity | Hash/similarity |
| 4 | Second-agent verifier: independent scoring by different model | QC pipeline | Δ ≤ 5 points | Cross-score |
| 5 | Emotional/fun/chaos injection prompt templates | LinkedIn/posts | FUN score ≥ 7 | Sample output |
| 6 | Vertical-specific persona checks: construction, dental, etc. | Content + outreach | Matches persona | Persona classifier |
| 7 | Receipt ledger validator: every number must cite ledger | Revenue + GTM | 100% cited | Audit query |
| 8 | Link-in-body detector: block links in LinkedIn post body | LinkedIn | 0 links in body | Lint |
| 9 | CTA requirement checker: every post needs explicit CTA | LinkedIn | CTA present | Extractor |
| 10 | Image context scorer: does image match post emotion/vertical? | Design | ≥ 0.75 match | Manual review first |
| 11 | Anti-generic email subject line generator | Outreach | Subject AGF ≥ 80 | A/B test |
| 12 | Proposal specificity gate: no vague benefits, only measurable outcomes | Proposals | Each benefit has metric | Validator |
| 13 | Code change generic detector: block "improve performance" without metric | Commits | Metric required | Commit lint |
| 14 | Daily quality report: AGF averages, failures, top offenders | Ops | Report by channel | Dashboard |
| 15 | Quality-driven feedback loop: failures become training examples | Learning | Dataset grows | Export to training set |

---

## Execution Cadence

- **Turns 1-10:** Foundation — config, API endpoints, registry, SQLite schema.
- **Turns 11-30:** Wiring — connect existing pages, agents, harnesses.
- **Turns 31-60:** Intelligence — scoring, forecasting, deviation engines, quality gates.
- **Turns 61-90:** Automation — daily rituals, auto-dispatch, proof sealing, briefings.
- **Turns 91-100:** Hardening — adversarial verification, Brier calibration, meta-review, handoff docs.

## First 10 Immediate Actions

1. Write campaign manifest to repo.
2. Create SQLite schema for goals + proofs + tasks.
3. Build `/api/agency/swarm/dispatch`.
4. Wire revenue-command to real Stripe + pipeline data.
5. Add deviation engine pipeline to `/api/agency/deviate`.
6. Create AGF scorer API.
7. Build agent heartbeat endpoint.
8. Add goal spawn/queue/track APIs.
9. Create Jarvis briefing generator API.
10. Seal ProofPacket for this campaign manifest.

---

## Proof Contract

Every turn produces:
- Artifact path + sha256
- Gate results (PASS/FAIL/SKIPPED)
- Deviation engine subset used
- Approval status (Gate-D if outward/irreversible)
- Verdict: done = all(blocking_gates_pass)

No gate JSON, no ship.
