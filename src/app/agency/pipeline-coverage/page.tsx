"use client";

// ── RIG OS Agency — Pipeline Coverage Command ───────────────────────
//
// Surface for campaign turn 12 (Jobs/applied tracker integrated with
// proposal pipeline). Shows honest coverage ratios between:
//   • Weighted pipeline (real deals × stage probability)
//   • Active job applications (real JobApplication[])
//   • Active proposals (real Proposal[])
//   • $10M ARR target
//
// Midnight Aubergine design system. 60s auto-refresh.

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Target, Briefcase, FileText, Users,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  RefreshCw, DollarSign, Activity, Zap, Clock, ArrowUp,
  ChevronRight, Flame, Sparkles, X,
} from "lucide-react";

interface PipelineCoverage {
  _real: boolean;
  _source: string;
  timestamp: string;
  target: { arr: number; label: string };
  pipeline: {
    dealCount: number;
    totalValue: number;
    closedValue: number;
    weightedValue: number;
    avgDealSize: number;
    staleCount: number;
    staleDeals: Array<{
      id: string;
      client: string;
      value: number;
      stage: string;
      daysSinceUpdate: number;
    }>;
    coverageRatio: number;
  };
  jobs: {
    total: number;
    active: number;
    offersInHand: number;
    finalRounds: number;
    interviews: number;
    weightedSalary: number;
    totalSalaryMidpoint: number;
    staleCount: number;
    staleJobs: Array<{
      id: string;
      company: string;
      role: string;
      status: string;
      daysSinceUpdate: number;
    }>;
  };
  proposals: {
    total: number;
    active: number;
    accepted: number;
    valueSent: number;
    valueAccepted: number;
  };
  clients: { total: number; active: number };
  gtmActivity: {
    realProspects: number;
    realEmailsSent: number;
    replyRate: number;
  };
  coverage: {
    totalShotsOnGoal: number;
    pipelineCoverageRatio: number;
    combinedCoverageRatio: number;
    gap: number;
    rating: "critical" | "thin" | "healthy" | "strong";
    ratingThreshold: number;
  };
  forecast: {
    next30d: number;
    next60d: number;
    next90d: number;
    method: string;
  };
  verticalBreakdown: Array<{
    vertical: string;
    count: number;
    totalValue: number;
    weightedValue: number;
  }>;
  alerts: {
    staleDeals: number;
    staleJobs: number;
    noOffers: boolean;
    pipelineConcentration: number;
  };
  summary: {
    headline: string;
    verdict: string;
    nextActions: string[];
  };
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};

function fmt(n: number, prefix = "$"): string {
  if (!Number.isFinite(n)) return `${prefix}0`;
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
  return `${prefix}${n.toFixed(0)}`;
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "0%";
  return `${(n * 100).toFixed(1)}%`;
}

const RATING_META: Record<
  PipelineCoverage["coverage"]["rating"],
  { color: string; bg: string; label: string; icon: typeof CheckCircle2 }
> = {
  strong: { color: "var(--emerald)", bg: "rgba(90,184,150,0.12)", label: "Strong (3x+)", icon: ShieldCheck },
  healthy: { color: "var(--emerald)", bg: "rgba(90,184,150,0.12)", label: "Healthy (2-3x)", icon: CheckCircle2 },
  thin: { color: "var(--gold)", bg: "rgba(212,165,116,0.12)", label: "Thin (1-2x)", icon: Clock },
  critical: { color: "var(--plum)", bg: "rgba(196,96,126,0.12)", label: "Critical (<1x)", icon: AlertTriangle },
};

const C = {
  bg: "var(--bg-deep)",
  card: "var(--bg-card)",
  mid: "var(--bg-mid)",
  text: "var(--cream)",
  text2: "var(--cream-dim)",
  text3: "var(--cream-mute)",
  border: "var(--line-soft)",
  gold: "var(--gold)",
  emerald: "var(--emerald)",
  plum: "var(--plum)",
  red: "#ef4444",
  blue: "#60a5fa",
};

export default function PipelineCoveragePage() {
  const [data, setData] = useState<PipelineCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"coverage" | "pipeline" | "jobs" | "forecast" | "alerts">("coverage");
  const [showTruth, setShowTruth] = useState(false);

  const load = async () => {
    try {
      const r = await fetch("/api/agency/pipeline-coverage", { cache: "no-store" });
      const j = await r.json();
      setData(j);
      setLastFetch(new Date());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, []);

  const ratio = data?.coverage.combinedCoverageRatio ?? 0;
  const rating = data?.coverage.rating ?? "critical";
  const ratingMeta = RATING_META[rating];
  const RatingIcon = ratingMeta.icon;

  // Pipeline coverage ring math
  const ringRadius = 56;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringPct = Math.min(1, ratio / 3); // 3x = full ring
  const ringOffset = ringCircumference * (1 - ringPct);

  if (loading || !data) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: C.bg }}>
        <div className="flex items-center gap-3" style={{ color: C.text2 }}>
          <RefreshCw className="animate-spin" size={18} />
          <span className="text-[14px]">Loading pipeline coverage…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: C.bg }}>
      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={20} style={{ color: ratingMeta.color }} />
              <span className="text-[11px] uppercase font-semibold tracking-wider" style={{ color: C.text3 }}>
                Pipeline Coverage Command
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-semibold"
                style={{ background: ratingMeta.bg, color: ratingMeta.color }}
              >
                {ratingMeta.label}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: C.text }}>
              {data.summary.headline}
            </h1>
            <p className="text-[14px] max-w-2xl" style={{ color: C.text2 }}>
              {data.summary.verdict}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTruth(true)}
              className="text-[11px] px-3 py-1.5 rounded-md border"
              style={{ borderColor: C.border, color: C.text2 }}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} /> Truth Layer
              </span>
            </button>
            <div className="text-[10px]" style={{ color: C.text3 }}>
              {lastFetch ? `Updated ${lastFetch.toLocaleTimeString("en-GB", { hour12: false })}` : "—"}
            </div>
          </div>
        </motion.div>

        {/* ── KPI Strip (5 tiles) ────────────────────────────────── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPITile
            label="Pipeline Coverage"
            value={fmtPct(data.pipeline.coverageRatio)}
            sub={`${fmt(data.pipeline.weightedValue)} weighted`}
            icon={Target}
            color={ratingMeta.color}
            big
          />
          <KPITile
            label="Active Jobs"
            value={String(data.jobs.active)}
            sub={`${data.jobs.total} total`}
            icon={Briefcase}
            color={C.gold}
          />
          <KPITile
            label="Offers in Hand"
            value={String(data.jobs.offersInHand)}
            sub={`${data.jobs.finalRounds} final rounds`}
            icon={CheckCircle2}
            color={C.emerald}
          />
          <KPITile
            label="Stale Deals"
            value={String(data.alerts.staleDeals)}
            sub={data.alerts.staleDeals > 0 ? ">21d idle" : "All fresh"}
            icon={Clock}
            color={data.alerts.staleDeals > 0 ? C.plum : C.emerald}
          />
          <KPITile
            label="Gap to $10M"
            value={fmt(data.coverage.gap)}
            sub={`${fmtPct(ratio)} of target`}
            icon={DollarSign}
            color={C.plum}
          />
        </motion.div>

        {/* ── Coverage Ring + Vertical Breakdown ────────────────── */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ring */}
          <div
            className="rounded-lg p-6 border flex flex-col items-center justify-center"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="text-[10px] uppercase font-semibold tracking-wider mb-1" style={{ color: C.text3 }}>
              Coverage Ratio vs $10M ARR
            </div>
            <svg width="180" height="180" viewBox="0 0 180 180" className="my-2">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={ratingMeta.color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={ratingMeta.color} stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <circle
                cx="90"
                cy="90"
                r={ringRadius}
                stroke="var(--line-soft)"
                strokeWidth="14"
                fill="none"
              />
              <motion.circle
                cx="90"
                cy="90"
                r={ringRadius}
                stroke="url(#ringGrad)"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ transform: "rotate(-90deg)", transformOrigin: "90px 90px" }}
              />
              <text
                x="90"
                y="86"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fill: C.text, fontSize: 30, fontWeight: 700 }}
              >
                {fmtPct(ratio)}
              </text>
              <text
                x="90"
                y="108"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fill: C.text3, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}
              >
                of $10M
              </text>
            </svg>
            <div className="text-[11px] text-center" style={{ color: C.text2 }}>
              {data.coverage.totalShotsOnGoal > 0
                ? `${fmt(data.coverage.totalShotsOnGoal)} total shots on goal`
                : "No shots on goal yet"}
            </div>
            <div
              className="mt-3 text-[10px] px-2 py-1 rounded"
              style={{ background: ratingMeta.bg, color: ratingMeta.color }}
            >
              <span className="flex items-center gap-1">
                <RatingIcon size={10} /> 3x+ threshold = {fmt(data.target.arr * 3)}
              </span>
            </div>
          </div>

          {/* Vertical Breakdown */}
          <div
            className="rounded-lg p-5 border md:col-span-2"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider mb-1" style={{ color: C.text3 }}>
                  Weighted Pipeline by Vertical
                </div>
                <div className="text-[14px] font-semibold" style={{ color: C.text }}>
                  {data.verticalBreakdown.length} verticals active
                </div>
              </div>
              <div
                className="text-[10px] px-2 py-1 rounded"
                style={{ background: "var(--line-soft)", color: C.text2 }}
              >
                Top concentration: {fmtPct(data.alerts.pipelineConcentration)}
              </div>
            </div>
            {data.verticalBreakdown.length === 0 ? (
              <div className="text-center py-8" style={{ color: C.text3 }}>
                <Target size={32} className="mx-auto mb-2 opacity-50" />
                <div className="text-[12px]">No pipeline data yet</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {data.verticalBreakdown.slice(0, 8).map((v, i) => {
                  const maxWeighted = Math.max(...data.verticalBreakdown.map((x) => x.weightedValue));
                  const pct = maxWeighted > 0 ? (v.weightedValue / maxWeighted) * 100 : 0;
                  return (
                    <div key={v.vertical} className="flex items-center gap-3">
                      <div className="text-[11px] w-24 truncate font-mono" style={{ color: C.text2 }}>
                        {v.vertical}
                      </div>
                      <div className="flex-1 h-5 rounded relative overflow-hidden" style={{ background: "var(--line-soft)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className="h-full rounded"
                          style={{
                            background: `linear-gradient(90deg, ${ratingMeta.color}cc 0%, ${ratingMeta.color}66 100%)`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono" style={{ color: C.text }}>
                          {v.count} deals · {fmt(v.weightedValue)} weighted
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Tab Bar ───────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="flex items-center gap-1 border-b" style={{ borderColor: C.border }}>
          {([
            ["coverage", "Coverage", ShieldCheck],
            ["pipeline", "Pipeline", Target],
            ["jobs", "Jobs", Briefcase],
            ["forecast", "Forecast", TrendingUp],
            ["alerts", "Alerts", AlertTriangle],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="px-4 py-2 text-[12px] font-medium flex items-center gap-1.5 border-b-2 transition"
              style={{
                color: activeTab === id ? C.gold : C.text2,
                borderColor: activeTab === id ? C.gold : "transparent",
              }}
            >
              <Icon size={13} /> {label}
              {id === "alerts" && (data.alerts.staleDeals + data.alerts.staleJobs) > 0 && (
                <span
                  className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: C.plum, color: "white" }}
                >
                  {data.alerts.staleDeals + data.alerts.staleJobs}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Tab Content ───────────────────────────────────────── */}
        {activeTab === "coverage" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="text-[10px] uppercase font-semibold tracking-wider mb-3" style={{ color: C.text3 }}>
                Shots on Goal Breakdown
              </div>
              <div className="space-y-3">
                <BreakdownRow
                  label="Weighted Pipeline"
                  value={fmt(data.pipeline.weightedValue)}
                  pct={data.coverage.totalShotsOnGoal > 0 ? data.pipeline.weightedValue / data.coverage.totalShotsOnGoal : 0}
                  color={C.gold}
                />
                <BreakdownRow
                  label="Sent Proposals (50%)"
                  value={fmt(data.proposals.valueSent * 0.5)}
                  pct={data.coverage.totalShotsOnGoal > 0 ? (data.proposals.valueSent * 0.5) / data.coverage.totalShotsOnGoal : 0}
                  color={C.blue}
                />
                <BreakdownRow
                  label="Accepted Proposals"
                  value={fmt(data.proposals.valueAccepted)}
                  pct={data.coverage.totalShotsOnGoal > 0 ? data.proposals.valueAccepted / data.coverage.totalShotsOnGoal : 0}
                  color={C.emerald}
                />
                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: C.border }}>
                  <div className="text-[12px] font-semibold" style={{ color: C.text }}>Total Shots on Goal</div>
                  <div className="text-[16px] font-bold" style={{ color: ratingMeta.color }}>
                    {fmt(data.coverage.totalShotsOnGoal)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="text-[10px] uppercase font-semibold tracking-wider mb-3" style={{ color: C.text3 }}>
                Next Actions (Doctrine-Generated)
              </div>
              <div className="space-y-2">
                {data.summary.nextActions.map((action, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-2 p-2.5 rounded"
                    style={{ background: "var(--line-soft)" }}
                  >
                    <ChevronRight size={14} style={{ color: C.gold }} className="mt-0.5 shrink-0" />
                    <div className="text-[12px] leading-relaxed" style={{ color: C.text }}>{action}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "pipeline" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[14px] font-semibold" style={{ color: C.text }}>
                Pipeline Detail
              </div>
              <div className="text-[11px]" style={{ color: C.text3 }}>
                {data.pipeline.dealCount} deals · {fmt(data.pipeline.totalValue)} total
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <DetailStat label="Deal Count" value={String(data.pipeline.dealCount)} color={C.gold} />
              <DetailStat label="Total Value" value={fmt(data.pipeline.totalValue)} color={C.emerald} />
              <DetailStat label="Closed Value" value={fmt(data.pipeline.closedValue)} color={C.emerald} />
              <DetailStat label="Avg Deal" value={fmt(data.pipeline.avgDealSize)} color={C.blue} />
            </div>
            {data.pipeline.staleDeals.length > 0 && (
              <div>
                <div className="text-[11px] uppercase font-semibold mb-2 flex items-center gap-1" style={{ color: C.plum }}>
                  <AlertTriangle size={12} /> Stale Deals ({data.pipeline.staleDeals.length})
                </div>
                <div className="space-y-1.5">
                  {data.pipeline.staleDeals.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-2.5 rounded border-l-2"
                      style={{ background: "var(--line-soft)", borderColor: C.plum }}
                    >
                      <div>
                        <div className="text-[12px] font-semibold" style={{ color: C.text }}>{d.client}</div>
                        <div className="text-[10px]" style={{ color: C.text3 }}>
                          {d.stage} · {d.daysSinceUpdate}d idle
                        </div>
                      </div>
                      <div className="text-[12px] font-mono" style={{ color: C.gold }}>{fmt(d.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "jobs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[14px] font-semibold" style={{ color: C.text }}>Jobs Tracker</div>
              <div className="text-[11px]" style={{ color: C.text3 }}>{data.jobs.active} active · {data.jobs.total} total</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <DetailStat label="Active" value={String(data.jobs.active)} color={C.gold} />
              <DetailStat label="Interviews" value={String(data.jobs.interviews)} color={C.blue} />
              <DetailStat label="Final Rounds" value={String(data.jobs.finalRounds)} color={C.plum} />
              <DetailStat label="Offers" value={String(data.jobs.offersInHand)} color={C.emerald} />
              <DetailStat label="Weighted Salary" value={fmt(data.jobs.weightedSalary)} color={C.gold} />
            </div>
            {data.jobs.staleJobs.length > 0 && (
              <div>
                <div className="text-[11px] uppercase font-semibold mb-2 flex items-center gap-1" style={{ color: C.plum }}>
                  <AlertTriangle size={12} /> Stale Job Applications ({data.jobs.staleJobs.length})
                </div>
                <div className="space-y-1.5">
                  {data.jobs.staleJobs.map((j) => (
                    <div
                      key={j.id}
                      className="flex items-center justify-between p-2.5 rounded border-l-2"
                      style={{ background: "var(--line-soft)", borderColor: C.plum }}
                    >
                      <div>
                        <div className="text-[12px] font-semibold" style={{ color: C.text }}>{j.role}</div>
                        <div className="text-[10px]" style={{ color: C.text3 }}>
                          {j.company} · {j.status} · {j.daysSinceUpdate}d idle
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.jobs.offersInHand > 0 && (
              <div className="mt-4 p-3 rounded flex items-center gap-2" style={{ background: "rgba(90,184,150,0.12)", border: "1px solid var(--emerald)" }}>
                <CheckCircle2 size={16} style={{ color: C.emerald }} />
                <div className="text-[12px]" style={{ color: C.emerald }}>
                  {data.jobs.offersInHand} job offer{data.jobs.offersInHand > 1 ? "s" : ""} in hand — capitalize.
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "forecast" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="text-[10px] uppercase font-semibold tracking-wider mb-3" style={{ color: C.text3 }}>
                Revenue Forecast (naive stage-weighted)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ForecastCard label="Next 30d" value={data.forecast.next30d} max={data.forecast.next90d} color={C.gold} />
                <ForecastCard label="Next 60d" value={data.forecast.next60d} max={data.forecast.next90d} color={C.blue} />
                <ForecastCard label="Next 90d" value={data.forecast.next90d} max={data.forecast.next90d} color={C.emerald} />
              </div>
              <div className="mt-4 text-[10px]" style={{ color: C.text3 }}>
                {data.forecast.method}
              </div>
            </div>

            <div className="rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="text-[10px] uppercase font-semibold tracking-wider mb-3" style={{ color: C.text3 }}>
                GTM Activity (Real)
              </div>
              <div className="grid grid-cols-3 gap-3">
                <DetailStat label="Real Prospects" value={String(data.gtmActivity.realProspects)} color={C.gold} />
                <DetailStat label="Emails Sent" value={String(data.gtmActivity.realEmailsSent)} color={C.blue} />
                <DetailStat label="Clients (active)" value={`${data.clients.active}/${data.clients.total}`} color={C.emerald} />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "alerts" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {data.alerts.staleDeals === 0 && data.alerts.staleJobs === 0 && !data.alerts.noOffers && (
              <div className="rounded-lg p-6 border text-center" style={{ background: C.card, borderColor: C.border }}>
                <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: C.emerald }} />
                <div className="text-[14px] font-semibold mb-1" style={{ color: C.emerald }}>All Clear</div>
                <div className="text-[11px]" style={{ color: C.text2 }}>No stale deals, no stale jobs, offers in hand.</div>
              </div>
            )}

            {data.alerts.staleJobs > 0 && (
              <AlertCard
                title="Stale Job Applications"
                count={data.alerts.staleJobs}
                description="Job applications with no update in 14+ days. Risk: missed offer windows."
                items={data.jobs.staleJobs.map((j) => `${j.role} @ ${j.company} (${j.status}, ${j.daysSinceUpdate}d)`)}
                severity="warn"
              />
            )}

            {data.alerts.staleDeals > 0 && (
              <AlertCard
                title="Stale Pipeline Deals"
                count={data.alerts.staleDeals}
                description="Deals with no update in 21+ days. Risk: cold prospects churn."
                items={data.pipeline.staleDeals.map((d) => `${d.client} (${d.stage}, ${d.daysSinceUpdate}d, ${fmt(d.value)})`)}
                severity="critical"
              />
            )}

            {data.alerts.noOffers && (
              <AlertCard
                title="No Job Offers Yet"
                count={0}
                description="No job offers in the pipeline. Push more interview → final round conversions."
                items={[]}
                severity="warn"
              />
            )}

            {data.alerts.pipelineConcentration > 0.6 && (
              <AlertCard
                title="Pipeline Concentration Risk"
                count={0}
                description={`${fmtPct(data.alerts.pipelineConcentration)} of weighted pipeline is in a single vertical. Diversify.`}
                items={[]}
                severity="warn"
              />
            )}
          </motion.div>
        )}

        {/* ── Doctrine Footer ────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="text-[10px] text-center pt-4 pb-2"
          style={{ color: C.text3 }}
        >
          Pipeline Coverage Command · Midnight Aubergine · Source: {data._source}
        </motion.div>
      </motion.div>

      {/* ── Truth Layer Modal ──────────────────────────────────── */}
      {showTruth && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowTruth(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-lg p-6 max-w-lg w-full border"
            style={{ background: C.card, borderColor: C.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-[14px] font-semibold flex items-center gap-2" style={{ color: C.gold }}>
                <Sparkles size={16} /> Truth Layer
              </div>
              <button onClick={() => setShowTruth(false)}><X size={16} style={{ color: C.text3 }} /></button>
            </div>
            <div className="space-y-3 text-[12px]" style={{ color: C.text2 }}>
              <p>
                <strong style={{ color: C.text }}>What is real:</strong> Pipeline, jobs, proposals, clients pulled from <code>/data/agency/*.json</code> via the persistent JSON store. GTM activity counts (prospects, emails sent) are real from <code>~/Developer/rig-gtm-studio-v2/</code>.
              </p>
              <p>
                <strong style={{ color: C.text }}>What is computed:</strong> Stage-weighted pipeline value uses these probabilities — discovery 10%, qualified 25%, proposal 50%, negotiation 75%, closed 100%. Job status weights — saved 5%, applied 10%, phone screen 25%, interview 45%, final round 70%, offer 90%, accepted 100%.
              </p>
              <p>
                <strong style={{ color: C.text }}>What is naive:</strong> 30/60/90-day forecast uses simple linear assumptions (40/70/85% of weighted pipeline) plus 20/50/70% of sent proposal value. Not statistical.
              </p>
              <p>
                <strong style={{ color: C.text }}>Industry benchmark:</strong> 3x pipeline coverage of quota target = healthy. Below 1x = critical. We're at <strong style={{ color: ratingMeta.color }}>{fmtPct(ratio)}</strong> — {ratingMeta.label.toLowerCase()}.
              </p>
              <p className="pt-2 border-t text-[10px]" style={{ borderColor: C.border, color: C.text3 }}>
                Generated {new Date(data.timestamp).toISOString()} · Auto-refresh: 60s
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────
function KPITile({
  label,
  value,
  sub,
  icon: Icon,
  color,
  big,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Target;
  color: string;
  big?: boolean;
}) {
  return (
    <div
      className="rounded-lg p-4 border relative overflow-hidden"
      style={{ background: C.card, borderColor: C.border }}
    >
      <div
        className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-10"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: C.text3 }}>
          {label}
        </div>
        <Icon size={14} style={{ color }} />
      </div>
      <div
        className={`font-bold ${big ? "text-[28px]" : "text-[22px]"}`}
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[10px] mt-1" style={{ color: C.text3 }}>{sub}</div>
    </div>
  );
}

function BreakdownRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[12px]" style={{ color: C.text2 }}>{label}</div>
        <div className="text-[12px] font-mono font-semibold" style={{ color }}>{value}</div>
      </div>
      <div className="h-2 rounded overflow-hidden" style={{ background: "var(--line-soft)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct * 100)}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function DetailStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded p-3 border" style={{ background: "var(--line-soft)", borderColor: C.border }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.text3 }}>{label}</div>
      <div className="text-[18px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function ForecastCard({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="rounded p-4 border" style={{ background: "var(--line-soft)", borderColor: C.border }}>
      <div className="text-[10px] uppercase font-semibold tracking-wider mb-2" style={{ color: C.text3 }}>{label}</div>
      <div className="text-[22px] font-bold mb-2" style={{ color }}>{fmt(value)}</div>
      <div className="h-1.5 rounded overflow-hidden" style={{ background: "var(--line)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
          className="h-full rounded"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function AlertCard({
  title,
  count,
  description,
  items,
  severity,
}: {
  title: string;
  count: number;
  description: string;
  items: string[];
  severity: "warn" | "critical";
}) {
  const color = severity === "critical" ? C.plum : C.gold;
  return (
    <div
      className="rounded-lg p-4 border-l-4"
      style={{ background: C.card, borderColor: C.border, borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] font-semibold flex items-center gap-2" style={{ color }}>
          <AlertTriangle size={14} /> {title}
        </div>
        {count > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: color, color: "white" }}>
            {count}
          </span>
        )}
      </div>
      <div className="text-[12px] mb-2" style={{ color: C.text2 }}>{description}</div>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: C.text }}>
              <ChevronRight size={12} style={{ color: C.text3 }} className="mt-0.5 shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
