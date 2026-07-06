"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowRight, ArrowUp, BarChart3, Building2,
  Calendar, CheckCircle2, ChevronRight, Clock, DollarSign, ExternalLink,
  Filter, Flame, Funnel, Gauge, Layers, Mail, MailCheck, PieChart as PieIcon,
  RefreshCw, Search, Sparkles, Target, TrendingUp, Users, X, Zap,
} from "lucide-react";

const C = {
  bg: "var(--bg-deep)",
  bgMid: "var(--bg-mid)",
  card: "var(--bg-card)",
  elev: "var(--bg-elev)",
  text: "var(--cream)",
  text2: "var(--cream-soft)",
  text3: "var(--cream-dim)",
  textMute: "var(--cream-mute)",
  border: "var(--line-soft)",
  borderHot: "var(--line)",
  gold: "var(--gold)",
  goldSoft: "var(--gold-soft)",
  goldDeep: "var(--gold-deep)",
  emerald: "var(--emerald)",
  emeraldDim: "var(--emerald-dim)",
  plum: "var(--plum)",
  rust: "var(--rust)",
};

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

// ── Types (mirror /api/agency/pipeline-deals + /api/agency/pipeline) ──
type Stage = "discovery" | "qualified" | "proposal" | "negotiation" | "closed";

interface Deal {
  id: string;
  clientName: string;
  contact: string;
  dealValue: number;
  stage: Stage;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface DealSummary {
  count: number;
  totalValue: number;
  closedValue: number;
  weightedValue: number;
  stageCounts: Record<Stage, number>;
}

interface Vertical {
  id: string;
  name: string;
  icon: string;
  targetARR: number;
  clientCount: number;
  avgDealSize: number;
  salesCycleDays: number;
  color: string;
}

const STAGE_META: Record<Stage, { label: string; color: string; ring: string; weight: number }> = {
  discovery:    { label: "Discovery",    color: "#7dd3fc", ring: "rgba(125,211,252,0.18)", weight: 0.10 },
  qualified:    { label: "Qualified",    color: "#a78bfa", ring: "rgba(167,139,250,0.18)", weight: 0.25 },
  proposal:     { label: "Proposal",     color: C.gold,   ring: "rgba(212,165,116,0.18)", weight: 0.50 },
  negotiation:  { label: "Negotiation",  color: "#fbbf24", ring: "rgba(251,191,36,0.18)",  weight: 0.75 },
  closed:       { label: "Closed Won",   color: C.emerald,ring: "rgba(90,184,150,0.18)",  weight: 1.00 },
};

const STAGE_ORDER: Stage[] = ["discovery", "qualified", "proposal", "negotiation", "closed"];

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return iso.slice(0, 10); }
}

function daysSince(iso: string): number {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  } catch { return 0; }
}

export default function AgencyPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [summary, setSummary] = useState<DealSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastTick, setLastTick] = useState<string>("");
  const [filterStage, setFilterStage] = useState<Stage | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Deal | null>(null);

  const load = useCallback(async () => {
    try {
      const [dealsRes, pipeRes] = await Promise.all([
        fetch("/api/agency/pipeline-deals", { cache: "no-store" }),
        fetch("/api/agency/pipeline", { cache: "no-store" }),
      ]);
      if (dealsRes.ok) {
        const data = await dealsRes.json();
        const ds: Deal[] = data.deals ?? [];
        setDeals(ds);
        setSummary({
          count: data.count ?? ds.length,
          totalValue: data.totalValue ?? ds.reduce((s, d) => s + d.dealValue, 0),
          closedValue: data.closedValue ?? ds.filter(d => d.stage === "closed").reduce((s, d) => s + d.dealValue, 0),
          weightedValue: data.weightedValue ?? 0,
          stageCounts: data.stageCounts ?? STAGE_ORDER.reduce((acc, st) => ({ ...acc, [st]: 0 }), {} as Record<Stage, number>),
        });
      }
      if (pipeRes.ok) {
        const data = await pipeRes.json();
        setVerticals(data.verticals ?? []);
      }
    } catch (e) {
      console.error("pipeline load failed", e);
    } finally {
      setLoading(false);
      setLastTick(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    let out = deals;
    if (filterStage !== "all") out = out.filter(d => d.stage === filterStage);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(d =>
        d.clientName.toLowerCase().includes(q) ||
        d.contact.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q)
      );
    }
    return out.sort((a, b) => b.dealValue - a.dealValue);
  }, [deals, filterStage, search]);

  const kpis = useMemo(() => {
    const open = deals.filter(d => d.stage !== "closed");
    const closed = deals.filter(d => d.stage === "closed");
    const totalOpen = open.reduce((s, d) => s + d.dealValue, 0);
    const totalClosed = closed.reduce((s, d) => s + d.dealValue, 0);
    const weighted = open.reduce((s, d) => s + d.dealValue * STAGE_META[d.stage].weight, 0);
    const winRate = deals.length ? Math.round((closed.length / deals.length) * 100) : 0;
    const avgDeal = deals.length ? Math.round(deals.reduce((s, d) => s + d.dealValue, 0) / deals.length) : 0;
    const stallCount = open.filter(d => daysSince(d.updatedAt) > 14).length;
    return { totalOpen, totalClosed, weighted, winRate, avgDeal, stallCount, openCount: open.length, closedCount: closed.length };
  }, [deals]);

  const stageBars = useMemo(() => {
    const max = Math.max(1, ...STAGE_ORDER.map(s =>
      deals.filter(d => d.stage === s).reduce((sum, d) => sum + d.dealValue, 0)
    ));
    return STAGE_ORDER.map(s => {
      const stageDeals = deals.filter(d => d.stage === s);
      const value = stageDeals.reduce((sum, d) => sum + d.dealValue, 0);
      const count = stageDeals.length;
      return {
        stage: s,
        value,
        count,
        widthPct: Math.max(6, (value / max) * 100),
      };
    });
  }, [deals]);

  const sourceBreakdown = useMemo(() => {
    const m = new Map<string, { count: number; value: number }>();
    deals.forEach(d => {
      const cur = m.get(d.source) ?? { count: 0, value: 0 };
      cur.count += 1;
      cur.value += d.dealValue;
      m.set(d.source, cur);
    });
    return Array.from(m.entries())
      .map(([source, v]) => ({ source, ...v }))
      .sort((a, b) => b.value - a.value);
  }, [deals]);

  const totalSourceValue = sourceBreakdown.reduce((s, x) => s + x.value, 0) || 1;

  // Pipeline health 0-100
  const health = useMemo(() => {
    let score = 70;
    if (kpis.winRate >= 25) score += 10;
    if (kpis.weighted >= kpis.totalOpen * 0.4) score += 10;
    if (kpis.stallCount === 0) score += 10;
    else score -= kpis.stallCount * 5;
    return Math.max(0, Math.min(100, score));
  }, [kpis]);

  return (
    <div className="space-y-8">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <motion.section {...fadeUp} className="space-y-3">
        <div className="flex items-center gap-3">
          <Funnel size={22} style={{ color: C.gold }} />
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: C.textMute }}>
            Agency Pipeline · {lastTick || "—"} · {deals.length} deals
          </span>
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: C.text }}>Deal Flow &amp; Forecasting</h1>
            <p className="text-sm mt-1" style={{ color: C.text3 }}>
              Live deals from <code style={{ color: C.goldSoft }}>/api/agency/pipeline-deals</code> · 5-stage flow · weighted forecast
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
              style={{ background: C.card, color: C.gold, borderColor: C.borderHot }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── KPI STRIP ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: "Open Pipeline", value: formatCurrency(kpis.totalOpen), color: C.gold, sub: `${kpis.openCount} active deals` },
          { icon: TrendingUp, label: "Weighted Forecast", value: formatCurrency(kpis.weighted), color: C.emerald, sub: `${Math.round((kpis.weighted / Math.max(1, kpis.totalOpen)) * 100)}% of open` },
          { icon: CheckCircle2, label: "Closed Won", value: formatCurrency(kpis.totalClosed), color: "#a78bfa", sub: `${kpis.closedCount} won · ${kpis.winRate}% rate` },
          { icon: AlertTriangle, label: "Stalled Deals", value: `${kpis.stallCount}`, color: kpis.stallCount > 0 ? "#ef4444" : C.text3, sub: kpis.stallCount > 0 ? ">14d no activity" : "all active" },
        ].map((k, i) => (
          <motion.div key={k.label} {...fadeUp} transition={{ delay: i * 0.05 }} className="panel p-5">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ background: `${k.color}1a`, color: k.color, width: 42, height: 42 }}
              >
                <k.icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold truncate" style={{ color: C.text }}>{k.value}</div>
                <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: C.textMute }}>{k.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: C.text3 }}>{k.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* ── HEALTH + AVG DEAL ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div {...fadeUp} className="panel p-5 md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gauge size={16} style={{ color: C.gold }} />
              <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.text2 }}>Pipeline Health</h3>
            </div>
            <span className="text-2xl font-bold" style={{ color: health >= 75 ? C.emerald : health >= 50 ? C.gold : "#ef4444" }}>
              {health}<span className="text-xs opacity-50">/100</span>
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: C.elev }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${health}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full"
              style={{ background: health >= 75 ? C.emerald : health >= 50 ? C.gold : "#ef4444" }}
            />
          </div>
          <div className="mt-3 text-[10px] space-y-1" style={{ color: C.text3 }}>
            <div>· win rate {kpis.winRate}% (gate ≥25%)</div>
            <div>· weighted coverage {Math.round((kpis.weighted / Math.max(1, kpis.totalOpen)) * 100)}% (gate ≥40%)</div>
            <div>· {kpis.stallCount} stalled (gate 0)</div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="panel p-5 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} style={{ color: C.gold }} />
            <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.text2 }}>Average Deal Size</h3>
          </div>
          <div className="text-3xl font-bold" style={{ color: C.text }}>{formatCurrency(kpis.avgDeal)}</div>
          <p className="text-[10px] mt-1" style={{ color: C.text3 }}>
            {kpis.avgDeal >= 50000 ? "mid-market" : kpis.avgDeal >= 20000 ? "SMB" : "early-stage"} tier · {deals.length} deals avg'd
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Target size={12} style={{ color: C.text3 }} />
            <span className="text-[10px]" style={{ color: C.text3 }}>
              Verticals: {verticals.length} configured
            </span>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="panel p-5 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} style={{ color: C.gold }} />
            <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.text2 }}>Verticals</h3>
          </div>
          <div className="text-3xl font-bold" style={{ color: C.text }}>
            {verticals.length}<span className="text-xs opacity-50 ml-1">markets</span>
          </div>
          <p className="text-[10px] mt-1" style={{ color: C.text3 }}>
            Target ARR <span style={{ color: C.gold }}>{formatCurrency(verticals.reduce((s, v) => s + v.targetARR, 0))}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {verticals.slice(0, 6).map((v) => (
              <span
                key={v.id}
                className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: `${v.color}1a`, color: v.color }}
              >
                {v.name.split(" ")[0]}
              </span>
            ))}
            {verticals.length > 6 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: C.text3 }}>
                +{verticals.length - 6}
              </span>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── STAGE FUNNEL ──────────────────────────────────────────────── */}
      <motion.section {...fadeUp} className="panel p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers size={16} style={{ color: C.gold }} />
            <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.text2 }}>5-Stage Funnel · weighted</h3>
          </div>
          <span className="text-[10px]" style={{ color: C.textMute }}>
            weights: discovery 10% · qualified 25% · proposal 50% · negotiation 75% · closed 100%
          </span>
        </div>
        <div className="space-y-3">
          {stageBars.map((b, i) => {
            const meta = STAGE_META[b.stage];
            const stageDeals = deals.filter(d => d.stage === b.stage);
            return (
              <div key={b.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                    <span style={{ color: C.textMute }}>· {b.count} {b.count === 1 ? "deal" : "deals"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono" style={{ color: C.text }}>{formatCurrency(b.value)}</span>
                    <span style={{ color: C.textMute }}>
                      weighted {formatCurrency(Math.round(b.value * meta.weight))}
                    </span>
                  </div>
                </div>
                <div className="relative h-6 rounded-md overflow-hidden" style={{ background: C.elev }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${b.widthPct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 rounded-md flex items-center px-3"
                    style={{ background: `linear-gradient(90deg, ${meta.color}40, ${meta.color}80)`, borderRight: `2px solid ${meta.color}` }}
                  >
                    {stageDeals.slice(0, 3).map((d) => (
                      <span
                        key={d.id}
                        className="text-[9px] font-semibold mr-2 truncate max-w-[100px]"
                        style={{ color: C.text }}
                        title={d.clientName}
                      >
                        {d.clientName}
                      </span>
                    ))}
                    {stageDeals.length > 3 && (
                      <span className="text-[9px] font-mono" style={{ color: C.text3 }}>
                        +{stageDeals.length - 3}
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ── SOURCE BREAKDOWN + FILTERS ────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div {...fadeUp} className="panel p-5 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={16} style={{ color: C.gold }} />
            <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.text2 }}>Source Mix</h3>
          </div>
          {sourceBreakdown.length === 0 ? (
            <div className="text-xs py-8 text-center" style={{ color: C.textMute }}>No deals yet</div>
          ) : (
            <div className="space-y-2">
              {sourceBreakdown.map((s) => {
                const pct = (s.value / totalSourceValue) * 100;
                return (
                  <div key={s.source}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span style={{ color: C.text }}>{s.source}</span>
                      <span className="font-mono" style={{ color: C.text3 }}>
                        {s.count} · {formatCurrency(s.value)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.elev }}>
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, background: C.gold }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="panel p-5 md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Filter size={16} style={{ color: C.gold }} />
            <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.text2 }}>Filter &amp; Search</h3>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMute }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client, contact, source, notes…"
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border outline-none"
                style={{ background: C.elev, color: C.text, borderColor: C.border }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterStage("all")}
              className="px-3 py-1 rounded-md text-[11px] font-semibold border transition-all"
              style={{
                background: filterStage === "all" ? C.gold : C.elev,
                color: filterStage === "all" ? C.bg : C.text3,
                borderColor: filterStage === "all" ? C.gold : C.border,
              }}
            >
              All ({deals.length})
            </button>
            {STAGE_ORDER.map((s) => {
              const meta = STAGE_META[s];
              const count = summary?.stageCounts[s] ?? deals.filter(d => d.stage === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStage(s)}
                  className="px-3 py-1 rounded-md text-[11px] font-semibold border transition-all"
                  style={{
                    background: filterStage === s ? meta.color : C.elev,
                    color: filterStage === s ? C.bg : C.text3,
                    borderColor: filterStage === s ? meta.color : C.border,
                  }}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
          </div>
          <div className="text-[10px]" style={{ color: C.textMute }}>
            {filtered.length} {filtered.length === 1 ? "deal" : "deals"} shown · {formatCurrency(filtered.reduce((s, d) => s + d.dealValue, 0))} total
          </div>
        </motion.div>
      </section>

      {/* ── DEAL TABLE ────────────────────────────────────────────────── */}
      <motion.section {...fadeUp} className="panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: C.gold }} />
            <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.text2 }}>
              Deal Register {filterStage !== "all" && `· ${STAGE_META[filterStage].label}`}
            </h3>
          </div>
          <span className="text-[10px] font-mono" style={{ color: C.textMute }}>
            {filtered.length} / {deals.length} deals
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs" style={{ color: C.textMute }}>Loading pipeline…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs" style={{ color: C.textMute }}>
            No deals match the current filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: C.textMute, borderBottom: `1px solid ${C.border}` }}>
                  <th className="text-left py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Client</th>
                  <th className="text-left py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Contact</th>
                  <th className="text-right py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Value</th>
                  <th className="text-left py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Stage</th>
                  <th className="text-left py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Source</th>
                  <th className="text-right py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">Age</th>
                  <th className="text-right py-2 px-3 font-semibold uppercase tracking-wider text-[10px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const meta = STAGE_META[d.stage];
                  const age = daysSince(d.updatedAt);
                  const stalled = d.stage !== "closed" && age > 14;
                  return (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderBottom: `1px solid ${C.border}` }}
                      className="hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => setSelected(d)}
                    >
                      <td className="py-3 px-3 font-semibold" style={{ color: C.text }}>{d.clientName}</td>
                      <td className="py-3 px-3" style={{ color: C.text2 }}>{d.contact}</td>
                      <td className="py-3 px-3 text-right font-mono" style={{ color: C.gold }}>
                        {formatCurrency(d.dealValue)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: meta.ring, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3" style={{ color: C.text3 }}>{d.source}</td>
                      <td className="py-3 px-3 text-right font-mono" style={{ color: stalled ? "#ef4444" : C.text3 }}>
                        {age}d{stalled && " ⚠"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <ChevronRight size={14} style={{ color: C.textMute }} />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* ── VERTICAL TARGET ARR ───────────────────────────────────────── */}
      {verticals.length > 0 && (
        <motion.section {...fadeUp} className="panel p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Target size={16} style={{ color: C.gold }} />
            <h3 className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.text2 }}>Vertical Targets</h3>
            <span className="text-[10px] ml-auto" style={{ color: C.textMute }}>
              {verticals.length} markets · {formatCurrency(verticals.reduce((s, v) => s + v.targetARR, 0))} combined ARR target
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {verticals.map((v) => (
              <div
                key={v.id}
                className="rounded-xl p-3 border"
                style={{ background: C.bgMid, borderColor: C.border }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: v.color }}>
                    {v.name}
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: C.textMute }}>
                    {v.salesCycleDays}d cycle
                  </span>
                </div>
                <div className="text-lg font-bold" style={{ color: C.text }}>
                  {formatCurrency(v.targetARR)}
                </div>
                <div className="flex items-center justify-between text-[10px] mt-1" style={{ color: C.text3 }}>
                  <span>{v.clientCount} clients</span>
                  <span>{formatCurrency(v.avgDealSize)} avg</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── DEAL DETAIL MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{ background: C.card, borderColor: C.borderHot }}
            >
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: C.border }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: C.text }}>{selected.clientName}</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: C.text3 }}>
                    {selected.contact} · {selected.source}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/5">
                  <X size={18} style={{ color: C.text2 }} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest" style={{ color: C.textMute }}>Value</div>
                    <div className="text-xl font-bold font-mono" style={{ color: C.gold }}>
                      {formatCurrency(selected.dealValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-widest" style={{ color: C.textMute }}>Stage</div>
                    <div className="text-sm font-bold mt-1" style={{ color: STAGE_META[selected.stage].color }}>
                      {STAGE_META[selected.stage].label}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-widest" style={{ color: C.textMute }}>Weighted</div>
                    <div className="text-xl font-bold font-mono" style={{ color: C.emerald }}>
                      {formatCurrency(Math.round(selected.dealValue * STAGE_META[selected.stage].weight))}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Notes</div>
                  <div className="text-sm leading-relaxed rounded-lg p-3 border" style={{ background: C.bgMid, borderColor: C.border, color: C.text2 }}>
                    {selected.notes}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-lg p-3 border" style={{ background: C.bgMid, borderColor: C.border }}>
                    <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Created</div>
                    <div style={{ color: C.text }}>{formatDate(selected.createdAt)} ({daysSince(selected.createdAt)}d ago)</div>
                  </div>
                  <div className="rounded-lg p-3 border" style={{ background: C.bgMid, borderColor: C.border }}>
                    <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Last Update</div>
                    <div style={{ color: C.text }}>{formatDate(selected.updatedAt)} ({daysSince(selected.updatedAt)}d ago)</div>
                  </div>
                </div>
                <div className="rounded-lg p-3 border text-[11px]" style={{ background: C.bgMid, borderColor: C.border }}>
                  <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: C.textMute }}>Stage Funnel</div>
                  <div className="flex items-center gap-1">
                    {STAGE_ORDER.map((s, i) => {
                      const reached = STAGE_ORDER.indexOf(selected.stage) >= i;
                      return (
                        <div key={s} className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              background: reached ? STAGE_META[s].color : C.elev,
                              border: `1px solid ${STAGE_META[s].color}`,
                            }}
                          />
                          {i < STAGE_ORDER.length - 1 && (
                            <div className="w-6 h-0.5" style={{ background: reached ? STAGE_META[s].color : C.elev }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-[10px]" style={{ color: C.text3 }}>
                    {STAGE_META[selected.stage].label} · {(STAGE_META[selected.stage].weight * 100).toFixed(0)}% weighted
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="text-[10px] text-center pt-4" style={{ color: C.textMute }}>
        sources: <code style={{ color: C.goldSoft }}>/api/agency/pipeline-deals</code> ·{" "}
        <code style={{ color: C.goldSoft }}>/api/agency/pipeline</code> · auto-refresh 60s · doctrine: ProofPacket or it didn't happen
      </footer>
    </div>
  );
}
