"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Flame, Users, TrendingUp, Sparkles, Smartphone } from "lucide-react";
import TransformFitStudio from "@/components/TransformFitStudio";

const C = {
  bg: "var(--rig-bg)", card: "var(--rig-card)", text: "var(--rig-text)",
  text2: "var(--rig-text-2)", text3: "var(--rig-text-3)", mute: "var(--rig-text-mute)",
  border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)",
  red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
  plum: "var(--rig-plum)", plumBg: "var(--rig-plum-bg)",
  blue: "var(--rig-blue)", blueBg: "var(--rig-blue-bg)",
};

interface KPI {
  label: string;
  value: string;
  icon: any;
  color: string;
  bg: string;
}

export default function TransformFitRoute() {
  const [vitals, setVitals] = useState<{ ok: boolean; latency_ms?: number } | null>(null);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    let alive = true;
    const probe = async () => {
      try {
        const r = await fetch("/api/agency/health", { cache: "no-store" });
        const j = await r.json();
        if (alive) { setVitals({ ok: j?.status === "ok", latency_ms: j?.latency_ms }); }
      } catch { if (alive) setVitals({ ok: false }); }
    };
    probe();
    setNow(new Date().toISOString().slice(0, 19).replace("T", " "));
    const i = setInterval(() => setNow(new Date().toISOString().slice(0, 19).replace("T", " ")), 30_000);
    return () => { alive = false; clearInterval(i); };
  }, []);

  const kpis: KPI[] = [
    { label: "Studio Live", value: vitals?.ok ? "yes" : "checking…", icon: Activity, color: vitals?.ok ? C.emerald : C.gold, bg: vitals?.ok ? C.emeraldBg : C.goldBg },
    { label: "App Latency", value: vitals?.latency_ms != null ? `${vitals.latency_ms}ms` : "—", icon: TrendingUp, color: C.blue, bg: C.blueBg },
    { label: "Squad", value: "transform-fit", icon: Sparkles, color: C.plum, bg: C.plumBg },
    { label: "Surface", value: "/agency/transformfit", icon: Smartphone, color: C.gold, bg: C.goldBg },
  ];

  return (
    <div className="pb-6 space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Flame size={20} style={{ color: C.red }} />
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.mute, fontWeight: 600 }}>
            TransformFit · Squad Studio
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Bricolage Grotesque" }}>
          TransformFit Command
        </h1>
        <p className="text-[13px] mt-1" style={{ color: C.text3 }}>
          Fitness-coaching squad sub-agent · pulse metrics and live studio
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {kpis.map((k, i) => {
          const Ic = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 + i * 0.04 }}
              className="rounded-lg p-4"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: C.mute, fontWeight: 600 }}>{k.label}</span>
                <Ic size={14} style={{ color: k.color }} />
              </div>
              <div className="text-[20px] font-bold leading-none" style={{ color: k.color }}>{k.value}</div>
            </motion.div>
          );
        })}
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-lg"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>
            Studio
          </span>
          <span className="text-[10px] font-mono" style={{ color: C.mute }}>
            {now ? `tick ${now}Z` : "—"}
          </span>
        </div>
        <div className="p-4">
          <TransformFitStudio />
        </div>
      </motion.div>

      <div className="text-[10px] flex items-center justify-between pt-3"
        style={{ color: C.mute, borderTop: `1px solid ${C.border}` }}
      >
        <span>
          Source: <code style={{ color: C.text3 }}>GET /api/agency/health</code> · live latency probe
        </span>
        <span style={{ color: C.gold }}>ProofPacket or it didn&apos;t happen</span>
      </div>
    </div>
  );
}
