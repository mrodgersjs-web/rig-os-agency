// src/app/api/departments/workers/route.ts
// Worker Slot Activation API — manages the 41 worker slots with real invocation paths

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

interface WorkerSlot {
  slot_id: string;
  name: string;
  department_id: string;
  role: string;
  status: string;
  invocation_path: string;
  last_run: string | null;
  proof_count: number;
  calibration_score: number | null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department");
  const status = url.searchParams.get("status");

  let workers = queryPAI(`
    SELECT 
      ws.slot_id, ws.name, ws.department_id, ws.role, ws.status,
      ws.invocation_path, ws.last_run, ws.proof_count,
      AVG(co.score) as calibration_score
    FROM worker_slots ws
    LEFT JOIN agent_outcomes co ON co.agent_id = ws.slot_id
    WHERE ws.status != 'deleted'
    GROUP BY ws.slot_id
    ORDER BY ws.department_id, ws.name
  `);

  // Apply filters
  if (department) workers = workers.filter(w => w.department_id === department);
  if (status) workers = workers.filter(w => w.status === status);

  // Build summary
  const byDept: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  
  for (const worker of workers) {
    byDept[worker.department_id] = (byDept[worker.department_id] || 0) + 1;
    byStatus[worker.status] = (byStatus[worker.status] || 0) + 1;
  }

  return NextResponse.json({
    workers,
    summary: {
      total: workers.length,
      active: workers.filter(w => w.status === "active").length,
      by_department: byDept,
      by_status: byStatus
    }
  });
}