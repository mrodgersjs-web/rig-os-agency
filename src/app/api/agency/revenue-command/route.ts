import { NextResponse } from "next/server";
import { loadClients, loadPipeline } from "@/lib/agency-store";
import { getRevenueProjections, getVerticals, getServiceTiers } from "@/lib/agency-data";

export const dynamic = "force-dynamic";

// Revenue Command Center — computes the exact path to $10M ARR
// Uses real client + pipeline data (no mock numbers)

const TARGET_ARR = 10_000_000;
const TARGET_MRR = Math.round(TARGET_ARR / 12);
const TARGET_DATE = new Date("2027-12-31T00:00:00Z");
const NOW = new Date();

interface TierVelocity {
  tier: string;
  name: string;
  monthlyFee: number;
  annualFee: number;
  clientsNeeded: number;
  arrContribution: number;
  color: string;
}

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  conversionRate: number;
  avgDealSize: number;
  weightedValue: number;
  color: string;
}

interface MonthlyTarget {
  month: string;
  targetARR: number;
  targetClients: number;
  newClientsNeeded: number;
  mrrNeeded: number;
  cumulativeARR: number;
  isPast: boolean;
}

export async function GET() {
  try {
    const clients = await loadClients();
    const pipeline = await loadPipeline();
    const projections = getRevenueProjections();
    const verticals = getVerticals();
    const tiers = getServiceTiers();

    // ── Current revenue state ──────────────────────────────────────
    const activeClients = clients.filter((c) => c.status === "active");
    const currentMRR = activeClients.reduce((sum, c) => sum + c.monthlyFee, 0);
    const currentARR = currentMRR * 12;
    const arrGap = TARGET_ARR - currentARR;
    const monthsRemaining = Math.max(0, Math.ceil((TARGET_DATE.getTime() - NOW.getTime()) / (30.44 * 86400000)));

    // ── Pipeline analysis ──────────────────────────────────────────
    const pipelineValue = pipeline.reduce((sum, d) => sum + d.dealSize * (d.probability / 100), 0);
    const pipelineTotal = pipeline.reduce((sum, d) => sum + d.dealSize, 0);
    const avgDealSize = pipeline.length > 0 ? pipelineTotal / pipeline.length : 0;
    const avgWinRate = pipeline.length > 0
      ? pipeline.reduce((sum, d) => sum + d.probability, 0) / pipeline.length / 100
      : 0;

    // ── Monthly acquisition velocity needed ────────────────────────
    const mrrPerNewClient = activeClients.length > 0 ? currentMRR / activeClients.length : 5000;
    const newMRRNeededPerMonth = (TARGET_MRR - currentMRR) / Math.max(1, monthsRemaining);
    const newClientsPerMonth = Math.ceil(newMRRNeededPerMonth / mrrPerNewClient);

    // ── Tier-based path to $10M ────────────────────────────────────
    const tierPaths: TierVelocity[] = tiers.map((t) => {
      const arrContribution = activeClients
        .filter((c) => c.serviceTier === t.id)
        .reduce((sum, c) => sum + c.annualFee, 0);
      const clientsNeeded = Math.ceil((TARGET_ARR - currentARR + arrContribution) / Math.max(1, t.annualFee));
      return {
        tier: t.id,
        name: t.name,
        monthlyFee: t.monthlyFee,
        annualFee: t.annualFee,
        clientsNeeded,
        arrContribution,
        color: t.color,
      };
    });

    // ── Blended tier mix (most realistic path) ─────────────────────
    // Assume 30% Starter, 30% Growth, 25% Scale, 15% Enterprise
    const tierMix = [
      { tier: "starter", pct: 0.30 },
      { tier: "growth", pct: 0.30 },
      { tier: "scale", pct: 0.25 },
      { tier: "enterprise", pct: 0.15 },
    ];
    const blendedARRPerClient = tierMix.reduce((sum, m) => {
      const tier = tiers.find((t) => t.id === m.tier);
      return sum + (tier ? tier.annualFee * m.pct : 0);
    }, 0);
    const blendedClientsNeeded = Math.ceil((TARGET_ARR - currentARR + currentARR) / blendedARRPerClient);
    const blendedNewClients = Math.max(0, blendedClientsNeeded - activeClients.length);

    // ── Funnel stages with real data ───────────────────────────────
    const stageConfig = [
      { stage: "prospect", label: "Prospects", color: "#a855f7", convRate: 0.25 },
      { stage: "qualified", label: "Qualified", color: "#fbbf24", convRate: 0.40 },
      { stage: "proposal_sent", label: "Proposal Sent", color: "#d4a574", convRate: 0.55 },
      { stage: "negotiation", label: "Negotiation", color: "#c4607e", convRate: 0.75 },
      { stage: "active", label: "Closed Won", color: "#5ab896", convRate: 1.0 },
    ];
    const funnel: FunnelStage[] = stageConfig.map((sc) => {
      const stageClients = clients.filter((c) => c.status === sc.stage);
      const stageDeals = pipeline.filter((d) => d.stage === sc.stage);
      const count = stageClients.length + stageDeals.length;
      const avgSize = count > 0
        ? (stageClients.reduce((s, c) => s + c.annualFee, 0) + stageDeals.reduce((s, d) => s + d.dealSize, 0)) / count
        : avgDealSize;
      return {
        stage: sc.stage,
        label: sc.label,
        count,
        conversionRate: sc.convRate,
        avgDealSize: avgSize,
        weightedValue: count * avgSize * sc.convRate,
        color: sc.color,
      };
    });

    // ── Monthly milestones from now to target ──────────────────────
    const milestones: MonthlyTarget[] = [];
    const startARR = currentARR;
    const arrGrowthNeeded = TARGET_ARR - startARR;
    const monthsToGenerate = Math.min(18, monthsRemaining);
    for (let i = 0; i <= monthsToGenerate; i++) {
      const date = new Date(NOW.getFullYear(), NOW.getMonth() + i, 1);
      const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const targetARR = Math.round(startARR + (arrGrowthNeeded * i / monthsToGenerate));
      const targetClients = Math.round(activeClients.length + (blendedNewClients * i / monthsToGenerate));
      const newThisMonth = i === 0 ? 0 : Math.ceil(blendedNewClients / monthsToGenerate);
      milestones.push({
        month: monthLabel,
        targetARR,
        targetClients,
        newClientsNeeded: newThisMonth,
        mrrNeeded: Math.round(targetARR / 12),
        cumulativeARR: targetARR,
        isPast: i === 0,
      });
    }

    // ── Vertical ARR analysis ──────────────────────────────────────
    const verticalARR = verticals.map((v) => {
      const vClients = activeClients.filter((c) => c.vertical === v.id);
      const arr = vClients.reduce((s, c) => s + c.annualFee, 0);
      const pipelineARR = pipeline
        .filter((d) => d.vertical === v.id)
        .reduce((s, d) => s + d.dealSize * (d.probability / 100), 0);
      return {
        id: v.id,
        name: v.name,
        color: v.color,
        currentClients: vClients.length,
        currentARR: arr,
        pipelineARR,
        targetARR: v.targetARR,
        gapToTarget: Math.max(0, v.targetARR - arr),
        progress: v.targetARR > 0 ? (arr / v.targetARR) * 100 : 0,
      };
    });

    // ── Key metrics ────────────────────────────────────────────────
    const metrics = {
      currentARR,
      targetARR: TARGET_ARR,
      arrGap,
      currentMRR,
      targetMRR: TARGET_MRR,
      mrrGap: TARGET_MRR - currentMRR,
      activeClients: activeClients.length,
      pipelineValue,
      pipelineCount: pipeline.length,
      avgDealSize,
      avgWinRate,
      monthsRemaining,
      mrrPerNewClient,
      newClientsPerMonth,
      newMRRNeededPerMonth,
      blendedARRPerClient,
      blendedClientsNeeded,
      blendedNewClients,
      arrProgressPct: (currentARR / TARGET_ARR) * 100,
    };

    return NextResponse.json({
      metrics,
      tierPaths,
      funnel,
      milestones,
      verticalARR,
      generatedAt: NOW.toISOString(),
    });
  } catch (err) {
    console.error("Revenue Command Center error:", err);
    return NextResponse.json({ error: "Failed to compute revenue command data" }, { status: 500 });
  }
}
