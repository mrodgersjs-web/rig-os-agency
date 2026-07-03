import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = {
    timestamp: new Date().toISOString(),
    hermes: null as null | Record<string, unknown>,
    telegram: null as null | Record<string, unknown>,
    cron: null as null | Record<string, unknown>,
    system: {} as Record<string, unknown>,
  };

  // Get Hermes gateway status
  try {
    const resp = await fetch("http://127.0.0.1:8642/health", {
      signal: AbortSignal.timeout(3000),
    });
    if (resp.ok) {
      status.hermes = await resp.json();
    }
  } catch {
    status.hermes = { status: "unreachable" };
  }

  // Get Telegram sessions count
  try {
    const resp = await fetch("http://127.0.0.1:8642/api/status", {
      signal: AbortSignal.timeout(3000),
    });
    if (resp.ok) {
      const data = await resp.json();
      status.telegram = {
        connected: data.platforms?.telegram?.connected ?? false,
        home_channel: data.platforms?.telegram?.home_channel ?? "8634072195",
        messages_today: data.platforms?.telegram?.messages_today ?? 0,
      };
      status.cron = {
        active_jobs: data.cron?.active_jobs ?? 0,
        total_runs: data.cron?.total_runs ?? 0,
      };
    }
  } catch {
    // Gateway API might not have this endpoint
  }

  // Get system metrics
  try {
    const uptime = execSync("uptime", { encoding: "utf-8" }).trim();
    const memInfo = execSync("vm_stat", { encoding: "utf-8" });
    const loadAvg = execSync("sysctl -n vm.loadavg", { encoding: "utf-8" }).trim();
    
    status.system = {
      uptime,
      load: loadAvg,
      timestamp: new Date().toISOString(),
    };
  } catch {
    // Non-critical
  }

  // Get PM2 process status
  try {
    const pm2List = execSync("pm2 jlist 2>/dev/null", {
      timeout: 3000,
      encoding: "utf-8",
    });
    const processes = JSON.parse(pm2List);
    status.system = {
      ...status.system,
      pm2: processes.map((p: { name: string; pid: number; pm2_env?: { status?: string; restart_time?: number }; monit?: { cpu?: number; memory?: number } }) => ({
        name: p.name,
        pid: p.pid,
        status: p.pm2_env?.status ?? "unknown",
        restarts: p.pm2_env?.restart_time ?? 0,
        cpu: p.monit?.cpu ?? 0,
        memory: p.monit?.memory ?? 0,
      })),
    };
  } catch {
    // Non-critical
  }

  return NextResponse.json(status);
}
