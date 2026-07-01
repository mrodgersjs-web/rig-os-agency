"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield, GitBranch, Gauge, Layers, FileCheck, AlertTriangle, Lock, Target,
  Activity, CheckCircle, Circle, ArrowRight,
} from "lucide-react";
import {
  IQRSQPI, BUILD_MODES, DEVIATION_ENGINES, GATE_D_RULES, SAFETY_RULES,
  PRIME_DIRECTIVE, NON_NEGOTIABLE, routeBuildMode, LATTICE_DIMENSIONS,
} from "@/lib/rig-doctrine";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

interface SessionActivity {
  step: string;
  label: string;
  status: "pending" | "active" | "complete" | "blocked";
  timestamp: string;
  detail: string;
}

interface SessionState {
  coordinate: string;
  bms: number;
  buildMode: string;
  steps: SessionActivity[];
  proofPackets: number;
  gatesPassed: number;
  gatesFailed: number;
  lastUpdate: string;
}

export default function DoctrinePage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/doctrine/session");
      const data = await res.json();
      setSession(data.session || null);
    } catch {
      // fallback static
      setSession({
        coordinate: "L4-D1-A3-I2",
        bms: 0.35,
        buildMode: "A3",
        steps: IQRSQPI.map((s, i) => ({
          step: s.code,
          label: s.name,
          status: i < 4 ? "complete" : i === 4 ? "active" : "pending",
          timestamp: new Date(Date.now() - (7 - i) * 60000).toISOString(),
          detail: i < 4 ? "Step completed" : i === 4 ? "Validating safety and policy" : "Awaiting step",
        })),
        proofPackets: 3,
        gatesPassed: 12,
        gatesFailed: 0,
        lastUpdate: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    const interval = setInterval(loadSession, 10000);
    return () => clearInterval(interval);
  }, [loadSession]);

  const cogEngines = DEVIATION_ENGINES.filter((e) => e.category === "Cognitive");
  const natEngines = DEVIATION_ENGINES.filter((e) => e.category === "Nature");
  const phyEngines = DEVIATION_ENGINES.filter((e) => e.category === "Physics");

  const stepIcons: Record<string, React.ReactNode> = {
    pending: <Circle size={14} style={{ color: "var(--cream-mute)" }} />,
    active: <Activity size={14} style={{ color: "var(--gold)" }} className="animate-pulse" />,
    complete: <CheckCircle size={14} style={{ color: "var(--emerald)" }} />,
    blocked: <AlertTriangle size={14} style={{ color: "#ef4444" }} />,
  };

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
          The canonical RIG operating doctrine: IQRSQPI loop, A1-A4 build modes, 40 deviation engines, Gate-D, ProofPackets. {LATTICE_DIMENSIONS.totalCells} execution cells in the 3D lattice.
        </p>
      </motion.section>

      {/* Live IQRSQPI Tracker */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} style={{ color: "var(--gold)" }} className="animate-pulse" />
              <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>Live IQRSQPI Tracker</h2>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              {session && (
                <>
                  <span className="mono px-2 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: "var(--gold)" }}>
                    {session.coordinate}
                  </span>
                  <span className="mono px-2 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: "var(--emerald)" }}>
                    {session.buildMode} (BMS {session.bms.toFixed(2)})
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Step Progress Bar */}
          {session && (
            <>
              <div className="flex items-center gap-1 mb-4">
                {session.steps.map((step, i) => (
                  <div key={step.step} className="flex items-center flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      {stepIcons[step.status]}
                      <div className="flex-1">
                        <div className="text-[11px] font-medium" style={{ color: step.status === "active" ? "var(--gold)" : step.status === "complete" ? "var(--emerald)" : "var(--cream-mute)" }}>
                          {step.label}
                        </div>
                        <div className="text-[9px] mono" style={{ color: "var(--cream-mute)" }}>{step.step}</div>
                      </div>
                    </div>
                    {i < session.steps.length - 1 && (
                      <ArrowRight size={12} style={{ color: "var(--cream-mute)" }} className="mx-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Progress metrics */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Steps Done", value: `${session.steps.filter((s) => s.status === "complete").length}/${session.steps.length}`, accent: "var(--emerald)" },
                  { label: "ProofPackets", value: session.proofPackets, accent: "var(--gold)" },
                  { label: "Gates Passed", value: session.gatesPassed, accent: "var(--emerald)" },
                  { label: "Gates Failed", value: session.gatesFailed, accent: session.gatesFailed > 0 ? "#ef4444" : "var(--cream-dim)" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg p-2.5 text-center" style={{ background: "var(--bg-mid)" }}>
                    <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--cream-dim)" }}>{m.label}</div>
                    <div className="text-[16px] font-bold" style={{ color: m.accent, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Current step detail */}
              {session.steps.find((s) => s.status === "active") && (
                <div className="rounded-lg p-3 border" style={{ background: "rgba(212,165,116,0.08)", borderColor: "rgba(212,165,116,0.3)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity size={12} style={{ color: "var(--gold)" }} className="animate-pulse" />
                    <span className="text-[12px] font-semibold" style={{ color: "var(--gold)" }}>
                      Active: {session.steps.find((s) => s.status === "active")?.label}
                    </span>
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
                    {session.steps.find((s) => s.status === "active")?.detail}
                  </div>
                </div>
              )}

              <div className="text-[10px] mt-2 mono" style={{ color: "var(--cream-mute)" }}>
                Last update: {new Date(session.lastUpdate).toLocaleTimeString()}
              </div>
            </>
          )}
          {loading && (
            <div className="text-[13px]" style={{ color: "var(--cream-dim)" }}>Loading session tracker…</div>
          )}
        </div>
      </motion.section>

      {/* Prime Directive */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 mb-3"><Lock size={16} style={{ color: "var(--gold)" }} /><span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Prime Directive</span></div>
          <pre className="text-[14px] mono leading-relaxed" style={{ color: "var(--cream)" }}>{PRIME_DIRECTIVE}</pre>
        </div>
      </motion.section>

      {/* IQRSQPI Loop */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
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
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
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
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
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
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
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

      {/* Non-Negotiable + Lattice */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.35 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center gap-2 mb-3"><GitBranch size={14} style={{ color: "var(--gold)" }} /><span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>3D Lattice</span></div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Levels", value: LATTICE_DIMENSIONS.levels, desc: "L1-L7" },
                { label: "Diamonds", value: LATTICE_DIMENSIONS.diamonds, desc: "D1-D3" },
                { label: "Modes", value: LATTICE_DIMENSIONS.modes, desc: "A1-A4" },
                { label: "Steps", value: LATTICE_DIMENSIONS.steps, desc: "IQRSQPI" },
              ].map((d) => (
                <div key={d.label} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: "var(--gold)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{d.value}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{d.label}</div>
                  <div className="text-[9px] mono" style={{ color: "var(--cream-mute)" }}>{d.desc}</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-4 pt-3 border-t" style={{ borderColor: "var(--line-soft)" }}>
              <div className="text-3xl font-bold" style={{ color: "var(--emerald)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{LATTICE_DIMENSIONS.totalCells}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Execution Cells</div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}