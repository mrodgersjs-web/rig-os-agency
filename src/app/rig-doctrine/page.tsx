"use client";

import { motion } from "framer-motion";
import { Shield, GitBranch, Gauge, Layers, FileCheck, AlertTriangle, Lock, Target } from "lucide-react";
import { IQRSQPI, BUILD_MODES, DEVIATION_ENGINES, GATE_D_RULES, SAFETY_RULES, PRIME_DIRECTIVE, NON_NEGOTIABLE, routeBuildMode } from "@/lib/rig-doctrine";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function DoctrinePage() {
  const cogEngines = DEVIATION_ENGINES.filter((e) => e.category === "Cognitive");
  const natEngines = DEVIATION_ENGINES.filter((e) => e.category === "Nature");
  const phyEngines = DEVIATION_ENGINES.filter((e) => e.category === "Physics");

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Shield size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            RIG Doctrine
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Doctrine Engine
        </h1>
        <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          The canonical RIG operating doctrine: IQRSQPI loop, A1-A4 build modes, 40 deviation engines, Gate-D, ProofPackets.
        </p>
      </motion.section>

      {/* Prime Directive */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 mb-3"><Lock size={16} style={{ color: "var(--gold)" }} /><span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Prime Directive</span></div>
          <pre className="text-[14px] mono leading-relaxed" style={{ color: "var(--cream)" }}>{PRIME_DIRECTIVE}</pre>
        </div>
      </motion.section>

      {/* IQRSQPI Loop */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>I.</span> IQRSQPI Loop</span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {IQRSQPI.map((stage, i) => (
            <div key={stage.code} className="rounded-xl p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[18px] hand" style={{ color: "var(--gold)" }}>{i + 1}</span>
                <span className="text-[10px] mono" style={{ color: "var(--cream-mute)" }}>{stage.code}</span>
              </div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>{stage.name}</div>
              <div className="text-[10px] mt-1" style={{ color: "var(--cream-dim)" }}>{stage.purpose}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Build Modes */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>II.</span> Build Mode Routing</span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {BUILD_MODES.map((mode) => {
            const accent = mode.mode === "A1" ? "#5ab896" : mode.mode === "A2" ? "#d4a574" : mode.mode === "A3" ? "#fbbf24" : "#ef4444";
            return (
              <div key={mode.mode} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                <div className="flex items-center gap-2 mb-2"><Gauge size={16} style={{ color: accent }} /><span className="text-[14px] font-bold" style={{ color: accent }}>{mode.mode}</span></div>
                <div className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{mode.name}</div>
                <div className="text-[10px] mt-1 mono" style={{ color: "var(--cream-dim)" }}>BMS {mode.bmsThreshold}</div>
                <div className="text-[11px] mt-2" style={{ color: "var(--cream-dim)" }}>{mode.hardRules}</div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Deviation Engines */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>III.</span> 40 Deviation Engines</span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {[
            { title: "Cognitive 01-20", engines: cogEngines, accent: "#d4a574", sigma: "±20σ" },
            { title: "Nature 21-30", engines: natEngines, accent: "#5ab896", sigma: "±20σ" },
            { title: "Physics 31-40", engines: phyEngines, accent: "#ef4444", sigma: "±30σ HARD" },
          ].map((group) => (
            <div key={group.title} className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Layers size={16} style={{ color: group.accent }} /><span className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>{group.title}</span></div>
                <span className="text-[10px] mono px-2 py-0.5 rounded" style={{ background: group.accent + "20", color: group.accent }}>{group.sigma}</span>
              </div>
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {group.engines.map((e) => (
                  <div key={e.number} className="flex items-start gap-2 py-1.5 border-b" style={{ borderColor: "var(--line-soft)" }}>
                    <span className="text-[10px] mono w-6" style={{ color: "var(--cream-mute)" }}>{String(e.number).padStart(2, "0")}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{e.name}</div>
                      <div className="text-[10px]" style={{ color: "var(--cream-dim)" }}>{e.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Gate-D + Safety */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>IV.</span> Gate-D Rules</span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="rounded-xl p-5 border space-y-2" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              {GATE_D_RULES.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <FileCheck size={12} className="mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>V.</span> Safety Rules</span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="rounded-xl p-5 border space-y-2" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              {SAFETY_RULES.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: "var(--plum)" }} />
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Non-Negotiable */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 mb-3"><Target size={14} style={{ color: "var(--gold)" }} /><span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Non-Negotiable</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {NON_NEGOTIABLE.map((rule, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <span className="text-[10px] mono w-4" style={{ color: "var(--gold)" }}>{i + 1}.</span>
                <span className="text-[12px] mono" style={{ color: "var(--cream-dim)" }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}