import { NextResponse } from "next/server";
import { dbGetContracts, dbCreateContract, dbUpdateContractStatus, dbGetInvoices } from "@/lib/db";
import { SERVICE_TIERS } from "@/lib/agency-data";
import type { Contract } from "@/lib/agency-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const contracts = dbGetContracts();
    const invoices = dbGetInvoices();
    return NextResponse.json({ contracts, invoices, serviceTiers: SERVICE_TIERS });
  } catch (error) {
    console.error("Contracts GET error:", error);
    return NextResponse.json({ error: "Failed to load contracts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "updateStatus") {
      dbUpdateContractStatus(body.id, body.status);
      return NextResponse.json({ success: true });
    }

    const now = new Date().toISOString();
    const startDate = body.startDate || now;
    const contractDurationDays = body.contractDurationDays || 365;
    const endDate = body.endDate || new Date(Date.now() + contractDurationDays * 86400000).toISOString();

    const contract: Contract = {
      id: `c${Date.now()}`,
      clientId: body.clientId || "",
      clientName: body.clientName || "Untitled",
      type: body.type || "retainer",
      monthlyFee: body.monthlyFee || 5000,
      startDate,
      endDate,
      autoRenew: body.autoRenew ?? true,
      status: body.status || "draft",
      terms: body.terms || "Standard service agreement. Monthly retainer includes agreed deliverables. 30-day notice for cancellation.",
      slaHours: body.slaHours || 48,
      createdAt: now,
    };

    dbCreateContract(contract);
    return NextResponse.json({ success: true, contract }, { status: 201 });
  } catch (error) {
    console.error("Contracts POST error:", error);
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
