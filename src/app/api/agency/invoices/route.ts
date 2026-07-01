import { NextResponse } from "next/server";
import { dbGetInvoices } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ invoices: dbGetInvoices() });
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}