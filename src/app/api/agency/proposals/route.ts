import { NextResponse } from "next/server";
import { dbGetProposals, dbCreateProposal } from "@/lib/db";
import { getTemplates, getTemplate } from "@/lib/proposal-templates";
import { VERTICALS } from "@/lib/agency-data";
import type { Proposal } from "@/lib/agency-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const proposals = dbGetProposals();
    const templates = getTemplates();
    return NextResponse.json({ proposals, templates, verticals: VERTICALS });
  } catch (error) {
    console.error("Proposals GET error:", error);
    return NextResponse.json({ error: "Failed to load proposals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const validUntil = new Date(Date.now() + 30 * 86400000).toISOString();

    // Auto-fill template if client has a vertical
    const template = body.templateVertical ? getTemplate(body.templateVertical) : null;

    const proposal: Proposal = {
      id: `p${Date.now()}`,
      clientId: body.clientId || "",
      clientName: body.clientName || "Untitled",
      vertical: body.vertical || body.templateVertical || "services",
      scope: body.scope || template?.scope || "Custom AI engagement",
      monthlyFee: body.monthlyFee || template?.pricing?.growth?.monthly || 5000,
      annualValue: body.annualValue || (body.monthlyFee || 5000) * 12,
      status: body.status || "draft",
      sentDate: body.sentDate || null,
      acceptedDate: null,
      validUntil: body.validUntil || validUntil,
      proofPacketId: null,
      createdAt: now,
    };
    dbCreateProposal(proposal);
    return NextResponse.json({ success: true, proposal }, { status: 201 });
  } catch (error) {
    console.error("Proposals POST error:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}