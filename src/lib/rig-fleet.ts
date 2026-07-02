// ── RIG OS Agency — Agent Fleet Registry ───────────────────────────
// 232 Agency Agents + 86 RIG domain experts + VoltAgent subagents + 21 RIG core
// Client-safe: no fs/path/os imports. Static data only.

export type AgentCategory = "agency" | "rig_expert" | "voltagent" | "rig_core";
export type AgentStatus = "active" | "idle" | "errored" | "unloaded";

export interface AgentEntry {
  id: string;
  name: string;
  category: AgentCategory;
  role: string;
  capabilities: string[];
  invocationPath: string;
  status: AgentStatus;
}

// ── Static registries ────────────────────────────────────────────────
export const RIG_CORE_AGENTS: AgentEntry[] = [
  { id: "hermes", name: "Hermes", category: "rig_core", role: "Conductor & research", capabilities: ["web", "terminal", "file", "browser", "delegation"], invocationPath: "hermes", status: "active" },
  { id: "claude", name: "Claude Code", category: "rig_core", role: "Architect & implementer", capabilities: ["code", "architecture", "review", "mcp"], invocationPath: "claude", status: "active" },
  { id: "modal1", name: "Modal1", category: "rig_core", role: "Manual GPU model plane", capabilities: ["modal", "gpu", "openai-compatible", "swarm", "moe"], invocationPath: "claude-model modal1", status: "idle" },
  { id: "modal-code", name: "Modal Code", category: "rig_core", role: "Heavy coding worker lane", capabilities: ["modal", "coding", "repo-editing", "swarm"], invocationPath: "claude-model modal-code", status: "idle" },
  { id: "modal-test", name: "Modal Test", category: "rig_core", role: "Test and eval worker lane", capabilities: ["modal", "tests", "lint", "evals", "regression"], invocationPath: "claude-model modal-test", status: "idle" },
  { id: "modal-build", name: "Modal Build", category: "rig_core", role: "Build and packaging worker lane", capabilities: ["modal", "build", "package", "artifacts"], invocationPath: "claude-model modal-build", status: "idle" },
  { id: "modal-review", name: "Modal Review", category: "rig_core", role: "Review and proof worker lane", capabilities: ["modal", "review", "security", "proofpacket"], invocationPath: "claude-model modal-review", status: "idle" },
  { id: "modal-swarm-router", name: "Swarm Router", category: "rig_core", role: "Agency role router and 100-task planner", capabilities: ["modal", "swarm", "routing", "planning"], invocationPath: "claude-model modal-swarm-router", status: "idle" },
  { id: "modal-repo-map", name: "Repo Cartographer", category: "rig_core", role: "Repository mapping and onboarding lane", capabilities: ["modal", "repo-map", "architecture", "dependency-map"], invocationPath: "claude-model modal-repo-map", status: "idle" },
  { id: "modal-patch-factory", name: "Patch Factory", category: "rig_core", role: "Bounded code patch generation lane", capabilities: ["modal", "patches", "coding", "done-tests"], invocationPath: "claude-model modal-patch-factory", status: "idle" },
  { id: "modal-test-forge", name: "Test Forge", category: "rig_core", role: "Test generation and triage lane", capabilities: ["modal", "tests", "lint", "evals"], invocationPath: "claude-model modal-test-forge", status: "idle" },
  { id: "modal-build-farm", name: "Build Farm", category: "rig_core", role: "Parallel build and artifact lane", capabilities: ["modal", "build", "artifacts", "logs"], invocationPath: "claude-model modal-build-farm", status: "idle" },
  { id: "modal-review-gate", name: "Review Gate", category: "rig_core", role: "Correctness and merge-readiness lane", capabilities: ["modal", "review", "risk", "quality"], invocationPath: "claude-model modal-review-gate", status: "idle" },
  { id: "modal-security-sentinel", name: "Security Sentinel", category: "rig_core", role: "AppSec, secret, and compliance lane", capabilities: ["modal", "security", "appsec", "compliance"], invocationPath: "claude-model modal-security-sentinel", status: "idle" },
  { id: "modal-refactor-foundry", name: "Refactor Foundry", category: "rig_core", role: "AST refactor and migration lane", capabilities: ["modal", "refactor", "codemod", "migration"], invocationPath: "claude-model modal-refactor-foundry", status: "idle" },
  { id: "modal-ux-lab", name: "UX Lab", category: "rig_core", role: "Frontend, accessibility, and visual QA lane", capabilities: ["modal", "frontend", "accessibility", "screenshots"], invocationPath: "claude-model modal-ux-lab", status: "idle" },
  { id: "modal-docs-proof", name: "Docs Proof", category: "rig_core", role: "Docs, changelog, and ProofPacket lane", capabilities: ["modal", "docs", "proofpacket", "handoff"], invocationPath: "claude-model modal-docs-proof", status: "idle" },
  { id: "codex", name: "Codex CLI", category: "rig_core", role: "Verifier & builder", capabilities: ["compile", "test", "verify", "package"], invocationPath: "codex", status: "active" },
  { id: "openclaw", name: "OpenClaw / Jake", category: "rig_core", role: "Execution router", capabilities: ["route", "skills", "dispatch"], invocationPath: "openclaw", status: "active" },
  { id: "picode", name: "PiCode / PyCode", category: "rig_core", role: "Deterministic machinery", capabilities: ["python", "deterministic", "schemas"], invocationPath: "picode", status: "idle" },
  { id: "jarvis", name: "Jarvis", category: "rig_core", role: "Voice & automation", capabilities: ["voice", "automation", "macos"], invocationPath: "jarvis", status: "idle" },
];

// ── Agency Agents (232 specs) ───────────────────────────────────────
export function loadAgencyAgents(): AgentEntry[] {
  return [{ id: "agency-placeholder", name: "232 Agency Agents", category: "agency", role: "232 installable Agency specs", capabilities: [], invocationPath: "/Users/rig128gb/Developer/agency-agents", status: "unloaded" }];
}

// ── RIG Domain Experts (86) ─────────────────────────────────────────
export function loadRigExperts(): AgentEntry[] {
  return [{ id: "rig-expert-placeholder", name: "86 RIG Domain Experts", category: "rig_expert", role: "Backend, GTM, security, product, UI/UX, DevOps, finance, BA, content", capabilities: [], invocationPath: "~/.cursor/rules/rig-*.mdc", status: "unloaded" }];
}

// ── VoltAgent Subagents ─────────────────────────────────────────────
export function loadVoltAgents(): AgentEntry[] {
  return [{ id: "voltagent-placeholder", name: "30+ VoltAgent Subagents", category: "voltagent", role: "Codex subagents for development", capabilities: [], invocationPath: "~/.codex/agents/voltagent-*.toml", status: "unloaded" }];
}

// ── Full Fleet ──────────────────────────────────────────────────────
export function getFullFleet(): AgentEntry[] {
  return [
    ...RIG_CORE_AGENTS,
    ...loadAgencyAgents(),
    ...loadRigExperts(),
    ...loadVoltAgents(),
  ];
}

export function getFleetStats() {
  const fleet = getFullFleet();
  const byCategory = {
    rig_core: fleet.filter((a) => a.category === "rig_core").length,
    agency: fleet.filter((a) => a.category === "agency").length,
    rig_expert: fleet.filter((a) => a.category === "rig_expert").length,
    voltagent: fleet.filter((a) => a.category === "voltagent").length,
  };
  const byStatus = {
    active: fleet.filter((a) => a.status === "active").length,
    idle: fleet.filter((a) => a.status === "idle").length,
    errored: fleet.filter((a) => a.status === "errored").length,
    unloaded: fleet.filter((a) => a.status === "unloaded").length,
  };
  return { total: fleet.length, byCategory, byStatus };
}

// ── Fleet Router: pick best agent for a task ────────────────────────
export function routeAgent(task: string): AgentEntry[] {
  const taskLower = task.toLowerCase();
  const fleet = getFullFleet();

  const scores = fleet.map((agent) => {
    let score = 0;
    const text = `${agent.name} ${agent.role} ${agent.capabilities.join(" ")}`.toLowerCase();
    taskLower.split(/\s+/).forEach((word) => {
      if (text.includes(word)) score += 1;
    });
    if (agent.status === "active") score += 0.5;
    return { agent, score };
  });

  return scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.agent);
}
