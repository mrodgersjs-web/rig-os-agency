"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Server, Mic, Activity, Volume2, Wifi, WifiOff,
  Search, RefreshCw, ChevronDown, ChevronRight, Hash,
  AlertCircle, CheckCircle2, AlertTriangle, Cpu,
  Bot, Layers, Filter, Headphones, AudioLines,
  Shield, Zap, Clock,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// Midnight Aubergine VoiceBox Command — Wires /api/agency/voicebox
// (71 launchd services, 33 running, 4 failed — the live macOS service
// registry for RIG's voice/AI ops layer: jarvis, voicebox-server,
// voice-command-router, ptt, and 60+ agent/cron workers).
// ────────────────────────────────────────────────────────────────────────

type SvcStatus = "running" | "loaded" | "failed" | "unknown";

interface Service {
  name: string;
  pid: string;
  status: SvcStatus | string;
  exitCode: string;
}

interface VoiceboxData {
  _real?: boolean;
  _source?: string;
  summary: {
    totalRigServices: number;
    running: number;
    loaded: number;
    failed: number;
    jarvisRunning: boolean;
    voiceCommandRouterRunning: boolean;
    voiceboxRunning: boolean;
  };
  jarvis: { service: string; pid: string; running: boolean; status: string };
  voicebox: { service: string; pid: string; status: string; label: string };
  voiceCommandRouter: { service: string; pid: string; running: boolean; status: string };
  appleVoiceServices: {
    voicebankingd: { pid: string; running: boolean };
    voiceOver: { pid: string; running: boolean };
    voicememod: { pid: string; running: boolean };
  };
  allServices: Service[];
  generated_at: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const STATUS_META: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  running:  { label: "Running",  color: "#10b981", icon: CheckCircle2, bg: "rgba(16,185,129,0.10)" },
  loaded:   { label: "Loaded",   color: "#60a5fa", icon: Activity,      bg: "rgba(96,165,250,0.10)" },
  failed:   { label: "Failed",   color: "#ef4444", icon: AlertCircle,   bg: "rgba(239,68,68,0.12)"  },
  unknown:  { label: "Unknown",  color: "#94a3b8", icon: AlertTriangle, bg: "rgba(148,163,184,0.10)" },
};

function normalize(s: string): SvcStatus {
  const x = (s || "").toLowerCase();
  if (x === "running") return "running";
  if (x === "loaded") return "loaded";
  if (x === "failed") return "failed";
  return "unknown";
}

function statusOf(svc: Service) {
  return STATUS_META[normalize(svc.status)] ?? STATUS_META.unknown;
}

function classify(name: string): { category: string; icon: any; color: string } {
  const n = name.toLowerCase();
  if (/jarvis|voice|vb|ptt|tts|speak|siri/.test(n)) return { category: "Voice / TTS",   icon: Mic,        color: "#a855f7" };
  if (/voicebox|voicebank|voicememo|voiceover/.test(n)) return { category: "Voice / TTS", icon: Mic,        color: "#a855f7" };
  if (/openclaw|promptx|prompt|gpt|llm|claude|hermes|ollama|litellm|gateway|agent-os|agentforge|agent/.test(n)) return { category: "AI / Agents",      icon: Bot,        color: "#22d3ee" };
  if (/goal|build|pipeline|deployment|sprint|kanban|deploy/.test(n)) return { category: "Build / Pipeline", icon: Zap,        color: "#f59e0b" };
  if (/rig\.|com\.rig\./.test(n)) return { category: "RIG Core",   icon: Shield,      color: "#ec4899" };
  if (/linkedin|cookie/.test(n)) return { category: "LinkedIn",   icon: Cpu,         color: "#0ea5e9" };
  if (/gtm|department-intel|scrap|julie|steve|clara|jarvis/.test(n)) return { category: "GTM / Intel", icon: Layers,     color: "#10b981" };
  if (/apple|com\.apple|voicespeech/.test(n)) return { category: "Apple System",   icon: Cpu,         color: "#94a3b8" };
  if (/docker|colima|stay|keepawake|preview|bridge|pull|tunnel/.test(n)) return { category: "Infra / Docker",  icon: Server,     color: "#f97316" };
  if (/calendar|notebook|notion|paperclip|harbor|phone/.test(n)) return { category: "Productivity", icon: Headphones, color: "#84cc16" };
  return { category: "Other",        icon: Radio,      color: "#94a3b8" };
}

function exitExplain(code: string): string {
  const n = parseInt(code, 10);
  if (isNaN(n)) return "—";
  if (n === 0) return "clean";
  if (n > 128 && n < 165) return `signal ${n - 128}`;
  if (n < 0) return `signal ${Math.abs(n)}`;
  return `exit ${n}`;
}

export default function VoiceboxCommand() {
  const [data, setData] = useState<VoiceboxData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/agency/voicebox", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!cancelled) {
          setData(j);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "fetch failed");
      }
    }
    load();
    const id = setInterval(load, 60_000);
    const tickId = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
      clearInterval(tickId);
    };
  }, []);

  const all = data?.allServices ?? [];

  const filtered = useMemo(() => {
    return all.filter((s) => {
      const st = normalize(s.status);
      if (filter !== "all" && st !== filter) return false;
      const cat = classify(s.name).category;
      if (category !== "all" && cat !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !String(s.pid).includes(q)) return false;
      }
      return true;
    });
  }, [all, filter, category, search]);

  // category rollup
  const byCategory = useMemo(() => {
    const m: Record<string, { total: number; running: number; failed: number; loaded: number }> = {};
    for (const s of all) {
      const cat = classify(s.name).category;
      const entry = (m[cat] ??= { total: 0, running: 0, failed: 0, loaded: 0 });
      entry.total++;
      if (normalize(s.status) === "running") entry.running++;
      if (normalize(s.status) === "failed") entry.failed++;
      if (normalize(s.status) === "loaded") entry.loaded++;
    }
    return m;
  }, [all]);

  const summary = data?.summary;
  const healthPct = summary ? Math.round((summary.running / Math.max(1, summary.totalRigServices)) * 100) : 0;
  const healthTier = healthPct >= 80 ? { label: "Healthy",  color: "var(--emerald)" } :
                     healthPct >= 60 ? { label: "Degraded", color: "var(--gold-soft)" } :
                                       { label: "Critical", color: "var(--plum)" };

  const allCategories = Object.keys(byCategory).sort();

  const stats = summary ? [
    { label: "Total Services",   value: summary.totalRigServices,    icon: Layers,    color: "var(--cream)" },
    { label: "Running",          value: summary.running,             icon: Wifi,      color: "#10b981" },
    { label: "Loaded",           value: summary.loaded,              icon: Activity,  color: "#60a5fa" },
    { label: "Failed",           value: summary.failed,              icon: AlertCircle, color: "#ef4444" },
    { label: "Jarvis",           value: summary.jarvisRunning ? "ON" : "OFF", icon: Bot, color: summary.jarvisRunning ? "#10b981" : "#ef4444" },
    { label: "Voice Cmd Router", value: summary.voiceCommandRouterRunning ? "ON" : "OFF", icon: Radio, color: summary.voiceCommandRouterRunning ? "#10b981" : "#ef4444" },
    { label: "VoiceBox",         value: summary.voiceboxRunning ? "ON" : "OFF", icon: Volume2, color: summary.voiceboxRunning ? "#10b981" : "#ef4444" },
    { label: "Health",           value: `${healthPct}%`,             icon: Shield,    color: "var(--gold)" },
  ] : [];

  return (
    <div className="space-y-6 pb-12" style={{ background: "var(--bg-deep)", minHeight: "100vh" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.header {...fadeUp} className="px-6 pt-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-2 rounded-lg"
                style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}
              >
                <Radio size={22} style={{ color: "#a855f7" }} />
              </div>
              <span
                className="text-[10px] uppercase tracking-[0.2em] font-mono"
                style={{ color: "var(--cream-mute)" }}
              >
                System · VoiceOps · macOS launchd
              </span>
            </div>
            <h1
              className="text-4xl font-semibold leading-none"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--cream)" }}
            >
              VoiceBox Command
            </h1>
            <p
              className="text-[13px] mt-2 max-w-2xl"
              style={{ color: "var(--cream-dim)" }}
            >
              Live registry of the {summary?.totalRigServices ?? 71} launchd services that power RIG's
              voice, agent, GTM, and infra layer. Pulled from
              <code className="mx-1 px-1 rounded" style={{ background: "var(--bg-mid)", color: "var(--gold-soft)" }}>launchctl list</code>
              on every poll.
              {error && <span className="ml-2" style={{ color: "var(--plum)" }}>— error: {error}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTick((t) => t + 1)}
              className="text-[11px] px-3 py-1.5 rounded-md flex items-center gap-1.5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream-dim)" }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <span className="text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
              {data?.generated_at ? new Date(data.generated_at).toLocaleTimeString() : "—"} · auto 60s
            </span>
          </div>
        </div>
      </motion.header>

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ delay: 0.05 }} className="px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="p-3 rounded-lg"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={14} style={{ color: s.color }} />
                  <span className="text-[9px] uppercase font-mono" style={{ color: "var(--cream-mute)" }}>
                    {s.label}
                  </span>
                </div>
                <div
                  className="text-2xl font-mono"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: s.color }}
                >
                  {s.value}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ── Health Ring + Core Voice Stack ─────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ delay: 0.1 }} className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Ring */}
          <div
            className="p-5 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-mono" style={{ color: "var(--cream-mute)" }}>
                VoiceOps Health
              </span>
              <Shield size={14} style={{ color: "var(--gold)" }} />
            </div>
            <div className="flex items-center gap-5">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="58" stroke="var(--line-soft)" strokeWidth="10" fill="none" />
                <motion.circle
                  cx="70" cy="70" r="58"
                  stroke={healthTier.color}
                  strokeWidth="10" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 58}
                  initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - healthPct / 100) }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px" }}
                />
                <text x="70" y="68" textAnchor="middle" fill="var(--cream)"
                  fontSize="28" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="600">
                  {healthPct}%
                </text>
                <text x="70" y="86" textAnchor="middle" fill="var(--cream-mute)" fontSize="9"
                  fontFamily="'JetBrains Mono', monospace" letterSpacing="2">
                  {healthTier.label.toUpperCase()}
                </text>
              </svg>
              <div className="flex-1 space-y-2">
                {[
                  { l: "Running", v: summary?.running ?? 0, c: "#10b981" },
                  { l: "Loaded",  v: summary?.loaded ?? 0,  c: "#60a5fa" },
                  { l: "Failed",  v: summary?.failed ?? 0,  c: "#ef4444" },
                ].map((row) => (
                  <div key={row.l} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: row.c }} />
                      <span style={{ color: "var(--cream-dim)" }}>{row.l}</span>
                    </span>
                    <span className="font-mono" style={{ color: row.c }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core RIG Voice Stack */}
          <div
            className="p-5 rounded-xl lg:col-span-2"
            style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AudioLines size={16} style={{ color: "#a855f7" }} />
              <span className="text-[12px] uppercase tracking-wider font-mono" style={{ color: "var(--cream-dim)" }}>
                Core Voice Stack · launchd
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  name: "Jarvis",
                  svc: data?.jarvis,
                  desc: "Operator coordinator + Jake voice daemon",
                  icon: Bot,
                  color: "#a855f7",
                },
                {
                  name: "VoiceBox Server",
                  svc: data?.voicebox,
                  desc: "TTS bridge — Hermes / Edge / ElevenLabs",
                  icon: Volume2,
                  color: "#ec4899",
                },
                {
                  name: "Voice Cmd Router",
                  svc: data?.voiceCommandRouter,
                  desc: "Routes wake-word intents to handlers",
                  icon: Radio,
                  color: "#22d3ee",
                },
              ].map((c) => {
                const Icon = c.icon;
                const running = (c.svc as any)?.running ?? ((c.svc as any)?.status === "running");
                return (
                  <div
                    key={c.name}
                    className="p-3 rounded-lg"
                    style={{
                      background: running ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                      border: `1px solid ${running ? "rgba(16,185,129,0.30)" : "rgba(239,68,68,0.30)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon size={16} style={{ color: c.color }} />
                      <span
                        className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: running ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                          color: running ? "#10b981" : "#ef4444",
                        }}
                      >
                        {running ? "running" : "stopped"}
                      </span>
                    </div>
                    <div className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
                      {c.name}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--cream-mute)" }}>
                      {c.desc}
                    </div>
                    <div className="text-[10px] mt-2 font-mono" style={{ color: "var(--cream-dim)" }}>
                      {(c.svc as any)?.service ?? "—"}
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
                      PID {(c.svc as any)?.pid ?? "—"} · {(c.svc as any)?.status ?? "—"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Apple voice services */}
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--line-soft)" }}>
              <div className="text-[10px] uppercase font-mono mb-2" style={{ color: "var(--cream-mute)" }}>
                Apple Voice Services
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(data?.appleVoiceServices ?? {}).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center gap-2 p-2 rounded"
                    style={{ background: "var(--bg-mid)", border: "1px solid var(--line-soft)" }}
                  >
                    {v.running ? (
                      <Wifi size={12} style={{ color: "#10b981" }} />
                    ) : (
                      <WifiOff size={12} style={{ color: "var(--cream-mute)" }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-mono truncate" style={{ color: "var(--cream)" }}>
                        {k}
                      </div>
                      <div className="text-[9px] font-mono" style={{ color: "var(--cream-mute)" }}>
                        PID {v.pid}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Category Rollup ────────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ delay: 0.15 }} className="px-6">
        <div
          className="p-5 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={16} style={{ color: "var(--gold)" }} />
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
                Category Rollup
              </h2>
              <span className="text-[10px] uppercase font-mono" style={{ color: "var(--cream-mute)" }}>
                Click to filter services
              </span>
            </div>
            {category !== "all" && (
              <button
                onClick={() => setCategory("all")}
                className="text-[11px] px-2.5 py-1 rounded"
                style={{ background: "var(--bg-mid)", color: "var(--gold-soft)", border: "1px solid var(--line-soft)" }}
              >
                clear filter · {category}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).map(([cat, agg]) => {
              const meta = classify(cat === "Voice / TTS" ? "voice" : cat);
              const Icon = meta.icon;
              const pct = agg.total > 0 ? Math.round((agg.running / agg.total) * 100) : 0;
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(isActive ? "all" : cat)}
                  className="text-left p-3 rounded-lg transition-all"
                  style={{
                    background: isActive ? `${meta.color}11` : "var(--bg-mid)",
                    border: `1px solid ${isActive ? meta.color : "var(--line-soft)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} style={{ color: meta.color }} />
                      <span className="text-[11px] font-semibold" style={{ color: "var(--cream)" }}>
                        {cat}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: meta.color }}>
                      {agg.running}/{agg.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-deep)" }}>
                    <motion.div
                      className="h-full"
                      style={{ background: meta.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[9px] font-mono" style={{ color: "var(--cream-mute)" }}>
                    <span>{pct}% live</span>
                    {agg.failed > 0 && <span style={{ color: "#ef4444" }}>{agg.failed} failed</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ delay: 0.18 }} className="px-6">
        <div
          className="p-4 rounded-xl flex flex-wrap gap-3 items-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <Search size={14} style={{ color: "var(--cream-mute)" }} />
            <input
              type="text"
              placeholder="Search by name or PID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 text-[13px] outline-none"
              style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}
            />
          </div>
          <div className="flex items-center gap-1">
            {[
              { key: "all",      label: "all",      color: "var(--cream)", bg: "var(--bg-mid)" },
              { key: "running",  ...STATUS_META.running },
              { key: "loaded",   ...STATUS_META.loaded },
              { key: "failed",   ...STATUS_META.failed },
              { key: "unknown",  ...STATUS_META.unknown },
            ].map((s: any) => {
              const meta = s;
              const Icon = meta.icon;
              const active = filter === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setFilter(s.key)}
                  className="text-[11px] px-3 py-1.5 rounded-md flex items-center gap-1.5"
                  style={{
                    background: active ? meta.bg : "transparent",
                    border: `1px solid ${active ? meta.color : "var(--line-soft)"}`,
                    color: active ? meta.color : "var(--cream-dim)",
                  }}
                >
                  {Icon && <Icon size={11} />}
                  {s.key}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
            {filtered.length}/{all.length} services
          </span>
        </div>
      </motion.section>

      {/* ── Services Table ─────────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ delay: 0.22 }} className="px-6">
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
        >
          <div
            className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] uppercase font-mono tracking-wider"
            style={{ background: "var(--bg-mid)", color: "var(--cream-mute)", borderBottom: "1px solid var(--line-soft)" }}
          >
            <div className="col-span-1">status</div>
            <div className="col-span-1">pid</div>
            <div className="col-span-4">service name</div>
            <div className="col-span-3">category</div>
            <div className="col-span-2">exit</div>
            <div className="col-span-1 text-right">·</div>
          </div>
          <AnimatePresence>
            {filtered.length === 0 && (
              <div className="px-4 py-12 text-center text-[13px]" style={{ color: "var(--cream-mute)" }}>
                {error ? `error: ${error}` : "no services match the current filter"}
              </div>
            )}
            {filtered.map((s, i) => {
              const meta = statusOf(s);
              const Icon = meta.icon;
              const cat = classify(s.name);
              const isOpen = expanded === s.name;
              const CatIcon = cat.icon;
              return (
                <motion.div
                  key={`${s.name}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(0.02 * i, 0.4) }}
                  className="border-b last:border-b-0"
                  style={{ borderColor: "var(--line-soft)" }}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : s.name)}
                    className="w-full grid grid-cols-12 gap-3 px-4 py-2.5 items-center text-left text-[12px]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <div className="col-span-1 flex items-center gap-1.5">
                      <Icon size={12} style={{ color: meta.color }} />
                      <span style={{ color: meta.color }}>{meta.label.toLowerCase()}</span>
                    </div>
                    <div className="col-span-1" style={{ color: "var(--cream-dim)" }}>
                      {s.pid}
                    </div>
                    <div className="col-span-4 truncate" style={{ color: "var(--cream)" }}>
                      {s.name}
                    </div>
                    <div className="col-span-3 flex items-center gap-1.5">
                      <CatIcon size={11} style={{ color: cat.color }} />
                      <span style={{ color: cat.color }}>{cat.category}</span>
                    </div>
                    <div className="col-span-2" style={{ color: "var(--cream-mute)" }}>
                      {exitExplain(s.exitCode)}
                    </div>
                    <div className="col-span-1 text-right" style={{ color: "var(--cream-mute)" }}>
                      {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ background: "var(--bg-mid)" }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-3 text-[11px]">
                          <div>
                            <div className="text-[9px] uppercase font-mono mb-1" style={{ color: "var(--cream-mute)" }}>
                              Full label
                            </div>
                            <div className="font-mono" style={{ color: "var(--cream)" }}>
                              {s.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase font-mono mb-1" style={{ color: "var(--cream-mute)" }}>
                              Diagnostics
                            </div>
                            <div className="font-mono" style={{ color: "var(--cream-dim)" }}>
                              pid={s.pid || "—"} · exit={s.exitCode || "—"} · {exitExplain(s.exitCode)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase font-mono mb-1" style={{ color: "var(--cream-mute)" }}>
                              Polled at
                            </div>
                            <div className="font-mono" style={{ color: "var(--cream-dim)" }}>
                              {data?.generated_at ? new Date(data.generated_at).toLocaleString() : "—"}
                              {" · tick "}{tick % 60}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ── Footer Doctrine ───────────────────────────────────────────── */}
      <motion.footer {...fadeUp} transition={{ delay: 0.3 }} className="px-6">
        <div
          className="rounded-lg p-4 flex items-start gap-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
        >
          <Shield size={16} className="mt-0.5" style={{ color: "var(--gold)" }} />
          <div>
            <div className="text-[12px] font-semibold" style={{ color: "var(--cream)" }}>
              Doctrine — launchctl is the live voice of every RIG subsystem.
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--cream-dim)" }}>
              Every running service is an active commitment. Failed services are an open incident — restart with
              <code className="mx-1 px-1 rounded" style={{ background: "var(--bg-mid)", color: "var(--gold-soft)" }}>
                launchctl kickstart -k gui/$(id -u)/{`{label}`}
              </code>
              . AntiGeneric target: ≥80% running, ≤5% failed across the agent/voice layer.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
