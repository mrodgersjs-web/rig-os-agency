import { NextResponse } from "next/server";
import { run } from "@/lib/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Strip ALL common ANSI escape sequences (CSI, OSC, simple SGR) — not just `[...m`.
// Otherwise terminal control codes can eat the reply or leave it looking empty.
const ANSI_STRIP = /\x1b\[[0-9;?]*[a-zA-Z]|\x1b\]\d+;[^\x07\x1b]*(\x07|\x1b\\)/g;

const TIMEOUT_MS = 6 * 60 * 1000; // 6 min — multi-step agentic tasks (skill invocations, video edits) routinely exceed 2 min.

export async function POST(req: Request) {
  const { prompt } = await req.json();
  if (typeof prompt !== "string" || prompt.length === 0) {
    return NextResponse.json({ error: "missing prompt" }, { status: 400 });
  }
  if (prompt.length > 16_000) {
    return NextResponse.json({ error: "prompt too long" }, { status: 413 });
  }

  // hermes -z PROMPT  — single-query non-interactive mode.
  // --yolo + --accept-hooks are ESSENTIAL for headless/VPS runs: without them,
  // Hermes blocks on an interactive approval/hook-confirmation prompt it can't
  // display in oneshot mode, and the dashboard just sees blank output. (Matches
  // the flags Goal Mode already uses.) If the reply is STILL blank after this,
  // it's almost always auth — run `hermes status` and check the provider shows
  // a ✓ for its API key.
  const out = await run("hermes", ["-z", prompt, "--yolo", "--accept-hooks"], { timeoutMs: TIMEOUT_MS });

  const text = out.stdout.replace(ANSI_STRIP, "").trim();
  const stderrClean = out.stderr.replace(ANSI_STRIP, "").trim();

  // If Hermes produced no usable text, build a diagnostic reply instead of returning the opaque "(no response)".
  let diagnostic: string | null = null;
  if (!text) {
    const seconds = (out.durationMs / 1000).toFixed(1);
    const probableTimeout = out.durationMs >= TIMEOUT_MS - 2_000;
    const lines: string[] = [];
    lines.push(probableTimeout
      ? `⏱ Hermes was killed after ${seconds}s — the task likely needed longer than the ${Math.round(TIMEOUT_MS/60000)}-minute budget. Multi-step agentic tasks (skill invocations, video edits) often exceed this.`
      : `⚠ Hermes finished in ${seconds}s with exit ${out.code} but no stdout.`
    );
    if (stderrClean) {
      lines.push("");
      lines.push("─── stderr ───");
      lines.push(stderrClean.length > 4000 ? stderrClean.slice(-4000) : stderrClean);
    } else {
      lines.push("");
      lines.push("(no stderr either) — blank output with no error is almost always auth or provider config:");
      lines.push("  1. Run `hermes status` — does your provider show a ✓ next to its API key?");
      lines.push("  2. If ✗, run `hermes login` (or set the key in ~/.hermes/.env) for that provider.");
      lines.push("  3. Check the Model + Provider lines in `hermes status` are a real, supported combo.");
      lines.push("  4. Then `hermes doctor` for a full config check.");
    }
    diagnostic = lines.join("\n");
  }

  return NextResponse.json({
    ok: out.ok && !!text,
    text: text || diagnostic || "(no response)",
    empty: !text,
    durationMs: out.durationMs,
    exitCode: out.code,
    timedOut: !text && out.durationMs >= TIMEOUT_MS - 2_000,
    stderr: stderrClean, // full, no trunc — useful for diagnosing
  });
}
