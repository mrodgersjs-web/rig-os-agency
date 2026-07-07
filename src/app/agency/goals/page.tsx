// src/app/agency/goals/page.tsx
// $10M ARR Roadmap — the agency's north-star surface.
// Wired to /api/agency/goals which surfaces 10 sequential milestones
// (Prospect Discovery → Initial Outreach → First Reply → … → $10M ARR)
// with real current vs target progress.
//
// Doctrine:
//   • No fabricated numbers — every progress % is computed from real prospects /
//     emails / clients / contracts / payments on disk.
//   • Truth banner surfaces _real and _honest flags from the API.
//   • Milestone cards explain the math + show derived "next action".
//   • Honest "0" states (no replies, no contracts) are shown as 0, not hidden.

"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Trophy, RefreshCw, Search, Mail, MessageCircle, Phone,
  FileSignature, CreditCard, DollarSign, ChevronRight, ArrowUp,
  CheckCircle2, Clock, AlertCircle, Flag, Milestone, Activity,
  TrendingUp, Calendar, Sparkles, ChevronDown,
} from "lucide-react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { StatCard } from "@/components/DepartmentUI";

const C = {
  bg: "var(--bg-deep)", bgMid: "var(--bg-mid)", card: "var(--bg-card)",
  text: "var(--cream)", text2: "var(--cream-soft)", text3: "var(--cream-dim)",
  border: "var(--line-soft)", borderHot: "var(--line)",
  gold: "var(--gold)", emerald: "var(--emerald)", red: "var(--rust)",
  plum: "var(--plum)", blue: "#60a5fa", violet: "#a78bfa",
};

interface Milestone {
  step: number;
  label: string;
  target: string;
  current: string;
  progress: number;
  status: "active" | "pending" | "complete";
  icon: string;
}

interface GoalsData {
  _real: boolean;
  _honest?: string;
  current: Record<string, number>;
  target: { arr: number; label: string };
  gap: number;
  progressPercent: number;
  milestones: Milestone[];
  path?: string;
  nextAction?: string;
}

const ICON_MAP: Record<string, any> = {
  "search": Search,
  "mail": Mail,
  "message-circle": MessageCircle,
  "phone": Phone,
  "file-signature": FileSignature,
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,
};

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function progressColor(p: number): string {
  if (p >= 80) return C.emerald;
  if (p >= 40) return C.gold;
  if (p >= 10) return C.plum;
  if (p > 0) return "#a78bfa";
  return C.red;
}

function progressLabel(p: number): string {
  if (p >= 100) return "Cleared";
  if (p >= 80) return "Almost there";
  if (p >= 40) return "In motion";
  if (p >= 10) return "Started";
  if (p > 0) return "Just begun";
  return "Pending";
}

function statusBadge(status: string): { label: string; color: string; bg: string } {
  if (status === "active") return { label: "Active", color: C.gold, bg: "rgba(212,165,116,0.15)" };
  if (status === "complete") return { label: "Cleared", color: C.emerald, bg: "rgba(120,180,140,0.15)" };
  return { label: "Pending", color: C.text3, bg: "rgba(255,255,255,0.04)" };
}

export default function GoalsPage() {
  const [data, setData] = useState<GoalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch("/api/agency/goals", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: GoalsData = await res.json();
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const overallPct = data?.progressPercent ?? 0;
  const currentArr = data?.current?.arr ?? 0;
  const targetArr = data?.target?.arr ?? 10_000_000;
  const gap = data?.gap ?? targetArr;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        backgroundImage:
          "radial-gradient(ellipse at top, rgba(196, 96, 126, 0.06), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(212, 165, 116, 0.05), transparent 50%)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <PageBreadcrumbs
          items={[
            { label: "Agency", href: "/agency" },
            { label: "Goals & Roadmap", href: "/agency/goals" },
          ]}
        />

        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="grid place-items-center w-10 h-10 rounded-lg"
              style={{ background: `${C.gold}15`, color: C.gold }}
            >
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight" style={{ color: C.text }}>
                $10M ARR Roadmap
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: C.text3 }}>
                The 10 sequential milestones from zero to $10M — and where RIG OS Agency stands today.
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition disabled:opacity-50"
            style={{ borderColor: C.border, color: C.text2, background: C.card }}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Truth Banner */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-lg border p-4"
            style={{
              borderColor: data._real ? "rgba(120,180,140,0.4)" : "rgba(212,165,116,0.4)",
              background: data._real ? "rgba(120,180,140,0.06)" : "rgba(212,165,116,0.06)",
            }}
          >
            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: data._real ? C.emerald : C.gold }} />
            <div className="flex-1 text-sm">
              <div className="font-medium" style={{ color: C.text }}>
                {data._real ? "Truth Layer: real data wired" : "Truth Layer: source unavailable"}
              </div>
              <div className="mt-0.5" style={{ color: C.text2 }}>
                {data._honest || "Every milestone is computed from live counts on disk — prospects, emails, clients, contracts, payments. No fabrication."}
              </div>
            </div>
          </motion.div>
        )}

        {err && (
          <div
            className="mb-6 rounded-lg border p-4 text-sm"
            style={{ borderColor: "rgba(180,90,90,0.5)", background: "rgba(180,90,90,0.06)", color: C.red }}
          >
            <AlertCircle className="inline h-4 w-4 mr-2" />
            {err}
          </div>
        )}

        {/* Hero — Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl border p-6 md:p-8 relative overflow-hidden"
          style={{ borderColor: C.border, background: C.card }}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${C.gold}10, transparent 70%)`,
            }}
          />
          <div className="relative grid md:grid-cols-[280px_1fr] gap-8 items-center">
            {/* Progress ring */}
            <div className="flex justify-center">
              <svg width="240" height="240" viewBox="0 0 240 240" className="rotate-[-90deg]">
                <defs>
                  <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={C.gold} />
                    <stop offset="100%" stopColor={C.emerald} />
                  </linearGradient>
                </defs>
                <circle cx="120" cy="120" r="100" fill="none" stroke={C.border} strokeWidth="14" opacity="0.4" />
                <motion.circle
                  cx="120" cy="120" r="100" fill="none" stroke="url(#goalGrad)" strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 100}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 100 * (1 - Math.max(0.0001, overallPct) / 100),
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center" style={{ pointerEvents: "none" }}>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: C.text3 }}>
                  Total Progress
                </div>
                <div className="text-5xl font-display" style={{ color: C.gold }}>
                  {overallPct.toFixed(1)}<span className="text-2xl">%</span>
                </div>
                <div className="text-xs mt-1" style={{ color: C.text2 }}>
                  to {data?.target?.label || "$10M ARR"}
                </div>
              </div>
            </div>

            {/* Big numbers */}
            <div>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: C.text3 }}>
                Current vs Target
              </div>
              <div className="flex items-baseline gap-3 mb-4">
                <div className="text-5xl md:text-6xl font-display" style={{ color: C.emerald }}>
                  {fmt$(currentArr)}
                </div>
                <div className="text-2xl" style={{ color: C.text3 }}>/</div>
                <div className="text-3xl md:text-4xl font-display" style={{ color: C.gold }}>
                  {fmt$(targetArr)}
                </div>
              </div>
              <div className="text-sm mb-6" style={{ color: C.text2 }}>
                Gap: <span style={{ color: C.red, fontWeight: 600 }}>{fmt$(gap)}</span>
                {" "}— sequential milestones below show the path.
              </div>

              {/* Inline stat tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Prospects" value={fmtNum(data?.current?.prospects ?? 0)} icon={<Search className="h-3 w-3" />} />
                <StatCard label="Emails Sent" value={fmtNum(data?.current?.emailsSent ?? 0)} icon={<Mail className="h-3 w-3" />} />
                <StatCard label="Replies" value={fmtNum(data?.current?.replies ?? 0)} icon={<MessageCircle className="h-3 w-3" />} />
                <StatCard label="Contracts" value={fmtNum(data?.current?.contracts ?? 0)} icon={<FileSignature className="h-3 w-3" />} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Milestones vertical path */}
        {data && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Milestone className="h-4 w-4" style={{ color: C.gold }} />
              <h2 className="text-sm font-medium uppercase tracking-widest" style={{ color: C.text2 }}>
                Milestone Path
              </h2>
              <div className="text-xs ml-auto" style={{ color: C.text3 }}>
                Click a milestone for details
              </div>
            </div>

            <div className="relative">
              {/* Vertical connector line */}
              <div
                className="absolute left-[28px] top-4 bottom-4 w-px"
                style={{ background: `linear-gradient(to bottom, ${C.emerald}30, ${C.gold}20, transparent)` }}
              />

              <div className="space-y-3">
                {data.milestones.map((m, i) => {
                  const Icon = ICON_MAP[m.icon] || Target;
                  const badge = statusBadge(m.status);
                  const isActive = m.status === "active";
                  const isExpanded = activeStep === m.step;
                  return (
                    <motion.div
                      key={m.step}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setActiveStep(isExpanded ? null : m.step)}
                      className="relative cursor-pointer rounded-lg border p-4 transition-all"
                      style={{
                        borderColor: isActive ? C.gold : C.border,
                        background: isActive ? `${C.gold}05` : C.card,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Step number circle */}
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 relative z-10"
                          style={{
                            borderColor: m.progress >= 100 ? C.emerald : isActive ? C.gold : C.border,
                            background: m.progress >= 100 ? `${C.emerald}15` : C.bg,
                            color: m.progress >= 100 ? C.emerald : isActive ? C.gold : C.text3,
                          }}
                        >
                          {m.progress >= 100 ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: C.text3 }}>
                              Step {m.step}
                            </span>
                            <span
                              className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium"
                              style={{ color: badge.color, background: badge.bg }}
                            >
                              {badge.label}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium"
                              style={{ color: progressColor(m.progress), background: `${progressColor(m.progress)}15` }}>
                              {progressLabel(m.progress)}
                            </span>
                          </div>
                          <div className="text-base font-medium mb-1" style={{ color: C.text }}>
                            {m.label}
                          </div>
                          <div className="text-xs mb-2" style={{ color: C.text2 }}>
                            Target: {m.target}
                          </div>

                          {/* Progress bar */}
                          <div className="relative h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, m.progress)}%` }}
                              transition={{ duration: 1, delay: i * 0.04, ease: "easeOut" }}
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                background:
                                  m.progress >= 100
                                    ? C.emerald
                                    : `linear-gradient(90deg, ${progressColor(m.progress)}, ${C.gold})`,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="text-xs font-mono" style={{ color: C.text3 }}>
                              Current: <span style={{ color: C.text }}>{m.current}</span>
                            </div>
                            <div className="text-xs font-mono font-bold" style={{ color: progressColor(m.progress) }}>
                              {m.progress}%
                            </div>
                          </div>

                          {/* Expanded detail */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t overflow-hidden"
                                style={{ borderColor: C.border }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <div className="uppercase tracking-wider mb-0.5" style={{ color: C.text3 }}>
                                      What unlocks this
                                    </div>
                                    <div style={{ color: C.text2 }}>{m.target}</div>
                                  </div>
                                  <div>
                                    <div className="uppercase tracking-wider mb-0.5" style={{ color: C.text3 }}>
                                      What's measured
                                    </div>
                                    <div style={{ color: C.text2 }}>{m.current}</div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <ChevronRight
                          className={`h-4 w-4 mt-2 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          style={{ color: C.text3 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Doctrine footer */}
        {data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-lg border p-4 text-xs"
            style={{ borderColor: C.border, background: C.card, color: C.text2 }}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.gold }} />
              <div>
                <div className="font-medium mb-1" style={{ color: C.text }}>
                  Doctrine: ProofPacket or it didn't happen.
                </div>
                <div>
                  Every milestone reads from real, on-disk artifacts:{" "}
                  <span className="font-mono" style={{ color: C.gold }}>
                    rig-gtm-studio-v2/clients
                  </span>{" "}
                  (prospects),{" "}
                  <span className="font-mono" style={{ color: C.gold }}>
                    rig-gtm-studio-v2/proof/outbound
                  </span>{" "}
                  (emails), and the RIG persistent store (clients/contracts/invoices/payments).{" "}
                  {data.path && (
                    <>Source: <span className="font-mono" style={{ color: C.text3 }}>{data.path}</span>. </>
                  )}
                  When a milestone reads 0, that's honest zero — not fabricated momentum.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}