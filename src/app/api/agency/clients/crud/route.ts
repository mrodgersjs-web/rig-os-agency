import { NextResponse } from "next/server";
import { dbGetClients, dbCreateClient, dbUpdateClient, dbDeleteClient } from "@/lib/agency-store";

export const dynamic = "force-dynamic";

// GET /api/agency/clients — list all clients
export async function GET() {
  const clients = await dbGetClients();
  return NextResponse.json({ clients });
}

// POST /api/agency/clients — create a new client
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = ["name", "vertical", "contactName", "contactEmail"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    const client = await dbCreateClient({
      name: body.name,
      vertical: body.vertical,
      status: body.status || "prospect",
      health: body.health || "green",
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone || "",
      website: body.website || "",
      serviceTier: body.serviceTier || "starter",
      monthlyFee: body.monthlyFee || 2500,
      annualFee: body.annualFee || 30000,
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || null,
      autoRenew: body.autoRenew || false,
      services: body.services || [],
      assignedAgents: body.assignedAgents || [],
      notes: body.notes || "",
    });
    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PATCH /api/agency/clients — update a client (body must include id)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing client id" }, { status: 400 });
    }
    const { id, ...updates } = body;
    const client = await dbUpdateClient(id, updates);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, client });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/agency/clients?id=xxx — delete a client
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }
  const deleted = await dbDeleteClient(id);
  if (!deleted) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}