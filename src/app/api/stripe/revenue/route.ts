import { NextResponse } from "next/server";
import { promises as fs } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Real Stripe revenue — ZERO if no data, never fabricate
export async function GET() {
  let stripeKey = "";

  // Read Stripe key from .env
  try {
    const envPath = (process.env.HOME || "/Users/rig128gb") + "/.hermes/.env";
    const envContent = await fs.readFile(envPath, "utf-8");
    const match = envContent.match(/STRIPE_SECRET_KEY=(.+)/);
    stripeKey = match ? match[1].trim() : "";
  } catch {}

  // If no key, return zeros with "not connected" status
  if (!stripeKey || !stripeKey.startsWith("sk_")) {
    return NextResponse.json({
      connected: false,
      mrr: 0,
      arr: 0,
      customers: 0,
      failedPayments: 0,
      recentCharges: [],
      message: "Stripe not connected. Add STRIPE_SECRET_KEY to ~/.hermes/.env",
    });
  }

  try {
    // Fetch real data from Stripe API
    const stripeAPI = "https://api.stripe.com/v1";

    // Get recent charges
    const chargesResp = await fetch(
      `${stripeAPI}/charges?limit=10&created[gt]=${Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60}`,
      { headers: { Authorization: `Bearer ${stripeKey}` }, signal: AbortSignal.timeout(10000) }
    );

    if (!chargesResp.ok) {
      return NextResponse.json({
        connected: false,
        mrr: 0,
        arr: 0,
        customers: 0,
        message: `Stripe API error: ${chargesResp.status}`,
      });
    }

    const chargesData = await chargesResp.json();
    const charges = chargesData.data || [];

    // Get customer count
    const customersResp = await fetch(
      `${stripeAPI}/customers?limit=100`,
      { headers: { Authorization: `Bearer ${stripeKey}` }, signal: AbortSignal.timeout(10000) }
    );
    const customersData = customersResp.ok ? await customersResp.json() : { data: [] };

    // Calculate MRR from successful charges in last 30 days
    const successfulCharges = charges.filter((c: { paid: boolean }) => c.paid);
    const last30Revenue = successfulCharges.reduce(
      (sum: number, c: { amount: number }) => sum + c.amount, 0
    );

    // Count failed payments
    const failedPayments = charges.filter(
      (c: { paid: boolean; status: string }) => !c.paid && c.status === "failed"
    ).length;

    return NextResponse.json({
      connected: true,
      mrr: Math.round(last30Revenue / 100), // Convert cents to dollars
      arr: Math.round((last30Revenue / 100) * 12),
      customers: customersData.data?.length || 0,
      failedPayments,
      recentCharges: charges.slice(0, 5).map((c: { amount: number; created: number; status: string; paid: boolean; receipt_email?: string }) => ({
        amount: c.amount / 100,
        date: new Date(c.created * 1000).toISOString(),
        status: c.paid ? "paid" : c.status,
        email: c.receipt_email || "—",
      })),
      verifiedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({
      connected: false,
      mrr: 0,
      arr: 0,
      message: `Stripe error: ${(e as Error).message}`,
    });
  }
}
