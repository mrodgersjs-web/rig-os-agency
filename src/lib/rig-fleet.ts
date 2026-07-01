// ── RIG OS Agency — Agent Fleet Registry ───────────────────────────
// 232 Agency Agents + 86 RIG domain experts + VoltAgent subagents + 6 RIG core
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