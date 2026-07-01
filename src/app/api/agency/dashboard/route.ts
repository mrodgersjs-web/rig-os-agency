import { NextResponse } from "next/server";
import { getClients, getDashboardKPIs, getRevenueByVertical, getRevenueByTier } from "@/lib/agency-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    kpis: getDashboardKPIs(),
    clients: getClients(),
    revenueByVertical: getRevenueByVertical(),
    revenueByTier: getRevenueByTier(),
  });
}