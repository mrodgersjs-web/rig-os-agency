// ── RIG OS Agency — Doctrine Engine ─────────────────────────────────
// The canonical RIG doctrine: IQRSQPI, A1-A4, 40 Deviation Engines, Gate-D, ProofPacket.

export type IQRSQPIStep = "I1" | "Q1" | "R" | "S" | "Q2" | "P" | "I2";

export interface IQRSQPIStage {
  code: IQRSQPIStep;
  name: string;
  purpose: string;
}

export const IQRSQPI: IQRSQPIStage[] = [
  { code: "I1", name: "Intent", purpose: "Determine what the request, event, or trigger is asking for" },
  { code: "Q1", name: "Question", purpose: "Convert intent into exact operational/research question" },
  { code: "R", name: "Research", purpose: "Retrieve or generate evidence needed to answer the question" },
  { code: "S", name: "Solution", purpose: "Produce answer, artifact, plan, code, draft, strategy, or action" },
  { code: "Q2", name: "Quality", purpose: "Validate safety, grounding, usefulness, mechanism, and policy" },
  { code: "P", name: "Proof", purpose: "Bind artifact to sources, gates, signer, timestamp, and hash" },
  { code: "I2", name: "Integrate", purpose: "Execute, save, send, approve, deploy, publish, or route result" },
];

// ── Build Modes ─────────────────────────────────────────────────────
export type BuildMode = "A1" | "A2" | "A3" | "A4";

export interface BuildModeDef {
  mode: BuildMode;
  name: string;
  bmsThreshold: string;
  hardRules: string;
}

export const BUILD_MODES: BuildModeDef[] = [
  { mode: "A1", name: "Python Only", bmsThreshold: ">= 0.75", hardRules: "Typed schemas, fixed rules, golden tests, ProofPackets" },
  { mode: "A2", name: "Hybrid", bmsThreshold: "0.45 - 0.74", hardRules: "Temperature 0, forced JSON, Pydantic validation" },
  { mode: "A3", name: "Agent Bounded", bmsThreshold: "0.25 - 0.44", hardRules: "Tool allowlists, approval nodes, retry limits, ProofPacket per transition" },
  { mode: "A4", name: "LLM Agent Free", bmsThreshold: "< 0.25", hardRules: "Kill switch, budget switch, Brier eval, human approval" },
];

export function routeBuildMode(bms: number): BuildMode {
  if (bms >= 0.75) return "A1";
  if (bms >= 0.45) return "A2";
  if (bms >= 0.25) return "A3";
  return "A4";
}

// ── 40 Deviation Engines ────────────────────────────────────────────
export type EngineCategory = "Cognitive" | "Nature" | "Physics";

export interface DeviationEngine {
  number: number;
  name: string;
  category: EngineCategory;
  sigma: string;
  description: string;
}

export const DEVIATION_ENGINES: DeviationEngine[] = [
  // Cognitive 01-20
  { number: 1, name: "Gravity Escape", category: "Cognitive", sigma: "±20σ", description: "Escape generic AI gravity" },
  { number: 2, name: "Reality Anchor", category: "Cognitive", sigma: "±20σ", description: "Ground claims in verifiable reality" },
  { number: 3, name: "Feynman X-Ray", category: "Cognitive", sigma: "±20σ", description: "Expose fake understanding" },
  { number: 4, name: "Mechanism Furnace", category: "Cognitive", sigma: "±20σ", description: "Burn off adjectives; only machinery remains" },
  { number: 5, name: "Rupture Engine", category: "Cognitive", sigma: "±20σ", description: "Break inherited orthodoxy" },
  { number: 6, name: "Collision Collider", category: "Cognitive", sigma: "±20σ", description: "Import mechanisms from unrelated domains" },
  { number: 7, name: "Voltage Reactor", category: "Cognitive", sigma: "±20σ", description: "Create emotional voltage without manipulation" },
  { number: 8, name: "Evolutionary Memory Flywheel", category: "Cognitive", sigma: "±20σ", description: "Long-term compounding, optionality" },
  { number: 9, name: "Memory Residue", category: "Cognitive", sigma: "±20σ", description: "What the reader remembers in 48 hours" },
  { number: 10, name: "Temporal Horizon Integrity", category: "Cognitive", sigma: "±20σ", description: "Long-term compounding horizon" },
  { number: 11, name: "Autonomy Calibration", category: "Cognitive", sigma: "±20σ", description: "Preserve reader/user agency" },
  { number: 12, name: "Predictive Error Calibration", category: "Cognitive", sigma: "±20σ", description: "Brier-scored prediction calibration" },
  { number: 13, name: "Anti-Slop Auditor", category: "Cognitive", sigma: "±20σ", description: "Detect and eliminate AI-generated filler" },
  { number: 14, name: "Specificity Gate", category: "Cognitive", sigma: "±20σ", description: "Cannot be compressed into a known phrase" },
  { number: 15, name: "Source-Per-Claim", category: "Cognitive", sigma: "±20σ", description: "Per-claim source weight" },
  { number: 16, name: "Falsification Pre-Register", category: "Cognitive", sigma: "±20σ", description: "Pre-register falsification criteria" },
  { number: 17, name: "Dissent Recorder", category: "Cognitive", sigma: "±20σ", description: "Record and weight dissenting views" },
  { number: 18, name: "Brier Calibrator", category: "Cognitive", sigma: "±20σ", description: "Calibrate predictions against outcomes" },
  { number: 19, name: "Cognitive Sovereignty", category: "Cognitive", sigma: "±20σ", description: "Human stays the decision-maker" },
  { number: 20, name: "Compounding Edge", category: "Cognitive", sigma: "±20σ", description: "Pays back more on reread than first read" },
  // Nature 21-30
  { number: 21, name: "Ant Colony Pheromone", category: "Nature", sigma: "±20σ", description: "Reinforce winning paths; prune the rest" },
  { number: 22, name: "Bee Foraging Allocator", category: "Nature", sigma: "±20σ", description: "Allocate resources by need x trust" },
  { number: 23, name: "Slime Mold Network", category: "Nature", sigma: "±20σ", description: "Self-organizing network optimization" },
  { number: 24, name: "Genetic Diversity Pump", category: "Nature", sigma: "±20σ", description: "Mediocre candidates mutate hard; winners refine" },
  { number: 25, name: "Particle Swarm Cohesion", category: "Nature", sigma: "±20σ", description: "Swarm convergence to best solutions" },
  { number: 26, name: "Firefly Synchronization", category: "Nature", sigma: "±20σ", description: "Bioluminescent attraction to brighter solutions" },
  { number: 27, name: "Resource Allocator", category: "Nature", sigma: "±20σ", description: "need x trust allocation" },
  { number: 28, name: "Whale Spiral (WOA)", category: "Nature", sigma: "±20σ", description: "Spiral tightens around the best; anneal exploration" },
  { number: 29, name: "Cuckoo Parasite", category: "Nature", sigma: "±20σ", description: "Inject parasitic high-deviation candidates" },
  { number: 30, name: "Coral Reef Evolver (CRO-SL)", category: "Nature", sigma: "±20σ", description: "All 5 reproduction modes simultaneously" },
  // Physics 31-40
  { number: 31, name: "Quantum Tunneling", category: "Physics", sigma: "±30σ HARD", description: "Penetrate an impassable barrier" },
  { number: 32, name: "Pauli Exclusion", category: "Physics", sigma: "±30σ HARD", description: "No two artifacts may occupy the same state" },
  { number: 33, name: "Casimir Pressure", category: "Physics", sigma: "±30σ HARD", description: "Constrained empty space generates measurable force" },
  { number: 34, name: "Fine-Tuning", category: "Physics", sigma: "±30σ HARD", description: "Every element precisely calibrated; no replacement" },
  { number: 35, name: "Hawking Radiation", category: "Physics", sigma: "±30σ HARD", description: "Information must leak through opaque barriers" },
  { number: 36, name: "Speed of Light", category: "Physics", sigma: "±30σ HARD", description: "Hard limit on information propagation" },
  { number: 37, name: "Absolute Zero", category: "Physics", sigma: "±30σ HARD", description: "Detect unreachable-floor claims" },
  { number: 38, name: "Phase Transition", category: "Physics", sigma: "±30σ HARD", description: "Cross the critical temperature; reorganize" },
  { number: 39, name: "Bell Entanglement", category: "Physics", sigma: "±30σ HARD", description: "Genuine non-local correlation; |S| > 2" },
  { number: 40, name: "Vacuum Fluctuation", category: "Physics", sigma: "±30σ HARD", description: "Even quiet systems must show baseline activity" },
];

// ── Gate-D Rules ────────────────────────────────────────────────────
export const GATE_D_RULES: string[] = [
  "Gate-D means scoped Mike authorization",
  "Mike's direct instruction in the current task is approval for the named action and target",
  "Applies to: push, merge, deploy, send, payment, destructive command, private-data export, public exposure, external account changes",
  "Ask only when target, scope, content, environment, account, cost, or rollback path is unclear",
  "Outward artifacts ship dormant only when scope is unclear",
  "SKIPPED blocks done; never a fake PASS",
];

// ── Safety Rules ────────────────────────────────────────────────────
export const SAFETY_RULES: string[] = [
  "No secrets in the repo",
  "No public action outside Mike's scoped current instruction",
  "No source, no number",
  "No mechanism, no claim",
  "No gate JSON, no ship",
  "No memory update, no compounding",
  "Never delete logs to make tests pass",
  "Never hide failures",
  "AntiGenericForce >= 80 internal / >= 85 public-facing",
  "ManipulationRisk <= 35 for customer-facing artifacts",
  "Prefer dry-run / sandbox when scope is unclear",
];

// ── ProofPacket Schema ──────────────────────────────────────────────
export interface ProofPacket {
  schema_version: 1;
  run_id: string;
  agent: string;
  coordinate: string;
  intent: string;
  artifact: { path: string; hash: string; bytes: number };
  sources: { uri: string; range: string; hash: string }[];
  gates: { name: string; command: string; exit_code: number; headline: string; status: "PASS" | "FAIL" | "SKIPPED" }[];
  deviation: { engine_subset: string[]; robust_mad_z: number; rig_l: number; anti_generic: number; physics_breaches: string[] };
  approval: { required: boolean; source: string; approved_by: string; approved_at: string };
  verdict: boolean;
  proof_hash: string;
  timestamp: string;
}

export function createProofPacket(partial: Partial<ProofPacket>): ProofPacket {
  return {
    schema_version: 1,
    run_id: partial.run_id || crypto.randomUUID(),
    agent: partial.agent || "rig-os-agency",
    coordinate: partial.coordinate || "L4-D1-A3-I2",
    intent: partial.intent || "",
    artifact: partial.artifact || { path: "", hash: "", bytes: 0 },
    sources: partial.sources || [],
    gates: partial.gates || [],
    deviation: partial.deviation || { engine_subset: [], robust_mad_z: 0, rig_l: 0, anti_generic: 0, physics_breaches: [] },
    approval: partial.approval || { required: false, source: "", approved_by: "", approved_at: "" },
    verdict: partial.verdict ?? false,
    proof_hash: partial.proof_hash || "",
    timestamp: new Date().toISOString(),
  };
}

// ── Prime Directive ─────────────────────────────────────────────────
export const PRIME_DIRECTIVE = `Code owns decisions.
LLMs assist transformation.
Gates decide if it ships.
ProofPacket or it didn't happen.`;

export const NON_NEGOTIABLE = [
  "Local-first",
  "RIG node communications are LAN-first; Tailscale/tailnet is backup only",
  "Deterministic before agentic",
  "Escalate, never fail silently",
  "Every byte audited",
  "AntiGenericForce >= 80 internal / >= 85 public-facing",
  "ProofPacket or it did not happen",
  "No source, no number",
  "No mechanism, no claim",
  "No gate JSON, no ship",
  "No memory update, no compounding",
  "No Mike approval, no public action",
];

// ── 3D Lattice ──────────────────────────────────────────────────────
export interface LatticeCoordinate {
  level: number; // L1-L7
  diamond: number; // D1 Physical, D2 Cognitive, D3 Nature
  mode: BuildMode;
  step: IQRSQPIStep;
}

export function formatCoordinate(c: LatticeCoordinate): string {
  return `L${c.level}-D${c.diamond}-${c.mode}-${c.step}`;
}

export const LATTICE_DIMENSIONS = {
  levels: 7, // L1-L7
  diamonds: 3, // D1 Physical, D2 Cognitive, D3 Nature
  modes: 4, // A1-A4
  steps: 7, // IQRSQPI
  totalCells: 7 * 3 * 4 * 7, // 588 execution cells
};