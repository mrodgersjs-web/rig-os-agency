"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Cpu,
  Activity,
  Loader2,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
interface AgentEntry {
  id: string;
  name: string;
  category: "agency" | "rig_expert" | "voltagent" | "rig_core";
  role: string;
  capabilities: string[];
  invocationPath: string;
  status: "active" | "idle" | "errored" | "unloaded";
}

interface FleetStats {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  inventoryCounts: Record<string, number>;
}

interface MCPServer {
  id: string;
  name: string;
  category: string;
  status: string;
  toolCount: number;
  capabilities: string[];
  description: string;
}

interface MCPStats {
  total: number;
  connected: number;
  disconnected: number;
  errored: number;
  totalTools: number;
}

const categoryColors: Record<string, string> = {
  rig_core: "#5ab896",
  agency: "#4a9eff",
  rig_expert: "#c084fc",
  voltagent: "#fbbf24",
};

const statusColors: Record<string, string> = {
  active: "#5ab896",
  idle: "var(--cream-dim)",
  errored: "#ef4444",
  unloaded: "#666",
};

const mcpStatusColors: Record<string, string> = {
  connected: "#5ab896",
  disconnected: "#666",
  error: "#ef4444",
  unknown: "#999",
};

export default function FleetPage() {
  const [agents, setAgents] = useState<AgentEntry[]>([]);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [mcpStats, setMcpStats] = useState<MCPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [fleetRes, mcpRes] = await Promise.all([
        fetch("/api/agency/fleet"),
        fetch("/api/agency/mcp"),
      ]);
      const fleetData = await fleetRes.json();
      const mcpData = await mcpRes.json();
      setAgents(fleetData.agents || []);
      setFleetStats(fleetData.stats || null);
      setMcpServers(mcpData.servers || []);
      setMcpStats(mcpData.stats || null);
    } catch (e) {
      console.error("Failed to load fleet/MCP:", e);
    }
    setLoading(false);
  }

  const filtered = agents.filter((a) => {
    if (activeCategory !== "all" && a.category !== activeCategory) return false;
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: "#5ab896" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 48px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            Agent Fleet & MCP Health
          </h1>
          <p style={{ color: "var(--cream-dim)", marginTop: 4 }}>
            Phase 6 & 7 — Real agent inventories + live MCP server registry
          </p>
        </div>
        <button
          onClick={loadAll}
          style={{
            background: "transparent",
            border: "1px solid var(--border-dim)",
            color: "var(--cream)",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          icon={<Users size={20} />}
          label="Total Agents"
          value={fleetStats?.total ?? 0}
          color="#4a9eff"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Active"
          value={fleetStats?.byStatus?.active ?? 0}
          color="#5ab896"
        />
        <StatCard
          icon={<Cpu size={20} />}
          label="MCP Servers"
          value={mcpStats?.total ?? 0}
          color="#c084fc"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="MCP Tools"
          value={mcpStats?.totalTools ?? 0}
          color="#fbbf24"
        />
      </div>

      {/* Fleet by Category */}
      {fleetStats && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <CategoryChip
            label="All"
            count={fleetStats.total}
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          />
          {Object.entries(fleetStats.byCategory).map(([cat, count]) => (
            <CategoryChip
              key={cat}
              label={cat.replace(/_/g, " ")}
              count={count}
              color={categoryColors[cat]}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--cream-dim)",
          }}
        />
        <input
          type="text"
          placeholder="Search agents by name, role, or capability..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px 10px 40px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-dim)",
            borderRadius: 8,
            color: "var(--cream)",
            fontSize: 14,
          }}
        />
      </div>

      {/* Agent Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 12,
          marginBottom: 48,
        }}
      >
        {filtered.slice(0, 100).map((agent) => (
          <div
            key={agent.id}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-dim)",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>{agent.name}</span>
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: categoryColors[agent.category] || "#666",
                  color: "#000",
                  fontWeight: 700,
                }}
              >
                {agent.category.replace(/_/g, " ")}
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--cream-dim)",
                margin: "0 0 8px 0",
                lineHeight: 1.4,
              }}
            >
              {agent.role}
            </p>
            {agent.capabilities.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {agent.capabilities.slice(0, 5).map((cap) => (
                  <span
                    key={cap}
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--cream-dim)",
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: statusColors[agent.status],
              }}
            >
              ● {agent.status}
            </div>
          </div>
        ))}
      </div>

      {/* MCP Servers Section */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        MCP Server Registry
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 12,
        }}
      >
        {mcpServers.map((srv) => (
          <div
            key={srv.id}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-dim)",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>{srv.name}</span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: mcpStatusColors[srv.status],
                }}
              >
                ● {srv.status}
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--cream-dim)",
                margin: "0 0 8px 0",
                lineHeight: 1.4,
              }}
            >
              {srv.description}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--cream-dim)" }}>
                {srv.toolCount} tools
              </span>
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  color: "var(--cream-dim)",
                }}
              >
                {srv.category}
              </span>
            </div>
            {srv.capabilities.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginTop: 8,
                }}
              >
                {srv.capabilities.map((cap) => (
                  <span
                    key={cap}
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--cream-dim)",
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-dim)",
        borderRadius: 10,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 12, color: "var(--cream-dim)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function CategoryChip({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(90,184,150,0.1)" : "var(--bg-elevated)",
        border: active ? "1px solid #5ab896" : "1px solid var(--border-dim)",
        borderRadius: 20,
        padding: "6px 14px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: "var(--cream)",
      }}
    >
      {color && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
          }}
        />
      )}
      <span style={{ textTransform: "capitalize" }}>{label}</span>
      <span style={{ color: "var(--cream-dim)", fontSize: 11 }}>{count}</span>
    </button>
  );
}
