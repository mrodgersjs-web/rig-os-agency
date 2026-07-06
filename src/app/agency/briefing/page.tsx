"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, RefreshCw, Moon, Sun, Mail, DollarSign, TrendingUp,
  Server, Cpu, AlertTriangle, AlertCircle, CheckCircle2, Heart,
  Database, Cloud, Activity, Zap, Target, Calendar,
  ChevronDown, ChevronRight, Search,
  Flame, BookOpen, KeyRound, Clock,
  Users, Briefcase, ListChecks, Code,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// Midnight Aubergine — Daily Briefing Command
// Wires /api/agency/jarvis (overnight work, GTM Studio V2, revenue, launchd,
// infra, builds, system, connections, obsidian, cron, github, seed-data,
// path-to-10m, love-text) + /api/agency/briefing (priorities, spend, social).
// The "good morning" page Mike opens first each day.
// ────────────────────────────────────────────────────────────────────────

interface JarvisItem {
  text?: string;
  name?: string;
  value?: string | number;
  label?: string;
  status?: string;
  priority?: string;
  note?: string;
}

interface JarvisSection {
  id: string;
  title: string;
  icon: string;
  summary: string;
  real: boolean;
  items: JarvisItem[];
}

interface JarvisTruth {
  realRevenue: number;
  realClients: number;
  realContracts: number;
  realPipeline: number;
  realProspects: number;
  realEmailsSent: number;
  seedDataInDB: number;
  seedDataLabel: string;
}

interface JarvisData {
  timestamp: string;
  date: string;
  greeting: string;
  _truth: JarvisTruth;
  sections: JarvisSection[];
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const ICONS: Record<string, any> = {
  moon: Moon,
  sun: Sun,
  mail: Mail,
  "dollar-sign": DollarSign,
  server: Server,
  "trending-up": TrendingUp,
  "alert-triangle": AlertTriangle,
  heart: Heart,
  "book-open": BookOpen,
  clock: Clock,
  github: Code,
  activity: Activity,
  target: Target,
  zap: Zap,
  "trending": TrendingUp,
  cpu: Cpu,
  database: Database,
  plug: KeyRound,
  camera: Activity,
  hammer: TrendingUp,
  scissors: TrendingUp,
};

function formatBig(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

export default function BriefingCommand() {
  const [jarvis, setJarvis] = useState<JarvisData | null>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("overnight");
  const [tick, setTick] = useState(0);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [j, b] = await Promise.all([
        fetch("/api/agency/jarvis", { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
        fetch("/api/agency/briefing", { cache: "no-store" }).then((r) => r.ok ? r.json() : null),
      ]);
      if (j) setJarvis(j);
      if (b) setBriefing(b);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "fetch failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 60_000);
    const tickId = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { clearInterval(id); clearInterval(tickId); };
  }, []);

  // Pull truthy fields
  const truth = jarvis?._truth;
  const sections = jarvis?.sections ?? [];
  const overnight = sections.find((s) => s.id === "overnight");
  const gtm = sections.find((s) => s.id === "gtm-studio");
  const revenue = sections.find((s) => s.id === "revenue");
  const nextSteps = sections.find((s) => s.id === "next-steps");
  const launchd = sections.find((s) => s.id === "launchd");
  const infra = sections.find((s) => s.id === "infra");
  const builds = sections.find((s) => s.id === "builds");
  const system = sections.find((s) => s.id === "system");
  const connections = sections.find((s) => s.id === "connections");
  const obsidian = sections.find((s) => s.id === "obsidian");
  const cron = sections.find((s) => s.id === "cron");
  const github = sections.find((s) => s.id === "github");
  const seed = sections.find((s) => s.id === "seed-data");
  const pathTo10M = sections.find((s) => s.id === "path-to-10m");
  const loveText = sections.find((s) => s.id === "love-text");

  const briefingPriorities = briefing?.sections?.priorities?.items ?? [];
  const briefingSpend = briefing?.sections?.spend?.items ?? [];
  const briefingLoveTest = briefing?.sections?.loveTest?.items ?? [];
  const briefingSocial = briefing?.sections?.socialMedia?.items ?? [];
  const briefingScraping = briefing?.sections?.scraping?.items ?? [];
  const briefingMeta = briefing?.sections?.metaHarness?.items ?? [];
  const revenueKpis = briefing?.sections?.revenue?.kpis ?? {};
  const pipelineItems = briefing?.sections?.pipeline?.items ?? [];
  const fleetData = briefing?.sections?.fleet ?? {};
  const cronItems = briefing?.sections?.cron?.items ?? [];
  const clientList = briefing?.sections?.clients?.items ?? [];

  // KPI calculations
  const realArr = truth?.realRevenue ?? 0;
  const targetArr = 10_000_000;
  const arrPct = pct(realArr, targetArr);
  const realEmails = truth?.realEmailsSent ?? 0;
  const realProspects = truth?.realProspects ?? 0;
  const seedRecords = truth?.seedDataInDB ?? 0;
  const activeLaunchdMatch = launchd?.items?.find((i) => i.label === "Active (running)");
  const totalLaunchdMatch = launchd?.items?.find((i) => i.label === "Total Loaded");
  const failedLaunchdMatch = launchd?.items?.find((i) => i.label === "Failed");
  const activeLaunchd = typeof activeLaunchdMatch?.value === "string" ? parseInt(activeLaunchdMatch.value) || 0 : 0;
  const totalLaunchd = typeof totalLaunchdMatch?.value === "string" ? parseInt(totalLaunchdMatch.value) || 0 : 0;
  const failedLaunchd = typeof failedLaunchdMatch?.value === "string" ? parseInt(failedLaunchdMatch.value) || 0 : 0;
  const launchdPct = pct(activeLaunchd, totalLaunchd);
  const connectedKeys = connections?.items?.filter((i: any) => i.status === "connected").length ?? 0;
  const totalKeys = connections?.items?.length ?? 0;
  const obsidianFiles = obsidian?.items?.find((i) => i.label === "Vault Files")?.value ?? 0;
  const cronCount = cron?.items?.length ?? 0;
  const overnightCommits = overnight?.items?.length ?? 0;
  const fleetTotal = (fleetData as any).total ?? 0;
  const fleetActive = (fleetData as any).active ?? 0;
  const byCat = (fleetData as any).byCategory ?? {};

  // Health ring
  const healthPct = launchdPct;
  const healthTier = healthPct >= 70 ? { label: "Healthy",  color: "#10b981" } :
                     healthPct >= 40 ? { label: "Degraded", color: "var(--gold-soft)" } :
                                       { label: "Critical", color: "var(--plum)" };

  // KPIs
  const kpis = [
    { label: "Real ARR",       value: formatBig(realArr),          sub: `${arrPct.toFixed(2)}% of $10M target`, icon: DollarSign, color: realArr > 0 ? "#10b981" : "var(--plum)" },
    { label: "Real Clients",   value: truth?.realClients ?? 0,       sub: `${seedRecords} sample in DB`,          icon: Users,      color: truth?.realClients ? "#10b981" : "var(--cream-dim)" },
    { label: "Emails Sent",    value: realEmails,                   sub: `${realProspects} prospects scraped`,    icon: Mail,       color: "var(--gold-soft)" },
    { label: "Launchd Active", value: `${activeLaunchd}/${totalLaunchd}`, sub: `${failedLaunchd} failed`,     icon: Server,     color: healthTier.color },
    { label: "Fleet",          value: fleetActive,                  sub: `${fleetTotal} total agents`,            icon: Cpu,        color: "#a855f7" },
    { label: "Vault Notes",    value: obsidianFiles,                sub: `${cronCount} cron jobs`,                icon: BookOpen,   color: "var(--cream)" },
    { label: "Overnight",      value: `${overnightCommits}c`,        sub: "commits last 24h",                     icon: Code,       color: "#22d3ee" },
    { label: "API Keys",       value: `${connectedKeys}/${totalKeys}`, sub: `${totalKeys - connectedKeys} missing`, icon: KeyRound, color: connectedKeys > totalKeys / 2 ? "#10b981" : "var(--plum)" },
  ];

  // Health ring
  const ringR = 60;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (ringC * healthPct) / 100;

  // Priority color helper
  const priorityStyle = (p?: string) => {
    switch ((p || "").toUpperCase()) {
      case "DONE": return { color: "#10b981", bg: "rgba(16,185,129,0.12)" };
      case "HIGH":
      case "TODAY": return { color: "var(--plum)", bg: "rgba(196,96,126,0.12)" };
      case "MEDIUM":
      case "Q3":
      case "Q4": return { color: "var(--gold-soft)", bg: "rgba(212,165,116,0.12)" };
      case "WARNING":
      case "RED": return { color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
      case "INFO":
      case "TRUTH": return { color: "var(--cream-dim)", bg: "rgba(165,151,131,0.12)" };
      case "ACTION": return { color: "var(--gold)", bg: "rgba(212,165,116,0.14)" };
      case "GREEN": return { color: "#10b981", bg: "rgba(16,185,129,0.10)" };
      case "YELLOW": return { color: "#fbbf24", bg: "rgba(251,191,36,0.10)" };
      default: return { color: "var(--cream-dim)", bg: "rgba(165,151,131,0.10)" };
    }
  };

  // Build next-steps checklist
  const nextStepItems = (nextSteps?.items ?? []).filter((i: any) => i.text);

  // Path to 10M phases
  const pathItems = (pathTo10M?.items ?? []).filter((i: any) => i.text);

  // Pipeline deals
  const filteredPipeline = useMemo(() => {
    if (!search) return pipelineItems;
    const q = search.toLowerCase();
    return pipelineItems.filter((p: any) => JSON.stringify(p).toLowerCase().includes(q));
  }, [pipelineItems, search]);

  return (
    <div className="space-y-6 pb-12" style={{ background: "var(--bg-deep)", minHeight: "100vh" }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.header {...fadeUp} className="px-6 pt-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-2 rounded-lg"
                style={{ background: "rgba(212,165,116,0.12)", border: "1px solid rgba(212,165,116,0.3)" }}
              >
                <Sparkles size={22} style={{ color: "var(--gold-soft)" }} />
              </div>
              <span
                className="text-[10px] uppercase tracking-[0.2em] font-mono"
                style={{ color: "var(--cream-mute)" }}
              >
                Jake PAI · Good Morning
              </span>
            </div>
            <h1
              className="text-4xl font-semibold leading-none"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--cream)" }}
            >
              {jarvis?.greeting ?? "Good morning, Mike"}
            </h1>
            <p
              className="text-[13px] mt-2 max-w-2xl"
              style={{ color: "var(--cream-dim)" }}
            >
              {jarvis?.date ?? new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              {" · "}
              <span style={{ color: "var(--gold-soft)" }}>Daily Briefing</span>
              {" — overnight work, GTM studio state, revenue path, fleet health, priorities."}
              {error && <span className="ml-2" style={{ color: "var(--plum)" }}>— error: {error}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="text-[11px] px-3 py-1.5 rounded-md flex items-center gap-1.5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream-dim)" }}
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <span className="text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
              {jarvis?.timestamp ? new Date(jarvis.timestamp).toLocaleTimeString() : "—"} · auto 60s
            </span>
          </div>
        </div>
      </motion.header>

      {/* ── Seed Data Truth Banner ─────────────────────────────────────── */}
      {seed && (
        <motion.div {...fadeUp} transition={{ delay: 0.04 }} className="px-6">
          <div
            className="rounded-lg p-4 flex items-start gap-3"
            style={{
              background: "rgba(196,96,126,0.08)",
              border: "1px solid rgba(196,96,126,0.3)",
            }}
          >
            <AlertTriangle size={18} style={{ color: "var(--plum)" }} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--plum)" }}>
                {seed.title}
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>
                {seed.summary}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── KPI Strip + Health Ring ────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ delay: 0.05 }} className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="p-3 rounded-lg"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={14} style={{ color: s.color }} />
                    <span className="text-[9px] uppercase font-mono tracking-wider" style={{ color: "var(--cream-mute)" }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>
                    {s.value}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--cream-mute)" }}>{s.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Health Ring */}
          <div
            className="rounded-lg p-4 flex flex-col items-center justify-center"
            style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono mb-2" style={{ color: "var(--cream-mute)" }}>
              Fleet Health
            </div>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--line-soft)" strokeWidth="10" />
              <motion.circle
                cx="70" cy="70" r={ringR} fill="none"
                stroke={healthTier.color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={ringC}
                initial={{ strokeDashoffset: ringC }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                transform="rotate(-90 70 70)"
              />
              <text x="70" y="68" textAnchor="middle" fill={healthTier.color} fontSize="28" fontWeight="700" fontFamily="monospace">
                {healthPct}%
              </text>
              <text x="70" y="88" textAnchor="middle" fill="var(--cream-dim)" fontSize="10" fontFamily="monospace">
                {healthTier.label}
              </text>
            </svg>
            <div className="text-[10px] mt-2 text-center" style={{ color: "var(--cream-mute)" }}>
              {activeLaunchd} active · {failedLaunchd} failed
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Today's Priorities (from /api/agency/briefing) ──────────────── */}
      {briefingPriorities.length > 0 && (
        <motion.section {...fadeUp} transition={{ delay: 0.08 }} className="px-6">
          <div
            className="rounded-lg p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListChecks size={16} style={{ color: "var(--gold-soft)" }} />
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
                  Today's Top 10 Priorities
                </h2>
              </div>
              <span className="text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
                {briefingPriorities.length} items
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {briefingPriorities.slice(0, 10).map((item: string, i: number) => {
                const ps = priorityStyle("TODAY");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                    className="flex items-start gap-2.5 rounded p-2.5"
                    style={{ background: "var(--bg-mid)", border: "1px solid var(--line-soft)" }}
                  >
                    <div
                      className="w-6 h-6 rounded grid place-items-center text-[11px] font-bold font-mono shrink-0"
                      style={{ background: ps.bg, color: ps.color }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-[12px] leading-relaxed" style={{ color: "var(--cream)" }}>
                      {item}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Two-Column: GTM Studio V2 | Revenue Path ────────────────────── */}
      <motion.section {...fadeUp} transition={{ delay: 0.10 }} className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* GTM Studio V2 */}
          {gtm && (
            <div
              className="rounded-lg p-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Mail size={16} style={{ color: "var(--gold-soft)" }} />
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>GTM Studio V2</h2>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                >
                  Real Outreach
                </span>
              </div>
              <p className="text-[12px] mb-4" style={{ color: "var(--cream-dim)" }}>{gtm.summary}</p>
              <div className="grid grid-cols-2 gap-2">
                {gtm.items.filter((i) => i.label).map((it, i) => (
                  <div
                    key={i}
                    className="rounded p-2 flex items-center justify-between"
                    style={{ background: "var(--bg-mid)", border: "1px solid var(--line-soft)" }}
                  >
                    <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{it.label}</span>
                    <span className="text-[12px] font-mono font-semibold" style={{ color: "var(--gold-soft)" }}>
                      {typeof it.value === "number" ? it.value.toLocaleString() : it.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue Path to $10M */}
          {pathTo10M && (
            <div
              className="rounded-lg p-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} style={{ color: "#10b981" }} />
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>Path to $10M ARR</h2>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider"
                  style={{ background: "rgba(196,96,126,0.12)", color: "var(--plum)" }}
                >
                  0% — {formatBig(realArr)} of $10M
                </span>
              </div>
              <p className="text-[12px] mb-4" style={{ color: "var(--cream-dim)" }}>{pathTo10M.summary}</p>
              <div className="space-y-2">
                {pathItems.map((it: any, i: number) => {
                  const ps = priorityStyle(it.priority);
                  return (
                    <div
                      key={i}
                      className="rounded p-2.5 flex items-start gap-2.5"
                      style={{ background: "var(--bg-mid)", border: `1px solid ${ps.color}30` }}
                    >
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider shrink-0"
                        style={{ background: ps.bg, color: ps.color }}
                      >
                        {it.priority}
                      </span>
                      <span className="text-[11px] leading-relaxed" style={{ color: "var(--cream)" }}>{it.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* ── Next Steps (Action Checklist) ──────────────────────────────── */}
      {nextStepItems.length > 0 && (
        <motion.section {...fadeUp} transition={{ delay: 0.12 }} className="px-6">
          <div
            className="rounded-lg p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={16} style={{ color: "var(--plum)" }} />
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
                  What Needs to Happen to Get Real Revenue
                </h2>
              </div>
              <span className="text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
                {nextStepItems.filter((i: any) => i.priority === "DONE").length} done / {nextStepItems.length} total
              </span>
            </div>
            <p className="text-[12px] mb-4" style={{ color: "var(--cream-dim)" }}>{nextSteps?.summary}</p>
            <div className="space-y-1.5">
              {nextStepItems.map((it: any, i: number) => {
                const ps = priorityStyle(it.priority);
                const isDone = (it.priority || "").toUpperCase() === "DONE";
                return (
                  <div
                    key={i}
                    className="rounded p-2.5 flex items-start gap-2.5"
                    style={{ background: "var(--bg-mid)", border: "1px solid var(--line-soft)" }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={14} style={{ color: "#10b981" }} className="shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded border-2 shrink-0 mt-0.5" style={{ borderColor: ps.color }} />
                    )}
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider shrink-0"
                      style={{ background: ps.bg, color: ps.color }}
                    >
                      {it.priority}
                    </span>
                    <span
                      className="text-[12px] leading-relaxed flex-1"
                      style={{ color: isDone ? "var(--cream-mute)" : "var(--cream)", textDecoration: isDone ? "line-through" : "none" }}
                    >
                      {it.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Search Bar for Pipeline ────────────────────────────────────── */}
      {pipelineItems.length > 0 && (
        <motion.section {...fadeUp} transition={{ delay: 0.14 }} className="px-6">
          <div
            className="rounded-lg p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Briefcase size={16} style={{ color: "var(--gold-soft)" }} />
              <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>Pipeline & Jobs</h2>
              <span className="text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
                {filteredPipeline.length} of {pipelineItems.length} deals
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-2.5 top-2.5" style={{ color: "var(--cream-mute)" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients, verticals, stages…"
                  className="w-full pl-8 pr-3 py-2 rounded text-[12px]"
                  style={{
                    background: "var(--bg-mid)",
                    border: "1px solid var(--line-soft)",
                    color: "var(--cream)",
                  }}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ color: "var(--cream-mute)" }}>
                    <th className="text-left py-2 px-2 font-medium">Client</th>
                    <th className="text-left py-2 px-2 font-medium">Vertical</th>
                    <th className="text-right py-2 px-2 font-medium">Size</th>
                    <th className="text-right py-2 px-2 font-medium">Prob</th>
                    <th className="text-left py-2 px-2 font-medium">Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPipeline.map((p: any, i: number) => (
                    <tr
                      key={i}
                      className="border-t"
                      style={{ borderColor: "var(--line-soft)" }}
                    >
                      <td className="py-2 px-2 font-medium" style={{ color: "var(--cream)" }}>{p.client}</td>
                      <td className="py-2 px-2" style={{ color: "var(--cream-dim)" }}>{p.vertical}</td>
                      <td className="py-2 px-2 text-right font-mono" style={{ color: "var(--gold-soft)" }}>
                        {formatBig(p.size)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono" style={{ color: p.probability >= 50 ? "#10b981" : "var(--cream-dim)" }}>
                        {p.probability}%
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
                          style={{ background: "var(--bg-mid)", color: "var(--cream-dim)", border: "1px solid var(--line-soft)" }}
                        >
                          {p.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Collapsible Sections: Overnight · Launchd · Infra · Cron ────── */}
      <motion.section {...fadeUp} transition={{ delay: 0.16 }} className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[
            { s: overnight, accent: "var(--gold-soft)", icon: Moon, label: "Overnight Work" },
            { s: launchd,   accent: healthTier.color,    icon: Server, label: "Launchd Services" },
            { s: infra,     accent: "#10b981",          icon: Cloud, label: "Infrastructure" },
            { s: cron,      accent: "var(--cream-dim)",  icon: Clock, label: "Scheduled Jobs" },
            { s: connections, accent: "var(--plum)",    icon: KeyRound, label: "API Connections" },
            { s: system,    accent: "var(--cream)",      icon: Activity, label: "System Health" },
          ].filter((x) => x.s).map(({ s, accent, icon: Icon, label }) => {
            const isOpen = expandedSection === s!.id;
            const itemsWithLabel = (s!.items ?? []).filter((i) => i.label !== undefined);
            const itemsWithText = (s!.items ?? []).filter((i) => i.text !== undefined);
            return (
              <div
                key={s!.id}
                className="rounded-lg"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
              >
                <button
                  onClick={() => setExpandedSection(isOpen ? null : s!.id)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: accent }} />
                    <span className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>
                      {label}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: `${accent}20`, color: accent }}>
                      {s!.items?.length ?? 0}
                    </span>
                  </div>
                  {isOpen ? <ChevronDown size={14} style={{ color: "var(--cream-mute)" }} /> : <ChevronRight size={14} style={{ color: "var(--cream-mute)" }} />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-1.5">
                        {itemsWithLabel.length > 0 && (
                          <div className="grid grid-cols-2 gap-1.5">
                            {itemsWithLabel.map((it, i) => (
                              <div
                                key={i}
                                className="rounded p-2 flex items-center justify-between"
                                style={{ background: "var(--bg-mid)" }}
                              >
                                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{it.label}</span>
                                <span className="text-[11px] font-mono font-semibold" style={{ color: "var(--cream)" }}>
                                  {typeof it.value === "number" ? it.value.toLocaleString() : it.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {itemsWithText.length > 0 && (
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {itemsWithText.map((it, i) => (
                              <div
                                key={i}
                                className="rounded p-2 text-[11px] leading-relaxed"
                                style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}
                              >
                                {it.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ── Spend + Social + Love Test Row ─────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ delay: 0.18 }} className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Spend */}
          {briefingSpend.length > 0 && (
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={14} style={{ color: "#10b981" }} />
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>Spend Reduction</h3>
              </div>
              <div className="space-y-1.5">
                {briefingSpend.map((s: string, i: number) => (
                  <div
                    key={i}
                    className="rounded p-2 text-[11px] leading-relaxed flex items-start gap-2"
                    style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}
                  >
                    <AlertCircle size={10} className="shrink-0 mt-0.5" style={{ color: "#10b981" }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social */}
          {briefingSocial.length > 0 && (
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} style={{ color: "var(--gold-soft)" }} />
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>Social & Content</h3>
              </div>
              <div className="space-y-1.5">
                {briefingSocial.map((s: string, i: number) => (
                  <div
                    key={i}
                    className="rounded p-2 text-[11px] leading-relaxed"
                    style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Love Test */}
          {briefingLoveTest.length > 0 && (
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Heart size={14} style={{ color: "var(--plum)" }} />
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>Love Test — James</h3>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase"
                  style={{ background: "rgba(196,96,126,0.12)", color: "var(--plum)" }}
                >
                  Ready · Not Auto
                </span>
              </div>
              <div className="space-y-1.5">
                {briefingLoveTest.map((s: string, i: number) => (
                  <div
                    key={i}
                    className="rounded p-2 text-[11px] leading-relaxed flex items-start gap-2"
                    style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}
                  >
                    <Heart size={10} className="shrink-0 mt-0.5" style={{ color: "var(--plum)" }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* ── Doctrine Footer ────────────────────────────────────────────── */}
      <motion.footer {...fadeUp} transition={{ delay: 0.20 }} className="px-6 pt-2">
        <div
          className="rounded-lg p-3 flex items-center justify-between flex-wrap gap-2"
          style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
        >
          <div className="flex items-center gap-2">
            <Flame size={12} style={{ color: "var(--gold-soft)" }} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono" style={{ color: "var(--cream-mute)" }}>
              ProofPacket or it didn't happen · {overnightCommits} commits last 24h · {fleetTotal} agents · {cronCount} cron jobs
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
            <span>Sources: /api/agency/jarvis + /api/agency/briefing</span>
            <span>·</span>
            <span>Auto-refresh 60s</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
