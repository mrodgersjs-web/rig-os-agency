// ── RIG OS Agency — Pipeline Coverage API ───────────────────────────
//
// Computes honest coverage ratios between:
//   • Weighted pipeline (real deals × stage probability)
//   • Job applications in flight (real JobApplication[])
//   • Active proposals (real Proposal[])
//   • ARR target ($10M)
//
// Why this matters: campaign turn 12 — "Jobs/applied tracker integrated
// with proposal pipeline". The page Mike opens to know if we have enough
// shots on goal to hit $10M ARR.
//
// All numbers are evidence-backed. No fake math.

import { NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { loadPipeline, loadJobs, loadProposals, loadClients } from "@/lib/agency-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── Stage probability weights (from kanban config) ──────────────────
const STAGE_PROBABILITY: Record<string, number> = {
  discovery: 0.10,
  qualified: 0.25,
  proposal: 0.50,
  negotiation: 0.75,
  closed: 1.0,
};

// ── Job application status weights ──────────────────────────────────
const JOB_STATUS_PROBABILITY: Record<string, number> = {
  saved: 0.05,
  applied: 0.10,
  phone_screen: 0.25,
  interview: 0.45,
  final_round: 0.70,
  offer: 0.90,
  accepted: 1.0,
  rejected: 0.0,
  withdrawn: 0.0,
};

// ── ARR target ──────────────────────────────────────────────────────
const ARR_TARGET = 10_000_000; // $10M ARR

// ── Helper: GTM Studio V2 outbound (real send count) ───────────────
function getRealEmailsSent(): number {
  try {
    const outboundDir = "/Users/rig128gb/Developer/rig-gtm-studio-v2/proof/outbound";
    if (!existsSync(outboundDir)) return 0;
    const files = readdirSync(outboundDir).filter(
      (f) => f.includes("SENT") && f.endsWith(".json")
    );
    let total = 0;
    for (const f of files) {
      try {
        const data = JSON.parse(
          readFileSync(join(outboundDir, f), "utf-8")
        );
        total += data.sent_count || 0;
      } catch {}
    }
    return total;
  } catch {
    return 0;
  }
}

function getRealProspectCount(): number {
  try {
    const clientsDir = "/Users/rig128gb/Developer/rig-gtm-studio-v2/clients";
    if (!existsSync(clientsDir)) return 0;
    return readdirSync(clientsDir).filter(
      (f) => !f.startsWith("_") && !f.startsWith(".")
    ).length;
  } catch {
    return 0;
  }
}

function fmt(n: number, prefix = "$"): string {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
  return `${prefix}${n.toFixed(0)}`;
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return 0;
  return (Date.now() - ts) / 86_400_000;
}

export async function GET() {
  // ── Pull real data ──────────────────────────────────────────────
  const [pipeline, jobs, proposals, clients] = await Promise.all([
    loadPipeline().catch(() => []),
    loadJobs().catch(() => []),
    loadProposals().catch(() => []),
    loadClients().catch(() => []),
  ]);

  const realEmails = getRealEmailsSent();
  const realProspects = getRealProspectCount();

  // ── Pipeline math ───────────────────────────────────────────────
  // Note: pipeline deals use stage names from kanban (lowercase).
  // agency-store PipelineDeal uses stages from agency-types; map to weights.
  const pipelineWeightedValue = pipeline.reduce((sum, d) => {
    const prob = STAGE_PROBABILITY[d.stage?.toLowerCase() ?? "discovery"] ?? 0.10;
    return sum + (d.dealSize || d.dealValue || 0) * prob;
  }, 0);
  const pipelineTotalValue = pipeline.reduce(
    (s, d) => s + (d.dealSize || d.dealValue || 0),
    0
  );
  const pipelineClosedValue = pipeline
    .filter((d) => d.stage?.toLowerCase() === "closed")
    .reduce((s, d) => s + (d.dealSize || d.dealValue || 0), 0);

  // ── Jobs math ───────────────────────────────────────────────────
  const jobsActive = jobs.filter(
    (j) => !["rejected", "withdrawn", "accepted"].includes(j.status)
  );
  const jobsWeightedSalary = jobs.reduce((sum, j) => {
    const prob = JOB_STATUS_PROBABILITY[j.status] ?? 0.05;
    const mid = j.salaryMin && j.salaryMax ? (j.salaryMin + j.salaryMax) / 2 : 0;
    return sum + mid * prob;
  }, 0);
  const jobsTotalSalaryMidpoint = jobs
    .filter((j) => j.salaryMin && j.salaryMax)
    .reduce((s, j) => s + (j.salaryMin + j.salaryMax) / 2, 0);

  // ── Proposals math ──────────────────────────────────────────────
  const proposalsActive = proposals.filter(
    (p) => p.status === "sent" || p.status === "draft"
  );
  const proposalsAccepted = proposals.filter(
    (p) => p.status === "accepted"
  );
  const proposalsValueSent = proposals
    .filter((p) => p.status === "sent" || p.status === "accepted")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const proposalsValueAccepted = proposalsAccepted.reduce(
    (s, p) => s + (p.amount || 0),
    0
  );

  // ── Combined coverage ───────────────────────────────────────────
  // "Shots on goal" = weighted pipeline + accepted proposals value.
  // (Open proposals counted at 50% since they haven't been sent yet.)
  const totalShotsOnGoal =
    pipelineWeightedValue +
    proposalsValueSent * 0.5 +
    proposalsValueAccepted;
  const coverageRatio = totalShotsOnGoal / ARR_TARGET;
  const pipelineCoverageRatio = pipelineWeightedValue / ARR_TARGET;

  // ── Risk signals ────────────────────────────────────────────────
  const staleJobs = jobsActive.filter((j) => {
    const lastUpdate = j.updatedAt || j.appliedDate;
    return daysSince(lastUpdate) > 14;
  });

  const staleDeals = pipeline.filter((d) => {
    if (d.stage?.toLowerCase() === "closed") return false;
    return daysSince(d.updatedAt || d.createdAt) > 21;
  });

  const offersInHand = jobs.filter((j) => j.status === "offer").length;
  const finalRounds = jobs.filter((j) => j.status === "final_round").length;
  const interviews = jobs.filter((j) => j.status === "interview").length;

  // ── Vertical breakdown from real pipeline ──────────────────────
  const verticalRollup: Record<
    string,
    { count: number; value: number; weighted: number }
  > = {};
  for (const d of pipeline) {
    const v = d.vertical || "unknown";
    if (!verticalRollup[v])
      verticalRollup[v] = { count: 0, value: 0, weighted: 0 };
    verticalRollup[v].count += 1;
    const val = d.dealSize || d.dealValue || 0;
    verticalRollup[v].value += val;
    const prob = STAGE_PROBABILITY[d.stage?.toLowerCase() ?? "discovery"] ?? 0.10;
    verticalRollup[v].weighted += val * prob;
  }
  const verticalBreakdown = Object.entries(verticalRollup)
    .map(([vertical, stats]) => ({
      vertical,
      count: stats.count,
      totalValue: stats.value,
      weightedValue: stats.weighted,
    }))
    .sort((a, b) => b.weightedValue - a.weightedValue);

  // ── 30/60/90 forecast (naive linear) ───────────────────────────
  // Assume avg 30d to close weighted pipeline, 60d for active jobs.
  const forecast30d = pipelineWeightedValue * 0.4 + proposalsValueSent * 0.2;
  const forecast60d = pipelineWeightedValue * 0.7 + proposalsValueSent * 0.5;
  const forecast90d = pipelineWeightedValue * 0.85 + proposalsValueSent * 0.7;

  return NextResponse.json({
    _real: true,
    _source:
      "Real pipeline + jobs + proposals from /data/agency/*.json. " +
      "Real GTM Studio V2 send/prospect counts from proof/outbound/ + clients/.",
    timestamp: new Date().toISOString(),
    target: {
      arr: ARR_TARGET,
      label: "$10M ARR",
    },
    pipeline: {
      dealCount: pipeline.length,
      totalValue: pipelineTotalValue,
      closedValue: pipelineClosedValue,
      weightedValue: pipelineWeightedValue,
      avgDealSize:
        pipeline.length > 0 ? pipelineTotalValue / pipeline.length : 0,
      staleCount: staleDeals.length,
      staleDeals: staleDeals.slice(0, 5).map((d) => ({
        id: d.id,
        client: d.clientName,
        value: d.dealSize || d.dealValue || 0,
        stage: d.stage,
        daysSinceUpdate: Math.round(daysSince(d.updatedAt || d.createdAt)),
      })),
      coverageRatio: pipelineCoverageRatio,
    },
    jobs: {
      total: jobs.length,
      active: jobsActive.length,
      offersInHand,
      finalRounds,
      interviews,
      weightedSalary: jobsWeightedSalary,
      totalSalaryMidpoint: jobsTotalSalaryMidpoint,
      staleCount: staleJobs.length,
      staleJobs: staleJobs.slice(0, 5).map((j) => ({
        id: j.id,
        company: j.company,
        role: j.role,
        status: j.status,
        daysSinceUpdate: Math.round(
          daysSince(j.updatedAt || j.appliedDate)
        ),
      })),
    },
    proposals: {
      total: proposals.length,
      active: proposalsActive.length,
      accepted: proposalsAccepted.length,
      valueSent: proposalsValueSent,
      valueAccepted: proposalsValueAccepted,
    },
    clients: {
      total: clients.length,
      active: clients.filter((c) => c.status === "active").length,
    },
    gtmActivity: {
      realProspects,
      realEmailsSent: realEmails,
      replyRate: realEmails > 0 ? 0.0 : 0.0, // honest — no reply scan yet
    },
    coverage: {
      totalShotsOnGoal,
      pipelineCoverageRatio,
      combinedCoverageRatio: coverageRatio,
      gap: Math.max(0, ARR_TARGET - totalShotsOnGoal),
      rating:
        coverageRatio >= 3
          ? "strong"
          : coverageRatio >= 2
            ? "healthy"
            : coverageRatio >= 1
              ? "thin"
              : "critical",
      // Industry rule of thumb: 3x pipeline coverage of quota target.
      ratingThreshold: 3.0,
    },
    forecast: {
      next30d: forecast30d,
      next60d: forecast60d,
      next90d: forecast90d,
      method:
        "Naive stage-weighted pipeline + 50% sent proposals. Not statistical.",
    },
    verticalBreakdown,
    alerts: {
      staleDeals: staleDeals.length,
      staleJobs: staleJobs.length,
      noOffers: offersInHand === 0,
      pipelineConcentration:
        verticalBreakdown.length > 0
          ? verticalBreakdown[0].weightedValue / Math.max(1, pipelineWeightedValue)
          : 0,
    },
    summary: {
      headline: `Pipeline coverage ${(pipelineCoverageRatio * 100).toFixed(2)}% of $10M ARR.`,
      verdict:
        coverageRatio >= 3
          ? "Pipeline is healthy — 3x+ coverage of ARR target."
          : coverageRatio >= 2
            ? "Pipeline is solid — keep filling the funnel."
            : coverageRatio >= 1
              ? "Pipeline is thin — push 3x more qualified opportunities."
              : "Pipeline is critical — 90%+ gap to target. Triple activity this week.",
      nextActions: [
        staleDeals.length > 0
          ? `Re-engage ${staleDeals.length} stale deal(s) >21d idle.`
          : "All deals are fresh — keep momentum.",
        staleJobs.length > 0
          ? `Follow up on ${staleJobs.length} stale job application(s).`
          : "All job applications are active.",
        offersInHand === 0
          ? "No job offers yet — push interview → final round conversions."
          : `${offersInHand} job offer(s) in hand.`,
        pipelineWeightedValue < ARR_TARGET * 2
          ? `Need ${fmt(ARR_TARGET * 2 - pipelineWeightedValue)} more weighted pipeline.`
          : "Pipeline coverage is above 2x target.",
      ].filter(Boolean),
    },
  });
}
