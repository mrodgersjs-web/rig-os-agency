import { NextResponse } from "next/server";
import { loadClients, loadPipeline } from "@/lib/agency-store";
import { getRevenueProjections, getVerticals, getServiceTiers } from "@/lib/agency-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clients = await loadClients();
    const pipeline = await loadPipeline();
    const projections = getRevenueProjections();
    const verticals = getVerticals();
    const tiers = getServiceTiers();

    const active = clients.filter((c) => c.status === "active");
    const currentMRR = active.reduce((sum, c) => sum + c.monthlyFee, 0);
    const currentARR = currentMRR * 12;
    const targetARR = 10_000_000;
    const avgClientValue = active.length > 0 ? currentARR / active.length : 0;
    const pipelineValue = pipeline.reduce((sum, d) => sum + d.dealSize * (d.probability / 100), 0);

    const revenueByVertical = verticals.map((v) => {
      const vClients = clients.filter((c) => c.vertical === v.id && c.status === "active");
      const arr = vClients.reduce((sum, c) => sum + c.annualFee, 0);
      return { vertical: v.id, name: v.name, arr, clientCount: vClients.length, color: v.color };
    });

    const revenueByTier = tiers.map((t) => {
      const tClients = clients.filter((c) => c.serviceTier === t.id && c.status === "active");
      const arr = tClients.reduce((sum, c) => sum + c.annualFee, 0);
      return { tier: t.id, name: t.name, arr, clientCount: tClients.length, color: t.color };
    });

    return NextResponse.json({
      kpis: {
        currentARR,
        targetARR,
        arrGap: targetARR - currentARR,
        currentMRR,
        targetMRR: 833_333,
        activeClients: active.length,
        pipelineValue,
        pipelineCount: pipeline.length,
        avgClientValue,
        churnRate: 0.05,
        growthRate: 0,
      },
      projections,
      revenueByVertical,
      revenueByTier,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load revenue data" }, { status: 500 });
  }
}