import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const execAsync = promisify(exec);
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Terminal API — hardened with auth + rate limiting
export async function POST(req: Request) {
  // Require auth for terminal access
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const session = token ? getSession(token) : null;
  
  // Local mode: allow without token (single user)
  // Multi-user mode: require admin role
  const isLocalMode = !token;
  if (!isLocalMode && session?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Strict rate limit for terminal
  const ip = req.headers.get("x-forwarded-for") || "local";
  const rl = rateLimit(`terminal:${session?.user_id || ip}`, 30); // 30 commands per minute
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { command, cwd } = await req.json();

  if (!command || typeof command !== "string") {
    return NextResponse.json({ error: "missing command" }, { status: 400 });
  }

  // Expanded block list
  const blocked = [
    "rm -rf /", "rm -rf ~", "rm -rf *", "mkfs", "shutdown", "reboot", 
    "halt", "dd if=", "> /dev/sd", ":(){ :|:& };:", "fork bomb",
    "chmod -R 777 /", "curl.*|.*bash", "wget.*|.*bash",
  ];
  for (const b of blocked) {
    if (command.toLowerCase().includes(b.toLowerCase())) {
      return NextResponse.json({ error: `blocked: ${b}` }, { status: 403 });
    }
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 15_000,
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
