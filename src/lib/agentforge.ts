// src/lib/agentforge.ts
// AgentForge-style workflow gate validator for every RIG OS action.
// Every action must pass intent-lock, bms-mode, source-required, approval-gate,
// proof-required, anti-generic-score, and physics-breach before integration.

export interface AgentForgeGate {
  name: string;
  status: "PASS" | "FAIL" | "SKIPPED";
  headline: string;
  required: boolean;
}

export interface AgentForgeVerdict {
  go: boolean;
  coordinate?: string;
  gates: AgentForgeGate[];
  antiGenericScore: number;
  physicsBreaches: string[];
  blockReason?: string;
}

export type ActionRisk = "read" | "write" | "external" | "destructive" | "payment";

const DESTRUCTIVE_ACTIONS = new Set(["delete", "remove", "drop", "cancel", "refund", "revoke", "terminate", "kill"]);
const EXTERNAL_ACTIONS = new Set(["send", "email", "post", "publish", "deploy", "push", "merge", "purchase", "buy"]);
const PAYMENT_ACTIONS = new Set(["charge", "invoice", "pay", "purchase", "refund"]);

function classifyRisk(scope: string, action: string): ActionRisk {
  const key = `${scope}.${action}`.toLowerCase();
  if (PAYMENT_ACTIONS.has(action.toLowerCase()) || key.includes("stripe")) return "payment";
  if (DESTRUCTIVE_ACTIONS.has(action.toLowerCase())) return "destructive";
  if (EXTERNAL_ACTIONS.has(action.toLowerCase())) return "external";
  if (["write", "update", "create", "assign", "delegate", "complete"].includes(action.toLowerCase())) return "write";
  return "read";
}

export function evaluateAgentForgeGate(input: {
  scope: string;
  action: string;
  id?: string;
  payload?: Record<string, any>;
  bmsMode?: "A1" | "A2" | "A3" | "A4";
  intent?: string;
  sourceUris?: string[];
  proofPacket?: { runId?: string; verdict?: string } | null;
  approved?: boolean;
  antiGenericScore?: number;
}): AgentForgeVerdict {
  const {
    scope,
    action,
    bmsMode = "A1",
    intent = "",
    sourceUris = [],
    proofPacket = null,
    approved = false,
    antiGenericScore = 85,
  } = input;

  const risk = classifyRisk(scope, action);
  const gates: AgentForgeGate[] = [];

  // 1. Intent lock
  gates.push({
    name: "intent-lock",
    status: intent.trim().length >= 3 ? "PASS" : "FAIL",
    headline: intent.trim().length >= 3 ? `Intent locked: ${intent.slice(0, 40)}` : "Intent missing or too short",
    required: true,
  });

  // 2. BMS mode appropriate for risk
  const bmsRequired = risk === "read" ? "A1" : risk === "write" ? "A2" : "A3";
  gates.push({
    name: "bms-mode",
    status: ["A1", "A2", "A3", "A4"].indexOf(bmsMode) >= ["A1", "A2", "A3", "A4"].indexOf(bmsRequired) ? "PASS" : "FAIL",
    headline: `Action risk=${risk}; required BMS >= ${bmsRequired}, got ${bmsMode}`,
    required: true,
  });

  // 3. Source-per-claim (required for external/destructive)
  gates.push({
    name: "source-required",
    status: risk === "read" || risk === "write" || sourceUris.length > 0 ? "PASS" : "FAIL",
    headline: risk === "read" || risk === "write" || sourceUris.length > 0
      ? `Sources: ${sourceUris.length} provided`
      : "External/destructive action requires source URIs",
    required: risk === "external" || risk === "destructive" || risk === "payment",
  });

  // 4. Approval gate
  const requiresApproval = risk === "external" || risk === "destructive" || risk === "payment";
  gates.push({
    name: "approval-gate",
    status: requiresApproval ? (approved ? "PASS" : "FAIL") : "SKIPPED",
    headline: requiresApproval
      ? approved ? "Approval received" : "Requires explicit approval"
      : "No approval needed for read/write",
    required: requiresApproval,
  });

  // 5. Proof packet
  gates.push({
    name: "proof-required",
    status: proofPacket?.runId ? "PASS" : "SKIPPED",
    headline: proofPacket?.runId ? `Proof packet ${proofPacket.runId}` : "No proof packet supplied (optional)",
    required: false,
  });

  // 6. Anti-generic score
  const antiGenericPass = antiGenericScore >= 80;
  gates.push({
    name: "anti-generic",
    status: antiGenericPass ? "PASS" : "FAIL",
    headline: `AntiGenericForce=${antiGenericScore}; threshold 80`,
    required: true,
  });

  // 7. Physics breach check
  const physicsBreaches: string[] = [];
  if (risk === "destructive" && !approved) physicsBreaches.push("destructive action without approval violates Gate-D");
  if (risk === "external" && !sourceUris.length) physicsBreaches.push("external action without sources violates No Source No Number");
  if (risk === "payment" && !approved) physicsBreaches.push("payment action requires approval and receipt artifact");
  gates.push({
    name: "physics-breach",
    status: physicsBreaches.length === 0 ? "PASS" : "FAIL",
    headline: physicsBreaches.length === 0 ? "No physics breaches" : physicsBreaches.join("; "),
    required: true,
  });

  const blocking = gates.filter((g) => g.required && g.status === "FAIL");
  const go = blocking.length === 0 && physicsBreaches.length === 0 && antiGenericPass;

  return {
    go,
    gates,
    antiGenericScore,
    physicsBreaches,
    blockReason: go ? undefined : blocking.map((g) => `${g.name}: ${g.headline}`).join("; ") || physicsBreaches.join("; "),
  };
}

export function agentForgeFromLattice(mission: { coordinate: { level: number; diamond: number; mode: number; step: string }; status: string; packets: any[] } | undefined): {
  bmsMode: "A1" | "A2" | "A3" | "A4";
  coordinate: string;
  lastVerdict?: string;
} {
  if (!mission) return { bmsMode: "A1", coordinate: "L1-D1-A1-I1" };
  const mode = mission.coordinate.mode;
  const bmsMode = mode === 1 ? "A1" : mode === 2 ? "A2" : mode === 3 ? "A3" : "A4";
  const coordinate = `L${mission.coordinate.level}-D${mission.coordinate.diamond}-A${mission.coordinate.mode}-${mission.coordinate.step}`;
  const lastPacket = mission.packets[mission.packets.length - 1];
  return { bmsMode, coordinate, lastVerdict: lastPacket?.verdict };
}

export { classifyRisk };
