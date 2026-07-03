import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 180_000;

export async function POST(req: Request) {
  const { regenerate } = await req.json();

  // Gather system state
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // Check Hermes
  let hermesStatus = "unknown";
  try {
    const r = await fetch("http://127.0.0.1:8642/health", { signal: AbortSignal.timeout(2000) });
    hermesStatus = r.ok ? "online" : "degraded";
  } catch { hermesStatus = "offline"; }

  // Check PM2
  let pm2Status = "unknown";
  try {
    const { execSync } = await import("child_process");
    const out = execSync("pm2 jlist 2>/dev/null", { timeout: 3000, encoding: "utf-8" });
    const procs = JSON.parse(out);
    const rig = procs.find((p: { name: string }) => p.name === "rig-os-agency");
    pm2Status = rig ? rig.pm2_env?.status || "unknown" : "not found";
  } catch {}

  // Load tasks
  let taskCount = 0;
  let inboxItems = 0;
  try {
    const raw = await fs.readFile(
      path.join(process.env.HOME || "/Users/rig128gb", "Developer/rig-os-agency/data/paperclip-tasks.json"),
      "utf-8"
    );
    const data = JSON.parse(raw);
    inboxItems = (data.inbox || []).filter((t: { status: string }) => t.status !== "done").length;
    taskCount = (data.today || []).filter((t: { status: string }) => t.status !== "done").length;
  } catch {}

  // Generate briefing via Ornith
  const systemPrompt = `You are Jake PAI, COO of Rodgers Intelligence Group. Generate a concise daily briefing for Mike Rodgers.

Today is ${date}.

System status:
- RIG OS Agency: ${pm2Status}
- Hermes Gateway: ${hermesStatus}
- Inbox items pending: ${inboxItems}
- Active tasks today: ${taskCount}

Generate EXACTLY 10 prioritized action items for today. Format each as:
N. [PRIORITY] Action description (estimated time)

Priority levels: CRITICAL, HIGH, MEDIUM
Mix operational items, strategic items, and team check-ins.
Be specific and actionable. No fluff. No generic advice.
This is an AI agency targeting $10M ARR.`;

  let briefingText = "";
  let aiGenerated = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const resp = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "ornith:35b",
        messages: [{ role: "user", content: systemPrompt }],
        stream: false,
        options: { temperature: 0.6, num_predict: 800 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      const msg = data.message || {};
      briefingText = msg.content || msg.thinking || "";
      aiGenerated = true;
    }
  } catch (e) {
    briefingText = "";
  }

  // Fallback if AI failed
  if (!briefingText) {
    briefingText = [
      `1. [CRITICAL] Review ${inboxItems} inbox items in Paperclip (15 min)`,
      "2. [CRITICAL] Check RIG OS Agency health dashboard (5 min)",
      "3. [HIGH] Review and approve today's LinkedIn posts from Sarah Chen (20 min)",
      "4. [HIGH] Respond to NeuralSoft proposal — $85K deal on the table (30 min)",
      "5. [HIGH] Review Stripe failed payments — 3 disputes need attention (15 min)",
      "6. [HIGH] GTM pipeline review with Marcus Vale — 12 new leads scored (20 min)",
      "7. [MEDIUM] Check Ornith:35B is loaded and serving Copilot queries (5 min)",
      "8. [MEDIUM] Review improvement engine journal — 10x daily scan results (10 min)",
      "9. [MEDIUM] Instagram content review with Maya Rivera (15 min)",
      `10. [MEDIUM] Prep for tomorrow's sync with Darius (15 min)`,
    ].join("\n");
  }

  return NextResponse.json({
    date,
    briefing: briefingText,
    aiGenerated,
    systemStatus: { hermes: hermesStatus, pm2: pm2Status, inboxItems, taskCount },
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({}) }));
}
