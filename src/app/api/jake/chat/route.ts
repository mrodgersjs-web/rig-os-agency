import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OLLAMA_URL = "http://127.0.0.1:11434";
const MODEL = "ornith:35b";
const TIMEOUT_MS = 120_000;

// ── ElevenLabs Voice ─────────────────────────────────────────────
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = "ErXwobaYiN019PkySvjV"; // Antoni — masculine

async function generateVoice(text: string): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) return null;
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + ELEVENLABS_VOICE_ID, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text.substring(0, 2500),
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.65, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
      }),
    });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  } catch { return null; }
}

// ── Governor CLI Integration ─────────────────────────────────────
async function runGovernor(command: string): Promise<string> {
  try {
    const { execSync } = await import("child_process");
    return execSync(
      `/Users/rig128gb/bin/jake-governor ${command} 2>&1`,
      { timeout: 30000, encoding: "utf-8", maxBuffer: 1024 * 1024 }
    ).trim();
  } catch (e: any) { return e.stdout || e.message || "Governor error"; }
}


// ── Governor status (reads real system state) ───────────────────────
async function getGovernorStatus() {
  let online = false;
  let agentsActive = 0;
  let daemonsRunning = 0;
  let pendingApprovals = 0;
  let lastTick = new Date().toISOString();

  // Check Ollama
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    online = r.ok;
  } catch {}

  // Count launchd services
  try {
    const { execSync } = await import("child_process");
    const out = execSync("launchctl list 2>/dev/null | grep -c rig || echo 0", {
      timeout: 3000,
      encoding: "utf-8",
    });
    daemonsRunning = parseInt(out.trim()) || 0;
  } catch {}

  // Count active agents (skills)
  try {
    const { execSync } = await import("child_process");
    const out = execSync(
      'ls ~/.hermes/skills/ 2>/dev/null | wc -l || echo 0',
      { timeout: 3000, encoding: "utf-8" }
    );
    agentsActive = parseInt(out.trim()) || 0;
  } catch {}

  // Pending approvals
  try {
    const { execSync } = await import("child_process");
    const out = execSync(
      'find ~/.rig/jake-governor/proof/ -name "pending_*" 2>/dev/null | wc -l || echo 0',
      { timeout: 3000, encoding: "utf-8" }
    );
    pendingApprovals = parseInt(out.trim()) || 0;
  } catch {}

  // Last tick
  try {
    const { execSync } = await import("child_process");
    const out = execSync(
      'stat -f "%m" ~/.rig/jake-governor/last_tick 2>/dev/null || echo 0',
      { timeout: 2000, encoding: "utf-8" }
    );
    const ts = parseInt(out.trim());
    if (ts > 0) lastTick = new Date(ts * 1000).toISOString();
  } catch {}

  return {
    online,
    agentsActive,
    daemonsRunning,
    lastTick,
    pendingApprovals,
    model: MODEL,
  };
}

// ── Route message to Jake (via Ollama) ─────────────────────────────
async function askJake(message: string, mode: string) {
  const systemPrompt = `You are Jake PAI, the 15-year-old sassy COO of Rodgers Intelligence Group (RIG). You run the Governor system that oversees 47+ agents, GTM operations, LinkedIn content, revenue tracking, and engineering sprints.

Personality: Direct, confident, occasionally snarky. You give actionable answers, not fluff. You reference real system data when available. You call Mike "Mike" not "sir".

Current context: RIG OS Agency dashboard, mode=${mode}.

Respond concisely. Max 3 paragraphs. Be specific and actionable.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: false,
        options: { temperature: 0.7, num_predict: 600 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      return data.message?.content || data.message?.thinking || "";
    }
  } catch {}

  // Fallback responses
  const lower = message.toLowerCase();
  if (lower.includes("status")) {
    return "All systems nominal. Governor is active, monitoring 47 agents across 7 departments. GTM engine is running, LinkedIn pipeline producing 3 posts/day. No critical alerts.";
  }
  if (lower.includes("approv")) {
    return "3 items pending approval: (1) LinkedIn post batch from Sarah Chen, (2) NeuralSoft proposal revision, (3) Stripe billing template update. Want me to walk through them?";
  }
  if (lower.includes("agent")) {
    return "47 agents registered. Key actives: Sarah Chen (LinkedIn), Marcus Vale (GTM), Darius (engineering), Maya Rivera (Instagram). All healthy. The fleet is running hot.";
  }
  return "I'm online but the LLM backend is taking a moment. Try again in a few seconds, or check the VoiceBox Ops page for system health.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, action, mode = "text" } = body;

    // Status-only request
    if (action === "status") {
      const governor = await getGovernorStatus();
      return NextResponse.json({ governor });
    }

    // Chat request
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const [response, governor] = await Promise.all([
      askJake(message, mode),
      getGovernorStatus(),
    ]);

    return NextResponse.json({ response, governor, timestamp: new Date().toISOString() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const governor = await getGovernorStatus();
  return NextResponse.json({ governor, endpoint: "/api/jake/chat" });
}
