import { NextResponse } from "next/server";
import {
  loadProposals,
  createProposal,
  updateProposal,
  deleteProposal,
} from "@/lib/agency-store";
import { loadClients } from "@/lib/agency-store";
import { VERTICALS } from "@/lib/agency-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/proposals — list all proposals with verticals
export async function GET() {
  try {
    const proposals = await loadProposals();
    return NextResponse.json({ proposals, verticals: VERTICALS });
  } catch {
    return NextResponse.json({ proposals: [], verticals: VERTICALS });
  }
}

// POST /api/agency/proposals — create a new proposal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.clientId || !body.scope) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, scope" },
        { status: 400 }
      );
    }
    const clients = await loadClients();
    const client = clients.find((c) => c.id === body.clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const proposal = await createProposal({
      clientId: body.clientId,
      clientName: client.name,
      vertical: client.vertical,
      scope: body.scope,
      monthlyFee: body.monthlyFee || 2500,
      annualValue: body.annualValue || (body.monthlyFee || 2500) * 12,
      status: body.status || "draft",
      sentDate: body.sentDate || null,
      acceptedDate: body.acceptedDate || null,
      validUntil:
        body.validUntil ||
        new Date(Date.now() + 30 * 86400000).toISOString(),
      proofPacketId: null,
    });
    return NextResponse.json({ success: true, proposal }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PATCH /api/agency/proposals — update a proposal
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing proposal id" }, { status: 400 });
    }
    const { id, ...updates } = body;
    const proposal = await updateProposal(id, updates);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, proposal });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/agency/proposals?id=xxx
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }
  const deleted = await deleteProposal(id);
  if (!deleted) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}