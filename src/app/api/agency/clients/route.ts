import { NextResponse } from "next/server";
import { loadClients, createClient } from "@/lib/agency-store";
import type { Client } from "@/lib/agency-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/clients — list all clients
export async function GET() {
  const clients = await loadClients();
  return NextResponse.json({ clients, count: clients.length });
}

// POST /api/agency/clients — create a new client
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required: (keyof Client)[] = ["name", "vertical", "status", "health", "contactName", "contactEmail", "serviceTier", "monthlyFee", "annualFee"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const newClient = await createClient({
      name: body.name,
      vertical: body.vertical,
      status: body.status,
      health: body.health,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone || "",
      website: body.website || "",
      serviceTier: body.serviceTier,
      monthlyFee: Number(body.monthlyFee),
      annualFee: Number(body.annualFee),
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || null,
      autoRenew: body.autoRenew ?? false,
      services: body.services || [],
      assignedAgents: body.assignedAgents || [],
      notes: body.notes || "",
    });

    return NextResponse.json({ client: newClient, success: true }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}