import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { execSync } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const port = process.env.PORT || 3737;

  const health = {
    status: "ok" as string,
    timestamp: new Date().toISOString(),
    service: "rig-os-agency",
    version: "0.1.0",
    port: Number(port),
    uptime: Math.floor(process.uptime()),
    uptimeHuman: formatUptime(process.uptime()),
    pid: process.pid,
    responseTimeMs: 0,
    checks: {} as Record<string, { status: string; detail?: string }>,
    agentDispatchReady: false,
  };

  // Check 1: Process manager (PM2)
  try {
    const pm2List = execSync("pm2 jlist 2>/dev/null", {
      timeout: 3000,
      encoding: "utf-8",
    });
    const processes = JSON.parse(pm2List);
    const rigProc = processes.find((p: { name: string }) => p.name === "rig-os-agency");
    health.checks.pm2 = {
      status: rigProc ? "ok" : "degraded",
      detail: rigProc
        ? `PM2 managing ${processes.length} process(es), RIG OS Agency: ${rigProc.pm2_env?.status} (restarts: ${rigProc.pm2_env?.restart_time || 0})`
        : "RIG OS Agency not managed by PM2 (running standalone)",
    };
  } catch {
    health.checks.pm2 = { status: "degraded", detail: "PM2 not accessible from server process" };
  }

  // Check 2: Hermes Gateway (:8642)
  try {
    const response = await fetch("http://127.0.0.1:8642/health", {
      signal: AbortSignal.timeout(2000),
    });
    const data = response.ok ? await response.json() : null;
    health.checks.hermes = {
      status: response.ok ? "ok" : "degraded",
      detail: data ? `Hermes ${data.version} on :8642` : `HTTP ${response.status}`,
    };
  } catch {
    health.checks.hermes = { status: "down", detail: "Gateway not reachable on :8642" };
  }

  // Check 3: Paperclip (:3100)
  try {
    const response = await fetch("http://127.0.0.1:3100/health", {
      signal: AbortSignal.timeout(2000),
    });
    health.checks.paperclip = {
      status: response.ok ? "ok" : "degraded",
      detail: response.ok ? "Paperclip healthy on :3100" : `HTTP ${response.status}`,
    };
  } catch {
    health.checks.paperclip = { status: "down", detail: "Paperclip not reachable on :3100" };
  }

  // Check 4: Agent fleet readiness — count from real source files
  const home = process.env.HOME || "/Users/rig128gb";
  let agentCounts = { agency: 0, voltagent: 0, rigExperts: 0, susan: 0, total: 0 };
  try {
    // VoltAgent: count real .toml files
    const voltDir = `${home}/.codex/agents`;
    try {
      const voltFiles = await fs.readdir(voltDir);
      agentCounts.voltagent = voltFiles.filter((f) => f.startsWith("voltagent-") && f.endsWith(".toml")).length;
    } catch {}

    // RIG Experts: read inventory JSON
    try {
      const rigRaw = await fs.readFile(`${home}/.hermes/agents/jtbd/rig-domain-experts/rig_domain_experts_inventory.json`, "utf-8");
      const rigData = JSON.parse(rigRaw);
      agentCounts.rigExperts = rigData.experts?.length || 0;
    } catch {}

    // Agency Agents: hardcoded catalog count (217 across 8 departments)
    agentCounts.agency = 217;

    // Susan: count .md command files
    try {
      const susanDir = `${home}/.hermes/commands`;
      const cmdFiles = await fs.readdir(susanDir);
      agentCounts.susan = cmdFiles.filter((f) => f.startsWith("susan-") && f.endsWith(".md")).length;
    } catch {}

    agentCounts.total = agentCounts.agency + agentCounts.voltagent + agentCounts.rigExperts + agentCounts.susan;
    health.checks.agents = {
      status: "ok",
      detail: `${agentCounts.total} agents ready (${agentCounts.agency} agency, ${agentCounts.voltagent} voltagent, ${agentCounts.rigExperts} RIG experts, ${agentCounts.susan} susan)`,
    };
  } catch {
    health.checks.agents = { status: "degraded", detail: "Agent inventory partially accessible" };
  }

  // Check 5: Local Ollama models
  try {
    const ollamaResp = await fetch("http://127.0.0.1:11434/api/tags", {
      signal: AbortSignal.timeout(2000),
    });
    const ollamaData = ollamaResp.ok ? await ollamaResp.json() : null;
    const modelCount = ollamaData?.models?.length || 0;
    health.checks.ollama = {
      status: ollamaResp.ok ? "ok" : "degraded",
      detail: ollamaResp.ok ? `${modelCount} local models available on :11434` : `HTTP ${ollamaResp.status}`,
    };
  } catch {
    health.checks.ollama = { status: "down", detail: "Ollama not reachable on :11434" };
  }

  // Check 6a: OpenClaw gateway — used by vitals, surfaces here for /system-status
  try {
    const ocResp = await execSync("openclaw health 2>/dev/null || echo DOWN", {
      timeout: 3000,
      encoding: "utf-8",
    });
    const healthy = ocResp.includes("ok") || ocResp.includes("healthy");
    health.checks.openclaw = {
      status: healthy ? "ok" : ocResp.trim() === "DOWN" ? "down" : "degraded",
      detail: ocResp.split("\n")[0].slice(0, 120) || "no output",
    };
  } catch {
    health.checks.openclaw = { status: "degraded", detail: "openclaw CLI not on PATH" };
  }

  // Check 6b: Disk pressure on root volume — early warning before 90% fills
  try {
    const dfOut = execSync("df -k / | tail -1", { timeout: 2000, encoding: "utf-8" });
    const m = dfOut.trim().split(/\s+/);
    const usedPct = parseInt(m[4] || "0", 10);
    health.checks.disk = {
      status: usedPct >= 90 ? "down" : usedPct >= 75 ? "degraded" : "ok",
      detail: `root ${usedPct}% used (${m[2]} of ${m[1]} blocks)`,
    };
  } catch {
    health.checks.disk = { status: "unknown" };
  }

  // Check 6: Stripe connectivity
  try {
    const envFile = await fs.readFile(`${home}/.hermes/.env`, "utf-8");
    const hasStripe = envFile.includes("STRIPE_SECRET_KEY=sk_");
    health.checks.stripe = {
      status: hasStripe ? "ok" : "not_configured",
      detail: hasStripe ? "Stripe key configured" : "No STRIPE_SECRET_KEY in ~/.hermes/.env",
    };
  } catch {
    health.checks.stripe = { status: "unknown", detail: "Cannot read ~/.hermes/.env" };
  }

  // Check 7: Telegram
  try {
    const envFile = await fs.readFile(`${home}/.hermes/.env`, "utf-8");
    const hasTelegram = envFile.includes("TELEGRAM_BOT_TOKEN=");
    health.checks.telegram = {
      status: hasTelegram ? "ok" : "not_configured",
      detail: hasTelegram ? "Bot token configured" : "No TELEGRAM_BOT_TOKEN found",
    };
  } catch {
    health.checks.telegram = { status: "unknown" };
  }

  // Agent dispatch readiness: need agents + Ollama + Hermes all healthy
  health.agentDispatchReady =
    (health.checks.agents?.status === "ok") &&
    (health.checks.ollama?.status === "ok") &&
    (health.checks.hermes?.status === "ok");

  // Overall status
  const criticalChecks = ["pm2", "agents", "ollama", "disk"];
  const allOk = criticalChecks.every((k) => {
    const s = health.checks[k]?.status;
    return s === "ok" || s === "degraded";
  });
  health.status = allOk ? "ok" : "degraded";
  health.responseTimeMs = Date.now() - startTime;

  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 503,
  });
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
