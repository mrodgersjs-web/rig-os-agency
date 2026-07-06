import { NextResponse } from "next/server";
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Sources ────────────────────────────────────────────────────────────
// Real on-disk artifacts that document agent activity.
const SOURCES: { agent: string; glob: string; max: number; parser?: (raw: string) => string }[] = [
  {
    agent: "openclaw",
    glob: path.join(os.homedir(), ".openclaw", "state", "*.sqlite"),
    max: 0, // not a log file — handled separately
  },
  {
    agent: "openclaw",
    glob: path.join(os.homedir(), ".openclaw", "logs", "*.log"),
    max: 30,
  },
  {
    agent: "openclaw",
    glob: path.join(os.homedir(), ".openclaw", "outbox", "*.json"),
    max: 20,
  },
  {
    agent: "hermes",
    glob: path.join(os.homedir(), ".hermes", "logs", "*.log"),
    max: 30,
  },
  {
    agent: "hermes",
    glob: path.join(os.homedir(), ".hermes", "cache", "*.json"),
    max: 20,
  },
  {
    agent: "claude",
    glob: path.join(os.homedir(), ".claude", "logs", "*.log"),
    max: 30,
  },
  {
    agent: "claude",
    glob: path.join(os.homedir(), ".claude", "sessions", "*.json"),
    max: 20,
    parser: (raw) => {
      try {
        const j = JSON.parse(raw);
        const lines: string[] = [];
        if (j.summary) lines.push(`session: ${j.summary}`);
        if (j.last_message) lines.push(`last: ${String(j.last_message).slice(0, 200)}`);
        if (j.tool_calls) lines.push(`tools: ${j.tool_calls.length} calls`);
        if (Array.isArray(j.messages)) lines.push(`messages: ${j.messages.length}`);
        return lines.join(" | ");
      } catch {
        return raw.slice(0, 200);
      }
    },
  },
  {
    agent: "codex",
    glob: path.join(os.homedir(), ".codex", "logs", "*.log"),
    max: 30,
  },
  {
    agent: "codex",
    glob: path.join(os.homedir(), ".codex", "cache", "*.json"),
    max: 20,
  },
  {
    agent: "rig",
    glob: path.join(os.homedir(), "Developer", "rig-os-agency", "proof", "*.json"),
    max: 15,
    parser: (raw) => {
      try {
        const j = JSON.parse(raw);
        if (j.intent) return `[${j.coordinate ?? "?"}] ${j.intent}`;
        if (j.status) return `status: ${j.status}`;
        return raw.slice(0, 200);
      } catch {
        return raw.slice(0, 200);
      }
    },
  },
  {
    agent: "rig",
    glob: path.join(os.homedir(), "Developer", "rig-gtm-studio-v2", "proof", "outbound", "*SENT*.json"),
    max: 15,
    parser: (raw) => {
      try {
        const j = JSON.parse(raw);
        const lines: string[] = [];
        if (j.angle) lines.push(`angle: ${j.angle}`);
        if (typeof j.sent_count === "number") lines.push(`sent: ${j.sent_count}`);
        if (j.dry_run !== undefined) lines.push(j.dry_run ? "dry-run" : "live");
        return lines.join(" | ") || raw.slice(0, 200);
      } catch {
        return raw.slice(0, 200);
      }
    },
  },
];

interface Entry {
  ts: number;
  agent: string;
  text: string;
  level?: "info" | "warn" | "err";
  source?: string;
}

function classify(text: string): "info" | "warn" | "err" {
  if (/error|fail|exception|panic|fatal|crash|reject/i.test(text)) return "err";
  if (/warn|warning|deprecat|retry|timeout|slow|throttl/i.test(text)) return "warn";
  return "info";
}

async function tailFile(
  file: string,
  agent: string,
  max = 20,
  parser?: (raw: string) => string,
): Promise<Entry[]> {
  try {
    const st = await stat(file);
    const data = await readFile(file, "utf8");
    const lines = data
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // If it's a single-line JSON file, treat as one entry
    const isJson = file.endsWith(".json");
    let toEmit: { ts: number; text: string }[];
    if (isJson && lines.length === 1) {
      toEmit = [{ ts: st.mtimeMs, text: parser ? parser(lines[0]) : lines[0] }];
    } else {
      toEmit = lines.slice(-max).map((line, i) => ({
        ts: st.mtimeMs - (lines.length - i) * 200,
        text: line.length > 400 ? line.slice(0, 400) + "…" : line,
      }));
    }

    return toEmit.map((e) => {
      const text = e.text;
      return {
        ts: e.ts,
        agent,
        text,
        level: classify(text),
        source: file.replace(os.homedir(), "~"),
      };
    });
  } catch {
    return [];
  }
}

async function listSourceFiles(glob: string): Promise<string[]> {
  try {
    // Glob pattern: dirname/*.ext — split on the literal "/*."
    const match = glob.match(/^(.+)\/\*\.([a-z]+)$/);
    if (!match) return [];
    const dir = match[1];
    const ext = match[2];
    if (!existsSync(dir)) return [];
    const items = await readdir(dir);
    return items
      .filter((f) => f.endsWith("." + ext) && !f.startsWith("."))
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10) || 200, 500);
  const agentFilter = url.searchParams.get("agent");

  const out: Entry[] = [];
  for (const src of SOURCES) {
    const files = await listSourceFiles(src.glob);
    for (const f of files.slice(0, 5)) {
      const entries = await tailFile(f, src.agent, src.max, src.parser);
      out.push(...entries);
    }
  }

  // Sort newest-first
  out.sort((a, b) => b.ts - a.ts);

  const filtered = agentFilter
    ? out.filter((e) => e.agent === agentFilter)
    : out;

  // Aggregate counts for the page UI
  const byAgent: Record<string, number> = {};
  const byLevel: Record<string, number> = { info: 0, warn: 0, err: 0 };
  for (const e of filtered) {
    byAgent[e.agent] = (byAgent[e.agent] ?? 0) + 1;
    const lvl = e.level ?? "info";
    byLevel[lvl] = (byLevel[lvl] ?? 0) + 1;
  }

  return NextResponse.json({
    entries: filtered.slice(0, limit),
    total: filtered.length,
    byAgent,
    byLevel,
    sources: SOURCES.map((s) => ({ agent: s.agent, pattern: s.glob.replace(os.homedir(), "~") })),
    timestamp: new Date().toISOString(),
  });
}