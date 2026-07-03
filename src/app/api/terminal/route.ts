import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 15_000;

// Terminal API — execute shell commands from the dashboard
export async function POST(req: Request) {
  const { command, cwd } = await req.json();

  if (!command || typeof command !== "string") {
    return NextResponse.json({ error: "missing command" }, { status: 400 });
  }

  // Block dangerous commands
  const blocked = ["rm -rf /", "mkfs", "shutdown", "reboot", "halt", "dd if=", "> /dev/sd"];
  for (const b of blocked) {
    if (command.includes(b)) {
      return NextResponse.json({ error: `blocked: ${b}` }, { status: 403 });
    }
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
      cwd: cwd || process.env.HOME,
      env: { ...process.env, TERM: "xterm-256color" },
    });

    return NextResponse.json({
      ok: true,
      stdout: stdout.slice(0, 50000),
      stderr: stderr.slice(0, 10000),
      exitCode: 0,
    });
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; code?: number; message: string };
    return NextResponse.json({
      ok: false,
      stdout: (err.stdout || "").slice(0, 50000),
      stderr: (err.stderr || err.message || "").slice(0, 10000),
      exitCode: err.code || 1,
    });
  }
}
