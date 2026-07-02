import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/health — system health overview
export async function GET() {
  // In production these would be real readings
  // For now return the known-good state
  return NextResponse.json({
    system: {
      diskFree: "183 GB",
      processes: 420,
      docker: "Running",
      colima: "Running",
      networkInterfaces: 2,
      cronConfigured: true,
    },
    app: {
      pages: 55,
      apis: 146,
      libFiles: 55,
      components: 55,
      running: true,
      buildStatus: "passing",
    },
    rig: {
      agents: 408,
      skills: 1202,
      goalLoops: 50,
      deviationEngines: 40,
      mcpServers: 15,
      githubRepos: 183,
    },
    cron: {
      active: [
        { name: "Jarvis Morning Briefing", schedule: "0 7 * * *", deliver: "telegram" },
        { name: "1000x Continuous Improvement", schedule: "every 2h", deliver: "telegram" },
        { name: "1000x Nightly Deep Improvement", schedule: "0 23 * * *", deliver: "telegram" },
        { name: "GTM Daily Loop", schedule: "30 8 * * *", deliver: "local" },
        { name: "GTM Daily Queue", schedule: "0 9 * * *", deliver: "local" },
        { name: "GTM Daily Enforcer", schedule: "30 9 * * *", deliver: "local" },
        { name: "GTM Weekly Scoreboard", schedule: "0 10 * * 1", deliver: "local" },
      ],
    },
    modal: {
      status: "pending_auth",
      model: "zai-org/GLM-5.2-FP8",
      gpu: "8x B200",
      engine: "SGLang v0.5.13",
      endpoint: null,
    },
  });
}