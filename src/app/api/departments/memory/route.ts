// src/app/api/departments/memory/route.ts
// Memory Promotion API — allows agents to promote output to PAI database
// Scores artifacts and stores good/weak examples with calibration data

import { NextResponse } from "next/server";
import { promoteArtifact, getMemorySummary } from "@/lib/memory-promotion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department");

  if (!department) {
    return NextResponse.json({ error: "department parameter required" }, { status: 400 });
  }

  const summary = getMemorySummary(department);
  return NextResponse.json({ department, memory: summary });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { agent_id, department_id, artifact_path, content, source } = body;

  if (!agent_id || !department_id || !artifact_path) {
    return NextResponse.json({ 
      error: "agent_id, department_id, and artifact_path required" 
    }, { status: 400 });
  }

  const result = promoteArtifact(
    agent_id,
    department_id,
    artifact_path,
    content || "",
    source || "api_promotion"
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    memory_id: result.memory_id,
    score: result.score,
    promotion_type: result.promotion_type,
    department_id: result.department_id,
    agent_id: result.agent_id
  });
}