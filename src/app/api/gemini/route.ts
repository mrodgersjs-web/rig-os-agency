import { NextResponse } from "next/server";
import { run } from "@/lib/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMMANDS = {
  version: ["--version"],
  sessions: ["--list-sessions"],
  extensions: ["--list-extensions"],
  models: ["models"],
  mcp: ["mcp"],
} as const;

type Action = keyof typeof COMMANDS;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = (url.searchParams.get("action") ?? "version") as Action;
  const args = COMMANDS[action];
  if (!args) return NextResponse.json({ error: "unknown action" }, { status: 400 });
  const out = await run("gemini", args, { timeoutMs: 15_000 });
  return NextResponse.json({ action, ...out });
}
