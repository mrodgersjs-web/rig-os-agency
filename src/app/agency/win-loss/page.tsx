// src/app/agency/win-loss/page.tsx
// ── RIG OS Agency — Win/Loss Analytics Command ────────────────────────────
// Surfaces /api/agency/win-loss (real pipeline + proposals + clients).
// Midnight Aubergine design. Doctrine: every number audit-tagged.
//
// Sections:
//   1. Hero — KPI strip (Win Rate / Won / Lost / Open Deals / Avg Cycle)
//   2. Animated SVG win-rate ring + funnel funnel bars
//   3. Vertical Win/Loss grid (per-vertical stats)
//   4. Stage Win-Rate table
//   5. Sent Proposals (aging) + Monthly Trend
//   6. Win/Loss Reasons (when data exists, otherwise truth-flagged)
//   7. Truth Layer — provenance + doctrine footer

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Frown, Target, TrendingUp, AlertTriangle, RefreshCw,
  Activity, Sparkles, ChevronDown, ChevronRight, Clock,
  PieChart, BarChart3, Award, ArrowUpRight, ArrowDownRight,
  Zap, Layers, ShieldCheck, Sigma,
} from "lucide-react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";

const C = {
  bg: "var(--bg-deep)",
  bgMid: "var(--bg-mid)",
  card: "var(--bg-card)",
  text: "var(--cream)",
  text2: "var(--cream-soft)",
  text3: "var(--cream-dim)",
  border: "var(--line-soft)",
  borderHot: "var(--line)",
  gold: "var(--gold)",
  emerald: "var(--emerald)",
  rust: "var(--rust)",
  plum: "var(--plum)",
  cyan: "#7dd3fc",
  blue: "#60a5fa",
  violet: "#a78bfa",
};

interface Deal {
  id: string; clientName: string; vertical: string; dealSize: number;
  probability: number; nextAction: string; nextActionDate: string; stage: string;
}
interface ProposalRow {
  id: string; title: string; amount: number; sentAt?: string; ageDays: number;
}
interface FunnelStage { stage: string; n: number; }
interface TrendRow { month: string; wins: number; losses: number; revenue: number; }
interface VerticalRow {
  vertical: string; total: number; won: number; lost: number; open: number; value: number;
}
interface StageWinRate { stage: string; n: number; avgP: number; }
interface ReasonRow {
  reason: string; count: number; weighted: number; examples?: string[];
}

interface WinLossPayload {
  _real: boolean;
  _sources: string[];
  _generatedAt: string;
  _latencyMs: number;
  summary: {
    winRate: number | null;
    winRateLabel: string;
    wonCount: number;
    lostCount: number;
    openDeals: number;
    sentProposals: number;
    draftProposals: number;
    acceptedProposals: number;
    wonARR: number;
    velocity: {
      openDeals: number;
      weightedValue: number;
      closedValue: number;
      avgDealValue: number;
      avgSalesCycleDays: number;
    };
  };
  funnel: FunnelStage[];
  trend: TrendRow[];
  verticalRows: VerticalRow[];
  stageWinRate: StageWinRate[];
  lossReasons: ReasonRow[] | null;
  winReasons: ReasonRow[] | null;
  sentProposals: ProposalRow[];
  doctrine: {
    truth: string;
    next: string;
  };
}

function fmtUSD(n: number, opts?: { compact?: boolean }): string {
  if (!isFinite(n)) return "$0";
  const compact = opts?.compact ?? true;
  if (compact) {
    if (Math.abs(n) >= 10_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${Math.round(n)}`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtNum(n: number): string {
  if (n == null || !isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

function pct(n: number, denom: number): string {
  if (!denom) return "0%";
  return `${Math.min(100, Math.round((n / denom) * 100))}%`;
}

function pctRaw(p: number | null | undefined): string {
  if (p == null) return "—";
  return `${(p * 100).toFixed(1)}%`;
}

function relTime(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "—";
  const secs = Math.floor((Date.now() - t) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function WinRateRing({ rate, wonCount, lostCount }: { rate: number | null; wonCount: number; lostCount: number; }) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  // If rate is null (no closed-loss data), show a "no data" ring with won-only arc
  const hasRate = rate != null;
  const total = hasRate ? wonCount + lostCount : wonCount;
  const arcLen = hasRate
    ? circumference * Math.max(0, Math.min(1, rate))
    : circumference * Math.max(0, Math.min(1, wonCount / Math.max(wonCount + 1, 1)));

  let tier: "healthy" | "thin" | "critical" | "none" = "none";
  if (rate == null) tier = "none";
  else if (rate >= 0.6) tier = "healthy";
  else if (rate >= 0.3) tier = "thin";
  else tier = "critical";

  const tierColor =
    tier === "healthy" ? C.emerald :
    tier === "thin" ? C.gold :
    tier === "critical" ? C.rust :
    C.text3;

  return (
    <div className="relative inline-grid place-items-center">
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke={C.border} strokeWidth="12" />
        <motion.circle
          cx="100" cy="100" r={radius} fill="none"
          stroke={tierColor} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - arcLen }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>Win Rate</div>
          <div className="text-[34px] font-bold leading-none mt-1" style={{ color: tierColor }}>
            {hasRate ? pctRaw(rate) : "—"}
          </div>
          <div className="text-[10px] mt-1.5" style={{ color: C.text3 }}>
            {wonCount} won / {lostCount} lost
          </div>
          {tier === "none" && (
            <div className="text-[9px] mt-0.5" style={{ color: C.gold }}>no losses recorded</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WinLossPage() {
  const [data, setData] = useState<WinLossPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"funnel" | "trend" | "verticals" | "stages">("funnel");
  const [expandedReason, setExpandedReason] = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const r = await fetch("/api/agency/win-loss", { cache: "no-store" });
      if (!r.ok) throw new Error(`/api/agency/win-loss returned ${r.status}`);
      const j = (await r.json()) as WinLossPayload;
      setData(j);
      setUpdatedAt(new Date().toISOString());
    } catch (e: any) {
      setError(String(e?.message || e));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(() => fetchAll(true), 60_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const summary = data?.summary;
  const kpis = useMemo(() => {
    if (!summary) return null;
    return [
      {
        label: "Win Rate", value: summary.winRate == null ? "—" : pctRaw(summary.winRate),
        sub: summary.winRateLabel, icon: Trophy, color: C.gold,
        hint: summary.winRate == null ? "no closed-loss data" : `${summary.wonCount}W / ${summary.lostCount}L`,
      },
      {
        label: "Won", value: `${summary.wonCount}`, sub: `${fmtUSD(summary.wonARR)} ARR`,
        icon: Trophy, color: C.emerald, hint: "active clients + accepted props",
      },
      {
        label: "Lost", value: `${summary.lostCount}`, sub: summary.lostCount === 0 ? "no losses recorded" : "from .data/proposals.json",
        icon: Frown, color: summary.lostCount === 0 ? C.text3 : C.rust, hint: "explicit lost status",
      },
      {
        label: "Open Deals", value: `${summary.openDeals}`, sub: `${fmtUSD(summary.velocity.weightedValue)} weighted`,
        icon: Target, color: C.blue, hint: "live from kanban",
      },
      {
        label: "Avg Sales Cycle", value: `${summary.velocity.avgSalesCycleDays}d`, sub: `${Math.round(summary.velocity.avgDealValue)} avg deal`,
        icon: Clock, color: C.plum, hint: "client createdAt → updatedAt",
      },
      {
        label: "Sent Proposals", value: `${summary.sentProposals}`,
        sub: `${summary.draftProposals} draft · ${summary.acceptedProposals} accepted`,
        icon: Sparkles, color: C.violet, hint: "awaiting decision",
      },
    ];
  }, [summary]);

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ background: C.bg, color: C.text }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-sm" style={{ color: C.text3 }}>Loading win/loss analytics…</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen p-6" style={{ background: C.bg, color: C.text }}>
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg p-4 border" style={{ background: "rgba(220,80,80,0.08)", borderColor: "rgba(220,80,80,0.4)", color: C.rust }}>
            <div className="text-sm font-semibold">Win/Loss fetch failed</div>
            <div className="text-xs mt-1 opacity-80">{error || "no data"}</div>
            <button
              onClick={() => fetchAll(true)}
              className="mt-3 px-3 py-1.5 rounded-md text-xs border"
              style={{ borderColor: C.border, background: C.card, color: C.text }}
            >
              <RefreshCw size={11} className="inline mr-1" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const wonTier = data.summary.winRate == null ? "—"
    : data.summary.winRate >= 0.6 ? "Healthy"
    : data.summary.winRate >= 0.3 ? "Building"
    : "Critical";

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: C.bg, color: C.text }}>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Breadcrumbs + Header */}
        <PageBreadcrumbs items={[{ label: "Agency" }, { label: "Win/Loss" }]} />

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={20} style={{ color: C.gold }} />
              <h1 className="text-2xl font-bold" style={{ color: C.text }}>Win/Loss Analytics</h1>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: wonTier === "Healthy" ? "rgba(90,184,150,0.18)" : wonTier === "Building" ? "rgba(212,165,116,0.18)" : wonTier === "Critical" ? "rgba(220,80,80,0.18)" : "rgba(255,255,255,0.06)",
                  color: wonTier === "Healthy" ? C.emerald : wonTier === "Building" ? C.gold : wonTier === "Critical" ? C.rust : C.text3,
                }}
              >
                {wonTier}
              </span>
            </div>
            <p className="text-xs" style={{ color: C.text3 }}>
              Closed-deal patterns + proposal outcomes from live pipeline ·{" "}
              <span className="font-mono">{data._sources.length}</span> truth sources · generated <span className="font-mono">{data._latencyMs}ms</span> ago
              {updatedAt && (
                <> · updated <span className="font-mono">{relTime(updatedAt)}</span></>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition"
            style={{ borderColor: C.border, background: C.card, color: C.text2, opacity: refreshing ? 0.5 : 1 }}
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Truth banner if loss data is missing */}
        {data.lossReasons == null && (
          <div
            className="rounded-lg p-3 flex items-start gap-3 border"
            style={{ background: "rgba(212,165,116,0.08)", borderColor: "rgba(212,165,116,0.3)" }}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: C.gold }} />
            <div className="flex-1 text-xs" style={{ color: C.text2 }}>
              <span className="font-semibold" style={{ color: C.gold }}>No closed-loss data yet.</span>{" "}
              Loss-reason breakdown returns <span className="font-mono">null</span> rather than fabricated buckets.
              {data.doctrine.next && (
                <span className="block mt-1 opacity-80">{data.doctrine.next}</span>
              )}
            </div>
          </div>
        )}

        {/* KPI Strip */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-lg p-3 border"
                  style={{ background: C.card, borderColor: C.border }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: C.text3 }}>{k.label}</div>
                    <Icon size={12} style={{ color: k.color }} />
                  </div>
                  <div className="text-[20px] font-bold leading-tight" style={{ color: C.text }}>{k.value}</div>
                  <div className="text-[10px] mt-1 leading-tight" style={{ color: C.text3 }}>{k.sub}</div>
                  {k.hint && (
                    <div className="text-[9px] mt-1 italic" style={{ color: C.text3, opacity: 0.6 }}>{k.hint}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Hero — Win-Rate Ring + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: C.text3 }}>
              <Trophy size={12} style={{ color: C.gold }} />
              Win-Rate Signal
            </div>
            <div className="grid place-items-center">
              <WinRateRing rate={data.summary.winRate} wonCount={data.summary.wonCount} lostCount={data.summary.lostCount} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[9px]" style={{ color: C.text3 }}>Won ARR</div>
                <div className="text-[14px] font-bold" style={{ color: C.emerald }}>{fmtUSD(data.summary.wonARR)}</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: C.text3 }}>Sent Props</div>
                <div className="text-[14px] font-bold" style={{ color: C.violet }}>{data.summary.sentProposals}</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: C.text3 }}>Cycle</div>
                <div className="text-[14px] font-bold" style={{ color: C.plum }}>{data.summary.velocity.avgSalesCycleDays}d</div>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div className="lg:col-span-2 rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: C.text3 }}>
              <Layers size={12} style={{ color: C.blue }} />
              Pipeline Funnel
            </div>
            {(() => {
              const maxN = Math.max(1, ...data.funnel.map((f) => f.n));
              const stageColors = [
                C.cyan, C.blue, C.violet, C.gold, C.emerald, C.rust,
              ];
              return (
                <div className="space-y-2.5">
                  {data.funnel.map((f, i) => {
                    const w = (f.n / maxN) * 100;
                    const color = stageColors[i % stageColors.length];
                    return (
                      <div key={f.stage} className="flex items-center gap-3">
                        <div className="w-[110px] text-[11px] font-medium shrink-0" style={{ color: C.text2 }}>{f.stage}</div>
                        <div className="flex-1 h-7 rounded-md overflow-hidden relative" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${w}%` }}
                            transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }}
                            className="h-full rounded-md flex items-center justify-end pr-2.5"
                            style={{ background: `linear-gradient(90deg, ${color}40, ${color})`, borderRight: `3px solid ${color}` }}
                          >
                            <span className="text-[11px] font-bold" style={{ color: C.text }}>{f.n}</span>
                          </motion.div>
                        </div>
                        <div className="w-[44px] text-[10px] text-right font-mono shrink-0" style={{ color: C.text3 }}>
                          {pct(f.n, data.funnel.reduce((a, x) => a + x.n, 0))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div className="mt-4 pt-3 border-t text-[10px]" style={{ borderColor: C.border, color: C.text3 }}>
              Funnel reads top→bottom: Prospect → Won. Closed-Lost bar in rust. No fabricated loss counts — empty bars mean dataset has no observations at that stage.
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg border w-fit" style={{ background: C.card, borderColor: C.border }}>
          {([
            { k: "funnel", label: "Funnel Detail", icon: Layers },
            { k: "trend", label: "Trend", icon: TrendingUp },
            { k: "verticals", label: "Verticals", icon: PieChart },
            { k: "stages", label: "Stage Win-Rate", icon: Sigma },
          ] as const).map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setActiveTab(t.k)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition"
                style={{
                  background: active ? C.bgMid : "transparent",
                  color: active ? C.text : C.text3,
                }}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "funnel" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Sent Proposals Aging */}
            <div className="lg:col-span-2 rounded-lg p-4 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: C.text3 }}>
                  <Sparkles size={12} style={{ color: C.violet }} />
                  Sent Proposals (Aging)
                </div>
                <div className="text-[10px] font-mono" style={{ color: C.text3 }}>{data.sentProposals.length} total</div>
              </div>
              {data.sentProposals.length === 0 ? (
                <EmptyHint text="No sent proposals in current dataset." />
              ) : (
                <div className="space-y-2">
                  {data.sentProposals
                    .sort((a, b) => b.ageDays - a.ageDays)
                    .slice(0, 8)
                    .map((p) => {
                      const ageColor = p.ageDays > 21 ? C.rust : p.ageDays > 14 ? C.gold : C.emerald;
                      const ageLabel = p.ageDays > 21 ? "stale" : p.ageDays > 14 ? "aging" : "fresh";
                      return (
                        <div
                          key={p.id}
                          className="rounded-md p-2.5 border flex items-center gap-3"
                          style={{ background: C.bgMid, borderColor: C.border }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium truncate" style={{ color: C.text }}>{p.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono" style={{ color: C.text3 }}>{p.id}</span>
                              <span className="text-[10px]" style={{ color: C.text3 }}>· sent {p.sentAt ? new Date(p.sentAt).toLocaleDateString() : "—"}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[14px] font-bold" style={{ color: C.emerald }}>{fmtUSD(p.amount)}</div>
                            <div className="flex items-center gap-1 justify-end mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${ageColor}25`, color: ageColor }}>{ageLabel}</span>
                              <span className="text-[10px] font-mono" style={{ color: C.text3 }}>{p.ageDays}d</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Velocity mini-stats */}
            <div className="rounded-lg p-4 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: C.text3 }}>
                <Activity size={12} style={{ color: C.gold }} />
                Velocity Panel
              </div>
              <div className="space-y-2.5">
                <VelocityRow label="Open Deals" value={`${data.summary.velocity.openDeals}`} color={C.blue} />
                <VelocityRow label="Weighted Pipeline" value={fmtUSD(data.summary.velocity.weightedValue)} color={C.emerald} />
                <VelocityRow label="Closed Value" value={fmtUSD(data.summary.velocity.closedValue)} color={C.gold} />
                <VelocityRow label="Avg Deal Size" value={fmtUSD(data.summary.velocity.avgDealValue)} color={C.plum} />
                <VelocityRow label="Avg Sales Cycle" value={`${data.summary.velocity.avgSalesCycleDays} days`} color={C.cyan} />
                <VelocityRow label="Won ARR" value={fmtUSD(data.summary.wonARR)} color={C.emerald} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "trend" && (
          <div className="rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: C.text3 }}>
                <TrendingUp size={12} style={{ color: C.emerald }} />
                Win/Loss Trend (Month-Over-Month)
              </div>
              {data.trend.length > 0 && (
                <div className="text-[10px] font-mono" style={{ color: C.text3 }}>
                  {data.trend.length} months
                </div>
              )}
            </div>
            {data.trend.length === 0 ? (
              <EmptyHint text="No monthly trend data — need either sent proposals or won clients with timestamps." />
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-3 h-48 px-2">
                  {(() => {
                    const max = Math.max(1, ...data.trend.map((t) => Math.max(t.wins, t.losses)));
                    return data.trend.map((t, i) => (
                      <div key={t.month} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div className="w-full flex justify-center items-end gap-1 h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(t.wins / max) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="w-3 rounded-t"
                            style={{ background: `linear-gradient(180deg, ${C.emerald}, ${C.emerald}80)`, minHeight: 2 }}
                            title={`Won: ${t.wins}`}
                          />
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(t.losses / max) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 + 0.02 }}
                            className="w-3 rounded-t"
                            style={{ background: `linear-gradient(180deg, ${C.rust}, ${C.rust}80)`, minHeight: 2 }}
                            title={`Lost: ${t.losses}`}
                          />
                        </div>
                        <div className="text-[9px] font-mono" style={{ color: C.text3 }}>{t.month}</div>
                      </div>
                    ));
                  })()}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center" style={{ borderColor: C.border }}>
                  <Legend color={C.emerald} label="Won" />
                  <Legend color={C.rust} label="Lost" />
                  <div className="text-[10px] py-1" style={{ color: C.text3 }}>
                    Revenue shown below
                  </div>
                </div>
                <div className="space-y-1.5 mt-2">
                  {data.trend.map((t) => (
                    <div
                      key={t.month}
                      className="flex items-center justify-between text-xs rounded-md px-3 py-1.5 border"
                      style={{ background: C.bgMid, borderColor: C.border }}
                    >
                      <span className="font-mono" style={{ color: C.text2 }}>{t.month}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px]" style={{ color: C.emerald }}>
                          <ArrowUpRight size={10} className="inline" /> {t.wins}
                        </span>
                        <span className="text-[10px]" style={{ color: t.losses > 0 ? C.rust : C.text3 }}>
                          <ArrowDownRight size={10} className="inline" /> {t.losses}
                        </span>
                        <span className="font-bold font-mono text-[11px]" style={{ color: C.gold }}>{fmtUSD(t.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "verticals" && (
          <div className="rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: C.text3 }}>
              <PieChart size={12} style={{ color: C.blue }} />
              Vertical Win/Loss Breakdown
            </div>
            {data.verticalRows.length === 0 ? (
              <EmptyHint text="No vertical-tagged clients in dataset. Tag client notes with 'Vertical: <name>' and 'Monthly: $<amount>' to surface vertical metrics." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.verticalRows.map((v) => {
                  const closeRate = v.total > 0 ? v.won / v.total : 0;
                  const tier = closeRate >= 0.6 ? C.emerald : closeRate >= 0.3 ? C.gold : closeRate > 0 ? C.rust : C.text3;
                  return (
                    <div
                      key={v.vertical}
                      className="rounded-lg p-3 border"
                      style={{ background: C.bgMid, borderColor: C.border }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[12px] font-semibold capitalize" style={{ color: C.text }}>{v.vertical.replace(/_/g, " ")}</div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: `${tier}25`, color: tier }}>
                          {pct(v.won, v.total)} close
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center my-2">
                        <VertStat label="Won" value={v.won} color={C.emerald} />
                        <VertStat label="Lost" value={v.lost} color={C.rust} />
                        <VertStat label="Open" value={v.open} color={C.blue} />
                      </div>
                      <div className="text-[10px] mt-2 mb-1" style={{ color: C.text3 }}>Annual contract value</div>
                      <div className="text-[16px] font-bold" style={{ color: C.gold }}>{fmtUSD(v.value)}</div>
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, closeRate * 100)}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${tier}80, ${tier})` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "stages" && (
          <div className="rounded-lg p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: C.text3 }}>
              <Sigma size={12} style={{ color: C.gold }} />
              Stage Win-Rate (Probability-Weighted)
            </div>
            {data.stageWinRate.length === 0 ? (
              <EmptyHint text="No deal-stage data in pipeline." />
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left" style={{ color: C.text3 }}>
                    <th className="py-2 pr-3 text-[10px] uppercase tracking-wider font-medium">Stage</th>
                    <th className="py-2 pr-3 text-[10px] uppercase tracking-wider font-medium">Deals</th>
                    <th className="py-2 pr-3 text-[10px] uppercase tracking-wider font-medium">Avg Close Probability</th>
                    <th className="py-2 text-[10px] uppercase tracking-wider font-medium">Visualization</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stageWinRate
                    .sort((a, b) => b.avgP - a.avgP)
                    .map((s) => {
                      const pctVal = Math.round(s.avgP * 100);
                      const stageColor = s.avgP >= 0.7 ? C.emerald : s.avgP >= 0.4 ? C.gold : s.avgP >= 0.2 ? C.blue : C.text3;
                      return (
                        <tr key={s.stage} className="border-t" style={{ borderColor: C.border }}>
                          <td className="py-2.5 pr-3 font-medium capitalize" style={{ color: C.text }}>{s.stage.replace(/_/g, " ")}</td>
                          <td className="py-2.5 pr-3 font-mono" style={{ color: C.text2 }}>{s.n}</td>
                          <td className="py-2.5 pr-3 font-bold font-mono" style={{ color: stageColor }}>{pctVal}%</td>
                          <td className="py-2.5">
                            <div className="h-2 rounded-full overflow-hidden max-w-[300px]" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pctVal}%` }}
                                transition={{ duration: 0.6 }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${stageColor}80, ${stageColor})` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Win/Loss Reasons */}
        {(data.winReasons || data.lossReasons) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.winReasons && (
              <div className="rounded-lg p-4 border" style={{ background: C.card, borderColor: C.border }}>
                <div className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: C.text3 }}>
                  <Award size={12} style={{ color: C.emerald }} />
                  Win Reasons
                </div>
                <div className="space-y-1.5">
                  {data.winReasons.map((r) => (
                    <ReasonRowItem
                      key={r.reason}
                      reason={r}
                      color={C.emerald}
                      expanded={expandedReason === r.reason}
                      onToggle={() => setExpandedReason(expandedReason === r.reason ? null : r.reason)}
                    />
                  ))}
                </div>
              </div>
            )}
            {data.lossReasons && (
              <div className="rounded-lg p-4 border" style={{ background: C.card, borderColor: C.border }}>
                <div className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: C.text3 }}>
                  <Frown size={12} style={{ color: C.rust }} />
                  Loss Reasons
                </div>
                <div className="space-y-1.5">
                  {data.lossReasons.map((r) => (
                    <ReasonRowItem
                      key={r.reason}
                      reason={r}
                      color={C.rust}
                      expanded={expandedReason === r.reason}
                      onToggle={() => setExpandedReason(expandedReason === r.reason ? null : r.reason)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Truth Layer */}
        <div className="rounded-lg p-4 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: C.text3 }}>
            <ShieldCheck size={12} style={{ color: C.emerald }} />
            Truth Layer — Data Provenance
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold mb-2" style={{ color: C.gold }}>Live Sources</div>
              <ul className="text-[10px] space-y-1 font-mono" style={{ color: C.text2 }}>
                {data._sources.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Zap size={9} className="mt-0.5 shrink-0" style={{ color: C.emerald }} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-[10px]" style={{ color: C.text3 }}>
                Generated <span className="font-mono">{data._latencyMs}ms</span> · {relTime(data._generatedAt)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold mb-2" style={{ color: C.gold }}>Doctrine</div>
              <p className="text-[10px] leading-relaxed mb-2" style={{ color: C.text2 }}>{data.doctrine.truth}</p>
              <p className="text-[10px] leading-relaxed" style={{ color: C.text3 }}>{data.doctrine.next}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[9px] text-center pt-2 pb-4" style={{ color: C.text3 }}>
          Win/Loss Analytics · {wonTier} signal · Refreshes every 60s · Doctrine: ProofPacket or it didn't happen.
        </div>
      </div>
    </div>
  );
}

function VelocityRow({ label, value, color }: { label: string; value: string; color: string; }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md border" style={{ background: C.bgMid, borderColor: C.border }}>
      <span className="text-[10px]" style={{ color: C.text3 }}>{label}</span>
      <span className="text-[12px] font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string; }) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[10px]" style={{ color: C.text3 }}>
      <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
      {label}
    </div>
  );
}

function VertStat({ label, value, color }: { label: string; value: number; color: string; }) {
  return (
    <div className="rounded-md p-1.5" style={{ background: `${color}15` }}>
      <div className="text-[9px] uppercase" style={{ color: C.text3 }}>{label}</div>
      <div className="text-[14px] font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string; }) {
  return (
    <div className="rounded-md p-4 border text-center text-[11px]" style={{ background: C.bgMid, borderColor: C.border, color: C.text3 }}>
      <AlertTriangle size={14} className="inline mr-1.5" style={{ color: C.gold }} />
      {text}
    </div>
  );
}

function ReasonRowItem({ reason, color, expanded, onToggle }: { reason: ReasonRow; color: string; expanded: boolean; onToggle: () => void; }) {
  return (
    <div className="rounded-md border overflow-hidden" style={{ background: C.bgMid, borderColor: C.border }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-2.5 text-left"
      >
        {expanded ? <ChevronDown size={12} style={{ color: C.text3 }} /> : <ChevronRight size={12} style={{ color: C.text3 }} />}
        <div className="flex-1 text-[11px] font-medium" style={{ color: C.text }}>{reason.reason}</div>
        <div className="text-[11px] font-mono font-bold" style={{ color }}>{reason.count}</div>
        {reason.weighted > 0 && (
          <div className="text-[10px] font-mono" style={{ color: C.text3 }}>${reason.weighted}</div>
        )}
      </button>
      {expanded && reason.examples && reason.examples.length > 0 && (
        <div className="px-3 pb-2.5 border-t" style={{ borderColor: C.border }}>
          <div className="text-[9px] uppercase tracking-wider pt-2 mb-1" style={{ color: C.text3 }}>Examples</div>
          <ul className="text-[10px] space-y-0.5" style={{ color: C.text2 }}>
            {reason.examples.map((e, i) => (
              <li key={i}>· {e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
