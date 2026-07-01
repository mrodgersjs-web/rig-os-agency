import { NextResponse } from "next/server";
import { dbGetContracts, dbGetInvoices } from "@/lib/db";
import { SERVICE_TIERS } from "@/lib/agency-data";

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