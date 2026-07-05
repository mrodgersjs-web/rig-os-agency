// src/lib/memory-promotion.ts
// Memory Promotion System — promotes agent output to PAI database
// Scores artifacts against "what good looks like" and stores good/weak examples

import { execSync } from "child_process";
import { scoreArtifact, getDepartmentCalibration } from "./dept-calibration";

const PAI_DB = "/Users/rig128gb/Developer/rig-jtbd-packs/agent-substrate/data/agent_perf.db";

export interface PromotionResult {
  success: boolean;
  memory_id: string | null;
  score: number;
  promotion_type: "good_example" | "weak_example" | "pattern" | "decision";
  department_id: string;
  agent_id: string;
  artifact_path: string;
  error: string | null;
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

function insertPAI(sql: string): boolean {
  try {
    execSync(
      `sqlite3 "${PAI_DB}" "${sql.replace(/"/g, '\"')}"`,
      { encoding: "utf-8", timeout: 5000 }
    );
    return true;
  } catch {
    return false;
  }
}

export function promoteArtifact(
  agentId: string,
  deptId: string,
  artifactPath: string,
  content: string,
  source: string = "agent_output"
): PromotionResult {
  // Score the artifact
  const { score, gates } = scoreArtifact(deptId, artifactPath);
  
  // Determine promotion type based on score
  let promotionType: PromotionResult["promotion_type"];
  if (score >= 0.75) {
    promotionType = "good_example";
  } else if (score < 0.4) {
    promotionType = "weak_example";
  } else {
    promotionType = "pattern";
  }

  // Insert into memory
  const memoryId = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  
  const insertSql = `
    INSERT INTO agent_memory (id, agent_id, department_id, type, content, score, source, created_at, metadata)
    VALUES ('${memoryId}', '${agentId}', '${deptId}', '${promotionType}', '${content.replace(/'/g, "''")}', ${score}, '${source}', '${now}', '${JSON.stringify({ gates, artifact_path: artifactPath }).replace(/'/g, "''")}')
  `;

  const success = insertPAI(insertSql);

  // Also record calibration point
  if (success) {
    const calibrationSql = `
      INSERT INTO calibration_history (id, department_id, agent_id, score, artifact_type, notes, timestamp)
      VALUES ('cal-${Date.now()}', '${deptId}', '${agentId}', ${score}, '${promotionType}', 'Auto-promoted from ${source}', '${now}')
    `;
    insertPAI(calibrationSql);
  }

  return {
    success,
    memory_id: success ? memoryId : null,
    score,
    promotion_type: promotionType,
    department_id: deptId,
    agent_id: agentId,
    artifact_path: artifactPath,
    error: success ? null : "Failed to insert into PAI database"
  };
}

export function getMemorySummary(deptId: string): {
  good_examples: number;
  weak_examples: number;
  patterns: number;
  decisions: number;
  avg_score: number | null;
  recent_promotions: any[];
} {
  const rows = queryPAI(`
    SELECT type, COUNT(*) as cnt, AVG(score) as avg_score
    FROM agent_memory
    WHERE department_id = '${deptId}'
    GROUP BY type
  `);

  const summary = {
    good_examples: 0,
    weak_examples: 0,
    patterns: 0,
    decisions: 0,
    avg_score: null as number | null,
    recent_promotions: [] as any[]
  };

  for (const row of rows) {
    if (row.type === "good_example") summary.good_examples = row.cnt;
    if (row.type === "weak_example") summary.weak_examples = row.cnt;
    if (row.type === "pattern") summary.patterns = row.cnt;
    if (row.type === "decision") summary.decisions = row.cnt;
  }

  const totalScore = queryPAI(`
    SELECT AVG(score) as avg_score FROM agent_memory WHERE department_id = '${deptId}'
  `);
  summary.avg_score = totalScore[0]?.avg_score ?? null;

  summary.recent_promotions = queryPAI(`
    SELECT id, type, score, source, created_at
    FROM agent_memory
    WHERE department_id = '${deptId}'
    ORDER BY created_at DESC
    LIMIT 10
  `);

  return summary;
}