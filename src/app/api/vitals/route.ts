import { NextResponse } from "next/server";
import { run } from "@/lib/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Process-wide cache + in-flight de-dupe.
// Without this, every Vitals/Overview tick spawns 5 CLI processes; with multiple
// open dashboard tabs that's ~15 forks every 4s. Cache for 5s, coalesce concurrent
// requests onto one inflight Promise. CLI statuses don't change faster than this.
const CACHE_TTL_MS = 5000;
let cached: { ts: number; body: unknown } | null = null;
let inflight: Promise<unknown> | null = null;

// Timeouts must exceed the MEASURED cost of each call, or the card can never
// resolve and the UI spins forever.
//
// `claude` is the one that bit us: the binary on PATH is the RIG wrapper
// (~/.local/bin/claude), which runs a knowledge-hook preflight before exec'ing
// the real CLI. Measured from inside this server process it takes ~12.1s
// (/api/vitals reported latencyMs 12115) — a 6000ms budget could NEVER succeed,
// so the Claude tile reported ok:false on every single poll. 25s gives real
// headroom over the measured worst case.
//
// Note these run in Promise.all, so the endpoint's worst case is the MAX of
// these, not the sum — and the 5s cache + in-flight de-dupe above means a slow
// poll is paid once, not per open tab.
const TIMEOUT_CLAUDE_MS = 25_000;
const TIMEOUT_DEFAULT_MS = 8_000;

async function computeVitals() {
  const [claude, openclaw, hermes, gemini, antigravity] = await Promise.all([
    run("claude", ["--version"], { timeoutMs: TIMEOUT_CLAUDE_MS }),
    run("openclaw", ["health"], { timeoutMs: TIMEOUT_DEFAULT_MS }),
    run("hermes", ["status"], { timeoutMs: TIMEOUT_DEFAULT_MS }),
    run("gemini", ["--version"], { timeoutMs: TIMEOUT_DEFAULT_MS }),
    run("antigravity", ["--version"], { timeoutMs: TIMEOUT_DEFAULT_MS }),
  ]);
  return { claude, openclaw, hermes, gemini, antigravity };
}

// Why a card is not OK — so the UI can print an explicit word instead of a
// spinner. run() resolves code === null only when the timeout SIGKILLed the
// child, which is exactly the timeout case. A missing/unconfigured binary comes
// back as code -1 with the "not installed" message on stderr.
type FailKind = "ok" | "timeout" | "missing" | "error" | "warming";
function failKind(r: { ok: boolean; code: number | null; stderr: string }): FailKind {
  if (r.ok) return "ok";
  if (r.code === null) return "timeout";
  if (/is not installed or not configured/.test(r.stderr)) return "missing";
  return "error";
}

// A version string is only a version if the process actually succeeded. On
// failure `stderr` holds an error message, and rendering that as a "version"
// is how a dead CLI ends up looking like a live one.
function versionOf(r: { ok: boolean; stdout: string; stderr: string }): string {
  return r.ok ? r.stdout.trim() : "";
}

const WARMING_BUDGET_MS = 1500;

function warmingTile() {
  return { ok: false, fail: "warming" as const, latencyMs: 0 };
}

function warmingBody(ts: number) {
  const tile = warmingTile();
  return {
    ts,
    warming: true,
    claude: { ...tile, version: "" },
    openclaw: {
      ...tile,
      gateway: "down",
      degraded: false,
      busy: false,
      loopMaxMs: 0,
      loopP99Ms: 0,
      agents: [] as string[],
      sessions: 0,
      raw: "",
    },
    hermes: { ...tile, model: "unknown", provider: "unknown", raw: "" },
    gemini: { ...tile, version: "" },
    antigravity: { ...tile, version: "" },
  };
}

type VitalsRaw = Awaited<ReturnType<typeof computeVitals>>;

function assembleBody(raw: VitalsRaw, ts: number) {
  const { claude, openclaw, hermes, gemini, antigravity } = raw;

  const ocAgents = (() => {
    const m = openclaw.stdout.match(/Agents:\s*(.*)/);
    if (!m) return [];
    return m[1].split(",").map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
  })();

  const ocSessions = (() => {
    const m = openclaw.stdout.match(/\((\d+)\s+entries\)/);
    return m ? Number(m[1]) : 0;
  })();

  const hermesModel = (() => {
    const m = hermes.stdout.match(/Model:\s+(\S+)/);
    return m ? m[1] : "unknown";
  })();
  const hermesProvider = (() => {
    const m = hermes.stdout.match(/Provider:\s+([^\n]+)/);
    return m ? m[1].trim() : "unknown";
  })();

  const body = {
    ts,
    claude: {
      ok: claude.ok,
      fail: failKind(claude),
      version: versionOf(claude),
      latencyMs: claude.durationMs,
    },
    openclaw: (() => {
      // OpenClaw labels itself "degraded" on any event_loop_utilization > threshold,
      // even when actual response latency (max / p99) is 0ms — which is normal for an
      // always-on supervisor (browser server, canvas, talk-voice etc.). Re-classify:
      // only treat it as truly degraded when there is real measurable delay.
      const max = Number((openclaw.stdout.match(/max=(\d+)ms/) ?? [])[1] ?? 0);
      const p99 = Number((openclaw.stdout.match(/p99=(\d+)ms/) ?? [])[1] ?? 0);
      const reportedDegraded = /degraded/.test(openclaw.stdout);
      const trulyDegraded = reportedDegraded && (max > 100 || p99 > 50);
      return {
        ok: openclaw.ok,
        fail: failKind(openclaw),
        gateway: /Gateway event loop:/.test(openclaw.stdout) ? "live" : "down",
        degraded: trulyDegraded,
        busy: reportedDegraded && !trulyDegraded,
        loopMaxMs: max,
        loopP99Ms: p99,
        agents: ocAgents,
        sessions: ocSessions,
        latencyMs: openclaw.durationMs,
        raw: openclaw.stdout.slice(0, 2000),
      };
    })(),
    hermes: {
      ok: hermes.ok,
      fail: failKind(hermes),
      model: hermesModel,
      provider: hermesProvider,
      latencyMs: hermes.durationMs,
      raw: hermes.stdout.slice(0, 2000),
    },
    gemini: {
      ok: gemini.ok,
      fail: failKind(gemini),
      version: versionOf(gemini),
      latencyMs: gemini.durationMs,
    },
    antigravity: {
      ok: antigravity.ok,
      fail: failKind(antigravity),
      version: versionOf(antigravity),
      latencyMs: antigravity.durationMs,
    },
  };
  return body;
}

function refresh(): Promise<unknown> {
  if (inflight) return inflight;
  inflight = computeVitals()
    .then((raw) => {
      const body = assembleBody(raw, Date.now());
      cached = { ts: Date.now(), body };
      return body;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.body, { headers: { "X-Vitals-Cache": "hit" } });
  }
  const pending = refresh();
  if (cached) {
    return NextResponse.json(cached.body, { headers: { "X-Vitals-Cache": "stale" } });
  }
  const winner = await Promise.race([
    pending.then((body) => ({ kind: "ready" as const, body })),
    new Promise<{ kind: "warming" }>((resolve) =>
      setTimeout(() => resolve({ kind: "warming" }), WARMING_BUDGET_MS),
    ),
  ]);
  if (winner.kind === "ready") {
    return NextResponse.json(winner.body, { headers: { "X-Vitals-Cache": "miss" } });
  }
  return NextResponse.json(warmingBody(now), { headers: { "X-Vitals-Cache": "warming" } });
}
