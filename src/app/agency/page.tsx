"use client";

import { motion } from "framer-motion";
import {
  DollarSign, Users, TrendingUp, Building2, Activity,
  ArrowUpRight, Target, Zap, Shield,
} from "lucide-react";
import {
  getDashboardKPIs, getRevenueByVertical, getRevenueByTier,
  getRevenueProjections, getClients, getPipelineDeals,
} from "@/lib/agency-data";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function AgencyDashboard() {
  const kpis = getDashboardKPIs();
  const verticals = getRevenueByVertical();
  const tiers = getRevenueByTier();
  const projections = getRevenueProjections();
  const clients = getClients();
  const pipeline = getPipelineDeals();

  const maxVerticalARR = Math.max(...verticals.map((v) => v.arr), 1);
  const progressPercent = (kpis.currentARR / kpis.targetARR) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Agency Operations
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Agency Dashboard
        </h1>
        <p className="text-[14px] mt-2" style={{ color: "var(--cream-dim)" }}>
          Revenue, clients, pipeline, and ARR trajectory toward $10M.
        </p>
      </motion.section>

      {/* KPI Cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Current ARR", value: formatCurrency(kpis.currentARR), sub: `${kpis.activeClients} active clients`, icon: <DollarSign size={18} />, accent: "var(--gold)" },
            { label: "Target ARR", value: formatCurrency(kpis.targetARR), sub: "by Q4 2027", icon: <Target size={18} />, accent: "var(--emerald)" },
            { label: "Pipeline Value", value: formatCurrency(kpis.pipelineValue), sub: `${kpis.pipelineCount} deals in flight`, icon: <TrendingUp size={18} />, accent: "var(--plum)" },
            { label: "Avg Client Value", value: formatCurrency(kpis.avgClientValue), sub: "annual per client", icon: <Users size={18} />, accent: "#22d3ee" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{kpi.label}</span>
              </div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: kpi.accent }}>{kpi.value}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--cream-mute)" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ARR Progress Bar */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>ARR Progress</h2>
            <span className="text-[12px] mono" style={{ color: "var(--gold)" }}>
              {formatCurrency(kpis.currentARR)} / {formatCurrency(kpis.targetARR)} ({progressPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="h-4 rounded-full overflow-hidden" style={{ background: "var(--bg-mid)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--gold), var(--emerald))" }}
            />
          </div>
          <div className="text-[11px] mt-2" style={{ color: "var(--cream-mute)" }}>
            Gap to target: {formatCurrency(kpis.arrGap)}
          </div>
        </div>
      </motion.section>

      {/* Revenue by Vertical */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>I.</span> Revenue by Vertical
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="space-y-2">
          {verticals.map((v) => (
            <div key={v.vertical} className="flex items-center gap-3 py-1">
              <div className="w-32 text-[12px] truncate" style={{ color: "var(--cream-dim)" }}>{v.name}</div>
              <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(v.arr / maxVerticalARR) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-md flex items-center px-2"
                  style={{ background: v.color, minWidth: v.arr > 0 ? "40px" : "0" }}
                >
                  {v.arr > 0 && <span className="text-[10px] font-medium" style={{ color: "var(--bg-deep)" }}>{formatCurrency(v.arr)}</span>}
                </motion.div>
              </div>
              <div className="w-8 text-[11px] text-right" style={{ color: "var(--cream-dim)" }}>{v.clientCount}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Revenue Trajectory */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>II.</span> $10M ARR Trajectory
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          {/* SVG Chart */}
          <svg viewBox="0 0 600 200" className="w-full h-48">
            {/* Grid lines */}
            {[0, 50, 100, 150, 200].map((y) => (
              <line key={y} x1="40" y1={y} x2="600" y2={y} stroke="var(--line-soft)" strokeWidth="0.5" />
            ))}
            {/* Y axis labels */}
            {["$10M", "$7.5M", "$5M", "$2.5M", "$0"].map((label, i) => (
              <text key={label} x="0" y={i * 50 + 4} fontSize="9" fill="var(--cream-mute)" fontFamily="JetBrains Mono">{label}</text>
            ))}
            {/* Bars */}
            {projections.map((p, i) => {
              const barHeight = (p.arr / 10_000_000) * 180;
              const x = 50 + i * 90;
              const y = 200 - barHeight;
              return (
                <g key={p.month}>
                  <rect x={x} y={y} width="70" height={barHeight} rx="4" fill="var(--gold)" opacity={0.8} />
                  <text x={x + 35} y={y - 5} textAnchor="middle" fontSize="8" fill="var(--cream-dim)" fontFamily="JetBrains Mono">
                    {formatCurrency(p.arr)}
                  </text>
                  <text x={x + 35} y="195" textAnchor="middle" fontSize="8" fill="var(--cream-mute)" fontFamily="Manrope">
                    {p.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </motion.section>

      {/* Service Tier Distribution + Pipeline */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Service Tiers */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>III.</span> Service Tier Distribution
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="space-y-2">
              {tiers.map((t) => (
                <div key={t.tier} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                    <div>
                      <div className="text-[14px] font-medium" style={{ color: "var(--cream)" }}>{t.name}</div>
                      <div className="text-[11px]" style={{ color: "var(--cream-dim)" }}>{formatCurrency(t.arr)} ARR · {t.clientCount} clients</div>
                    </div>
                  </div>
                  <div className="text-[14px] font-semibold" style={{ color: t.color }}>{formatCurrency(t.arr)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Pipeline */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>IV.</span> Active Pipeline
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="space-y-2">
              {pipeline.map((deal) => (
                <div key={deal.id} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[14px] font-medium" style={{ color: "var(--cream)" }}>{deal.clientName}</div>
                    <div className="text-[13px] font-semibold" style={{ color: "var(--gold)" }}>{formatCurrency(deal.dealSize)}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}>
                      {deal.stage.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{deal.probability}% probability</span>
                    <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>· {deal.nextAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Prime Directive */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} style={{ color: "var(--gold)" }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Prime Directive</span>
          </div>
          <div className="text-[12px] mono" style={{ color: "var(--cream-dim)" }}>
            Code owns decisions. LLMs assist. Gates decide. <span style={{ color: "var(--gold)" }}>ProofPacket</span> or it didn&apos;t happen.
          </div>
        </div>
      </motion.section>
    </div>
  );
}