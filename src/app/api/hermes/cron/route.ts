import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

// Hermes cron observability for the System Status page.
// Runs `hermes cron list`, parses the box-drawing table, and returns a
// structured JSON payload with health signals:
//   - active_jobs, total_jobs, error_count
//   - jobs[] with id, name, schedule, last_run, last_status, next_run
//   - raw for debugging
//
// `hermes cron list` writes the box characters and a status line per job:
//   "    Last run:  2026-07-05T09:30:30.470289-06:00  error: Script timed out ..."
// or:
//   "    Last run:  2026-07-05T09:00:32.592766-06:00  ok"

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  next_run: string | null;
  last_run: string | null;
  last_status: "ok" | "error" | "never" | "unknown";
  script: string | null;
  deliver: string | null;
  repeat: string | null;
}

interface CronSummary {
  active_jobs: number;
  total_jobs: number;
  error_count: number;
  ok_count: number;
  never_run_count: number;
  schedule_mode: { cron: number; interval: number; other: number };
  next_up: CronJob | null;
  jobs: CronJob[];
}

interface CronResp {
  ok: boolean;
  timestamp: string;
  duration_ms: number;
  bin_resolved: boolean;
  summary: CronSummary;
  raw: string;
  error?: string;
}

const ACTIVE_RE = /^\s*([0-9a-f]+)\s+\[active\]/;
const NAME_RE = /^\s*Name:\s+(.+?)\s*$/;
const SCHEDULE_RE = /^\s*Schedule:\s+(.+?)\s*$/;
const NEXT_RE = /^\s*Next run:\s+(.+?)\s*$/;
const LAST_RE = /^\s*Last run:\s+(.+?)\s*$/;
const SCRIPT_RE = /^\s*Script:\s+(.+?)\s*$/;
const DELIVER_RE = /^\s*Deliver:\s+(.+?)\s*$/;
const REPEAT_RE = /^\s*Repeat:\s+(.+?)\s*$/;

function emptySummary(): CronSummary {
  return {
    active_jobs: 0,
    total_jobs: 0,
    error_count: 0,
    ok_count: 0,
    never_run_count: 0,
    schedule_mode: { cron: 0, interval: 0, other: 0 },
    next_up: null,
    jobs: [],
  };
}

function parseCron(raw: string): CronSummary {
  const lines = raw.split(/\r?\n/);
  const summary = emptySummary();
  let current: Partial<CronJob> | null = null;

  const flush = () => {
    if (!current || !current.id || !current.name) return;
    const job: CronJob = {
      id: current.id,
      name: current.name,
      schedule: current.schedule ?? "—",
      next_run: current.next_run ?? null,
      last_run: current.last_run ?? null,
      last_status: current.last_status ?? "unknown",
      script: current.script ?? null,
      deliver: current.deliver ?? null,
      repeat: current.repeat ?? null,
    };
    summary.jobs.push(job);
    summary.total_jobs += 1;
    if (current.last_status === "error") summary.error_count += 1;
    else if (current.last_status === "ok") summary.ok_count += 1;
    else if (current.last_status === "never") summary.never_run_count += 1;
  };

  for (const line of lines) {
    const idMatch = line.match(ACTIVE_RE);
    if (idMatch) {
      flush();
      current = { id: idMatch[1], last_status: "unknown" };
      summary.active_jobs += 1;
      continue;
    }
    if (!current) continue;

    const name = line.match(NAME_RE);
    if (name) { current.name = name[1]; continue; }

    const sched = line.match(SCHEDULE_RE);
    if (sched) {
      current.schedule = sched[1];
      if (/every\s+\d+m/.test(sched[1])) summary.schedule_mode.interval += 1;
      else if (sched[1].match(/[*\d]\s+[*\d]/)) summary.schedule_mode.cron += 1;
      else summary.schedule_mode.other += 1;
      continue;
    }

    const next = line.match(NEXT_RE);
    if (next) { current.next_run = next[1]; continue; }

    const last = line.match(LAST_RE);
    if (last) {
      const lastLine = last[1];
      current.last_run = lastLine;
      // Format: "<iso-timestamp>  ok" or "<iso-timestamp>  error: <reason>".
      // The status token sits at the END of the line, after the timestamp.
      if (/\bok\s*$/i.test(lastLine)) current.last_status = "ok";
      else if (/error\s*:/i.test(lastLine) || /\berror\s*$/i.test(lastLine)) current.last_status = "error";
      else current.last_status = "unknown";
      continue;
    }

    const script = line.match(SCRIPT_RE);
    if (script) { current.script = script[1]; continue; }

    const deliver = line.match(DELIVER_RE);
    if (deliver) { current.deliver = deliver[1]; continue; }

    const repeat = line.match(REPEAT_RE);
    if (repeat) { current.repeat = repeat[1]; continue; }
  }
  flush();

  // Find the next-up job by earliest next_run timestamp.
  const upcoming = summary.jobs
    .filter((j) => j.next_run)
    .sort((a, b) => Date.parse(a.next_run as string) - Date.parse(b.next_run as string));
  summary.next_up = upcoming[0] ?? null;

  return summary;
}

async function runHermesCron(): Promise<{ ok: boolean; stdout: string; stderr: string; code: number; duration: number; resolved: boolean }> {
  const home = process.env.HOME || "/Users/rig128gb";
  // Walk PATH so we pick the user's hermes install even when the Next.js
  // dev server's PATH is stripped.
  const hermesBin = `${home}/.local/bin/hermes`;
  return new Promise((resolve) => {
    const started = Date.now();
    let resolved = true;
    const child = spawn(hermesBin, ["cron", "list", "--all"], {
      cwd: home,
      env: {
        ...process.env,
        PATH: [
          "/usr/local/bin",
          "/opt/homebrew/bin",
          "/usr/bin",
          "/bin",
          `${home}/.local/bin`,
          `${home}/.hermes/node/bin`,
        ].join(":"),
        HOME: home,
      },
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      try { child.kill("SIGKILL"); resolved = false; } catch {}
    }, 12_000);
    child.stdout.on("data", (b) => { stdout += b.toString(); });
    child.stderr.on("data", (b) => { stderr += b.toString(); });
    child.on("error", () => { clearTimeout(timer); resolve({ ok: false, stdout, stderr, code: -1, duration: Date.now() - started, resolved }); });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, stdout, stderr, code: code ?? -1, duration: Date.now() - started, resolved });
    });
  });
}

export async function GET() {
  const started = Date.now();
  try {
    const r = await runHermesCron();
    if (!r.ok) {
      return NextResponse.json({
        ok: false,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - started,
        bin_resolved: r.resolved,
        summary: emptySummary(),
        raw: r.stdout + r.stderr,
        error: r.stderr || `hermes cron list exited with code ${r.code}`,
      } satisfies CronResp, { status: 200 });
    }
    const summary = parseCron(r.stdout);
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - started,
      bin_resolved: r.resolved,
      summary,
      raw: r.stdout,
    } satisfies CronResp);
  } catch (e) {
    return NextResponse.json({
      ok: false,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - started,
      bin_resolved: false,
      summary: emptySummary(),
      raw: "",
      error: String(e),
    } satisfies CronResp, { status: 500 });
  }
}