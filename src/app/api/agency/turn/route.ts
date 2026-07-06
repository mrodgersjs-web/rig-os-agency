// ── RIG OS Agency — Marathon Turn API ────────────────────────────────
// Returns the current marathon turn number from ~/.rig/state/marathon-turn.txt
// so the GTM Engine and other surfaces can show live campaign progress.

import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TURN_FILE = "/Users/rig128gb/.rig/state/marathon-turn.txt";
const PROOFS_DIR = "/Users/rig128gb/.rig/state/marathon-proofs";
const COUNTERS_FILE = "/Users/rig128gb/.rig/state/counters.txt";

function safeRead(path: string): string {
  try {
    if (!existsSync(path)) return "";
    return readFileSync(path, "utf-8").trim();
  } catch {
    return "";
  }
}

function safeReadJson<T = any>(path: string): T | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function safeList(path: string): string[] {
  try {
    if (!existsSync(path)) return [];
    const { readdirSync } = require("fs");
    return readdirSync(path);
  } catch {
    return [];
  }
}

export async function GET() {
  const raw = safeRead(TURN_FILE);
  const turn = parseInt(raw, 10);
  const valid = Number.isFinite(turn) && turn > 0;

  const proofFiles = safeList(PROOFS_DIR).filter((f) => f.endsWith(".sha256"));
  const lastProof = proofFiles.sort().reverse()[0] || null;

  const counters = safeReadJson<Record<string, any>>(COUNTERS_FILE);

  return NextResponse.json({
    turn: valid ? turn : 0,
    target: 1000,
    remaining: valid ? Math.max(0, 1000 - turn) : 1000,
    progress: valid ? (turn / 1000) * 100 : 0,
    turnFile: TURN_FILE,
    lastProof: lastProof,
    proofCount: proofFiles.length,
    counters: counters || null,
    real: valid,
    timestamp: new Date().toISOString(),
  });
}
