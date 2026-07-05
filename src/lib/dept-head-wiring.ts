// src/lib/dept-head-wiring.ts
// Department Head Wiring — connects each department to real execution surfaces
// Each department gets: substrate, execution path, proof path, calibration loop

import { execSync } from "child_process";
import { getDepartmentCalibration, scoreArtifact } from "./dept-calibration";
import { promoteArtifact } from "./memory-promotion";

const PAI_DB = "/Users/rig128gb/Developer/rig-jtbd-packs/agent-substrate/data/agent_perf.db";

export interface DeptHeadExecution {
  department_id: string;
  department_name: string;
  execution_id: string;
  status: "pending" | "running" | "completed" | "failed" | "calibrating";
  input: {
    intent: string;
    context: Record<string, any>;
    source: string;
  };
  output: {
    artifact_path: string | null;
    artifact_hash: string | null;
    score: number | null;
    promotion_type: string | null;
  };
  proof: {
    execution_hash: string;
    timestamp: string;
    calibration_score: number | null;
    memory_promoted: boolean;
  };
  error: string | null;
}

const RIG_JTBD_ROOT = "/Users/rig128gb/Developer/rig-jtbd-packs";

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

function runDeptHarness(deptId: string, intent: string): { success: boolean; artifact_path: string; hash: string } {
  try {
    const result = execSync(
      `.venv/bin/python scripts/dept_bridge.py ${RIG_JTBD_ROOT} ${deptId}`,
      { encoding: "utf-8", timeout: 30000, cwd: "/Users/rig128gb/Developer/rig-os-agency" }
    );
    const data = JSON.parse(result);
    if (data.error) {
      return { success: false, artifact_path: "", hash: "" };
    }
    return {
      success: true,
      artifact_path: `/tmp/rig-dept-artifacts/${deptId}-${Date.now()}.json`,
      hash: data.final_hash || ""
    };
  } catch {
    return { success: false, artifact_path: "", hash: "" };
  }
}

export function executeDeptHead(
  deptId: string,
  intent: string,
  context: Record<string, any> = {},
  source: string = "agency_dashboard"
): DeptHeadExecution {
  const calibration = getDepartmentCalibration(deptId);
  if (!calibration) {
    return {
      department_id: deptId,
      department_name: deptId,
      execution_id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: "failed",
      input: { intent, context, source },
      output: { artifact_path: null, artifact_hash: null, score: null, promotion_type: null },
      proof: { execution_hash: "", timestamp: new Date().toISOString(), calibration_score: null, memory_promoted: false },
      error: `Department '${deptId}' not found in calibration system`
    };
  }

  const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  
  // Run the department harness
  const harnessResult = runDeptHarness(deptId, intent);
  
  // Score the artifact
  let score = null;
  let promotionType = null;
  let memoryPromoted = false;

  if (harnessResult.success && harnessResult.artifact_path) {
    const scoreResult = scoreArtifact(deptId, harnessResult.artifact_path);
    score = scoreResult.score;

    // Promote to memory
    const promotion = promoteArtifact(
      deptId,
      deptId,
      harnessResult.artifact_path,
      intent,
      source
    );
    
    if (promotion.success) {
      memoryPromoted = true;
      promotionType = promotion.promotion_type;
    }
  }

  // Record execution in PAI database
  const now = new Date().toISOString();
  const execSql = `
    INSERT INTO agent_outcomes (id, agent_id, department_id, score, artifact_type, timestamp, metadata)
    VALUES ('${executionId}', '${deptId}', '${deptId}', ${score || 'NULL'}, '${promotionType || 'execution'}', '${now}', '${JSON.stringify({ intent, source, hash: harnessResult.hash }).replace(/'/g, "''")}')
  `;
  
  try {
    execSync(`sqlite3 "${PAI_DB}" "${execSql.replace(/"/g, '\"')}"`, { encoding: "utf-8" });
  } catch {
    // Non-fatal — execution still returned
  }

  return {
    department_id: deptId,
    department_name: calibration.department_name,
    execution_id: executionId,
    status: harnessResult.success ? "completed" : "failed",
    input: { intent, context, source },
    output: {
      artifact_path: harnessResult.artifact_path || null,
      artifact_hash: harnessResult.hash || null,
      score,
      promotion_type: promotionType
    },
    proof: {
      execution_hash: harnessResult.hash || "",
      timestamp: now,
      calibration_score: score,
      memory_promoted: memoryPromoted
    },
    error: harnessResult.success ? null : "Department harness execution failed"
  };
}

export function getDeptExecutionHistory(deptId: string, limit: number = 20): DeptHeadExecution[] {
  const rows = queryPAI(`
    SELECT id, agent_id, score, artifact_type, timestamp, metadata
    FROM agent_outcomes
    WHERE department_id = '${deptId}'
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `);

  return rows.map(row => ({
    department_id: deptId,
    department_name: deptId,
    execution_id: row.id,
    status: "completed" as const,
    input: { intent: "", context: {}, source: "historical" },
    output: {
      artifact_path: null,
      artifact_hash: null,
      score: row.score,
      promotion_type: row.artifact_type
    },
    proof: {
      execution_hash: "",
      timestamp: row.timestamp,
      calibration_score: row.score,
      memory_promoted: false
    },
    error: null
  }));
}