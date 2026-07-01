import { NextResponse } from "next/server";
import { dbGetClients, dbCreateClient } from "@/lib/db";
import { VERTICALS } from "@/lib/agency-data";
import type { Client } from "@/lib/agency-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clients = dbGetClients();
    return NextResponse.json({ clients, verticals: VERTICALS });
  } catch (error) {
    console.error("Clients GET error:", error);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const client: Client = {
      id: body.id || `c${Date.now()}`,
      name: body.name || "Untitled Client",
      vertical: body.vertical || "services",
      status: body.status || "prospect",
      health: body.health || "green",
      contactName: body.contactName || "",
      contactEmail: body.contactEmail || "",
      contactPhone: body.contactPhone || "",
      website: body.website || "",
      serviceTier: body.serviceTier || "starter",
      monthlyFee: body.monthlyFee || 2500,
      annualFee: body.annualFee || (body.monthlyFee || 2500) * 12,
      startDate: body.startDate || now,
      endDate: body.endDate || null,
      autoRenew: body.autoRenew || false,
      services: body.services || [],
      assignedAgents: body.assignedAgents || [],
      notes: body.notes || "",
      createdAt: now,
      updatedAt: now,
    };
    dbCreateClient(client);
    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error) {
    console.error("Clients POST error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}