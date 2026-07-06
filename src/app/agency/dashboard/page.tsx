"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Mail, TrendingUp, Activity, Database, ArrowRight, Zap,
  DollarSign, Target, Briefcase, Building2, FileText, Calendar,
  AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
  Sparkles, Bot, BarChart3, PieChart as PieChartIcon, RefreshCw,
} from "lucide-react";

const C = {
  bg: "var(--rig-bg)", card: "var(--rig-card)", text: "var(--rig-text)",
  text2: "var(--rig-text-2)", text3: "var(--rig-text-3)", mute: "var(--rig-text-mute)",
  border: "var(--rig-border)", borderSoft: "var(--rig-border-soft)",
  hover: "var(--rig-hover)", active: "var(--rig-active)",
  gold: "var(--rig-gold)", goldSoft: "var(--rig-gold-soft)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)",
  blue: "var(--rig-blue)", blueBg: "var(--rig-blue-bg)",
  plum: "var(--rig-plum)", plumBg: "var(--rig-plum-bg)",
  red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
  orange: "var(--rig-orange)", orangeBg: "var(--rig-orange-bg)",
  purple: "var(--rig-purple)", purpleBg: "var(--rig-purple-bg)",
};

interface DashboardData {
  realMetrics?: {
    prospects: number; emailsSent: number; revenue: number;
    revenueLabel: string; source: string; stripeEnabled: boolean;
  };
  sampleData?: {
    label: string; kpis: any; clients: any[]; pipeline: any[];
  };
  verticals?: Array<{ id: string; name: string; targetARR: number; clientCount: number; avgDealSize: number; color: string; icon: string }>;
  serviceTiers?: Array<{ id: string; name: string; monthlyFee: number; annualFee: number; color: string }>;
  revenueByVertical?: Array<{ vertical: string; name: string; arr: number; clientCount: number; color: string }>;
  revenueByTier?: Array<{ tier: string; name: string; arr: number; clientCount: number; color: string }>;
  kpis?: any;
}

function fmtMoney(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

export default function AgencyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/dashboard");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
      setLastFetch(new Date());
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, []);

  const real = data?.realMetrics;
  const sample = data?.sampleData;
  const kpis = data?.kpis || sample?.kpis || {};
  const pipelineValue = (kpis.pipelineValue || 0) / 100;
  const activeClients = kpis.activeClients || 0;
  const totalClients = kpis.clients || 0;

  // Compute weighted forecast
  const weightedForecast = useMemo(() => {
    if (!sample?.pipeline) return 0;
    return sample.pipeline.reduce((sum: number, d: any) => {
      return sum + (d.amount || 0) * (d.probability || 0) / 100;
    }, 0);
  }, [sample?.pipeline]);

  const stageBreakdown = useMemo(() => {
    if (!sample?.pipeline) return [];
    const stageOrder = ["discovery", "qualification", "proposal", "negotiation", "won"];
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const d of sample.pipeline) {
      const s = d.stage || "discovery";
      if (!byStage[s]) byStage[s] = { count: 0, value: 0 };
      byStage[s].count++;
      byStage[s].value += (d.amount || 0);
    }
    return stageOrder.map((s) => ({
      stage: s,
      count: byStage[s]?.count || 0,
      value: byStage[s]?.value || 0,
    }));
  }, [sample?.pipeline]);

  const revenueByVertical = data?.revenueByVertical || [];
  const revenueByTier = data?.revenueByTier || [];
  const totalARR = revenueByVertical.reduce((sum, v) => sum + (v.arr || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: C.text }}>
            <Zap size={28} color={C.gold} />
            Agency Intelligence Hub
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition hover:bg-black/[0.02] disabled:opacity-50"
              style={{ borderColor: C.border, color: C.text2, background: C.card }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              {loading ? "Loading…" : "Refresh"}
            </button>
            <span className="text-[11px]" style={{ color: C.mute }}>
              {lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : "—"}
            </span>
          </div>
        </div>
        <p style={{ color: C.text2 }} className="text-[14px]">
          Real GTM Studio V2 outbound data + seeded agency metrics. Live source: <code style={{ background: C.hover, padding: "1px 6px", borderRadius: 3, fontSize: 11 }}>rig-gtm-studio-v2/</code>
        </p>
      </motion.div>

      {error && (
        <div className="rounded-lg p-4 mb-6 border flex items-center gap-2" style={{ borderColor: C.red, background: C.redBg, color: C.red }}>
          <AlertCircle size={14} />
          <span className="text-[13px]">Failed to load dashboard: {error}</span>
        </div>
      )}

      {/* Hero KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Real Prospects",
            value: fmtNum(real?.prospects || 0),
            sub: "GTM Studio V2 clients/",
            icon: Users, color: C.emerald, bg: C.emeraldBg,
            href: "/agency/recall",
          },
          {
            label: "Emails Sent",
            value: fmtNum(real?.emailsSent || 0),
            sub: "Resend manifests",
            icon: Mail, color: C.blue, bg: C.blueBg,
            href: "/agency/email-tracking",
          },
          {
            label: "Active Clients",
            value: fmtNum(activeClients),
            sub: `${totalClients} total in roster`,
            icon: Briefcase, color: C.gold, bg: C.goldBg,
            href: "/agency/clients",
          },
          {
            label: "Pipeline Value",
            value: fmtMoney((kpis.pipelineValue || 0)),
            sub: `${kpis.pipelineCount || 0} deals`,
            icon: Target, color: C.plum, bg: C.plumBg,
            href: "/agency/pipeline-kanban",
          },
        ].map((card, i) => (
          <motion.a
            key={card.label}
            href={card.href}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="block rounded-xl p-4 border transition hover:shadow-md cursor-pointer"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>{card.label}</span>
              <div className="grid place-items-center w-7 h-7 rounded-md" style={{ background: card.bg }}>
                <card.icon size={14} style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-[24px] font-bold mb-0.5" style={{ color: card.color }}>{card.value}</div>
            <div className="text-[10px]" style={{ color: C.mute }}>{card.sub}</div>
          </motion.a>
        ))}
      </div>

      {/* Second tier: Revenue / Forecast / Contracts / Invoices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.mute }}>Annual Recurring Revenue</div>
          <div className="text-[22px] font-bold mb-1" style={{ color: C.gold }}>{fmtMoney(totalARR)}</div>
          <div className="text-[10px]" style={{ color: C.mute }}>Sum of all revenue by vertical</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.mute }}>Weighted Forecast</div>
          <div className="text-[22px] font-bold mb-1" style={{ color: C.emerald }}>{fmtMoney(weightedForecast)}</div>
          <div className="text-[10px]" style={{ color: C.mute }}>Probability-adjusted pipeline</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.mute }}>Active Contracts</div>
          <div className="text-[22px] font-bold mb-1" style={{ color: C.blue }}>{kpis.activeContracts || 0}</div>
          <div className="text-[10px]" style={{ color: C.mute }}>{kpis.contracts || 0} signed total</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.mute }}>Outstanding Invoices</div>
          <div className="text-[22px] font-bold mb-1" style={{ color: C.red }}>{fmtMoney(kpis.outstanding || 0)}</div>
          <div className="text-[10px]" style={{ color: C.mute }}>{kpis.invoices || 0} invoices issued</div>
        </div>
      </div>

      {/* Pipeline Funnel + Revenue by Vertical */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 rounded-xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: C.text }}>
              <BarChart3 size={14} color={C.gold} /> Pipeline Stages
            </h2>
            <a href="/agency/pipeline-kanban" className="text-[11px] flex items-center gap-0.5" style={{ color: C.gold }}>
              Open kanban <ArrowRight size={11} />
            </a>
          </div>
          <div className="space-y-2.5">
            {stageBreakdown.map((s, i) => {
              const maxValue = Math.max(...stageBreakdown.map(x => x.value), 1);
              const pct = (s.value / maxValue) * 100;
              const stageColors: Record<string, string> = {
                discovery: C.blue, qualification: C.purple, proposal: C.gold,
                negotiation: C.orange, won: C.emerald,
              };
              return (
                <div key={s.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] capitalize font-medium" style={{ color: C.text2 }}>{s.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: C.mute }}>{s.count} deals</span>
                      <span className="text-[11px] font-semibold tabular-nums" style={{ color: C.text }}>{fmtMoney(s.value)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: C.hover }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
                      className="h-full rounded-full"
                      style={{ background: stageColors[s.stage] || C.gold }}
                    />
                  </div>
                </div>
              );
            })}
            {stageBreakdown.length === 0 && (
              <div className="text-center py-6 text-[12px]" style={{ color: C.mute }}>No active pipeline deals</div>
            )}
          </div>
        </div>

        <div className="rounded-xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: C.text }}>
              <PieChartIcon size={14} color={C.emerald} /> Revenue by Vertical
            </h2>
            <a href="/agency/clients" className="text-[11px] flex items-center gap-0.5" style={{ color: C.gold }}>
              Clients <ArrowRight size={11} />
            </a>
          </div>
          <div className="space-y-1.5">
            {revenueByVertical
              .filter(v => v.arr > 0)
              .sort((a, b) => b.arr - a.arr)
              .map((v) => {
                const pct = totalARR > 0 ? (v.arr / totalARR) * 100 : 0;
                return (
                  <div key={v.vertical} className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: v.color }} />
                    <span className="text-[12px] flex-1 truncate" style={{ color: C.text2 }}>{v.name}</span>
                    <span className="text-[11px] tabular-nums" style={{ color: C.mute }}>{fmtMoney(v.arr)}</span>
                    <span className="text-[10px] tabular-nums w-10 text-right" style={{ color: C.mute }}>{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            {revenueByVertical.filter(v => v.arr > 0).length === 0 && (
              <div className="text-center py-4 text-[12px]" style={{ color: C.mute }}>No revenue yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Service Tiers + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="rounded-xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
          <h2 className="text-[15px] font-semibold mb-4 flex items-center gap-2" style={{ color: C.text }}>
            <Sparkles size={14} color={C.plum} /> Service Tiers
          </h2>
          <div className="space-y-2">
            {(data?.serviceTiers || []).map((tier) => {
              const tierRev = revenueByTier.find(r => r.tier === tier.id);
              return (
                <div
                  key={tier.id}
                  className="rounded-lg p-2.5 border flex items-center gap-2.5"
                  style={{ borderColor: C.borderSoft, background: C.hover }}
                >
                  <div className="w-1 h-8 rounded-full" style={{ background: tier.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold" style={{ color: C.text }}>{tier.name}</span>
                      <span className="text-[11px] tabular-nums" style={{ color: C.text2 }}>${(tier.monthlyFee / 100).toFixed(0)}/mo</span>
                    </div>
                    <div className="text-[10px]" style={{ color: C.mute }}>
                      {tierRev?.clientCount || 0} clients · {fmtMoney(tierRev?.arr || 0)} ARR
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: C.text }}>
              <Users size={14} color={C.blue} /> Top Clients
            </h2>
            <a href="/agency/clients" className="text-[11px] flex items-center gap-0.5" style={{ color: C.gold }}>
              All clients <ArrowRight size={11} />
            </a>
          </div>
          <div className="space-y-1.5">
            {(sample?.clients || []).slice(0, 6).map((c: any) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-black/[0.02]"
                style={{ borderBottom: `1px solid ${C.borderSoft}` }}
              >
                <div
                  className="w-7 h-7 rounded-md grid place-items-center text-[10px] font-bold shrink-0"
                  style={{
                    background: c.status === "client" ? C.emeraldBg : c.status === "prospect" ? C.goldBg : C.blueBg,
                    color: c.status === "client" ? C.emerald : c.status === "prospect" ? C.gold : C.blue,
                  }}
                >
                  {c.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate" style={{ color: C.text }}>{c.name}</div>
                  <div className="text-[10px] truncate" style={{ color: C.mute }}>{c.notes?.split(" • ")[0]}</div>
                </div>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded shrink-0 capitalize"
                  style={{
                    background: c.status === "client" ? C.emeraldBg : c.status === "prospect" ? C.goldBg : C.blueBg,
                    color: c.status === "client" ? C.emerald : c.status === "prospect" ? C.gold : C.blue,
                  }}
                >
                  {c.status}
                </span>
              </div>
            ))}
            {(!sample?.clients || sample.clients.length === 0) && (
              <div className="text-center py-6 text-[12px]" style={{ color: C.mute }}>No clients</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
        <h2 className="text-[15px] font-semibold mb-4 flex items-center gap-2" style={{ color: C.text }}>
          <Zap size={14} color={C.gold} /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { label: "Proposals", href: "/agency/proposals", icon: FileText, color: C.gold, bg: C.goldBg },
            { label: "Pipeline", href: "/agency/pipeline-kanban", icon: Target, color: C.emerald, bg: C.emeraldBg },
            { label: "Invoices", href: "/agency/invoices", icon: DollarSign, color: C.blue, bg: C.blueBg },
            { label: "Contracts", href: "/agency/contracts", icon: Briefcase, color: C.plum, bg: C.plumBg },
            { label: "Email Track", href: "/agency/email-tracking", icon: Mail, color: C.purple, bg: C.purpleBg },
            { label: "Health", href: "/agency/health", icon: Activity, color: C.orange, bg: C.orangeBg },
          ].map((a) => (
            <a
              key={a.label}
              href={a.href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border transition hover:shadow-sm"
              style={{ borderColor: C.border, background: C.bg }}
            >
              <div className="grid place-items-center w-7 h-7 rounded-md" style={{ background: a.bg }}>
                <a.icon size={13} style={{ color: a.color }} />
              </div>
              <span className="text-[12px] font-medium" style={{ color: C.text }}>{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}