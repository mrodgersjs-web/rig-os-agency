"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Server, Cpu, HardDrive, Activity, Radio, RefreshCw,
  Zap, Network, Box, Gauge, AlertCircle,
} from "lucide-react";

interface GPU {
  name: string;
  vram: string;
  utilization: string;
}

interface FleetNode {
  id: string;
  name: string;
  hostname: string;
  tailscaleIP: string;
  role: string;
  ram: string;
  storage: string;
  gpus?: GPU[];
  status: "online" | "offline";
  sshAccessible: boolean;
  services: string[];
  uptime?: string;
  loadAvg?: string;
  models?: string[];
  cpuCores?: number;
}

interface FleetData {
  nodes: FleetNode[];
  summary: {
    total: number;
    online: number;
    offline: number;
    sshAccessible: number;
    totalRAMGB: number;
    totalGPUs: number;
    network: string;
    orchestrator: string;
  };
  timestamp: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function FleetPage() {
  const [data, setData] = useState<FleetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/fleet");
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
    const interval = setInterval(load, 15000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-[var(--cream-mute)]">Scanning RIG fleet via Tailscale...</div>
      </div>
    );
  }

  const nodes = data?.nodes ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#22d3ee" }}>
            Tailscale Mesh Network · {summary?.total} Nodes · {summary?.totalRAMGB}GB Total RAM · {summary?.totalGPUs} GPUs
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--cream)" }}>RIG Fleet Command</h1>
        <p className="text-[13px]" style={{ color: "var(--cream-dim)" }}>
          Live status of all RIG compute nodes connected via Tailscale. Orchestrator: {summary?.orchestrator}
        </p>
      </motion.div>

      {/* Summary strip */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Online", value: `${summary?.online}/${summary?.total}`, color: "#22c55e", icon: <Radio size={14} /> },
            { label: "SSH Access", value: `${summary?.sshAccessible}/${summary?.total}`, color: "#4a9eff", icon: <Network size={14} /> },
            { label: "Total RAM", value: `${summary?.totalRAMGB} GB`, color: "#a855f7", icon: <Cpu size={14} /> },
            { label: "GPUs", value: String(summary?.totalGPUs ?? 0), color: "#fbbf24", icon: <Zap size={14} /> },
            { label: "Network", value: "Tailscale", color: "#22d3ee", icon: <Server size={14} /> },
            { label: "Updated", value: lastUpdate || "—", color: "var(--cream-mute)", icon: <RefreshCw size={14} /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ color: s.color }}>{s.icon}</span>
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>{s.label}</span>
              </div>
              <div className="text-[14px] font-bold mono truncate" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Node cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node, i) => {
          const isOnline = node.status === "online";
          const nodeColor = node.id === "blackwell" ? "#fbbf24"
            : node.id.includes("256") ? "#a855f7"
            : node.id.includes("96") ? "#4a9eff"
            : node.id.includes("128") ? "#5ab896"
            : "#22d3ee";

          return (
            <motion.div key={node.id} {...fadeUp} transition={{ delay: Math.min(i * 0.05, 0.5) }}>
              <div
                className="rounded-xl border p-5 h-full"
                style={{
                  background: "var(--bg-card)",
                  borderColor: isOnline ? `${nodeColor}40` : "var(--line-soft)",
                  opacity: isOnline ? 1 : 0.6,
                }}
              >
                {/* Node header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-lg grid place-items-center"
                      style={{ background: `${nodeColor}15`, border: `1px solid ${nodeColor}40` }}
                    >
                      <Server size={16} style={{ color: nodeColor }} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>{node.name}</h3>
                      <span className="text-[10px] mono" style={{ color: "var(--cream-mute)" }}>{node.tailscaleIP}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: isOnline ? "#22c55e" : "#ef4444",
                        boxShadow: isOnline ? "0 0 6px #22c55e80" : "none",
                      }}
                    />
                    <span className="text-[9px] uppercase tracking-wide" style={{ color: isOnline ? "#22c55e" : "#ef4444" }}>
                      {isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                </div>

                {/* Role */}
                <div className="text-[11px] mb-3" style={{ color: "var(--cream-dim)" }}>{node.role}</div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded-md" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--cream-mute)" }}>RAM</div>
                    <div className="text-[11px] font-medium mono" style={{ color: "var(--cream)" }}>{node.ram}</div>
                  </div>
                  <div className="p-2 rounded-md" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--cream-mute)" }}>CPU</div>
                    <div className="text-[11px] font-medium mono" style={{ color: "var(--cream)" }}>{node.cpuCores ? `${node.cpuCores} cores` : "—"}</div>
                  </div>
                  <div className="p-2 rounded-md" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--cream-mute)" }}>Storage</div>
                    <div className="text-[11px] font-medium mono truncate" style={{ color: "var(--cream)" }}>{node.storage}</div>
                  </div>
                  <div className="p-2 rounded-md" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--cream-mute)" }}>SSH</div>
                    <div className="text-[11px] font-medium mono" style={{ color: node.sshAccessible ? "#22c55e" : "#ef4444" }}>
                      {node.sshAccessible ? "✅ Accessible" : "❌ No access"}
                    </div>
                  </div>
                </div>

                {/* GPUs */}
                {node.gpus && node.gpus.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    {node.gpus.map((gpu, gi) => (
                      <div key={gi} className="flex items-center justify-between p-2 rounded-md" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                        <div className="flex items-center gap-1.5">
                          <Zap size={11} style={{ color: "#fbbf24" }} />
                          <span className="text-[10px] font-medium" style={{ color: "var(--cream)" }}>GPU {gi}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] mono" style={{ color: "#fbbf24" }}>{gpu.utilization}</div>
                          <div className="text-[9px] mono" style={{ color: "var(--cream-dim)" }}>{gpu.vram}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Uptime */}
                {node.uptime && (
                  <div className="flex items-center gap-1.5 mb-2 text-[10px]" style={{ color: "var(--cream-dim)" }}>
                    <Activity size={10} />
                    <span>Up: {node.uptime}</span>
                  </div>
                )}

                {/* Services */}
                {node.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {node.services.slice(0, 8).map((s) => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${nodeColor}08`, color: "var(--cream-dim)" }}>
                        {s}
                      </span>
                    ))}
                    {node.services.length > 8 && (
                      <span className="text-[9px] px-1.5 py-0.5" style={{ color: "var(--cream-mute)" }}>+{node.services.length - 8}</span>
                    )}
                  </div>
                )}

                {/* Ollama models */}
                {node.models && node.models.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
                    {node.models.map((m) => (
                      <span key={m} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
                        🤖 {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
