// src/app/api/departments/execute/route.ts
// Department Execution API — execute department heads and track proof paths
// Integrates calibration, memory promotion, and proof generation

import { NextResponse } from "next/server";
import { executeDeptHead, getDeptExecutionHistory } from "@/lib/dept-head-wiring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const department = url.searchParams.get("department");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  if (!department) {
    return NextResponse.json({ error: "department parameter required" }, { status: 400 });
  }

  const history = getDeptExecutionHistory(department, limit);
  return NextResponse.json({ department, executions: history });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { department, intent, context, source } = body;

  if (!department || !intent) {
    return NextResponse.json({ 
      error: "department and intent required" 
    }, { status: 400 });
  }

  const execution = executeDeptHead(
    department,
    intent,
    context || {},
    source || "api_execution"
  );

  return NextResponse.json({ execution });
}