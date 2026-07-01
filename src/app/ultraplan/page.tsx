"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, Loader2, Lock, Rocket,
  Database, Users, FileText, Shield, DollarSign,
  Boxes, Server, Building2, Target,
} from "lucide-react";
import { ULTRAPLAN, getPlanStats } from "@/lib/ultraplan";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const phaseIcons: Record<number, React.ReactNode> = {
  1: <Database size={20} />,
  2: <Users size={20} />,
  3: <FileText size={20} />,
  4: <Shield size={20} />,
  5: <DollarSign size={20} />,
  6: <Boxes size={20} />,
  7: <Server size={20} />,
  8: <Building2 size={20} />,
};

const statusColors: Record<string, string> = {
  completed: "var(--emerald)",
  in_progress: "var(--gold)",
  pending: "var(--cream-dim)",
  blocked: "var(--plum)",
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={16} />,
  in_progress: <Loader2 size={16} className="animate-spin" />,
  pending: <Circle size={16} />,
  blocked: <Lock size={16} />,
};

export default function UltraplanPage() {
  const stats = getPlanStats();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Rocket size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Ultraplan
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Phased Build Plan
        </h1>
        <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          8 phases to move RIG OS Agency from scaffolding to fully tested and operational.
          Each phase has a done-test — no phase is complete until it passes.
        </p>
      </motion.section>

      {/* Progress Overview */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Phases", value: stats.total, accent: "var(--cream)" },
            { label: "Completed", value: stats.completed, accent: "var(--emerald)" },
            { label: "In Progress", value: stats.inProgress, accent: "var(--gold)" },
            { label: "Pending", value: stats.pending, accent: "var(--cream-dim)" },
            { label: "Total Tasks", value: stats.totalTasks, accent: "var(--plum)" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>{k.label}</div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: k.accent }}>{k.value}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Overall Progress Bar */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>Overall Progress</h2>
            <span className="text-[12px] mono" style={{ color: "var(--gold)" }}>
              {Math.round((stats.completed / stats.total) * 100)}% complete
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-mid)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.completed / stats.total) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--gold), var(--emerald))" }}
            />
          </div>
        </div>
      </motion.section>

      {/* Phase Cards */}
      {ULTRAPLAN.map((phase, i) => (
        <motion.section key={phase.id} {...fadeUp} transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}>
          <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            {/* Phase Header */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className="grid place-items-center w-12 h-12 rounded-xl shrink-0"
                style={{ background: `${statusColors[phase.status]}15`, color: statusColors[phase.status], border: `1px solid ${statusColors[phase.status]}55` }}
              >
                {phaseIcons[phase.id]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[11px] mono" style={{ color: "var(--cream-mute)" }}>PHASE {phase.id}</span>
                  <div className="flex items-center gap-1" style={{ color: statusColors[phase.status] }}>
                    {statusIcons[phase.status]}
                    <span className="text-[10px] uppercase tracking-wider">{phase.status.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <h3 className="text-[17px] font-semibold" style={{ color: "var(--cream)" }}>{phase.name}</h3>
                <p className="text-[12.5px] mt-1" style={{ color: "var(--cream-dim)" }}>{phase.goal}</p>
              </div>
            </div>

            {/* Done Test */}
            <div
              className="rounded-lg p-3 mb-4 border-l-2"
              style={{ background: "var(--bg-mid)", borderColor: statusColors[phase.status] }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Target size={12} style={{ color: "var(--gold)" }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Done Test</span>
              </div>
              <p className="text-[12px]" style={{ color: "var(--cream)" }}>{phase.doneTest}</p>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {phase.tasks.map((task) => (
                <div key={task.id} className="rounded-lg p-3 border" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
                  <div className="flex items-start gap-3">
                    <div className="grid place-items-center w-7 h-7 rounded-lg shrink-0 text-[11px] mono" style={{ background: "var(--bg-card)", color: "var(--gold)" }}>
                      {task.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{task.title}</h4>
                      <p className="text-[11.5px] mt-0.5" style={{ color: "var(--cream-dim)" }}>{task.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--bg-card)", color: "var(--cream-mute)" }}>
                          📦 {task.deliverable}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--bg-card)", color: "var(--cream-mute)" }}>
                          ✅ {task.test}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      ))}
    </div>
  );
}