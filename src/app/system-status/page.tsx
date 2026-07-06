"use client";

// ── RIG OS Agency — System Status Page ──────────────────────────────
// Live health pulse across every CLI subsystem.
// Pulls from /api/vitals (Claude/Hermes/OpenClaw/Gemini/Antigravity CLI
// status), /api/health (server build/db checks), and /api/agency/health
// (data store counts).
//
// Auto-refreshes every 8 seconds, color-codes every panel green/yellow/red,
// shows latency, version, raw output snippets on expand. Designed to be the
// single pane of glass for "is RIG OS alive?".

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Server, Database, HardDrive, Cpu, Zap, Wifi, WifiOff,
  RefreshCw, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronRight,
  Bot, Brain, Box, Sparkles, Layers, Terminal, Hash, Search,
} from "lucide-react";

interface CliVitals {
  ok: boolean;
  version?: string;
  latencyMs?: number;
  raw?: string;
  gateway?: string;
  degraded?: boolean;
  busy?: boolean;
  agents?: string[];
  sessions?: number;
  loopMaxMs?: number;
  loopP99Ms?: number;
  model?: string;
  provider?: string;
  [k: string]: unknown;
}

interface VitalsResp {
  ts?: number;
  claude?: CliVitals;
  openclaw?: CliVitals;
  hermes?: CliVitals;
  gemini?: CliVitals;
  antigravity?: CliVitals;
}

interface HealthResp {
  status?: string;
  uptime_seconds?: number;
  checks?: Record<string, { status: string; detail?: string }>;
  counts?: Record<string, number>;
  latency_ms?: number;
  build_artifacts?: string;
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  next_run: string | null;
  last_run: string | null;
  last_status: "ok" | "error" | "never" | "unknown";
  script: string | null;
  deliver: string | null;
  repeat: string | null;
}
interface CronSummary {
  active_jobs: number;
  total_jobs: number;
  error_count: number;
  ok_count: number;
  never_run_count: number;
  schedule_mode: { cron: number; interval: number; other: number };
  next_up: CronJob | null;
  jobs: CronJob[];
}
interface CronResp {
  ok: boolean;
  duration_ms?: number;
  summary?: CronSummary;
  error?: string;
  raw?: string;
}

const C = {
  bg: "var(--bg-deep)",
  card: "var(--bg-card)",
  mid: "var(--bg-mid)",
  text: "var(--cream)",
  text2: "var(--cream-dim)",
  text3: "var(--cream-mute)",
  border: "var(--line-soft)",
  gold: "var(--gold)",
  emerald: "var(--emerald)",
  rose: "#ef4444",
  amber: "#fbbf24",
  blue: "#4a9eff",
  plum: "var(--plum)",
};

type Status = "ok" | "warn" | "down" | "unknown";

function statusOf(v: CliVitals | undefined): Status {
  if (!v) return "unknown";
  if (v.ok) return "ok";
  // Hermes is OK even when not "ok=true" if we have a model
  if (v.model && v.latencyMs !== undefined && v.latencyMs < 10000) return "ok";
  // gateway degraded = warn
  if (v.degraded || v.gateway === "degraded") return "warn";
  return "down";
}

function statusColor(s: Status): string {
  if (s === "ok") return C.emerald;
  if (s === "warn") return C.amber;
  if (s === "down") return C.rose;
  return C.text3;
}

function statusLabel(s: Status): string {
  if (s === "ok") return "Online";
  if (s === "warn") return "Degraded";
  if (s === "down") return "Offline";
  return "Unknown";
}

interface AgentPanel {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  blurb: string;
  href?: string;
}

const AGENTS: AgentPanel[] = [
  { key: "claude",      label: "Claude Code",   icon: Terminal, blurb: "Anthropic CLI",        href: "/rig-app" },
  { key: "openclaw",    label: "OpenClaw",      icon: Box,      blurb: "Agent gateway",        href: "/openclaw" },
  { key: "hermes",      label: "Hermes",        icon: Sparkles, blurb: "Conductor runtime",    href: "/hermes" },
  { key: "gemini",      label: "Gemini CLI",    icon: Brain,    blurb: "Google AI",            href: "/gemini" },
  { key: "antigravity", label: "Antigravity",   icon: Layers,   blurb: "Autonomous loop",      href: "/antigravity" },
];

export default function SystemStatusPage() {
  const [vitals, setVitals] = useState<VitalsResp | null>(null);
  const [health, setHealth] = useState<HealthResp | null>(null);
  const [cron, setCron] = useState<CronSummary | null>(null);
  const [cronErr, setCronErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [vRes, hRes, cRes] = await Promise.all([
        fetch("/api/vitals", { cache: "no-store" }).then(r => r.json()).catch(() => null),
        fetch("/api/agency/health", { cache: "no-store" }).then(r => r.json()).catch(() => null),
        fetch("/api/hermes/cron", { cache: "no-store" }).then(r => r.json()).catch(() => null),
      ]);
      if (vRes) setVitals(vRes);
      if (hRes) setHealth(hRes);
      if (cRes?.summary) {
        setCron(cRes.summary);
        setCronErr(null);
      } else if (cRes) {
        setCronErr(cRes.error || "no data");
      }
      setLastFetch(Date.now());
    } catch {
      /* keep last value */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  // Summary counts
  const cliStatuses = AGENTS.map(a => ({ ...a, status: statusOf(vitals?.[a.key as keyof VitalsResp] as CliVitals) }));
  const onlineCount = cliStatuses.filter(a => a.status === "ok").length;
  const degradedCount = cliStatuses.filter(a => a.status === "warn").length;
  const offlineCount = cliStatuses.filter(a => a.status === "down").length;

  // Build artifacts check
  const buildOk = health?.checks?.build_artifacts?.status === "ok" || health?.checks?.server?.status === "ok";
  const dbOk = health?.checks?.database?.status === "ok";

  // Filter for agent search
  const visible = cliStatuses.filter(a =>
    !filter || a.label.toLowerCase().includes(filter.toLowerCase()) || a.blurb.toLowerCase().includes(filter.toLowerCase())
  );

  const uptimeStr = health?.uptime_seconds ? formatUptime(health.uptime_seconds) : "—";
  const totalLatency = cliStatuses.reduce((acc, a) => {
    const v = vitals?.[a.key as keyof VitalsResp] as CliVitals | undefined;
    return acc + (v?.latencyMs ?? 0);
  }, 0);

  return (
    <div className="space-y-6 p-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-3xl tracking-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: C.text }}
          >
            System Status
          </h1>
          <p className="text-[13px] mt-1" style={{ color: C.text2 }}>
            Live pulse across every CLI subsystem · auto-refresh every 8s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px]"
            style={{ borderColor: C.border, color: C.text2, background: C.card }}
          >
            <Clock size={12} />
            Up&nbsp;<span style={{ color: C.text }}>{uptimeStr}</span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px]"
            style={{ borderColor: C.border, color: C.text2, background: C.card }}
          >
            <Activity size={12} />
            Last fetch&nbsp;<span style={{ color: C.text }}>{lastFetch ? new Date(lastFetch).toLocaleTimeString() : "—"}</span>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] transition hover:opacity-80"
            style={{ borderColor: C.border, color: C.text, background: C.card }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI
          icon={CheckCircle2}
          label="Online"
          value={onlineCount}
          sub={`of ${AGENTS.length} CLIs`}
          color={C.emerald}
          bg={`${C.emerald}15`}
        />
        <KPI
          icon={AlertTriangle}
          label="Degraded"
          value={degradedCount}
          sub="need attention"
          color={C.amber}
          bg={`${C.amber}15`}
        />
        <KPI
          icon={WifiOff}
          label="Offline"
          value={offlineCount}
          sub="not responding"
          color={C.rose}
          bg={`${C.rose}15`}
        />
        <KPI
          icon={Server}
          label="Server"
          value={buildOk ? "OK" : "DOWN"}
          sub={`port 3737 · ${health?.latency_ms ?? "?"}ms`}
          color={buildOk ? C.emerald : C.rose}
          bg={buildOk ? `${C.emerald}15` : `${C.rose}15`}
        />
        <KPI
          icon={Zap}
          label="Σ Latency"
          value={`${totalLatency}ms`}
          sub="across all CLIs"
          color={C.gold}
          bg={`${C.gold}15`}
        />
        <KPI
          icon={Clock}
          label="Cron Jobs"
          value={cron ? `${cron.ok_count}/${cron.active_jobs}` : "—"}
          sub={cron
            ? cron.error_count > 0
              ? `${cron.error_count} error${cron.error_count === 1 ? "" : "s"} · ${cron.schedule_mode.interval} interval · ${cron.schedule_mode.cron} cron`
              : `all green · ${cron.schedule_mode.interval} interval · ${cron.schedule_mode.cron} cron`
            : "loading…"}
          color={cron ? (cron.error_count > 0 ? C.rose : C.emerald) : C.text3}
          bg={cron ? `${cron.error_count > 0 ? C.rose : C.emerald}15` : `${C.text3}15`}
        />
      </div>

      {/* Cron jobs — fails first, then next-up, then a compact list */}
      {cron && (
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ background: C.card, borderColor: C.border }}
          data-testid="cron-panel"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock size={14} color={cron.error_count > 0 ? C.rose : C.emerald} />
              <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>
                Hermes Cron
              </h2>
              <span className="text-[11px]" style={{ color: C.text3 }}>
                · {cron.ok_count} ok · {cron.error_count} error · {cron.active_jobs} active
              </span>
            </div>
            {cron.next_up && (
              <div className="text-[11px] flex items-center gap-2" style={{ color: C.text2 }}>
                <span style={{ color: C.text3 }}>Next up:</span>
                <span style={{ color: C.text }}>{cron.next_up.name}</span>
                <span style={{ color: C.text3 }}>·</span>
                <span style={{ color: C.text2 }}>
                  {cron.next_up.next_run ? new Date(cron.next_up.next_run).toLocaleString() : "—"}
                </span>
              </div>
            )}
          </div>

          {cron.error_count > 0 && (
            <div
              className="rounded-lg border p-2.5 space-y-1"
              style={{ background: `${C.rose}10`, borderColor: `${C.rose}40` }}
              data-testid="cron-errors"
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} color={C.rose} />
                <span className="text-[11px] font-semibold" style={{ color: C.rose }}>
                  {cron.error_count} job{cron.error_count === 1 ? "" : "s"} failing
                </span>
              </div>
              <div className="space-y-1">
                {cron.jobs.filter(j => j.last_status === "error").slice(0, 8).map(j => (
                  <div key={j.id} className="flex items-baseline justify-between gap-3 text-[11px]">
                    <span style={{ color: C.text }} className="truncate">{j.name}</span>
                    <span style={{ color: C.rose }} className="font-mono text-[10px] truncate">
                      {j.last_run ? (j.last_run.split("  ")[1] || "error") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {cron.jobs
              .filter(j => j.last_status !== "error")
              .sort((a, b) => {
                const ta = a.next_run ? Date.parse(a.next_run) : Number.POSITIVE_INFINITY;
                const tb = b.next_run ? Date.parse(b.next_run) : Number.POSITIVE_INFINITY;
                return ta - tb;
              })
              .slice(0, 6)
              .map(j => (
                <div
                  key={j.id}
                  className="flex items-center justify-between gap-2 text-[11px] px-2.5 py-1.5 rounded border"
                  style={{ background: C.bg, borderColor: C.border }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 size={11} color={C.emerald} />
                    <span style={{ color: C.text }} className="truncate">{j.name}</span>
                  </div>
                  <span style={{ color: C.text3 }} className="font-mono text-[10px] shrink-0">
                    {j.schedule}
                  </span>
                </div>
              ))}
          </div>
          {cronErr && (
            <div className="text-[11px]" style={{ color: C.rose }}>
              cron API: {cronErr}
            </div>
          )}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1"
          style={{ background: C.card, borderColor: C.border }}
        >
          <Search size={13} color={C.text3} />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter agents (claude, hermes, openclaw…)"
            className="flex-1 bg-transparent outline-none text-[12px]"
            style={{ color: C.text }}
          />
          {filter && (
            <button onClick={() => setFilter("")} className="text-[10px]" style={{ color: C.text3 }}>
              clear
            </button>
          )}
        </div>
        <div className="text-[11px]" style={{ color: C.text3 }}>
          {visible.length} of {AGENTS.length}
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((a, i) => {
          const v = vitals?.[a.key as keyof VitalsResp] as CliVitals | undefined;
          const status = a.status;
          const color = statusColor(status);
          const expanded = expandedKey === a.key;

          return (
            <motion.div
              key={a.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border overflow-hidden"
              style={{ background: C.card, borderColor: C.border }}
            >
              {/* Header */}
              <div className="p-4 flex items-start gap-3">
                <div
                  className="grid place-items-center w-10 h-10 rounded-lg shrink-0"
                  style={{ background: `${color}20` }}
                >
                  <a.icon size={18} color={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[14px] font-semibold" style={{ color: C.text }}>{a.label}</span>
                    <span
                      className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
                      style={{ background: `${color}20`, color }}
                    >
                      {statusLabel(status)}
                    </span>
                  </div>
                  <div className="text-[11px]" style={{ color: C.text2 }}>{a.blurb}</div>
                </div>
                <PulseDot color={color} active={status !== "unknown"} />
              </div>

              {/* Metrics row */}
              <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                <Mini label="Latency" value={v?.latencyMs != null ? `${v.latencyMs}ms` : "—"} />
                <Mini
                  label="Version"
                  value={(v?.version ?? "—").replace(/^v/, "").slice(0, 12) || "—"}
                  mono
                />
                <Mini
                  label="Model"
                  value={v?.model ?? (v?.provider ?? "—")}
                  mono
                />
              </div>

              {/* Special rows */}
              {a.key === "openclaw" && v && (
                <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                  <Mini label="Agents" value={String(v.agents?.length ?? 0)} />
                  <Mini label="Sessions" value={String(v.sessions ?? 0)} />
                  <Mini label="Gateway" value={v.gateway ?? "—"} />
                </div>
              )}
              {a.key === "hermes" && v && (
                <div className="px-4 pb-3">
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.text3 }}>
                    Auth Providers
                  </div>
                  <div className="text-[11px] font-mono leading-relaxed" style={{ color: C.text2 }}>
                    {extractAuthSummary(v.raw || "")}
                  </div>
                </div>
              )}

              {/* Expand raw */}
              <button
                onClick={() => setExpandedKey(expanded ? null : a.key)}
                className="w-full px-4 py-2 flex items-center gap-2 border-t text-[11px] transition hover:opacity-80"
                style={{ borderColor: C.border, color: C.text2 }}
              >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {expanded ? "Hide raw output" : "Show raw output"}
                <span className="ml-auto text-[10px]" style={{ color: C.text3 }}>
                  {v?.raw?.length ?? 0} chars
                </span>
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.pre
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-3 text-[10px] font-mono overflow-auto max-h-[240px] border-t whitespace-pre-wrap"
                    style={{ borderColor: C.border, color: C.text2, background: C.bg }}
                  >
                    {v?.raw?.slice(0, 4000) || "no raw output captured"}
                  </motion.pre>
                )}
              </AnimatePresence>

              {/* Footer link */}
              {a.href && (
                <a
                  href={a.href}
                  className="block px-4 py-2 text-[11px] border-t transition hover:opacity-80"
                  style={{ borderColor: C.border, color }}
                >
                  Open {a.label} workspace →
                </a>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Data store + counts */}
      {health?.counts && (
        <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-3">
            <Database size={14} color={C.gold} />
            <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>Agency Data Store</h2>
            <span
              className="ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold"
              style={{ background: dbOk ? `${C.emerald}20` : `${C.rose}20`, color: dbOk ? C.emerald : C.rose }}
            >
              {dbOk ? "Seeded" : "Empty"}
            </span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(health.counts).map(([k, n]) => (
              <div
                key={k}
                className="rounded-lg border p-3"
                style={{ borderColor: C.border, background: C.bg }}
              >
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.text3 }}>
                  {k.replace(/_/g, " ")}
                </div>
                <div className="text-[18px] font-semibold font-mono" style={{ color: C.text }}>
                  {typeof n === "number" ? n.toLocaleString() : String(n)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px]" style={{ color: C.text3 }}>
            Source: <span style={{ color: C.text2 }}>/api/agency/health</span> · {health.status ?? "ok"} · response {health.latency_ms ?? "?"}ms
          </div>
        </div>
      )}

      {/* Health checks table */}
      {health?.checks && (
        <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-3">
            <HardDrive size={14} color={C.blue} />
            <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>Health Checks</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(health.checks).map(([k, v]) => {
              const ok = v?.status === "ok";
              return (
                <div
                  key={k}
                  className="rounded-lg border p-3"
                  style={{
                    borderColor: ok ? `${C.emerald}40` : `${C.rose}40`,
                    background: ok ? `${C.emerald}08` : `${C.rose}08`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {ok ? <CheckCircle2 size={11} color={C.emerald} /> : <AlertTriangle size={11} color={C.rose} />}
                    <span className="text-[11px] font-medium" style={{ color: C.text }}>{k}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: C.text3 }}>{v?.detail ?? v?.status}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[10px] text-center pt-2" style={{ color: C.text3 }}>
        RIG OS Agency · System Status · Doctrine: ProofPacket or it didn't happen
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: number | string;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="rounded-xl border p-4 transition hover:scale-[1.01]"
      style={{ background: C.card, borderColor: C.border }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="grid place-items-center w-6 h-6 rounded" style={{ background: bg }}>
          <Icon size={12} color={color} />
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text3 }}>
          {label}
        </span>
      </div>
      <div className="text-[22px] font-semibold mb-0.5" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px]" style={{ color: C.text3 }}>{sub}</div>
    </div>
  );
}

function Mini({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: C.text3 }}>
        {label}
      </div>
      <div
        className={`text-[12px] truncate ${mono ? "font-mono" : ""}`}
        style={{ color: C.text }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function PulseDot({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="relative grid place-items-center w-3 h-3 shrink-0">
      {active && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: color, opacity: 0.3 }}
        />
      )}
      <span
        className="relative w-2 h-2 rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function extractAuthSummary(raw: string): string {
  // Pull only the providers with ✓ or ✗ markers from the Hermes status block
  const lines = raw.split("\n").filter(l => /[✓✗]/.test(l) && /[A-Za-z]/.test(l));
  return lines.slice(0, 8).join("\n") || "no auth info";
}