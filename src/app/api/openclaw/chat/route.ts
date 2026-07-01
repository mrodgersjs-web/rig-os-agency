import { NextResponse } from "next/server";
import { run } from "@/lib/runner";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { prompt, agent } = await req.json();
  if (typeof prompt !== "string" || prompt.length === 0) {
    return NextResponse.json({ error: "missing prompt" }, { status: 400 });
  }
  if (prompt.length > 16_000) {
    return NextResponse.json({ error: "prompt too long" }, { status: 413 });
  }
  const agentId = typeof agent === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(agent) ? agent : config.openclawAgent;

  // openclaw agent --local --agent <id> -m <prompt> --json --timeout 120
  const out = await run("openclaw", [
    "agent", "--local", "--agent", agentId, "-m", prompt, "--json", "--timeout", "120",
  ], { timeoutMs: 150_000 });

  // Try to parse JSON payload from stdout (may include leading non-JSON log lines)
  let text = "";
  let json: unknown = null;
  const firstBrace = out.stdout.indexOf("{");
  if (firstBrace !== -1) {
    try {
      json = JSON.parse(out.stdout.slice(firstBrace));
      const j = json as { payloads?: { text?: string }[]; meta?: { finalAssistantVisibleText?: string } };
      text = j.meta?.finalAssistantVisibleText
        ?? j.payloads?.[0]?.text
        ?? "";
    } catch {
      text = out.stdout.slice(firstBrace, firstBrace + 800);
    }
  }
  if (!text) text = out.stdout.trim().slice(0, 800) || "(no response)";

  return NextResponse.json({
    ok: out.ok,
    text,
    durationMs: out.durationMs,
    agent: agentId,
    stderr: out.stderr.slice(0, 2000),
  });
}
