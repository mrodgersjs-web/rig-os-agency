import { NextResponse } from "next/server";
import { getRevenueProjections, getDashboardKPIs } from "@/lib/agency-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    kpis: getDashboardKPIs(),
    projections: getRevenueProjections(),
  });
}