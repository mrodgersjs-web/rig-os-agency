"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, Cpu, DollarSign, Users, Zap, TrendingUp,
  Shield, Server, Clock, AlertCircle, CheckCircle2,
} from "lucide-react";

interface VitalsData {
  claude: { ok: boolean; version: string; latencyMs: number };
  hermes: { ok: boolean; model: string; provider: string; latencyMs: number };
  openclaw: { ok: boolean; gateway: string; degraded: boolean };
  gemini: { ok: boolean; version: string };
}

interface DashboardData {
  realMetrics?: {
    prospects: number;
    emailsSent: number;
    revenue: number;
    revenueLabel: string;
  };
  sampleData?: {
    kpis?: {
      currentARR: number;
      targetARR: number;
      activeClients: number;
      pipelineValue: number;
    };
  };
}

interface HealthData {
  system?: {
    diskFree: string;
    loadAvg: string;
    processes: number;
  };
}

export default function LiveCommandBar() {
  const [vitals, setVitals] = useState<VitalsData | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchAll() {
      try {
        const [vRes, dRes, hRes] = await Promise.all([
          fetch("/api/vitals").then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch("/api/agency/dashboard").then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch("/api/agency/health").then((r) => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (!active) return;
        setVitals(vRes);
        setDashboard(dRes);
        setHealth(hRes);
        setLoading(false);
      } catch {
        if (active) setLoading(false);
      }
    }

    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => { active = false; clearInterval(interval); clearInterval(clock); };
  }, []);

  const kpis = dashboard?.sampleData?.kpis;
  const real = dashboard?.realMetrics;

  const stats = [
    {
      label: "ARR",
      value: kpis ? `$${(kpis.currentARR / 1000).toFixed(0)}K` : "—",
      sub: kpis ? `of $${(kpis.targetARR / 1_000_000).toFixed(1)}M` : "",
      icon: <DollarSign size={16} />,
      accent: "#d4a574",
      href: "/agency/revenue",
    },
    {
      label: "Pipeline",
      value: kpis ? `$${(kpis.pipelineValue / 1000).toFixed(0)}K` : "—",
      sub: `${real?.prospects ?? 0} prospects`,
      icon: <TrendingUp size={16} />,
      accent: "#5ab896",
      href: "/agency/pipeline",
    },
    {
      label: "Clients",
      value: kpis ? String(kpis.activeClients) : "—",
      sub: "active accounts",
      icon: <Users size={16} />,
      accent: "#22d3ee",
      href: "/agency/clients",
    },
    {
      label: "Outreach",
      value: String(real?.emailsSent ?? 0),
      sub: "emails sent",
      icon: <Zap size={16} />,
      accent: "#a855f7",
      href: "/agency/outreach",
    },
  ];

  const agentStatus = [
    { name: "Claude", ok: vitals?.claude?.ok, latency: vitals?.claude?.latencyMs, accent: "#d97757" },
    { name: "Hermes", ok: vitals?.hermes?.ok, latency: vitals?.hermes?.latencyMs, accent: "#60a5fa" },
    { name: "OpenClaw", ok: vitals?.openclaw?.ok && !vitals?.openclaw?.degraded, latency: null, accent: "#f472b6" },
    { name: "Gemini", ok: vitals?.gemini?.ok, latency: null, accent: "#4285F4" },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--line-soft)", background: "var(--bg-card)" }}>
      {/* Top bar — stats + clock */}
      <div className="flex items-stretch divide-x" style={{ borderColor: "var(--line-soft)" }}>
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex-1 px-4 py-3 hover:bg-[rgba(255,255,255,0.025)] transition group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: s.accent }}>{s.icon}</span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>{s.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold" style={{ color: "var(--cream)" }}>
                {s.value}
              </span>
              <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>{s.sub}</span>
            </div>
          </Link>
        ))}
        {/* Clock + system */}
        <div className="px-4 py-3 flex flex-col justify-center min-w-[140px]">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} style={{ color: "var(--cream-mute)" }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>System</span>
          </div>
          <div className="text-sm font-medium mono" style={{ color: "var(--cream)" }}>
            {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          {health?.system && (
            <div className="text-[10px] mt-0.5" style={{ color: "var(--cream-dim)" }}>
              {health.system.loadAvg} load · {health.system.diskFree} free
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar — agent status strip */}
      <div
        className="flex items-center gap-4 px-4 py-2 border-t"
        style={{ borderColor: "var(--line-soft)", background: "rgba(0,0,0,0.15)" }}
      >
        <div className="flex items-center gap-1.5">
          <Server size={12} style={{ color: "var(--cream-mute)" }} />
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>
            Agents
          </span>
        </div>
        <div className="flex items-center gap-3">
          {agentStatus.map((a) => {
            const isOk = a.ok === true;
            const isUnknown = a.ok === undefined && loading;
            return (
              <div key={a.name} className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isOk ? "#22c55e" : isUnknown ? "#71717a" : "#ef4444",
                    boxShadow: isOk ? "0 0 6px #22c55e80" : "none",
                  }}
                />
                <span className="text-[11px] font-medium" style={{ color: a.accent }}>
                  {a.name}
                </span>
                {a.latency != null && (
                  <span className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                    {a.latency}ms
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {vitals?.hermes?.model && (
            <div className="flex items-center gap-1.5">
              <Cpu size={12} style={{ color: "var(--cream-mute)" }} />
              <span className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                {vitals.hermes.model} · {vitals.hermes.provider}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
