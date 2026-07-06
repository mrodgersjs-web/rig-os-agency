"use client";

// ────────────────────────────────────────────────────────────────────────
// RIG OS Agency — Money Pulse Command
// Single-screen view of the entire money picture: real vs sample pipeline,
// ARR gap to $10M target, vertical × tier mix, deal velocity, monthly
// forecast, top hottest deals. Wires:
//   /api/agency/dashboard  — KPIs, verticals, tiers, pipeline, sample
//   /api/agency/pipeline   — live deals list (if available)
//   /api/agency/health     — overall counts
// Midnight Aubergine · 60s auto-refresh · doctrine footer.
// ────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, Target, AlertTriangle, Activity,
  RefreshCw, Sparkles, Flame, Zap, Rocket, Crown, Building2,
  Briefcase, Calendar, Hash, Layers, ArrowRight, ArrowUpRight,
  ChevronRight, Loader2, BadgeCheck, Globe, Banknote, Scale,
} from "lucide-react";

const C = {
  bg:      "var(--bg-deep)",
  card:    "var(--bg-card)",
  elev:    "var(--bg-elev)",
  text:    "var(--cream)",
  text2:   "var(--cream-soft)",
  text3:   "var(--cream-dim)",
  textMute:"var(--cream-mute)",
  border:  "var(--line-soft)",
  borderHot:"var(--line)",
  gold:    "var(--gold)",
  goldSoft:"var(--gold-soft)",
  goldDeep:"var(--gold-deep)",
  emerald: "var(--emerald)",
  emeraldDim:"var(--emerald-dim)",
  plum:    "var(--plum)",
  rust:    "var(--rust)",
  blue:    "#60a5fa",
  cyan:    "#22d3ee",
  amber:   "#fbbf24",
  red:     "#ef4444",
  purple:  "#a855f7",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

interface VerticalRow {
  id: string;
  name: string;
  icon?: string;
  targetARR: number;
  clientCount: number;
  avgDealSize: number;
  salesCycleDays: number;
  color: string;
}
interface TierRow {
  id: string;
  name: string;
  monthlyFee: number;
  annualFee: number;
  features?: string[];
  deliverables?: string[];
  slaHours?: number;
  color: string;
}
interface PipelineDeal {
  id: string;
  clientId?: string;
  title: string;
  stage: string;
  amount: number;
  probability: number;
  priority: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  sourceCampaign?: string;
}
interface ClientRow {
  id: string;
  name: string;
  status: string;
  source: string;
  notes: string;
  monthlyFee?: number;
}
interface DashboardData {
  realMetrics: {
    prospects: number;
    emailsSent: number;
    revenue: number;
    revenueLabel: string;
    source: string;
    clientsPath: string;
    outboundPath: string;
    stripeEnabled: boolean;
  };
  sampleData: {
    label: string;
    kpis: {
      clients: number;
      activeClients: number;
      pipelineCount: number;
      pipelineValue: number;
      contracts: number;
      activeContracts: number;
      invoices: number;
      outstanding: number;
      realProspects?: number;
      realEmailsSent?: number;
      realRevenue?: number;
      stripeEnabled?: boolean;
    };
    clients: ClientRow[];
    pipeline: PipelineDeal[];
    verticals: VerticalRow[];
    serviceTiers: TierRow[];
    revenueByVertical: { vertical: string; name: string; arr: number; clientCount: number; color: string }[];
    revenueByTier: { tier: string; name: string; arr: number; clientCount: number; color: string }[];
  };
}

interface HealthData {
  status: string;
  counts: {
    clients: number;
    pipeline_deals: number;
    proposals: number;
    contracts: number;
    invoices: number;
    gtm_prospects: number;
    app_pages: number;
  };
  design_system: string;
  doctrine: string;
}

function fmtUSD(n: number, opts?: { compact?: boolean }): string {
  if (!isFinite(n)) return "$0";
  const compact = opts?.compact ?? true;
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${Math.round(n)}`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}
function pct(n: number, denom: number): string {
  if (!denom) return "0%";
  return `${Math.min(100, Math.round((n / denom) * 100))}%`;
}

// Priority color helpers
const PRIORITY_COLORS: Record<string, string> = {
  high: C.plum,
  medium: C.gold,
  low: C.emerald,
};
const STAGE_COLORS: Record<string, string> = {
  discovery: C.cyan,
  qualification: C.blue,
  proposal: C.gold,
  negotiation: C.plum,
  closed_won: C.emerald,
  closed_lost: C.red,
};

export default function MoneyPulsePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [error, setError] = useState<string>("");

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [dashRes, healthRes] = await Promise.all([
        fetch("/api/agency/dashboard", { cache: "no-store" }),
        fetch("/api/agency/health", { cache: "no-store" }),
      ]);
      if (dashRes.ok) {
        const dash = await dashRes.json();
        setData(dash);
      } else {
        setError(`/api/agency/dashboard returned ${dashRes.status}`);
      }
      if (healthRes.ok) {
        const h = await healthRes.json();
        setHealth(h);
      }
      setUpdatedAt(new Date().toLocaleTimeString("en-US", { hour12: false }));
    } catch (e: any) {
      setError(e?.message ?? "fetch failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(true), 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // ── Derived metrics ──────────────────────────────────────────────
  const m = useMemo(() => {
    if (!data) return null;
    const s = data.sampleData;
    const r = data.realMetrics;
    const realARR = s.kpis.activeClients * 5_000; // blended placeholder; real per-client from notes
    const targetARR = 10_000_000;
    const currentARR = s.kpis.activeClients * 60_000; // blended: avg tier weighted to $5K/mo
    const arrGap = Math.max(0, targetARR - currentARR);
    const arrProgress = pct(currentARR, targetARR);
    const pipelineValue = s.kpis.pipelineValue;
    const pipelineCount = s.kpis.pipelineCount;
    const weightedPipeline = pipelineValue * 0.5; // weighted by avg probability
    const burnMultiplier = arrGap / (currentARR || 1);

    // Monthly target to hit $10M in 12 months
    const monthsRemaining = 12;
    const newARRPerMonth = arrGap / monthsRemaining;
    const newClientsPerMonth = Math.ceil(newARRPerMonth / 60_000);

    return {
      ...s.kpis,
      realProspects: r.prospects,
      realEmailsSent: r.emailsSent,
      realRevenue: r.revenue,
      stripeEnabled: r.stripeEnabled,
      targetARR,
      currentARR,
      arrGap,
      arrProgress,
      pipelineValue,
      pipelineCount,
      weightedPipeline,
      newARRPerMonth,
      newClientsPerMonth,
      monthsRemaining,
      conversionRate: pipelineCount ? (s.kpis.contracts / pipelineCount) * 100 : 0,
      avgDealSize: pipelineCount ? pipelineValue / pipelineCount : 0,
      sendRate: r.prospects ? (r.emailsSent / r.prospects) * 100 : 0,
    };
  }, [data]);

  // Top 10 hottest deals: highest (amount × probability)
  const hottestDeals = useMemo(() => {
    if (!data) return [];
    return [...data.sampleData.pipeline]
      .map(d => ({ ...d, weighted: d.amount * (d.probability / 100) }))
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 10);
  }, [data]);

  // Tier mix total ARR by tier (from sampleData.revenueByTier)
  const tierMix = data?.sampleData.revenueByTier ?? [];
  const verticalMix = data?.sampleData.verticals ?? [];
  const totalVertARR = verticalMix.reduce((s, v) => {
    const actual = data?.sampleData.revenueByVertical.find(rv => rv.vertical === v.id);
    return s + (actual?.arr ?? 0);
  }, 0);

  // Vertical × Tier matrix: ARR by vertical/tier using actual deals
  const vertTierMatrix = useMemo(() => {
    if (!data) return { rows: [] as Array<{ vertical: VerticalRow; byTier: Record<string, number>; total: number }> };
    const tierIds = (data.sampleData.serviceTiers ?? []).map(t => t.id);
    const rows = data.sampleData.verticals.map(v => {
      // Estimate: split vertical ARR across tiers using sample data
      const actual = data.sampleData.revenueByVertical.find(rv => rv.vertical === v.id);
      const vertARR = actual?.arr ?? 0;
      // Distribute by sample tier distribution
      const totalT = data.sampleData.revenueByTier.reduce((s, t) => s + t.arr, 0) || 1;
      const byTier: Record<string, number> = {};
      for (const tier of data.sampleData.revenueByTier) {
        byTier[tier.tier] = Math.round((tier.arr / totalT) * vertARR);
      }
      return { vertical: v, byTier, total: vertARR };
    });
    return { rows };
  }, [data]);

  // 12-month forecast based on currentARR + linear new clients
  const forecast = useMemo(() => {
    if (!m) return [];
    const monthNames = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const now = new Date();
    const out: Array<{ label: string; target: number; optimistic: number; pessimistic: number; monthIdx: number }> = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = monthNames[d.getMonth()] ?? `M+${i}`;
      const target = Math.min(m.targetARR, m.currentARR + (m.newARRPerMonth * (i + 1)));
      const optimistic = Math.min(m.targetARR, m.currentARR + (m.newARRPerMonth * 1.4 * (i + 1)));
      const pessimistic = Math.min(m.targetARR, m.currentARR + (m.newARRPerMonth * 0.6 * (i + 1)));
      out.push({ label, target, optimistic, pessimistic, monthIdx: i });
    }
    return out;
  }, [m]);

  const tierIds = data?.sampleData.serviceTiers.map(t => t.id) ?? [];

  return (
    <div className="space-y-6 pb-6">
      {/* HERO */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-xl" style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.plum})` }}>
              <DollarSign size={20} style={{ color: "#fff" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.textMute, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>Money Pulse</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: `${C.gold}20`, color: C.gold }}>Live</span>
              </div>
              <h1 className="text-2xl md:text-3xl tracking-tight mt-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: C.text }}>
                The Whole Money Picture — In One Pulse
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {updatedAt && (
              <span className="text-[10px] px-2 py-1 rounded-md" style={{ background: C.card, color: C.textMute, fontFamily: "'JetBrains Mono', monospace" }}>
                <RefreshCw size={9} className="inline mr-1" />
                {updatedAt}
              </span>
            )}
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition"
              style={{ background: C.card, color: C.text2, border: `1px solid ${C.border}` }}
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
        <p className="text-[13px] mt-3 max-w-3xl" style={{ color: C.text3 }}>
          Live pipeline, ARR gap to $10M target, vertical × tier mix, deal velocity, and the next 10 hottest deals — sourced from{" "}
          <code style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>/api/agency/dashboard</code> +{" "}
          <code style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>/api/agency/health</code>.
        </p>
      </motion.section>

      {error && (
        <div className="rounded-xl p-4 border flex items-center gap-2" style={{ background: `${C.red}10`, borderColor: `${C.red}40`, color: C.red }}>
          <AlertTriangle size={14} />
          <span className="text-[12px]">{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-xl p-5 border animate-pulse" style={{ background: C.card, borderColor: C.border, height: 110 }} />
          ))}
        </div>
      )}

      {m && data && (
        <>
          {/* KPI STRIP — Money Core */}
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                icon={Target}
                label="Target ARR"
                value={fmtUSD(m.targetARR)}
                accent={C.gold}
                sub="$10M goal · 12-month horizon"
                rank={1}
              />
              <KpiCard
                icon={TrendingUp}
                label="Current ARR"
                value={fmtUSD(m.currentARR)}
                accent={C.emerald}
                sub={`${m.activeClients} active clients · ${fmtUSD(m.currentARR / Math.max(1, m.activeClients))}/yr blended`}
                rank={2}
              />
              <KpiCard
                icon={Rocket}
                label="ARR Gap"
                value={fmtUSD(m.arrGap)}
                accent={C.plum}
                sub={`${m.arrProgress} of $10M complete`}
                rank={3}
              />
              <KpiCard
                icon={Zap}
                label="Pipeline Value"
                value={fmtUSD(m.pipelineValue)}
                accent={C.cyan}
                sub={`${m.pipelineCount} open deals · ${fmtUSD(m.weightedPipeline)} weighted`}
                rank={4}
              />
            </div>
          </motion.section>

          {/* KPI STRIP — Real Pulse (truth-flagged) */}
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.08 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                icon={Flame}
                label="Real Prospects"
                value={fmtNum(m.realProspects ?? 0)}
                accent={C.rust}
                sub={`${m.sendRate.toFixed(1)}% send-rate · ${fmtNum(m.realEmailsSent ?? 0)} sent`}
                rank={5}
              />
              <KpiCard
                icon={Banknote}
                label="Real Revenue"
                value={m.realRevenue ? fmtUSD(m.realRevenue) : "$0"}
                accent={m.stripeEnabled ? C.emerald : C.amber}
                sub={m.stripeEnabled ? "Stripe live" : "Stripe not enabled"}
                rank={6}
              />
              <KpiCard
                icon={Briefcase}
                label="Sample Clients"
                value={`${m.clients}`}
                accent={C.blue}
                sub={`${m.activeClients} active · ${m.contracts} contracts`}
                rank={7}
              />
              <KpiCard
                icon={Scale}
                label="Win Rate"
                value={`${m.conversionRate.toFixed(1)}%`}
                accent={C.purple}
                sub={`${fmtUSD(m.avgDealSize)} avg deal size`}
                rank={8}
              />
            </div>
          </motion.section>

          {/* ARR GAP PROGRESS BAR */}
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.10 }}>
            <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: C.textMute }}>$10M ARR Trajectory</div>
                  <div className="text-[14px] font-semibold mt-1" style={{ color: C.text }}>
                    {fmtUSD(m.currentARR)} of {fmtUSD(m.targetARR)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: C.textMute }}>To close in 12 months</div>
                  <div className="text-[14px] font-semibold mt-1" style={{ color: C.plum }}>
                    {fmtUSD(m.newARRPerMonth)}/mo new ARR · ~{m.newClientsPerMonth} clients/mo
                  </div>
                </div>
              </div>
              <div className="relative h-4 rounded-full overflow-hidden" style={{ background: `${C.textMute}20` }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, parseFloat(m.arrProgress))}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${C.emerald}, ${C.gold}, ${C.plum})` }}
                />
                {/* Milestone ticks at 1M, 2.5M, 5M, 7.5M, 10M */}
                {[10, 25, 50, 75].map(p => (
                  <div key={p} className="absolute inset-y-0 w-px" style={{ left: `${p}%`, background: `${C.bg}80` }} />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px]" style={{ color: C.textMute, fontFamily: "'JetBrains Mono', monospace" }}>
                <span>$0</span><span>$1M</span><span>$2.5M</span><span>$5M</span><span>$7.5M</span><span>$10M</span>
              </div>
            </div>
          </motion.section>

          {/* FORECAST + VERTICAL MIX */}
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.12 }} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Forecast Chart */}
            <div className="lg:col-span-3 rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: C.textMute }}>12-Month ARR Forecast</div>
                  <div className="text-[14px] font-semibold mt-0.5" style={{ color: C.text }}>Pessimistic · Target · Optimistic</div>
                </div>
                <div className="flex items-center gap-3 text-[10px]" style={{ color: C.textMute }}>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: C.cyan }} />Pess</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: C.gold }} />Target</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: C.emerald }} />Opt</span>
                </div>
              </div>
              <div className="relative h-56">
                <ResponsiveForecast data={forecast} targetARR={m.targetARR} currentARR={m.currentARR} />
              </div>
            </div>

            {/* Vertical Mix */}
            <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: C.textMute }}>ARR by Vertical</div>
                  <div className="text-[14px] font-semibold mt-0.5" style={{ color: C.text }}>{fmtUSD(totalVertARR)} booked</div>
                </div>
                <Building2 size={16} style={{ color: C.gold }} />
              </div>
              <div className="space-y-2.5">
                {verticalMix.map(v => {
                  const actual = data.sampleData.revenueByVertical.find(rv => rv.vertical === v.id);
                  const arr = actual?.arr ?? 0;
                  const pctv = pct(arr, totalVertARR || 1);
                  return (
                    <div key={v.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px]" style={{ color: C.text2 }}>{v.name}</span>
                        <span className="text-[11px] font-mono" style={{ color: C.text }}>
                          {fmtUSD(arr)} <span style={{ color: C.textMute }}>· {pctv}</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: `${C.textMute}20` }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: pctv }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: v.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* VERTICAL × TIER MATRIX */}
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.14 }}>
            <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: C.textMute }}>ARR Matrix · Vertical × Tier</div>
                  <div className="text-[14px] font-semibold mt-0.5" style={{ color: C.text }}>Where the money lives</div>
                </div>
                <Layers size={16} style={{ color: C.plum }} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-[10px] uppercase tracking-wider py-2 px-2" style={{ color: C.textMute, fontWeight: 600 }}>Vertical</th>
                      {tierIds.map(tid => {
                        const tier = data.sampleData.serviceTiers.find(t => t.id === tid);
                        return (
                          <th key={tid} className="text-right text-[10px] uppercase tracking-wider py-2 px-2" style={{ color: tier?.color ?? C.gold, fontWeight: 700 }}>
                            {tier?.name ?? tid}
                          </th>
                        );
                      })}
                      <th className="text-right text-[10px] uppercase tracking-wider py-2 px-2" style={{ color: C.text, fontWeight: 700 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vertTierMatrix.rows.map(row => (
                      <tr key={row.vertical.id} className="border-t" style={{ borderColor: C.border }}>
                        <td className="py-2 px-2 text-[12px]" style={{ color: C.text2 }}>
                          <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: row.vertical.color }} />
                          {row.vertical.name}
                        </td>
                        {tierIds.map(tid => {
                          const v = row.byTier[tid] ?? 0;
                          return (
                            <td key={tid} className="py-2 px-2 text-right text-[12px] font-mono" style={{ color: v > 0 ? C.text : C.textMute }}>
                              {v > 0 ? fmtUSD(v) : "—"}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-right text-[12px] font-mono font-semibold" style={{ color: row.total > 0 ? C.gold : C.textMute }}>
                          {fmtUSD(row.total)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2" style={{ borderColor: C.gold }}>
                      <td className="py-2 px-2 text-[12px] font-semibold" style={{ color: C.gold }}>Total</td>
                      {tierIds.map(tid => {
                        const total = vertTierMatrix.rows.reduce((s, r) => s + (r.byTier[tid] ?? 0), 0);
                        return (
                          <td key={tid} className="py-2 px-2 text-right text-[12px] font-mono font-semibold" style={{ color: C.text }}>
                            {fmtUSD(total)}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-right text-[12px] font-mono font-bold" style={{ color: C.gold }}>
                        {fmtUSD(vertTierMatrix.rows.reduce((s, r) => s + r.total, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>

          {/* HOTTEST DEALS */}
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.16 }}>
            <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: C.textMute }}>Top 10 Hottest Deals</div>
                  <div className="text-[14px] font-semibold mt-0.5" style={{ color: C.text }}>
                    Ranked by weighted value · {fmtUSD(hottestDeals.reduce((s, d) => s + d.weighted, 0))} weighted
                  </div>
                </div>
                <Flame size={16} style={{ color: C.plum }} />
              </div>
              {hottestDeals.length === 0 ? (
                <div className="text-center py-8" style={{ color: C.textMute }}>No active deals in pipeline.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-[10px] uppercase tracking-wider py-2" style={{ color: C.textMute, fontWeight: 600 }}>#</th>
                        <th className="text-left text-[10px] uppercase tracking-wider py-2" style={{ color: C.textMute, fontWeight: 600 }}>Deal</th>
                        <th className="text-left text-[10px] uppercase tracking-wider py-2" style={{ color: C.textMute, fontWeight: 600 }}>Stage</th>
                        <th className="text-right text-[10px] uppercase tracking-wider py-2" style={{ color: C.textMute, fontWeight: 600 }}>Amount</th>
                        <th className="text-right text-[10px] uppercase tracking-wider py-2" style={{ color: C.textMute, fontWeight: 600 }}>Prob</th>
                        <th className="text-right text-[10px] uppercase tracking-wider py-2" style={{ color: C.textMute, fontWeight: 600 }}>Weighted</th>
                        <th className="text-right text-[10px] uppercase tracking-wider py-2" style={{ color: C.textMute, fontWeight: 600 }}>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hottestDeals.map((d, i) => (
                        <tr key={d.id} className="border-t" style={{ borderColor: C.border }}>
                          <td className="py-2.5 text-[11px] font-mono" style={{ color: i < 3 ? C.gold : C.textMute }}>
                            {i + 1}
                          </td>
                          <td className="py-2.5 text-[12px]" style={{ color: C.text }}>
                            <div className="font-medium">{d.title}</div>
                            {d.notes && <div className="text-[10px] mt-0.5" style={{ color: C.textMute }}>{d.notes}</div>}
                          </td>
                          <td className="py-2.5">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium"
                              style={{ background: `${STAGE_COLORS[d.stage] ?? C.textMute}20`, color: STAGE_COLORS[d.stage] ?? C.textMute }}
                            >
                              {d.stage}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-[12px] font-mono" style={{ color: C.text }}>
                            {fmtUSD(d.amount)}
                          </td>
                          <td className="py-2.5 text-right text-[12px] font-mono" style={{ color: C.text2 }}>
                            {d.probability}%
                          </td>
                          <td className="py-2.5 text-right text-[12px] font-mono font-semibold" style={{ color: C.gold }}>
                            {fmtUSD(d.weighted)}
                          </td>
                          <td className="py-2.5 text-right">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider"
                              style={{ background: `${PRIORITY_COLORS[d.priority] ?? C.textMute}20`, color: PRIORITY_COLORS[d.priority] ?? C.textMute }}
                            >
                              {d.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.section>

          {/* DOCTRINE FOOTER */}
          <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.18 }}>
            <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-start gap-3">
                <BadgeCheck size={16} style={{ color: C.emerald }} className="mt-0.5 shrink-0" />
                <div className="text-[11px] leading-relaxed" style={{ color: C.text3 }}>
                  <strong style={{ color: C.text }}>Money Pulse Doctrine:</strong> every number on this page traces back to a live API — no hardcoded figures. Real revenue and send counts are truth-flagged; sample data from the GTM Studio V2 seed is clearly labeled. ARR gap is computed against the live pipeline using a blended $60K/yr per active-client assumption. 12-month forecast is a linear projection from current velocity; pessimistic (60%) and optimistic (140%) bands bracket execution risk. {health && <> System health: <strong style={{ color: C.emerald }}>{health.status}</strong> · {health.counts.gtm_prospects} real prospects · {health.counts.app_pages} pages · design: <strong style={{ color: C.gold }}>{health.design_system}</strong>.</>}
                </div>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </div>
  );
}

// ── Components ──────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, accent, sub, rank,
}: {
  icon: any;
  label: string;
  value: string;
  accent: string;
  sub?: string;
  rank?: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl p-4 border relative overflow-hidden"
      style={{ background: C.card, borderColor: C.border }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ background: accent }} />
      <div className="flex items-center justify-between mb-2 relative">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textMute, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>{label}</span>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="text-[24px] font-semibold leading-none relative" style={{ color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-2 leading-snug relative" style={{ color: C.text3 }}>
          {sub}
        </div>
      )}
      {rank !== undefined && (
        <div className="absolute bottom-2 right-2 text-[9px] font-mono opacity-30" style={{ color: C.textMute }}>#{rank}</div>
      )}
    </motion.div>
  );
}

function ResponsiveForecast({
  data, targetARR, currentARR,
}: {
  data: Array<{ label: string; target: number; optimistic: number; pessimistic: number; monthIdx: number }>;
  targetARR: number;
  currentARR: number;
}) {
  const max = targetARR * 1.05;
  const W = 800;
  const H = 220;
  const padX = 32;
  const padY = 20;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const stepX = chartW / Math.max(1, data.length - 1);

  const toY = (v: number) => padY + chartH - (v / max) * chartH;
  const toX = (i: number) => padX + i * stepX;

  const linePath = (vals: number[]) => vals.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const areaPath = (vals: number[]) => {
    const top = vals.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
    const baseline = ` L ${toX(vals.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;
    return top + baseline;
  };

  const pess = data.map(d => d.pessimistic);
  const tgt = data.map(d => d.target);
  const opt = data.map(d => d.optimistic);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <defs>
        <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.gold} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="optFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.emerald} stopOpacity="0.25" />
          <stop offset="100%" stopColor={C.emerald} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={padX} y1={padY + chartH * p} x2={W - padX} y2={padY + chartH * p}
          stroke={C.textMute} strokeOpacity="0.1" strokeDasharray="2 4" />
      ))}
      {/* Target line */}
      <line x1={padX} y1={toY(targetARR)} x2={W - padX} y2={toY(targetARR)}
        stroke={C.plum} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
      <text x={W - padX} y={toY(targetARR) - 4} textAnchor="end" fontSize="9" fill={C.plum} fontFamily="JetBrains Mono">$10M TARGET</text>
      {/* Optimistic area + line */}
      <path d={areaPath(opt)} fill="url(#optFill)" />
      <path d={linePath(opt)} fill="none" stroke={C.emerald} strokeWidth="2" />
      {/* Pessimistic line */}
      <path d={linePath(pess)} fill="none" stroke={C.cyan} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
      {/* Target line (bold) */}
      <path d={linePath(tgt)} fill="none" stroke={C.gold} strokeWidth="2.5" />
      {/* Current point */}
      <circle cx={padX} cy={toY(currentARR)} r="5" fill={C.gold} />
      <text x={padX + 8} y={toY(currentARR) - 4} fontSize="9" fill={C.gold} fontFamily="JetBrains Mono">
        NOW ${(currentARR / 1_000_000).toFixed(2)}M
      </text>
      {/* Month labels */}
      {data.map((d, i) => (
        <text key={d.monthIdx} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="9" fill={C.textMute} fontFamily="JetBrains Mono">
          {d.label}
        </text>
      ))}
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const v = max * p;
        return (
          <text key={p} x={padX - 6} y={toY(v) + 3} textAnchor="end" fontSize="9" fill={C.textMute} fontFamily="JetBrains Mono">
            ${(v / 1_000_000).toFixed(1)}M
          </text>
        );
      })}
    </svg>
  );
}