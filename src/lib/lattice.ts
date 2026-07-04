// RIG 3D Lattice Runtime
// Coordinate: L{level}-D{diamond}-A{mode}-{step}
// Level L1-L7, Diamond D1-D3, Mode A1-A4, Step I1/Q1/R/S/Q2/P/I2

import { promises as fs } from "fs";
import path from "path";

export type LatticeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type LatticeDiamond = 1 | 2 | 3;
export type LatticeMode = 1 | 2 | 3 | 4;
export type LatticeStep = "I1" | "Q1" | "R" | "S" | "Q2" | "P" | "I2";

export interface LatticeCoordinate {
  level: LatticeLevel;
  diamond: LatticeDiamond;
  mode: LatticeMode;
  step: LatticeStep;
}

export interface ProofPacket {
  runId: string;
  coordinate: LatticeCoordinate;
  intent: string;
  artifact?: { path: string; hash?: string };
  sources: { uri: string; range?: string }[];
  gates: { name: string; status: "PASS" | "FAIL" | "SKIPPED"; headline: string }[];
  verdict: "GO" | "NO-GO" | "BLOCKED";
  timestamp: string;
}

export interface Mission {
  id: string;
  intent: string;
  coordinate: LatticeCoordinate;
  context?: Record<string, any>;
  status: "running" | "paused" | "done" | "blocked";
  packets: ProofPacket[];
}

const STEP_ORDER: LatticeStep[] = ["I1", "Q1", "R", "S", "Q2", "P", "I2"];

export function parseCoordinate(coord: string): LatticeCoordinate | null {
  const m = coord.match(/^L(\d)-D(\d)-A(\d)-(I1|Q1|R|S|Q2|P|I2)$/);
  if (!m) return null;
  return {
    level: Number(m[1]) as LatticeLevel,
    diamond: Number(m[2]) as LatticeDiamond,
    mode: Number(m[3]) as LatticeMode,
    step: m[4] as LatticeStep,
  };
}

export function formatCoordinate(c: LatticeCoordinate): string {
  return `L${c.level}-D${c.diamond}-A${c.mode}-${c.step}`;
}

export function nextStep(step: LatticeStep): LatticeStep | null {
  const idx = STEP_ORDER.indexOf(step);
  return idx >= 0 && idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

export function modeName(mode: LatticeMode): string {
  return mode === 1 ? "A1 Python Only" : mode === 2 ? "A2 Hybrid" : mode === 3 ? "A3 Agent Bounded" : "A4 Strategic";
}

export function diamondName(diamond: LatticeDiamond): string {
  return diamond === 1 ? "Physical" : diamond === 2 ? "Cognitive" : "Nature";
}

// Persistence — JSON on disk, atomic writes
const DATA_DIR = path.join(process.cwd(), "data");
const MISSIONS_FILE = path.join(DATA_DIR, "lattice-missions.json");

let missions: Mission[] = [];
let loaded = false;
let writeLock: Promise<any> = Promise.resolve();

async function ensureDir(file: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
}

async function loadMissions(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await fs.readFile(MISSIONS_FILE, "utf-8");
    missions = JSON.parse(raw);
  } catch {
    missions = [];
  }
  loaded = true;
}

async function saveMissions(): Promise<void> {
  await ensureDir(MISSIONS_FILE);
  const tmp = MISSIONS_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(missions, null, 2));
  await fs.rename(tmp, MISSIONS_FILE);
}

function queueWrite(): Promise<void> {
  writeLock = writeLock.then(() => saveMissions()).catch(() => saveMissions());
  return writeLock;
}

export async function initLattice(): Promise<void> {
  await loadMissions();
}

export function createMission(intent: string, coordinate: LatticeCoordinate, context?: Record<string, any>): Mission {
  if (!loaded) loadMissions();
  const mission: Mission = {
    id: `mission-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    intent,
    coordinate,
    context,
    status: "running",
    packets: [],
  };
  missions.push(mission);
  void queueWrite();
  return mission;
}

export function getMission(id: string): Mission | undefined {
  if (!loaded) void loadMissions();
  return missions.find((m) => m.id === id);
}

export function getMissions(): Mission[] {
  if (!loaded) void loadMissions();
  return [...missions];
}

export function sealPacket(missionId: string, packet: Omit<ProofPacket, "runId" | "timestamp">): ProofPacket {
  const mission = getMission(missionId);
  if (!mission) throw new Error("mission not found");
  const full: ProofPacket = {
    ...packet,
    runId: mission.id,
    timestamp: new Date().toISOString(),
  };
  mission.packets.push(full);
  void queueWrite();
  return full;
}

export function advanceMission(missionId: string): Mission {
  const mission = getMission(missionId);
  if (!mission) throw new Error("mission not found");
  const next = nextStep(mission.coordinate.step);
  if (next) {
    mission.coordinate = { ...mission.coordinate, step: next };
  } else {
    mission.status = "done";
  }
  void queueWrite();
  return mission;
}

export function blockMission(missionId: string, reason: string): Mission {
  const mission = getMission(missionId);
  if (!mission) throw new Error("mission not found");
  mission.status = "blocked";
  sealPacket(missionId, {
    coordinate: mission.coordinate,
    intent: mission.intent,
    sources: [],
    gates: [{ name: "block", status: "FAIL", headline: reason }],
    verdict: "NO-GO",
  });
  void queueWrite();
  return mission;
}

export function approveMission(missionId: string): Mission {
  const mission = getMission(missionId);
  if (!mission) throw new Error("mission not found");
  if (mission.status !== "blocked") throw new Error("mission is not blocked");
  mission.status = "running";
  void queueWrite();
  return mission;
}

// A1/A2/A3/A4 executor registry
export type A1Handler = (input: any) => any | Promise<any>;
export type A2Handler = (input: any) => Promise<{ result: any; schema: any }>;
export type A3Handler = (input: any, tools: string[]) => Promise<any>;
export type A4Handler = (input: any) => Promise<{ recommendation: string; confidence: number; risks: string[] }>;

const registry: {
  a1: Map<string, A1Handler>;
  a2: Map<string, A2Handler>;
  a3: Map<string, A3Handler>;
  a4: Map<string, A4Handler>;
} = {
  a1: new Map(),
  a2: new Map(),
  a3: new Map(),
  a4: new Map(),
};

export function registerA1(name: string, handler: A1Handler) { registry.a1.set(name, handler); }
export function registerA2(name: string, handler: A2Handler) { registry.a2.set(name, handler); }
export function registerA3(name: string, handler: A3Handler) { registry.a3.set(name, handler); }
export function registerA4(name: string, handler: A4Handler) { registry.a4.set(name, handler); }

export function getA1(name: string) { return registry.a1.get(name); }
export function getA2(name: string) { return registry.a2.get(name); }
export function getA3(name: string) { return registry.a3.get(name); }
export function getA4(name: string) { return registry.a4.get(name); }

export function listRegistry() {
  return {
    a1: Array.from(registry.a1.keys()),
    a2: Array.from(registry.a2.keys()),
    a3: Array.from(registry.a3.keys()),
    a4: Array.from(registry.a4.keys()),
  };
}
