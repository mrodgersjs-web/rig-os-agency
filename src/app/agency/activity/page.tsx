// src/app/agency/activity/page.tsx
// ── RIG OS Agency — Activity Stream Page ─────────────────────────────
// Full-screen, filterable, searchable, auto-refreshing ledger of every
// agent event surfaced by /api/activity (OpenClaw, Hermes, Claude logs).
//
// Why this matters: every meaningful action across the 113 pages leaves a
// trail in ~/.openclaw/logs and ~/.hermes/cache. This page turns those log
// tails into a single, searchable timeline so operators can prove what ran,
// when, and whether it succeeded — without grep'ing three terminals.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, RefreshCw, Search, Filter, Download, Trash2,
  AlertCircle, AlertTriangle, CheckCircle2, Activity, Clock,
  Zap, ChevronDown, ChevronRight, Hash,
} from "lucide-react";

interface Entry {
  ts: number;
  agent: string;
  text: string;
  level?: "info" | "warn" | "err";
}

type AgentFilter = "all" | "openclaw" | "hermes" | "claude" | "codex";
type LevelFilter = "all" | "info" | "warn" | "err";

const AGENT_COLORS: Record<string, string> = {
  openclaw: "#ec4899",
  hermes: "#fbbf24",
  claude: "#d97757",
  codex: "#a855f7",
};

const AGENT_LABELS: Record<string, string> = {
  openclaw: "OpenClaw",
  hermes: "Hermes",
  claude: "Claude",
  codex: "Codex",
};

function classify(text: string): "info" | "warn" | "err" {
  if (/error|fail|exception|panic|fatal|crash/i.test(text)) return "err";
  if (/warn|warning|deprecat|retry|timeout|slow/i.test(text)) return "warn";
  return "info";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour12: false }) +
    "." + String(d.getMilliseconds()).padStart(3, "0").slice(0, 2);
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEntries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await fetch("/api/activity", { cache: "no-store" });
      const j = await r.json();
      // Backfill level classification if missing
      const next: Entry[] = (j.entries ?? []).map((e: Entry) => ({
        ...e,
        level: e.level ?? classify(e.text),
      }));
      setEntries(next);
    } catch {
      // leave existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchEntries(false), 5000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchEntries]);

  // Filtered entries
  const filtered = useMemo(() => {
    let out = entries;
    if (agentFilter !== "all") out = out.filter((e) => e.agent === agentFilter);
    if (levelFilter !== "all") out = out.filter((e) => (e.level ?? "info") === levelFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((e) => e.text.toLowerCase().includes(q) || e.agent.toLowerCase().includes(q));
    }
    return out;
  }, [entries, agentFilter, levelFilter, search]);

  // Aggregate stats
  const stats = useMemo(() => {
    const byAgent: Record<string, number> = {};
    const byLevel: Record<string, number> = { info: 0, warn: 0, err: 0 };
    for (const e of entries) {
      byAgent[e.agent] = (byAgent[e.agent] ?? 0) + 1;
      const lvl = e.level ?? "info";
      byLevel[lvl] = (byLevel[lvl] ?? 0) + 1;
    }
    return { byAgent, byLevel, total: entries.length };
  }, [entries]);

  function exportJSON() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const rows = [
      ["timestamp", "iso", "agent", "level", "text"],
      ...filtered.map((e) => [
        String(e.ts),
        new Date(e.ts).toISOString(),
        e.agent,
        e.level ?? "info",
        e.text.replace(/"/g, '""'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1
            className="text-3xl tracking-tight"
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 500,
              color: "var(--cream)",
            }}
          >
            Activity Stream
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
            Live ledger of every OpenClaw, Hermes, Claude, and Codex event —
            auto-refreshing every 5s, fully filterable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition"
            style={{
              background: autoRefresh ? "rgba(90,184,150,0.12)" : "var(--bg-card)",
              color: autoRefresh ? "var(--emerald)" : "var(--cream-dim)",
              border: `1px solid ${autoRefresh ? "var(--emerald)" : "var(--line-soft)"}`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: autoRefresh ? "var(--emerald)" : "var(--cream-mute)",
                animation: autoRefresh ? "pulse 2s ease-in-out infinite" : undefined,
              }}
            />
            {autoRefresh ? "LIVE" : "PAUSED"}
          </button>
          <button
            onClick={() => fetchEntries(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition disabled:opacity-50"
            style={{
              background: "var(--bg-card)",
              color: "var(--cream-dim)",
              border: "1px solid var(--line-soft)",
            }}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition"
            style={{
              background: "var(--bg-card)",
              color: "var(--cream-dim)",
              border: "1px solid var(--line-soft)",
            }}
          >
            <Download size={13} />
            JSON
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition"
            style={{
              background: "var(--bg-card)",
              color: "var(--cream-dim)",
              border: "1px solid var(--line-soft)",
            }}
          >
            <Download size={13} />
            CSV
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI
          icon={<Activity size={16} />}
          label="Total Events"
          value={stats.total}
          color="var(--gold)"
        />
        <KPI
          icon={<CheckCircle2 size={16} />}
          label="Info"
          value={stats.byLevel.info ?? 0}
          color="#5ab896"
        />
        <KPI
          icon={<AlertTriangle size={16} />}
          label="Warnings"
          value={stats.byLevel.warn ?? 0}
          color="#fbbf24"
        />
        <KPI
          icon={<AlertCircle size={16} />}
          label="Errors"
          value={stats.byLevel.err ?? 0}
          color="#ef4444"
        />
        <KPI
          icon={<Filter size={16} />}
          label="Filtered"
          value={filtered.length}
          color="var(--plum)"
        />
      </div>

      {/* Agent breakdown */}
      <div className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
        <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: "var(--cream-dim)" }}>
          By Agent
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(stats.byAgent).map(([agent, count]) => {
            const color = AGENT_COLORS[agent] ?? "var(--cream-dim)";
            return (
              <div key={agent} className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <div className="flex-1">
                  <div className="text-[12px]" style={{ color: "var(--cream)" }}>
                    {AGENT_LABELS[agent] ?? agent}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                    {count} events
                  </div>
                </div>
                <div className="text-[18px] font-semibold" style={{ color }}>
                  {count}
                </div>
              </div>
            );
          })}
          {Object.keys(stats.byAgent).length === 0 && (
            <div className="col-span-full text-[12px] text-center py-4" style={{ color: "var(--cream-mute)" }}>
              No events recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 max-w-md"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <Search size={14} style={{ color: "var(--cream-dim)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="bg-transparent text-[13px] outline-none flex-1"
            style={{ color: "var(--cream)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-[11px]" style={{ color: "var(--cream-mute)" }}>
              clear
            </button>
          )}
        </div>

        <div className="flex gap-1 p-1 rounded-lg border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          {(["all", "openclaw", "hermes", "claude", "codex"] as AgentFilter[]).map((a) => {
            const active = agentFilter === a;
            const color = a === "all" ? "var(--cream)" : AGENT_COLORS[a] ?? "var(--cream)";
            return (
              <button
                key={a}
                onClick={() => setAgentFilter(a)}
                className="px-3 py-1.5 rounded text-[11px] font-medium transition capitalize"
                style={{
                  background: active ? `${color}25` : "transparent",
                  color: active ? color : "var(--cream-dim)",
                }}
              >
                {a === "all" ? "All Agents" : (AGENT_LABELS[a] ?? a)}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1 p-1 rounded-lg border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          {(["all", "info", "warn", "err"] as LevelFilter[]).map((l) => {
            const active = levelFilter === l;
            const color = l === "all" ? "var(--cream)" : l === "info" ? "#5ab896" : l === "warn" ? "#fbbf24" : "#ef4444";
            return (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className="px-3 py-1.5 rounded text-[11px] font-medium transition uppercase"
                style={{
                  background: active ? `${color}25` : "transparent",
                  color: active ? color : "var(--cream-dim)",
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event list */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
      >
        <div
          className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider"
          style={{
            color: "var(--cream-dim)",
            borderBottom: "1px solid var(--line-soft)",
            background: "var(--bg-mid)",
          }}
        >
          <div className="col-span-2">Time</div>
          <div className="col-span-2">Agent</div>
          <div className="col-span-1">Level</div>
          <div className="col-span-7">Event</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-[13px]" style={{ color: "var(--cream-dim)" }}>
              <RefreshCw size={16} className="animate-spin inline mr-2" />
              Loading activity stream...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px]" style={{ color: "var(--cream-dim)" }}>
              {entries.length === 0
                ? "No activity yet. Streams from ~/.openclaw/logs and ~/.hermes/cache will appear here as agents run."
                : "No events match your filters. Try clearing search or selecting \"all\"."}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((e, i) => {
                const lvl = e.level ?? "info";
                const color = AGENT_COLORS[e.agent] ?? "var(--cream-dim)";
                const lvlColor = lvl === "err" ? "#ef4444" : lvl === "warn" ? "#fbbf24" : "#5ab896";
                const LvlIcon = lvl === "err" ? AlertCircle : lvl === "warn" ? AlertTriangle : CheckCircle2;
                return (
                  <motion.div
                    key={`${e.ts}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.005, 0.1) }}
                    onClick={() => setSelected(e)}
                    className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[12px] cursor-pointer transition"
                    style={{
                      borderBottom: "1px solid rgba(212,165,116,0.05)",
                      background: selected === e ? "rgba(212,165,116,0.06)" : "transparent",
                    }}
                  >
                    <div className="col-span-2 flex items-center gap-1.5" style={{ color: "var(--cream-mute)" }}>
                      <Clock size={11} />
                      <span className="font-mono">{formatTime(e.ts)}</span>
                      <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                        ({formatRelative(e.ts)})
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-[11px] capitalize" style={{ color }}>
                        {AGENT_LABELS[e.agent] ?? e.agent}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-medium"
                        style={{
                          background: `${lvlColor}20`,
                          color: lvlColor,
                        }}
                      >
                        <LvlIcon size={9} />
                        {lvl}
                      </span>
                    </div>
                    <div
                      className="col-span-7 truncate font-mono text-[11.5px]"
                      style={{
                        color: lvl === "err" ? "#fca5a5" : lvl === "warn" ? "#fde68a" : "var(--cream)",
                      }}
                    >
                      {e.text}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 text-[11px]"
          style={{
            color: "var(--cream-mute)",
            borderTop: "1px solid var(--line-soft)",
            background: "var(--bg-mid)",
          }}
        >
          <div>
            Showing <strong style={{ color: "var(--cream)" }}>{filtered.length}</strong> of{" "}
            <strong style={{ color: "var(--cream)" }}>{entries.length}</strong> events
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Zap size={10} />
              Auto-refresh: {autoRefresh ? "5s" : "off"}
            </span>
            <span className="flex items-center gap-1">
              <Hash size={10} />
              Source: /api/activity
            </span>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => { setSelected(null); setExpanded(false); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: AGENT_COLORS[selected.agent] ?? "var(--cream-dim)" }}
                  />
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
                      {AGENT_LABELS[selected.agent] ?? selected.agent} Event
                    </div>
                    <div className="text-[11px] font-mono" style={{ color: "var(--cream-mute)" }}>
                      {new Date(selected.ts).toISOString()} • {formatRelative(selected.ts)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setSelected(null); setExpanded(false); }}
                  className="text-[12px] px-2 py-1 rounded"
                  style={{ color: "var(--cream-dim)" }}
                >
                  close
                </button>
              </div>

              <div className="px-5 py-4 overflow-y-auto flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] uppercase font-medium"
                    style={{
                      background: `${selected.level === "err" ? "#ef4444" : selected.level === "warn" ? "#fbbf24" : "#5ab896"}20`,
                      color: selected.level === "err" ? "#ef4444" : selected.level === "warn" ? "#fbbf24" : "#5ab896",
                    }}
                  >
                    {selected.level ?? "info"}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>
                    ts={selected.ts}
                  </span>
                </div>

                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-1 text-[11px] mb-2"
                  style={{ color: "var(--cream-dim)" }}
                >
                  {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {expanded ? "Collapse" : "Show full payload"}
                </button>

                <pre
                  className="rounded-lg p-3 text-[12px] font-mono whitespace-pre-wrap break-all"
                  style={{
                    background: "var(--bg-deep)",
                    color: selected.level === "err" ? "#fca5a5" : "var(--cream)",
                    border: "1px solid var(--line-soft)",
                    maxHeight: expanded ? "none" : "240px",
                    overflow: "auto",
                  }}
                >
                  {selected.text}
                </pre>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <DetailField label="Agent" value={AGENT_LABELS[selected.agent] ?? selected.agent} />
                  <DetailField label="Level" value={selected.level ?? "info"} />
                  <DetailField label="Timestamp" value={new Date(selected.ts).toISOString()} />
                  <DetailField label="Length" value={`${selected.text.length} chars`} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KPI({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
          {label}
        </span>
      </div>
      <div className="text-[24px] font-semibold font-mono" style={{ color }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>
        {label}
      </div>
      <div className="text-[12px] font-mono break-all" style={{ color: "var(--cream)" }}>
        {value}
      </div>
    </div>
  );
}