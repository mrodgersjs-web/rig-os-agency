"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw, Smartphone, GitBranch, Package, Cloud, Database,
  CheckCircle2, XCircle, ExternalLink, Code2, Layers, Zap,
  AlertCircle, FileCode, Activity,
} from "lucide-react";

interface TransformFitData {
  status: string;
  repo: {
    path: string;
    remote: string;
    version: string;
    description: string;
    commits: number;
    recentCommits: string[];
  };
  build: {
    webBuildExists: boolean;
    buildPath: string;
    deployed: boolean;
    deployedUrl: string;
    deployedStatus: string;
  };
  code: {
    dartFiles: number;
    features: string[];
    screens: string[];
    supabaseFunctions: string[];
  };
  supabase: {
    configured: boolean;
    functionsCount: number;
    hasTypes: boolean;
    migrations: number;
  };
  flutter: {
    installed: boolean;
    version: string;
  };
  real: boolean;
  message?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function TransformFitStudio() {
  const [data, setData] = useState<TransformFitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/agency/transformfit", { cache: "no-store" });
      const j: TransformFitData = await r.json();
      setData(j);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl p-4 border flex items-start gap-3 text-[13px]"
        style={{ background: "rgba(196,96,126,0.08)", borderColor: "rgba(196,96,126,0.35)", color: "var(--plum)" }}
      >
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <div>{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const active = data.status === "active";
  const deployed = data.build?.deployed;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Smartphone size={20} style={{ color: "var(--gold)" }} />
            <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontWeight: 600 }}>
              Mobile App Studio
            </span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--cream)" }}>
            TransformFit
          </h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: "var(--cream-dim)" }}>
            {data.repo?.description || "Assistance-based workout coaching app — Flutter Web + Supabase"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="px-2.5 h-[34px] rounded-lg border border-[var(--panel-border)] hover:border-[var(--panel-border-hot)] text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] flex items-center gap-1.5 transition"
          >
            <RefreshCw size={11} /> Refresh
          </button>
          {deployed && (
            <a
              href={data.build.deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 h-[34px] rounded-lg flex items-center gap-1.5 text-[12px] font-medium transition hover:opacity-80"
              style={{ background: "var(--gold)", color: "#1a1a2e" }}
            >
              <ExternalLink size={12} /> Live App
            </a>
          )}
        </div>
      </div>

      {/* Status banners */}
      {!active ? (
        <div
          className="rounded-xl p-3 border flex items-start gap-2.5 text-[12.5px]"
          style={{ background: "rgba(201,124,94,0.08)", borderColor: "rgba(201,124,94,0.35)", color: "var(--rust)" }}
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">TransformFit repo not found locally</div>
            <div className="text-[11.5px] mt-0.5 opacity-90">{data.message || "Clone the repo to /Users/rig128gb/Developer/transformfit-flutter to see live data."}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatusCard
            label="Deployment"
            ok={deployed}
            okLabel={`Live · ${data.build.deployedStatus}`}
            badLabel="Not deployed"
            icon={<Cloud size={14} />}
          />
          <StatusCard
            label="Supabase"
            ok={data.supabase.configured}
            okLabel={`${data.supabase.functionsCount} functions · ${data.supabase.migrations} migrations`}
            badLabel="Not configured"
            icon={<Database size={14} />}
          />
          <StatusCard
            label="Flutter SDK"
            ok={data.flutter.installed}
            okLabel="Installed"
            badLabel="Not in PATH"
            icon={<Zap size={14} />}
          />
        </div>
      )}

      {/* KPI cards */}
      <motion.div {...fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Dart Files"
          value={String(data.code?.dartFiles ?? 0)}
          icon={<FileCode size={16} />}
          accent="#d4a574"
          sub="total source files"
        />
        <KpiCard
          label="Feature Modules"
          value={String(data.code?.features?.length ?? 0)}
          icon={<Layers size={16} />}
          accent="#5ab896"
          sub="lib/features/"
        />
        <KpiCard
          label="Edge Functions"
          value={String(data.code?.supabaseFunctions?.length ?? 0)}
          icon={<Zap size={16} />}
          accent="#e6c69a"
          sub="supabase/functions/"
        />
        <KpiCard
          label="Git Commits"
          value={String(data.repo?.commits ?? 0)}
          icon={<GitBranch size={16} />}
          accent="#c4607e"
          sub={data.repo?.version || "unknown version"}
        />
      </motion.div>

      {/* Feature modules grid */}
      {data.code?.features && data.code.features.length > 0 && (
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
          <Panel title="Feature Modules" icon={<Layers size={14} />} count={data.code.features.length}>
            <div className="flex flex-wrap gap-2 p-3">
              {data.code.features.map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 rounded-md text-[11px] font-mono"
                  style={{
                    background: "rgba(212,165,116,0.08)",
                    border: "1px solid rgba(212,165,116,0.2)",
                    color: "var(--gold)",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* Supabase Edge Functions */}
      {data.code?.supabaseFunctions && data.code.supabaseFunctions.length > 0 && (
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <Panel title="Supabase Edge Functions" icon={<Zap size={14} />} count={data.code.supabaseFunctions.length}>
            <div className="divide-y" style={{ borderColor: "var(--line-soft)" }}>
              {data.code.supabaseFunctions.map((fn) => (
                <div key={fn} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px]"
                    style={{ background: "rgba(90,184,150,0.12)", color: "var(--emerald)" }}
                  >
                    ƒ
                  </span>
                  <span className="text-[12.5px] font-mono" style={{ color: "var(--cream)" }}>
                    {fn}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* Recent commits */}
      {data.repo?.recentCommits && data.repo.recentCommits.length > 0 && (
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
          <Panel title="Recent Commits" icon={<GitBranch size={14} />} count={data.repo.recentCommits.length}>
            <div className="divide-y" style={{ borderColor: "var(--line-soft)" }}>
              {data.repo.recentCommits.map((c, i) => {
                const [hash, ...msgParts] = c.split(" ");
                const msg = msgParts.join(" ");
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: "rgba(196,96,126,0.1)", color: "var(--plum)" }}
                    >
                      {hash.slice(0, 7)}
                    </span>
                    <span className="text-[12px] truncate" style={{ color: "var(--cream-dim)" }}>
                      {msg}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] pt-2" style={{ color: "var(--cream-mute)" }}>
        <span className="flex items-center gap-1.5">
          <Code2 size={11} /> Source: /api/agency/transformfit · real filesystem data
        </span>
        {data.repo?.remote && (
          <a
            href={data.repo.remote.replace(/\.git$/, "")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--gold)] transition"
          >
            {data.repo.remote.replace("https://github.com/", "").replace(".git", "")} <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

function StatusCard({
  label, ok, okLabel, badLabel, icon,
}: { label: string; ok: boolean; okLabel: string; badLabel: string; icon: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-3 border flex items-center gap-3"
      style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
    >
      <span
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{
          background: ok ? "rgba(90,184,150,0.12)" : "rgba(201,124,94,0.1)",
          color: ok ? "var(--emerald)" : "var(--rust)",
        }}
      >
        {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
          {label}
        </div>
        <div className="text-[12px] font-medium truncate" style={{ color: "var(--cream)" }}>
          {ok ? okLabel : badLabel}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, icon, accent, sub,
}: { label: string; value: string; icon: React.ReactNode; accent: string; sub: string }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-[10.5px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-mono font-medium" style={{ color: "var(--cream)" }}>
        {value}
      </div>
      <div className="text-[10.5px] mt-1" style={{ color: "var(--cream-mute)" }}>{sub}</div>
    </div>
  );
}

function Panel({
  title, icon, count, children,
}: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--line-soft)" }}>
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--gold)" }}>{icon}</span>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--cream)" }}>
            {title}
          </h2>
        </div>
        <span className="text-[10.5px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
