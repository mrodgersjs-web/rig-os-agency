import { NextResponse } from "next/server";
import { dbGetClients, dbGetDashboardKPIs, dbGetPipelineDeals } from "@/lib/db";
import { VERTICALS, SERVICE_TIERS, getRevenueByVertical, getRevenueByTier } from "@/lib/agency-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kpis = dbGetDashboardKPIs();
    const clients = dbGetClients();
    return NextResponse.json({
      kpis,
      clients,
      verticals: VERTICALS,
      serviceTiers: SERVICE_TIERS,
      revenueByVertical: getRevenueByVertical(),
      revenueByTier: getRevenueByTier(),
      pipeline: dbGetPipelineDeals(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}