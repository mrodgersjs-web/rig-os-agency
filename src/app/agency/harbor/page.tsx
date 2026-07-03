"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Anchor,
  CheckCircle2,
  Cpu,
  ExternalLink,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  Shield,
  Terminal,
  XCircle,
} from "lucide-react";

type OverallStatus = "ready" | "partial" | "degraded" | "missing";
type EndpointStatus = "online" | "degraded" | "offline";
type ContainerState = "running" | "completed" | "stopped" | "unknown";

interface HarborEndpoint {
  id: string;
  label: string;
  role: string;
  url: string;
  status: EndpointStatus;
  httpStatus: number | null;
  note: string;
}

interface HarborContainer {
  name: string;
  service: string;
  state: ContainerState;
  health: "healthy" | "starting" | "unhealthy" | "none";
  status: string;
  ports: string;
}

interface HarborStatus {
  generatedAt: string;
  overall: OverallStatus;
  exposure: string;
  cli: {
    installed: boolean;
    version: string;
    path: string;
    doctorOk: boolean;
    doctorSummary: string;
  };
  install: {
    path: string;
    exists: boolean;
    commit: string;
    branch: string;
  };
  source: {
    path: string;
    exists: boolean;
    commit: string;
    clean: boolean;
  };
  profile: {
    defaults: string[];
    requested: string[];
  };
  counts: {
    runningServices: number;
    totalServices: number;
    onlineEndpoints: number;
    totalEndpoints: number;
  };
  endpoints: HarborEndpoint[];
  containers: HarborContainer[];
  notes: string[];
}

const statusTone: Record<EndpointStatus | OverallStatus, { dot: string; text: string; bg: string; label: string }> = {
  ready: { dot: "#10b981", text: "#86efac", bg: "rgba(16,185,129,0.08)", label: "Ready" },
  partial: { dot: "#fbbf24", text: "#fde68a", bg: "rgba(251,191,36,0.08)", label: "Partial" },
  degraded: { dot: "#f59e0b", text: "#fbbf24", bg: "rgba(245,158,11,0.08)", label: "Degraded" },
  missing: { dot: "#ef4444", text: "#fecaca", bg: "rgba(239,68,68,0.08)", label: "Missing" },
  online: { dot: "#10b981", text: "#86efac", bg: "rgba(16,185,129,0.08)", label: "Online" },
  offline: { dot: "#ef4444", text: "#fecaca", bg: "rgba(239,68,68,0.08)", label: "Offline" },
};

function StatusPill({ status }: { status: EndpointStatus | OverallStatus }) {
  const tone = statusTone[status] ?? statusTone.degraded;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: tone.bg, color: tone.text }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
      {tone.label}
    </span>
  );
}

function serviceTone(container: HarborContainer) {
  if (container.health === "healthy") return "#10b981";
  if (container.health === "starting") return "#fbbf24";
  if (container.state === "completed") return "#94a3b8";
  if (container.state === "running") return "#5ab896";
  return "#ef4444";
}

export default function HarborNodePage() {
  const [data, setData] = useState<HarborStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/agency/harbor", { cache: "no-store" });
      if (!response.ok) throw new Error(`Harbor status failed: ${response.status}`);
      const payload = (await response.json()) as HarborStatus;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Harbor status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 45_000);
    return () => clearInterval(interval);
  }, []);

  const cards = useMemo(
    () => [
      {
        label: "CLI",
        value: data?.cli.installed ? data.cli.version.replace("Harbor CLI version: ", "") : "missing",
        icon: Terminal,
        color: "#d4a574",
      },
      {
        label: "Doctor",
        value: data?.cli.doctorOk ? "passed" : "blocked",
        icon: Shield,
        color: data?.cli.doctorOk ? "#10b981" : "#ef4444",
      },
      {
        label: "Services",
        value: data ? `${data.counts.runningServices}/${data.counts.totalServices}` : "-",
        icon: Server,
        color: "#5ab896",
      },
      {
        label: "Endpoints",
        value: data ? `${data.counts.onlineEndpoints}/${data.counts.totalEndpoints}` : "-",
        icon: Network,
        color: "#4a9eff",
      },
    ],
    [data],
  );

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-8 md:px-10">
      <header className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="eyebrow mb-4">
              <span className="num">H</span>
              <span className="line" />
              <span className="label">Harbor Node</span>
            </div>
            <h1 className="page-title">Harbor Node</h1>
            <p className="page-subtitle">Local LLM stack orchestration for RIG OS Agency.</p>
          </div>
          <div className="flex items-center gap-3">
            {data && <StatusPill status={data.overall} />}
            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--line-soft)] px-4 py-2 text-sm transition hover:bg-white/5 disabled:opacity-50"
              style={{ color: "var(--cream)" }}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="panel mb-6 border-red-500/20 p-4">
          <div className="flex items-center gap-3 text-sm" style={{ color: "#fecaca" }}>
            <XCircle className="h-5 w-5" />
            {error}
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="panel p-5"
          >
            <card.icon className="mb-3 h-5 w-5" style={{ color: card.color }} />
            <div className="text-xs uppercase tracking-widest opacity-50">{card.label}</div>
            <div className="mt-1 text-2xl font-bold" style={{ color: "var(--cream)" }}>
              {loading ? "-" : card.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="panel p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Anchor className="h-5 w-5" style={{ color: "var(--gold)" }} />
              <h2 className="text-sm uppercase tracking-widest opacity-50">Local Endpoints</h2>
            </div>
            <div className="text-xs opacity-40">{data ? new Date(data.generatedAt).toLocaleTimeString() : ""}</div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(data?.endpoints ?? []).map((endpoint) => {
              const canOpen = endpoint.id !== "metamcp-sse";
              const body = (
                <>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium" style={{ color: "var(--cream)" }}>
                        {endpoint.label}
                      </div>
                      <div className="mt-1 text-xs opacity-50">{endpoint.role}</div>
                    </div>
                    <StatusPill status={endpoint.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-50">
                    {canOpen && <ExternalLink className="h-3.5 w-3.5" />}
                    <span className="truncate font-mono">{endpoint.url}</span>
                  </div>
                  <div className="mt-2 text-xs opacity-40">
                    {endpoint.httpStatus ? `HTTP ${endpoint.httpStatus}` : endpoint.note}
                  </div>
                </>
              );

              return canOpen ? (
                <a
                  key={endpoint.id}
                  href={endpoint.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[var(--line-soft)] p-4 transition hover:bg-white/[0.03]"
                >
                  {body}
                </a>
              ) : (
                <div key={endpoint.id} className="rounded-lg border border-[var(--line-soft)] p-4">
                  {body}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-6">
          <div className="mb-5 flex items-center gap-3">
            <HardDrive className="h-5 w-5" style={{ color: "#5ab896" }} />
            <h2 className="text-sm uppercase tracking-widest opacity-50">Install State</h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-[var(--line-soft)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm opacity-60">Installed CLI</span>
                {data?.cli.installed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-300" />}
              </div>
              <div className="truncate font-mono text-xs opacity-50">{data?.cli.path ?? "-"}</div>
            </div>

            <div className="rounded-lg border border-[var(--line-soft)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm opacity-60">Harbor Home</span>
                <span className="font-mono text-xs opacity-50">{data?.install.commit ?? "-"}</span>
              </div>
              <div className="truncate font-mono text-xs opacity-50">{data?.install.path ?? "-"}</div>
            </div>

            <div className="rounded-lg border border-[var(--line-soft)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm opacity-60">Source Clone</span>
                <span className="font-mono text-xs opacity-50">{data?.source.commit ?? "-"}</span>
              </div>
              <div className="truncate font-mono text-xs opacity-50">{data?.source.path ?? "-"}</div>
              <div className="mt-2 text-xs opacity-40">{data?.source.clean ? "clean checkout" : "local changes present"}</div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="panel p-6">
          <div className="mb-5 flex items-center gap-3">
            <Cpu className="h-5 w-5" style={{ color: "#c084fc" }} />
            <h2 className="text-sm uppercase tracking-widest opacity-50">Harbor Services</h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--line-soft)]">
            <table className="w-full text-left text-sm">
              <thead style={{ background: "rgba(255,255,255,0.03)" }}>
                <tr className="text-xs uppercase tracking-widest opacity-50">
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">Health</th>
                </tr>
              </thead>
              <tbody>
                {(data?.containers ?? []).map((container) => (
                  <tr key={container.name} className="border-t border-[var(--line-soft)]">
                    <td className="px-4 py-3 font-mono text-xs">{container.service}</td>
                    <td className="px-4 py-3 text-xs opacity-70">{container.state}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ background: serviceTone(container) }} />
                        {container.health === "none" ? container.status : container.health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel p-6">
          <div className="mb-5 flex items-center gap-3">
            <Activity className="h-5 w-5" style={{ color: "#fbbf24" }} />
            <h2 className="text-sm uppercase tracking-widest opacity-50">Run Profile</h2>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--line-soft)] p-4">
              <div className="mb-2 text-xs uppercase tracking-widest opacity-40">Defaults</div>
              <div className="flex flex-wrap gap-2">
                {(data?.profile.defaults ?? []).map((service) => (
                  <span key={service} className="rounded-full bg-white/[0.04] px-3 py-1 text-xs opacity-70">
                    {service}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--line-soft)] p-4">
              <div className="mb-2 text-xs uppercase tracking-widest opacity-40">Added</div>
              <div className="flex flex-wrap gap-2">
                {(data?.profile.requested ?? []).map((service) => (
                  <span key={service} className="rounded-full bg-white/[0.04] px-3 py-1 text-xs opacity-70">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {(data?.notes ?? []).map((note) => (
              <div key={note} className="rounded-lg border border-[var(--line-soft)] p-3 text-xs leading-5 opacity-60">
                {note}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
