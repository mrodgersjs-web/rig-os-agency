"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, ArrowUpRight, BarChart3,
  Briefcase, Building2, CheckCircle2, ChevronRight, Clock, DollarSign,
  ExternalLink, Filter, Flame, Mail, MailCheck, MailOpen, MailPlus,
  PieChart as PieChartIcon, RefreshCw, Search, Send, Sparkles, Target,
  TrendingUp, Users, Zap, GitBranch, Layers, Award, Calendar, ArrowRight,
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

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

interface GTMConfig {
  verticals: string[];
  targetARR: number;
  currentARR: number;
  pipelineTarget: number;
  profilesPerNight: number;
  cadenceDays: number[];
  antiGenericThreshold: number;
  emailSuccessThreshold: number;
}

interface PipelineMetrics {
  totalLeads: number;
  enriched: number;
  contacted: number;
  engaged: number;
  meetingsBooked: number;
  proposalsSent: number;
  contractsSigned: number;
  pipelineValue: number;
  conversionRate: number;
  avgDealSize: number;
  daysToClose: number;
  antiGenericScore: number;
  emailSuccessRate: number;
  replyRate: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  color: string;
}

interface GTMHealth {
  score: number;
  status: string;
  issues: string[];
}

interface GTMComponent {
  id: string;
  name: string;
  loopNumber: number;
  group: string;
  anchor: string;
  gate: string;
  emits: string;
  status: string;
}

interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  painPoints: string[];
  score: number;
  stage: string;
  source: string;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  meetingsBooked: number;
  proposalsSent: number;
  contractsSigned: number;
  value: number;
}

interface GTMData {
  config: GTMConfig;
  metrics: PipelineMetrics;
  funnel: FunnelStage[];
  health: GTMHealth;
  components: GTMComponent[];
  leads: Lead[];
  totalLeads: number;
  pipelineValue: number;
  arrProgress: number;
  pipelineProgress: number;
}

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  enriched: "Enriched",
  contacted: "Contacted",
  engaged: "Engaged",
  meeting_booked: "Meeting",
  proposal_sent: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  nurture: "Nurture",
};

const STAGE_COLORS: Record<string, string> = {
  prospect: "#4a9eff",
  enriched: C.emerald,
  contacted: "#fbbf24",
  engaged: "#c084fc",
  meeting_booked: "#f97316",
  proposal_sent: "#ec4899",
  negotiation: "#8b5cf6",
  closed_won: "#10b981",
  closed_lost: "#ef4444",
  nurture: C.text3,
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function HealthRing({ score, status }: { score: number; status: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = status === "HEALTHY" ? C.emerald : status === "AT RISK" ? C.gold : "#ef4444";

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={C.border}
          strokeWidth="8"
        />
        <motion.circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[28px] font-bold" style={{ color }}>{score}</div>
        <div className="text-[9px] uppercase tracking-[0.2em]" style={{ color: C.text3 }}>{status}</div>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    LinkedIn: { bg: "rgba(74, 158, 255, 0.15)", fg: "#4a9eff" },
    Referral: { bg: "rgba(90, 184, 150, 0.15)", fg: C.emerald },
    "Cold Email": { bg: "rgba(212, 165, 116, 0.15)", fg: C.gold },
    Apify: { bg: "rgba(196, 96, 126, 0.15)", fg: C.plum },
    Exa: { bg: "rgba(139, 92, 246, 0.15)", fg: "#8b5cf6" },
  };
  const c = colors[source] || { bg: C.border, fg: C.text2 };
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      {source}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? C.emerald : score >= 75 ? C.gold : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: C.bgMid }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[11px] font-mono font-semibold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function GTMPipelineCommand() {
  const [data, setData] = useState<GTMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await fetch("/api/agency/gtm", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
      setLastFetch(new Date());
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load GTM data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(() => load(true), 60_000);
    return () => clearInterval(i);
  }, [load]);

  const sources = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.leads.forEach((l) => l.source && set.add(l.source));
    return Array.from(set).sort();
  }, [data]);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    return data.leads.filter((l) => {
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.industry.toLowerCase().includes(q) ||
          (l.painPoints || []).some((p) => p.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [data, search, stageFilter, sourceFilter]);

  const totalFilteredValue = useMemo(
    () => filteredLeads.reduce((sum, l) => sum + (l.value || 0), 0),
    [filteredLeads]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center" style={{ background: C.bg }}>
        <div className="text-center">
          <div className="text-[14px] animate-pulse" style={{ color: C.gold }}>
            Loading GTM Pipeline Command…
          </div>
          <div className="text-[11px] mt-2" style={{ color: C.textMute }}>
            Resolving 50-loop fleet · lead scoring · funnel metrics
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] grid place-items-center" style={{ background: C.bg }}>
        <div className="rounded-xl p-6 border max-w-md" style={{ background: C.card, borderColor: "#ef444460" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} color="#ef4444" />
            <div className="text-[14px] font-semibold" style={{ color: "#ef4444" }}>
              GTM Command Unavailable
            </div>
          </div>
          <div className="text-[12px]" style={{ color: C.text2 }}>
            {error || "Failed to load GTM pipeline data."}
          </div>
          <button
            onClick={() => load(true)}
            className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px]"
            style={{ background: C.elev, color: C.gold, border: `1px solid ${C.gold}60` }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const m = data.metrics;
  const h = data.health;
  const totalFunnel = data.funnel.reduce((sum, f) => sum + f.count, 0) || 1;
  const maxFunnelCount = Math.max(...data.funnel.map((f) => f.count), 1);

  return (
    <div className="min-h-screen pb-20" style={{ background: C.bg, color: C.text }}>
      <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-8">
        {/* Header */}
        <motion.header {...fadeUp} transition={{ duration: 0.4 }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="grid place-items-center w-9 h-9 rounded-lg"
              style={{ background: `${C.gold}1a`, border: `1px solid ${C.gold}40` }}
            >
              <Flame size={16} color={C.gold} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.gold, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
                GTM Studio V2 · Lead → Closed Won
              </div>
              <h1
                className="text-[28px] tracking-tight mt-0.5"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: C.text }}
              >
                GTM Pipeline Command
              </h1>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] max-w-2xl" style={{ color: C.text2 }}>
              Real-time view of {data.totalLeads} scored leads moving through the 10-vertical funnel.
              AntiGeneric ≥ {data.config.antiGenericThreshold} · Email success ≥ {Math.round(data.config.emailSuccessThreshold * 100)}% · {data.config.profilesPerNight} profiles/night cadence.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border transition disabled:opacity-50"
                style={{ borderColor: C.border, color: C.text2, background: C.card }}
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Syncing…" : "Refresh"}
              </button>
              <span className="text-[10px]" style={{ color: C.textMute }}>
                {lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : "—"}
              </span>
            </div>
          </div>
        </motion.header>

        {/* Hero KPIs */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            {
              label: "Pipeline Value",
              value: formatCurrency(m.pipelineValue),
              sub: `${data.pipelineProgress.toFixed(1)}% of ${formatCurrency(data.config.pipelineTarget)} target`,
              icon: DollarSign,
              color: C.gold,
            },
            {
              label: "Active Leads",
              value: formatNumber(m.totalLeads),
              sub: `${m.enriched} enriched · ${m.contacted} contacted`,
              icon: Users,
              color: C.emerald,
            },
            {
              label: "Closed Won",
              value: formatNumber(m.contractsSigned),
              sub: `${m.proposalsSent} proposals in flight`,
              icon: Award,
              color: C.plum,
            },
            {
              label: "ARR Progress",
              value: `${data.arrProgress.toFixed(1)}%`,
              sub: `${formatCurrency(data.config.currentARR)} of ${formatCurrency(data.config.targetARR)}`,
              icon: Target,
              color: C.gold,
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              className="rounded-xl p-4 border"
              style={{ background: C.card, borderColor: C.border }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: C.textMute }}>
                  {kpi.label}
                </span>
                <kpi.icon size={14} style={{ color: kpi.color }} />
              </div>
              <div className="text-[24px] font-bold mb-0.5" style={{ color: kpi.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {kpi.value}
              </div>
              <div className="text-[10px]" style={{ color: C.textMute }}>{kpi.sub}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* ARR Progress Bar */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl p-5 border mb-6"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: C.textMute }}>
                $10M ARR Trajectory
              </div>
              <div className="text-[18px] font-semibold mt-0.5" style={{ color: C.text }}>
                {formatCurrency(data.config.currentARR)} / {formatCurrency(data.config.targetARR)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[28px] font-bold" style={{ color: C.gold }}>
                {data.arrProgress.toFixed(2)}%
              </div>
              <div className="text-[10px]" style={{ color: C.textMute }}>
                Gap: {formatCurrency(data.config.targetARR - data.config.currentARR)}
              </div>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: C.bgMid }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(data.arrProgress, 100)}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.emerald})` }}
            />
          </div>
        </motion.section>

        {/* Funnel + Health */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6"
        >
          {/* Funnel */}
          <div className="lg:col-span-2 rounded-xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: C.text }}>
                <BarChart3 size={14} color={C.gold} /> Conversion Funnel
              </h2>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textMute }}>
                {data.totalLeads} leads
              </span>
            </div>
            <div className="space-y-2.5">
              {data.funnel.map((stage, i) => {
                const pctOfMax = (stage.count / maxFunnelCount) * 100;
                const pctOfTotal = (stage.count / totalFunnel) * 100;
                const dropOff = i > 0 ? data.funnel[i - 1].count - stage.count : 0;
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] capitalize font-medium" style={{ color: C.text2 }}>
                        {stage.stage}
                      </span>
                      <div className="flex items-center gap-3">
                        {dropOff > 0 && (
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: "#ef4444" }}>
                            <ArrowDown size={9} /> {dropOff}
                          </span>
                        )}
                        <span className="text-[11px] tabular-nums" style={{ color: C.textMute }}>
                          {pctOfTotal.toFixed(0)}%
                        </span>
                        <span className="text-[11px] font-semibold tabular-nums w-8 text-right" style={{ color: C.text }}>
                          {stage.count}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.bgMid }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctOfMax}%` }}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: stage.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Health */}
          <div className="rounded-xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: C.text }}>
                <Activity size={14} color={C.emerald} /> Pipeline Health
              </h2>
            </div>
            <div className="flex flex-col items-center mb-4">
              <HealthRing score={h.score} status={h.status} />
            </div>
            {h.issues.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>
                  Open Issues ({h.issues.length})
                </div>
                {h.issues.map((issue, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-md text-[11px]"
                    style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}30` }}
                  >
                    <AlertTriangle size={11} color={C.gold} className="shrink-0 mt-0.5" />
                    <span style={{ color: C.text2 }}>{issue}</span>
                  </div>
                ))}
              </div>
            )}
            {h.issues.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-md" style={{ background: `${C.emerald}10`, border: `1px solid ${C.emerald}40` }}>
                <CheckCircle2 size={14} color={C.emerald} />
                <span className="text-[11px]" style={{ color: C.emerald }}>
                  All gates passing
                </span>
              </div>
            )}
          </div>
        </motion.section>

        {/* Performance Metrics */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            {
              label: "Email Success",
              value: `${m.emailSuccessRate.toFixed(1)}%`,
              sub: `Gate: ≥${Math.round(data.config.emailSuccessThreshold * 100)}%`,
              color: m.emailSuccessRate >= data.config.emailSuccessThreshold * 100 ? C.emerald : "#ef4444",
              icon: MailCheck,
            },
            {
              label: "Reply Rate",
              value: `${m.replyRate.toFixed(1)}%`,
              sub: "Industry avg: 8-12%",
              color: m.replyRate >= 15 ? C.emerald : C.gold,
              icon: MailOpen,
            },
            {
              label: "AntiGeneric",
              value: `${m.antiGenericScore}`,
              sub: `Threshold: ≥${data.config.antiGenericThreshold}`,
              color: m.antiGenericScore >= data.config.antiGenericThreshold ? C.emerald : "#ef4444",
              icon: Sparkles,
            },
            {
              label: "Avg Deal Size",
              value: formatCurrency(m.avgDealSize),
              sub: `${m.daysToClose}d avg close`,
              color: C.gold,
              icon: TrendingUp,
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className="rounded-xl p-4 border"
              style={{ background: C.card, borderColor: C.border }}
            >
              <div className="flex items-center justify-between mb-2">
                <kpi.icon size={13} style={{ color: kpi.color }} />
                <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textMute }}>
                  {kpi.label}
                </span>
              </div>
              <div className="text-[22px] font-bold mb-0.5" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
              <div className="text-[10px]" style={{ color: C.textMute }}>{kpi.sub}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* GTM Loops Status */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-xl p-5 border mb-6"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: C.text }}>
              <GitBranch size={14} color={C.plum} /> GTM Fleet · 50-Loop Components
            </h2>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textMute }}>
              {data.components.length} loops active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {data.components.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.03 }}
                className="rounded-lg p-3 border"
                style={{ background: C.bgMid, borderColor: C.border }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono" style={{ color: C.gold }}>
                    #{c.loopNumber}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: `${C.emerald}20`, color: C.emerald }}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="text-[12px] font-medium mb-1 truncate" style={{ color: C.text }} title={c.name}>
                  {c.name}
                </div>
                <div className="text-[9.5px] flex items-center gap-1.5" style={{ color: C.textMute }}>
                  <span className="truncate" title={c.gate}>{c.gate}</span>
                  <span>·</span>
                  <span>{c.anchor}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Lead Browser */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl p-5 border"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: C.text }}>
              <Users size={14} color={C.blue} /> Lead Browser
            </h2>
            <div className="flex items-center gap-3 text-[11px]" style={{ color: C.textMute }}>
              <span><span className="font-mono font-semibold" style={{ color: C.text }}>{filteredLeads.length}</span> shown</span>
              <span>·</span>
              <span><span className="font-mono font-semibold" style={{ color: C.gold }}>{formatCurrency(totalFilteredValue)}</span> weighted</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border flex-1 min-w-[200px] max-w-md" style={{ background: C.bgMid, borderColor: C.border }}>
              <Search size={13} style={{ color: C.textMute }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, company, pain point…"
                className="flex-1 bg-transparent outline-none text-[12px]"
                style={{ color: C.text }}
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-1.5 rounded-md text-[12px] border"
              style={{ background: C.bgMid, borderColor: C.border, color: C.text2 }}
            >
              <option value="all">All stages</option>
              {Object.entries(STAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-md text-[12px] border"
              style={{ background: C.bgMid, borderColor: C.border, color: C.text2 }}
            >
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Lead table */}
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Lead", "Company / Industry", "Stage", "Source", "Score", "Email Stats", "Value"].map((h) => (
                    <th key={h} className="text-left py-2 px-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: C.textMute }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l) => {
                  const stageColor = STAGE_COLORS[l.stage] || C.text3;
                  return (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedLead(l)}
                      className="cursor-pointer transition hover:bg-white/[0.02]"
                      style={{ borderBottom: `1px solid ${C.border}` }}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-md grid place-items-center text-[10px] font-bold shrink-0"
                            style={{ background: `${stageColor}1a`, color: stageColor, border: `1px solid ${stageColor}40` }}
                          >
                            {l.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12px] font-medium truncate" style={{ color: C.text }}>
                              {l.name}
                            </div>
                            <div className="text-[10px] truncate" style={{ color: C.textMute }}>{l.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-[12px]" style={{ color: C.text2 }}>{l.company}</div>
                        <div className="text-[10px]" style={{ color: C.textMute }}>{l.industry}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ background: `${stageColor}1a`, color: stageColor, border: `1px solid ${stageColor}40` }}
                        >
                          {STAGE_LABELS[l.stage] || l.stage}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <SourceBadge source={l.source} />
                      </td>
                      <td className="py-3 px-2">
                        <ScoreBar score={l.score} />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: C.text3 }}>
                          <span title="Sent"><Send size={10} className="inline mr-0.5" />{l.emailsSent}</span>
                          <span title="Opened"><MailOpen size={10} className="inline mr-0.5" />{l.emailsOpened}</span>
                          <span title="Replied" style={{ color: C.emerald }}><MailCheck size={10} className="inline mr-0.5" />{l.emailsReplied}</span>
                          <span title="Meetings"><Calendar size={10} className="inline mr-0.5" />{l.meetingsBooked}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-[13px] font-semibold tabular-nums" style={{ color: C.gold }}>
                          {formatCurrency(l.value)}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[12px]" style={{ color: C.textMute }}>
                      No leads match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Footer Doctrine */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-xl p-4 border flex items-center justify-between"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center gap-3">
            <Sparkles size={14} color={C.gold} />
            <div className="text-[11px]" style={{ color: C.text2 }}>
              <span style={{ color: C.gold }} className="font-mono font-semibold">Prime Directive:</span>{" "}
              Code owns decisions. LLMs assist transformation. Gates decide if it ships. <span style={{ color: C.gold }}>ProofPacket</span> or it did not happen.
            </div>
          </div>
          <div className="text-[10px] font-mono" style={{ color: C.textMute }}>
            /api/agency/gtm · {data.totalLeads} leads · {formatCurrency(m.pipelineValue)} pipeline
          </div>
        </motion.div>
      </div>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLead(null)}
            className="fixed inset-0 z-50 grid place-items-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              style={{ background: C.bgMid, borderColor: C.borderHot }}
            >
              {(() => {
                const l = selectedLead;
                const stageColor = STAGE_COLORS[l.stage] || C.text3;
                return (
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-12 h-12 rounded-xl grid place-items-center text-[14px] font-bold"
                          style={{ background: `${stageColor}1a`, color: stageColor, border: `1px solid ${stageColor}40` }}
                        >
                          {l.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                        </div>
                        <div>
                          <div className="text-[18px] font-semibold" style={{ color: C.text }}>
                            {l.name}
                          </div>
                          <div className="text-[12px]" style={{ color: C.text3 }}>
                            {l.title} · {l.company}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                              style={{ background: `${stageColor}1a`, color: stageColor, border: `1px solid ${stageColor}40` }}
                            >
                              {STAGE_LABELS[l.stage] || l.stage}
                            </span>
                            <SourceBadge source={l.source} />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedLead(null)}
                        className="text-[20px] w-8 h-8 rounded-md grid place-items-center"
                        style={{ color: C.textMute, background: C.card }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Score + Value */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
                        <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Lead Score</div>
                        <div className="text-[22px] font-bold" style={{ color: l.score >= 85 ? C.emerald : l.score >= 75 ? C.gold : "#ef4444" }}>
                          {l.score}
                        </div>
                      </div>
                      <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
                        <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Deal Value</div>
                        <div className="text-[22px] font-bold" style={{ color: C.gold }}>
                          {formatCurrency(l.value)}
                        </div>
                      </div>
                      <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
                        <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Industry</div>
                        <div className="text-[14px] font-semibold" style={{ color: C.text }}>
                          {l.industry}
                        </div>
                      </div>
                    </div>

                    {/* Pain Points */}
                    <div className="mb-5">
                      <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.textMute }}>
                        Pain Points
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {l.painPoints.map((p, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-3 py-1 rounded-md"
                            style={{ background: `${C.rust}15`, color: C.rust, border: `1px solid ${C.rust}40` }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="mb-5">
                      <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.textMute }}>
                        Engagement Funnel
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { label: "Sent", val: l.emailsSent, icon: Send, color: C.text2 },
                          { label: "Opened", val: l.emailsOpened, icon: MailOpen, color: C.blue },
                          { label: "Replied", val: l.emailsReplied, icon: MailCheck, color: C.emerald },
                          { label: "Meetings", val: l.meetingsBooked, icon: Calendar, color: C.gold },
                          { label: "Proposals", val: l.proposalsSent, icon: FileText, color: C.plum },
                          { label: "Won", val: l.contractsSigned, icon: Award, color: C.emerald },
                        ].map((s, i) => (
                          <div key={i} className="rounded-md p-2.5 border" style={{ background: C.card, borderColor: C.border }}>
                            <s.icon size={12} className="mb-1" style={{ color: s.color }} />
                            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.textMute }}>{s.label}</div>
                            <div className="text-[16px] font-bold tabular-nums" style={{ color: s.color }}>
                              {s.val}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                      <div className="text-[10px] font-mono" style={{ color: C.textMute }}>
                        {l.id} · 50-loop · {data.components.length} active components
                      </div>
                      <a
                        href="/agency/email-tracking"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
                        style={{ background: `${C.gold}1a`, color: C.gold, border: `1px solid ${C.gold}40` }}
                      >
                        Open email track <ArrowUpRight size={11} />
                      </a>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
