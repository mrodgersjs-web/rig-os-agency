"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, Building2, Activity, Clock, Zap, CheckCircle2,
  Radio, ArrowRight, RefreshCw, Search, Filter, AlertTriangle,
  ChevronRight, X, Cpu, Layers, Target, TrendingUp, Timer,
  Hash, Users, ListFilter, Eye, Pause, Play,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
  agents: number;
  agentList?: string[];
  lastActivity: string | null;
  registeredAt?: string;
}

interface DispatchEntry {
  timestamp: string;
  task: string;
  urgency: string;
  routed_to: string[];
  status: string;
  duration_ms?: number;
  company?: string;
}

interface PaperclipData {
  server: { running: boolean; port: number; url: string };
  companies: { total: number; items: Company[] };
  dispatch: { total: number; recent: DispatchEntry[] };
  summary: {
    totalCompanies: number;
    totalDispatches: number;
    activeAgents: number;
    serverRunning: boolean;
    operational247: boolean;
    lastDispatch: string | null;
  };
  timestamp: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const URGENCY_META: Record<string, { color: string; bg: string; label: string; rank: number }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.16)", label: "Critical", rank: 4 },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.16)", label: "High",     rank: 3 },
  medium:   { color: "#fbbf24", bg: "rgba(251,191,36,0.16)", label: "Medium",   rank: 2 },
  low:      { color: "#22d3ee", bg: "rgba(34,211,238,0.16)", label: "Low",      rank: 1 },
};

const STATUS_META: Record<string, { color: string; label: string }> = {
  dispatched: { color: "#22c55e", label: "Dispatched" },
  routing:    { color: "#fbbf24", label: "Routing" },
  queued:     { color: "#60a5fa", label: "Queued" },
  failed:     { color: "#ef4444", label: "Failed" },
  retry:      { color: "#f97316", label: "Retry" },
};

function relativeTime(iso?: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function fmtClock(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function PaperclipView() {
  const [data, setData] = useState<PaperclipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  // Data fetching
  useEffect(() => {
    let active = true;
    async function load() {
      if (paused) return;
      try {
        const res = await fetch("/api/paperclip");
        if (!res.ok) return;
        const json = await res.json();
        if (active) {
          setData(json);
          setLastUpdate(new Date().toLocaleTimeString());
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [paused]);

  // Tick for relative time refresh
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  const companies = data?.companies.items ?? [];
  const dispatches = data?.dispatch.recent ?? [];
  const summary = data?.summary;

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    let list = [...dispatches];
    if (urgencyFilter !== "all") {
      list = list.filter((d) => (d.urgency || "").toLowerCase() === urgencyFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((d) => (d.status || "").toLowerCase() === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.task?.toLowerCase().includes(q) ||
        d.routed_to?.some((r) => r.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dispatches, urgencyFilter, statusFilter, search]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter((c) =>
      c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) ||
      c.agentList?.some((a) => a.toLowerCase().includes(q))
    );
  }, [companies, search]);

  // Dispatch stats
  const dispatchStats = useMemo(() => {
    const byUrgency: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let lastCritical: DispatchEntry | null = null;
    let lastFailed: DispatchEntry | null = null;
    for (const d of dispatches) {
      const u = (d.urgency || "medium").toLowerCase();
      byUrgency[u] = (byUrgency[u] || 0) + 1;
      const s = (d.status || "dispatched").toLowerCase();
      byStatus[s] = (byStatus[s] || 0) + 1;
      if (u === "critical" && !lastCritical) lastCritical = d;
      if (s === "failed" && !lastFailed) lastFailed = d;
    }
    return { byUrgency, byStatus, lastCritical, lastFailed };
  }, [dispatches]);

  // Build hourly timeline (last 24h buckets)
  const timeline = useMemo(() => {
    const buckets: { hour: string; count: number; critical: number }[] = [];
    const now = Date.now();
    for (let h = 23; h >= 0; h--) {
      const start = now - (h + 1) * 3600_000;
      const end = now - h * 3600_000;
      const inBucket = dispatches.filter((d) => {
        const t = new Date(d.timestamp).getTime();
        return t >= start && t < end;
      });
      buckets.push({
        hour: new Date(start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        count: inBucket.length,
        critical: inBucket.filter((d) => (d.urgency || "").toLowerCase() === "critical").length,
      });
    }
    return buckets;
  }, [dispatches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-[var(--cream-mute)]">Loading Paperclip operations...</div>
      </div>
    );
  }

  const maxBucket = Math.max(1, ...timeline.map((b) => b.count));

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto p-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#a855f7" }}>
                24/7 Autonomous Operations · {summary?.totalCompanies ?? 0} Companies
              </span>
              {paused && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold"
                  style={{ background: "rgba(251,191,36,0.16)", color: "#fbbf24" }}
                >
                  Paused
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--cream)" }}>
              Paperclip Operations Center
            </h1>
            <p className="text-[13px]" style={{ color: "var(--cream-dim)" }}>
              Always-on company dispatch engine. Routes tasks to RIG studios 24 hours a day.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaused((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition"
              style={{
                background: paused ? "rgba(251,191,36,0.12)" : "var(--bg-card)",
                borderColor: paused ? "#fbbf24" : "var(--line-soft)",
                color: paused ? "#fbbf24" : "var(--cream-dim)",
              }}
            >
              {paused ? <Play size={12} /> : <Pause size={12} />}
              {paused ? "Resume Live" : "Pause"}
            </button>
            <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border" style={{ color: "var(--cream-dim)", borderColor: "var(--line-soft)", background: "var(--bg-card)" }}>
              <RefreshCw size={10} />
              <span className="mono">{lastUpdate}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status banner */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <div
          className="rounded-xl p-5 border flex items-center justify-between flex-wrap gap-4"
          style={{
            background: summary?.serverRunning ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            borderColor: summary?.serverRunning ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl grid place-items-center"
              style={{
                background: summary?.serverRunning ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              }}
            >
              {summary?.serverRunning ? (
                <Radio size={24} style={{ color: "#22c55e" }} />
              ) : (
                <Server size={24} style={{ color: "#ef4444" }} />
              )}
            </div>
            <div>
              <div className="text-[16px] font-bold" style={{ color: "var(--cream)" }}>
                {summary?.serverRunning ? "OPERATIONAL — 24/7 ACTIVE" : "SERVER OFFLINE"}
              </div>
              <div className="text-[12px] mono" style={{ color: "var(--cream-dim)" }}>
                {summary?.serverRunning
                  ? `Listening on ${data?.server.url} · last dispatch ${relativeTime(summary.lastDispatch)}`
                  : "Paperclip engine not running on :3100"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dispatchStats.lastCritical && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  borderColor: "rgba(239,68,68,0.3)",
                  color: "#ef4444",
                }}
                title={dispatchStats.lastCritical.task}
              >
                <AlertTriangle size={11} />
                <span className="font-medium">Last critical:</span>
                <span className="truncate max-w-[160px]">{dispatchStats.lastCritical.task}</span>
              </div>
            )}
            {dispatchStats.lastFailed && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border"
                style={{
                  background: "rgba(249,115,22,0.08)",
                  borderColor: "rgba(249,115,22,0.3)",
                  color: "#f97316",
                }}
              >
                <X size={11} />
                <span>{dispatchStats.byStatus.failed || 0} failed</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Companies",   value: summary?.totalCompanies ?? 0,                                 icon: Building2,    accent: "#a855f7" },
            { label: "Active Agents", value: summary?.activeAgents ?? 0,                                  icon: Zap,          accent: "#fbbf24" },
            { label: "Dispatches",  value: summary?.totalDispatches ?? 0,                                 icon: Activity,     accent: "#4a9eff" },
            { label: "Critical",    value: dispatchStats.byUrgency.critical || 0,                        icon: AlertTriangle, accent: "#ef4444" },
            { label: "High",        value: dispatchStats.byUrgency.high || 0,                            icon: TrendingUp,   accent: "#f97316" },
            { label: "Failed",      value: dispatchStats.byStatus.failed || 0,                           icon: X,            accent: "#ef4444" },
            { label: "Operational", value: summary?.serverRunning ? "YES" : "NO",                        icon: CheckCircle2, accent: summary?.serverRunning ? "#22c55e" : "#ef4444" },
          ].map((s) => {
            const I = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-xl p-4 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <I size={14} style={{ color: s.accent }} />
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>
                    {s.label}
                  </span>
                </div>
                <div className="text-xl font-bold" style={{ color: s.accent }}>{s.value}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Activity timeline */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer size={14} style={{ color: "var(--gold)" }} />
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>Dispatch Activity (Last 24h)</h3>
            </div>
            <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
              {dispatches.length} dispatches · {dispatchStats.byUrgency.critical || 0} critical
            </span>
          </div>
          <div className="flex items-end gap-[2px] h-[60px]">
            {timeline.map((b, i) => {
              const heightPct = (b.count / maxBucket) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${Math.max(4, heightPct)}%`,
                      background: b.critical > 0
                        ? "linear-gradient(180deg, #ef4444, #f97316)"
                        : b.count > 0
                          ? "linear-gradient(180deg, #4a9eff, #6366f1)"
                          : "rgba(255,255,255,0.06)",
                    }}
                  />
                  <div
                    className="absolute bottom-full mb-1 px-1.5 py-0.5 rounded text-[9px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10"
                    style={{ background: "var(--bg-deep)", color: "var(--cream)", border: "1px solid var(--line)" }}
                  >
                    {b.hour} · {b.count} {b.critical > 0 ? `(${b.critical} crit)` : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-1 text-[9px] mono" style={{ color: "var(--cream-mute)" }}>
            <span>{timeline[0]?.hour}</span>
            <span>{timeline[timeline.length - 1]?.hour}</span>
          </div>
        </div>
      </motion.div>

      {/* Filter / search bar */}
      <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
        <div
          className="rounded-xl p-3 border flex flex-wrap items-center gap-3"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-[200px] px-2 py-1 rounded-md" style={{ background: "rgba(0,0,0,0.2)" }}>
            <Search size={12} style={{ color: "var(--cream-mute)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies, agents, tasks…"
              className="bg-transparent outline-none flex-1 text-[12px]"
              style={{ color: "var(--cream)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[var(--cream-mute)] hover:text-[var(--cream)]">
                <X size={11} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
            <Filter size={11} /> Urgency
          </div>
          <div className="flex items-center gap-1">
            {(["all", "critical", "high", "medium", "low"] as const).map((u) => {
              const meta = u === "all" ? { color: "#a59783", label: "All" } : URGENCY_META[u];
              return (
                <button
                  key={u}
                  onClick={() => setUrgencyFilter(u)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-medium transition"
                  style={{
                    background: urgencyFilter === u ? `${meta.color}22` : "rgba(0,0,0,0.2)",
                    color: urgencyFilter === u ? meta.color : "var(--cream-dim)",
                    border: `1px solid ${urgencyFilter === u ? `${meta.color}55` : "var(--line-soft)"}`,
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
            <ListFilter size={11} /> Status
          </div>
          <div className="flex items-center gap-1">
            {(["all", "dispatched", "routing", "queued", "failed"] as const).map((s) => {
              const meta = s === "all" ? { color: "#a59783", label: "All" } : STATUS_META[s] || { color: "#a59783", label: s };
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-medium transition capitalize"
                  style={{
                    background: statusFilter === s ? `${meta.color}22` : "rgba(0,0,0,0.2)",
                    color: statusFilter === s ? meta.color : "var(--cream-dim)",
                    border: `1px solid ${statusFilter === s ? `${meta.color}55` : "var(--line-soft)"}`,
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <div className="text-[10px] ml-auto" style={{ color: "var(--cream-mute)" }}>
            {filteredDispatches.length} / {dispatches.length} dispatches
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Companies list */}
        <motion.div {...fadeUp} transition={{ delay: 0.14 }}>
          <div className="rounded-xl border p-5 h-full" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: "var(--cream)" }}>
                <Building2 size={16} style={{ color: "#a855f7" }} />
                Registered Companies
              </h3>
              <span className="text-[10px] mono" style={{ color: "var(--cream-mute)" }}>
                {filteredCompanies.length} / {companies.length}
              </span>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredCompanies.length === 0 && (
                <div className="text-[12px] text-center py-8" style={{ color: "var(--cream-dim)" }}>
                  No companies match your search.
                </div>
              )}
              {filteredCompanies.map((c) => {
                const companyDispatches = dispatches.filter((d) =>
                  d.routed_to?.some((r) => r.toLowerCase().includes(c.slug.toLowerCase()))
                );
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompany(c)}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg border transition hover:bg-[rgba(255,255,255,0.02)] hover:border-[var(--line)]"
                    style={{ borderColor: "var(--line-soft)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-[13px] font-medium truncate" style={{ color: "var(--cream)" }}>{c.name}</div>
                        <ChevronRight size={10} style={{ color: "var(--cream-mute)" }} />
                      </div>
                      <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--cream-mute)" }}>
                        <span className="mono">{c.slug}</span>
                        <span>·</span>
                        <span>Last activity {relativeTime(c.lastActivity)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {companyDispatches.length > 0 && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md"
                          style={{ background: "rgba(74,158,255,0.1)", color: "#4a9eff" }}
                          title={`${companyDispatches.length} dispatches`}
                        >
                          {companyDispatches.length}× tasks
                        </span>
                      )}
                      {c.agents > 0 && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md"
                          style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}
                        >
                          {c.agents} agents
                        </span>
                      )}
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#22c55e", boxShadow: "0 0 4px #22c55e80" }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Dispatch log */}
        <motion.div {...fadeUp} transition={{ delay: 0.16 }}>
          <div className="rounded-xl border p-5 h-full" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: "var(--cream)" }}>
                <Activity size={16} style={{ color: "#4a9eff" }} />
                Dispatch Log
                {filteredDispatches.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded mono" style={{ background: "rgba(74,158,255,0.16)", color: "#4a9eff" }}>
                    {filteredDispatches.length}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-3 text-[10px] mono" style={{ color: "var(--cream-mute)" }}>
                {Object.entries(dispatchStats.byUrgency)
                  .sort((a, b) => (URGENCY_META[b[0]]?.rank || 0) - (URGENCY_META[a[0]]?.rank || 0))
                  .map(([k, v]) => (
                    <span key={k} className="flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: URGENCY_META[k]?.color || "#a59783" }}
                      />
                      {v} {k}
                    </span>
                  ))}
              </div>
            </div>
            <div ref={logRef} className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredDispatches.length === 0 ? (
                <div className="text-[12px] text-center py-8" style={{ color: "var(--cream-dim)" }}>
                  {dispatches.length === 0
                    ? "No dispatches recorded yet."
                    : "No dispatches match your filters."}
                </div>
              ) : (
                filteredDispatches.map((d, i) => {
                  const um = URGENCY_META[(d.urgency || "medium").toLowerCase()] || URGENCY_META.medium;
                  const sm = STATUS_META[(d.status || "dispatched").toLowerCase()] || STATUS_META.dispatched;
                  return (
                    <div
                      key={`${d.timestamp}-${i}`}
                      className="p-3 rounded-lg border-l-2 transition hover:bg-[rgba(255,255,255,0.02)]"
                      style={{
                        borderColor: um.color,
                        borderTop: "1px solid var(--line-soft)",
                        borderRight: "1px solid var(--line-soft)",
                        borderBottom: "1px solid var(--line-soft)",
                        background: "rgba(0,0,0,0.1)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium flex-1 truncate" style={{ color: "var(--cream)" }}>
                          {d.task}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ml-2 shrink-0"
                          style={{ background: um.bg, color: um.color }}
                        >
                          {um.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 flex-wrap">
                          {d.routed_to?.slice(0, 4).map((r) => (
                            <span
                              key={r}
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                              style={{ background: "rgba(74,158,255,0.1)", color: "#4a9eff" }}
                            >
                              {r}
                            </span>
                          ))}
                          {d.routed_to && d.routed_to.length > 4 && (
                            <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                              +{d.routed_to.length - 4}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {d.duration_ms && (
                            <span className="text-[10px] mono flex items-center gap-0.5" style={{ color: "var(--cream-mute)" }}>
                              <Timer size={9} />
                              {fmtDuration(d.duration_ms)}
                            </span>
                          )}
                          <span className="text-[10px] mono" style={{ color: "var(--cream-mute)" }}>
                            {relativeTime(d.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: sm.color }}
                        />
                        <span className="text-[10px] uppercase tracking-wide" style={{ color: sm.color }}>
                          {sm.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedCompany && (
          <CompanyDetailDrawer
            company={selectedCompany}
            dispatches={dispatches.filter((d) =>
              d.routed_to?.some((r) => r.toLowerCase().includes(selectedCompany.slug.toLowerCase()))
            )}
            onClose={() => setSelectedCompany(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="text-[10px] text-center py-2" style={{ color: "var(--cream-mute)" }}>
        Paperclip Operations · wired to /api/paperclip · auto-refresh 10s · tick: {tick}
      </div>
    </div>
  );
}

/* ── Company Detail Drawer ───────────────────────────────────────────────── */

function CompanyDetailDrawer({
  company,
  dispatches,
  onClose,
}: {
  company: Company;
  dispatches: DispatchEntry[];
  onClose: () => void;
}) {
  const stats = useMemo(() => {
    const byUrgency: Record<string, number> = {};
    let lastDispatch: DispatchEntry | null = null;
    for (const d of dispatches) {
      const u = (d.urgency || "medium").toLowerCase();
      byUrgency[u] = (byUrgency[u] || 0) + 1;
      if (!lastDispatch || new Date(d.timestamp) > new Date(lastDispatch.timestamp)) {
        lastDispatch = d;
      }
    }
    return { byUrgency, lastDispatch, total: dispatches.length };
  }, [dispatches]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(21,16,26,0.7)", backdropFilter: "blur(6px)" }}
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full md:w-[480px] z-50 overflow-y-auto"
        style={{
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--line-soft)",
          boxShadow: "var(--shadow-2)",
        }}
      >
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-bold"
                  style={{ background: "rgba(168,85,247,0.14)", color: "#a855f7" }}
                >
                  Registered
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#22c55e", boxShadow: "0 0 4px #22c55e80" }}
                />
              </div>
              <h2 className="text-xl" style={{ color: "var(--cream)" }}>{company.name}</h2>
              <p className="text-[11px] mono" style={{ color: "var(--cream-mute)" }}>
                {company.slug}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--bg-mid)]"
              style={{ color: "var(--cream-dim)" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg border" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Agents</div>
              <div className="text-xl font-bold" style={{ color: "#fbbf24" }}>{company.agents}</div>
            </div>
            <div className="p-3 rounded-lg border" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Dispatches</div>
              <div className="text-xl font-bold" style={{ color: "#4a9eff" }}>{stats.total}</div>
            </div>
            <div className="p-3 rounded-lg border" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Last Seen</div>
              <div className="text-[11px] font-medium" style={{ color: "var(--cream)" }}>
                {relativeTime(company.lastActivity)}
              </div>
            </div>
          </div>

          {/* Urgency breakdown */}
          {Object.keys(stats.byUrgency).length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>
                Dispatch Urgency
              </div>
              <div className="space-y-1.5">
                {Object.entries(stats.byUrgency)
                  .sort((a, b) => (URGENCY_META[b[0]]?.rank || 0) - (URGENCY_META[a[0]]?.rank || 0))
                  .map(([k, v]) => {
                    const meta = URGENCY_META[k] || URGENCY_META.medium;
                    const pct = Math.round((v / Math.max(1, stats.total)) * 100);
                    return (
                      <div key={k}>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span style={{ color: meta.color }}>{meta.label}</span>
                          <span className="mono" style={{ color: "var(--cream-mute)" }}>{v} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.2)" }}>
                          <div className="h-full" style={{ width: `${pct}%`, background: meta.color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Agent list */}
          {company.agentList && company.agentList.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>
                Agent Roster ({company.agentList.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {company.agentList.slice(0, 24).map((a) => (
                  <span
                    key={a}
                    className="text-[10px] px-2 py-1 rounded mono"
                    style={{ background: "var(--bg-mid)", color: "var(--cream-soft)", border: "1px solid var(--line-soft)" }}
                  >
                    {a}
                  </span>
                ))}
                {company.agentList.length > 24 && (
                  <span className="text-[10px] px-2 py-1 rounded" style={{ background: "var(--bg-mid)", color: "var(--cream-mute)" }}>
                    +{company.agentList.length - 24} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Last dispatch */}
          {stats.lastDispatch && (
            <div className="p-3 rounded-lg border" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>
                Last Dispatch
              </div>
              <div className="text-[12px] font-medium mb-1" style={{ color: "var(--cream)" }}>
                {stats.lastDispatch.task}
              </div>
              <div className="flex items-center gap-2 text-[10px] mono" style={{ color: "var(--cream-mute)" }}>
                <Clock size={9} />
                {fmtClock(stats.lastDispatch.timestamp)}
              </div>
            </div>
          )}

          {/* Recent dispatches */}
          {dispatches.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>
                Recent Activity ({dispatches.length})
              </div>
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {dispatches.slice(0, 20).map((d, i) => {
                  const um = URGENCY_META[(d.urgency || "medium").toLowerCase()] || URGENCY_META.medium;
                  return (
                    <div
                      key={i}
                      className="p-2 rounded-md flex items-center gap-2"
                      style={{ background: "rgba(0,0,0,0.15)", borderLeft: `2px solid ${um.color}` }}
                    >
                      <span className="text-[11px] flex-1 truncate" style={{ color: "var(--cream-soft)" }}>
                        {d.task}
                      </span>
                      <span className="text-[9px] mono" style={{ color: "var(--cream-mute)" }}>
                        {relativeTime(d.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dispatches.length === 0 && (
            <div className="text-[11px] text-center py-6" style={{ color: "var(--cream-mute)" }}>
              No dispatches recorded for this company yet.
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}