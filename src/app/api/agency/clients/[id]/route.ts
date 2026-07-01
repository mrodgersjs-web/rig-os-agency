import { NextResponse } from "next/server";
import { dbGetClient, dbUpdateClient, dbDeleteClient } from "@/lib/db";
import type { Client } from "@/lib/agency-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = dbGetClient(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ client });
  } catch (error) {
    console.error("Client GET error:", error);
    return NextResponse.json({ error: "Failed to load client" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await request.json();
    dbUpdateClient(id, updates as Partial<Client>);
    const updated = dbGetClient(id);
    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error("Client PUT error:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    dbDeleteClient(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Client DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}