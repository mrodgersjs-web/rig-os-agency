"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, Target, Shield, GitBranch, Layers, Activity,
  ArrowUpRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const POWERS = [
  { power: "Scale economies", status: "building" },
  { power: "Network effects", status: "active" },
  { power: "Counter-positioning", status: "active" },
  { power: "Switching costs", status: "planning" },
  { power: "Branding", status: "active" },
  { power: "Cornered resource", status: "building" },
  { power: "Process power", status: "active" },
];

const MEMOS = [
  { title: "RIG GTM: Fractional CAIO positioning", coord: "L4-D2-A3-S", date: "2026-07-01" },
  { title: "RIG LinkedIn: 8-vertical content engine", coord: "L3-D2-A2-S", date: "2026-07-01" },
  { title: "RIG App: Agent OS as control plane", coord: "L5-D1-A3-S", date: "2026-07-01" },
];

const LOOPS = ["strategy-7powers", "orthodoxy-map", "scenario-tree", "mechanism-map", "decision-memo", "strategy-evolve"];
const ORTHODOXIES = ["consulting = expensive", "AI = threat", "SMB = underserved", "fractional = niche", "content = marketing"];

const STATUS_COLORS: Record<string, string> = { active: "var(--emerald)", building: "var(--gold)", planning: "var(--gold-soft)" };

export default function RigStrategyPage() {
  return (
    <div className="space-y-8">
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Studios
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Strategy <span className="hand text-[1.2em]" style={{ color: "var(--gold)" }}>Studio</span>
        </h1>
        <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          7 Powers · Orthodoxy Map · Scenario Tree · Mechanism Map · Decision Memo.
          Regret-min optimization. Brier gate ≤0.15. RIG-L ≥5.
        </p>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "7 Powers", value: "Active", icon: <Shield size={18} />, accent: "var(--gold)" },
            { label: "Scenario Tree", value: "regret-min", icon: <GitBranch size={18} />, accent: "var(--gold-soft)" },
            { label: "Brier Gate", value: "≤0.15", icon: <Target size={18} />, accent: "var(--emerald)" },
            { label: "RIG-L Target", value: "≥5", icon: <Activity size={18} />, accent: "var(--plum)" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{kpi.label}</span>
              </div>
              <div className="text-[18px]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: kpi.accent }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>I.</span> Strategy Loops
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {LOOPS.map((loop) => (
            <span key={loop} className="text-[11px] px-3 py-1 rounded-full mono" style={{ background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.2)", color: "var(--gold-soft)" }}>
              {loop}
            </span>
          ))}
        </div>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>II.</span> 7 Powers Analysis
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="space-y-2">
          {POWERS.map((p) => (
            <div key={p.power} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <span className="text-[14px] font-medium" style={{ color: "var(--cream)" }}>{p.power}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: `${STATUS_COLORS[p.status]}20`, color: STATUS_COLORS[p.status] }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>III.</span> Active Strategy Memos
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="space-y-2">
          {MEMOS.map((m) => (
            <div key={m.title} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[14px] font-medium" style={{ color: "var(--cream)" }}>{m.title}</span>
                  <span className="text-[10px] mono ml-2" style={{ color: "var(--cream-mute)" }}>{m.coord}</span>
                </div>
                <span className="text-[10px]" style={{ color: "var(--cream-dim)" }}>{m.date}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>IV.</span> Orthodoxy Map
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <p className="text-[12px] mb-3" style={{ color: "var(--cream-dim)" }}>
            20+ named orthodoxies mapped, each with anti-thesis and RIG mechanism.
          </p>
          <div className="flex flex-wrap gap-2">
            {ORTHODOXIES.map((o) => (
              <span key={o} className="text-[11px] px-3 py-1 rounded-full" style={{ background: "rgba(196,96,126,0.08)", border: "1px solid rgba(196,96,126,0.2)", color: "var(--plum)" }}>
                {o}
              </span>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
