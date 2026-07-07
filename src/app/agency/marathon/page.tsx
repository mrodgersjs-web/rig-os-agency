"use client";

// ── RIG OS Agency — Marathon Mission Control ──────────────────────────────
// Real command surface for the 1000x marathon. Wires:
//   /api/agency/turn          — live turn counter, target, proofs
//   /api/agency/health        — pipeline KPIs (clients, deals, prospects, pages)
//   /api/agency/decisions     — recent decision-ledger rows w/ outcomes
//   /api/agency/forecast      — channel calibration summary
//
// Shows: turn ring (turn N of 1000), 6-tile KPI strip, recent proofs,
// per-cycle activity feed, calibration progress, doctrine footer.
// Auto-refresh 30s. Midnight Aubergine theme.
//
// Routes:
//   /agency/marathon           — this surface
//   /api/agency/turn           — turn count + proofs
//   /api/agency/health         — pipeline counts
//   /api/agency/decisions      — outcome-ledger rows
//   /api/agency/forecast       — channel Brier

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Anchor, Award, BarChart3, Boxes, Brain, CheckCircle2,
  ChevronRight, Clock, Cpu, Database, DollarSign, FileText, Filter,
  Flame, Gauge, Hash, Hash as HashIcon, Layers, Loader2, Mail,
  Network, Radio, RefreshCw, Rocket, Search, Send, Settings, Shield,
  Sparkles, Target, TrendingUp, Users, Wand2, Zap, AlertTriangle,
  Building2, GitBranch, Calendar, Eye, Trophy, Sigma, ArrowUpRight,
  Hash as Hash2,
} from "lucide-react";

const C = {
  bg:        "var(--bg-deep)",
  bgMid:     "var(--bg-mid)",
  card:      "var(--bg-card)",
  elev:      "var(--bg-elev)",
  text:      "var(--cream)",
  text2:     "var(--cream-soft)",
  text3:     "var(--cream-dim)",
  textMute:  "var(--cream-mute)",
  border:    "var(--line-soft)",
  borderHot: "var(--line)",
  gold:      "var(--gold)",
  goldSoft:  "var(--gold-soft)",
  goldDeep:  "var(--gold-deep)",
  emerald:   "var(--emerald)",
  emeraldDim:"var(--emerald-dim)",
  plum:      "var(--plum)",
  rust:      "var(--rust)",
  blue:      "#60a5fa",
  cyan:      "#22d3ee",
};

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

/* ── Types ────────────────────────────────────────────────────────────────── */

interface TurnResponse {
  turn: number;
  target: number;
  remaining: number;
  progress: number;
  turnFile: string;
  lastProof: string | null;
  proofCount: number;
  counters: Record<string, any> | null;
  real: boolean;
  timestamp: string;
}

interface HealthResponse {
  status: string;
  app: string;
  version: string;
  uptime_seconds: number;
  environment: string;
  port: string;
  latency_ms: number;
  checks: Record<string, string>;
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

interface DecisionRow {
  id: string;
  kind?: string;
  channel?: string;
  predictedP?: number;
  actualOutcome?: number | null;
  brier?: number;
  ts?: string;
  notes?: string;
}

interface DecisionsResponse {
  ok: boolean;
  rows?: DecisionRow[];
  counts?: {
    total: number;
    withOutcomes: number;
    returned: number;
    channels: Record<string, number>;
    kinds: Record<string, number>;
  };
}

interface ChannelRow {
  channel: string;
  n: number;
  replies: number;
  observedReplyRate: number;
  brier: number;
  status: "insufficient" | "calibrating" | "calibrated";
  updatedAt: string;
}

interface ForecastResponse {
  ok: boolean;
  report?: { channels: ChannelRow[]; totalObserved: number; anyCalibrated: boolean };
  ledgerCounts?: { total: number; withReplyOutcome: number };
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function fmtNum(n: number | null | undefined, fallback = "—", digits = 0): string {
  if (n == null || !Number.isFinite(n)) return fallback;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtPct(p: number | null | undefined, digits = 1): string {
  if (p == null || !Number.isFinite(p)) return "—";
  return `${(p * 100).toFixed(digits)}%`;
}

function fmtDuration(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const delta = (Date.now() - t) / 1000;
  if (delta < 60) return `${Math.floor(delta)}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

/* ── Ring Progress (Turn N of 1000) ──────────────────────────────────────── */

function TurnRing({ turn, target }: { turn: number; target: number }) {
  const progress = Math.min(1, turn / target);
  const size = 220;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * progress;
  const rest = c - dash;
  // Tier markers at 25/50/75%
  const tierAngles = [0.25, 0.5, 0.75].map((p) => p * 2 * Math.PI);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="turnGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.gold} />
            <stop offset="50%" stopColor={C.goldSoft} />
            <stop offset="100%" stopColor={C.emerald} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(243, 235, 218, 0.06)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="url(#turnGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {/* Tier markers */}
        {tierAngles.map((a, i) => {
          const x1 = size / 2 + r * Math.cos(a);
          const y1 = size / 2 + r * Math.sin(a);
          const x2 = size / 2 + (r + stroke / 2 + 2) * Math.cos(a);
          const y2 = size / 2 + (r + stroke / 2 + 2) * Math.sin(a);
          return (
            <line
              key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(243, 235, 218, 0.15)" strokeWidth={1}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase tracking-widest" style={{ color: C.textMute }}>
          Turn
        </div>
        <div className="text-5xl font-semibold tabular-nums" style={{ color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {turn.toLocaleString()}
        </div>
        <div className="text-[11px] mt-1" style={{ color: C.text3 }}>
          of {target.toLocaleString()} · {(progress * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

/* ── KPI Tile ─────────────────────────────────────────────────────────────── */

function KpiTile({
  label, value, sub, icon: Icon, color, bg, onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  color: string;
  bg: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      variants={fadeUp}
      onClick={onClick}
      className="text-left rounded-xl border p-4 transition hover:scale-[1.01] active:scale-[0.99]"
      style={{ background: C.card, borderColor: C.border }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textMute }}>{label}</span>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ background: bg, color }}
        >
          <Icon size={13} />
        </div>
      </div>
      <div className="text-[22px] tracking-tight tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: C.text, fontWeight: 600 }}>
        {value}
      </div>
      {sub && <div className="text-[10px] mt-1" style={{ color: C.textMute }}>{sub}</div>}
    </motion.button>
  );
}

/* ── Proof Row ────────────────────────────────────────────────────────────── */

function ProofRow({ name, idx }: { name: string; idx: number }) {
  const turnMatch = name.match(/turn-(\d+)/);
  const turnNum = turnMatch ? parseInt(turnMatch[1], 10) : null;
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-md border"
      style={{ background: C.card, borderColor: C.border }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ background: "rgba(212, 165, 116, 0.10)", color: C.gold }}
      >
        <Shield size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] truncate font-mono" style={{ color: C.text2 }}>
          {name}
        </div>
        <div className="text-[10px]" style={{ color: C.textMute }}>
          sha256 sealed · {turnNum ? `turn ${turnNum}` : "proof artifact"}
        </div>
      </div>
      <CheckCircle2 size={12} style={{ color: C.emerald }} />
    </div>
  );
}

/* ── Decision Row ─────────────────────────────────────────────────────────── */

function DecisionRow({ row }: { row: DecisionRow }) {
  const hasOutcome = row.actualOutcome != null;
  const predicted = row.predictedP;
  const actual = row.actualOutcome;
  const lift = hasOutcome && predicted != null ? (actual as number) - predicted : null;
  const liftColor = lift == null ? C.textMute : lift > 0.05 ? C.emerald : lift < -0.05 ? C.plum : C.gold;
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-md border"
      style={{ background: C.card, borderColor: C.border }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{
          background: hasOutcome ? "rgba(90, 184, 150, 0.10)" : "rgba(255, 255, 255, 0.04)",
          color: hasOutcome ? C.emerald : C.textMute,
        }}
      >
        {hasOutcome ? <CheckCircle2 size={12} /> : <Clock size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] truncate" style={{ color: C.text2 }}>
          <span className="font-mono text-[11px]" style={{ color: C.textMute }}>
            {row.channel || "—"}
          </span>
          {" · "}
          <span>{row.kind || "decision"}</span>
        </div>
        <div className="text-[10px] tabular-nums" style={{ color: C.textMute }}>
          {timeAgo(row.ts)}
          {row.brier != null && ` · Brier ${row.brier.toFixed(3)}`}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[12px] tabular-nums" style={{ color: C.text }}>
          {predicted != null ? fmtPct(predicted, 0) : "—"}
        </div>
        {hasOutcome && (
          <div className="text-[10px] tabular-nums" style={{ color: liftColor }}>
            → {(actual as number) === 1 ? "1" : "0"}
            {lift != null && ` (${lift > 0 ? "+" : ""}${(lift * 100).toFixed(0)}%)`}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Channel Calibration Bar ──────────────────────────────────────────────── */

function ChannelBar({ channel }: { channel: ChannelRow }) {
  const stColor = channel.status === "calibrated" ? C.emerald : channel.status === "calibrating" ? C.gold : C.textMute;
  const brierColor = channel.brier < 0.15 ? C.emerald : channel.brier < 0.25 ? C.gold : C.rust;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-md border" style={{ background: C.card, borderColor: C.border }}>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] truncate font-mono" style={{ color: C.text2 }}>{channel.channel}</div>
        <div className="text-[10px] tabular-nums" style={{ color: C.textMute }}>
          n={channel.n} · {channel.replies} replies · {fmtPct(channel.observedReplyRate, 1)} obs
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[12px] tabular-nums" style={{ color: brierColor }}>
          {channel.brier.toFixed(3)}
        </div>
        <div className="text-[10px]" style={{ color: stColor }}>
          {channel.status}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */

export default function MarathonPage() {
  const [turn, setTurn] = useState<TurnResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [decisions, setDecisions] = useState<DecisionsResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [t, h, d, f] = await Promise.all([
        fetch("/api/agency/turn", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/agency/health", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/agency/decisions?limit=10", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/agency/forecast", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);
      setTurn(t);
      setHealth(h);
      setDecisions(d);
      setForecast(f);
      setLastRefresh(new Date());
    } catch {
      // keep prior
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(() => load(true), 30_000);
    return () => clearInterval(i);
  }, [load]);

  const currentTurn = turn?.turn ?? 0;
  const target = turn?.target ?? 1000;
  const progress = turn?.progress ?? 0;
  const remaining = turn?.remaining ?? 1000;
  const velocity = useMemo(() => {
    if (!turn?.timestamp || !turn?.turn) return null;
    // Approximate: each turn is ~1 cycle. We don't have a start time, so return null.
    return null;
  }, [turn]);

  const counts = health?.counts;
  const checks = health?.checks ?? {};
  const allChecksPass = Object.values(checks).every((c) => c === "ok");

  const decisionRows = decisions?.rows ?? [];
  const channels = forecast?.report?.channels ?? [];
  const calibratedCount = channels.filter((c) => c.status === "calibrated").length;
  const totalObserved = forecast?.report?.totalObserved ?? 0;

  // Compute doctrine progress: 5 cells = pipeline, GTM, revenue, ops, content
  const doctrineCells = [
    { name: "Pipeline", ok: (counts?.pipeline_deals ?? 0) > 0 },
    { name: "GTM",      ok: (counts?.gtm_prospects ?? 0) > 0 },
    { name: "Revenue",  ok: (counts?.invoices ?? 0) > 0 },
    { name: "Clients",  ok: (counts?.clients ?? 0) > 0 },
    { name: "Proposals",ok: (counts?.proposals ?? 0) > 0 },
    { name: "Contracts",ok: (counts?.contracts ?? 0) > 0 },
  ];
  const doctrineScore = doctrineCells.filter((c) => c.ok).length;

  // Proof hash list (just filenames we know about)
  const proofFiles = useMemo(() => {
    // We can fetch dynamic via a new endpoint, but for now show lastProof + count
    return turn?.lastProof ? [turn.lastProof] : [];
  }, [turn]);

  return (
    <div className="px-6 md:px-10 py-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <header className="mb-6">
        <div className="eyebrow mb-3">
          <span className="num">∞</span>
          <span className="line" />
          <span className="label">Marathon</span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Marathon Mission Control</h1>
            <p className="page-subtitle">
              Live 1000-turn improvement loop · ProofPacket-or-it-didn't-happen · self-improvement invariant
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-right" style={{ color: C.textMute }}>
              <div>Last refresh</div>
              <div className="tabular-nums" style={{ color: C.text3 }}>
                {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => load(true)}
              disabled={refreshing}
              className="panel px-3 py-2 flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              style={{ borderColor: C.border }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} style={{ color: C.gold }} />
              <span style={{ color: C.text }}>{refreshing ? "Syncing…" : "Refresh"}</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Health Truth Banner */}
      <motion.div
        variants={fadeUp} initial="initial" animate="animate"
        className="rounded-xl border p-3 mb-6 flex items-center gap-3"
        style={{
          background: allChecksPass ? "rgba(90, 184, 150, 0.06)" : "rgba(201, 124, 94, 0.06)",
          borderColor: allChecksPass ? "rgba(90, 184, 150, 0.20)" : "rgba(201, 124, 94, 0.20)",
        }}
      >
        {allChecksPass ? (
          <CheckCircle2 size={14} style={{ color: C.emerald }} />
        ) : (
          <AlertTriangle size={14} style={{ color: C.rust }} />
        )}
        <div className="flex-1 text-[12px]" style={{ color: C.text2 }}>
          <span style={{ color: C.text, fontWeight: 500 }}>System status:</span>{" "}
          {allChecksPass ? "All checks green" : "Some checks degraded"} ·
          <span className="ml-2 font-mono" style={{ color: C.text3 }}>
            {Object.entries(checks).map(([k, v]) => `${k}=${v}`).join(" · ")}
          </span>
        </div>
        <div className="text-[10px] tabular-nums shrink-0" style={{ color: C.textMute }}>
          uptime {fmtDuration(health?.uptime_seconds)} · {health?.latency_ms ?? 0}ms
        </div>
      </motion.div>

      {/* Hero: Turn Ring + Doctrine Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mb-6">
        {/* Turn Ring */}
        <motion.div
          variants={fadeUp} initial="initial" animate="animate"
          className="rounded-2xl border p-6 flex flex-col items-center"
          style={{ background: C.card, borderColor: C.border }}
        >
          <TurnRing turn={currentTurn} target={target} />
          <div className="mt-4 grid grid-cols-3 gap-2 w-full">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest" style={{ color: C.textMute }}>Done</div>
              <div className="text-[14px] tabular-nums" style={{ color: C.emerald }}>{currentTurn}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest" style={{ color: C.textMute }}>Remaining</div>
              <div className="text-[14px] tabular-nums" style={{ color: C.gold }}>{fmtNum(remaining)}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest" style={{ color: C.textMute }}>Proofs</div>
              <div className="text-[14px] tabular-nums" style={{ color: C.text }}>{turn?.proofCount ?? 0}</div>
            </div>
          </div>
        </motion.div>

        {/* Doctrine Progress + Mission */}
        <motion.div
          variants={fadeUp} initial="initial" animate="animate"
          className="rounded-2xl border p-6"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Award size={14} style={{ color: C.gold }} />
            <h2 className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: C.text }}>
              Doctrine Progress
            </h2>
            <span className="text-[10px] ml-auto tabular-nums" style={{ color: C.textMute }}>
              {doctrineScore}/{doctrineCells.length} cells live
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {doctrineCells.map((cell) => (
              <div
                key={cell.name}
                className="rounded-md border p-2.5"
                style={{
                  borderColor: cell.ok ? "rgba(90, 184, 150, 0.25)" : C.border,
                  background: cell.ok ? "rgba(90, 184, 150, 0.06)" : C.bgMid,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textMute }}>
                    {cell.name}
                  </span>
                  {cell.ok ? (
                    <CheckCircle2 size={11} style={{ color: C.emerald }} />
                  ) : (
                    <Clock size={11} style={{ color: C.textMute }} />
                  )}
                </div>
                <div className="text-[14px] tabular-nums" style={{ color: cell.ok ? C.text : C.text3 }}>
                  {cell.ok
                    ? (counts as any)?.[cell.name.toLowerCase() === "pipeline" ? "pipeline_deals" : cell.name.toLowerCase()] ?? 0
                    : "—"}
                </div>
              </div>
            ))}
          </div>

          {/* Mission statement */}
          <div className="rounded-lg p-3" style={{ background: "rgba(212, 165, 116, 0.06)", border: `1px solid rgba(212, 165, 116, 0.20)` }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.gold }}>
              Mission
            </div>
            <div className="text-[12px] leading-relaxed" style={{ color: C.text2 }}>
              Make RIG OS Agency <span style={{ color: C.gold, fontWeight: 500 }}>1000x better</span> for{" "}
              <span style={{ color: C.text, fontWeight: 500 }}>1000 turns</span> straight. Every turn picks the
              single highest-impact improvement, ships working code, and seals a ProofPacket. Self-improvement
              invariant: every session leaves the system stronger than it found it.
            </div>
          </div>
        </motion.div>
      </div>

      {/* KPI Strip — 6 tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiTile
          label="Clients"
          value={fmtNum(counts?.clients)}
          sub="active paying"
          icon={Building2}
          color={C.gold}
          bg="rgba(212, 165, 116, 0.10)"
        />
        <KpiTile
          label="Pipeline"
          value={fmtNum(counts?.pipeline_deals)}
          sub="open deals"
          icon={Target}
          color={C.emerald}
          bg="rgba(90, 184, 150, 0.10)"
        />
        <KpiTile
          label="Prospects"
          value={fmtNum(counts?.gtm_prospects)}
          sub="GTM Studio V2"
          icon={Users}
          color={C.blue}
          bg="rgba(96, 165, 250, 0.10)"
        />
        <KpiTile
          label="Proposals"
          value={fmtNum(counts?.proposals)}
          sub={`${counts?.contracts ?? 0} contracts`}
          icon={FileText}
          color={C.gold}
          bg="rgba(212, 165, 116, 0.10)"
        />
        <KpiTile
          label="Invoices"
          value={fmtNum(counts?.invoices)}
          sub="billing surface"
          icon={DollarSign}
          color={C.emerald}
          bg="rgba(90, 184, 150, 0.10)"
        />
        <KpiTile
          label="App Pages"
          value={fmtNum(counts?.app_pages)}
          sub={`v${health?.version ?? "1.0.0"}`}
          icon={Layers}
          color={C.plum}
          bg="rgba(196, 96, 126, 0.10)"
        />
      </div>

      {/* Tabs Surface */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="px-4 py-3 border-b flex items-center gap-4" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <HashIcon size={12} style={{ color: C.gold }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textMute }}>Live Surfaces</span>
          </div>
          <div className="text-[10px] tabular-nums" style={{ color: C.textMute }}>
            {turn?.real ? "turn file present" : "turn file missing"}
          </div>
          <div className="text-[10px] ml-auto" style={{ color: C.textMute }}>
            30s auto-refresh
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: C.border }}>
          {/* Proofs Column */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} style={{ color: C.gold }} />
              <h3 className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: C.text }}>
                Recent Proofs
              </h3>
              <span className="text-[10px] ml-auto tabular-nums" style={{ color: C.textMute }}>
                {turn?.proofCount ?? 0} sealed
              </span>
            </div>
            {proofFiles.length === 0 ? (
              <div className="rounded-lg border p-4 text-center" style={{ borderColor: C.border, background: C.bgMid }}>
                <Shield size={16} style={{ color: C.textMute }} className="mx-auto mb-1" />
                <div className="text-[11px]" style={{ color: C.text3 }}>No proof files yet</div>
                <div className="text-[10px] mt-1" style={{ color: C.textMute }}>
                  Run a turn with seal to record SHA256
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {proofFiles.map((p, i) => (
                  <ProofRow key={p} name={p} idx={i} />
                ))}
              </div>
            )}
            {turn?.lastProof && (
              <div className="mt-3 text-[10px] font-mono truncate" style={{ color: C.textMute }}>
                last: {turn.lastProof}
              </div>
            )}
          </div>

          {/* Recent Decisions Column */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} style={{ color: C.emerald }} />
              <h3 className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: C.text }}>
                Recent Decisions
              </h3>
              <span className="text-[10px] ml-auto tabular-nums" style={{ color: C.textMute }}>
                {decisions?.counts?.withOutcomes ?? 0} outcomes / {decisions?.counts?.total ?? 0} total
              </span>
            </div>
            {decisionRows.length === 0 ? (
              <div className="rounded-lg border p-4 text-center" style={{ borderColor: C.border, background: C.bgMid }}>
                <Brain size={16} style={{ color: C.textMute }} className="mx-auto mb-1" />
                <div className="text-[11px]" style={{ color: C.text3 }}>No decision-ledger rows</div>
                <div className="text-[10px] mt-1" style={{ color: C.textMute }}>
                  Plant predictions to populate
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {decisionRows.map((row) => (
                  <DecisionRow key={row.id} row={row} />
                ))}
              </div>
            )}
            {decisions?.counts && (
              <div className="mt-3 text-[10px] font-mono" style={{ color: C.textMute }}>
                {Object.entries(decisions.counts.channels).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(" · ")}
              </div>
            )}
          </div>

          {/* Channel Calibration Column */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sigma size={13} style={{ color: C.plum }} />
              <h3 className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: C.text }}>
                Channel Calibration
              </h3>
              <span className="text-[10px] ml-auto tabular-nums" style={{ color: C.textMute }}>
                {calibratedCount}/{channels.length} calibrated
              </span>
            </div>
            {channels.length === 0 ? (
              <div className="rounded-lg border p-4 text-center" style={{ borderColor: C.border, background: C.bgMid }}>
                <Sigma size={16} style={{ color: C.textMute }} className="mx-auto mb-1" />
                <div className="text-[11px]" style={{ color: C.text3 }}>No channel data</div>
                <div className="text-[10px] mt-1" style={{ color: C.textMute }}>
                  {totalObserved > 0 ? `${totalObserved} outcomes` : "Plant outcomes to begin calibration"}
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {channels.map((c) => (
                  <ChannelBar key={c.channel} channel={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Truth Layer Footer */}
      <motion.div
        variants={fadeUp} initial="initial" animate="animate"
        className="mt-6 rounded-xl border p-4"
        style={{ background: C.bgMid, borderColor: C.border }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Eye size={12} style={{ color: C.gold }} />
          <h3 className="text-[10px] uppercase tracking-widest" style={{ color: C.gold }}>
            Truth Layer
          </h3>
          <span className="text-[10px] ml-auto" style={{ color: C.textMute }}>
            What is real vs derived
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Real</div>
            <div style={{ color: C.text2 }} className="leading-relaxed">
              <span className="font-mono" style={{ color: C.emerald }}>marathon-turn.txt</span> turn counter ·
              <span className="font-mono" style={{ color: C.emerald }}> ~/.rig/state/marathon-proofs/</span> SHA256 proofs ·
              <span className="font-mono" style={{ color: C.emerald }}>decision-ledger.jsonl</span> outcomes ·
              <span className="font-mono" style={{ color: C.emerald }}>channel-stats.json</span> Brier
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Derived</div>
            <div style={{ color: C.text2 }} className="leading-relaxed">
              Progress % = turn / 1000 · Remaining = target − turn · Doctrine score = live cells / 6
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Not Measured</div>
            <div style={{ color: C.text2 }} className="leading-relaxed">
              Velocity (turns/sec) — needs a start-timestamp tracker · Loop tightness — needs a separate watchdog
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Doctrine</div>
            <div style={{ color: C.text2 }} className="leading-relaxed">
              "ProofPacket or it didn't happen" — every turn writes real code, ships a build, and seals a hash
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t flex items-center gap-3 text-[10px]" style={{ borderColor: C.border }}>
          <span style={{ color: C.textMute }}>sources:</span>
          <code style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace" }}>/api/agency/turn</code>
          <code style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace" }}>/api/agency/health</code>
          <code style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace" }}>/api/agency/decisions</code>
          <code style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace" }}>/api/agency/forecast</code>
          <span className="ml-auto tabular-nums" style={{ color: C.textMute }}>
            {turn?.timestamp ? new Date(turn.timestamp).toISOString() : "—"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
