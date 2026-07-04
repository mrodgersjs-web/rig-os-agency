// src/app/api/harness/route.ts
// Harness API: list, create, get, run step, run to done, approve

import { NextResponse } from "next/server";
import "@/lib/harness-init";
import {
  initHarness, createHarness, getHarness, listHarnesses, updateHarness,
  runHarnessStep, runHarnessToDone, approveHarnessStep,
} from "@/lib/harness-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await initHarness();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const harness = getHarness(id);
    if (!harness) return NextResponse.json({ error: "harness not found" }, { status: 404 });
    return NextResponse.json({ harness });
  }
  return NextResponse.json({ harnesses: listHarnesses() });
}

export async function POST(request: Request) {
  await initHarness();
  const body = await request.json().catch(() => ({}));
  const { action } = body;

  switch (action) {
    case "create": {
      const { loopId, intent, context } = body;
      if (!loopId || !intent) {
        return NextResponse.json({ error: "loopId and intent required" }, { status: 400 });
      }
      try {
        const harness = createHarness(loopId, intent, context);
        return NextResponse.json({ harness });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
    }

    case "run-step": {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      try {
        const harness = await runHarnessStep(id);
        return NextResponse.json({ harness });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    case "run": {
      const { id, approved } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      try {
        const harness = await runHarnessToDone(id, approved === true);
        return NextResponse.json({ harness });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    case "approve": {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      try {
        const harness = await approveHarnessStep(id);
        return NextResponse.json({ harness });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    case "pause": {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const harness = updateHarness(id, { status: "paused" });
      return NextResponse.json({ harness });
    }

    case "reset": {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const harness = getHarness(id);
      if (!harness) return NextResponse.json({ error: "harness not found" }, { status: 404 });
      const reset = updateHarness(id, {
        status: "idle",
        currentStepIndex: 0,
        steps: harness.steps.map((s) => ({ ...s, status: "pending", missionId: undefined, result: undefined, error: undefined })),
      });
      return NextResponse.json({ harness: reset });
    }

    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
