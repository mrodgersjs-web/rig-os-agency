"use client";

import { motion } from "framer-motion";
import { Boxes, Cpu, Activity, Zap } from "lucide-react";
import { getFleetStats, RIG_CORE_AGENTS } from "@/lib/rig-fleet";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function FleetPage() {
  const stats = getFleetStats();

  const categoryColors: Record<string, string> = {
    rig_core: "#ef4444",
    agency: "#7c3aed",
    rig_expert: "#d4a574",
    voltagent: "#22c55e",
  };

  const categoryNames: Record<string, string> = {
    rig_core: "RIG Core",
    agency: "Agency Agents",
    rig_expert: "RIG Domain Experts",
    voltagent: "VoltAgent Subagents",
  };

  return (
    <div className="space-y-8">
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
          232 Agency Agents + 86 RIG domain experts + VoltAgent Codex subagents + 6 RIG core agents. The full RIG fleet.
        </p>
      </motion.section>

      {/* Stats */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Agents", value: stats.total, accent: "var(--gold)" },
            { label: "Active", value: stats.byStatus.active, accent: "var(--emerald)" },
            { label: "Idle", value: stats.byStatus.idle, accent: "var(--gold)" },
            { label: "Unloaded", value: stats.byStatus.unloaded, accent: "var(--cream-dim)" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>{k.label}</div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(stats.byCategory).map(([cat, count]) => (
            <div key={cat} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: categoryColors[cat] || "var(--cream-dim)" }} />
                <span className="text-[14px] font-medium" style={{ color: "var(--cream)" }}>{categoryNames[cat] || cat}</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: categoryColors[cat] || "var(--cream)" }}>{count}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* RIG Core Agents */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>II.</span> RIG Core Agents</span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RIG_CORE_AGENTS.map((agent) => {
            const accent = agent.id === "hermes" ? "#60a5fa" : agent.id === "claude" ? "#d97757" : agent.id === "codex" ? "#22c55e" : agent.id === "openclaw" ? "#f472b6" : agent.id === "picode" ? "#fbbf24" : "#60a5fa";
            return (
              <div key={agent.id} className="rounded-xl p-4 border flex items-start gap-3" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                <div className="grid place-items-center w-10 h-10 rounded-lg shrink-0" style={{ background: accent + "15", color: accent, border: `1px solid ${accent}55` }}>
                  <Cpu size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>{agent.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>{agent.role}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.capabilities.map((cap) => (
                      <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}>{cap}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] mono" style={{ color: "var(--cream-mute)" }}>{agent.invocationPath}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.status === "active" ? "var(--emerald)" : "var(--gold)" }} />
                      <span className="text-[10px]" style={{ color: "var(--cream-dim)" }}>{agent.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Fleet Sources */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 mb-3"><Zap size={14} style={{ color: "var(--gold)" }} /><span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Fleet Sources</span></div>
          <div className="space-y-2 text-[12px] mono" style={{ color: "var(--cream-dim)" }}>
            <div>• Agency Agents: <span style={{ color: "var(--cream)" }}>/Users/rig128gb/Developer/agency-agents</span></div>
            <div>• RIG Experts: <span style={{ color: "var(--cream)" }}>~/.cursor/rules/rig-*.mdc</span></div>
            <div>• VoltAgent: <span style={{ color: "var(--cream)" }}>~/.codex/agents/voltagent-*.toml</span></div>
            <div>• Cross-harness: <span style={{ color: "var(--cream)" }}>Hermes / Claude Code / Codex CLI</span></div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}