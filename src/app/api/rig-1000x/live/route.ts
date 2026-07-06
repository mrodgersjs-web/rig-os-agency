import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { execSync } from "child_process";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CronLine {
  ts: string;
  job: string;
  cycle: string;
  preview: string;
  file: string;
}
interface CronFeed {
  total: number;
  lastTs: string | null;
  lines: CronLine[];
}
interface VitalsSummary {
  ok: number;
  total: number;
  clis: { name: string; ok: boolean; version?: string }[];
}
interface LiveState {
  load: { l1: number; l5: number; l15: number } | null;
  disk: { usedPct: number; free: string; total: string } | null;
  uptime: string | null;
  marathonTurn: number | null;
  cron: CronFeed | null;
  vitals: VitalsSummary | null;
  ts: string;
}

// Live signals for /rig-1000x page. Cache for 6s to keep dashboard snappy
// without hammering the filesystem / spawning subprocesses every tick.

const CACHE_TTL_MS = 6000;
let cached: { ts: number; body: unknown } | null = null;

function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 3000, encoding: "utf-8" }).toString();
  } catch {
    return "";
  }
}

async function getLoad() {
  const out = safeExec("uptime");
  const m = out.match(/load averages?:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return null;
  return { l1: parseFloat(m[1]), l5: parseFloat(m[2]), l15: parseFloat(m[3]) };
}

async function getDisk() {
  const out = safeExec("df -h /");
  const lines = out.trim().split("\n");
  if (lines.length < 2) return null;
  // macOS df: Filesystem Size Used Avail Capacity iused ifree %iused Mounted
  const cols = lines[1].split(/\s+/);
  // Find percent column (the one with %)
  const pctCol = cols.find((c) => c.endsWith("%"));
  const usedPct = pctCol ? parseInt(pctCol.replace("%", ""), 10) : 0;
  // Size and Avail are typically cols[1] and [3] on macOS df -h
  return {
    usedPct: isNaN(usedPct) ? 0 : usedPct,
    total: cols[1] ?? "?",
    free: cols[3] ?? "?",
  };
}

function getUptime() {
  const out = safeExec("uptime");
  // macOS uptime: "10:03  up 8 days,  2:56, 8 users, ..."
  const m = out.match(/up\s+(.+?),\s+\d+\s+user/);
  return m ? m[1].trim() : null;
}

async function getMarathonTurn() {
  const p = path.join(
    process.env.HOME || "/Users/rig128gb",
    ".rig/state/marathon-turn.txt",
  );
  try {
    const t = (await fs.readFile(p, "utf-8")).trim();
    const n = parseInt(t, 10);
    return isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

async function getCronFeed(): Promise<CronFeed> {
  const dir = path.join(
    process.env.HOME || "/Users/rig128gb",
    ".hermes/cron/output",
  );
  let files: string[] = [];
  try {
    files = (await fs.readdir(dir))
      .filter((f) => f.endsWith(".txt"))
      .map((f) => path.join(dir, f));
  } catch {
    return { total: 0, lastTs: null, lines: [] };
  }

  // Sort by mtime desc, take latest 8
  const stats = await Promise.all(
    files.map(async (f) => {
      try {
        const s = await fs.stat(f);
        return { f, mtime: s.mtime };
      } catch {
        return null;
      }
    }),
  );
  const sorted = (stats.filter(Boolean) as { f: string; mtime: Date }[])
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
    .slice(0, 8);

  const lines: CronLine[] = [];
  for (const { f, mtime } of sorted) {
    try {
      const raw = await fs.readFile(f, "utf-8");
      const preview = raw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(" · ")
        .slice(0, 220);
      const base = path.basename(f);
      const jobMatch = base.match(/^([a-f0-9]+)_(\d{8}_\d{6})\.txt$/);
      const jobId = jobMatch ? jobMatch[1].slice(0, 8) : "cron";
      const ts = jobMatch
        ? `${jobMatch[2].slice(0, 4)}-${jobMatch[2].slice(4, 6)}-${jobMatch[2].slice(6, 8)} ${jobMatch[2].slice(9, 11)}:${jobMatch[2].slice(11, 13)}:${jobMatch[2].slice(13, 15)}`
        : mtime.toISOString().slice(0, 19).replace("T", " ");
      lines.push({
        ts,
        job: jobId,
        cycle: `mtime ${Math.round((Date.now() - mtime.getTime()) / 60000)}m`,
        preview: preview || "(empty)",
        file: base,
      });
    } catch {
      // skip unreadable
    }
  }

  return {
    total: files.length,
    lastTs: lines[0]?.ts ?? null,
    lines,
  };
}

async function getVitalsSummary(): Promise<VitalsSummary> {
  const clis = ["claude", "openclaw", "hermes", "gemini", "antigravity"];
  const results = await Promise.all(
    clis.map(async (name) => {
      try {
        const cmd =
          name === "openclaw"
            ? `openclaw health 2>&1 | head -1`
            : name === "hermes"
              ? `hermes status 2>&1 | head -1`
              : `${name} --version 2>&1 | head -1`;
        const out = safeExec(cmd).trim();
        const version = out.match(/(\d+\.\d+\.\d+)/)?.[1] ?? out.slice(0, 24);
        return { name, ok: out.length > 0, version };
      } catch {
        return { name, ok: false };
      }
    }),
  );
  return {
    ok: results.filter((r) => r.ok).length,
    total: results.length,
    clis: results,
  };
}

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.body, {
      headers: { "X-Live-Cache": "hit" },
    });
  }

  const [load, disk, marathonTurn, cron] = await Promise.all([
    getLoad(),
    getDisk(),
    getMarathonTurn(),
    getCronFeed(),
  ]);
  const uptime = getUptime();
  const vitals = await getVitalsSummary();

  const body: LiveState = {
    load,
    disk,
    uptime,
    marathonTurn,
    cron,
    vitals,
    ts: new Date().toISOString(),
  };

  cached = { ts: now, body };
  return NextResponse.json(body);
}