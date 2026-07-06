"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plug, PlugZap, AlertTriangle, AlertCircle, CheckCircle2,
  Search, Wifi, WifiOff, KeyRound, Cpu, Hash,
  Shield, Sparkles, RefreshCw, Database, Bot,
  Mail, Video, Mic, Globe, Code2, Cloud,
  ChevronDown, Filter, Layers, Activity,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// Midnight Aubergine Connections Command — Wires /api/agency/connections
// (23 external integrations, 5 status tiers, env keys, models) into a real
// inspectable surface with status matrix, category rollups, and per-row
// detail (env, models, note, fix hints).
// ────────────────────────────────────────────────────────────────────────

type ConnStatus = "connected" | "disconnected" | "expired" | "missing" | "partial";

interface Connection {
  name: string;
  env: string;
  status: ConnStatus;
  models?: number;
  note?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const STATUS_META: Record<ConnStatus, { label: string; color: string; icon: any }> = {
  connected:    { label: "Connected",    color: "#10b981", icon: CheckCircle2 },
  disconnected: { label: "Disconnected", color: "#f59e0b", icon: AlertTriangle },
  expired:      { label: "Expired",      color: "#ef4444", icon: AlertCircle },
  missing:      { label: "Missing",      color: "#94a3b8", icon: KeyRound },
  partial:      { label: "Partial",      color: "#a855f7", icon: Activity },
};

const CATEGORY_HINTS: Array<{ match: RegExp; category: string; icon: any; color: string }> = [
  { match: /(openai|anthropic|gemini|groq|higgsfield|heygen|hf|huggingface|ollama|deepgram|elevenlabs|fal|recall)/i, category: "AI / Models",     icon: Cpu,      color: "#a855f7" },
  { match: /(openrouter|exa|tavily|brave|firecrawl|firehose|notebooklm|apify|google\s*cloud)/i,                       category: "Data / Search",  icon: Globe,    color: "#22d3ee" },
  { match: /(github|cloudflare|docker|colima|supabase|cua-driver|notebooklm mcp)/i,                                    category: "Dev Platform",   icon: Code2,    color: "#60a5fa" },
  { match: /(resend|stripe|heygen|tavily)/i,                                                                          category: "Business Ops",   icon: Mail,     color: "#f59e0b" },
  { match: /(higgsfield|heygen)/i,                                                                                     category: "Video / Media",  icon: Video,    color: "#ec4899" },
];

function categorize(name: string) {
  for (const h of CATEGORY_HINTS) {
    if (h.match.test(name)) return h;
  }
  return { category: "Other", icon: Plug, color: "#94a3b8", match: /.*/ };
}

function fixHint(c: Connection): string | null {
  switch (c.status) {
    case "connected": return null;
    case "disconnected": return `Re-authenticate — set or refresh ${c.env}`;
    case "expired": return `Replace expired ${c.env} from provider console`;
    case "missing": return `Set ${c.env} — ${c.note ?? "not configured"}`;
    case "partial": return `Finish setup — ${c.note ?? "partial config"}`;
  }
}

export default function ConnectionsCommand() {
  const [data, setData] = useState<{ connections: Connection[]; _source?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/agency/connections", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!cancelled) { setData(j); setError(null); }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      }
    }
    load();
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // refresh when tick changes
  useEffect(() => {
    if (tick === 0) return;
    let cancelled = false;
    fetch("/api/agency/connections", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (!cancelled && j) setData(j); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tick]);

  const conns = data?.connections ?? [];

  const stats = useMemo(() => {
    const out = { total: conns.length, connected: 0, disconnected: 0, expired: 0, missing: 0, partial: 0, models: 0, withKeys: 0 };
    for (const c of conns) {
      out[c.status]++;
      if (c.models) out.models += c.models;
      if (c.env && c.env !== "-") out.withKeys++;
    }
    return out;
  }, [conns]);

  const categories = useMemo(() => {
    const map = new Map<string, { count: number; connected: number; color: string; icon: any }>();
    for (const c of conns) {
      const cat = categorize(c.name);
      const cur = map.get(cat.category) ?? { count: 0, connected: 0, color: cat.color, icon: cat.icon };
      cur.count++;
      if (c.status === "connected") cur.connected++;
      map.set(cat.category, cur);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [conns]);

  const filtered = useMemo(() => {
    return conns.filter((c) => {
      const okFilter = filter === "all" ? true : c.status === filter;
      const q = search.trim().toLowerCase();
      const okSearch = !q
        || c.name.toLowerCase().includes(q)
        || (c.env ?? "").toLowerCase().includes(q)
        || (c.note ?? "").toLowerCase().includes(q);
      return okFilter && okSearch;
    });
  }, [conns, filter, search]);

  const healthScore = stats.total === 0 ? 0 : Math.round((stats.connected / stats.total) * 100);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <PlugZap size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Integrations
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <h1 className="text-3xl tracking-tight"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Connections Command
            </h1>
            <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--cream-dim)" }}>
              {error
                ? `API /api/agency/connections — ${error}`
                : `${stats.total} external integrations across ${categories.length} categories — live status, env keys, models, and fix hints in one surface.`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--cream-mute)" }}>
            <RefreshCw size={11} className={tick > 0 ? "animate-spin" : ""} />
            60s auto-refresh · tick {tick}
          </div>
        </div>
      </motion.section>

      {/* KPI Strip */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total",       value: stats.total,                            icon: Layers,        color: "var(--cream)" },
            { label: "Connected",   value: stats.connected,                        icon: CheckCircle2,  color: "#10b981" },
            { label: "Disconnected",value: stats.disconnected,                     icon: AlertTriangle, color: "#f59e0b" },
            { label: "Expired",     value: stats.expired,                          icon: AlertCircle,   color: "#ef4444" },
            { label: "Missing",     value: stats.missing,                          icon: KeyRound,      color: "#94a3b8" },
            { label: "Partial",     value: stats.partial,                          icon: Activity,      color: "#a855f7" },
            { label: "Models / Keys", value: `${stats.models}/${stats.withKeys}`, icon: Hash,          color: "#22d3ee" },
          ].map((k) => {
            const Ic = k.icon;
            return (
              <div key={k.label}
                className="rounded-xl p-3 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Ic size={14} style={{ color: k.color }} />
                  <span className="text-[10px] uppercase tracking-wider"
                    style={{ color: "var(--cream-dim)" }}>{k.label}</span>
                </div>
                <div className="text-xl"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: k.color }}>
                  {k.value}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Health + Categories row */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4">
        {/* Health gauge */}
        <div className="rounded-xl p-5 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={15} style={{ color: "var(--gold)" }} />
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>Health Score</h2>
          </div>
          <div className="flex items-center justify-center my-3">
            <div className="relative grid place-items-center w-[140px] h-[140px]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" stroke="var(--line-soft)" strokeWidth="8" fill="none" />
                <circle cx="50" cy="50" r="42"
                  stroke={healthScore >= 75 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8" fill="none"
                  strokeDasharray={`${(healthScore / 100) * 264} 264`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 600ms ease" }} />
              </svg>
              <div className="text-center">
                <div className="text-[28px] font-semibold"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif",
                    color: healthScore >= 75 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444" }}>
                  {healthScore}
                </div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                  of 100
                </div>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-center"
            style={{ color: healthScore >= 75 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444" }}>
            {healthScore >= 75 ? "Healthy" : healthScore >= 50 ? "Degraded" : "Critical"}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-lg p-2 border flex items-center gap-1.5"
              style={{ borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
              <Wifi size={11} /> live: {stats.connected}
            </div>
            <div className="rounded-lg p-2 border flex items-center gap-1.5"
              style={{ borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
              <WifiOff size={11} /> down: {stats.total - stats.connected}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-xl p-5 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Filter size={15} style={{ color: "var(--gold)" }} />
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>By Category</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(([cat, m]) => {
              const Ic = m.icon;
              const pct = m.count ? Math.round((m.connected / m.count) * 100) : 0;
              return (
                <button key={cat}
                  onClick={() => setFilter(cat === filter ? "all" : "all" /* search scoped below */)}
                  className="text-left rounded-lg p-3 border transition hover:border-[var(--gold)]"
                  style={{ borderColor: "var(--line-soft)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Ic size={14} style={{ color: m.color }} />
                    <span className="text-[12.5px] font-semibold" style={{ color: "var(--cream)" }}>{cat}</span>
                    <span className="text-[10px] ml-auto" style={{ color: "var(--cream-mute)" }}>
                      {m.connected}/{m.count}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--line-soft)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: m.color }} />
                  </div>
                  <div className="text-[10px] mt-1.5" style={{ color: "var(--cream-mute)" }}>
                    {pct}% online
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Filters + search */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 border flex-1 max-w-[420px]"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <Search size={14} style={{ color: "var(--cream-mute)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, env, or note…"
            className="flex-1 bg-transparent border-none outline-none text-[12.5px]"
            style={{ color: "var(--cream)" }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "connected", "partial", "disconnected", "expired", "missing"] as const).map((s) => {
            const meta = s === "all"
              ? { label: "All", color: "var(--cream)", count: stats.total }
              : { ...STATUS_META[s as ConnStatus], count: stats[s as ConnStatus] ?? 0 };
            const active = filter === s;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className="rounded-full px-3 py-1 border text-[11px] transition"
                style={{
                  borderColor: active ? meta.color : "var(--line-soft)",
                  background: active ? `${meta.color}1f` : "transparent",
                  color: active ? meta.color : "var(--cream-dim)",
                }}>
                {meta.label} · {meta.count}
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* Connection table */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] uppercase tracking-wider border-b"
            style={{ color: "var(--cream-mute)", borderColor: "var(--line-soft)" }}>
            <div className="col-span-4">Integration</div>
            <div className="col-span-3">Env Key</div>
            <div className="col-span-2">Models</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">›</div>
          </div>
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[12px]" style={{ color: "var(--cream-mute)" }}>
              No connections match the current filter / search.
            </div>
          )}
          {filtered.map((c) => {
            const meta = STATUS_META[c.status];
            const Ic = meta.icon;
            const cat = categorize(c.name);
            const Cat = cat.icon;
            const fix = fixHint(c);
            const isOpen = expanded === c.name;
            return (
              <div key={c.name}
                className="border-b"
                style={{ borderColor: "var(--line-soft)" }}>
                <button onClick={() => setExpanded(isOpen ? null : c.name)}
                  className="w-full grid grid-cols-12 px-4 py-3 text-left text-[12.5px] transition hover:bg-[rgba(255,255,255,0.02)]"
                  style={{ color: "var(--cream)" }}>
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <Cat size={14} style={{ color: cat.color }} />
                    <span className="font-medium truncate">{c.name}</span>
                    <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded"
                      style={{ background: "var(--line-soft)", color: "var(--cream-mute)" }}>
                      {cat.category}
                    </span>
                  </div>
                  <div className="col-span-3 mono text-[11.5px] truncate" style={{ color: "var(--cream-dim)" }}>
                    {c.env && c.env !== "-" ? c.env : "—"}
                  </div>
                  <div className="col-span-2 text-[11.5px]" style={{ color: "var(--cream-dim)" }}>
                    {c.models ? `${c.models} models` : "—"}
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Ic size={13} style={{ color: meta.color }} />
                    <span style={{ color: meta.color }}>{meta.label}</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <ChevronDown size={14}
                      className="transition-transform"
                      style={{ color: "var(--cream-mute)", transform: isOpen ? "rotate(180deg)" : "none" }} />
                  </div>
                </button>
                {isOpen && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-3 gap-3"
                    style={{ borderTop: "1px dashed var(--line-soft)" }}>
                    <div className="rounded-lg p-3 border" style={{ borderColor: "var(--line-soft)" }}>
                      <div className="text-[10px] uppercase mb-1" style={{ color: "var(--cream-mute)" }}>Note</div>
                      <div className="text-[12.5px]" style={{ color: "var(--cream)" }}>
                        {c.note || "—"}
                      </div>
                    </div>
                    <div className="rounded-lg p-3 border" style={{ borderColor: "var(--line-soft)" }}>
                      <div className="text-[10px] uppercase mb-1" style={{ color: "var(--cream-mute)" }}>Fix Hint</div>
                      <div className="text-[12.5px]"
                        style={{ color: fix ? meta.color : "var(--cream-mute)" }}>
                        {fix || "OK — no action needed."}
                      </div>
                    </div>
                    <div className="rounded-lg p-3 border" style={{ borderColor: "var(--line-soft)" }}>
                      <div className="text-[10px] uppercase mb-1" style={{ color: "var(--cream-mute)" }}>Health</div>
                      <div className="flex items-center gap-2">
                        <span className="grid place-items-center w-7 h-7 rounded-md"
                          style={{ background: `${meta.color}1a`, color: meta.color }}>
                          <Ic size={14} />
                        </span>
                        <div>
                          <div className="text-[12.5px] font-medium" style={{ color: meta.color }}>{meta.label}</div>
                          <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{cat.category}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Doctrine footer */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}
        className="rounded-xl p-4 border flex items-start gap-3"
        style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
        <Sparkles size={16} style={{ color: "var(--gold)" }} className="mt-0.5" />
        <div>
          <div className="text-[12.5px] font-semibold mb-1" style={{ color: "var(--cream)" }}>
            Live data — no manual edits, no double bookings.
          </div>
          <div className="text-[11.5px]" style={{ color: "var(--cream-dim)" }}>
            Source: <span className="mono">/api/agency/connections</span> ·{" "}
            {stats.total} services · {stats.connected} online · 60s refresh ·{" "}
            click any row to expand fix hints.
          </div>
        </div>
      </motion.section>
    </div>
  );
}
