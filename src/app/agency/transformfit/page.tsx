"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Flame, Smartphone, Database, Cloud, Zap, GitBranch, ExternalLink, RefreshCw, Code2, Package, Layers } from "lucide-react";
import TransformFitStudio from "@/components/TransformFitStudio";

const C = {
  bg: "var(--bg-deep)", card: "var(--bg-card)", mid: "var(--bg-mid)",
  text: "var(--cream)", text2: "var(--cream-soft)", text3: "var(--cream-dim)", mute: "var(--cream-mute)",
  border: "var(--line-soft)", border2: "var(--line)",
  gold: "var(--gold)", goldBg: "rgba(212,165,116,0.10)",
  emerald: "var(--emerald)", emeraldBg: "rgba(90,184,150,0.10)",
  rust: "var(--rust)", rustBg: "rgba(201,124,94,0.10)",
  plum: "var(--plum)", plumBg: "rgba(196,96,126,0.10)",
  blue: "#22d3ee", blueBg: "rgba(34,211,238,0.10)",
};

interface TFData {
  status: string;
  repo: { path: string; remote: string; version: string; description: string; commits: number; recentCommits: string[] };
  build: { webBuildExists: boolean; buildPath: string; deployed: boolean; deployedUrl: string; deployedStatus: string };
  code: { dartFiles: number; features: string[]; screens: string[]; supabaseFunctions: string[] };
  supabase: { configured: boolean; functionsCount: number; hasTypes: boolean; migrations: number };
  flutter: { installed: boolean; version: string };
  real: boolean;
  message?: string;
}

function parseCommit(c: string): { hash: string; msg: string; milestone: string | null } {
  const [hash, ...rest] = c.split(" ");
  const msg = rest.join(" ");
  const m = msg.match(/^(M\d+):/);
  return { hash, msg, milestone: m ? m[1] : null };
}

export default function TransformFitRoute() {
  const [tf, setTf] = useState<TFData | null>(null);
  const [vitals, setVitals] = useState<{ ok: boolean; latency_ms?: number } | null>(null);
  const [now, setNow] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [tfRes, hRes] = await Promise.all([
        fetch("/api/agency/transformfit", { cache: "no-store" }),
        fetch("/api/agency/health", { cache: "no-store" }),
      ]);
      const tfJson = await tfRes.json();
      const hJson = await hRes.json();
      setTf(tfJson);
      setVitals({ ok: hJson?.status === "ok", latency_ms: hJson?.latency_ms });
    } catch {
      setVitals({ ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    setNow(new Date().toISOString().slice(0, 19).replace("T", " "));
    const i = setInterval(() => setNow(new Date().toISOString().slice(0, 19).replace("T", " ")), 30_000);
    const j = setInterval(refresh, 60_000);
    return () => { clearInterval(i); clearInterval(j); };
  }, []);

  const active = tf?.status === "active";
  const deployed = tf?.build?.deployed;
  const dartFiles = tf?.code?.dartFiles ?? 0;
  const featureCount = tf?.code?.features?.length ?? 0;
  const screenCount = tf?.code?.screens?.length ?? 0;
  const fnCount = tf?.code?.supabaseFunctions?.length ?? 0;
  const commitCount = tf?.repo?.commits ?? 0;

  const kpis = [
    { label: "Studio Live", value: active ? "Active" : "Offline", icon: Activity, color: active ? C.emerald : C.rust, bg: active ? C.emeraldBg : C.rustBg },
    { label: "Deployment", value: deployed ? `200 · Live` : "Not Deployed", icon: Cloud, color: deployed ? C.emerald : C.gold, bg: deployed ? C.emeraldBg : C.goldBg },
    { label: "Supabase", value: tf?.supabase?.configured ? `${tf.supabase.functionsCount} fns` : "Disconnected", icon: Database, color: tf?.supabase?.configured ? C.emerald : C.plum, bg: tf?.supabase?.configured ? C.emeraldBg : C.plumBg },
    { label: "Flutter SDK", value: tf?.flutter?.installed ? "Installed" : "Missing", icon: Zap, color: tf?.flutter?.installed ? C.gold : C.plum, bg: tf?.flutter?.installed ? C.goldBg : C.plumBg },
    { label: "Dart Files", value: String(dartFiles), icon: Code2, color: C.gold, bg: C.goldBg },
    { label: "Feature Modules", value: String(featureCount), icon: Layers, color: C.emerald, bg: C.emeraldBg },
    { label: "Edge Functions", value: String(fnCount), icon: Zap, color: "#e6c69a", bg: "rgba(230,198,154,0.10)" },
    { label: "Git Commits", value: String(commitCount), icon: GitBranch, color: C.plum, bg: C.plumBg },
  ];

  const milestones = (tf?.repo?.recentCommits ?? [])
    .map(parseCommit)
    .filter((c) => c.milestone);

  return (
    <div className="pb-6 space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Flame size={20} style={{ color: C.rust }} />
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.mute, fontWeight: 600 }}>
            TransformFit · Squad Studio
          </span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Bricolage Grotesque, sans-serif", color: C.text }}>
              TransformFit Command
            </h1>
            <p className="text-[13px] mt-1" style={{ color: C.text3 }}>
              {tf?.repo?.description || "Fitness-coaching squad sub-agent · live studio, repo, and deployment telemetry"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-2.5 h-[34px] rounded-lg border text-[12px] transition"
              style={{ borderColor: C.border2, color: C.text2 }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {tf?.build?.deployedUrl && (
              <a
                href={tf.build.deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 h-[34px] rounded-lg text-[12px] font-medium transition hover:opacity-90"
                style={{ background: C.gold, color: "#1a1a2e" }}
              >
                <ExternalLink size={12} /> Live App
              </a>
            )}
          </div>
        </div>
      </motion.section>

      {/* 8-tile KPI strip */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3"
      >
        {kpis.map((k, i) => {
          const Ic = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.04 + i * 0.025 }}
              className="rounded-lg p-3"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider truncate" style={{ color: C.text3, fontWeight: 600 }}>{k.label}</span>
                <Ic size={13} style={{ color: k.color }} />
              </div>
              <div className="text-[18px] font-bold leading-none font-mono" style={{ color: k.color }}>{k.value}</div>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Repo + Build + Supabase + Flutter panels */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {/* Repo */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={14} style={{ color: C.plum }} />
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>Repository</span>
            <span className="text-[10px] font-mono ml-auto" style={{ color: C.mute }}>{tf?.repo?.version ?? "—"}</span>
          </div>
          <div className="space-y-2">
            <Row label="Path" value={tf?.repo?.path ?? "—"} mono />
            <Row label="Remote" value={tf?.repo?.remote ?? "—"} mono />
            <Row label="Commits" value={String(commitCount)} />
            <Row label="Description" value={tf?.repo?.description ?? "—"} />
          </div>
        </div>

        {/* Build + Deploy */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Cloud size={14} style={{ color: C.emerald }} />
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>Build & Deploy</span>
            <span className="text-[10px] font-mono ml-auto" style={{ color: deployed ? C.emerald : C.gold }}>
              {deployed ? `HTTP ${tf?.build?.deployedStatus ?? "?"}` : "Not Deployed"}
            </span>
          </div>
          <div className="space-y-2">
            <Row label="Web Build" value={tf?.build?.webBuildExists ? "✓ build/web/ present" : "✗ missing"} ok={tf?.build?.webBuildExists} />
            <Row label="Build Path" value={tf?.build?.buildPath ?? "—"} mono />
            <Row label="Deployed" value={deployed ? "✓ live" : "✗ no"} ok={!!deployed} />
            <Row label="Deployed URL" value={tf?.build?.deployedUrl ?? "—"} mono />
          </div>
        </div>

        {/* Supabase */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Database size={14} style={{ color: C.emerald }} />
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>Supabase Backend</span>
            <span className="text-[10px] font-mono ml-auto" style={{ color: tf?.supabase?.configured ? C.emerald : C.plum }}>
              {tf?.supabase?.configured ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="space-y-2">
            <Row label="Configured" value={tf?.supabase?.configured ? "✓ yes" : "✗ no"} ok={!!tf?.supabase?.configured} />
            <Row label="Edge Functions" value={String(tf?.supabase?.functionsCount ?? 0)} />
            <Row label="TypeScript Types" value={tf?.supabase?.hasTypes ? "✓ present" : "✗ missing"} ok={!!tf?.supabase?.hasTypes} />
            <Row label="Migrations" value={String(tf?.supabase?.migrations ?? 0)} />
            <Row label="Functions" value={(tf?.code?.supabaseFunctions ?? []).join(", ") || "—"} mono />
          </div>
        </div>

        {/* Flutter */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={14} style={{ color: C.gold }} />
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>Flutter Runtime</span>
            <span className="text-[10px] font-mono ml-auto" style={{ color: tf?.flutter?.installed ? C.gold : C.plum }}>
              {tf?.flutter?.installed ? "Ready" : "Missing"}
            </span>
          </div>
          <div className="space-y-2">
            <Row label="Installed" value={tf?.flutter?.installed ? "✓ in PATH" : "✗ not found"} ok={!!tf?.flutter?.installed} />
            <Row label="Version" value={tf?.flutter?.version?.split("•")[0]?.trim() ?? "—"} mono />
            <Row label="Dart Files" value={String(dartFiles)} />
            <Row label="Screens" value={(tf?.code?.screens ?? []).map(s => s.replace("_screen.dart", "")).join(", ") || "—"} mono />
          </div>
        </div>
      </motion.section>

      {/* Milestones timeline */}
      {milestones.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.12 }}
          className="rounded-xl p-4"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} style={{ color: C.gold }} />
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>Milestones</span>
            <span className="text-[10px] font-mono ml-auto" style={{ color: C.mute }}>{milestones.length} shipped</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: C.mid, border: `1px solid ${C.border}` }}>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 mt-0.5"
                  style={{ background: C.plumBg, color: C.plum, fontWeight: 700 }}
                >
                  {m.milestone}
                </span>
                <span className="text-[11.5px] leading-relaxed" style={{ color: C.text2 }}>{m.msg.replace(/^M\d+:\s*/, "")}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Recent commits */}
      {(tf?.repo?.recentCommits ?? []).length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.16 }}
          className="rounded-xl"
          style={{ background: C.card, border: `1px solid ${C.border}`, overflow: "hidden" }}
        >
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <GitBranch size={14} style={{ color: C.plum }} />
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>Recent Commits</span>
            <span className="text-[10px] font-mono ml-auto" style={{ color: C.mute }}>{tf?.repo?.recentCommits.length}</span>
          </div>
          <div className="divide-y" style={{ borderColor: C.border }}>
            {(tf?.repo?.recentCommits ?? []).map((c, i) => {
              const parsed = parseCommit(c);
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: C.plumBg, color: C.plum }}
                  >
                    {parsed.hash.slice(0, 7)}
                  </span>
                  {parsed.milestone && (
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: C.goldBg, color: C.gold, fontWeight: 700 }}
                    >
                      {parsed.milestone}
                    </span>
                  )}
                  <span className="text-[12px] truncate" style={{ color: C.text2 }}>{parsed.msg}</span>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Feature modules grid */}
      {(tf?.code?.features ?? []).length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="rounded-xl p-4"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers size={14} style={{ color: C.emerald }} />
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>Feature Modules</span>
            <span className="text-[10px] font-mono ml-auto" style={{ color: C.mute }}>{featureCount} modules</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(tf?.code?.features ?? []).map((f) => (
              <span
                key={f}
                className="px-2.5 py-1 rounded-md text-[11px] font-mono"
                style={{
                  background: C.goldBg,
                  border: `1px solid ${C.border2}`,
                  color: C.gold,
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </motion.section>
      )}

      {/* Health probe row */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.24 }}
        className="rounded-xl p-4"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} style={{ color: vitals?.ok ? C.emerald : C.gold }} />
          <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>Live Vitals</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Row label="Studio Status" value={vitals?.ok ? "Healthy" : "Probing…"} ok={!!vitals?.ok} inline />
          <Row label="RIG OS Latency" value={vitals?.latency_ms != null ? `${vitals.latency_ms}ms` : "—"} inline />
          <Row label="Last Tick" value={now ? now + "Z" : "—"} mono inline />
          <Row label="Doctrine" value="ProofPacket or it didn't happen" inline />
        </div>
      </motion.section>

      {/* Footer */}
      <div className="text-[10px] flex items-center justify-between pt-3"
        style={{ color: C.mute, borderTop: `1px solid ${C.border}` }}
      >
        <span>
          Source: <code style={{ color: C.text3 }}>GET /api/agency/transformfit</code> · live filesystem · 60s auto-refresh
        </span>
        <span style={{ color: C.gold }}>ProofPacket or it didn&apos;t happen</span>
      </div>
    </div>
  );
}

function Row({ label, value, mono, ok, inline }: { label: string; value: string; mono?: boolean; ok?: boolean; inline?: boolean }) {
  const valueColor = ok === true ? C.emerald : ok === false ? C.rust : C.text;
  if (inline) {
    return (
      <div>
        <div className="text-[10px] uppercase tracking-wider" style={{ color: C.mute }}>{label}</div>
        <div className={`text-[12.5px] mt-0.5 ${mono ? "font-mono" : ""} truncate`} style={{ color: valueColor }} title={value}>{value}</div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 text-[12px]">
      <span className="shrink-0 w-[120px] text-[10.5px] uppercase tracking-wider pt-0.5" style={{ color: C.mute }}>{label}</span>
      <span className={`${mono ? "font-mono" : ""} truncate`} style={{ color: valueColor }} title={value}>{value}</span>
    </div>
  );
}