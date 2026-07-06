"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Wand2, ChevronRight, Sparkles, CheckCircle, Clock, Send,
  DollarSign, Target, TrendingUp, Building2, Layers, Briefcase,
  Calculator, ArrowUpRight, Search, X, BarChart3, Zap, Copy, Mail,
  Calendar, Award, Filter,
} from "lucide-react";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

interface Proposal {
  id: string;
  clientId: string;
  title: string;
  status: string;
  amount: number;
  scope: string[];
  timeline: string;
  notes: string;
  sentAt?: string;
  createdAt: string;
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

interface Template {
  vertical: string;
  name: string;
  scope: string;
  deliverables: string[];
  pricing: Record<string, { monthly: number; annual: number; scope: string }>;
  timeline: string;
  proofPacketRequired: boolean;
}

const TIER_ORDER = ["starter", "growth", "scale", "enterprise"];
const TIER_META: Record<string, { label: string; color: string; desc: string }> = {
  starter:    { label: "Starter",    color: "#60a5fa", desc: "1 agent · monthly review" },
  growth:     { label: "Growth",     color: "#5ab896", desc: "3 agents · weekly review" },
  scale:      { label: "Scale",      color: "#d4a574", desc: "5 agents · daily monitoring" },
  enterprise: { label: "Enterprise", color: "#c4607e", desc: "Unlimited · white-label · 24/7" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Draft",     color: "#a59783", bg: "rgba(165, 151, 131, 0.12)" },
  sent:      { label: "Sent",      color: "#d4a574", bg: "rgba(212, 165, 116, 0.14)" },
  viewed:    { label: "Viewed",    color: "#60a5fa", bg: "rgba(96, 165, 250, 0.14)" },
  accepted:  { label: "Accepted",  color: "#5ab896", bg: "rgba(90, 184, 150, 0.16)" },
  declined:  { label: "Declined",  color: "#c97c5e", bg: "rgba(201, 124, 94, 0.14)" },
  expired:   { label: "Expired",   color: "#6e6353", bg: "rgba(110, 99, 83, 0.14)" },
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function relTime(iso?: string): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d <= 0) return "today";
  if (d === 1) return "1d ago";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export default function ProposalsCommand() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedVertical, setSelectedVertical] = useState<Vertical | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/proposals", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setProposals(data.proposals || []);
      setVerticals(data.verticals || []);
      setTemplates(data.templates || []);
    } catch {
      // graceful no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 60_000);
    return () => clearInterval(id);
  }, [loadData]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = proposals.length;
    const sent = proposals.filter((p) => p.status === "sent").length;
    const accepted = proposals.filter((p) => p.status === "accepted").length;
    const draft = proposals.filter((p) => p.status === "draft").length;
    const totalValue = proposals.reduce((s, p) => s + (p.amount || 0), 0);
    const sentValue = proposals.filter((p) => p.status === "sent").reduce((s, p) => s + p.amount, 0);
    const avgDeal = total ? totalValue / total : 0;
    const conversionRate = sent ? Math.round((accepted / sent) * 100) : 0;
    const targetARR = verticals.reduce((s, v) => s + v.targetARR, 0);
    const totalClients = verticals.reduce((s, v) => s + v.clientCount, 0);
    return {
      total, sent, accepted, draft,
      totalValue, sentValue, avgDeal, conversionRate,
      targetARR, totalClients,
    };
  }, [proposals, verticals]);

  const statusMix = useMemo(() => {
    const counts: Record<string, number> = {};
    proposals.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => ({ key: k, count: v }));
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    let list = proposals;
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.clientId.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [proposals, statusFilter, search]);

  // Health ring math (acceptance rate)
  const healthPct = Math.min(100, Math.max(0, (stats.accepted / Math.max(1, stats.total)) * 100));
  const healthTier =
    healthPct >= 30 ? { label: "Healthy", color: "#5ab896" } :
    healthPct >= 10 ? { label: "Building", color: "#d4a574" } :
    { label: "Early", color: "#c97c5e" };

  // Coverage gap (target ARR vs current sent value)
  const coveragePct = stats.targetARR ? Math.min(100, (stats.sentValue / stats.targetARR) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[14px]" style={{ color: "var(--cream-mute)" }}>Loading proposals…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.3 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-2 rounded-lg"
                style={{ background: "rgba(212, 165, 116, 0.14)", color: "var(--gold)" }}
              >
                <FileText size={20} />
              </div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--cream)" }}
              >
                Proposals Command
              </h1>
            </div>
            <p className="text-[13px] max-w-2xl" style={{ color: "var(--cream-mute)" }}>
              Tier-matched, vertical-aware proposal engine. {stats.total} active proposals · {fmtMoney(stats.totalValue)} in flight · {stats.targetARR ? fmtMoney(stats.targetARR) : "—"} target ARR.
            </p>
          </div>
          <Link
            href="/agency/proposals/new"
            className="px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 text-[13px] transition-all hover:opacity-90"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Wand2 size={15} />
            Open Generator
            <ChevronRight size={14} />
          </Link>
        </div>
      </motion.section>

      {/* KPI strip */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {[
          { label: "Proposals",   value: stats.total,                         icon: FileText,    color: "#d4a574" },
          { label: "Total Value", value: fmtMoney(stats.totalValue),          icon: DollarSign,  color: "#5ab896" },
          { label: "Avg Deal",    value: fmtMoney(stats.avgDeal),             icon: Calculator,  color: "#60a5fa" },
          { label: "Sent",        value: stats.sent,                          icon: Send,        color: "#c4607e" },
          { label: "Accepted",    value: stats.accepted,                      icon: CheckCircle, color: "#5ab896" },
          { label: "Verticals",   value: verticals.length,                    icon: Layers,      color: "#c97c5e" },
        ].map((kpi) => {
          const I = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-4 rounded-xl border"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <I size={14} style={{ color: kpi.color }} />
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                  {kpi.label}
                </span>
              </div>
              <div className="text-[22px] font-semibold tabular-nums" style={{ color: "var(--cream)" }}>
                {kpi.value}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Coverage + Status + Health row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health ring */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-5 rounded-xl border"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Award size={14} style={{ color: healthTier.color }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
              Acceptance Velocity
            </span>
          </div>
          <div className="flex items-center justify-center py-2">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(243, 235, 218, 0.06)" strokeWidth="12" />
              <motion.circle
                cx="70" cy="70" r="58" fill="none"
                stroke={healthTier.color} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 58}
                initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - healthPct / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                transform="rotate(-90 70 70)"
              />
              <text x="70" y="68" textAnchor="middle" fill="var(--cream)" fontSize="26" fontWeight="600">
                {Math.round(healthPct)}%
              </text>
              <text x="70" y="88" textAnchor="middle" fill="var(--cream-mute)" fontSize="10">
                {healthTier.label}
              </text>
            </svg>
          </div>
          <p className="text-[11px] text-center mt-2" style={{ color: "var(--cream-mute)" }}>
            {stats.accepted} accepted of {stats.sent} sent
          </p>
        </motion.div>

        {/* Coverage bar */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="p-5 rounded-xl border"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} style={{ color: "var(--gold)" }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
              ARR Coverage
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-[22px] font-semibold tabular-nums" style={{ color: "var(--cream)" }}>
              {fmtMoney(stats.sentValue)}
            </div>
            <div className="text-[12px]" style={{ color: "var(--cream-mute)" }}>
              / {fmtMoney(stats.targetARR)} target
            </div>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(243, 235, 218, 0.06)" }}
          >
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, var(--gold), var(--plum))" }}
              initial={{ width: 0 }}
              animate={{ width: `${coveragePct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-[11px] mt-2" style={{ color: "var(--cream-mute)" }}>
            {coveragePct.toFixed(1)}% of vertical target ARR covered by sent proposals
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div
              className="p-2.5 rounded-md border"
              style={{ background: "rgba(243, 235, 218, 0.03)", borderColor: "var(--line-soft)" }}
            >
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                Pipeline
              </div>
              <div className="text-[14px] font-semibold tabular-nums" style={{ color: "var(--cream)" }}>
                {fmtMoney(stats.totalValue)}
              </div>
            </div>
            <div
              className="p-2.5 rounded-md border"
              style={{ background: "rgba(243, 235, 218, 0.03)", borderColor: "var(--line-soft)" }}
            >
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                Clients
              </div>
              <div className="text-[14px] font-semibold tabular-nums" style={{ color: "var(--cream)" }}>
                {stats.totalClients}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Status mix */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.14 }}
          className="p-5 rounded-xl border"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} style={{ color: "var(--emerald)" }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
              Status Mix
            </span>
          </div>
          {statusMix.length === 0 ? (
            <div className="text-[12px] py-6 text-center" style={{ color: "var(--cream-mute)" }}>
              No proposals yet
            </div>
          ) : (
            <div className="space-y-2">
              {statusMix.map((s) => {
                const meta = STATUS_META[s.key] || STATUS_META.draft;
                const pct = stats.total ? (s.count / stats.total) * 100 : 0;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-2" style={{ color: "var(--cream)" }}>
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: meta.color }}
                        />
                        {meta.label}
                      </span>
                      <span className="tabular-nums" style={{ color: "var(--cream-mute)" }}>
                        {s.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(243, 235, 218, 0.06)" }}
                    >
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Vertical health grid */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.18 }}
        className="p-5 rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={15} style={{ color: "var(--gold)" }} />
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
              Vertical Health
            </h2>
            <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>
              · {verticals.length} verticals · {fmtMoney(stats.targetARR)} target ARR
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {verticals.map((v) => {
            const tmpl = templates.find((t) => t.vertical === v.id);
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVertical(v)}
                className="text-left p-3.5 rounded-lg border transition-all hover:scale-[1.01]"
                style={{ background: "rgba(243, 235, 218, 0.03)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium"
                    style={{ background: `${v.color}22`, color: v.color }}
                  >
                    {v.id.replace(/_/g, " ")}
                  </div>
                  <Briefcase size={12} style={{ color: "var(--cream-mute)" }} />
                </div>
                <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--cream)" }}>
                  {v.name}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                      Target ARR
                    </div>
                    <div className="text-[13px] font-semibold tabular-nums" style={{ color: v.color }}>
                      {fmtMoney(v.targetARR)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                      Clients
                    </div>
                    <div className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--cream)" }}>
                      {v.clientCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                      Avg Deal
                    </div>
                    <div className="text-[12px] tabular-nums" style={{ color: "var(--cream)" }}>
                      {fmtMoney(v.avgDealSize)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                      Cycle
                    </div>
                    <div className="text-[12px] tabular-nums" style={{ color: "var(--cream)" }}>
                      {v.salesCycleDays}d
                    </div>
                  </div>
                </div>
                {tmpl && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>
                      Template
                    </div>
                    <div className="text-[11px] line-clamp-2" style={{ color: "var(--cream-soft)" }}>
                      {tmpl.scope}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* Tier pricing matrix */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.22 }}
        className="p-5 rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={15} style={{ color: "var(--gold)" }} />
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
              Tier Pricing Matrix
            </h2>
            <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>
              · 4 tiers across {verticals.length} verticals
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TIER_ORDER.map((tier) => {
            const meta = TIER_META[tier];
            // find a sample template that has this tier
            const sample = templates.find((t) => t.pricing[tier]);
            const p = sample?.pricing[tier];
            return (
              <div
                key={tier}
                className="p-4 rounded-lg border transition-all"
                style={{ background: "rgba(243, 235, 218, 0.03)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: meta.color }}
                  />
                  <div className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>
                    {meta.label}
                  </div>
                </div>
                {p ? (
                  <>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-[22px] font-bold tabular-nums" style={{ color: meta.color }}>
                        {fmtMoney(p.monthly)}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>/mo</span>
                    </div>
                    <div className="text-[11px] mb-2" style={{ color: "var(--cream-mute)" }}>
                      {fmtMoney(p.annual)}/yr · {p.scope}
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] py-2" style={{ color: "var(--cream-mute)" }}>
                    No template sample
                  </div>
                )}
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                  {meta.desc}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Proposals table */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.26 }}
        className="p-5 rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText size={15} style={{ color: "var(--gold)" }} />
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
              Active Proposals
            </h2>
            <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>
              · {filteredProposals.length} of {proposals.length}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border"
              style={{ background: "rgba(243, 235, 218, 0.04)", borderColor: "var(--line-soft)" }}
            >
              <Search size={12} style={{ color: "var(--cream-mute)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by id, client, title…"
                className="bg-transparent outline-none text-[12px] w-44"
                style={{ color: "var(--cream)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="opacity-60 hover:opacity-100">
                  <X size={11} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {["all", "sent", "draft", "accepted"].map((s) => {
                const meta = s === "all" ? { label: "All", color: "var(--cream)" } : STATUS_META[s] || STATUS_META.draft;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                    style={{
                      background: statusFilter === s ? `${meta.color}22` : "rgba(243, 235, 218, 0.03)",
                      color: statusFilter === s ? meta.color : "var(--cream-mute)",
                      border: `1px solid ${statusFilter === s ? `${meta.color}55` : "var(--line-soft)"}`,
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="text-[12px] py-8 text-center" style={{ color: "var(--cream-mute)" }}>
            No proposals match your filter. Open the generator to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ color: "var(--cream-mute)" }}>
                  <th className="text-left p-2 font-medium">ID</th>
                  <th className="text-left p-2 font-medium">Title</th>
                  <th className="text-left p-2 font-medium">Client</th>
                  <th className="text-right p-2 font-medium">Amount</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Sent</th>
                  <th className="text-left p-2 font-medium">Valid</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map((p) => {
                  const sm = STATUS_META[p.status] || STATUS_META.draft;
                  const validIn = daysUntil(p.sentAt ? new Date(new Date(p.sentAt).getTime() + 30 * 86_400_000).toISOString() : undefined);
                  return (
                    <tr
                      key={p.id}
                      className="border-t hover:bg-white/[0.02] cursor-pointer"
                      style={{ borderColor: "var(--line-soft)" }}
                      onClick={() => setSelectedProposal(p)}
                    >
                      <td className="p-2 font-mono" style={{ color: "var(--cream-mute)" }}>{p.id}</td>
                      <td className="p-2" style={{ color: "var(--cream)" }}>{p.title}</td>
                      <td className="p-2 font-mono" style={{ color: "var(--cream-mute)" }}>{p.clientId}</td>
                      <td className="p-2 text-right font-semibold tabular-nums" style={{ color: "var(--gold)" }}>
                        {fmtMoney(p.amount)}
                      </td>
                      <td className="p-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium"
                          style={{ background: sm.bg, color: sm.color }}
                        >
                          {sm.label}
                        </span>
                      </td>
                      <td className="p-2" style={{ color: "var(--cream-mute)" }}>{relTime(p.sentAt)}</td>
                      <td className="p-2 tabular-nums" style={{ color: validIn !== null && validIn < 7 ? "var(--plum)" : "var(--cream-mute)" }}>
                        {validIn !== null ? `${validIn}d` : "—"}
                      </td>
                      <td className="p-2 text-right">
                        <ArrowUpRight size={12} style={{ color: "var(--cream-mute)" }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* Quick action row */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {[
          { href: "/agency/proposals/new", icon: Wand2, title: "Generator", body: "Build a tier-matched, vertical-aware proposal with markdown output.", color: "var(--gold)" },
          { href: "/agency/pipeline", icon: TrendingUp, title: "Pipeline", body: "See open deals by stage with weighted forecast and aging.", color: "var(--emerald)" },
          { href: "/agency/contracts", icon: FileText, title: "Contracts", body: "Convert accepted proposals to contracts and auto-generate invoices.", color: "var(--plum)" },
        ].map((a) => {
          const I = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="p-4 rounded-xl border flex items-start gap-3 transition-all hover:scale-[1.01]"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div
                className="p-2 rounded-md flex-shrink-0"
                style={{ background: `${a.color}22`, color: a.color }}
              >
                <I size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--cream)" }}>
                  {a.title}
                </div>
                <div className="text-[11px] line-clamp-2" style={{ color: "var(--cream-mute)" }}>
                  {a.body}
                </div>
              </div>
              <ChevronRight size={14} style={{ color: "var(--cream-mute)" }} />
            </Link>
          );
        })}
      </motion.section>

      {/* Doctrine footer */}
      <div
        className="text-[10px] text-center py-2"
        style={{ color: "var(--cream-mute)" }}
      >
        Proposals Command · wired to /api/agency/proposals · auto-refresh 60s · doctrine: ProofPacket or it didn't happen
      </div>

      {/* Proposal detail modal */}
      <AnimatePresence>
        {selectedProposal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(21, 16, 26, 0.85)", backdropFilter: "blur(6px)" }}
            onClick={() => setSelectedProposal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border p-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--line)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium"
                      style={{
                        background: (STATUS_META[selectedProposal.status] || STATUS_META.draft).bg,
                        color: (STATUS_META[selectedProposal.status] || STATUS_META.draft).color,
                      }}
                    >
                      {selectedProposal.status}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: "var(--cream-mute)" }}>
                      {selectedProposal.id}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-semibold" style={{ color: "var(--cream)" }}>
                    {selectedProposal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="p-1 rounded-md transition-all hover:opacity-70"
                  style={{ color: "var(--cream-mute)" }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg border" style={{ background: "rgba(243, 235, 218, 0.03)", borderColor: "var(--line-soft)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Amount</div>
                  <div className="text-[18px] font-bold tabular-nums" style={{ color: "var(--gold)" }}>{fmtMoney(selectedProposal.amount)}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ background: "rgba(243, 235, 218, 0.03)", borderColor: "var(--line-soft)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Client</div>
                  <div className="text-[14px] font-mono" style={{ color: "var(--cream)" }}>{selectedProposal.clientId}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ background: "rgba(243, 235, 218, 0.03)", borderColor: "var(--line-soft)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Sent</div>
                  <div className="text-[14px]" style={{ color: "var(--cream)" }}>{relTime(selectedProposal.sentAt)}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Timeline</div>
                <div className="text-[13px]" style={{ color: "var(--cream-soft)" }}>{selectedProposal.timeline}</div>
              </div>

              <div className="mb-4">
                <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Scope</div>
                <ul className="space-y-1">
                  {selectedProposal.scope.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--cream)" }}>
                      <span style={{ color: "var(--gold)" }}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedProposal.notes && (
                <div className="mb-4 p-3 rounded-md" style={{ background: "rgba(212, 165, 116, 0.08)", border: "1px solid var(--line)" }}>
                  <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--gold)" }}>Note</div>
                  <div className="text-[12px]" style={{ color: "var(--cream)" }}>{selectedProposal.notes}</div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedProposal, null, 2));
                  }}
                  className="flex-1 px-3 py-2 rounded-md text-[12px] font-medium flex items-center justify-center gap-2"
                  style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
                >
                  <Copy size={13} /> Copy JSON
                </button>
                <Link
                  href={`/agency/contracts?from=${selectedProposal.id}`}
                  className="flex-1 px-3 py-2 rounded-md text-[12px] font-medium flex items-center justify-center gap-2 border"
                  style={{ borderColor: "var(--line)", color: "var(--cream)" }}
                >
                  <FileText size={13} /> Convert to Contract
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vertical detail modal */}
      <AnimatePresence>
        {selectedVertical && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(21, 16, 26, 0.85)", backdropFilter: "blur(6px)" }}
            onClick={() => setSelectedVertical(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border p-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--line)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div
                    className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium inline-block mb-2"
                    style={{ background: `${selectedVertical.color}22`, color: selectedVertical.color }}
                  >
                    {selectedVertical.id.replace(/_/g, " ")}
                  </div>
                  <h3 className="text-[18px] font-semibold" style={{ color: "var(--cream)" }}>
                    {selectedVertical.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedVertical(null)}
                  className="p-1 rounded-md transition-all hover:opacity-70"
                  style={{ color: "var(--cream-mute)" }}
                >
                  <X size={16} />
                </button>
              </div>

              {(() => {
                const tmpl = templates.find((t) => t.vertical === selectedVertical.id);
                if (!tmpl) return (
                  <div className="text-[12px] py-6 text-center" style={{ color: "var(--cream-mute)" }}>
                    No template defined for this vertical yet.
                  </div>
                );
                return (
                  <>
                    <div className="mb-4">
                      <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Template</div>
                      <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{tmpl.name}</div>
                      <div className="text-[12px]" style={{ color: "var(--cream-soft)" }}>{tmpl.scope}</div>
                    </div>

                    <div className="mb-4">
                      <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Deliverables</div>
                      <ul className="space-y-1">
                        {tmpl.deliverables.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--cream)" }}>
                            <CheckCircle size={12} style={{ color: "var(--emerald)", marginTop: 2 }} />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Pricing Tiers</div>
                      <div className="grid grid-cols-2 gap-2">
                        {TIER_ORDER.map((t) => {
                          const p = tmpl.pricing[t];
                          if (!p) return null;
                          const meta = TIER_META[t];
                          return (
                            <div
                              key={t}
                              className="p-2.5 rounded-md border"
                              style={{ background: "rgba(243, 235, 218, 0.03)", borderColor: "var(--line-soft)" }}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                                <span className="text-[11px] font-semibold" style={{ color: "var(--cream)" }}>{meta.label}</span>
                              </div>
                              <div className="text-[14px] font-bold tabular-nums" style={{ color: meta.color }}>{fmtMoney(p.monthly)}/mo</div>
                              <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{fmtMoney(p.annual)}/yr</div>
                              <div className="text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>{p.scope}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--cream-mute)" }}>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {tmpl.timeline}
                      </span>
                      {tmpl.proofPacketRequired && (
                        <span className="flex items-center gap-1" style={{ color: "var(--gold)" }}>
                          <Award size={11} /> ProofPacket required
                        </span>
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="flex gap-2 mt-4">
                <Link
                  href={`/agency/proposals/new?vertical=${selectedVertical.id}`}
                  className="flex-1 px-3 py-2 rounded-md text-[12px] font-medium flex items-center justify-center gap-2"
                  style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
                >
                  <Wand2 size={13} /> Generate Proposal
                </Link>
                <button
                  onClick={() => setSelectedVertical(null)}
                  className="px-3 py-2 rounded-md text-[12px] font-medium border"
                  style={{ borderColor: "var(--line)", color: "var(--cream)" }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
