// src/app/api/agents/registry/route.ts
// Live Agent Registry API — reads from PAI database, not static array
// Returns real-time agent status, calibration scores, and department mapping

import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAI_CLI = "/Users/rig128gb/.rig/bin/rig-department-pai";
const PAI_DB = "/Users/rig128gb/Developer/rig-jtbd-packs/agent-substrate/data/agent_perf.db";

interface AgentRecord {
  agent_id: string;
  display_name: string;
  kind: string;
  department_id: string;
  department_name: string;
  status: string;
  role: string;
  telos: string;
  quality_profiles: string[];
  artifact_family: string;
  kpis: string[];
  hard_blocks: string[];
  what_good_looks_like: string[];
  calibration_score: number | null;
  last_active: string | null;
  proof_count: number;
  memory_count: number;
}

interface RegistryResponse {
  agents: AgentRecord[];
  summary: {
    total: number;
    active: number;
    by_department: Record<string, number>;
    by_kind: Record<string, number>;
    avg_calibration: number | null;
  };
  generated_at: string;
  source: string;
}

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

function getAgentCalibration(agentId: string): number | null {
  const scores = queryPAI(
    `SELECT AVG(score) as avg_score FROM agent_outcomes WHERE agent_id = '${agentId}' AND score IS NOT NULL`
  );
  return scores[0]?.avg_score ?? null;
}

function getAgentProofCount(agentId: string): number {
  const counts = queryPAI(
    `SELECT COUNT(*) as cnt FROM agent_outcomes WHERE agent_id = '${agentId}'`
  );
  return counts[0]?.cnt ?? 0;
}

function getAgentMemoryCount(agentId: string): number {
  const counts = queryPAI(
    `SELECT COUNT(*) as cnt FROM agent_memory WHERE agent_id = '${agentId}'`
  );
  return counts[0]?.cnt ?? 0;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department");
  const kind = url.searchParams.get("kind");
  const status = url.searchParams.get("status");

  // Query all agents from PAI database
  let agents = queryPAI(`
    SELECT 
      agent_id, display_name, kind, department_id, department_name,
      status, role, telos, quality_profiles, artifact_family,
      kpis, hard_blocks, what_good_looks_like
    FROM agents
    WHERE status != 'deleted'
    ORDER BY department_id, display_name
  `);

  // Enrich with calibration data
  agents = agents.map(agent => ({
    ...agent,
    quality_profiles: JSON.parse(agent.quality_profiles || '[]'),
    kpis: JSON.parse(agent.kpis || '[]'),
    hard_blocks: JSON.parse(agent.hard_blocks || '[]'),
    what_good_looks_like: JSON.parse(agent.what_good_looks_like || '[]'),
    calibration_score: getAgentCalibration(agent.agent_id),
    last_active: null,
    proof_count: getAgentProofCount(agent.agent_id),
    memory_count: getAgentMemoryCount(agent.agent_id),
  }));

  // Apply filters
  if (department) agents = agents.filter(a => a.department_id === department);
  if (kind) agents = agents.filter(a => a.kind === kind);
  if (status) agents = agents.filter(a => a.status === status);

  // Build summary
  const byDept: Record<string, number> = {};
  const byKind: Record<string, number> = {};
  let calSum = 0;
  let calCount = 0;

  for (const agent of agents) {
    byDept[agent.department_id] = (byDept[agent.department_id] || 0) + 1;
    byKind[agent.kind] = (byKind[agent.kind] || 0) + 1;
    if (agent.calibration_score !== null) {
      calSum += agent.calibration_score;
      calCount++;
    }
  }

  const response: RegistryResponse = {
    agents,
    summary: {
      total: agents.length,
      active: agents.filter(a => a.status === "active").length,
      by_department: byDept,
      by_kind: byKind,
      avg_calibration: calCount > 0 ? calSum / calCount : null,
    },
    generated_at: new Date().toISOString(),
    source: "pai_database",
  };

  return NextResponse.json(response);
}