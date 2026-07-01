import { NextResponse } from "next/server";
import { getDashboardKPIsFromStore, loadClients, loadPipeline } from "@/lib/agency-store";
import { VERTICALS, SERVICE_TIERS } from "@/lib/agency-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/dashboard — computed KPIs from persisted data
export async function GET() {
  const kpis = await getDashboardKPIsFromStore();
  const clients = await loadClients();

  // Revenue by vertical (from persisted clients)
  const revenueByVertical = VERTICALS.map((v) => {
    const vClients = clients.filter((c) => c.vertical === v.id && c.status === "active");
    const arr = vClients.reduce((sum, c) => sum + c.annualFee, 0);
    return { vertical: v.id, name: v.name, arr, clientCount: vClients.length, color: v.color };
  });

  // Revenue by tier (from persisted clients)
  const revenueByTier = SERVICE_TIERS.map((t) => {
    const tClients = clients.filter((c) => c.serviceTier === t.id && c.status === "active");
    const arr = tClients.reduce((sum, c) => sum + c.annualFee, 0);
    return { tier: t.id, name: t.name, arr, clientCount: tClients.length, color: t.color };
  });

  // Status breakdown
  const statusBreakdown = {
    active: clients.filter((c) => c.status === "active").length,
    prospect: clients.filter((c) => c.status === "prospect").length,
    qualified: clients.filter((c) => c.status === "qualified").length,
    proposal_sent: clients.filter((c) => c.status === "proposal_sent").length,
    negotiation: clients.filter((c) => c.status === "negotiation").length,
    churned: clients.filter((c) => c.status === "churned").length,
    lost: clients.filter((c) => c.status === "lost").length,
  };

  // Health breakdown
  const healthBreakdown = {
    green: clients.filter((c) => c.health === "green").length,
    yellow: clients.filter((c) => c.health === "yellow").length,
    red: clients.filter((c) => c.health === "red").length,
  };

  return NextResponse.json({
    kpis,
    revenueByVertical,
    revenueByTier,
    statusBreakdown,
    healthBreakdown,
    verticals: VERTICALS,
    serviceTiers: SERVICE_TIERS,
  });
}