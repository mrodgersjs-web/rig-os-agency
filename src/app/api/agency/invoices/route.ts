import { NextResponse } from "next/server";
import { dbGetInvoices, dbCreateInvoice, dbUpdateInvoiceStatus, dbGenerateInvoicesFromContracts } from "@/lib/db";
import type { Invoice } from "@/lib/agency-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = dbGetInvoices();
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Bulk generate invoices from active contracts
    if (body.action === "generateFromContracts") {
      const generated = dbGenerateInvoicesFromContracts();
      return NextResponse.json({ success: true, generated, count: generated.length });
    }

    // Update invoice status (mark paid, etc.)
    if (body.action === "updateStatus") {
      dbUpdateInvoiceStatus(body.id, body.status, body.paidDate || null);
      return NextResponse.json({ success: true });
    }

    // Create individual invoice
    const now = new Date().toISOString();
    const dueDate = body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString();

    const invoice: Invoice = {
      id: body.id || `INV-${Date.now()}`,
      clientId: body.clientId || "",
      clientName: body.clientName || "Untitled",
      amount: body.amount || 0,
      status: body.status || "draft",
      sentDate: body.sentDate || now,
      paidDate: body.paidDate || null,
      dueDate,
      lineItems: body.lineItems || [{ description: "Monthly retainer", amount: body.amount || 0 }],
      createdAt: now,
    };

    dbCreateInvoice(invoice);
    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error) {
    console.error("Invoices POST error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
