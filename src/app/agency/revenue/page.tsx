"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import { getDashboardKPIs, getRevenueProjections, getRevenueByVertical, getRevenueByTier } from "@/lib/agency-data";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function RevenuePage() {
  const kpis = getDashboardKPIs();
  const projections = getRevenueProjections();
  const verticals = getRevenueByVertical();
  const tiers = getRevenueByTier();

  const maxARR = Math.max(...projections.map((p) => p.arr));
  const totalARR = verticals.reduce((s, v) => s + v.arr, 0);

  // SVG line chart dimensions
  const chartW = 600;
  const chartH = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const plotW = chartW - padding.left - padding.right;
  const plotH = chartH - padding.top - padding.bottom;

  // Map data to SVG coords
  const xStep = plotW / (projections.length - 1);
  const points = projections.map((p, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + plotH - (p.arr / maxARR) * plotH,
    arr: p.arr,
    mrr: p.mrr,
    month: p.month,
    newClients: p.newClients,
  }));

  // Line path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + plotH} L ${points[0].x} ${padding.top + plotH} Z`;

  // MRR line
  const maxMRR = Math.max(...projections.map((p) => p.mrr));
  const mrrPoints = projections.map((p, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + plotH - (p.mrr / maxMRR) * plotH,
  }));
  const mrrPath = mrrPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Donut chart for verticals
  const donutR = 60;
  const donutStroke = 20;
  const circumference = 2 * Math.PI * donutR;
  let cumulativeOffset = 0;
  const donutSegments = verticals.filter((v) => v.arr > 0).map((v) => {
    const fraction = totalARR > 0 ? v.arr / totalARR : 0;
    const dashLength = fraction * circumference;
    const seg = {
      color: v.color,
      name: v.name,
      arr: v.arr,
      fraction,
      dashLength,
      dashOffset: cumulativeOffset,
    };
    cumulativeOffset += dashLength;
    return seg;
  });

  return (
    <div className="space-y-6">
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Revenue Intelligence
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Revenue Dashboard
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
          ARR trajectory, MRR growth, churn, and cash flow projection toward $10M ARR.
        </p>
      </motion.section>

      {/* KPI Cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Current MRR", value: formatCurrency(kpis.currentMRR), sub: `${kpis.activeClients} active clients`, icon: <DollarSign size={16} />, accent: "var(--gold)" },
            { label: "Current ARR", value: formatCurrency(kpis.currentARR), sub: "annualized", icon: <TrendingUp size={16} />, accent: "var(--emerald)" },
            { label: "ARR Gap", value: formatCurrency(kpis.arrGap), sub: `to ${formatCurrency(kpis.targetARR)}`, icon: <Target size={16} />, accent: "var(--plum)" },
            { label: "Pipeline Value", value: formatCurrency(kpis.pipelineValue), sub: `${kpis.pipelineCount} deals weighted`, icon: <Activity size={16} />, accent: "#22d3ee" },
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

      {/* ARR Trajectory SVG Chart */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>I.</span> ARR + MRR Trajectory
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = padding.top + plotH - frac * plotH;
              const val = (frac * maxARR);
              return (
                <g key={frac}>
                  <line x1={padding.left} y1={y} x2={chartW - padding.right} y2={y} stroke="var(--line-soft)" strokeWidth="0.5" />
                  <text x={padding.left - 5} y={y + 3} textAnchor="end" fontSize="9" fill="var(--cream-mute)" fontFamily="JetBrains Mono">
                    {formatCurrency(val)}
                  </text>
                </g>
              );
            })}
            {/* Area under ARR line */}
            <path d={areaPath} fill="var(--gold)" opacity={0.1} />
            {/* ARR line */}
            <path d={linePath} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {/* MRR line (dashed) */}
            <path d={mrrPath} fill="none" stroke="var(--emerald)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" />
            {/* Data points + labels */}
            {points.map((p) => (
              <g key={p.month}>
                <circle cx={p.x} cy={p.y} r="4" fill="var(--gold)" />
                <circle cx={p.x} cy={p.y} r="2" fill="var(--bg-deep)" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="8" fill="var(--cream-dim)" fontFamily="JetBrains Mono">
                  {formatCurrency(p.arr)}
                </text>
                <text x={p.x} y={chartH - 8} textAnchor="middle" fontSize="8" fill="var(--cream-mute)" fontFamily="Manrope">
                  {p.month}
                </text>
              </g>
            ))}
            {/* Legend */}
            <g transform={`translate(${chartW - 120}, ${padding.top})`}>
              <line x1="0" y1="0" x2="20" y2="0" stroke="var(--gold)" strokeWidth="2.5" />
              <text x="25" y="3" fontSize="9" fill="var(--cream-dim)" fontFamily="Manrope">ARR</text>
              <line x1="50" y1="0" x2="70" y2="0" stroke="var(--emerald)" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="75" y="3" fontSize="9" fill="var(--cream-dim)" fontFamily="Manrope">MRR</text>
            </g>
          </svg>
        </div>
      </motion.section>

      {/* Revenue by Vertical (Donut) + Tier Breakdown */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Donut Chart */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>II.</span> Revenue by Vertical
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center justify-center gap-6">
                <svg viewBox="0 0 160 160" width="160" height="160">
                  <circle cx="80" cy="80" r={donutR} fill="none" stroke="var(--bg-mid)" strokeWidth={donutStroke} />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.name}
                      cx="80" cy="80" r={donutR}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={donutStroke}
                      strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                      strokeDashoffset={-seg.dashOffset}
                      transform="rotate(-90 80 80)"
                    />
                  ))}
                  <text x="80" y="76" textAnchor="middle" fontSize="14" fill="var(--gold)" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="600">
                    {formatCurrency(totalARR)}
                  </text>
                  <text x="80" y="92" textAnchor="middle" fontSize="8" fill="var(--cream-mute)" fontFamily="Manrope">Total ARR</text>
                </svg>
                <div className="space-y-1.5">
                  {donutSegments.filter((s) => s.arr > 0).map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-[12px]">
                      <div className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
                      <span style={{ color: "var(--cream-dim)" }}>{s.name}</span>
                      <span className="font-semibold" style={{ color: "var(--cream)" }}>{formatCurrency(s.arr)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tier Breakdown */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>III.</span> Revenue by Service Tier
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="space-y-2">
              {tiers.map((t) => {
                const tierTotal = tiers.reduce((s, x) => s + x.arr, 0);
                const pct = tierTotal > 0 ? (t.arr / tierTotal) * 100 : 0;
                return (
                  <div key={t.tier} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                        <span className="text-[14px] font-medium" style={{ color: "var(--cream)" }}>{t.name}</span>
                        <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>· {t.clientCount} clients</span>
                      </div>
                      <span className="text-[14px] font-semibold" style={{ color: t.color }}>{formatCurrency(t.arr)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: t.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Client Growth Projection */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>IV.</span> Client Growth + Churn Projection
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="space-y-2">
            {projections.map((p) => {
              const maxClients = Math.max(...projections.map((x) => x.newClients));
              const newBarWidth = (p.newClients / maxClients) * 100;
              return (
                <div key={p.month} className="flex items-center gap-3">
                  <div className="w-16 text-[11px]" style={{ color: "var(--cream-mute)" }}>{p.month}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${newBarWidth}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="h-full rounded-md flex items-center px-2"
                        style={{ background: "var(--emerald)", minWidth: "30px" }}
                      >
                        <span className="text-[10px] font-medium" style={{ color: "var(--bg-deep)" }}>+{p.newClients}</span>
                      </motion.div>
                    </div>
                    <span className="text-[10px]" style={{ color: "#ef4444" }}>-{p.churnedClients}</span>
                  </div>
                  <div className="w-20 text-[11px] text-right" style={{ color: "var(--gold)" }}>{formatCurrency(p.arr)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </div>
  );
}