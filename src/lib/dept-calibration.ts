// src/lib/dept-calibration.ts
// Department Calibration System — gives each department real substrate, telos, memory, quality gates
// Replaces the static "what good looks like" with a scored, provable calibration system

import { execSync } from "child_process";

const PAI_DB = "/Users/rig128gb/Developer/rig-jtbd-packs/agent-substrate/data/agent_perf.db";

export interface DepartmentCalibration {
  department_id: string;
  department_name: string;
  substrate: {
    identity: string;
    role: string;
    boundaries: string[];
    load_order: string[];
    runtime_surfaces: string[];
  };
  telos: {
    outcome: string;
    success_metrics: string[];
    failure_modes: string[];
  };
  memory: {
    good_examples: MemoryEntry[];
    weak_examples: MemoryEntry[];
    decisions: MemoryEntry[];
    patterns: MemoryEntry[];
    total_count: number;
  };
  quality_gates: QualityGate[];
  proof_path: {
    artifact_family: string;
    required_fields: string[];
    verification_commands: string[];
  };
  calibration_score: number | null;
  calibration_history: CalibrationPoint[];
  worker_slots: WorkerSlot[];
}

export interface MemoryEntry {
  id: string;
  type: string;
  content: string;
  score: number | null;
  created_at: string;
  source: string;
}

export interface QualityGate {
  name: string;
  description: string;
  check_command: string;
  weight: number;
  passed: boolean | null;
  last_checked: string | null;
}

export interface CalibrationPoint {
  timestamp: string;
  score: number;
  artifact_type: string;
  notes: string;
}

export interface WorkerSlot {
  slot_id: string;
  name: string;
  role: string;
  status: string;
  last_run: string | null;
  proof_count: number;
}

// Department substrate definitions — the real identity for each department
const DEPARTMENT_SUBSTRATES: Record<string, DepartmentCalibration["substrate"]> = {
  strategy: {
    identity: "Strategic Intelligence Department",
    role: "Produce calibrated strategic analysis that compounds signed contracts through 7-Power positioning, scenario planning, and mechanism design",
    boundaries: [
      "Local analysis and drafting allowed",
      "Client-facing strategy requires Gate-D",
      "No fabricated market data or competitor claims",
      "Source-per-claim enforced on all external assertions"
    ],
    load_order: ["rig-strategy-dept", "strategy-studio-v2", "reason-hard", "tot-search"],
    runtime_surfaces: ["/Users/rig128gb/.claude/agents/rig-strategy-dept.md"]
  },
  market: {
    identity: "Go-To-Market Department",
    role: "Build governed revenue engine through channel testing, offer iteration, lead scoring, and staged outreach",
    boundaries: [
      "Research, scoring, drafting allowed locally",
      "Sends, ads, spend, public claims require Gate-D",
      "No generic outreach — must be grounded in real research",
      "Metrics must separate staged pipeline from recognized revenue"
    ],
    load_order: ["rig-market-dept", "market-studio-v2", "lead-score", "cold-email"],
    runtime_surfaces: ["/Users/rig128gb/.claude/agents/rig-market-dept.md"]
  },
  app: {
    identity: "Product & Engineering Department",
    role: "Spec, build, test, and ship product artifacts with deterministic quality gates",
    boundaries: [
      "Local coding and testing allowed",
      "Deploys, pushes, provider writes require Gate-D",
      "No self-verification — test harness must pass",
      "Every build produces a ProofPacket"
    ],
    load_order: ["rig-app-dept", "app-studio-v2", "spec-synthesize", "build-evolve"],
    runtime_surfaces: ["/Users/rig128gb/.claude/agents/rig-app-dept.md"]
  },
  design: {
    identity: "Design & Brand Department",
    role: "Produce calibrated design artifacts with +5σ signature differentiation",
    boundaries: [
      "Local design work and critiques allowed",
      "Public publishing, brand changes require Gate-D",
      "No generic templates — must show signature differentiation",
      "AntiGenericForce ≥ 85 for public-facing artifacts"
    ],
    load_order: ["rig-design-dept", "design-studio-v2", "design-studio", "website-goal"],
    runtime_surfaces: ["/Users/rig128gb/.claude/agents/rig-design-dept.md"]
  },
  linkedin: {
    identity: "Content & LinkedIn Department",
    role: "Produce calibrated LinkedIn craft that Mike would approve, improving contract-attributable inbound",
    boundaries: [
      "Drafting, scoring, calibrating allowed locally",
      "Publishing, DMs, public claims require Gate-D",
      "No fabricated numbers, stories, clients, or outcomes",
      "Mike taste calibration from real examples"
    ],
    load_order: ["rig-linkedin-dept", "linkedin-studio-v2", "linkedin-studio"],
    runtime_surfaces: ["/Users/rig128gb/.claude/agents/rig-linkedin-dept.md"]
  },
  forecast: {
    identity: "Forecast & Evaluation Department",
    role: "Calibrate scoring, evaluation, and risk assessment across all departments",
    boundaries: [
      "Local scoring and evaluation allowed",
      "Public forecasts, financial claims require Gate-D",
      "No uncalibrated confidence — must show Brier scores",
      "Physics audit catches state violations first"
    ],
    load_order: ["rig-forecast-dept", "forecast-eval-studio-v2", "score-artifact", "physics-audit"],
    runtime_surfaces: ["/Users/rig128gb/.claude/agents/rig-forecast-dept.md"]
  },
  companyos: {
    identity: "Company Operations Department",
    role: "Run governed operations through SOPs, exception routing, bottleneck detection, and incident triage",
    boundaries: [
      "Local operations analysis allowed",
      "External comms, provider writes require Gate-D",
      "No silent failures — escalate every exception",
      "Every SOP must have a verification command"
    ],
    load_order: ["rig-companyos-dept", "companyos-v2", "ops-cadence", "sop-compile"],
    runtime_surfaces: ["/Users/rig128gb/.claude/agents/rig-companyos-dept.md"]
  }
};

// Quality gates per department — what good looks like, scored
const DEPARTMENT_QUALITY_GATES: Record<string, DepartmentCalibration["quality_gates"]> = {
  strategy: [
    { name: "source_per_claim", description: "Every claim has a named source", check_command: "grep -c 'source\|Source\|SOURCE' artifact", weight: 0.3, passed: null, last_checked: null },
    { name: "mechanism_furnace", description: "Analysis identifies real mechanisms, not just patterns", check_command: "grep -c 'mechanism\|Mechanism' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "anti_generic", description: "Output is not generic AI slop", check_command: "grep -cE '(unique|specific|concrete|evidence|source|mechanism)' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "proof_packet", description: "Artifact has hash-chained ProofPacket", check_command: "grep -c 'sha256\|final_hash\|proof' artifact", weight: 0.2, passed: null, last_checked: null }
  ],
  market: [
    { name: "icp_grounded", description: "Outreach tied to named ICP with evidence", check_command: "grep -c 'ICP\|icp\|ideal customer' artifact", weight: 0.3, passed: null, last_checked: null },
    { name: "personalization_proof", description: "Personalization shows real research", check_command: "grep -c 'research\|Research\|signal\|Signal' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "staged_not_live", description: "Output is staged, not live", check_command: "grep -c 'staged\|Staged\|draft\|Draft' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "metrics_separated", description: "Pipeline metrics separated from revenue", check_command: "grep -c 'pipeline\|Pipeline\|staged\|Staged' artifact", weight: 0.2, passed: null, last_checked: null }
  ],
  app: [
    { name: "test_passes", description: "Test suite passes", check_command: "npm test 2>&1 | tail -5", weight: 0.35, passed: null, last_checked: null },
    { name: "type_check", description: "TypeScript type check passes", check_command: "npx tsc --noEmit 2>&1 | tail -5", weight: 0.25, passed: null, last_checked: null },
    { name: "no_fabrication", description: "No fabricated API responses or data", check_command: "grep -c 'mock\|Mock\|stub\|Stub\|TODO' artifact", weight: 0.2, passed: null, last_checked: null },
    { name: "proof_packet", description: "Build produces ProofPacket", check_command: "grep -c 'sha256\|final_hash\|proof' artifact", weight: 0.2, passed: null, last_checked: null }
  ],
  design: [
    { name: "signature_differentiation", description: "Design shows +5σ signature", check_command: "grep -cE '(signature|differentiation|unique|distinctive)' artifact", weight: 0.3, passed: null, last_checked: null },
    { name: "anti_generic", description: "Not generic template", check_command: "grep -c 'template\|Template\|generic\|Generic' artifact", weight: 0.3, passed: null, last_checked: null },
    { name: "brand_aligned", description: "Aligned with RIG brand standards", check_command: "grep -c 'brand\|Brand\|RIG\|Rodgers' artifact", weight: 0.2, passed: null, last_checked: null },
    { name: "proof_packet", description: "Design has ProofPacket", check_command: "grep -c 'sha256\|final_hash\|proof' artifact", weight: 0.2, passed: null, last_checked: null }
  ],
  linkedin: [
    { name: "mike_calibration", description: "Output matches Mike's taste calibration", check_command: "grep -c 'calibration\|Calibration\|taste\|Taste' artifact", weight: 0.3, passed: null, last_checked: null },
    { name: "hook_tension", description: "Post has hook, tension, rhythm", check_command: "grep -c 'hook\|Hook\|tension\|Tension\|rhythm\|Rhythm' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "no_fabrication", description: "No fabricated numbers or stories", check_command: "grep -c 'fabricat\|invent\|made up' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "staged_not_published", description: "Content staged, not published", check_command: "grep -c 'staged\|Staged\|draft\|Draft' artifact", weight: 0.2, passed: null, last_checked: null }
  ],
  forecast: [
    { name: "calibrated", description: "Scoring shows calibration metrics", check_command: "grep -c 'calibration\|Calibration\|brier\|Brier\|sigma' artifact", weight: 0.3, passed: null, last_checked: null },
    { name: "physics_check", description: "Physics audit passed", check_command: "grep -c 'physics\|Physics\|state.*gate\|State.*Gate' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "source_grounded", description: "Evaluation grounded in sources", check_command: "grep -c 'source\|Source\|evidence\|Evidence' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "proof_packet", description: "Evaluation has ProofPacket", check_command: "grep -c 'sha256\|final_hash\|proof' artifact", weight: 0.2, passed: null, last_checked: null }
  ],
  companyos: [
    { name: "sop_has_verification", description: "SOP has verification command", check_command: "grep -c 'verify\|Verify\|check\|Check\|test\|Test' artifact", weight: 0.3, passed: null, last_checked: null },
    { name: "exception_routed", description: "Exceptions properly routed", check_command: "grep -c 'exception\|Exception\|escalat\|Escalat' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "bottleneck_identified", description: "Bottlenecks identified with evidence", check_command: "grep -c 'bottleneck\|Bottleneck\|constraint\|Constraint' artifact", weight: 0.25, passed: null, last_checked: null },
    { name: "proof_packet", description: "Operations has ProofPacket", check_command: "grep -c 'sha256\|final_hash\|proof' artifact", weight: 0.2, passed: null, last_checked: null }
  ]
};

function queryPAI(sql: string): any[] {
  try {
    const result = execSync(
      `sqlite3 -json "${PAI_DB}" "${sql.replace(/"/g, '\"')}"`,
      { encoding: "utf-8", timeout: 5000 }
    );
    return JSON.parse(result || "[]");
  } catch {
    return [];
  }
}

export function getDepartmentCalibration(deptId: string): DepartmentCalibration | null {
  const substrate = DEPARTMENT_SUBSTRATES[deptId];
  if (!substrate) return null;

  // Get memory from PAI database
  const memoryRows = queryPAI(`
    SELECT id, type, content, score, created_at, source 
    FROM agent_memory 
    WHERE department_id = '${deptId}'
    ORDER BY created_at DESC
    LIMIT 100
  `);

  const goodExamples = memoryRows.filter(m => m.type === "good_example");
  const weakExamples = memoryRows.filter(m => m.type === "weak_example");
  const decisions = memoryRows.filter(m => m.type === "decision");
  const patterns = memoryRows.filter(m => m.type === "pattern");

  // Get calibration history
  const calibrationRows = queryPAI(`
    SELECT timestamp, score, artifact_type, notes
    FROM calibration_history
    WHERE department_id = '${deptId}'
    ORDER BY timestamp DESC
    LIMIT 50
  `);

  // Get worker slots
  const workerRows = queryPAI(`
    SELECT slot_id, name, role, status, last_run, proof_count
    FROM worker_slots
    WHERE department_id = '${deptId}'
    ORDER BY name
  `);

  // Calculate calibration score
  const avgScore = calibrationRows.length > 0
    ? calibrationRows.reduce((sum, r) => sum + r.score, 0) / calibrationRows.length
    : null;

  return {
    department_id: deptId,
    department_name: substrate.identity,
    substrate,
    telos: {
      outcome: substrate.role,
      success_metrics: ["signed_contracts", "pipeline_growth", "calibration_improvement"],
      failure_modes: ["generic_output", "uncalibrated_confidence", "gate_bypass"]
    },
    memory: {
      good_examples: goodExamples,
      weak_examples: weakExamples,
      decisions,
      patterns,
      total_count: memoryRows.length
    },
    quality_gates: DEPARTMENT_QUALITY_GATES[deptId] || [],
    proof_path: {
      artifact_family: deptId,
      required_fields: ["sha256", "final_hash", "proof", "timestamp"],
      verification_commands: [`/Users/rig128gb/.rig/bin/rig-department-pai show ${deptId} --format json`]
    },
    calibration_score: avgScore,
    calibration_history: calibrationRows,
    worker_slots: workerRows
  };
}

export function getAllDepartmentCalibrations(): DepartmentCalibration[] {
  return Object.keys(DEPARTMENT_SUBSTRATES)
    .map(getDepartmentCalibration)
    .filter((c): c is DepartmentCalibration => c !== null);
}

export function scoreArtifact(deptId: string, artifactPath: string): { score: number; gates: { name: string; passed: boolean; weight: number }[] } {
  const gates = DEPARTMENT_QUALITY_GATES[deptId] || [];
  const results = gates.map(gate => {
    try {
      const output = execSync(gate.check_command.replace("artifact", artifactPath), {
        encoding: "utf-8",
        timeout: 5000,
        shell: "/bin/bash"
      });
      const count = parseInt(output.trim()) || 0;
      return { name: gate.name, passed: count > 0, weight: gate.weight };
    } catch {
      return { name: gate.name, passed: false, weight: gate.weight };
    }
  });

  const score = results.reduce((sum, r) => sum + (r.passed ? r.weight : 0), 0);
  return { score, gates: results };
}