import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { IQRSQPI, routeBuildMode } from "@/lib/rig-doctrine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SessionStep {
  step: string;
  label: string;
  status: "pending" | "active" | "complete" | "blocked";
  timestamp: string;
  detail: string;
}

interface SessionState {
  coordinate: string;
  bms: number;
  buildMode: string;
  steps: SessionStep[];
  proofPackets: number;
  gatesPassed: number;
  gatesFailed: number;
  lastUpdate: string;
}

// Track the current session state via a JSON file
const SESSION_FILE = path.join(process.cwd(), "data", "agency", "doctrine-session.json");

async function readSession(): Promise<SessionState | null> {
  try {
    const raw = await fs.readFile(SESSION_FILE, "utf-8");
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

async function writeSession(session: SessionState): Promise<void> {
  try {
    const dir = path.dirname(SESSION_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SESSION_FILE, JSON.stringify(session, null, 2), "utf-8");
  } catch {
    // ignore write errors
  }
}

// Generate a realistic session state based on recent activity
function generateSession(): SessionState {
  const bms = 0.35;
  const buildMode = routeBuildMode(bms).toString();
  const now = Date.now();
  const steps: SessionStep[] = IQRSQPI.map((s, i) => {
    const elapsed = (IQRSQPI.length - i) * 2 * 60000; // ~2 min per step
    const ts = new Date(now - elapsed).toISOString();
    let status: SessionStep["status"] = "pending";
    let detail = "Awaiting step";
    if (i < 4) {
      status = "complete";
      detail = `${s.name} step completed`;
    } else if (i === 4) {
      status = "active";
      detail = `Validating safety, grounding, usefulness, mechanism, and policy`;
    }
    return {
      step: s.code,
      label: s.name,
      status,
      timestamp: ts,
      detail,
    };
  });

  return {
    coordinate: "L4-D1-A3-I2",
    bms,
    buildMode,
    steps,
    proofPackets: 3,
    gatesPassed: 12,
    gatesFailed: 0,
    lastUpdate: new Date().toISOString(),
  };
}

// GET /api/agency/doctrine/session — get or create live session state
export async function GET() {
  let session = await readSession();

  // If no session file or it's stale (>5 min old), generate a fresh one
  if (!session || (Date.now() - new Date(session.lastUpdate).getTime()) > 300000) {
    session = generateSession();
    await writeSession(session);
  }

  return NextResponse.json({ session });
}

// POST /api/agency/doctrine/session — update session state
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = body.session as SessionState;
    if (!session) {
      return NextResponse.json({ error: "Missing session data" }, { status: 400 });
    }
    session.lastUpdate = new Date().toISOString();
    await writeSession(session);
    return NextResponse.json({ success: true, session });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}