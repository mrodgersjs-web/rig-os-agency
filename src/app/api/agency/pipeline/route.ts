import { NextResponse } from "next/server";
import {
  loadPipeline,
  createPipelineDeal,
  updatePipelineDeal,
  deletePipelineDeal,
} from "@/lib/agency-store";
import { VERTICALS } from "@/lib/agency-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/pipeline — list all deals with verticals
export async function GET() {
  try {
    const deals = await loadPipeline();
    return NextResponse.json({ deals, verticals: VERTICALS });
  } catch {
    return NextResponse.json({ deals: [], verticals: VERTICALS });
  }
}

// POST /api/agency/pipeline — create a new deal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.clientName || !body.vertical) {
      return NextResponse.json(
        { error: "Missing required fields: clientName, vertical" },
        { status: 400 }
      );
    }
    const deal = await createPipelineDeal({
      clientName: body.clientName,
      vertical: body.vertical,
      dealSize: body.dealSize || 30000,
      probability: body.probability || 10,
      nextAction: body.nextAction || "Discovery call",
      nextActionDate:
        body.nextActionDate ||
        new Date(Date.now() + 7 * 86400000).toISOString(),
      stage: body.stage || "prospect",
    });
    return NextResponse.json({ success: true, deal }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PUT /api/agency/pipeline — update a deal (used by drag-and-drop)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing deal id" }, { status: 400 });
    }
    const { id, ...updates } = body;
    const deal = await updatePipelineDeal(id, updates);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deal });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PATCH /api/agency/pipeline — update a deal
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing deal id" }, { status: 400 });
    }
    const { id, ...updates } = body;
    const deal = await updatePipelineDeal(id, updates);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deal });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/agency/pipeline?id=xxx
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }
  const deleted = await deletePipelineDeal(id);
  if (!deleted) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}