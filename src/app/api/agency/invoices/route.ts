import { NextResponse } from "next/server";
import {
  loadInvoices,
  updateInvoice,
  deleteInvoice,
} from "@/lib/agency-store";
import { loadClients } from "@/lib/agency-store";
import { saveInvoices } from "@/lib/agency-store";
import type { Invoice } from "@/lib/agency-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/invoices — list all invoices
export async function GET() {
  try {
    const invoices = await loadInvoices();
    return NextResponse.json({ invoices });
  } catch {
    return NextResponse.json({ invoices: [] });
  }
}

// POST /api/agency/invoices — create a new invoice
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
    const amount = body.amount || client.monthlyFee;
    const now = new Date();
    const dueDate = body.dueDate || new Date(now.getTime() + 30 * 86400000).toISOString();
    const lineItems = body.lineItems || [
      { description: `${client.serviceTier} tier — monthly retainer`, amount },
    ];
    const invoices = await loadInvoices();
    const id = `inv${String(invoices.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`;
    const invoice: Invoice = {
      id,
      clientId: body.clientId,
      clientName: client.name,
      amount,
      status: body.status || "draft",
      sentDate: body.sentDate || now.toISOString(),
      paidDate: body.paidDate || null,
      dueDate,
      lineItems,
      createdAt: now.toISOString(),
    };
    const updated = [...invoices, invoice];
    await saveInvoices(updated);
    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PATCH /api/agency/invoices — update an invoice (e.g., mark as paid)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });
    }
    const { id, ...updates } = body;
    const invoice = await updateInvoice(id, updates);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, invoice });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/agency/invoices?id=xxx
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }
  const deleted = await deleteInvoice(id);
  if (!deleted) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}