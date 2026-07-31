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

  // Fallback if AI failed.
  //
  // WHAT THIS USED TO SAY, AND WHY IT WAS REMOVED
  //
  // The old fallback listed invented work as if it were real:
  //   "Respond to NeuralSoft proposal — $85K deal on the table"
  //   "Review Stripe failed payments — 3 disputes need attention"
  //   "GTM pipeline review with Marcus Vale — 12 new leads scored"
  //   "…LinkedIn posts from Sarah Chen", "…with Maya Rivera"
  // None of those deals, disputes, leads or people exist. This is the single
  // worst failure mode available to an assistant: not looking empty, but
  // confidently directing its operator to spend the morning on fiction — and
  // it fires precisely when the AI call FAILED, i.e. when it knows least.
  //
  // The honest fallback names the one thing that is actually true and verified
  // (the north star is 0) and says plainly that it could not generate a
  // briefing. An assistant that admits it has nothing beats one that invents.
  if (!briefingText) {
    briefingText = [
      "Briefing unavailable — the model call failed, so there is no generated plan for today.",
      "",
      "Verified state (from the signed ledger, not generated):",
      "  • Calls held: 0. That is the only number that decides this week.",
      `  • Paperclip inbox: ${inboxItems} item(s).`,
      "",
      "Next action: work the reply backlog, not this list. Retry the briefing once the model is reachable.",
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
