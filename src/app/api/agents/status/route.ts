// src/app/api/agents/status/route.ts
// Agent Status API — real-time agent status with calibration and proof data

import { NextResponse } from "next/server";
import { execSync } from "child_process";

const PAI_DB = "/Users/rig128gb/Developer/rig-jtbd-packs/agent-substrate/data/agent_perf.db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function queryPAI(sql: string): any[] {
  try {
    const result = execSync(
      `sqlite3 -json "${PAI_DB}" "${sql.replace(/"/g, '\"')}"`,
      { encoding: "utf-8", timeout: 5000 }
    );
    return JSON.parse(result || "[]");
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agentId = url.searchParams.get("agent_id");

  if (agentId) {
    // Get status for a specific agent
    const agent = queryPAI(`
      SELECT 
        a.agent_id, a.display_name, a.kind, a.department_id, a.status,
        a.role, a.telos,
        AVG(co.score) as avg_calibration,
        COUNT(DISTINCT co.id) as proof_count,
        COUNT(DISTINCT m.id) as memory_count,
        MAX(co.timestamp) as last_proof,
        MAX(m.created_at) as last_memory
      FROM agents a
      LEFT JOIN agent_outcomes co ON co.agent_id = a.agent_id
      LEFT JOIN agent_memory m ON m.agent_id = a.agent_id
      WHERE a.agent_id = '${agentId}'
      GROUP BY a.agent_id
    `);

    if (agent.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ agent: agent[0] });
  }

  // Get status for all agents
  const agents = queryPAI(`
    SELECT 
      a.agent_id, a.display_name, a.kind, a.department_id, a.status,
      a.role,
      AVG(co.score) as avg_calibration,
      COUNT(DISTINCT co.id) as proof_count,
      COUNT(DISTINCT m.id) as memory_count,
      MAX(co.timestamp) as last_proof,
      MAX(m.created_at) as last_memory
    FROM agents a
    LEFT JOIN agent_outcomes co ON co.agent_id = a.agent_id
    LEFT JOIN agent_memory m ON m.agent_id = a.agent_id
    WHERE a.status != 'deleted'
    GROUP BY a.agent_id
    ORDER BY a.department_id, a.display_name
  `);

  // Build summary
  const byDept: Record<string, { total: number; active: number; avg_calibration: number }> = {};
  let totalCalibration = 0;
  let calCount = 0;

  for (const agent of agents) {
    if (!byDept[agent.department_id]) {
      byDept[agent.department_id] = { total: 0, active: 0, avg_calibration: 0 };
    }
    byDept[agent.department_id].total++;
    if (agent.status === "active") byDept[agent.department_id].active++;
    if (agent.avg_calibration !== null) {
      byDept[agent.department_id].avg_calibration += agent.avg_calibration;
      totalCalibration += agent.avg_calibration;
      calCount++;
    }
  }

  // Normalize calibration averages
  for (const dept of Object.values(byDept)) {
    if (dept.total > 0) dept.avg_calibration /= dept.total;
  }

  return NextResponse.json({
    agents,
    summary: {
      total: agents.length,
      active: agents.filter(a => a.status === "active").length,
      avg_calibration: calCount > 0 ? totalCalibration / calCount : null,
      by_department: byDept
    }
  });
}