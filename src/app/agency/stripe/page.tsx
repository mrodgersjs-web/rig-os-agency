// src/app/agency/stripe/page.tsx
// ── RIG OS Agency — Stripe Revenue Command Center ────────────────────────
// Surfaces /api/agency/stripe-stats (live account + RIG invoices/clients
// reconciled) plus the legacy /api/agency/stripe (readiness checklist).
// Midnight Aubergine design. Doctrine: every number audit-tagged; truth
// banners when live Stripe data is sandbox.
//
// Tabs:
//   1. Overview — KPIs, ARR ring, revenue trend, sources
//   2. Readiness — go-live gauge + 10-step checklist + blockers
//   3. Customers — full client list sorted by ARR with lifetime paid
//   4. Charges — recent invoices/charges stream with status pills
//   5. Tiers — tier + vertical breakdown cards with bars

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, AlertCircle, CheckCircle2, ArrowRight, DollarSign,
  TrendingUp, Target, Zap, Building2, Lock, Rocket, Activity,
  Crown, Box, Users, FileCheck, ShieldCheck, Sparkles,
  ChevronDown, ChevronRight, RefreshCw, ExternalLink, AlertTriangle,
  Eye, Banknote, Receipt, Briefcase, Award, Clock, Sigma,
  ArrowUpRight, ArrowDownRight,
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

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

type Tone = "ok" | "warn" | "danger" | "muted";

interface Charge {
  id: string;
  number: string;
  client: string;
  clientId: string | null;
  amount: number;
  currency: string;
  status: string;
  statusTone: Tone;
  issuedAt: string | null;
  paidAt: string | null;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  vertical: string;
  tier: string;
  status: string;
  statusTone: Tone;
  monthlyFee: number;
  annualFee: number;
  lifetimePaid: number;
  createdAt: string | null;
}

interface TrendRow { month: string; revenue: number; count: number; }

interface TierRow { id: string; label: string; count: number; arr: number; }
interface VerticalRow { id: string; label: string; count: number; arr: number; }

interface RevenueSource {
  id: string;
  label: string;
  amount: number;
  count: number;
  type: string;
}

interface Requirement {
  id: string;
  label: string;
  description: string;
  status: "done" | "pending";
  critical: boolean;
}

interface StripeStatsPayload {
  _real: boolean;
  _sources: string[];
  _generatedAt: string;
  _latencyMs: number;
  mode: string;
  isLive: boolean;
  account: {
    id: string;
    business_name: string;
    email: string;
    country: string;
    default_currency: string;
    charges_enabled: boolean;
    details_submitted: boolean;
    payouts_enabled: boolean;
  };
  smoke: { customer_exists: boolean; product_exists: boolean; price_exists: boolean; } | null;
  catalog: any;
  kpis: {
    mrr: number;
    arr: number;
    targetArr: number;
    arrGap: number;
    arrProgress: number;
    activeClients: number;
    totalClients: number;
    paidInvoices: number;
    totalInvoices: number;
    failedPayments: number;
    outstandingInvoices: number;
    lifetimeRevenue: number;
    sentProposals: number;
    acceptedProposals: number;
    activeContracts: number;
  };
  trend: TrendRow[];
  recentCharges: Charge[];
  customers: Customer[];
  tierBreakdown: TierRow[];
  verticalBreakdown: VerticalRow[];
  revenueSources: RevenueSource[];
  liveRequirements: Requirement[];
  readiness: {
    completed: number;
    total: number;
    percent: number;
    label: string;
  };
  summary: string;
}

function fmtUSD(n: number, opts?: { compact?: boolean; decimals?: number }): string {
  if (!isFinite(n)) return "$0";
  const compact = opts?.compact ?? true;
  const decimals = opts?.decimals;
  if (compact) {
    if (Math.abs(n) >= 10_000_000)
      return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000_000)
      return `$${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000)
      return `$${(n / 1_000).toFixed(decimals ?? 1)}K`;
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

function pctOf(a: number, b: number): string {
  if (!b) return "0%";
  return `${Math.min(100, Math.round((a / b) * 100))}%`;
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

function TierPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const colors =
    tone === "ok" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
    tone === "warn" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
    tone === "danger" ? "bg-rose-500/15 text-rose-300 border-rose-500/30" :
    "bg-white/5 text-white/60 border-white/10";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md border ${colors} uppercase tracking-wider font-semibold`}>
      {children}
    </span>
  );
}

/* ── Tier Accent Helper ─────────────────────────────────────────────────── */
const TIER_ACCENTS: Record<string, string> = {
  starter: C.cyan,
  growth: C.gold,
  scale: C.violet,
  enterprise: C.emerald,
  sovereign: C.rust,
};

function accentFor(id: string): string {
  return TIER_ACCENTS[id] || C.gold;
}

/* ── Visual Components ─────────────────────────────────────────────────── */
function ArrRing({ progress, arr, target }: { progress: number; arr: number; target: number; }) {
  const r = 86;
  const C_ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, progress));
  const arc = C_ * (p / 100);

  return (
    <div className="relative inline-grid place-items-center">
      <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="110" cy="110" r={r} fill="none" stroke={C.border} strokeWidth="14" />
        <motion.circle
          cx="110" cy="110" r={r} fill="none"
          stroke={C.gold} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={C_}
          initial={{ strokeDashoffset: C_ }}
          animate={{ strokeDashoffset: C_ - arc }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {/* Tier markers */}
        {[25, 50, 75].map((pct) => {
          const a = (pct / 100) * 2 * Math.PI;
          const x1 = 110 + Math.cos(a) * (r - 10);
          const y1 = 110 + Math.sin(a) * (r - 10);
          const x2 = 110 + Math.cos(a) * (r + 10);
          const y2 = 110 + Math.sin(a) * (r + 10);
          return (
            <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={C.bg} strokeWidth="2" />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.text3 }}>ARR</div>
          <div className="text-[36px] font-bold leading-none mt-1" style={{ color: C.gold }}>
            {fmtUSD(arr)}
          </div>
          <div className="text-[10px] mt-1.5" style={{ color: C.text3 }}>
            of {fmtUSD(target, { compact: false, decimals: 0 })}
          </div>
          <div className="mt-2 text-[11px] font-semibold" style={{ color: C.emerald }}>
            {pctOf(arr, target)} to $10M
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadinessGauge({ percent, completed, total, label }: { percent: number; completed: number; total: number; label: string; }) {
  const r = 70;
  const C_ = 2 * Math.PI * r;
  const arc = C_ * Math.max(0, Math.min(1, percent / 100));
  const color = percent === 100 ? C.emerald :
                percent >= 50 ? C.gold :
                percent >= 25 ? C.violet :
                C.plum;

  return (
    <div className="relative inline-grid place-items-center">
      <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="85" cy="85" r={r} fill="none" stroke={C.border} strokeWidth="10" />
        <motion.circle
          cx="85" cy="85" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C_}
          initial={{ strokeDashoffset: C_ }}
          animate={{ strokeDashoffset: C_ - arc }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: C.text3 }}>Go-Live</div>
          <div className="text-[28px] font-bold leading-none mt-1" style={{ color }}>
            {percent}%
          </div>
          <div className="text-[10px] mt-1" style={{ color: C.text2 }}>
            {completed}/{total} done
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusToneChip({ tone, label }: { tone: Tone; label: string }) {
  const colors =
    tone === "ok" ? { bg: "rgba(90,184,150,0.15)", fg: C.emerald, bd: "rgba(90,184,150,0.3)" } :
    tone === "warn" ? { bg: "rgba(217,162,87,0.15)", fg: C.gold, bd: "rgba(217,162,87,0.3)" } :
    tone === "danger" ? { bg: "rgba(196,96,126,0.15)", fg: C.plum, bd: "rgba(196,96,126,0.3)" } :
    { bg: "rgba(255,255,255,0.04)", fg: C.text3, bd: C.border };
  return (
    <span
      className="text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider font-bold"
      style={{ background: colors.bg, color: colors.fg, border: `1px solid ${colors.bd}` }}
    >
      {label}
    </span>
  );
}

/* ── Empty Hint ─────────────────────────────────────────────────────────── */
function EmptyHint({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-6 text-[12px]" style={{ color: C.text3 }}>
      {icon && <div className="mb-2 flex justify-center">{icon}</div>}
      {text}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
type TabKey = "overview" | "readiness" | "customers" | "charges" | "tiers";

export default function StripeCommandPage() {
  const [data, setData] = useState<StripeStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [showTruthLayer, setShowTruthLayer] = useState<boolean>(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await fetch("/api/agency/stripe-stats", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(j);
      setError(null);
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e?.message || "Failed to load Stripe stats");
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(true), 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const kpis = data?.kpis;
  const account = data?.account;
  const mode = data?.mode || "test";
  const isLive = !!data?.isLive;

  const filteredCustomers = useMemo(() => {
    if (!data) return [];
    let out = data.customers;
    if (tierFilter !== "all") out = out.filter((c) => c.tier.toLowerCase() === tierFilter.toLowerCase());
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      out = out.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.vertical.toLowerCase().includes(q)
      );
    }
    return out;
  }, [data, tierFilter, searchQuery]);

  const tiersAvailable = useMemo(() => data?.tierBreakdown || [], [data]);
  const totalArr = data?.tierBreakdown.reduce((s, t) => s + t.arr, 0) || 0;
  const totalVertArr = data?.verticalBreakdown.reduce((s, v) => s + v.arr, 0) || 0;

  /* ── Loading / Empty ────────────────────────────────────────────────── */
  if (loading && !data) {
    return (
      <div className="p-6 text-center" style={{ color: C.text3 }}>
        <Activity size={24} className="animate-pulse inline-block mr-2" style={{ color: C.gold }} />
        Loading Stripe Revenue Command…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <div className="rounded-lg p-4 text-center"
          style={{ background: "rgba(196,96,126,0.1)", border: "1px solid rgba(196,96,126,0.3)", color: C.plum }}>
          <AlertCircle size={20} className="inline-block mr-2" />
          Stripe stats unavailable: {error}
        </div>
      </div>
    );
  }

  if (!data || !kpis || !account) return null;

  return (
    <div className="pb-12" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="px-6 py-6 max-w-[1400px] mx-auto">
        <PageBreadcrumbs
          items={[
            { href: "/agency", label: "Agency" },
            { href: "/agency/stripe", label: "Stripe Command" },
          ]}
        />

        {/* ── Header ────────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <CreditCard size={26} style={{ color: C.gold }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold"
              style={{ color: C.text3 }}>Revenue Infrastructure</span>
            <span className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowTruthLayer(true)}
                className="text-[10px] px-3 py-1 rounded-md font-semibold uppercase tracking-wider transition-all"
                style={{ background: C.bgMid, color: C.text3, border: `1px solid ${C.border}` }}
              >
                <ShieldCheck size={11} className="inline -mt-0.5 mr-1" />
                Truth Layer
              </button>
              <button
                onClick={() => fetchAll(true)}
                disabled={refreshing}
                className="text-[10px] px-3 py-1 rounded-md font-semibold uppercase tracking-wider flex items-center gap-1.5"
                style={{
                  background: C.bgMid,
                  color: refreshing ? C.text3 : C.gold,
                  border: `1px solid ${C.border}`,
                  cursor: refreshing ? "wait" : "pointer",
                }}
              >
                <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
              <StatusToneChip
                tone={isLive ? "ok" : "warn"}
                label={isLive ? "LIVE MODE" : "SANDBOX / TEST"}
              />
              {data._latencyMs != null && (
                <span className="text-[10px]" style={{ color: C.text3 }}>{data._latencyMs}ms</span>
              )}
            </span>
          </div>
          <h1 className="text-[2rem] font-medium leading-tight mb-1.5"
            style={{ color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Stripe Revenue Command Center
          </h1>
          <p className="text-[13px] mb-5" style={{ color: C.text3 }}>
            {account.business_name} · {account.email} · account <code className="text-[11px]" style={{ color: C.gold }}>{account.id}</code>
            <span className="mx-2" style={{ color: C.border }}>|</span>
            <span>{data.summary}</span>
          </p>
        </motion.div>

        {/* ── Sandbox Truth Banner ─────────────────────────────────── */}
        {!isLive && (
          <motion.div
            {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-lg p-3 mb-4 flex items-start gap-3"
            style={{
              background: "rgba(217,162,87,0.08)",
              border: "1px solid rgba(217,162,87,0.25)",
            }}
          >
            <AlertTriangle size={16} style={{ color: C.gold, marginTop: 2, flexShrink: 0 }} />
            <div className="text-[12px]" style={{ color: C.text2 }}>
              <strong style={{ color: C.gold }}>Sandbox mode</strong> — Stripe is in <code>test</code> mode. RIG persistent store (clients / invoices / contracts / proposals) is real local data. To flip to live, complete the 10-step readiness checklist in the Readiness tab and swap <code>sk_test_</code> → <code>sk_live_</code> in <code>~/.rig/.env.stripe</code>.
            </div>
          </motion.div>
        )}

        {/* ── KPI Strip ─────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "ARR (live)", value: fmtUSD(kpis.arr), sub: `${pctOf(kpis.arr, kpis.targetArr)} of $10M`, icon: TrendingUp, c: C.gold },
            { label: "MRR", value: fmtUSD(kpis.mrr), sub: `${kpis.activeClients} active`, icon: Zap, c: C.emerald },
            { label: "Active Clients", value: fmtNum(kpis.activeClients), sub: `${kpis.totalClients} total`, icon: Users, c: C.violet },
            { label: "Paid Invoices", value: fmtNum(kpis.paidInvoices), sub: `of ${kpis.totalInvoices} issued`, icon: CheckCircle2, c: C.cyan },
            { label: "Failed Pmts", value: fmtNum(kpis.failedPayments), sub: `${fmtUSD(kpis.outstandingInvoices)} outstanding`, icon: AlertCircle, c: kpis.failedPayments > 0 ? C.plum : C.emerald },
            { label: "Lifetime Rev", value: fmtUSD(kpis.lifetimeRevenue), sub: `${kpis.sentProposals} sent / ${kpis.acceptedProposals} accepted`, icon: Banknote, c: C.rust },
          ].map((k, i) => (
            <motion.div key={k.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
              className="rounded-xl p-3"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "var(--shadow-1)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>{k.label}</span>
                <k.icon size={14} style={{ color: k.c }} />
              </div>
              <div className="text-[22px] font-bold font-mono leading-none" style={{ color: k.c }}>
                {k.value}
              </div>
              <div className="text-[10px] mt-1.5" style={{ color: C.text3 }}>{k.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Hero: ARR Ring + Revenue Sources ──────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Ring */}
          <div className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} style={{ color: C.gold }} />
              <h2 className="text-[15px] font-semibold m-0" style={{ color: C.text }}>Path to $10M ARR</h2>
            </div>
            <div className="flex justify-center py-2">
              <ArrRing progress={kpis.arrProgress} arr={kpis.arr} target={kpis.targetArr} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider" style={{ color: C.text3 }}>ARR Gap</div>
                <div className="text-[14px] font-bold mt-1" style={{ color: C.plum }}>{fmtUSD(kpis.arrGap)}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider" style={{ color: C.text3 }}>Progress</div>
                <div className="text-[14px] font-bold mt-1" style={{ color: C.gold }}>{pctOf(kpis.arr, kpis.targetArr)}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider" style={{ color: C.text3 }}>Target MRR</div>
                <div className="text-[14px] font-bold mt-1" style={{ color: C.emerald }}>{fmtUSD(833_333)}</div>
              </div>
            </div>
          </div>

          {/* Revenue Sources */}
          <div className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: C.gold }} />
              <h2 className="text-[15px] font-semibold m-0" style={{ color: C.text }}>Revenue Sources</h2>
              <span className="ml-auto text-[10px]" style={{ color: C.text3 }}>
                Real RIG stores + Stripe managed state
              </span>
            </div>
            <div className="space-y-2">
              {data.revenueSources.map((src, i) => {
                const totalLifetime = data.revenueSources.reduce((s, r) => s + r.amount, 0) || 1;
                const w = (src.amount / totalLifetime) * 100;
                const c = i === 0 ? C.gold : i === 1 ? C.emerald : i === 2 ? C.violet : C.cyan;
                return (
                  <div key={src.id}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span style={{ color: C.text2 }}>{src.label}</span>
                      <span className="font-mono font-bold" style={{ color: c }}>
                        {fmtUSD(src.amount)} <span style={{ color: C.text3 }}>· {src.count}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: C.bgMid }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${w}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ background: c }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>Combined revenue base</span>
              <span className="text-[18px] font-bold font-mono" style={{ color: C.gold }}>
                {fmtUSD(data.revenueSources.reduce((s, r) => s + r.amount, 0))}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {/* Tab bar */}
          <div className="flex items-center gap-1 p-2 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
            {([
              { k: "overview" as TabKey, label: "Overview", icon: Sigma },
              { k: "readiness" as TabKey, label: "Readiness", icon: Rocket },
              { k: "customers" as TabKey, label: `Customers (${data.customers.length})`, icon: Users },
              { k: "charges" as TabKey, label: `Charges (${data.recentCharges.length})`, icon: Receipt },
              { k: "tiers" as TabKey, label: "Tiers & Verticals", icon: Layers },
            ]).map((t) => {
              const active = activeTab === t.k;
              return (
                <button key={t.k} onClick={() => setActiveTab(t.k)}
                  className="text-[11px] px-3 py-2 rounded-md font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                  style={{
                    background: active ? `${C.gold}18` : "transparent",
                    color: active ? C.gold : C.text3,
                    border: active ? `1px solid ${C.gold}44` : "1px solid transparent",
                  }}>
                  <t.icon size={12} />
                  {t.label}
                </button>
              );
            })}
            <div className="ml-auto text-[10px] pr-2" style={{ color: C.text3 }}>
              Updated {updatedAt || "—"}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-[13px] font-semibold mb-3" style={{ color: C.text }}>
                      <Activity size={14} className="inline -mt-0.5 mr-1.5" style={{ color: C.gold }} />
                      Monthly Revenue Trend (last 12 months)
                    </h3>
                    <div className="rounded-lg p-4" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                      {data.trend.length === 0 ? (
                        <EmptyHint text="No trend data — RIG invoices may lack paidAt timestamps" />
                      ) : (
                        <div className="flex items-end gap-1.5 h-32">
                          {data.trend.map((m, i) => {
                            const maxR = Math.max(...data.trend.map((t) => t.revenue), 1);
                            const h = (m.revenue / maxR) * 100;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                <div className="text-[9px] font-mono" style={{ color: C.text3 }}>
                                  {m.revenue > 0 ? fmtUSD(m.revenue) : "·"}
                                </div>
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${Math.max(h, 2)}%` }}
                                  transition={{ duration: 0.5, delay: i * 0.04 }}
                                  className="w-full rounded-t"
                                  style={{
                                    background: m.revenue > 0
                                      ? `linear-gradient(180deg, ${C.gold}, ${C.gold}55)`
                                      : C.border,
                                  }}
                                />
                                <div className="text-[9px]" style={{ color: C.text3 }}>{m.month}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-4 mt-3 text-[10px]" style={{ color: C.text3 }}>
                        <div>Peak: <span style={{ color: C.gold }} className="font-mono">{fmtUSD(Math.max(...data.trend.map(t => t.revenue)))}</span></div>
                        <div>·</div>
                        <div>Total: <span style={{ color: C.emerald }} className="font-mono">{fmtUSD(data.trend.reduce((s, t) => s + t.revenue, 0))}</span></div>
                        <div>·</div>
                        <div>Months active: <span style={{ color: C.violet }} className="font-mono">{data.trend.filter(t => t.revenue > 0).length}/12</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Mode & Account */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-lg p-4" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 size={14} style={{ color: C.gold }} />
                        <h3 className="text-[13px] font-semibold m-0" style={{ color: C.text }}>Connected Account</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Account ID", value: account.id, mono: true },
                          { label: "Country", value: account.country.toUpperCase() },
                          { label: "Default Currency", value: account.default_currency.toUpperCase() },
                          { label: "Mode", value: isLive ? "LIVE" : "TEST" },
                        ].map((f, i) => (
                          <div key={i} className="rounded-md p-2" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                            <div className="text-[9px] uppercase tracking-wider" style={{ color: C.text3 }}>{f.label}</div>
                            <div className={`text-[12px] mt-0.5 font-medium ${f.mono ? "font-mono" : ""}`} style={{ color: C.text2 }}>
                              {f.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Capability Pills */}
                    <div className="rounded-lg p-4" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck size={14} style={{ color: C.gold }} />
                        <h3 className="text-[13px] font-semibold m-0" style={{ color: C.text }}>Account Capabilities</h3>
                      </div>
                      <div className="space-y-2">
                        {[
                          { key: "charges_enabled", label: "Charges", val: account.charges_enabled },
                          { key: "payouts_enabled", label: "Payouts", val: account.payouts_enabled },
                          { key: "details_submitted", label: "Identity Submitted", val: account.details_submitted },
                          { key: "smoke_customer", label: "Smoke Customer", val: !!data.smoke?.customer_exists },
                          { key: "smoke_product", label: "Smoke Product", val: !!data.smoke?.product_exists },
                          { key: "smoke_price", label: "Smoke Price", val: !!data.smoke?.price_exists },
                        ].map((cap) => (
                          <div key={cap.key} className="flex items-center justify-between text-[12px] py-1">
                            <span style={{ color: C.text2 }}>{cap.label}</span>
                            <StatusToneChip
                              tone={cap.val ? "ok" : "muted"}
                              label={cap.val ? "✓ ON" : "OFF"}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Numbers Tile */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Active Contracts", value: kpis.activeContracts, icon: FileCheck, c: C.emerald },
                      { label: "Sent Proposals", value: kpis.sentProposals, icon: Briefcase, c: C.violet },
                      { label: "Outstanding Invoices", value: fmtUSD(kpis.outstandingInvoices), icon: Clock, c: C.gold },
                      { label: "ARR Gap to $10M", value: fmtUSD(kpis.arrGap), icon: Target, c: C.plum },
                    ].map((t, i) => (
                      <div key={i} className="rounded-lg p-3" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>{t.label}</span>
                          <t.icon size={12} style={{ color: t.c }} />
                        </div>
                        <div className="text-[16px] font-bold font-mono" style={{ color: t.c }}>{t.value}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── READINESS TAB ──────────────────────────────────── */}
              {activeTab === "readiness" && (
                <motion.div key="readiness"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="rounded-lg p-4 col-span-1 flex justify-center"
                      style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                      <ReadinessGauge
                        percent={data.readiness.percent}
                        completed={data.readiness.completed}
                        total={data.readiness.total}
                        label={data.readiness.label}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <div className="text-[14px] font-semibold" style={{ color: data.readiness.percent === 100 ? C.emerald : C.gold }}>
                        {data.readiness.label}
                      </div>
                      <div className="text-[12px]" style={{ color: C.text3 }}>
                        Complete all 10 critical + non-critical steps to flip Stripe from sandbox to live. Critical steps are blockers — they prevent live charges regardless of others being done.
                      </div>
                      <div className="flex items-center gap-3 text-[11px] mt-3 pt-3"
                        style={{ borderTop: `1px solid ${C.border}` }}>
                        <div>
                          <div style={{ color: C.text3 }}>Critical Done</div>
                          <div className="text-[16px] font-mono font-bold" style={{ color: C.emerald }}>
                            {data.liveRequirements.filter((r) => r.critical && r.status === "done").length}/{data.liveRequirements.filter((r) => r.critical).length}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: C.text3 }}>All Done</div>
                          <div className="text-[16px] font-mono font-bold" style={{ color: C.gold }}>
                            {data.readiness.completed}/{data.readiness.total}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: C.text3 }}>Open Blockers</div>
                          <div className="text-[16px] font-mono font-bold" style={{ color: C.plum }}>
                            {data.liveRequirements.filter((r) => r.critical && r.status !== "done").length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="rounded-lg" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                    <div className="p-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <FileCheck size={14} style={{ color: C.gold }} />
                      <h3 className="text-[13px] font-semibold m-0" style={{ color: C.text }}>Go-Live Checklist</h3>
                      <span className="ml-auto text-[10px]" style={{ color: C.text3 }}>{data.liveRequirements.length} items</span>
                    </div>
                    <div className="divide-y" style={{ borderColor: C.border }}>
                      {data.liveRequirements.map((req) => {
                        const expanded = expandedReq === req.id;
                        return (
                          <div key={req.id}>
                            <button
                              onClick={() => setExpandedReq(expanded ? null : req.id)}
                              className="w-full text-left px-4 py-3 flex items-center gap-3 transition-all hover:bg-white/[0.02]"
                            >
                              {req.status === "done" ? (
                                <CheckCircle2 size={16} style={{ color: C.emerald, flexShrink: 0 }} />
                              ) : (
                                <AlertCircle size={16} style={{ color: req.critical ? C.plum : C.text3, flexShrink: 0 }} />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-medium"
                                  style={{ color: req.status === "done" ? C.text3 : C.text }}>
                                  {req.label}
                                </div>
                                <div className="text-[10px] mt-0.5" style={{ color: C.text3 }}>{req.description}</div>
                              </div>
                              {req.critical && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mr-2"
                                  style={{ background: "rgba(196,96,126,0.15)", color: C.plum }}>
                                  Critical
                                </span>
                              )}
                              <StatusToneChip tone={req.status === "done" ? "ok" : req.critical ? "danger" : "warn"} label={req.status === "done" ? "✓ Done" : "Pending"} />
                              <ChevronDown size={14} style={{ color: C.text3, transform: expanded ? "rotate(180deg)" : "", transition: "transform 0.2s" }} />
                            </button>
                            <AnimatePresence>
                              {expanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-12 pb-3 text-[11px]" style={{ color: C.text2 }}>
                                    <div className="rounded-md p-2 mb-2"
                                      style={{ background: req.status === "done" ? "rgba(90,184,150,0.08)" : "rgba(217,162,87,0.08)", border: `1px solid ${req.status === "done" ? "rgba(90,184,150,0.2)" : "rgba(217,162,87,0.2)"}` }}>
                                      {req.status === "done"
                                        ? "✅ Verified by Stripe — operationally live."
                                        : req.critical
                                        ? `🚨 Critical blocker. Without this, live charges will fail. Action: ${req.description}`
                                        : `📋 Non-critical but recommended. ${req.description}`}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── CUSTOMERS TAB ──────────────────────────────────── */}
              {activeTab === "customers" && (
                <motion.div key="customers"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, vertical…"
                        className="w-full rounded-md px-3 py-2 text-[12px]"
                        style={{ background: C.bgMid, color: C.text, border: `1px solid ${C.border}` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>Tier:</span>
                      <button
                        onClick={() => setTierFilter("all")}
                        className="text-[10px] px-2 py-1 rounded font-semibold uppercase tracking-wider"
                        style={{
                          background: tierFilter === "all" ? C.gold : C.bgMid,
                          color: tierFilter === "all" ? C.bg : C.text3,
                          border: `1px solid ${tierFilter === "all" ? C.gold : C.border}`,
                        }}
                      >All ({data.customers.length})</button>
                      {tiersAvailable.map((t) => (
                        <button
                          key={t.id} onClick={() => setTierFilter(t.id)}
                          className="text-[10px] px-2 py-1 rounded font-semibold uppercase tracking-wider"
                          style={{
                            background: tierFilter === t.id ? accentFor(t.id) : C.bgMid,
                            color: tierFilter === t.id ? C.bg : C.text3,
                            border: `1px solid ${tierFilter === t.id ? accentFor(t.id) : C.border}`,
                          }}
                        >
                          {t.label} ({t.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="rounded-lg overflow-hidden"
                    style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                    <div className="grid grid-cols-12 gap-2 p-2 text-[10px] uppercase tracking-wider font-semibold"
                      style={{ background: C.bg, color: C.text3, borderBottom: `1px solid ${C.border}` }}>
                      <div className="col-span-4">Client</div>
                      <div className="col-span-2">Tier</div>
                      <div className="col-span-2 text-right">Monthly</div>
                      <div className="col-span-2 text-right">Lifetime Paid</div>
                      <div className="col-span-2 text-right">Status</div>
                    </div>
                    {filteredCustomers.length === 0 ? (
                      <EmptyHint text="No matching customers" icon={<Users size={20} />} />
                    ) : (
                      filteredCustomers.map((c) => (
                        <div key={c.id}
                          className="grid grid-cols-12 gap-2 p-3 text-[12px] transition-all hover:bg-white/[0.02]"
                          style={{ borderBottom: `1px solid ${C.border}` }}>
                          <div className="col-span-4 truncate">
                            <div className="font-medium" style={{ color: C.text }}>{c.name}</div>
                            <div className="text-[10px]" style={{ color: C.text3 }}>
                              {c.vertical}{c.email ? ` · ${c.email}` : ""}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                              style={{
                                background: `${accentFor(c.tier)}18`,
                                color: accentFor(c.tier),
                                border: `1px solid ${accentFor(c.tier)}44`,
                              }}
                            >
                              {c.tier}
                            </span>
                          </div>
                          <div className="col-span-2 text-right font-mono" style={{ color: C.gold }}>
                            {fmtUSD(c.monthlyFee)}
                          </div>
                          <div className="col-span-2 text-right font-mono font-bold" style={{ color: C.emerald }}>
                            {fmtUSD(c.lifetimePaid)}
                          </div>
                          <div className="col-span-2 text-right">
                            <StatusToneChip tone={c.statusTone} label={c.status} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── CHARGES TAB ─────────────────────────────────────── */}
              {activeTab === "charges" && (
                <motion.div key="charges"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-lg overflow-hidden"
                    style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                    <div className="grid grid-cols-12 gap-2 p-2 text-[10px] uppercase tracking-wider font-semibold"
                      style={{ background: C.bg, color: C.text3, borderBottom: `1px solid ${C.border}` }}>
                      <div className="col-span-3">Invoice #</div>
                      <div className="col-span-3">Client</div>
                      <div className="col-span-2 text-right">Amount</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Issued</div>
                    </div>
                    {data.recentCharges.length === 0 ? (
                      <EmptyHint text="No invoices — RIG has not issued any yet" icon={<Receipt size={20} />} />
                    ) : (
                      data.recentCharges.map((c) => (
                        <div key={c.id}
                          className="grid grid-cols-12 gap-2 p-3 text-[12px] transition-all hover:bg-white/[0.02]"
                          style={{ borderBottom: `1px solid ${C.border}` }}>
                          <div className="col-span-3 font-mono" style={{ color: C.text2 }}>
                            {c.number}
                          </div>
                          <div className="col-span-3 truncate" style={{ color: C.text }}>
                            {c.client}
                          </div>
                          <div className="col-span-2 text-right font-mono font-bold"
                            style={{ color: c.statusTone === "ok" ? C.emerald : c.statusTone === "danger" ? C.plum : C.gold }}>
                            {fmtUSD(c.amount)}
                          </div>
                          <div className="col-span-2">
                            <StatusToneChip tone={c.statusTone} label={c.status} />
                          </div>
                          <div className="col-span-2 text-[10px]" style={{ color: C.text3 }}>
                            {c.issuedAt ? relTime(c.issuedAt) : "—"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {data.recentCharges.length > 0 && (
                    <div className="rounded-lg p-3 flex items-center justify-between"
                      style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                      <span className="text-[11px]" style={{ color: C.text3 }}>
                        Showing {data.recentCharges.length} most recent. Full ledger under <code style={{ color: C.gold }}>agency-store:invoices</code>.
                      </span>
                      <a href="/agency/invoices"
                        className="text-[10px] px-3 py-1.5 rounded font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                        style={{ background: `${C.gold}18`, color: C.gold, border: `1px solid ${C.gold}44` }}
                      >
                        All Invoices <ArrowRight size={11} />
                      </a>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── TIERS TAB ───────────────────────────────────────── */}
              {activeTab === "tiers" && (
                <motion.div key="tiers"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-[13px] font-semibold mb-3" style={{ color: C.text }}>
                      <Crown size={14} className="inline -mt-0.5 mr-1.5" style={{ color: C.gold }} />
                      Tier Breakdown
                    </h3>
                    {tiersAvailable.length === 0 ? (
                      <EmptyHint text="No tier data — no active clients" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tiersAvailable.map((t) => {
                          const w = totalArr > 0 ? (t.arr / totalArr) * 100 : 0;
                          return (
                            <div key={t.id}
                              className="rounded-lg p-4"
                              style={{ background: C.bgMid, border: `1px solid ${accentFor(t.id)}44`, borderTop: `3px solid ${accentFor(t.id)}` }}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[14px] font-bold uppercase tracking-wider" style={{ color: accentFor(t.id) }}>
                                  {t.label}
                                </span>
                                <Crown size={14} style={{ color: accentFor(t.id) }} />
                              </div>
                              <div className="text-[22px] font-bold font-mono" style={{ color: C.text }}>
                                {fmtUSD(t.arr)}
                              </div>
                              <div className="text-[10px] mt-1" style={{ color: C.text3 }}>
                                {t.count} active client{t.count !== 1 ? "s" : ""}
                              </div>
                              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                                <motion.div
                                  initial={{ width: 0 }} animate={{ width: `${w}%` }}
                                  transition={{ duration: 0.7, delay: 0.1 }}
                                  className="h-full rounded-full"
                                  style={{ background: accentFor(t.id) }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] mt-1.5" style={{ color: C.text3 }}>
                                <span>{w.toFixed(1)}% of ARR</span>
                                <span>{fmtUSD(t.arr / Math.max(1, t.count))}/client</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-[13px] font-semibold mb-3" style={{ color: C.text }}>
                      <Briefcase size={14} className="inline -mt-0.5 mr-1.5" style={{ color: C.violet }} />
                      Vertical Breakdown
                    </h3>
                    {data.verticalBreakdown.length === 0 ? (
                      <EmptyHint text="No vertical data" />
                    ) : (
                      <div className="rounded-lg overflow-hidden"
                        style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                        {data.verticalBreakdown
                          .slice()
                          .sort((a, b) => b.arr - a.arr)
                          .map((v) => {
                            const w = totalVertArr > 0 ? (v.arr / totalVertArr) * 100 : 0;
                            return (
                              <div key={v.id} className="p-3"
                                style={{ borderBottom: `1px solid ${C.border}` }}>
                                <div className="flex items-center justify-between text-[12px] mb-1.5">
                                  <span style={{ color: C.text }}>{v.label}</span>
                                  <span className="font-mono font-bold" style={{ color: C.gold }}>
                                    {fmtUSD(v.arr)} · {v.count}
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                                  <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${w}%` }}
                                    transition={{ duration: 0.6 }}
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${C.violet}, ${C.gold})` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 flex items-center justify-between text-[10px]" style={{ color: C.text3 }}>
          <span>
            Sources: <code style={{ color: C.gold }}>rig-stripe-ops</code> + <code style={{ color: C.gold }}>agency-store</code> ·
            Doctrine: every number audit-tagged · Truth-flagged when sandbox
          </span>
          <span className="flex items-center gap-3">
            <a href="/agency/invoices" className="hover:underline">All Invoices</a>
            <a href="/agency/clients" className="hover:underline">All Clients</a>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Award size={10} style={{ color: C.gold }} /> v2.0 · 60s auto-refresh
            </span>
          </span>
        </motion.div>
      </div>

      {/* ── Truth Layer Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showTruthLayer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center p-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowTruthLayer(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-xl p-6 max-w-xl w-full"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={20} style={{ color: C.gold }} />
                <h2 className="text-[17px] font-semibold m-0" style={{ color: C.text }}>
                  Stripe Command — Truth Layer
                </h2>
                <button onClick={() => setShowTruthLayer(false)}
                  className="ml-auto text-[18px] hover:opacity-70" style={{ color: C.text3 }}>×</button>
              </div>
              <div className="space-y-3 text-[12px]" style={{ color: C.text2 }}>
                <div>
                  <div className="font-semibold mb-1" style={{ color: C.gold }}>What is REAL (live):</div>
                  <ul className="space-y-1.5 pl-4 list-disc">
                    <li><strong>Stripe account info</strong> — id, mode, business_name, capabilities (from <code>rig-stripe-ops status</code>)</li>
                    <li><strong>Client ARR / MRR</strong> — derived from persistent agency store (loadClients)</li>
                    <li><strong>Invoices</strong> — every invoice = real RIG data (loadInvoices), not Stripe API (sandbox has no charges)</li>
                    <li><strong>Proposal / contract pipeline</strong> — loadProposals + loadContracts</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-1" style={{ color: C.violet }}>What is COMPUTED (derived):</div>
                  <ul className="space-y-1.5 pl-4 list-disc">
                    <li><strong>MRR</strong> = sum(activeClients.monthlyFee)</li>
                    <li><strong>ARR</strong> = MRR × 12</li>
                    <li><strong>Readiness %</strong> = completed checklist / total steps</li>
                    <li><strong>Lifetime paid</strong> = sum(paidInvoices where status="paid")</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-1" style={{ color: C.plum }}>What is SUBJECTIVE / NAIVE:</div>
                  <ul className="space-y-1.5 pl-4 list-disc">
                    <li><strong>Path to $10M progress</strong> — uses raw ARR / $10M, no growth-rate weighting</li>
                    <li><strong>Tier AR breakdown</strong> — uses annualFee (frozen) instead of trailing 12-month actuals</li>
                  </ul>
                </div>
                <div className="rounded-md p-2 mt-3"
                  style={{ background: "rgba(217,162,87,0.08)", border: "1px solid rgba(217,162,87,0.2)" }}>
                  <div className="font-semibold" style={{ color: C.gold }}>⚠ Sandbox flag</div>
                  <div className="text-[11px] mt-1" style={{ color: C.text3 }}>
                    When <code>mode=test</code>, no live charges have ever been processed. All revenue numbers come from RIG's parallel
                    invoice tracker. Flip to live by completing the 10-step checklist in the Readiness tab.
                  </div>
                </div>
                <div className="text-[10px] mt-3 pt-3" style={{ color: C.text3, borderTop: `1px solid ${C.border}` }}>
                  Doctrine: ProofPacket or it didn't happen. No fabricated metrics. No green by default.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
