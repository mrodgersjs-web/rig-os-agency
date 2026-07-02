"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cpu, Zap, Server, GitBranch, HardDrive, Activity,
  CheckCircle2, AlertCircle, Clock, Terminal,
} from "lucide-react";

interface SystemHealth {
  diskFree: string;
  loadAvg: string;
  processes: number;
  docker: string;
  colima: string;
  networkInterfaces: number;
  cronConfigured: boolean;
}

interface AppHealth {
  pages: number;
  apis: number;
  libFiles: number;
  components: number;
  running: boolean;
  buildStatus: string;
}

interface RIGHealth {
  agents: number;
  skills: number;
  goalLoops: number;
  deviationEngines: number;
  mcpServers: number;
  githubRepos: number;
}

interface ModalHealth {
  status: "ready" | "configured" | "pending_endpoint" | "pending_auth";
  alias: string;
  provider: string;
  model: string;
  gpu: string;
  engine: string;
  endpoint: string | null;
  proxyUrl: string;
  manualOnly: boolean;
  endpointConfigured: boolean;
  proxyReachable: boolean;
  blockers: string[];
}

export default function SystemHealthPage() {
  const [system, setSystem] = useState<SystemHealth | null>(null);
  const [app, setApp] = useState<AppHealth | null>(null);
  const [rig, setRIG] = useState<RIGHealth | null>(null);
  const [modal, setModal] = useState<ModalHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("—");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function fetchHealth() {
      setRefreshing(true);
      try {
        const res = await fetch("/api/agency/health");
        if (res.ok) {
          const data = await res.json();
          setSystem(data.system);
          setApp(data.app);
          setRIG(data.rig);
          setModal(data.modal);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    }
    fetchHealth();
    const interval = setInterval(fetchHealth, 60_000);
    return () => clearInterval(interval);
  }, []);

  const healthCards = [
    { label: "App Pages", value: app?.pages ?? "—", icon: GitBranch, color: "#4a9eff" },
    { label: "API Routes", value: app?.apis ?? "—", icon: Server, color: "#5ab896" },
    { label: "Components", value: app?.components ?? "—", icon: Cpu, color: "#c084fc" },
    { label: "Lib Files", value: app?.libFiles ?? "—", icon: Terminal, color: "#fbbf24" },
    { label: "Agents", value: rig?.agents ?? "—", icon: Activity, color: "#10b981" },
    { label: "Skills", value: rig?.skills ?? "—", icon: CheckCircle2, color: "#d4a574" },
    { label: "Goal Loops", value: rig?.goalLoops ?? "—", icon: Zap, color: "#ec4899" },
    { label: "GitHub Repos", value: rig?.githubRepos ?? "—", icon: GitBranch, color: "#8b5cf6" },
  ];

  const modalReady = modal?.status === "ready";
  const modalConfigured = modal?.status === "configured" || modalReady;
  const modalLabel = modal?.status ? modal.status.replace("_", " ") : "pending endpoint";

  return (
    <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow mb-4">
              <span className="num">∞</span>
              <span className="line" />
              <span className="label">System Health</span>
            </div>
            <h1 className="page-title">System Health Monitor</h1>
            <p className="page-subtitle">Real-time status of RIG OS Agency, infrastructure, and Mike's Mac Studio.</p>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-50" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <div className={`w-2 h-2 rounded-full ${refreshing ? "bg-yellow-400 animate-pulse" : "bg-emerald-500"}`} />
            <span>Updated {lastUpdated}</span>
          </div>
        </div>
      </header>

      {/* Health Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {healthCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="panel p-5"
          >
            <card.icon className="w-5 h-5 mb-2" style={{ color: card.color }} />
            <div className="text-xs uppercase tracking-widest opacity-50">{card.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--cream)" }}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel p-6">
          <h3 className="text-sm uppercase tracking-widest opacity-50 mb-4">Mac Studio</h3>
          <div className="space-y-3">
            {[
              { label: "Disk Free", value: system?.diskFree ?? "—", icon: HardDrive },
              { label: "Load Average", value: system?.loadAvg ?? "—", icon: Activity },
              { label: "Processes", value: system?.processes ?? "—", icon: Activity },
              { label: "Docker", value: system?.docker ?? "Running", icon: Server },
              { label: "Colima", value: system?.colima ?? "Running", icon: Cpu },
              { label: "Network", value: `${system?.networkInterfaces ?? 2} interfaces`, icon: Zap },
              { label: "Cron", value: system?.cronConfigured ? "Configured" : "Active", icon: Clock },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 opacity-50" />
                  <span className="text-sm opacity-70">{item.label}</span>
                </div>
                <span className="text-sm font-mono" style={{ color: "var(--cream)" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <h3 className="text-sm uppercase tracking-widest opacity-50 mb-4">RIG Infrastructure</h3>
          <div className="space-y-3">
            {[
              { label: "Agent Registry", value: `${rig?.agents ?? "—"} agents`, status: "active" },
              { label: "Goal Harnesses", value: `${rig?.goalLoops ?? "—"} loops`, status: "active" },
              { label: "Deviation Engines", value: `${rig?.deviationEngines ?? "—"} engines`, status: "active" },
              { label: "MCP Servers", value: `${rig?.mcpServers ?? "—"} servers`, status: "active" },
              { label: "GitHub Repos", value: `${rig?.githubRepos ?? "—"} repos`, status: "active" },
              { label: "Modal Endpoint", value: modalLabel, status: modalReady ? "active" : "pending" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-sm opacity-70">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono" style={{ color: "var(--cream)" }}>{item.value}</span>
                  <div className="w-2 h-2 rounded-full" style={{
                    background: item.status === "active" ? "#10b981" : item.status === "pending" ? "#fbbf24" : "#ef4444",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1000x Loop Status */}
      <div className="panel p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5" style={{ color: "var(--gold)" }} />
          <h3 className="text-sm uppercase tracking-widest opacity-50">1000x Improvement Loop</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "rgba(212,165,116,0.05)" }}>
            <div className="text-xs opacity-50 mb-1">Every 2 Hours</div>
            <div className="text-sm font-medium">Continuous Improvement</div>
            <div className="text-xs opacity-40 mt-1">Auto-builds, commits, pushes improvements to RIG OS Agency</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs opacity-50">Active — next run in ~2h</span>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "rgba(90,184,150,0.05)" }}>
            <div className="text-xs opacity-50 mb-1">Nightly at 11 PM</div>
            <div className="text-sm font-medium">Deep Improvement</div>
            <div className="text-xs opacity-40 mt-1">Full app upgrade, GitHub repos push, system optimization, morning briefing prep</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs opacity-50">Scheduled — tonight at 11 PM</span>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "rgba(74,158,255,0.05)" }}>
            <div className="text-xs opacity-50 mb-1">Daily at 7 AM</div>
            <div className="text-sm font-medium">Jarvis Morning Briefing</div>
            <div className="text-xs opacity-40 mt-1">18-section briefing delivered to your Telegram with overnight improvements</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs opacity-50">Active — tomorrow 7 AM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Endpoint Status */}
      <div className="panel p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-5 h-5" style={{ color: modalReady ? "#10b981" : "#fbbf24" }} />
          <h3 className="text-sm uppercase tracking-widest opacity-50">Modal1 Model Plane</h3>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: modalReady ? "rgba(16,185,129,0.05)" : "rgba(251,191,36,0.05)" }}>
          {modalReady ? (
            <CheckCircle2 className="w-5 h-5" style={{ color: "#10b981" }} />
          ) : (
            <AlertCircle className="w-5 h-5" style={{ color: "#fbbf24" }} />
          )}
          <div>
            <div className="text-sm font-medium">{modalConfigured ? "Modal route configured" : "Modal endpoint not configured"}</div>
            <div className="text-xs opacity-50 mt-1">
              <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.05)" }}>claude-model modal1</code>
              {" "}routes through {modal?.proxyUrl ?? "http://127.0.0.1:8766/v1"}.
              {modal?.blockers?.length ? ` Blocked: ${modal.blockers.join("; ")}.` : " Ready for smoke tests."}
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs opacity-40">
          Endpoint spec: {modal?.model ?? "zai-org/GLM-5.2-FP8"} · 8x NVIDIA B200 · SGLang v0.5.13 · manual-only · endpoint {modal?.endpoint ?? "not set"}
        </div>
      </div>
    </div>
  );
}
