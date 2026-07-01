import { NextResponse } from "next/server";
import { getClient, updateClient, deleteClient } from "@/lib/agency-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/clients/[id] — get a single client
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json({ client });
}

// PUT /api/agency/clients/[id] — update a client
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateClient(id, body);
    if (!updated) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ client: updated, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/agency/clients/[id] — delete a client
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteClient(id);
  if (!deleted) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}