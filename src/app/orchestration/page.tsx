"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cpu, Activity, Server, Zap, Clock, CheckCircle2,
  AlertCircle, Pause, Radio, ArrowRight, RefreshCw,
} from "lucide-react";

interface AgentNode {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "active" | "idle" | "dispatched" | "offline";
  model: string;
  capabilities: string[];
  currentTask: string | null;
  tasksCompleted: number;
  lastHeartbeat: string;
  coordinate: string;
}

interface OrchestrationData {
  team: AgentNode[];
  summary: {
    total: number;
    active: number;
    idle: number;
    offline: number;
    totalTasksCompleted: number;
    paperclipCompanies: number;
    hermesModel: string;
    hermesProvider: string;
    infrastructure: Record<string, boolean>;
  };
  timestamp: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const DEPT_COLORS: Record<string, string> = {
  Core: "#5ab896",
  Operations: "#4a9eff",
  Studios: "#ec4899",
  GTM: "#5ab896",
  Strategy: "#c084fc",
  Quality: "#ef4444",
  Finance: "#06b6d4",
  Marketing: "#f97316",
  Intelligence: "#fbbf24",
  Comms: "#a855f7",
  Infrastructure: "#22d3ee",
};

const STATUS_CONFIG = {
  active: { color: "#22c55e", glow: "0 0 8px #22c55e60", icon: <Radio size={10} /> },
  idle: { color: "#fbbf24", glow: "none", icon: <Pause size={10} /> },
  dispatched: { color: "#4a9eff", glow: "0 0 8px #4a9eff60", icon: <Zap size={10} /> },
  offline: { color: "#ef4444", glow: "none", icon: <AlertCircle size={10} /> },
};

export default function OrchestrationPage() {
  const [data, setData] = useState<OrchestrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/orchestration");
        if (!res.ok) return;
        const json = await res.json();
        if (active) {
          setData(json);
          setLastUpdate(new Date().toLocaleTimeString());
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-[var(--cream-mute)]">Initializing 20-agent orchestration...</div>
      </div>
    );
  }

  const team = data?.team ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--gold)" }}>
            20-Agent Parallel Orchestration · Jake Conducting
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--cream)" }}>RIG Orchestration Command Center</h1>
        <p className="text-[13px]" style={{ color: "var(--cream-dim)" }}>
          Live status of all 20 agents working in parallel. Jake conducts, V decides, Mike approves.
        </p>
      </motion.div>

      {/* Summary strip */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Active", value: summary?.active ?? 0, color: "#22c55e", icon: <Radio size={14} /> },
            { label: "Idle", value: summary?.idle ?? 0, color: "#fbbf24", icon: <Pause size={14} /> },
            { label: "Offline", value: summary?.offline ?? 0, color: "#ef4444", icon: <AlertCircle size={14} /> },
            { label: "Total Tasks", value: summary?.totalTasksCompleted ?? 0, color: "#4a9eff", icon: <CheckCircle2 size={14} /> },
            { label: "Paperclip", value: summary?.paperclipCompanies ?? 0, color: "#a855f7", icon: <Server size={14} /> },
            { label: "Model", value: summary?.hermesModel ?? "—", color: "#5ab896", icon: <Cpu size={14} /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ color: s.color }}>{s.icon}</span>
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>{s.label}</span>
              </div>
              <div className="text-[16px] font-bold mono truncate" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Infrastructure status */}
      {summary?.infrastructure && (
        <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
          <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl border flex-wrap" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>Infrastructure:</span>
            {Object.entries(summary.infrastructure).map(([key, up]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: up ? "#22c55e" : "#ef4444",
                    boxShadow: up ? "0 0 4px #22c55e80" : "none",
                  }}
                />
                <span className="text-[11px]" style={{ color: up ? "var(--cream)" : "var(--cream-dim)" }}>{key}</span>
              </div>
            ))}
            <span className="ml-auto text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
              <RefreshCw size={9} className="inline mr-1" />{lastUpdate}
            </span>
          </div>
        </motion.div>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {team.map((agent, i) => {
          const deptColor = DEPT_COLORS[agent.department] ?? "#71717a";
          const statusCfg = STATUS_CONFIG[agent.status];
          return (
            <motion.div key={agent.id} {...fadeUp} transition={{ delay: Math.min(i * 0.02, 0.5) }}>
              <div
                className="rounded-xl border p-4 h-full relative overflow-hidden"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                {/* Status dot */}
                <div
                  className="absolute top-3 right-3 w-2 h-2 rounded-full"
                  style={{ background: statusCfg.color, boxShadow: statusCfg.glow }}
                />

                {/* Agent header */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                    style={{ background: `${deptColor}15`, border: `1px solid ${deptColor}40` }}
                  >
                    <Cpu size={14} style={{ color: deptColor }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold truncate" style={{ color: "var(--cream)" }}>{agent.name}</h3>
                    <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{agent.department}</span>
                  </div>
                </div>

                {/* Role */}
                <div className="text-[11px] mb-2" style={{ color: "var(--cream-dim)" }}>{agent.role}</div>

                {/* Status badge */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span style={{ color: statusCfg.color }}>{statusCfg.icon}</span>
                  <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: statusCfg.color }}>
                    {agent.status}
                  </span>
                </div>

                {/* Current task */}
                {agent.currentTask && (
                  <div className="text-[10px] mb-3 p-2 rounded-md" style={{ background: "rgba(0,0,0,0.2)", color: "var(--cream-dim)" }}>
                    {agent.currentTask}
                  </div>
                )}

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: `${deptColor}08`, color: "var(--cream-dim)" }}
                    >
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5" style={{ color: "var(--cream-mute)" }}>
                      +{agent.capabilities.length - 3}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
                  <span className="text-[10px] mono" style={{ color: "var(--cream-mute)" }}>{agent.coordinate}</span>
                  <span className="text-[10px] mono" style={{ color: deptColor }}>
                    {agent.tasksCompleted} tasks
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom: Paperclip 24/7 status */}
      <motion.div {...fadeUp}>
        <a href="/paperclip">
          <div
            className="rounded-xl p-5 border flex items-center justify-between transition hover:bg-[rgba(255,255,255,0.02)] cursor-pointer"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl grid place-items-center"
                style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)" }}
              >
                <Server size={18} style={{ color: "#a855f7" }} />
              </div>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
                  Paperclip — 24/7 Operations
                </div>
                <div className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
                  {summary?.paperclipCompanies ?? 0} companies · Operational {(summary?.infrastructure as any)?.port3100 ? "✅" : "❌"}
                </div>
              </div>
            </div>
            <ArrowRight size={18} style={{ color: "var(--cream-mute)" }} />
          </div>
        </a>
      </motion.div>
    </div>
  );
}
