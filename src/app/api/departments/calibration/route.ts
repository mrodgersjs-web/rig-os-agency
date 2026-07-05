// src/app/api/departments/calibration/route.ts
// Department Calibration API — returns calibration data for all departments
// Shows substrate, telos, memory, quality gates, proof paths, and scores

import { NextResponse } from "next/server";
import { getAllDepartmentCalibrations, getDepartmentCalibration, scoreArtifact } from "@/lib/dept-calibration";
import { getMemorySummary } from "@/lib/memory-promotion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department");
  const action = url.searchParams.get("action");

  // Score a specific artifact
  if (action === "score" && department) {
    const artifactPath = url.searchParams.get("artifact");
    if (!artifactPath) {
      return NextResponse.json({ error: "artifact parameter required" }, { status: 400 });
    }
    const result = scoreArtifact(department, artifactPath);
    return NextResponse.json({ department, artifact: artifactPath, ...result });
  }

  // Get memory summary for a department
  if (action === "memory" && department) {
    const summary = getMemorySummary(department);
    return NextResponse.json({ department, memory: summary });
  }

  // Get calibration for a specific department
  if (department) {
    const calibration = getDepartmentCalibration(department);
    if (!calibration) {
      return NextResponse.json({ error: `Department '${department}' not found` }, { status: 404 });
    }
    const memory = getMemorySummary(department);
    return NextResponse.json({ calibration, memory });
  }

  // Get all department calibrations
  const calibrations = getAllDepartmentCalibrations();
  const summary = {
    total_departments: calibrations.length,
    avg_calibration: calibrations.reduce((sum, c) => sum + (c.calibration_score || 0), 0) / calibrations.length || null,
    departments: calibrations.map(c => ({
      id: c.department_id,
      name: c.department_name,
      calibration_score: c.calibration_score,
      memory_count: c.memory.total_count,
      worker_slots: c.worker_slots.length,
      quality_gates: c.quality_gates.length
    }))
  };

  return NextResponse.json({ calibrations, summary });
}