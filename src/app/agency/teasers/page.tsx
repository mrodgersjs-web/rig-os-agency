"use client";

// ── RIG OS Agency — Strategy Teasers Command ────────────────────────────
// Real command surface for the 211+ GTM strategy teasers produced by
// RIG Prospect / RIG GTM Studio V2. Wires /api/agency/teasers for live
// teaser payloads, vertical breakdown, and campaign-level data.
//
// Routes:
//   /agency/teasers           — this surface
//   /api/agency/teasers       — supplies payload (211 teasers, 18 verticals)
//   /api/agency/health        — supplies counts

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, Mail, TrendingUp, Award, AlertCircle,
  Search, Filter, Building2, ChevronRight, BarChart3, X, ExternalLink,
  ArrowUpDown, ArrowDown, ArrowUp, Target, Zap, Eye, Copy, Send,
  Calendar, DollarSign, Hash, Activity, RefreshCw, Sparkles,
} from "lucide-react";

const C = {
  bg: "var(--bg-deep)", bgMid: "var(--bg-mid)", card: "var(--bg-card)",
  elev: "var(--bg-elev)", text: "var(--cream)", text2: "var(--cream-soft)",
  text3: "var(--cream-dim)", textMute: "var(--cream-mute)",
  border: "var(--line-soft)", borderHot: "var(--line)",
  gold: "var(--gold)", goldSoft: "var(--gold-soft)", goldDeep: "var(--gold-deep)",
  emerald: "var(--emerald)", emeraldDim: "var(--emerald-dim)",
  plum: "var(--plum)", rust: "var(--rust)",
  blue: "#60a5fa", cyan: "#22d3ee",
};

interface Teaser {
  id: string; slug: string; firm: string; vertical: string; industry?: string;
  title?: string; recommendationTitle?: string; recommendationScore?: number;
  recommendationTier?: string; status: string; estimatedValue: number;
  evidenceCount?: number; optionCount?: number; campaign?: string;
  recipient?: string | null; subject?: string | null;
  sentDate?: string | null; strategyPath?: string; generatedAt?: string;
}

interface VerticalStats { total: number; sent: number; }
interface CampaignStats { [k: string]: number; }
interface TeasersPayload {
  source?: string; clientsDir?: string; totalClientDirs?: number;
  totalWithStrategy?: number; total?: number; sent?: number; drafting?: number;
  replied?: number; meetings?: number; sendRate?: string; avgAntiGeneric?: number;
  pipelineValue?: number; verticalBreakdown?: Record<string, VerticalStats>;
  campaignBreakdown?: CampaignStats; sentWithoutStrategy?: string[];
  sentWithoutStrategyCount?: number; teasers?: Teaser[];
}

type SortKey = "score" | "value" | "firm" | "vertical" | "date";
type SortDir = "asc" | "desc";

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

const STATUSES = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "drafting", label: "Drafting" },
  { key: "replied", label: "Replied" },
  { key: "meeting", label: "Meeting" },
];

const statusColor = (s: string) => {
  if (s === "sent") return { bg: "rgba(90,184,150,0.15)", fg: C.emerald };
  if (s === "drafting") return { bg: "rgba(212,165,116,0.15)", fg: C.gold };
  if (s === "replied") return { bg: "rgba(96,165,250,0.15)", fg: C.blue };
  if (s === "meeting") return { bg: "rgba(196,96,126,0.15)", fg: C.plum };
  return { bg: "rgba(110,99,83,0.15)", fg: C.text3 };
};

const tierColor = (tier?: string, score?: number) => {
  // Use score if available to compute a tier
  const s = score ?? 0;
  if (tier === "S" || s >= 0.85) return { bg: "rgba(196,96,126,0.18)", fg: C.plum, label: "S" };
  if (tier === "A" || s >= 0.75) return { bg: "rgba(90,184,150,0.18)", fg: C.emerald, label: "A" };
  if (tier === "B" || s >= 0.65) return { bg: "rgba(212,165,116,0.18)", fg: C.gold, label: "B" };
  if (s >= 0.5) return { bg: "rgba(96,165,250,0.18)", fg: C.blue, label: "C" };
  return { bg: "rgba(110,99,83,0.18)", fg: C.text3, label: "—" };
};

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return iso; }
}

export default function TeasersPage() {
  const [data, setData] = useState<TeasersPayload | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVertical, setFilterVertical] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Teaser | null>(null);
  const [lastTick, setLastTick] = useState(Date.now());

  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/agency/teasers", { cache: "no-store" });
      const j = await r.json();
      setData(j);
      setLastTick(Date.now());
    } catch { /* keep prior */ }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    const id = setInterval(reload, 60_000);
    return () => clearInterval(id);
  }, [reload]);

  const teasers: Teaser[] = useMemo(() => data?.teasers || [], [data]);

  const verticals = useMemo(() => {
    const set = new Set<string>();
    teasers.forEach((t) => t.vertical && set.add(t.vertical));
    return Array.from(set).sort();
  }, [teasers]);

  const filtered = useMemo(() => {
    let arr = teasers.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterVertical !== "all" && t.vertical !== filterVertical) return false;
      if (search) {
        const q = search.toLowerCase();
        const hit =
          t.firm?.toLowerCase().includes(q) ||
          t.slug?.toLowerCase().includes(q) ||
          t.recipient?.toLowerCase().includes(q) ||
          t.subject?.toLowerCase().includes(q) ||
          t.recommendationTitle?.toLowerCase().includes(q) ||
          t.industry?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "score") {
        return ((a.recommendationScore ?? 0) - (b.recommendationScore ?? 0)) * dir;
      }
      if (sortKey === "value") {
        return ((a.estimatedValue ?? 0) - (b.estimatedValue ?? 0)) * dir;
      }
      if (sortKey === "firm") {
        return (a.firm || "").localeCompare(b.firm || "") * dir;
      }
      if (sortKey === "vertical") {
        return (a.vertical || "").localeCompare(b.vertical || "") * dir;
      }
      if (sortKey === "date") {
        const da = a.sentDate ? new Date(a.sentDate).getTime() : 0;
        const db = b.sentDate ? new Date(b.sentDate).getTime() : 0;
        return (da - db) * dir;
      }
      return 0;
    });
    return arr;
  }, [teasers, search, filterStatus, filterVertical, sortKey, sortDir]);

  const stats = useMemo(() => {
    const totalValue = filtered.reduce((s, t) => s + (t.estimatedValue || 0), 0);
    const sentValue = filtered.filter((t) => t.status === "sent").reduce((s, t) => s + (t.estimatedValue || 0), 0);
    const draftingValue = filtered.filter((t) => t.status === "drafting").reduce((s, t) => s + (t.estimatedValue || 0), 0);
    const avgScore = filtered.length
      ? (filtered.reduce((s, t) => s + (t.recommendationScore ?? 0), 0) / filtered.length)
      : 0;
    const highValueCount = filtered.filter((t) => (t.estimatedValue || 0) >= 100_000).length;
    return { totalValue, sentValue, draftingValue, avgScore, highValueCount };
  }, [filtered]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20" style={{ background: C.bg, minHeight: "50vh" }}>
        <div className="flex items-center gap-2 text-[13px]" style={{ color: C.textMute }}>
          <RefreshCw size={14} className="animate-spin" />
          Loading teasers…
        </div>
      </div>
    );
  }

  const sendRateNum = data.sendRate ? parseFloat(data.sendRate) : 0;
  const ringRadius = 28;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - sendRateNum / 100);

  const verticalBreakdown = data.verticalBreakdown || {};
  const topVerticals = (Object.entries(verticalBreakdown) as [string, VerticalStats][])
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 12);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
      {/* Header */}
      <motion.div {...fadeUp} className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-lg" style={{ background: "rgba(212,165,116,0.15)" }}>
            <Sparkles size={20} style={{ color: C.gold }} />
          </div>
          <div>
            <h1 className="text-[26px] font-bold leading-none" style={{ color: C.text }}>
              Strategy Teasers Command
            </h1>
            <p className="text-[12px] mt-1" style={{ color: C.textMute }}>
              {data.source || "Real GTM prospect teaser pipeline"} · {data.totalClientDirs ?? "—"} dirs scanned · {data.totalWithStrategy ?? data.total ?? 0} strategies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] tabular-nums" style={{ color: C.textMute }}>
          <Activity size={11} />
          <span>refreshed {new Date(lastTick).toLocaleTimeString()}</span>
        </div>
      </motion.div>

      {/* Sent-without-strategy warning banner */}
      {data.sentWithoutStrategy && data.sentWithoutStrategy.length > 0 && (
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.05 }}
          className="rounded-lg p-3 mb-5 border flex items-start gap-2"
          style={{ borderColor: C.rust, background: "rgba(196,96,126,0.08)" }}
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: C.plum }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold mb-0.5" style={{ color: C.plum }}>
              {data.sentWithoutStrategyCount ?? data.sentWithoutStrategy.length} companies sent emails but missing strategy.generated.json
            </p>
            <p className="text-[11px] truncate" style={{ color: C.text2 }}>
              {data.sentWithoutStrategy.slice(0, 8).join(", ")}
              {data.sentWithoutStrategy.length > 8 ? `, +${data.sentWithoutStrategy.length - 8} more` : ""}
            </p>
          </div>
        </motion.div>
      )}

      {/* KPI Strip + Health Ring */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: "Strategies", value: data.totalWithStrategy ?? data.total ?? 0, icon: FileText, color: C.gold, bg: "rgba(212,165,116,0.15)" },
          { label: "Sent", value: data.sent ?? 0, icon: CheckCircle2, color: C.emerald, bg: "rgba(90,184,150,0.15)" },
          { label: "Drafting", value: data.drafting ?? 0, icon: AlertCircle, color: C.gold, bg: "rgba(212,165,116,0.15)" },
          { label: "Send Rate", value: data.sendRate ?? "—", icon: TrendingUp, color: C.blue, bg: "rgba(96,165,250,0.15)" },
          { label: "Avg Score", value: `${data.avgAntiGeneric ?? 0}/100`, icon: Award, color: C.plum, bg: "rgba(196,96,126,0.15)" },
          { label: "Pipeline", value: fmt$(data.pipelineValue ?? 0), icon: DollarSign, color: C.emerald, bg: "rgba(90,184,150,0.15)" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            {...fadeUp}
            transition={{ delay: 0.06 + i * 0.03 }}
            className="rounded-xl p-3.5 border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="grid place-items-center w-7 h-7 rounded-md mb-2" style={{ background: s.bg }}>
              <s.icon size={13} style={{ color: s.color }} />
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.textMute }}>{s.label}</div>
            <div className="text-[18px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Vertical Health Grid + Send-Rate Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Vertical breakdown */}
        <div className="lg:col-span-2 rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 size={14} style={{ color: C.gold }} />
              <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>Vertical Health</h2>
            </div>
            <span className="text-[10px] tabular-nums" style={{ color: C.textMute }}>
              {topVerticals.length} of {Object.keys(verticalBreakdown).length} verticals
            </span>
          </div>
          <div className="space-y-2">
            {topVerticals.map(([vert, st], i) => {
              const pct = st.total > 0 ? (st.sent / st.total) * 100 : 0;
              return (
                <motion.button
                  key={vert}
                  {...fadeUp}
                  transition={{ delay: 0.04 + i * 0.015 }}
                  onClick={() => setFilterVertical(filterVertical === vert ? "all" : vert)}
                  className="w-full text-left flex items-center gap-2 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium truncate" style={{ color: filterVertical === vert ? C.gold : C.text }}>
                        {vert}
                      </span>
                      <span className="text-[10px] tabular-nums shrink-0 ml-2" style={{ color: C.textMute }}>
                        {st.sent}/{st.total} <span style={{ color: pct >= 50 ? C.emerald : pct > 0 ? C.gold : C.textMute }}>({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 1)}%` }}
                        transition={{ delay: 0.1 + i * 0.015, duration: 0.4 }}
                        className="h-full rounded-full"
                        style={{ background: pct >= 50 ? C.emerald : pct > 0 ? C.gold : C.textMute }}
                      />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Send-Rate Ring + Campaign Breakdown */}
        <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} style={{ color: C.gold }} />
            <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>Send Rate</h2>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <motion.circle
                  cx="42" cy="42" r={ringRadius}
                  fill="none"
                  stroke={sendRateNum >= 50 ? C.emerald : sendRateNum >= 20 ? C.gold : C.plum}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 42 42)"
                  initial={{ strokeDashoffset: ringCirc }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 0.8 }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-[16px] font-bold tabular-nums" style={{ color: C.text }}>
                  {data.sendRate ?? "—"}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px]" style={{ color: C.text2 }}>
                <span className="font-semibold" style={{ color: C.emerald }}>{data.sent ?? 0}</span> sent of <span style={{ color: C.text }}>{data.totalWithStrategy ?? data.total ?? 0}</span> strategies
              </p>
              <p className="text-[10px] mt-1" style={{ color: C.textMute }}>
                Avg anti-generic <span className="font-semibold" style={{ color: C.gold }}>{data.avgAntiGeneric ?? 0}/100</span>
              </p>
            </div>
          </div>

          {/* Campaign breakdown */}
          {data.campaignBreakdown && Object.keys(data.campaignBreakdown).length > 0 && (
            <>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.textMute }}>
                Campaigns
              </div>
              <div className="space-y-1.5">
                {Object.entries(data.campaignBreakdown).map(([c, n]: [string, number]) => (
                  <div key={c} className="flex items-center gap-2 text-[11px]">
                    <Zap size={10} style={{ color: C.gold }} />
                    <span className="flex-1 truncate" style={{ color: C.text2 }}>{c}</span>
                    <span className="tabular-nums font-semibold" style={{ color: C.gold }}>{n}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl p-3 border mb-4 flex flex-wrap items-center gap-3" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search size={13} style={{ color: C.textMute }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search firm, recipient, subject, slug…"
            className="flex-1 px-2 py-1.5 rounded-md border text-[12px] outline-none"
            style={{ borderColor: C.border, background: C.bg, color: C.text }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUSES.map((s) => {
            const active = filterStatus === s.key;
            const sc = statusColor(s.key);
            return (
              <button
                key={s.key}
                onClick={() => setFilterStatus(s.key)}
                className="px-2 py-1 rounded-md text-[11px] font-medium transition border"
                style={{
                  background: active ? sc.bg : "transparent",
                  borderColor: active ? sc.fg : C.border,
                  color: active ? sc.fg : C.text2,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: C.textMute }} />
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="px-2 py-1.5 rounded-md border text-[12px] outline-none max-w-[180px]"
            style={{ borderColor: C.border, background: C.bg, color: C.text }}
          >
            <option value="all">All verticals</option>
            {verticals.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="text-[11px] tabular-nums" style={{ color: C.textMute }}>
          <span style={{ color: C.gold }}>{filtered.length}</span> / {teasers.length} · {fmt$(stats.totalValue)} est.
          {stats.highValueCount > 0 && (
            <span className="ml-1" style={{ color: C.emerald }}>· {stats.highValueCount} ≥ $100K</span>
          )}
        </div>
      </div>

      {/* Teaser Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div
          className="grid gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b"
          style={{
            gridTemplateColumns: "32px 1.4fr 1.4fr 1fr 70px 80px 90px 90px",
            borderColor: C.border, color: C.textMute, background: "rgba(255,255,255,0.02)",
          }}
        >
          <div>#</div>
          <div>Firm / Recommendation</div>
          <div>Recipient · Subject</div>
          <div>Vertical</div>
          <SortHeader label="Score" k="score" sortKey={sortKey} sortDir={sortDir} onSort={setSortKey} onDir={setSortDir} />
          <SortHeader label="$ Est." k="value" sortKey={sortKey} sortDir={sortDir} onSort={setSortKey} onDir={setSortDir} align="right" />
          <SortHeader label="Sent" k="date" sortKey={sortKey} sortDir={sortDir} onSort={setSortKey} onDir={setSortDir} />
          <div className="text-right">Status</div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-[12px]" style={{ color: C.textMute }}>
            No teasers match your filters.
          </div>
        ) : (
          filtered.slice(0, 200).map((t, i) => {
            const sc = statusColor(t.status);
            const tc = tierColor(t.recommendationTier, t.recommendationScore);
            return (
              <motion.button
                key={t.id}
                onClick={() => setSelected(t)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.005, 0.3) }}
                className="w-full grid gap-3 px-4 py-2.5 items-center border-b text-left transition"
                style={{
                  gridTemplateColumns: "32px 1.4fr 1.4fr 1fr 70px 80px 90px 90px",
                  borderColor: C.border,
                  background: selected?.id === t.id ? "rgba(212,165,116,0.06)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (selected?.id !== t.id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  if (selected?.id !== t.id) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <div className="text-[10px] tabular-nums" style={{ color: C.textMute }}>{i + 1}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium truncate" style={{ color: C.text }}>{t.firm}</span>
                    <span
                      className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0"
                      style={{ background: tc.bg, color: tc.fg }}
                    >
                      {tc.label}
                    </span>
                  </div>
                  <div className="text-[10px] truncate mt-0.5" style={{ color: C.text2 }}>
                    {t.recommendationTitle || t.title || "—"}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] truncate" style={{ color: C.text2 }}>{t.recipient || "—"}</div>
                  <div className="text-[10px] truncate italic" style={{ color: C.textMute }}>
                    {t.subject || "—"}
                  </div>
                </div>
                <div className="text-[10px] truncate" style={{ color: C.text3 }}>{t.vertical || "—"}</div>
                <div className="text-[12px] font-semibold tabular-nums" style={{ color: C.gold }}>
                  {t.recommendationScore != null ? t.recommendationScore.toFixed(2) : "—"}
                </div>
                <div className="text-[12px] font-semibold tabular-nums text-right" style={{ color: (t.estimatedValue || 0) >= 100_000 ? C.emerald : C.text2 }}>
                  {fmt$(t.estimatedValue || 0)}
                </div>
                <div className="text-[10px] tabular-nums" style={{ color: C.text2 }}>{fmtDate(t.sentDate)}</div>
                <div className="text-right">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                    style={{ background: sc.bg, color: sc.fg }}
                  >
                    {t.status}
                  </span>
                </div>
              </motion.button>
            );
          })
        )}
        {filtered.length > 200 && (
          <div className="text-center py-3 text-[10px]" style={{ color: C.textMute }}>
            Showing first 200 of {filtered.length} · refine filters to see more
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 grid place-items-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl border max-w-2xl w-full max-h-[88vh] overflow-y-auto"
              style={{ background: C.card, borderColor: C.borderHot }}
            >
              {/* Modal header */}
              <div className="px-5 py-4 border-b flex items-start justify-between gap-3" style={{ borderColor: C.border }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[16px] font-bold" style={{ color: C.text }}>{selected.firm}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: tierColor(selected.recommendationTier, selected.recommendationScore).bg,
                        color: tierColor(selected.recommendationTier, selected.recommendationScore).fg,
                      }}
                    >
                      Tier {tierColor(selected.recommendationTier, selected.recommendationScore).label}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                      style={{
                        background: statusColor(selected.status).bg,
                        color: statusColor(selected.status).fg,
                      }}
                    >
                      {selected.status}
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: C.text2 }}>
                    {selected.vertical || selected.industry || "—"} · {selected.slug}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="grid place-items-center w-7 h-7 rounded-md shrink-0 transition"
                  style={{ background: "rgba(255,255,255,0.04)", color: C.textMute }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-5 py-4 space-y-4">
                {/* Recommendation */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: C.textMute }}>Recommendation</div>
                  <div className="text-[14px] font-semibold" style={{ color: C.gold }}>
                    {selected.recommendationTitle || selected.title || "—"}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span style={{ color: C.text2 }}>
                      Score: <span className="font-semibold tabular-nums" style={{ color: C.gold }}>
                        {selected.recommendationScore != null ? selected.recommendationScore.toFixed(4) : "—"}
                      </span>
                    </span>
                    <span style={{ color: C.text2 }}>
                      Est. Value: <span className="font-semibold tabular-nums" style={{ color: C.emerald }}>
                        {fmt$(selected.estimatedValue || 0)}
                      </span>
                    </span>
                    {(selected.evidenceCount != null && selected.evidenceCount > 0) && (
                      <span style={{ color: C.text2 }}>
                        Evidence: <span className="font-semibold tabular-nums" style={{ color: C.text }}>{selected.evidenceCount}</span>
                      </span>
                    )}
                    {(selected.optionCount != null && selected.optionCount > 0) && (
                      <span style={{ color: C.text2 }}>
                        Options: <span className="font-semibold tabular-nums" style={{ color: C.text }}>{selected.optionCount}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Recipient & Subject */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3 border" style={{ background: C.bg, borderColor: C.border }}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: C.textMute }}>Recipient</div>
                    <div className="text-[12px] font-mono" style={{ color: C.text }}>{selected.recipient || "—"}</div>
                  </div>
                  <div className="rounded-lg p-3 border" style={{ background: C.bg, borderColor: C.border }}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: C.textMute }}>Sent</div>
                    <div className="text-[12px] tabular-nums" style={{ color: C.text }}>{fmtDate(selected.sentDate)}</div>
                    {selected.campaign && (
                      <div className="text-[10px] mt-0.5" style={{ color: C.textMute }}>{selected.campaign}</div>
                    )}
                  </div>
                </div>

                {selected.subject && (
                  <div className="rounded-lg p-3 border" style={{ background: C.bg, borderColor: C.border }}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: C.textMute }}>Subject Line</div>
                    <div className="text-[12px] italic" style={{ color: C.text2 }}>"{selected.subject}"</div>
                  </div>
                )}

                {/* Strategy Path */}
                {selected.strategyPath && (
                  <div className="rounded-lg p-3 border" style={{ background: C.bg, borderColor: C.border }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.textMute }}>Strategy Path</div>
                      <button
                        onClick={() => navigator.clipboard?.writeText(selected.strategyPath || "")}
                        className="text-[10px] flex items-center gap-1 transition"
                        style={{ color: C.gold }}
                      >
                        <Copy size={9} /> copy
                      </button>
                    </div>
                    <code className="text-[11px] font-mono block break-all" style={{ color: C.text2 }}>
                      {selected.strategyPath}
                    </code>
                    {selected.generatedAt && (
                      <div className="text-[10px] mt-1.5 tabular-nums" style={{ color: C.textMute }}>
                        Generated {fmtDate(selected.generatedAt)}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`/agency/recall`}
                    className="px-3 py-2 rounded-md border text-[11px] font-medium text-center transition flex items-center justify-center gap-1.5"
                    style={{ borderColor: C.border, color: C.text2, background: "rgba(255,255,255,0.02)" }}
                  >
                    <Eye size={11} /> Open in Recall
                  </a>
                  <a
                    href={`/agency/pipeline?firm=${encodeURIComponent(selected.firm)}`}
                    className="px-3 py-2 rounded-md border text-[11px] font-medium text-center transition flex items-center justify-center gap-1.5"
                    style={{ borderColor: C.border, color: C.text2, background: "rgba(255,255,255,0.02)" }}
                  >
                    <ExternalLink size={11} /> View Pipeline
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doctrine Footer */}
      <div className="mt-8 pt-4 border-t flex items-center justify-between text-[10px]" style={{ borderColor: C.border, color: C.textMute }}>
        <span>RIG OS Agency · Strategy Teasers Command · {data.teasers?.length ?? 0} records · doctrine: ProofPacket or it didn't happen</span>
        <span>60s auto-refresh · click row for detail</span>
      </div>
    </div>
  );
}

function SortHeader({
  label, k, sortKey, sortDir, onSort, onDir, align = "left",
}: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void; onDir: (d: SortDir) => void; align?: "left" | "right";
}) {
  const active = sortKey === k;
  return (
    <button
      onClick={() => {
        if (sortKey === k) onDir(sortDir === "asc" ? "desc" : "asc");
        else { onSort(k); onDir("desc"); }
      }}
      className={`flex items-center gap-1 transition ${align === "right" ? "justify-end" : ""}`}
      style={{ color: active ? C.gold : C.textMute }}
    >
      {label}
      {active ? (sortDir === "asc" ? <ArrowUp size={9} /> : <ArrowDown size={9} />) : <ArrowUpDown size={9} style={{ opacity: 0.4 }} />}
    </button>
  );
}
