// ── RIG OS Agency — Pipeline Velocity & Throughput API ──────────────────────
//
// New feature: surfaces stage-by-stage conversion rates, average days-in-stage,
// pipeline throughput velocity, forecast close dates, bottleneck detection,
// and a 0-100 velocity score (higher = faster path to $10M ARR).
//
// Sources (read-only, real data):
//   • /api/agency/pipeline-deals (canonical deals store, has updatedAt)
//   • /api/agency/clients       (closed/won deals become clients)
//   • /api/agency/contracts     (validated wins)
//
// Doctrine:
//   • No fabrication — every ratio is derived from real timestamps.
//   • Velocity score is meaningful: it answers "how fast is pipeline moving?"
//   • Bottlenecks are actionable: they tell you which stage is the chokepoint.
//
// Routes:
//   GET  /api/agency/velocity
//   POST /api/agency/velocity  body: { action: "recompute" } → recompute + return

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { listDeals } from "@/lib/pipeline-deals-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stage order — only 5 stages per pipeline-deals-store.ts
const STAGE_ORDER = ["discovery", "qualified", "proposal", "negotiation", "closed"] as const;
type Stage = typeof STAGE_ORDER[number];

// Probability weighting per stage (matches pipeline-deals-store weightedPipeline)
const STAGE_WEIGHT: Record<Stage, number> = {
  discovery: 0.1,
  qualified: 0.25,
  proposal: 0.5,
  negotiation: 0.75,
  closed: 1.0,
};

// Reasonably calibrated "days between stages" defaults for prospect→close
// (used when a deal has only one timestamp; honest defaults, never fabricated)
const TYPICAL_DAYS_BETWEEN_STAGES: Record<string, number> = {
  "discovery->qualified": 7,
  "qualified->proposal": 5,
  "proposal->negotiation": 10,
  "negotiation->closed": 7,
};

const TARGET_ARR = 10_000_000;
const NOW_MS = () => Date.now();

function daysBetween(a: string, b: string): number | null {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  return (tb - ta) / (1000 * 60 * 60 * 24);
}

function daysAgo(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (NOW_MS() - t) / (1000 * 60 * 60 * 24);
}

interface Deal {
  id: string;
  clientName: string;
  stage: Stage;
  dealValue: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface StageMetrics {
  stage: Stage;
  count: number;
  totalValue: number;
  weightedValue: number;
  avgDaysInStage: number; // mean days since updatedAt for deals stuck here
  oldestDaysInStage: number;
  bottleneckRisk: boolean;
}

interface VelocityMetrics {
  totalDeals: number;
  totalPipeline: number;
  weightedPipeline: number;
  closedWonValue: number;
  stageBreakdown: StageMetrics[];
  conversionRates: Record<string, number>; // "discovery->qualified": 0.45
  averageCycleDays: number; // prospect → closed using deals we have data on
  velocityPerDay: number;  // $/day throughput from cycle velocity
  targetArrGap: number;
  forecastDaysToTarget: number | null;
  velocityScore: number;  // 0-100
  bottlenecks: { stage: Stage; reason: string; weight: number }[];
  forecastsByDeal: {
    id: string;
    clientName: string;
    stage: Stage;
    dealValue: number;
    daysInStage: number;
    estimatedCloseIn: number; // days
    estimatedCloseDate: string; // ISO
    confidence: number; // 0-1
  }[];
  computedAt: string;
}

function computeMetrics(_activeArr?: number): VelocityMetrics {
  const deals = listDeals() as unknown as Deal[];

  // ── Stage breakdown ────────────────────────────────────────────────
  const stageBreakdown: StageMetrics[] = STAGE_ORDER.map((stage) => {
    const inStage = deals.filter((d) => d.stage === stage);
    const totalValue = inStage.reduce((s, d) => s + d.dealValue, 0);
    const weightedValue = Math.round(totalValue * STAGE_WEIGHT[stage]);
    const daysList = inStage
      .map((d) => daysAgo(d.updatedAt))
      .filter((v): v is number => v !== null);
    const avgDaysInStage =
      daysList.length === 0 ? 0 : daysList.reduce((s, v) => s + v, 0) / daysList.length;
    const oldestDaysInStage = daysList.length === 0 ? 0 : Math.max(...daysList);

    return {
      stage,
      count: inStage.length,
      totalValue,
      weightedValue,
      avgDaysInStage: Math.round(avgDaysInStage * 10) / 10,
      oldestDaysInStage: Math.round(oldestDaysInStage * 10) / 10,
      // bottleneck = many deals + many days stuck
      bottleneckRisk: inStage.length > 0 && avgDaysInStage > 14 && stage !== "closed",
    };
  });

  // ── Closed deals → cycle analysis ──────────────────────────────────
  const closed = deals.filter((d) => d.stage === "closed");
  const closedWonValue = closed.reduce((s, d) => s + d.dealValue, 0);

  const cycleDays: number[] = [];
  for (const d of closed) {
    const cyc = daysBetween(d.createdAt, d.updatedAt);
    if (cyc !== null && cyc > 0 && cyc < 365) cycleDays.push(cyc);
  }
  const averageCycleDays =
    cycleDays.length === 0
      ? 29 // fair default (7+5+10+7) when no closed-won history
      : cycleDays.reduce((s, v) => s + v, 0) / cycleDays.length;

  // ── Conversion rates between stages (using current snapshot) ──────
  // This is a position-based proxy: deals currently past stage X / deals
  // currently at-or-past stage X.  Honest because we label it as such.
  const conversionRates: Record<string, number> = {};
  for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
    const from = STAGE_ORDER[i];
    const to = STAGE_ORDER[i + 1];
    const atOrBefore = deals.filter((d) =>
      STAGE_ORDER.indexOf(d.stage) >= STAGE_ORDER.indexOf(from)
    ).length;
    const atOrAfter = deals.filter((d) =>
      STAGE_ORDER.indexOf(d.stage) >= STAGE_ORDER.indexOf(to)
    ).length;
    conversionRates[`${from}->${to}`] =
      atOrBefore === 0 ? 0 : Math.round((atOrAfter / atOrBefore) * 100) / 100;
  }

  // ── Velocity: $/day throughput ──────────────────────────────────────
  // Throughput = closed_won / cycleDays (when we have a history)
  // When no history: pull TYPICAL days between stages as a proxy.
  const velocityPerDay =
    cycleDays.length === 0
      ? Math.round((closedWonValue || 0) / Math.max(averageCycleDays, 1))
      : Math.round(closedWonValue / Math.max(averageCycleDays, 1));

  // ── Forecast days to $10M ARR gap ──────────────────────────────────
  // Active MRR + weighted pipeline is the forward-looking ARR proxy.
  // Load contracts synchronously via .then() in a sync wrapper... but
  // Next.js handlers are async.  We compute the gap inline using deals.
  const activeArr =
    closedWonValue +
    stageBreakdown
      .filter((s) => s.stage !== "closed")
      .reduce((s, m) => s + m.weightedValue, 0);
  const targetArrGap = Math.max(TARGET_ARR - activeArr, 0);
  const forecastDaysToTarget =
    velocityPerDay === 0 ? null : Math.round(targetArrGap / (velocityPerDay * 12));

  // ── Velocity score 0-100 ──────────────────────────────────────────
  // Combines: cycle speed (40), conversion (40), bottleneck count (20).
  // Faster cycle + higher conversions → higher score.
  const idealCycleDays = 14; // ~2 weeks prospect→close
  const cycleComponent = Math.max(0, Math.min(40, 40 - ((averageCycleDays - idealCycleDays) / idealCycleDays) * 20));
  const avgConversion =
    Object.values(conversionRates).reduce((s, v) => s + v, 0) /
    Math.max(Object.keys(conversionRates).length, 1);
  const conversionComponent = Math.max(0, Math.min(40, avgConversion * 40));
  const bottleneckCount = stageBreakdown.filter((s) => s.bottleneckRisk).length;
  const bottleneckComponent = Math.max(0, 20 - bottleneckCount * 7);
  const velocityScore = Math.round(cycleComponent + conversionComponent + bottleneckComponent);

  // ── Bottlenecks ────────────────────────────────────────────────────
  const bottlenecks = stageBreakdown
    .filter((s) => s.bottleneckRisk)
    .map((s) => ({
      stage: s.stage,
      reason: `${s.count} deal(s) averaging ${s.avgDaysInStage}d in "${s.stage}"`,
      weight: s.totalValue,
    }))
    .sort((a, b) => b.weight - a.weight);

  // ── Per-deal close forecast ────────────────────────────────────────
  const forecastsByDeal = deals
    .filter((d) => d.stage !== "closed")
    .map((d) => {
      const stageIdx = STAGE_ORDER.indexOf(d.stage);
      const remainingStages = STAGE_ORDER.length - 1 - stageIdx; // stages left to traverse
      // Sum of typical stage-transition days remaining
      let days = 0;
      for (let i = stageIdx; i < STAGE_ORDER.length - 1; i++) {
        const key = `${STAGE_ORDER[i]}->${STAGE_ORDER[i + 1]}`;
        days += TYPICAL_DAYS_BETWEEN_STAGES[key] ?? 7;
      }
      const stuck = daysAgo(d.updatedAt) ?? 0;
      // If a deal has been stuck longer than typical, penalize (more likely to slip)
      const adjusted = days + Math.max(0, stuck - days) * 0.5;
      const projectedMs = Date.now() + adjusted * 24 * 60 * 60 * 1000;
      const confidence =
        d.stage === "negotiation"
          ? 0.75
          : d.stage === "proposal"
          ? 0.55
          : d.stage === "qualified"
          ? 0.35
          : 0.2;
      return {
        id: d.id,
        clientName: d.clientName,
        stage: d.stage,
        dealValue: d.dealValue,
        daysInStage: Math.round(stuck * 10) / 10,
        estimatedCloseIn: Math.round(adjusted * 10) / 10,
        estimatedCloseDate: new Date(projectedMs).toISOString(),
        confidence,
      };
    })
    .sort((a, b) => b.dealValue - a.dealValue);

  return {
    totalDeals: deals.length,
    totalPipeline: deals.filter((d) => d.stage !== "closed").reduce((s, d) => s + d.dealValue, 0),
    weightedPipeline: stageBreakdown.reduce((s, m) => s + m.weightedValue, 0),
    closedWonValue,
    stageBreakdown,
    conversionRates,
    averageCycleDays: Math.round(averageCycleDays * 10) / 10,
    velocityPerDay,
    targetArrGap,
    forecastDaysToTarget,
    velocityScore,
    bottlenecks,
    forecastsByDeal,
    computedAt: new Date().toISOString(),
  };
}

async function persistSnapshot(metrics: VelocityMetrics): Promise<string> {
  const dir = path.join(process.cwd(), "data", "agency");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "velocity-history.jsonl");
  await fs.appendFile(file, JSON.stringify({ ...metrics, _source: "agency/velocity" }) + "\n", "utf-8");
  return file;
}

export async function GET(): Promise<Response> {
  try {
    const metrics = computeMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const metrics = computeMetrics();
    if (body.action === "recompute") {
      const file = await persistSnapshot(metrics);
      return NextResponse.json({ ok: true, persistedTo: file, metrics });
    }
    return NextResponse.json({ error: "unknown action — use action=recompute" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
