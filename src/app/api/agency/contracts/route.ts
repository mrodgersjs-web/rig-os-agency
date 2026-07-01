import { NextResponse } from "next/server";
import {
  loadContracts,
  createContract,
  updateContract,
  deleteContract,
} from "@/lib/agency-store";
import { loadClients } from "@/lib/agency-store";
import { SERVICE_TIERS } from "@/lib/agency-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/contracts — list all contracts
export async function GET() {
  try {
    const contracts = await loadContracts();
    return NextResponse.json({ contracts, serviceTiers: SERVICE_TIERS });
  } catch {
    return NextResponse.json({ contracts: [], serviceTiers: SERVICE_TIERS });
  }
}

// POST /api/agency/contracts — create a new contract
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.clientId) {
      return NextResponse.json(
        { error: "Missing required field: clientId" },
        { status: 400 }
      );
    }
    const clients = await loadClients();
    const client = clients.find((c) => c.id === body.clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const tier = SERVICE_TIERS.find((t) => t.id === (body.type || client.serviceTier));
    const slaHours = tier?.slaHours || 48;
    const monthlyFee = body.monthlyFee || client.monthlyFee;
    const startDate = body.startDate || new Date().toISOString();
    const endDate =
      body.endDate || new Date(Date.now() + 365 * 86400000).toISOString();
    const contract = await createContract({
      clientId: body.clientId,
      clientName: client.name,
      type: body.type || client.serviceTier,
      monthlyFee,
      startDate,
      endDate,
      autoRenew: body.autoRenew ?? true,
      status: body.status || "active",
      terms:
        body.terms ||
        `${body.type || client.serviceTier} tier, SLA ${slaHours}h`,
      slaHours,
    });
    return NextResponse.json({ success: true, contract }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PATCH /api/agency/contracts — update a contract
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing contract id" }, { status: 400 });
    }
    const { id, ...updates } = body;
    const contract = await updateContract(id, updates);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, contract });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/agency/contracts?id=xxx
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }
  const deleted = await deleteContract(id);
  if (!deleted) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}