import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { execSync } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "rig-os-agency",
    version: "0.1.0",
    uptime: process.uptime(),
    checks: {} as Record<string, { status: string; detail?: string }>,
  };

  // Check 1: Process manager
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
        ? `PM2 managing ${processes.length} process(es), RIG OS Agency ${rigProc.pm2_env?.status}`
        : "RIG OS Agency not found in PM2",
    };
  } catch {
    health.checks.pm2 = { status: "unknown", detail: "PM2 not accessible" };
  }

  // Check 2: Hermes Gateway
  try {
    const response = await fetch("http://127.0.0.1:8642/health", {
      signal: AbortSignal.timeout(2000),
    });
    const data = response.ok ? await response.json() : null;
    health.checks.hermes = {
      status: response.ok ? "ok" : "degraded",
      detail: data
        ? `Hermes ${data.version} on :8642`
        : `HTTP ${response.status}`,
    };
  } catch {
    health.checks.hermes = { status: "down", detail: "Gateway not reachable" };
  }

  // Check 3: Agent fleet
  try {
    const home = process.env.HOME || "/Users/rig128gb";
    const agencyPath = `${home}/.hermes/skills/agency-agents/agency_agents_inventory.json`;
    const voltPath = `${home}/.hermes/skills/awesome-codex-subagents/voltagent_inventory.json`;
    const agencyRaw = await fs.readFile(agencyPath, "utf-8");
    const voltRaw = await fs.readFile(voltPath, "utf-8");
    const agencyCount = JSON.parse(agencyRaw).length || JSON.parse(agencyRaw).agents?.length || 0;
    const voltCount = JSON.parse(voltRaw).length || JSON.parse(voltRaw).agents?.length || 0;
    health.checks.agents = {
      status: "ok",
      detail: `${agencyCount + voltCount + 21} agents loaded (${agencyCount} agency, ${voltCount} voltagent, 21 core)`,
    };
  } catch {
    health.checks.agents = { status: "degraded", detail: "Some inventory files missing" };
  }

  // Check 4: Telegram
  try {
    const envFile = await fs.readFile(`${process.env.HOME}/.hermes/.env`, "utf-8");
    const hasTelegram = envFile.includes("TELEGRAM_BOT_TOKEN");
    health.checks.telegram = {
      status: hasTelegram ? "ok" : "missing",
      detail: hasTelegram ? "Bot token configured" : "No bot token found",
    };
  } catch {
    health.checks.telegram = { status: "unknown" };
  }

  // Overall status
  const allOk = Object.values(health.checks).every(
    (c: { status: string }) => c.status === "ok" || c.status === "unknown"
  );
  health.status = allOk ? "ok" : "degraded";

  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 503,
  });
}
