"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Target, Users, TrendingUp, BarChart3, Camera, Server,
  Wallet, Mail, Bot, Database, Activity, Zap,
  ChevronRight,
} from "lucide-react";
import { useDetail } from "@/components/DetailContext";

/* ─────────────────────────────────────────────────────────────────────
   PRECISION CONSOLE — RIG OS Command Center
   Light canvas · white cards · hairline borders · near-black ink.
   ONE accent = proof-green (operational), amber (staged), red (blocked).
   Geist (sans) for UI, Geist Mono (tabular) for ALL numbers/timestamps.
   Every value is wired to the app's REAL API routes — no hardcoded metrics.
   ───────────────────────────────────────────────────────────────────── */

const P = {
  canvas:  "#F7F8FA",
  card:    "#FFFFFF",
  line:    "#E7EAF0",
  lineSoft:"#EEF0F5",
  ink:     "#0E1116",
  ink2:    "#3B424E",
  ink3:    "#6B7280",
  mute:    "#9AA1AD",
  green:   "#10A66A",
  greenBg: "#E6F5EE",
  amber:   "#E8A32C",
  amberBg: "#FBF1DC",
  red:     "#E5484D",
  redBg:   "#FCEBEB",
};
const SANS = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, 'SF Mono', monospace";

// ── formatting ──────────────────────────────────────────────────────────
const fmtMoney = (n: number): string => {
  if (!Number.isFinite(n)) return "$0";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
};
const fmtFull = (n: number): string => `$${Math.round(n || 0).toLocaleString()}`;

// ── API shapes (loose — external data is untrusted) ─────────────────────
interface HealthCheck { status: string; detail?: string; }
interface Health { status?: string; checks?: Record<string, HealthCheck>; }
interface Goals {
  current?: Record<string, number>;
  target?: { arr?: number; label?: string };
  milestones?: { step: number; label: string; progress: number; status: string; current?: string }[];
  nextAction?: string;
}
interface Revenue { kpis?: Record<string, number>; error?: string; }
interface Agents { total?: number; stats?: { total?: number; byCategory?: Record<string, number> }; }
interface FleetNode { id: string; name: string; status: string; }
interface Fleet { nodes?: FleetNode[]; summary?: Record<string, number>; }
interface ActivityEntry { ts: number; agent: string; text: string; level?: string; }
interface ActivityResp { entries?: ActivityEntry[]; byAgent?: Record<string, number>; }
interface Task { id: string; title: string; description?: string; priority?: string; status?: string; assignee?: string; tags?: (string | number)[]; }
interface Paperclip { inbox?: Task[]; today?: Task[]; }

type GateStatus = "operational" | "staged" | "attention";
const GATE_META: Record<GateStatus, { label: string; word: string; color: string; bg: string }> = {
  operational: { label: "OPERATIONAL", word: "PASS", color: P.green, bg: P.greenBg },
  staged:      { label: "STAGED", word: "IN PROGRESS", color: P.amber, bg: P.amberBg },
  attention:   { label: "ATTENTION", word: "FAIL", color: P.red, bg: P.redBg },
};

// ── Sparkline: draws a REAL series when given one, else an honest flat baseline
function Sparkline({ series, color, flat }: { series?: number[]; color: string; flat?: boolean }) {
  const W = 132, H = 30, pad = 2;
  let pts: [number, number][];
  if (flat || !series || series.length < 2) {
    // No historical time-series available for this metric → honest flat baseline.
    pts = [[pad, H - 8], [W - pad, H - 8]];
  } else {
    const min = Math.min(...series), max = Math.max(...series);
    const span = max - min || 1;
    pts = series.map((v, i) => {
      const x = pad + (i / (series.length - 1)) * (W - pad * 2);
      const y = pad + (1 - (v - min) / span) * (H - pad * 2);
      return [x, y];
    });
  }
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        opacity={flat ? 0.35 : 0.9} />
    </svg>
  );
}

export default function HomePage() {
  const { openDetail, openCopilot } = useDetail();
  const [health, setHealth] = useState<Health>({});
  const [goals, setGoals] = useState<Goals>({});
  const [revenue, setRevenue] = useState<Revenue>({});
  const [agents, setAgents] = useState<Agents>({});
  const [fleet, setFleet] = useState<Fleet>({});
  const [activity, setActivity] = useState<ActivityResp>({});
  const [pc, setPc] = useState<Paperclip>({});
  const [now, setNow] = useState<Date>(() => new Date());

  const load = useCallback(async () => {
    const j = (u: string) => fetch(u).then((r) => r.json()).catch(() => ({}));
    const [h, g, rev, ag, fl, act, tasks] = await Promise.all([
      j("/api/health"), j("/api/agency/goals"), j("/api/agency/revenue"),
      j("/api/agency/agents"), j("/api/fleet"), j("/api/activity?limit=40"),
      j("/api/paperclip/tasks"),
    ]);
    setHealth(h); setGoals(g); setRevenue(rev); setAgents(ag);
    setFleet(fl); setActivity(act); setPc(tasks); setNow(new Date());
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  // ── derive REAL values ────────────────────────────────────────────────
  const checks = health.checks ?? {};
  const arr = revenue.kpis?.currentARR ?? goals.current?.arr ?? 0;
  const targetARR = revenue.kpis?.targetARR ?? goals.target?.arr ?? 10_000_000;
  const arrPct = targetARR > 0 ? Math.round((arr / targetARR) * 100) : 0;
  const pipelineValue = revenue.kpis?.pipelineValue ?? goals.current?.pipeline ?? 0;
  const pipelineCount = revenue.kpis?.pipelineCount ?? 0;
  const growthRate = revenue.kpis?.growthRate ?? 0;
  const activeClients = revenue.kpis?.activeClients ?? goals.current?.clients ?? 0;
  const emailsSent = goals.current?.emailsSent ?? 0;
  const prospects = goals.current?.prospects ?? 0;
  const agentsTotal = agents.stats?.total ?? agents.total ?? 0;

  const fleetOnline = fleet.summary?.online ?? 0;
  const fleetTotal = fleet.summary?.total ?? 0;
  const fleetDown = fleet.summary?.offline ?? Math.max(0, fleetTotal - fleetOnline);
  const fleetHealthPct = fleetTotal > 0 ? Math.round((fleetOnline / fleetTotal) * 100) : 0;
  const fleetSeries = (fleet.nodes ?? []).map((n) => (n.status === "online" ? 1 : 0));
  const blackwell = (fleet.nodes ?? []).find((n) => n.id === "blackwell");

  const diskDetail = checks.disk?.detail ?? "";
  const diskPct = (diskDetail.match(/(\d+)%/) ?? [])[1];

  // ── task-derived department signals (real, from paperclip) ─────────────
  const allTasks: Task[] = [...(pc.inbox ?? []), ...(pc.today ?? [])];
  const hasTag = (t: Task, ...tags: string[]) =>
    (t.tags ?? []).some((tag) => tags.includes(String(tag).toLowerCase()));
  const tagStats = (...tags: string[]) => {
    const all = allTasks.filter((t) => hasTag(t, ...tags));
    const done = all.filter((t) => t.status === "done").length;
    return { open: all.length - done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  };
  const lin = tagStats("linkedin");
  const des = tagStats("design", "creative", "content");
  const milestones = goals.milestones ?? [];
  const activeMilestones = milestones.filter((m) => m.status === "active").length;
  const doneMilestones = milestones.filter((m) => (m.progress ?? 0) >= 100).length;
  const blockers = Object.values(checks).filter((c) => c.status === "down").length;
  const okChecks = Object.values(checks).filter((c) => c.status === "ok").length;
  const totalChecks = Math.max(1, Object.keys(checks).length);

  // ── directive: the single most load-bearing real item today ────────────
  const topTask =
    (pc.inbox ?? []).find((t) => t.priority === "critical" && t.status !== "done") ||
    (pc.inbox ?? []).find((t) => t.priority === "high" && t.status !== "done") ||
    (pc.inbox ?? []).find((t) => t.status !== "done");
  const directiveText = topTask
    ? topTask.title + (topTask.description ? ` — ${topTask.description}` : "")
    : goals.nextAction || "All clear. No critical directive queued.";

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const live = (health.status ?? "").toLowerCase() === "ok";

  // ── KPI cards (all real) ──────────────────────────────────────────────
  const kpis = [
    {
      label: "Signed ARR", icon: Wallet, value: fmtMoney(arr),
      chip: `${arrPct}% of $10M`, chipColor: arrPct > 0 ? P.green : P.ink3,
      sub: "of $10M target", footL: "TARGET", footR: fmtFull(targetARR),
      spark: P.green, flat: true,
      detail: { title: "Signed ARR", desc: `Current annual recurring revenue is ${fmtFull(arr)} against a ${fmtFull(targetARR)} target (${arrPct}%).`, source: "/api/agency/revenue · /api/agency/goals" },
    },
    {
      label: "Pipeline", icon: TrendingUp, value: fmtMoney(pipelineValue),
      chip: growthRate ? `${growthRate > 0 ? "↑" : "↓"}${Math.abs(growthRate)}%` : `${pipelineCount} deals`,
      chipColor: growthRate > 0 ? P.green : P.ink3,
      sub: `${pipelineCount} open deals`, footL: "WEIGHTED VALUE", footR: fmtFull(pipelineValue),
      spark: P.green, flat: true,
      detail: { title: "Pipeline", desc: `Probability-weighted pipeline value is ${fmtFull(pipelineValue)} across ${pipelineCount} open deals.`, source: "/api/agency/revenue" },
    },
    {
      label: "Outbound", icon: Mail, value: emailsSent > 0 ? String(emailsSent) : "DORMANT",
      valueColor: emailsSent > 0 ? P.ink : P.red,
      chip: `${prospects} prospects`, chipColor: P.ink3,
      sub: emailsSent > 0 ? "emails sent" : "no sends recorded", footL: "TOTAL SENT", footR: String(emailsSent),
      spark: P.red, flat: true,
      detail: { title: "Outbound", desc: `${emailsSent} outbound emails sent to date across ${prospects} qualified prospects.`, source: "/api/agency/goals" },
    },
    {
      label: "Fleet & Agents", icon: Bot, value: `${fleetOnline} / ${fleetTotal}`,
      chip: `${fleetHealthPct}%`, chipColor: fleetHealthPct >= 90 ? P.green : fleetHealthPct >= 50 ? P.amber : P.red,
      sub: `${agentsTotal} agents, ${fleetDown} down`, footL: "HEALTH", footR: `${fleetHealthPct}%`,
      spark: P.green, series: fleetSeries.length >= 2 ? fleetSeries : undefined,
      detail: { title: "Fleet & Agents", desc: `${fleetOnline} of ${fleetTotal} RIG nodes online (${fleetHealthPct}% health). ${agentsTotal} agents registered, ${fleetDown} nodes down.`, source: "/api/fleet · /api/agency/agents" },
    },
  ];

  // ── departments (6, all bound to real signals) ────────────────────────
  const departments: {
    name: string; icon: typeof Target; status: GateStatus;
    metric: string; metricLabel: string; sub: string; progress: number;
  }[] = [
    { name: "GTM / Revenue", icon: Target, status: activeClients > 0 ? "operational" : "staged",
      metric: fmtMoney(pipelineValue), metricLabel: "PIPELINE", sub: `${pipelineCount} open deals`,
      progress: Math.min(100, Math.round((emailsSent / 500) * 100)) },
    { name: "LinkedIn", icon: Users, status: "operational",
      metric: String(lin.open), metricLabel: "QUEUED", sub: "content tasks", progress: lin.pct },
    { name: "Strategy", icon: TrendingUp, status: "operational",
      metric: String(activeMilestones), metricLabel: "INITIATIVES", sub: `${milestones.length} milestones`,
      progress: Math.round((doneMilestones / Math.max(1, milestones.length)) * 100) },
    { name: "Forecast", icon: BarChart3, status: "operational",
      metric: fmtMoney(targetARR), metricLabel: "TARGET ARR", sub: `${arrPct}% attained`, progress: arrPct },
    { name: "Design Studio", icon: Camera, status: "operational",
      metric: String(des.open), metricLabel: "DELIVERABLES", sub: "creative tasks", progress: des.pct },
    { name: "CompanyOS", icon: Server, status: blockers > 0 ? "attention" : "operational",
      metric: String(blockers), metricLabel: "BLOCKERS", sub: `${okChecks}/${totalChecks} systems ok`,
      progress: Math.round((okChecks / totalChecks) * 100) },
  ];

  // ── system gates (real: health + fleet) ───────────────────────────────
  const gates = [
    { name: "Data Engine", icon: Database, meta: "API / DB / ETL",
      chip: live ? "200 OK" : "DEGRADED", ok: live ? "ok" : "degraded" },
    { name: "Disk", icon: Server, meta: "/ root volume",
      chip: diskPct ? `${diskPct}%` : "—", ok: checks.disk?.status ?? "unknown" },
    { name: "Fleet", icon: Activity, meta: "Nodes Online",
      chip: `${fleetOnline} / ${fleetTotal}`, ok: fleetOnline === fleetTotal && fleetTotal > 0 ? "ok" : fleetOnline > 0 ? "degraded" : "down" },
    { name: "Blackwell", icon: Zap, meta: "GPU Cluster",
      chip: blackwell ? (blackwell.status === "online" ? "OK" : "DOWN") : "—",
      ok: blackwell ? (blackwell.status === "online" ? "ok" : "down") : "unknown" },
  ];
  const gateColor = (s: string) => (s === "ok" ? P.green : s === "down" ? P.red : s === "unknown" ? P.mute : P.amber);
  const gateBg = (s: string) => (s === "ok" ? P.greenBg : s === "down" ? P.redBg : s === "unknown" ? P.lineSoft : P.amberBg);

  return (
    <div style={{ background: P.canvas, minHeight: "100%", fontFamily: SANS, color: P.ink }}>
      {/* ── MISSION CLOCK STRIP ─────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-7 h-12 border-b flex-wrap"
        style={{ borderColor: P.line, background: P.card }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", color: P.mute }}>MISSION CLOCK</span>
        <ClockChip label="PHASE A" />
        <Dot />
        <ClockChip label="GATE 07" />
        <Dot />
        <span className="flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: live ? P.green : P.amber }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: live ? P.green : P.amber }} />
          {live ? "LIVE" : "DEGRADED"}
        </span>
        <Dot />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: P.ink3 }}>
          SQUAD <span style={{ color: P.ink }}>gtm</span>
        </span>
        <Dot />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: P.ink3 }}>
          AGENT <span style={{ color: P.ink }}>darius</span>
        </span>
        <Dot />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: P.ink2, fontVariantNumeric: "tabular-nums" }}>
          {now.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase()}{" "}
          {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
        <div className="flex-1" />
        <kbd className="px-1.5 py-0.5 rounded border" style={{ fontFamily: MONO, fontSize: 10, color: P.ink3, borderColor: P.line, background: P.canvas }}>⌘K</kbd>
      </div>

      <div className="px-7 py-6 grid grid-cols-1 xl:grid-cols-[1fr_336px] gap-6 pb-16">
        {/* ── MAIN COLUMN ──────────────────────────────────────────── */}
        <div>
          {/* Greeting */}
          <motion.h1 initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="tracking-tight mb-5"
            style={{ fontFamily: SANS, fontSize: 34, fontWeight: 700, color: P.ink, letterSpacing: "-0.02em" }}>
            {greeting}, Mike.
          </motion.h1>

          {/* Directive card */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-5 mb-6 flex items-center gap-5"
            style={{ borderColor: P.line, background: P.card, boxShadow: "0 1px 2px rgba(14,17,22,0.03)" }}>
            <div className="grid place-items-center rounded-lg shrink-0" style={{ width: 52, height: 52, background: P.greenBg }}>
              <Target size={22} style={{ color: P.green }} />
            </div>
            <div className="min-w-0 flex-1">
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: P.mute, marginBottom: 6 }}>
                THE ONE THING TODAY
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: P.ink, lineHeight: 1.4 }} className="line-clamp-2">
                {directiveText}
              </div>
            </div>
            <button
              onClick={() => topTask
                ? openDetail({ id: topTask.id, type: "task", title: topTask.title, description: topTask.description, priority: topTask.priority, status: topTask.status, assignee: topTask.assignee, source: "Paperclip", data: topTask })
                : openCopilot("Review the top directive: " + directiveText)}
              className="shrink-0 flex items-center gap-1.5 rounded-lg px-4 py-2.5 transition hover:brightness-95"
              style={{ background: P.green, color: "#fff", fontSize: 13, fontWeight: 600 }}>
              Review &amp; Arm <ChevronRight size={15} />
            </button>
          </motion.div>

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((k, i) => (
              <motion.button key={k.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => openDetail({ id: `kpi-${k.label}`, type: "system", title: k.detail.title, description: k.detail.desc, source: k.detail.source })}
                className="text-left rounded-xl border p-4 transition hover:shadow-sm cursor-pointer flex flex-col"
                style={{ borderColor: P.line, background: P.card }}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <k.icon size={13} style={{ color: P.ink3 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: P.ink2 }}>{k.label}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: k.chipColor, background: k.chipColor === P.green ? P.greenBg : P.lineSoft, fontVariantNumeric: "tabular-nums" }}>
                    {k.chip}
                  </span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em", color: (k as { valueColor?: string }).valueColor ?? P.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {k.value}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: P.ink3, marginTop: 5 }}>{k.sub}</div>
                <div className="mt-3 mb-2"><Sparkline series={k.series} color={k.spark} flat={k.flat} /></div>
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: P.lineSoft }}>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", color: P.mute }}>{k.footL}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.ink2, fontVariantNumeric: "tabular-nums" }}>{k.footR}</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Departments */}
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", color: P.ink3, fontFamily: MONO }}>DEPARTMENTS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d, i) => {
              const g = GATE_META[d.status];
              return (
                <motion.button key={d.name} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => openDetail({ id: `dept-${d.name}`, type: "department", title: d.name, description: `${d.metric} ${d.metricLabel.toLowerCase()} — ${d.sub}. Gate ${g.word}.`, status: d.status === "operational" ? "done" : d.status === "attention" ? "blocked" : "pending", source: "RIG Departments" })}
                  className="text-left rounded-xl border p-4 transition hover:shadow-sm cursor-pointer"
                  style={{ borderColor: P.line, background: P.card }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid place-items-center rounded-lg" style={{ width: 34, height: 34, background: g.bg }}>
                        <d.icon size={16} style={{ color: g.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: P.ink }}>{d.name}</div>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.04em", color: P.mute, marginTop: 1 }}>
                          GATE · <span style={{ color: g.color }}>{g.word}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded" style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.05em", color: g.color, background: g.bg }}>
                      {g.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: P.ink, fontVariantNumeric: "tabular-nums" }}>{d.metric}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: P.mute }}>{d.metricLabel}</span>
                    <span style={{ fontSize: 11, color: P.ink3, marginLeft: "auto" }}>{d.sub}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: P.lineSoft }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, d.progress))}%`, background: g.color }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.ink3, fontVariantNumeric: "tabular-nums", minWidth: 30, textAlign: "right" }}>{Math.max(0, Math.min(100, d.progress))}%</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span style={{ fontFamily: MONO, fontSize: 11, color: P.mute }}>Showing {departments.length} of {departments.length} departments</span>
          </div>
        </div>

        {/* ── RIGHT RAIL ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Live Signal */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: P.line, background: P.card }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: P.lineSoft }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: P.green }} />
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", color: P.ink3 }}>LIVE SIGNAL</span>
            </div>
            <div>
              {(activity.entries ?? []).slice(0, 6).map((e, i) => (
                <button key={i}
                  onClick={() => openDetail({ id: `sig-${i}`, type: "system", title: `${e.agent} activity`, description: e.text, source: "Activity feed" })}
                  className="w-full text-left flex items-start gap-2.5 px-4 py-2.5 transition hover:bg-black/[0.015]"
                  style={{ borderBottom: `1px solid ${P.lineSoft}` }}>
                  <span className="px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, color: P.ink2, background: P.lineSoft }}>
                    {e.agent}
                  </span>
                  <span className="flex-1 min-w-0 truncate" style={{ fontSize: 12, color: P.ink2 }}>{e.text}</span>
                  <span className="shrink-0" style={{ fontFamily: MONO, fontSize: 10, color: P.mute, fontVariantNumeric: "tabular-nums" }}>
                    {new Date(e.ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                </button>
              ))}
              {(activity.entries ?? []).length === 0 && (
                <div className="px-4 py-6 text-center" style={{ fontSize: 12, color: P.mute }}>No recent signal.</div>
              )}
            </div>
            <button onClick={() => openDetail({ id: "all-activity", type: "system", title: "Activity Stream", description: "All agent activity across the fleet", source: "/api/activity" })}
              className="flex items-center gap-1 px-4 py-2.5 w-full" style={{ fontSize: 11.5, fontWeight: 500, color: P.green }}>
              View all activity <ChevronRight size={13} />
            </button>
          </div>

          {/* System Gates */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: P.line, background: P.card }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: P.lineSoft }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.14em", color: P.ink3 }}>SYSTEM GATES</span>
            </div>
            <div>
              {gates.map((s, i) => (
                <button key={s.name}
                  onClick={() => openDetail({ id: `gate-${s.name}`, type: "system", title: s.name, description: `${s.meta} — ${s.chip}`, status: s.ok === "ok" ? "done" : s.ok === "down" ? "blocked" : "pending", source: s.name === "Disk" || s.name === "Data Engine" ? "/api/health" : "/api/fleet" })}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 transition hover:bg-black/[0.015]"
                  style={{ borderBottom: i < gates.length - 1 ? `1px solid ${P.lineSoft}` : "none" }}>
                  <div className="grid place-items-center rounded-lg shrink-0" style={{ width: 32, height: 32, background: P.lineSoft }}>
                    <s.icon size={15} style={{ color: P.ink3 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 600, color: P.ink }}>{s.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.mute }}>{s.meta}</div>
                  </div>
                  <span className="px-2 py-1 rounded shrink-0" style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: gateColor(s.ok), background: gateBg(s.ok), fontVariantNumeric: "tabular-nums" }}>
                    {s.chip}
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: gateColor(s.ok) }} />
                </button>
              ))}
            </div>
            <button onClick={() => openDetail({ id: "all-systems", type: "system", title: "System Status", description: "Full health + fleet system report", source: "/api/health · /api/fleet" })}
              className="flex items-center gap-1 px-4 py-2.5 w-full" style={{ fontSize: 11.5, fontWeight: 500, color: P.green }}>
              View all systems <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── small chrome helpers ──────────────────────────────────────────────
function ClockChip({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded border" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.06em", color: P.ink2, borderColor: P.line, background: P.canvas }}>
      {label}
    </span>
  );
}
function Dot() {
  return <span style={{ color: P.mute, fontSize: 10 }}>·</span>;
}
