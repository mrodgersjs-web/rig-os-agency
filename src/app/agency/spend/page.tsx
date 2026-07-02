"use client";

import { motion } from "framer-motion";
import {
  DollarSign, TrendingDown, AlertTriangle, CheckCircle2,
  Loader, ArrowDownRight, PiggyBank, Target, Zap, FileText,
} from "lucide-react";
import {
  getServiceSpends, getOptimizationOpportunities, getSpendByCategory,
  getSpendKPIs, type OptimizationOpportunity,
} from "@/lib/spend-data";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function statusColor(status: string): string {
  switch (status) {
    case "optimized": return "var(--emerald)";
    case "review": return "var(--gold)";
    case "waste": return "#ef4444";
    default: return "var(--cream-dim)";
  }
}

function oppStatusBadge(status: string): { color: string; label: string; icon: React.ReactNode } {
  switch (status) {
    case "identified":
      return { color: "#fbbf24", label: "Identified", icon: <Target size={12} /> };
    case "in_progress":
      return { color: "#22d3ee", label: "In Progress", icon: <Loader size={12} /> };
    case "implemented":
      return { color: "var(--emerald)", label: "Implemented", icon: <CheckCircle2 size={12} /> };
    case "verified":
      return { color: "var(--gold)", label: "Verified", icon: <CheckCircle2 size={12} /> };
    default:
      return { color: "var(--cream-dim)", label: status, icon: <FileText size={12} /> };
  }
}

export default function SpendReductionDashboard() {
  const kpis = getSpendKPIs();
  const services = getServiceSpends();
  const opportunities = getOptimizationOpportunities();
  const categories = getSpendByCategory();

  const maxBudget = Math.max(...categories.map((c) => c.budget), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <PiggyBank size={22} style={{ color: "var(--gold)" }} />
          <span
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
          >
            Financial Operations
          </span>
        </div>
        <h1
          className="text-3xl tracking-tight"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}
        >
          Spend Reduction
        </h1>
        <p className="text-[14px] mt-2" style={{ color: "var(--cream-dim)" }}>
          Service costs, optimization opportunities, and realized savings across RIG OS infrastructure.
        </p>
      </motion.section>

      {/* KPI Cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Monthly Spend",
              value: formatCurrency(kpis.totalMonthlySpend),
              sub: `Projected: ${formatCurrency(kpis.projectedMonthlySpend)}`,
              icon: <DollarSign size={18} />,
              accent: "var(--gold)",
            },
            {
              label: "Annual Savings",
              value: formatCurrency(kpis.totalAnnualSavings),
              sub: "from 7 opportunities",
              icon: <TrendingDown size={18} />,
              accent: "var(--emerald)",
            },
            {
              label: "Realized Monthly",
              value: formatCurrency(kpis.monthlySavings),
              sub: `${(kpis.optimizationRate * 100).toFixed(0)}% of spend`,
              icon: <CheckCircle2 size={18} />,
              accent: "#22d3ee",
            },
            {
              label: "Waste Identified",
              value: `${kpis.wasteCount} services`,
              sub: kpis.wasteCost > 0 ? `${formatCurrency(kpis.wasteCost)}/mo recoverable` : "$0 — clean",
              icon: <AlertTriangle size={18} />,
              accent: "#ef4444",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-4 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--cream-dim)" }}
                >
                  {kpi.label}
                </span>
              </div>
              <div
                className="text-2xl"
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 500,
                  color: kpi.accent,
                }}
              >
                {kpi.value}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--cream-mute)" }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Spend vs Projected + Category Breakdown */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Spend Reduction Bar */}
          <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <h2 className="text-[15px] font-semibold mb-4" style={{ color: "var(--cream)" }}>
              Spend Reduction Target
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>Current Monthly</span>
                  <span className="text-[16px] font-semibold mono" style={{ color: "var(--gold)" }}>
                    {formatCurrency(kpis.totalMonthlySpend)}
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-deep)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--gold), #d4a574)" }}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>Post-Optimization</span>
                  <span className="text-[16px] font-semibold mono" style={{ color: "var(--emerald)" }}>
                    {formatCurrency(kpis.projectedMonthlySpend)}
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-deep)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--emerald), #5ab896)" }}
                    initial={{ width: 0 }}
                    animate={{
                      width: kpis.totalMonthlySpend > 0
                        ? `${(kpis.projectedMonthlySpend / kpis.totalMonthlySpend) * 100}%`
                        : "0%",
                    }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>Projected Reduction</span>
                  <div className="flex items-center gap-1">
                    <ArrowDownRight size={14} style={{ color: "var(--emerald)" }} />
                    <span className="text-[14px] font-semibold mono" style={{ color: "var(--emerald)" }}>
                      {(kpis.projectedReduction * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="rounded-xl p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <h2 className="text-[15px] font-semibold mb-4" style={{ color: "var(--cream)" }}>
              Spend by Category
            </h2>
            <div className="space-y-3">
              {categories.map((cat) => {
                const budgetUsed = maxBudget > 0 ? (cat.thisMonth / cat.budget) * 100 : 0;
                const overBudget = cat.thisMonth > cat.budget;
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] mono" style={{ color: overBudget ? "#ef4444" : "var(--cream)" }}>
                          {formatCurrency(cat.thisMonth)}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                          / {formatCurrency(cat.budget)} budget
                        </span>
                        {cat.trend < 0 ? (
                          <ArrowDownRight size={11} style={{ color: "var(--emerald)" }} />
                        ) : null}
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-deep)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(budgetUsed, 100)}%`,
                          background: overBudget
                            ? "#ef4444"
                            : budgetUsed > 80
                              ? "var(--gold)"
                              : "var(--emerald)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Optimization Opportunities */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <Zap size={16} style={{ color: "var(--gold)" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
            Optimization Opportunities
          </h2>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
          <span className="text-[11px] mono" style={{ color: "var(--cream-mute)" }}>
            {kpis.totalAnnualSavings > 0 ? `${formatCurrency(kpis.totalAnnualSavings)} annual potential` : "—"}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {opportunities.map((opp: OptimizationOpportunity) => {
            const badge = oppStatusBadge(opp.status);
            return (
              <div
                key={opp.id}
                className="rounded-xl p-5 border transition"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] mono px-1.5 py-0.5 rounded"
                        style={{ color: badge.color, background: `${badge.color}15` }}
                      >
                        {opp.id}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ color: badge.color, background: `${badge.color}12` }}
                      >
                        {badge.icon} {badge.label}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
                      {opp.title}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[18px] font-semibold mono" style={{ color: "var(--emerald)" }}>
                      {formatCurrency(opp.monthlySavings)}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>/mo saved</div>
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--cream-dim)" }}>
                  {opp.description}
                </p>
                <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--cream-mute)" }}>
                  <span className="flex items-center gap-1">
                    <span style={{ color: "var(--cream-dim)" }}>Effort:</span>
                    <span style={{ color: opp.effort === "Low" ? "var(--emerald)" : opp.effort === "Medium" ? "var(--gold)" : "#ef4444" }}>
                      {opp.effort}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ color: "var(--cream-dim)" }}>Risk:</span>
                    <span style={{ color: opp.risk === "Low" ? "var(--emerald)" : opp.risk === "Medium" ? "var(--gold)" : "#ef4444" }}>
                      {opp.risk}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ color: "var(--cream-dim)" }}>Annual:</span>
                    <span className="mono" style={{ color: "var(--gold)" }}>
                      {opp.annualSavings > 0 ? formatCurrency(opp.annualSavings) : "—"}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Service Cost Table */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <DollarSign size={16} style={{ color: "var(--gold)" }} />
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
            Service Cost Audit
          </h2>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <th className="text-left px-4 py-3 font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--cream-mute)" }}>Service</th>
                  <th className="text-left px-4 py-3 font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--cream-mute)" }}>Category</th>
                  <th className="text-right px-4 py-3 font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--cream-mute)" }}>Monthly</th>
                  <th className="text-right px-4 py-3 font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--cream-mute)" }}>Projected</th>
                  <th className="text-right px-4 py-3 font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--cream-mute)" }}>Utilization</th>
                  <th className="text-left px-4 py-3 font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--cream-mute)" }}>Status</th>
                  <th className="text-left px-4 py-3 font-medium uppercase tracking-wider text-[10px]" style={{ color: "var(--cream-mute)" }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc, i) => (
                  <tr key={svc.service} style={{ borderBottom: i < services.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--cream)" }}>{svc.service}</td>
                    <td className="px-4 py-3" style={{ color: "var(--cream-dim)" }}>{svc.category}</td>
                    <td className="px-4 py-3 text-right mono" style={{ color: "var(--cream)" }}>
                      {svc.monthlyCost > 0 ? formatCurrency(svc.monthlyCost) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right mono" style={{ color: "var(--emerald)" }}>
                      {svc.projectedCost < svc.monthlyCost ? formatCurrency(svc.projectedCost) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-deep)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${svc.utilization * 100}%`,
                              background: svc.utilization < 0.3 ? "#ef4444" : svc.utilization < 0.6 ? "var(--gold)" : "var(--emerald)",
                            }}
                          />
                        </div>
                        <span className="mono text-[10px]" style={{ color: "var(--cream-mute)" }}>
                          {(svc.utilization * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider"
                        style={{ color: statusColor(svc.status), background: `${statusColor(svc.status)}15` }}
                      >
                        {svc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] max-w-[200px] truncate" style={{ color: "var(--cream-mute)" }} title={svc.notes}>
                      {svc.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--line-soft)" }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--cream)" }}>Total</td>
                  <td></td>
                  <td className="px-4 py-3 text-right mono font-semibold" style={{ color: "var(--gold)" }}>
                    {formatCurrency(kpis.totalMonthlySpend)}
                  </td>
                  <td className="px-4 py-3 text-right mono font-semibold" style={{ color: "var(--emerald)" }}>
                    {formatCurrency(kpis.projectedMonthlySpend)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </motion.section>

      {/* Savings Summary */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div
          className="rounded-xl p-6 border"
          style={{
            background: "linear-gradient(135deg, rgba(90, 184, 150, 0.08), rgba(212, 165, 116, 0.05))",
            borderColor: "var(--line-soft)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>
                Identified (Pending)
              </div>
              <div className="text-3xl font-semibold mono" style={{ color: "var(--gold)" }}>
                {formatCurrency(kpis.identifiedSavings)}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--cream-mute)" }}>per month — not yet actioned</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>
                Realized Savings
              </div>
              <div className="text-3xl font-semibold mono" style={{ color: "var(--emerald)" }}>
                {formatCurrency(kpis.monthlySavings)}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--cream-mute)" }}>per month — implemented & verified</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>
                Total Annual Run Rate
              </div>
              <div className="text-3xl font-semibold mono" style={{ color: "var(--cream)" }}>
                {formatCurrency(kpis.totalAnnualSavings)}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--cream-mute)" }}>if all opportunities realized</div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
