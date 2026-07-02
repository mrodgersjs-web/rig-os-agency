"use client";

import { motion } from "framer-motion";
import {
  Briefcase, Cpu, GitBranch, Shield, Zap, CheckCircle2, AlertTriangle,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const PROJECTS = [
  { name: "RIG Agent OS Dashboard", status: "building", coord: "L5-D1-A3-S", progress: 60 },
  { name: "Paperclip Integration", status: "building", coord: "L4-D1-A3-S", progress: 30 },
  { name: "LinkedIn Studio Cockpit v2", status: "active", coord: "L3-D2-A2-S", progress: 80 },
  { name: "TransformFit", status: "built", coord: "L4-D1-A2-S", progress: 100 },
];

const DECISIONS = [
  { item: "Dashboard UI", decision: "build", ev: "+12" },
  { item: "Agent orchestration", decision: "paperclip", ev: "+8" },
  { item: "Voice/Jarvis", decision: "build", ev: "+5" },
  { item: "SEO pipeline", decision: "build", ev: "+9" },
];

const TWINS = [
  { name: "Agent OS launch flow", status: "pass" },
  { name: "Paperclip onboarding", status: "pending" },
  { name: "Goal loop execution", status: "pass" },
];

const LOOPS = ["spec-synthesize", "plan-chunk", "build-evolve", "digital-twin-test", "build-vs-buy", "retrofit-studio"];
const CONSTRAINTS = ["no-self-verify", "no-big-bang", "chunked-delivery", "ProofPacket per transition", "gate before ship"];

const STATUS_COLORS: Record<string, string> = { active: "var(--emerald)", building: "var(--gold)", built: "var(--gold-soft)", pass: "var(--emerald)", pending: "var(--gold)", fail: "var(--plum)" };

export default function RigAppPage() {
  return (
    <div className="space-y-8">
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Briefcase size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Studios
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          App <span className="hand text-[1.2em]" style={{ color: "var(--gold)" }}>Studio</span>
        </h1>
        <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          Spec · Plan · Build · Twin Test · Build-vs-Buy · Retrofit.
          Forced-guess=0. No big-bang. No self-verify. Chunked delivery.
        </p>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Builds", value: "4", icon: <Cpu size={18} />, accent: "var(--plum)" },
            { label: "Spec Synth", value: "forced-guess=0", icon: <GitBranch size={18} />, accent: "var(--gold-soft)" },
            { label: "Build Mode", value: "no-big-bang", icon: <Zap size={18} />, accent: "var(--gold)" },
            { label: "Self-Verify", value: "BLOCKED", icon: <Shield size={18} />, accent: "var(--plum)" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{kpi.label}</span>
              </div>
              <div className="text-[16px]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: kpi.accent }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>I.</span> App Studio Loops
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {LOOPS.map((loop) => (
            <span key={loop} className="text-[11px] px-3 py-1 rounded-full mono" style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)", color: "var(--plum)" }}>
              {loop}
            </span>
          ))}
        </div>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>II.</span> Active Projects
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="space-y-2">
          {PROJECTS.map((p) => (
            <div key={p.name} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[14px] font-medium" style={{ color: "var(--cream)" }}>{p.name}</span>
                  <span className="text-[10px] mono ml-2" style={{ color: "var(--cream-mute)" }}>{p.coord}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: `${STATUS_COLORS[p.status]}20`, color: STATUS_COLORS[p.status] }}>
                  {p.status}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: STATUS_COLORS[p.status] }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>III.</span> Build-vs-Buy
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="space-y-2">
              {DECISIONS.map((d) => (
                <div key={d.item} className="rounded-xl p-3 border flex items-center justify-between" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                  <span className="text-[13px]" style={{ color: "var(--cream)" }}>{d.item}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] px-2 py-0.5 rounded-full uppercase" style={{ background: "rgba(90,184,150,0.15)", color: "var(--emerald)" }}>{d.decision}</span>
                    <span className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>EV: {d.ev}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>IV.</span> Digital Twin Tests
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="space-y-2">
              {TWINS.map((t) => (
                <div key={t.name} className="rounded-xl p-3 border flex items-center justify-between" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                  <span className="text-[13px]" style={{ color: "var(--cream)" }}>{t.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full uppercase" style={{ background: `${STATUS_COLORS[t.status]}20`, color: STATUS_COLORS[t.status] }}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: "var(--cream)" }}>Build Constraints</h3>
          <div className="flex flex-wrap gap-2">
            {CONSTRAINTS.map((c) => (
              <span key={c} className="text-[11px] px-3 py-1 rounded-full" style={{ background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.2)", color: "var(--gold-soft)" }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
