"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Server, Building2, Activity, Clock, Zap, CheckCircle2,
  Radio, ArrowRight, RefreshCw,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
  agents: number;
  agentList?: string[];
  lastActivity: string | null;
  registeredAt?: string;
}

interface DispatchEntry {
  timestamp: string;
  task: string;
  urgency: string;
  routed_to: string[];
  status: string;
}

interface PaperclipData {
  server: { running: boolean; port: number; url: string };
  companies: { total: number; items: Company[] };
  dispatch: { total: number; recent: DispatchEntry[] };
  summary: {
    totalCompanies: number;
    totalDispatches: number;
    activeAgents: number;
    serverRunning: boolean;
    operational247: boolean;
    lastDispatch: string | null;
  };
  timestamp: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function PaperclipView() {
  const [data, setData] = useState<PaperclipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/paperclip");
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
        <div className="animate-pulse text-[var(--cream-mute)]">Loading Paperclip operations...</div>
      </div>
    );
  }

  const companies = data?.companies.items ?? [];
  const dispatches = data?.dispatch.recent ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#a855f7" }}>
            24/7 Autonomous Operations · 21 Companies
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--cream)" }}>Paperclip Operations Center</h1>
        <p className="text-[13px]" style={{ color: "var(--cream-dim)" }}>
          Always-on company dispatch engine. Routes tasks to RIG studios 24 hours a day.
        </p>
      </motion.div>

      {/* Status banner */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <div
          className="rounded-xl p-5 border flex items-center justify-between flex-wrap gap-4"
          style={{
            background: summary?.serverRunning ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            borderColor: summary?.serverRunning ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl grid place-items-center"
              style={{
                background: summary?.serverRunning ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              }}
            >
              {summary?.serverRunning ? (
                <Radio size={24} style={{ color: "#22c55e" }} />
              ) : (
                <Server size={24} style={{ color: "#ef4444" }} />
              )}
            </div>
            <div>
              <div className="text-[16px] font-bold" style={{ color: "var(--cream)" }}>
                {summary?.serverRunning ? "OPERATIONAL — 24/7 ACTIVE" : "SERVER OFFLINE"}
              </div>
              <div className="text-[12px] mono" style={{ color: "var(--cream-dim)" }}>
                {summary?.serverRunning ? `Listening on ${data?.server.url}` : "Paperclip engine not running on :3100"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--cream-dim)" }}>
            <RefreshCw size={10} />
            <span className="mono">{lastUpdate}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Companies", value: summary?.totalCompanies ?? 0, icon: <Building2 size={16} />, accent: "#a855f7" },
            { label: "Active Agents", value: summary?.activeAgents ?? 0, icon: <Zap size={16} />, accent: "#fbbf24" },
            { label: "Dispatches", value: summary?.totalDispatches ?? 0, icon: <Activity size={16} />, accent: "#4a9eff" },
            { label: "Operational", value: summary?.serverRunning ? "YES" : "NO", icon: <CheckCircle2 size={16} />, accent: summary?.serverRunning ? "#22c55e" : "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: s.accent }}>{s.icon}</span>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>{s.label}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: s.accent }}>{s.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Companies list */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <div className="rounded-xl border p-5 h-full" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--cream)" }}>
              <Building2 size={16} style={{ color: "#a855f7" }} />
              Registered Companies ({companies.length})
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg border transition hover:bg-[rgba(255,255,255,0.02)]"
                  style={{ borderColor: "var(--line-soft)" }}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: "var(--cream)" }}>{c.name}</div>
                    <div className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>{c.slug}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {c.agents > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
                        {c.agents} agents
                      </span>
                    )}
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#22c55e", boxShadow: "0 0 4px #22c55e80" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dispatch log */}
        <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
          <div className="rounded-xl border p-5 h-full" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--cream)" }}>
              <Activity size={16} style={{ color: "#4a9eff" }} />
              Dispatch Log ({dispatches.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {dispatches.length === 0 ? (
                <div className="text-[12px] text-center py-8" style={{ color: "var(--cream-dim)" }}>
                  No dispatches recorded yet.
                </div>
              ) : (
                dispatches.map((d, i) => (
                  <div key={i} className="p-3 rounded-lg border" style={{ borderColor: "var(--line-soft)", background: "rgba(0,0,0,0.1)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{d.task}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold"
                        style={{
                          background: d.urgency === "high" ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)",
                          color: d.urgency === "high" ? "#ef4444" : "#fbbf24",
                        }}
                      >
                        {d.urgency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {d.routed_to?.map((r) => (
                          <span key={r} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(74,158,255,0.1)", color: "#4a9eff" }}>
                            {r}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                        {d.timestamp ? new Date(d.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: d.status === "dispatched" ? "#22c55e" : "#fbbf24" }}
                      />
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--cream-dim)" }}>{d.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
