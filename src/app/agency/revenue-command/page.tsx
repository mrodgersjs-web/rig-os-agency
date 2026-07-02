"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Rocket, Target, TrendingUp, Users, DollarSign, Gauge, Calendar, Zap } from "lucide-react";

interface Metrics {
  currentARR: number;
  targetARR: number;
  arrGap: number;
  currentMRR: number;
  targetMRR: number;
  mrrGap: number;
  activeClients: number;
  pipelineValue: number;
  pipelineCount: number;
  avgDealSize: number;
  avgWinRate: number;
  monthsRemaining: number;
  mrrPerNewClient: number;
  newClientsPerMonth: number;
  newMRRNeededPerMonth: number;
  blendedARRPerClient: number;
  blendedClientsNeeded: number;
  blendedNewClients: number;
  arrProgressPct: number;
}

interface TierVelocity {
  tier: string;
  name: string;
  monthlyFee: number;
  annualFee: number;
  clientsNeeded: number;
  arrContribution: number;
  color: string;
}

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  conversionRate: number;
  avgDealSize: number;
  weightedValue: number;
  color: string;
}

interface MonthlyTarget {
  month: string;
  targetARR: number;
  targetClients: number;
  newClientsNeeded: number;
  mrrNeeded: number;
  cumulativeARR: number;
  isPast: boolean;
}

interface VerticalARR {
  id: string;
  name: string;
  color: string;
  currentClients: number;
  currentARR: number;
  pipelineARR: number;
  targetARR: number;
  gapToTarget: number;
  progress: number;
}

interface CommandData {
  metrics: Metrics;
  tierPaths: TierVelocity[];
  funnel: FunnelStage[];
  milestones: MonthlyTarget[];
  verticalARR: VerticalARR[];
  generatedAt: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function RevenueCommandPage() {
  const [data, setData] = useState<CommandData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/agency/revenue-command");
      const d = await res.json();
      setData(d);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "50vh" }}>
        <Rocket size={32} className="animate-pulse" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-12" style={{ color: "var(--cream-dim)" }}>
        Failed to load revenue command data.
      </div>
    );
  }

  const { metrics: m, tierPaths, funnel, milestones, verticalARR } = data;
  const maxFunnelCount = Math.max(...funnel.map((f) => f.count), 1);
  const maxMilestoneARR = Math.max(...milestones.map((x) => x.targetARR), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Rocket size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Revenue Command Center
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Path to $10M ARR
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
          Mathematical trajectory, acquisition velocity, and funnel math — computed from live client + pipeline data.
        </p>
      </motion.section>

      {/* Primary KPI Banner */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="rounded-2xl border p-6" style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-mid))", borderColor: "var(--line-soft)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Current ARR</div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "var(--gold)" }}>{formatCurrency(m.currentARR)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Target ARR</div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "var(--emerald)" }}>{formatCurrency(m.targetARR)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>ARR Gap</div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "var(--plum)" }}>{formatCurrency(m.arrGap)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Progress</div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "var(--cream)" }}>{m.arrProgressPct.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Months Left</div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "#22d3ee" }}>{m.monthsRemaining}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Active Clients</div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "var(--cream)" }}>{m.activeClients}</div>
            </div>
          </div>

          {/* ARR Progress Bar */}
          <div className="mt-5">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-deep)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.arrProgressPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--gold), var(--emerald))" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[11px]" style={{ color: "var(--cream-mute)" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(m.currentARR)} → {formatCurrency(m.targetARR)}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.arrProgressPct.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Velocity Cards — what's needed monthly */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>I.</span> Acquisition Velocity Required
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "New MRR / Month",
              value: formatCurrency(m.newMRRNeededPerMonth),
              sub: `to close MRR gap of ${formatCurrency(m.mrrGap)}`,
              icon: <DollarSign size={16} />,
              accent: "var(--gold)",
            },
            {
              label: "New Clients / Month",
              value: `${m.newClientsPerMonth}`,
              sub: `at avg ${formatCurrency(m.mrrPerNewClient)}/mo each`,
              icon: <Users size={16} />,
              accent: "var(--emerald)",
            },
            {
              label: "Blended New Clients",
              value: `${m.blendedNewClients}`,
              sub: `total to hit target (${formatCurrency(m.blendedARRPerClient)}/yr blended)`,
              icon: <Target size={16} />,
              accent: "var(--plum)",
            },
            {
              label: "Pipeline Coverage",
              value: `${(m.pipelineValue / Math.max(1, m.newMRRNeededPerMonth * 3)).toFixed(1)}x`,
              sub: `${formatCurrency(m.pipelineValue)} weighted vs 3-month need`,
              icon: <Gauge size={16} />,
              accent: "#22d3ee",
            },
          ].map((card) => (
            <div key={card.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: card.accent }}>{card.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{card.label}</span>
              </div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: card.accent }}>{card.value}</div>
              <div className="text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>{card.sub}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Sales Funnel */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>II.</span> Sales Funnel — Live Deal Flow
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="space-y-2">
            {funnel.map((stage, i) => {
              const widthPct = (stage.count / maxFunnelCount) * 100;
              const isLast = i === funnel.length - 1;
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-28 text-[11px] font-medium" style={{ color: "var(--cream-dim)" }}>{stage.label}</div>
                  <div className="flex-1 relative">
                    <div className="h-8 rounded-md overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(widthPct, 5)}%` }}
                        transition={{ duration: 0.6, delay: 0.1 * i }}
                        className="h-full rounded-md flex items-center px-3"
                        style={{ background: `${stage.color}40`, borderLeft: `3px solid ${stage.color}` }}
                      >
                        <span className="text-[11px] font-semibold" style={{ color: "var(--cream)" }}>{stage.count} deals</span>
                      </motion.div>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-[11px] mono font-semibold" style={{ color: stage.color }}>{formatCurrency(stage.avgDealSize)}</div>
                    <div className="text-[9px]" style={{ color: "var(--cream-mute)" }}>avg/deal</div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-[11px] mono font-semibold" style={{ color: "var(--gold)" }}>{formatCurrency(stage.weightedValue)}</div>
                    <div className="text-[9px]" style={{ color: "var(--cream-mute)" }}>weighted</div>
                  </div>
                  {!isLast && (
                    <div className="w-12 text-center text-[10px]" style={{ color: "var(--cream-mute)" }}>
                      ↓ {(stage.conversionRate * 100).toFixed(0)}%
                    </div>
                  )}
                  {isLast && <div className="w-12" />}
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--line-soft)" }}>
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: "var(--gold)" }} />
              <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
                Avg Win Rate: <span className="mono font-semibold" style={{ color: "var(--gold)" }}>{(m.avgWinRate * 100).toFixed(0)}%</span>
              </span>
            </div>
            <div className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
              Weighted Pipeline: <span className="mono font-semibold" style={{ color: "var(--gold)" }}>{formatCurrency(m.pipelineValue)}</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Tier Path + Monthly Milestones */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Tier Path */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>III.</span> Path by Service Tier
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="space-y-2">
              {tierPaths.map((t) => {
                const maxNeeded = Math.max(...tierPaths.map((x) => x.clientsNeeded));
                const barPct = (t.clientsNeeded / maxNeeded) * 100;
                return (
                  <div key={t.tier} className="rounded-xl p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                        <span className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{t.name}</span>
                        <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{formatCurrency(t.monthlyFee)}/mo</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] mono" style={{ color: "var(--cream-dim)" }}>Current: {formatCurrency(t.arrContribution)}</span>
                        <span className="text-[13px] font-bold" style={{ color: t.color }}>{t.clientsNeeded} clients</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: t.color }}
                      />
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>
                      → {formatCurrency(t.clientsNeeded * t.annualFee)} ARR at 100% {t.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Milestones */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>IV.</span> Monthly Milestones to $10M
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="rounded-xl p-4 border max-h-[380px] overflow-y-auto" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="space-y-1">
                {milestones.map((ms, i) => {
                  const barPct = (ms.targetARR / maxMilestoneARR) * 100;
                  return (
                    <div key={ms.month + i} className="flex items-center gap-3 py-1.5">
                      <div className="w-12 text-[10px]" style={{ color: ms.isPast ? "var(--gold)" : "var(--cream-mute)" }}>{ms.month}</div>
                      <div className="flex-1">
                        <div className="h-5 rounded-md overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barPct}%` }}
                            transition={{ duration: 0.5, delay: 0.05 * i }}
                            className="h-full rounded-md flex items-center justify-end pr-2"
                            style={{ background: ms.isPast ? "var(--gold)" : "linear-gradient(90deg, var(--emerald-dim), var(--emerald))" }}
                          >
                            <span className="text-[9px] font-bold mono" style={{ color: "var(--bg-deep)" }}>{formatCurrency(ms.targetARR)}</span>
                          </motion.div>
                        </div>
                      </div>
                      <div className="w-12 text-right">
                        <span className="text-[10px] font-semibold" style={{ color: ms.newClientsNeeded > 0 ? "var(--emerald)" : "var(--cream-mute)" }}>
                          {ms.newClientsNeeded > 0 ? `+${ms.newClientsNeeded}` : "—"}
                        </span>
                      </div>
                      <div className="w-8 text-right text-[10px]" style={{ color: "var(--cream-dim)" }}>{ms.targetClients}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Vertical Breakdown */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>V.</span> Vertical ARR Breakdown
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {verticalARR.map((v) => (
            <div key={v.id} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: v.color }} />
                <span className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{v.name}</span>
              </div>
              <div className="text-xl mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: v.color }}>
                {formatCurrency(v.currentARR)}
              </div>
              <div className="text-[10px] mb-2" style={{ color: "var(--cream-mute)" }}>
                {v.currentClients} clients · Pipeline: {formatCurrency(v.pipelineARR)}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "var(--bg-mid)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(v.progress, 100)}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: v.color }}
                />
              </div>
              <div className="flex justify-between text-[9px]" style={{ color: "var(--cream-mute)" }}>
                <span>{v.progress.toFixed(1)}% of target</span>
                <span>Target: {formatCurrency(v.targetARR)}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Footer summary */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <div className="rounded-xl p-4 border flex items-center gap-3" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
          <Calendar size={16} style={{ color: "var(--cream-mute)" }} />
          <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
            Generated {new Date(data.generatedAt).toLocaleString()} · Computed from {m.activeClients} active clients and {m.pipelineCount} pipeline deals
          </span>
        </div>
      </motion.div>
    </div>
  );
}
