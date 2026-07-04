// src/lib/harness-runtime.ts
// Deterministic harness platform for RIG OS Agency.
// Maps each of the 50 goal loops to a sequence of lattice coordinates (IQRSQPI)
// and executes them with AgentForge workflow gates.

import { promises as fs } from "fs";
import path from "path";
import { GOAL_LOOPS, getGoalLoop, GoalLoop } from "./rig-harness";
import {
  LatticeCoordinate,
  createMission,
  advanceMission,
  blockMission,
  sealPacket,
} from "./lattice";
import { evaluateAgentForgeGate, agentForgeFromLattice } from "./agentforge";
import { runDeptForLoop, deptForLoop, DeptArtifact } from "./deptBridge";

export interface HarnessInstance {
  id: string;
  loopId: string;
  loopName: string;
  group: string;
  intent: string;
  status: "idle" | "running" | "paused" | "done" | "blocked";
  currentStepIndex: number;
  steps: HarnessStep[];
  createdAt: string;
  updatedAt: string;
  context?: Record<string, any>;
}

export interface HarnessStep {
  index: number;
  coordinate: LatticeCoordinate;
  stepName: LatticeStepName;
  intent: string;
  status: "pending" | "running" | "done" | "blocked" | "skipped";
  missionId?: string;
  result?: any;
  error?: string;
}

type LatticeStepName = "I1" | "Q1" | "R" | "S" | "Q2" | "P" | "I2";

const DATA_DIR = path.join(process.cwd(), "data");
const HARNESS_FILE = path.join(DATA_DIR, "harness-instances.json");

let instances: HarnessInstance[] = [];
let loaded = false;
let writeLock: Promise<any> = Promise.resolve();

async function ensureDir(file: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
}

async function loadHarnesses(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await fs.readFile(HARNESS_FILE, "utf-8");
    instances = JSON.parse(raw);
  } catch {
    instances = [];
  }
  loaded = true;
}

async function saveHarnesses(): Promise<void> {
  await ensureDir(HARNESS_FILE);
  await fs.writeFile(HARNESS_FILE, JSON.stringify(instances, null, 2), "utf-8");
}

function queueWrite(): Promise<void> {
  writeLock = writeLock.then(() => saveHarnesses().catch(() => {}));
  return writeLock;
}

export async function initHarness(): Promise<void> {
  await loadHarnesses();
}

export function listGoalLoops(): GoalLoop[] {
  return GOAL_LOOPS;
}

// Map loop group to a default lattice anchor
function getHarnessCoordinates(loop: GoalLoop): LatticeCoordinate[] {
  const makeSteps = (anchor: LatticeCoordinate): LatticeCoordinate[] => {
    const stepNames: LatticeStepName[] = ["I1", "Q1", "R", "S", "Q2", "P", "I2"];
    return stepNames.map((step, idx) => ({
      ...anchor,
      step,
      level: Math.min(7, Math.max(1, anchor.level + (idx < 3 ? 0 : idx < 5 ? 1 : 2))) as LatticeCoordinate["level"],
    }));
  };

  const anchorMap: Record<string, { level: number; diamond: number; mode: number }> = {
    "48gb": { level: 3, diamond: 2, mode: 2 },
    "96gb": { level: 4, diamond: 2, mode: 2 },
    "256gb": { level: 5, diamond: 2, mode: 3 },
    blackwell: { level: 6, diamond: 2, mode: 3 },
    "36gb": { level: 2, diamond: 2, mode: 2 },
  };

  const anchor = anchorMap[loop.anchor.toLowerCase()];
  if (!anchor) {
    return makeSteps({ level: 3, diamond: 2, mode: 2, step: "I1" });
  }
  return makeSteps({ level: anchor.level, diamond: anchor.diamond, mode: anchor.mode, step: "I1" });
}

export function createHarness(loopId: string, intent: string, context?: Record<string, any>): HarnessInstance {
  if (!loaded) void loadHarnesses();
  const loop = getGoalLoop(loopId);
  if (!loop) throw new Error(`Goal loop '${loopId}' not found`);

  const coords = getHarnessCoordinates(loop);
  const now = new Date().toISOString();
  const instance: HarnessInstance = {
    id: `harness-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    loopId: loop.name,
    loopName: loop.name,
    group: loop.group,
    intent,
    status: "idle",
    currentStepIndex: 0,
    steps: coords.map((c, i) => ({
      index: i,
      coordinate: c,
      stepName: c.step as LatticeStepName,
      intent: `${loop.name} — ${c.step}`,
      status: "pending",
    })),
    createdAt: now,
    updatedAt: now,
    context,
  };
  instances.push(instance);
  void queueWrite();
  return instance;
}

export function getHarness(id: string): HarnessInstance | undefined {
  if (!loaded) void loadHarnesses();
  return instances.find((h) => h.id === id);
}

export function listHarnesses(): HarnessInstance[] {
  if (!loaded) void loadHarnesses();
  return [...instances];
}

export function updateHarness(id: string, patch: Partial<HarnessInstance>): HarnessInstance {
  if (!loaded) void loadHarnesses();
  const idx = instances.findIndex((h) => h.id === id);
  if (idx === -1) throw new Error("harness not found");
  instances[idx] = { ...instances[idx], ...patch, updatedAt: new Date().toISOString() };
  void queueWrite();
  return instances[idx];
}

export async function runHarnessStep(harnessId: string, approved = false): Promise<HarnessInstance> {
  await initHarness();
  const harness = getHarness(harnessId);
  if (!harness) throw new Error("harness not found");

  if (harness.status === "done" || (harness.status === "blocked" && !approved)) {
    return harness;
  }

  if (harness.status === "blocked" && approved) {
    harness.status = "running";
  } else if (harness.status === "idle") {
    harness.status = "running";
  }

  const step = harness.steps[harness.currentStepIndex];
  if (!step) {
    harness.status = "done";
    return updateHarness(harnessId, { status: "done" });
  }

  step.status = "running";

  const stepMode: "A1" | "A2" | "A3" | "A4" =
    step.stepName === "I2" ? "A4" :
    step.coordinate.mode === 1 ? "A1" :
    step.coordinate.mode === 2 ? "A2" :
    step.coordinate.mode === 3 ? "A3" : "A4";

  const mission = createMission(step.intent, step.coordinate, harness.context);
  step.missionId = mission.id;

  // Per-step risk: only the I2 (integration) step can be outward. Its action follows the
  // intent — "deploy" if the mission is outward (deploy/publish/send/external/live/production),
  // else "integrate" (write). All other steps (I1/Q1/R/S/Q2/P) are internal reasoning/artifact
  // steps classified by their stepName — never poisoned by a deploy-flavored intent.
  const outwardRe = /\b(deploy|publish|send|external|live|production|push|merge)\b/i;
  const stepAction =
    step.stepName === "I2"
      ? (outwardRe.test(harness.intent) ? "deploy" : "integrate")
      : step.stepName;

  const forge = evaluateAgentForgeGate({
    scope: harness.group,
    action: stepAction,
    id: harness.id,
    bmsMode: stepMode,
    intent: harness.intent,
    sourceUris: harness.context?.sources || [],
    proofPacket: mission.packets[mission.packets.length - 1],
    approved,
    antiGenericScore: harness.context?.antiGenericScore || 85,
  });

  if (!forge.go) {
    blockMission(mission.id, forge.blockReason || "AgentForge gate blocked");
    step.status = "blocked";
    step.error = forge.blockReason;
    harness.status = "blocked";
    updateHarness(harnessId, { steps: harness.steps, status: "blocked" });
    return harness;
  }

  let result: any;
  switch (step.stepName) {
    case "I1":
      result = { locked: true, intent: harness.intent };
      break;
    case "Q1":
      result = { question: `What is the exact operational question for: ${harness.intent}?` };
      break;
    case "R":
      result = { sources: harness.context?.sources || ["/api/internal"], findings: [] };
      break;
    case "S": {
      // Real execution layer: any of the 50 loops mapped to one of the 7 real RIG
      // departments shells out to its frozen Python harness and seals a REAL hash-chained
      // ProofPacket (verify-artifact gate, GEV separation, 64-char SHA-256 chain). Loops
      // with no dept mapping keep an honest stub (realArtifact:false). Bridge failure
      // fails CLOSED — never falls back to a stub and claims S succeeded.
      const dept = deptForLoop(harness.loopId);
      if (dept) {
        let artifact: DeptArtifact;
        try {
          artifact = await runDeptForLoop(harness.loopId)!;
        } catch (e: any) {
          step.status = "blocked";
          step.error = `dept bridge failed (${dept}): ${e.message}`;
          harness.status = "blocked";
          updateHarness(harnessId, { steps: harness.steps, status: "blocked" });
          return harness;
        }
        result = {
          solution: `Real ${artifact.department} ProofPacket via ${dept} dept`,
          realArtifact: true,
          department: artifact.department,
          dept,
          verdict: artifact.verdict,
          finalHash: artifact.final_hash,
          nHops: artifact.n_hops,
          halted: artifact.halted,
          chainTip: artifact.hops[artifact.hops.length - 1]?.self_hash,
          bridgeSource: artifact.bridgeSource,
          hops: artifact.hops.map((h) => ({
            worker: h.worker,
            verdict: h.verdict,
            artifactHash: h.artifact_hash,
            selfHash: h.self_hash,
          })),
        };
      } else {
        result = {
          solution: `Produced artifact for ${harness.loopName}`,
          artifacts: [],
          realArtifact: false,
          note: "no dept mapped for this loop yet (honest stub, not a fake artifact)",
        };
      }
      break;
    }
    case "Q2":
      result = { gates: forge.gates, antiGenericScore: forge.antiGenericScore, physicsBreaches: forge.physicsBreaches };
      break;
    case "P":
      result = { packetId: mission.id, sealedAt: new Date().toISOString(), verdict: "GO" };
      break;
    case "I2":
      result = { integrated: true, nextAction: "complete" };
      break;
  }

  while (advanceMission(mission.id).status !== "done") {}
  sealPacket(mission.id, {
    coordinate: step.coordinate,
    intent: step.intent,
    sources: harness.context?.sources?.map((u: string) => ({ uri: u })) || [],
    gates: forge.gates.map((g) => ({ name: g.name, status: g.status, headline: g.headline })),
    verdict: "GO",
  });

  step.status = "done";
  step.result = result;
  harness.currentStepIndex += 1;

  if (harness.currentStepIndex >= harness.steps.length) {
    harness.status = "done";
  }

  updateHarness(harnessId, harness);
  return harness;
}

export async function runHarnessToDone(harnessId: string, approved = false): Promise<HarnessInstance> {
  let harness = getHarness(harnessId);
  if (!harness) throw new Error("harness not found");
  let safety = 0;
  // Enter the loop on idle/running, OR on blocked-only-if-approved (the resume-from-Gate-D case).
  // The old condition (status !== "blocked") made approve a no-op: the loop never ran when blocked,
  // so approval could never clear the I2 gate. This was the bug Hermes suspected but never verified.
  while (harness.status !== "done" && safety < 20 && !(harness.status === "blocked" && !approved)) {
    harness = await runHarnessStep(harnessId, approved);
    approved = false;
    safety++;
  }
  return harness;
}

export async function approveHarnessStep(harnessId: string): Promise<HarnessInstance> {
  const harness = getHarness(harnessId);
  if (!harness) throw new Error("harness not found");
  if (harness.status !== "blocked") return harness;
  return runHarnessToDone(harnessId, true);
}
