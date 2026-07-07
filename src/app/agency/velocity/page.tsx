// src/app/agency/velocity/page.tsx
// Pipeline Velocity & Throughput dashboard — surfaces /api/agency/velocity.
// $10M ARR critical view: stage conversion rates, days-in-stage, $/day
// throughput, per-deal close forecasts, bottleneck detection, and a
// 0-100 velocity score.
//
// Midnight Aubergine design. No fabricated numbers.

"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge, TrendingUp, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Activity, Zap, Target, ArrowRight, Calendar, ChevronDown, ChevronRight,
  Timer, AlertOctagon, BarChart3,
} from "lucide-react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader, StatCard } from "@/components/DepartmentUI";

const C = {
  bg: "var(--bg-deep)", bgMid: "var(--bg-mid)", card: "var(--bg-card)",
  text: "var(--cream)", text2: "var(--cream-soft)", text3: "var(--cream-dim)",
  border: "var(--line-soft)", borderHot: "var(--line)",
  gold: "var(--gold)", emerald: "var(--emerald)", red: "var(--rust)",
  plum: "var(--plum)", blue: "#60a5fa",
};

interface StageMetrics {
  stage: string;
  count: number;
  totalValue: number;
  weightedValue: number;
  avgDaysInStage: number;
  oldestDaysInStage: number;
  bottleneckRisk: boolean;
}

interface DealForecast {
  id: string;
  clientName: string;
  stage: string;
  dealValue: number;
  daysInStage: number;
  estimatedCloseIn: number;
  estimatedCloseDate: string;
  confidence: number;
}

interface VelocityData {
  totalDeals: number;
  totalPipeline: number;
  weightedPipeline: number;
  closedWonValue: number;
  stageBreakdown: StageMetrics[];
  conversionRates: Record<string, number>;
  averageCycleDays: number;
  velocityPerDay: number;
  targetArrGap: number;
  forecastDaysToTarget: number | null;
  velocityScore: number;
  bottlenecks: { stage: string; reason: string; weight: number }[];
  forecastsByDeal: DealForecast[];
  computedAt: string;
}

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function scoreColor(score: number): string {
  if (score >= 80) return C.emerald;
  if (score >= 60) return C.gold;
  if (score >= 40) return C.plum;
  return C.red;
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Elite Velocity";
  if (score >= 70) return "Strong Velocity";
  if (score >= 55) return "Steady";
  if (score >= 40) return "Slowing";
  return "Stalled";
}

function daysLabel(n: number): string {
  if (n < 1) return "<1d";
  if (n < 30) return `${Math.round(n)}d`;
  const months = Math.round(n / 30);
  if (months < 12) return `${months}mo`;
  return `${(n / 365).toFixed(1)}y`;
}

const STAGE_LABEL: Record<string, string> = {
  discovery: "Discovery",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed: "Closed Won",
};

const STAGE_ACCENT: Record<string, string> = {
  discovery: "#8b9dc3",
  qualified: "#60a5fa",
  proposal: C.gold,
  negotiation: C.plum,
  closed: C.emerald,
};

export default function VelocityPage() {
  const [data, setData] = useState<VelocityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForecasts, setShowForecasts] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch("/api/agency/velocity", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: VelocityData = await res.json();
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRecompute = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/velocity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recompute" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.metrics);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "recompute failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        backgroundImage:
          "radial-gradient(ellipse at top, rgba(196, 96, 126, 0.05), transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(212, 165, 116, 0.06), transparent 50%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <PageBreadcrumbs
          items={[
            { label: "Agency", href: "/agency" },
            { label: "Velocity", href: "/agency/velocity" },
          ]}
        />

        <PageHeader
          icon={<Gauge className="h-6 w-6" />}
          title="Pipeline Velocity & Throughput"
          subtitle="How fast pipeline moves — and what it would take to hit $10M ARR at today's pace."
          right={
            <div className="flex items-center gap-3">
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition disabled:opacity-50"
                style={{ borderColor: C.border, color: C.text2, background: C.card }}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={handleRecompute}
                disabled={loading}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition disabled:opacity-50"
                style={{ background: C.gold, color: "#15101a" }}
              >
                <Zap className="h-3 w-3" />
                Recompute & Persist
              </button>
            </div>
          }
        />

        {err && (
          <div
            className="mb-6 flex items-center gap-2 rounded-md border p-3 text-sm"
            style={{ borderColor: C.red, color: C.red, background: "rgba(201,124,94,0.08)" }}
          >
            <AlertTriangle className="h-4 w-4" />
            {err}
          </div>
        )}

        {!data && loading && (
          <div className="grid grid-cols-4 gap-4">
            {[0,1,2,3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg"
                style={{ background: C.bgMid }}
              />
            ))}
          </div>
        )}

        {data && (
          <>
            {/* KPI ROW */}
            <div className="mb-8 grid grid-cols-4 gap-4">
              <StatCard
                icon={<Gauge className="h-5 w-5" />}
                label="Velocity Score"
                value={`${data.velocityScore}/100`}
                accent={scoreColor(data.velocityScore)}
                sub={scoreLabel(data.velocityScore)}
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Throughput"
                value={`${fmt$(data.velocityPerDay)}/day`}
                accent={C.gold}
                sub={`${data.weightedPipeline > 0 ? Math.round((data.velocityPerDay * 30 / data.weightedPipeline) * 100) : 0}% weighted/30d`}
              />
              <StatCard
                icon={<Clock className="h-5 w-5" />}
                label="Avg Cycle"
                value={`${data.averageCycleDays.toFixed(1)}d`}
                accent={C.blue}
                sub="Discovery → Closed Won"
              />
              <StatCard
                icon={<Target className="h-5 w-5" />}
                label="$10M ARR ETA"
                value={
                  data.forecastDaysToTarget === null
                    ? "—"
                    : daysLabel(data.forecastDaysToTarget)
                }
                accent={C.plum}
                sub={
                  data.forecastDaysToTarget === null
                    ? "Need > $0/day throughput"
                    : `at current ${fmt$(data.velocityPerDay)}/day`
                }
              />
            </div>

            {/* PIPELINE SUMMARY */}
            <div
              className="mb-6 rounded-xl border p-5"
              style={{ borderColor: C.border, background: C.card }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>
                  <BarChart3 className="h-4 w-4" /> Pipeline Snapshot
                </h3>
                <span className="text-xs" style={{ color: C.text3 }}>
                  {data.totalDeals} deal(s) · last computed {new Date(data.computedAt).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: C.text3 }}>Total pipeline</div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: C.text }}>
                    {fmt$(data.totalPipeline)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: C.text3 }}>Weighted (probability-adjusted)</div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: C.gold }}>
                    {fmt$(data.weightedPipeline)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: C.text3 }}>Closed-Won (lifetime)</div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: C.emerald }}>
                    {fmt$(data.closedWonValue)}
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE FUNNEL */}
            <div className="mb-6 grid grid-cols-2 gap-6">
              <div
                className="rounded-xl border p-5"
                style={{ borderColor: C.border, background: C.card }}
              >
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>
                  <Activity className="h-4 w-4" /> Stage Breakdown
                </h3>
                <div className="space-y-3">
                  {data.stageBreakdown.map((s, i) => {
                    const next = data.stageBreakdown[i + 1];
                    const dropPct = next
                      ? Math.max(0, Math.round((1 - data.conversionRates[`${s.stage}->${next.stage}`]) * 100))
                      : 0;
                    return (
                      <div key={s.stage}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ background: STAGE_ACCENT[s.stage] }}
                            />
                            <span style={{ color: C.text }}>{STAGE_LABEL[s.stage]}</span>
                            <span style={{ color: C.text3 }}>· {s.count} deal(s) · {fmt$(s.totalValue)}</span>
                          </span>
                          <span style={{ color: C.text3 }}>
                            avg {s.avgDaysInStage}d
                            {s.bottleneckRisk && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(201,124,94,0.15)", color: C.red }}>
                                <AlertOctagon className="h-3 w-3" /> stuck
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-elev)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (s.totalValue / Math.max(...data.stageBreakdown.map((x) => x.totalValue), 1)) * 100)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                            className="h-full rounded-full"
                            style={{ background: STAGE_ACCENT[s.stage] }}
                          />
                        </div>
                        {next && (
                          <div className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: C.text3 }}>
                            <ArrowRight className="h-3 w-3" />
                            {STAGE_LABEL[s.stage]} → {STAGE_LABEL[next.stage]}: {Math.round(data.conversionRates[`${s.stage}->${next.stage}`] * 100)}%
                            <span className="ml-auto" style={{ color: dropPct > 35 ? C.red : C.text3 }}>
                              {dropPct > 0 ? `${dropPct}% drop` : "0% drop"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTTLENECKS */}
              <div
                className="rounded-xl border p-5"
                style={{ borderColor: C.border, background: C.card }}
              >
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: C.text2 }}>
                  <AlertOctagon className="h-4 w-4" /> Bottlenecks
                </h3>
                {data.bottlenecks.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-md border p-4" style={{ borderColor: C.border, background: "rgba(90,184,150,0.05)" }}>
                    <CheckCircle2 className="h-5 w-5" style={{ color: C.emerald }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: C.text }}>No bottlenecks detected</div>
                      <div className="text-xs" style={{ color: C.text3 }}>
                        No stage has deals averaging &gt; 14 days stuck.
                      </div>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.bottlenecks.map((b) => (
                      <li key={b.stage} className="rounded-md border p-3" style={{ borderColor: "rgba(201,124,94,0.30)", background: "rgba(201,124,94,0.05)" }}>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: STAGE_ACCENT[b.stage] }} />
                          <span className="text-sm font-semibold" style={{ color: C.text }}>
                            {STAGE_LABEL[b.stage] ?? b.stage}
                          </span>
                          <span className="ml-auto text-xs" style={{ color: C.red }}>
                            {fmt$(b.weight)} at stake
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: C.text2 }}>
                          {b.reason}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5 border-t pt-4" style={{ borderColor: C.border }}>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: C.text3 }}>
                    $10M ARR ETA · Scenario
                  </h4>
                  <div className="rounded-md border p-3 text-xs leading-relaxed" style={{ borderColor: C.border, color: C.text2 }}>
                    Current velocity adds <span style={{ color: C.gold }}>{fmt$(data.velocityPerDay * 365)}</span> ARR/year.
                    Gap: <span style={{ color: C.red }}>{fmt$(data.targetArrGap)}</span>.
                    {data.forecastDaysToTarget !== null && data.forecastDaysToTarget > 365 ? (
                      <> At today's pace, $10M ARR arrives in <span style={{ color: C.red }}>{daysLabel(data.forecastDaysToTarget)}</span> — improve cycle or conversion to accelerate.</>
                    ) : data.forecastDaysToTarget !== null ? (
                      <> At today's pace, $10M ARR arrives in <span style={{ color: C.emerald }}>{daysLabel(data.forecastDaysToTarget)}</span>.</>
                    ) : (
                      <> Velocity is $0/day — closed history empty; add wins to compute.</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* FORECASTS */}
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: C.border, background: C.card }}
            >
              <button
                onClick={() => setShowForecasts((v) => !v)}
                className="mb-4 flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider"
                style={{ color: C.text2 }}
              >
                <span className="flex items-center gap-2">
                  {showForecasts ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Calendar className="h-4 w-4" /> Per-Deal Close Forecasts
                  <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: C.bgMid, color: C.text3 }}>
                    {data.forecastsByDeal.length}
                  </span>
                </span>
                <span className="text-xs" style={{ color: C.text3 }}>
                  Sorted by deal value (desc)
                </span>
              </button>

              <AnimatePresence initial={false}>
                {showForecasts && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="overflow-hidden rounded-lg border" style={{ borderColor: C.border }}>
                      <table className="w-full text-sm">
                        <thead style={{ background: C.bgMid }}>
                          <tr className="text-left text-xs uppercase tracking-wider" style={{ color: C.text3 }}>
                            <th className="px-4 py-2 font-medium">Prospect</th>
                            <th className="px-4 py-2 font-medium">Stage</th>
                            <th className="px-4 py-2 font-medium text-right">Deal</th>
                            <th className="px-4 py-2 font-medium text-right">Stuck</th>
                            <th className="px-4 py-2 font-medium text-right">Closes in</th>
                            <th className="px-4 py-2 font-medium">Projected close</th>
                            <th className="px-4 py-2 font-medium text-right">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.forecastsByDeal.map((d) => (
                            <tr key={d.id} className="border-t" style={{ borderColor: C.border }}>
                              <td className="px-4 py-2" style={{ color: C.text }}>
                                {d.clientName}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]"
                                  style={{ background: `${STAGE_ACCENT[d.stage]}22`, color: STAGE_ACCENT[d.stage] }}
                                >
                                  {STAGE_LABEL[d.stage] ?? d.stage}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right font-mono" style={{ color: C.gold }}>
                                {fmt$(d.dealValue)}
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-xs" style={{ color: d.daysInStage > 14 ? C.red : C.text2 }}>
                                {d.daysInStage.toFixed(1)}d
                              </td>
                              <td className="px-4 py-2 text-right font-mono" style={{ color: C.text2 }}>
                                {d.estimatedCloseIn.toFixed(0)}d
                              </td>
                              <td className="px-4 py-2 text-xs" style={{ color: C.text2 }}>
                                <span className="inline-flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {new Date(d.estimatedCloseDate).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <span
                                  className="inline-block h-1.5 w-16 overflow-hidden rounded-full"
                                  style={{ background: C.bgMid }}
                                >
                                  <span
                                    className="block h-full"
                                    style={{
                                      width: `${Math.round(d.confidence * 100)}%`,
                                      background:
                                        d.confidence >= 0.7
                                          ? C.emerald
                                          : d.confidence >= 0.4
                                          ? C.gold
                                          : C.plum,
                                    }}
                                  />
                                </span>
                                <span className="ml-1 text-[10px]" style={{ color: C.text3 }}>
                                  {Math.round(d.confidence * 100)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {data.forecastsByDeal.length === 0 && (
                      <div className="mt-4 rounded-md border p-3 text-sm" style={{ borderColor: C.border, color: C.text3 }}>
                        All deals are closed-won. Add new deals to forecast.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FOOTER */}
            <div className="mt-6 text-center text-xs" style={{ color: C.text3 }}>
              Sources: <code>listDeals()</code> in <code>@/lib/pipeline-deals-store</code>. No fabricated numbers.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
