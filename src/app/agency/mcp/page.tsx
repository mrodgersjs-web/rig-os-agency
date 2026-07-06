"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, Cpu, Zap, Database, Bot, Globe, Code2, Wrench,
  Cloud, Mail, Video, Activity, Brain, Search, Mic, MessageSquare,
  CheckCircle2, AlertCircle, AlertTriangle, XCircle,
  RefreshCw, Filter, ChevronDown, ChevronRight, Sparkles,
  Terminal, Network, Layers,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// Midnight Aubergine MCP Command — Wires /api/agency/mcp
// (15 MCP servers, 103 tools, 8 categories) into a real inspectable surface
// with KPI strip, category rollups, health ring, search/filter, capability
// grid, expandable detail rows, and doctrine footer.
// ────────────────────────────────────────────────────────────────────────

interface MCPServer {
  id: string;
  name: string;
  category: string;
  status: "connected" | "disconnected" | "error" | "unknown";
  toolCount: number;
  capabilities: string[];
  description: string;
}

interface MCPData {
  servers: MCPServer[];
  stats: {
    total: number;
    connected: number;
    disconnected: number;
    errored: number;
    totalTools: number;
  };
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const CATEGORY_META: Record<string, { icon: any; color: string; label: string }> = {
  automation:    { icon: Bot,        color: "#22d3ee", label: "Automation" },
  dev:           { icon: Code2,      color: "#60a5fa", label: "Dev Platform" },
  data:          { icon: Database,   color: "#a78bfa", label: "Data" },
  research:      { icon: Search,     color: "#34d399", label: "Research" },
  compute:       { icon: Cpu,        color: "#f59e0b", label: "Compute" },
  business:      { icon: Mail,       color: "#ec4899", label: "Business" },
  orchestration: { icon: Network,    color: "#c084fc", label: "Orchestration" },
  devops:        { icon: Cloud,      color: "#fb923c", label: "DevOps" },
  reasoning:     { icon: Brain,      color: "#fbbf24", label: "Reasoning" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  connected:    { label: "Connected",    color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: CheckCircle2 },
  disconnected: { label: "Disconnected", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: AlertTriangle },
  error:        { label: "Error",        color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: XCircle },
  unknown:      { label: "Unknown",      color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: AlertCircle },
};

function categoryFor(c: string) {
  return CATEGORY_META[c] || { icon: Server, color: "#94a3b8", label: c || "Other" };
}

export default function MCPCommandPage() {
  const [data, setData] = useState<MCPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [now, setNow] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await fetch("/api/agency/mcp", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as MCPData;
      setData(j);
    } catch (e: any) {
      setError(e?.message || "load failed");
    } finally {
      setLoading(false);
      setNow(new Date().toISOString());
    }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    const t = setInterval(() => setNow(new Date().toISOString()), 5_000);
    return () => { clearInterval(i); clearInterval(t); };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.servers.filter((s) => {
      if (catFilter !== "all" && s.category !== catFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${s.id} ${s.name} ${s.description} ${s.capabilities.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, query, catFilter, statusFilter]);

  const categories = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { count: number; tools: number; connected: number }>();
    for (const s of data.servers) {
      const e = map.get(s.category) || { count: 0, tools: 0, connected: 0 };
      e.count += 1;
      e.tools += s.toolCount;
      if (s.status === "connected") e.connected += 1;
      map.set(s.category, e);
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({ key: k, ...v, ...categoryFor(k) }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const healthPct = useMemo(() => {
    if (!data || data.stats.total === 0) return 0;
    return Math.round((data.stats.connected / data.stats.total) * 100);
  }, [data]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="pb-10" style={{ color: "var(--cream)" }}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <motion.div {...fadeUp} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="grid place-items-center w-9 h-9 rounded-md"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            <Server size={18} style={{ color: "#f59e0b" }} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--cream-dim)" }}>
              RIG OS / Agency / MCP
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--cream)" }}>
              Model Context Protocol
            </h1>
          </div>
        </div>
        <p className="text-[13px] max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          Live registry of every MCP server wired into RIG OS — capability inventory, health,
          and per-server tool surfaces. Source: <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: "rgba(245,158,11,0.08)" }}>/api/agency/mcp</code>
          {" "}· auto-refresh 60s.
        </p>
      </motion.div>

      {/* ── KPI Strip ────────────────────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPITile label="Servers"     value={data?.stats.total ?? "—"}      accent="var(--gold)"      sub="MCP instances" />
        <KPITile label="Connected"   value={data?.stats.connected ?? "—"}  accent="#10b981"          sub={`${data?.stats.disconnected ?? 0} down · ${data?.stats.errored ?? 0} err`} />
        <KPITile label="Total Tools" value={data?.stats.totalTools ?? "—"} accent="var(--emerald)"   sub="across all servers" />
        <KPITile label="Categories"  value={categories.length}             accent="var(--plum)"      sub="active groups" />
        <KPITile label="Health"      value={loading ? "—" : `${healthPct}%`} accent={healthPct >= 90 ? "#10b981" : healthPct >= 60 ? "#f59e0b" : "#ef4444"} sub={healthPct >= 90 ? "Healthy" : healthPct >= 60 ? "Degraded" : "Critical"} />
      </motion.div>

      {/* ── Health Ring + Category Rollup ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="rounded-lg p-5"
          style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--cream-dim)" }}>
              Fleet Health
            </div>
            <Sparkles size={12} style={{ color: "var(--cream-dim)" }} />
          </div>
          <div className="flex items-center gap-5">
            <HealthRing pct={healthPct} />
            <div className="flex-1 space-y-2">
              <Stat label="Connected"   value={data?.stats.connected ?? 0}  color="#10b981" />
              <Stat label="Disconnected" value={data?.stats.disconnected ?? 0} color="#f59e0b" />
              <Stat label="Errored"     value={data?.stats.errored ?? 0}    color="#ef4444" />
              <Stat label="Unknown"     value={data ? data.servers.length - data.stats.connected - data.stats.disconnected - data.stats.errored : 0} color="#94a3b8" />
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.13 }} className="rounded-lg p-5 lg:col-span-2"
          style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--cream-dim)" }}>
              Category Rollup
            </div>
            <Layers size={12} style={{ color: "var(--cream-dim)" }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((c) => {
              const Icon = c.icon;
              const pct = c.count > 0 ? (c.connected / c.count) * 100 : 0;
              return (
                <button
                  key={c.key}
                  onClick={() => setCatFilter(catFilter === c.key ? "all" : c.key)}
                  className="text-left p-3 rounded-md transition-all"
                  style={{
                    background: catFilter === c.key ? `${c.color}1A` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${catFilter === c.key ? c.color + "55" : "var(--rig-border)"}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={13} style={{ color: c.color }} />
                    <span className="text-[11px] font-medium" style={{ color: "var(--cream)" }}>{c.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-[18px] font-semibold tabular-nums" style={{ color: c.color }}>{c.count}</span>
                    <span className="text-[10px]" style={{ color: "var(--cream-dim)" }}>servers</span>
                    <span className="text-[10px] ml-auto tabular-nums" style={{ color: "var(--cream-dim)" }}>{c.tools} tools</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full"
                      style={{ background: c.color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.16 }} className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--cream-dim)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search server, capability, or description…"
            className="w-full pl-8 pr-3 py-2 text-[12px] rounded-md outline-none"
            style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)", color: "var(--cream)" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-[12px] rounded-md outline-none"
          style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)", color: "var(--cream)" }}
        >
          <option value="all">All status</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Disconnected</option>
          <option value="error">Error</option>
          <option value="unknown">Unknown</option>
        </select>
        <button
          onClick={() => { setCatFilter("all"); setStatusFilter("all"); setQuery(""); }}
          className="px-3 py-2 text-[12px] rounded-md"
          style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)", color: "var(--cream-dim)" }}
        >
          <Filter size={12} className="inline mr-1" />Reset
        </button>
        <button
          onClick={load}
          className="px-3 py-2 text-[12px] rounded-md flex items-center gap-1.5"
          style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)", color: "var(--cream-dim)" }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
        </button>
        <div className="text-[10px] ml-auto" style={{ color: "var(--cream-mute)" }}>
          {filtered.length} / {data?.servers.length ?? 0} servers · {now && new Date(now).toLocaleTimeString()}
        </div>
      </motion.div>

      {/* ── Server Grid ──────────────────────────────────────────── */}
      {error && (
        <div className="p-4 mb-4 rounded-md" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "#ef4444" }}>
            <AlertCircle size={14} />{error}
          </div>
        </div>
      )}

      {!data && !error && (
        <div className="p-8 text-center text-[12px]" style={{ color: "var(--cream-dim)" }}>
          Loading MCP registry…
        </div>
      )}

      {data && (
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <ServerCard key={s.id} server={s} expanded={expanded.has(s.id)} onToggle={() => toggle(s.id)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full p-8 text-center text-[12px] rounded-md"
              style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)", color: "var(--cream-dim)" }}>
              No MCP servers match the current filters.
            </div>
          )}
        </motion.div>
      )}

      {/* ── Doctrine Footer ──────────────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mt-8 pt-4 text-[10px] flex flex-wrap items-center gap-3"
        style={{ borderTop: "1px solid var(--rig-border)", color: "var(--cream-mute)" }}>
        <span>Source: <code className="px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.08)" }}>/api/agency/mcp</code></span>
        <span>·</span>
        <span>Registry: <code className="px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.08)" }}>src/lib/rig-mcp-registry.ts</code></span>
        <span>·</span>
        <span>Doctrine: <em>ProofPacket or it didn't happen</em></span>
      </motion.div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function KPITile({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)" }}>
      <div className="text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: "var(--cream-dim)" }}>{label}</div>
      <div className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>{sub}</div>}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span style={{ color: "var(--cream-dim)" }}>{label}</span>
      <span className="font-semibold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function HealthRing({ pct }: { pct: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = pct >= 90 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-[88px] h-[88px] shrink-0">
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <motion.circle
          cx="44" cy="44" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-semibold tabular-nums leading-none" style={{ color }}>{pct}</span>
        <span className="text-[8px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>pct</span>
      </div>
    </div>
  );
}

function ServerCard({ server, expanded, onToggle }: { server: MCPServer; expanded: boolean; onToggle: () => void }) {
  const cat = categoryFor(server.category);
  const CatIcon = cat.icon;
  const status = STATUS_META[server.status] || STATUS_META.unknown;
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      className="rounded-lg overflow-hidden"
      style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)" }}
    >
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          <div
            className="grid place-items-center w-9 h-9 rounded-md shrink-0"
            style={{ background: `${cat.color}1A`, border: `1px solid ${cat.color}40` }}
          >
            <CatIcon size={16} style={{ color: cat.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[13px] font-semibold truncate" style={{ color: "var(--cream)" }}>{server.name}</span>
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                style={{ color: status.color, background: status.bg }}
              >
                <StatusIcon size={9} />{status.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--cream-dim)" }}>
              <span className="px-1.5 py-0.5 rounded" style={{ background: `${cat.color}10` }}>{cat.label}</span>
              <span>·</span>
              <span className="tabular-nums">{server.toolCount} tools</span>
              <span>·</span>
              <code className="text-[9px] opacity-70">{server.id}</code>
            </div>
            <p className="text-[11px] mt-2 leading-relaxed line-clamp-2" style={{ color: "var(--cream-soft)" }}>
              {server.description}
            </p>
          </div>
          <ChevronDown
            size={14}
            className="shrink-0 transition-transform"
            style={{ color: "var(--cream-dim)", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: "1px solid var(--rig-border)" }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div>
                <div className="text-[9px] uppercase tracking-[0.18em] mb-1.5" style={{ color: "var(--cream-dim)" }}>
                  Tool Surface
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {server.capabilities.map((c) => (
                    <code
                      key={c}
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: `${cat.color}12`, color: cat.color, border: `1px solid ${cat.color}30` }}
                    >
                      {c}
                    </code>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2" style={{ borderTop: "1px solid var(--rig-border)" }}>
                <Mini label="Status"   value={status.label} color={status.color} />
                <Mini label="Category" value={cat.label}    color={cat.color} />
                <Mini label="Tools"    value={String(server.toolCount)} color="var(--cream)" />
              </div>

              <button
                className="w-full mt-1 px-3 py-1.5 rounded text-[11px] flex items-center justify-center gap-1.5"
                style={{ background: `${cat.color}1A`, border: `1px solid ${cat.color}40`, color: cat.color }}
              >
                <Terminal size={11} />Invoke via Hermes / RIG-OS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>{label}</div>
      <div className="text-[12px] font-semibold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
