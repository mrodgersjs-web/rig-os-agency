"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Boxes, Users, Cpu, Search, Zap, Shield, Server,
  TrendingUp, Target, Layers, GitBranch, ArrowRight,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  count: number;
  color: string;
  roles: string[];
  highlights: string[];
}

interface AgencyData {
  total: number;
  departments: Department[];
  source: string;
  inventoryPath: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function AgencyAgentsPage() {
  const [data, setData] = useState<AgencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agency-agents")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-[var(--cream-mute)]">Loading agency catalog...</div>
      </div>
    );
  }

  const depts = data?.departments ?? [];
  const filtered = activeDept ? depts.filter((d) => d.id === activeDept) : depts;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--gold)" }}>
            232 Installable Specs · 8 Departments
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--cream)" }}>Agency Agents Catalog</h1>
        <p className="text-[13px]" style={{ color: "var(--cream-dim)" }}>
          Full specialized agency roster for routing, team design, and department mapping.
          Source: <code className="text-[11px]" style={{ color: "var(--gold)" }}>{data?.inventoryPath}</code>
        </p>
      </motion.div>

      {/* Stats strip */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Agents", value: data?.total ?? 232, icon: <Boxes size={16} />, accent: "#4a9eff" },
            { label: "Departments", value: depts.length, icon: <Layers size={16} />, accent: "#5ab896" },
            { label: "Codex TOMLs", value: 232, icon: <Cpu size={16} />, accent: "#fbbf24" },
            { label: "Claude Wrappers", value: 232, icon: <GitBranch size={16} />, accent: "#a855f7" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: s.accent }}>{s.icon}</span>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>{s.label}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: "var(--cream)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Department filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveDept(null)}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition"
          style={{
            borderColor: activeDept === null ? "var(--gold)" : "var(--line-soft)",
            color: activeDept === null ? "var(--gold)" : "var(--cream-dim)",
            background: activeDept === null ? "rgba(212,165,116,0.1)" : "transparent",
          }}
        >
          All Departments
        </button>
        {depts.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDept(d.id)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition"
            style={{
              borderColor: activeDept === d.id ? d.color : "var(--line-soft)",
              color: activeDept === d.id ? d.color : "var(--cream-dim)",
              background: activeDept === d.id ? `${d.color}15` : "transparent",
            }}
          >
            {d.name} ({d.count})
          </button>
        ))}
      </div>

      {/* Department cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dept, i) => (
          <motion.div
            key={dept.id}
            {...fadeUp}
            transition={{ delay: i * 0.03 }}
          >
            <div
              className="rounded-xl border p-5 h-full"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              {/* Department header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg grid place-items-center"
                      style={{ background: `${dept.color}15`, border: `1px solid ${dept.color}40` }}
                    >
                      <Users size={16} style={{ color: dept.color }} />
                    </div>
                    <h3 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{dept.name}</h3>
                  </div>
                  <span className="text-[11px] mt-1 inline-block" style={{ color: "var(--cream-dim)" }}>
                    {dept.count} specialist roles
                  </span>
                </div>
                <span
                  className="text-[20px] font-bold mono"
                  style={{ color: dept.color }}
                >
                  {String(dept.count).padStart(2, "0")}
                </span>
              </div>

              {/* Roles */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {dept.roles.map((role) => (
                  <span
                    key={role}
                    className="text-[10px] px-2 py-1 rounded-md"
                    style={{ background: `${dept.color}10`, color: "var(--cream-dim)", border: `1px solid ${dept.color}25` }}
                  >
                    {role}
                  </span>
                ))}
              </div>

              {/* Highlight agents */}
              <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: "var(--line-soft)" }}>
                {dept.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-[11px]" style={{ color: "var(--cream-dim)" }}>
                    <Zap size={10} style={{ color: dept.color }} />
                    <code style={{ color: "var(--cream)" }}>{h}</code>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div {...fadeUp}>
        <div className="rounded-xl p-5 border flex items-center justify-between flex-wrap gap-4" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div>
            <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>Agency Routing Model</div>
            <div className="text-[12px] mono" style={{ color: "var(--cream-dim)" }}>
              RIG task → matched agency role → OpenClaw instant skill surface → ProofPacket
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/agency/agents" className="px-4 py-2 rounded-lg text-[12px] font-medium transition" style={{ background: "var(--gold)", color: "var(--bg-deep)" }}>
              View Agent Roster →
            </a>
            <a href="/voltagents" className="px-4 py-2 rounded-lg text-[12px] font-medium border transition" style={{ borderColor: "var(--line)", color: "var(--cream)" }}>
              VoltAgent Catalog →
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
