"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Boxes, Cpu, Activity, Zap, Search, Bot,
} from "lucide-react";
import type { AgentEntry, AgentCategory, AgentStatus } from "@/lib/rig-fleet";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const CATEGORY_COLORS: Record<string, string> = {
  rig_core: "#ef4444",
  agency: "#7c3aed",
  rig_expert: "#d4a574",
  voltagent: "#22c55e",
};

const CATEGORY_NAMES: Record<string, string> = {
  rig_core: "RIG Core",
  agency: "Agency Agents",
  rig_expert: "RIG Domain Experts",
  voltagent: "VoltAgent Subagents",
};

const STATUS_COLORS: Record<string, string> = {
  active: "var(--emerald)",
  idle: "var(--gold)",
  errored: "#ef4444",
  unloaded: "var(--cream-mute)",
};

interface FleetStats {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  inventoryCounts?: Record<string, number>;
}

export default function FleetPage() {
  const [agents, setAgents] = useState<AgentEntry[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/fleet");
      const data = await res.json();
      setAgents(data.agents || []);
      setStats(data.stats || null);
    } catch {
      // fallback to static data
      try {
        const { getFullFleet, getFleetStats } = await import("@/lib/rig-fleet");
        setAgents(getFullFleet());
        setStats(getFleetStats());
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = agents.filter((a) => {
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>Agent Fleet Registry</h1>
        <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>Loading fleet…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Boxes size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Agent Fleet
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Agent Fleet Registry
        </h1>
        <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          {agents.length} agents loaded from real inventory files · {stats?.byStatus.active || 0} active · {stats?.byStatus.idle || 0} idle
        </p>
      </motion.section>

      {/* Stats */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Agents", value: agents.length, accent: "var(--gold)", icon: <Boxes size={14} /> },
            { label: "Active", value: stats?.byStatus.active || 0, accent: "var(--emerald)", icon: <Activity size={14} /> },
            { label: "Idle", value: stats?.byStatus.idle || 0, accent: "var(--gold)", icon: <Zap size={14} /> },
            { label: "Unloaded", value: stats?.byStatus.unloaded || 0, accent: "var(--cream-dim)", icon: <Bot size={14} /> },
          ].map((k) => (
            <div key={k.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-1" style={{ color: k.accent }}>
                {k.icon}
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{k.label}</span>
              </div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: k.accent }}>{k.value}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* By Category */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>I.</span> By Category</span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(stats?.byCategory || {}).map(([cat, count]) => (
            <div key={cat} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[cat] || "var(--cream-dim)" }} />
                <span className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{CATEGORY_NAMES[cat] || cat}</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: CATEGORY_COLORS[cat] || "var(--cream)" }}>{count}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} style={{ color: "var(--cream-mute)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg border text-[13px] outline-none"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
            placeholder="Search agents by name, role, capability…"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-[12px] outline-none"
          style={{ background: "var(--bg-card)", color: "var(--cream)", border: "1px solid var(--line-soft)" }}
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_NAMES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="text-[12px]" style={{ color: "var(--cream-mute)" }}>{filtered.length} shown</span>
      </div>

      {/* Agent Cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((agent) => {
            const accent = CATEGORY_COLORS[agent.category] || "var(--cream-dim)";
            return (
              <div key={agent.id} className="rounded-xl p-4 border flex items-start gap-3" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                <div className="grid place-items-center w-10 h-10 rounded-lg shrink-0" style={{ background: accent + "15", color: accent, border: `1px solid ${accent}55` }}>
                  <Cpu size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[13px] font-semibold truncate" style={{ color: "var(--cream)" }}>{agent.name}</h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: accent + "20", color: accent }}>
                      {CATEGORY_NAMES[agent.category] || agent.category}
                    </span>
                  </div>
                  <div className="text-[11px] mb-2" style={{ color: "var(--cream-dim)" }}>{agent.role}</div>
                  {agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {agent.capabilities.slice(0, 5).map((cap) => (
                        <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: "var(--cream-mute)" }}>{cap}</span>
                      ))}
                      {agent.capabilities.length > 5 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: "var(--cream-mute)" }}>+{agent.capabilities.length - 5}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[agent.status] || "var(--cream-mute)" }} />
                    <span className="text-[10px] capitalize" style={{ color: "var(--cream-dim)" }}>{agent.status}</span>
                    <span className="text-[9px] mono truncate" style={{ color: "var(--cream-mute)" }}>{agent.invocationPath}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="rounded-xl p-8 text-center border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <Bot size={32} style={{ color: "var(--cream-mute)", margin: "0 auto 8px" }} />
            <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>No agents match the current filter.</div>
          </div>
        )}
      </motion.section>

      {/* Fleet Sources */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 mb-3"><Zap size={14} style={{ color: "var(--gold)" }} /><span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Fleet Sources</span></div>
          <div className="space-y-2 text-[12px] mono" style={{ color: "var(--cream-dim)" }}>
            <div>• Agency Agents: <span style={{ color: "var(--cream)" }}>/Users/rig128gb/Developer/agency-agents</span> ({stats?.inventoryCounts?.agency ?? "?"} in inventory)</div>
            <div>• RIG Experts: <span style={{ color: "var(--cream)" }}>~/.cursor/rules/rig-*.mdc</span> ({stats?.inventoryCounts?.rig_expert ?? "?"} in inventory)</div>
            <div>• VoltAgent: <span style={{ color: "var(--cream)" }}>~/.codex/agents/voltagent-*.toml</span> ({stats?.inventoryCounts?.voltagent ?? "?"} in inventory)</div>
            <div>• Cross-harness: <span style={{ color: "var(--cream)" }}>Hermes / Claude Code / Codex CLI</span></div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}