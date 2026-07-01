"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, Calendar, Zap, Clock } from "lucide-react";
import { ACTIVE_GOALS, QUARTERLY_OKRS, DAILY_OPS, ARR_PATH, getGoalProgress } from "@/lib/rig-goals";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const statusColors: Record<string, string> = {
  on_track: "var(--emerald)",
  at_risk: "var(--gold)",
  behind: "var(--plum)",
  achieved: "var(--emerald)",
};

export default function GoalsPage() {
  return (
    <div className="space-y-8">
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Target size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Goals & OKRs
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Goals & OKRs
        </h1>
        <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          $10M ARR path with quarterly milestones, client pipeline, and daily ops targets.
        </p>
      </motion.section>

      {/* $10M ARR Trajectory */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>I.</span> $10M ARR Trajectory</span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <svg viewBox="0 0 600 220" className="w-full h-56">
            {[0, 44, 88, 132, 176, 220].map((y) => (
              <line key={y} x1="50" y1={220 - y} x2="600" y2={220 - y} stroke="var(--line-soft)" strokeWidth="0.5" />
            ))}
            {["$10M", "$8M", "$6M", "$4M", "$2M", "$0"].map((label, i) => (
              <text key={label} x="0" y={(5 - i) * 44 + 4} fontSize="9" fill="var(--cream-mute)" fontFamily="JetBrains Mono">{label}</text>
            ))}
            {ARR_PATH.map((point, i) => {
              const barHeight = (point.arr / 10_000_000) * 176;
              const x = 55 + i * 90;
              const y = 220 - barHeight;
              return (
                <g key={point.quarter}>
                  <motion.rect initial={{ height: 0, y: 220 }} animate={{ height: barHeight, y }} transition={{ duration: 0.8, delay: i * 0.1 }} x={x} width="70" rx="4" fill="var(--gold)" opacity={0.8} />
                  <text x={x + 35} y={y - 5} textAnchor="middle" fontSize="8" fill="var(--cream-dim)" fontFamily="JetBrains Mono">{formatCurrency(point.arr)}</text>
                  <text x={x + 35} y="215" textAnchor="middle" fontSize="8" fill="var(--cream-mute)" fontFamily="Manrope">{point.quarter}</text>
                  <text x={x + 35} y={y + 12} textAnchor="middle" fontSize="7" fill="var(--gold)" fontFamily="Manrope">{point.clients} clients</text>
                </g>
              );
            })}
          </svg>
        </div>
      </motion.section>

      {/* Active Goals */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>II.</span> Active Goals</span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ACTIVE_GOALS.map((goal) => {
            const progress = getGoalProgress(goal.id);
            const color = statusColors[goal.status];
            return (
              <div key={goal.id} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{goal.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: color + "20", color }}>{goal.status.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[18px] font-bold" style={{ color: "var(--gold)" }}>{formatCurrency(goal.current)}</span>
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>/ {formatCurrency(goal.target)} {goal.unit}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: color }} />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>evidence:</span>
                  <span className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>{goal.evidence}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Quarterly OKRs */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>III.</span> Quarterly OKRs</span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="space-y-3">
          {QUARTERLY_OKRS.map((okr) => (
            <div key={okr.quarter} className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} style={{ color: "var(--gold)" }} />
                <span className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>{okr.quarter}</span>
                <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>— {okr.objective}</span>
              </div>
              <div className="space-y-2">
                {okr.keyResults.map((kr, i) => {
                  const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[12px] flex-1" style={{ color: "var(--cream-dim)" }}>{kr.kr}</span>
                      <span className="text-[11px] mono" style={{ color: "var(--gold)" }}>{kr.current}/{kr.target} {kr.unit}</span>
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: "var(--emerald)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Daily Ops */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}><span style={{ color: "var(--gold)" }}>IV.</span> Daily Operations</span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DAILY_OPS.map((op) => (
            <div key={op.id} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2"><Clock size={14} style={{ color: "var(--emerald)" }} /><span className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{op.name}</span></div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{op.target}</span><span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>{op.unit}</span></div>
              <div className="text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>{op.schedule}</div>
              <div className="text-[10px] mono mt-1" style={{ color: "var(--cream-dim)" }}>{op.evidence}</div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}