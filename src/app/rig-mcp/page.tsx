"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Server, Activity, Boxes, CheckCircle, AlertCircle, Search,
} from "lucide-react";
import type { MCPServer } from "@/lib/rig-mcp-registry";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  connected: { color: "var(--emerald)", icon: <CheckCircle size={12} />, label: "Connected" },
  disconnected: { color: "var(--cream-dim)", icon: <AlertCircle size={12} />, label: "Disconnected" },
  error: { color: "#ef4444", icon: <AlertCircle size={12} />, label: "Error" },
  unknown: { color: "var(--cream-mute)", icon: <Server size={12} />, label: "Unknown" },
};

const CATEGORY_COLORS: Record<string, string> = {
  automation: "#22d3ee",
  dev: "#d4a574",
  data: "#5ab896",
  research: "#a855f7",
  compute: "#fbbf24",
  business: "#c4607e",
  orchestration: "#ef4444",
  reasoning: "#7c3aed",
  devops: "#22c55e",
};

export default function McpPage() {
  const [mcps, setMcps] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/mcp");
      const data = await res.json();
      setMcps(data.servers || []);
    } catch {
      // fallback to static import
      try {
        const { getMCPs } = await import("@/lib/rig-mcp-registry");
        setMcps(getMCPs());
      } catch {
        setMcps([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = Array.from(new Set(mcps.map((m) => m.category)));
  const filtered = mcps.filter((m) => {
    if (filterCategory !== "all" && m.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const connected = mcps.filter((m) => m.status === "connected").length;
  const totalTools = mcps.reduce((s, m) => s + m.toolCount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>MCP Registry</h1>
        <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>Loading MCP servers…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Server size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Infrastructure
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          MCP Registry
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
          {mcps.length} MCP servers · {connected} connected · {totalTools} total tools across {categories.length} categories
        </p>
      </motion.section>

      {/* KPI Cards */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Servers", value: mcps.length, accent: "var(--cream)", icon: <Server size={14} /> },
          { label: "Connected", value: connected, accent: "var(--emerald)", icon: <CheckCircle size={14} /> },
          { label: "Total Tools", value: totalTools, accent: "var(--gold)", icon: <Boxes size={14} /> },
          { label: "Categories", value: categories.length, accent: "var(--plum)", icon: <Activity size={14} /> },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: k.accent }}>
              {k.icon}
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{k.label}</span>
            </div>
            <div className="text-2xl" style={{ color: k.accent, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500 }}>{k.value}</div>
          </div>
        ))}
      </motion.div>

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
            placeholder="Search servers, capabilities…"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-[12px] outline-none"
          style={{ background: "var(--bg-card)", color: "var(--cream)", border: "1px solid var(--line-soft)" }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c} className="capitalize">{c}</option>
          ))}
        </select>
      </div>

      {/* MCP Server Cards */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((mcp) => {
          const statusConfig = STATUS_CONFIG[mcp.status] || STATUS_CONFIG.unknown;
          const catColor = CATEGORY_COLORS[mcp.category] || "var(--cream-dim)";
          return (
            <div
              key={mcp.id}
              className="rounded-xl p-5 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="grid place-items-center w-10 h-10 rounded-lg"
                    style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}44` }}
                  >
                    <Server size={18} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>{mcp.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: catColor }}>
                        {mcp.category}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{mcp.toolCount} tools</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: "var(--bg-mid)", color: statusConfig.color }}
                  >
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </div>
              </div>
              <p className="text-[12px] mb-3" style={{ color: "var(--cream-dim)" }}>{mcp.description}</p>
              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5">
                {mcp.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-[10px] px-2 py-0.5 rounded font-mono"
                    style={{ background: "var(--bg-mid)", color: "var(--cream-mute)" }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && !loading && (
        <div className="rounded-xl p-8 text-center border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <Server size={32} style={{ color: "var(--cream-mute)", margin: "0 auto 8px" }} />
          <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>
            No MCP servers match the current filter.
          </div>
        </div>
      )}
    </div>
  );
}