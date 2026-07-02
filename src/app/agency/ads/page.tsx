"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, DollarSign, MousePointer, Target, Zap,
  AlertTriangle, Award, Pause, Play, FileText, Image,
  Video, Layers, BarChart3, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const platformColors: Record<string, string> = {
  google: "#4285f4",
  meta: "#1877f2",
  linkedin: "#0a66c2",
};

const platformLabels: Record<string, string> = {
  google: "Google Ads",
  meta: "Meta (FB/IG)",
  linkedin: "LinkedIn",
};

const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: "var(--emerald)", bg: "rgba(90,184,150,0.12)", label: "Active" },
  paused: { color: "var(--gold)", bg: "rgba(212,165,116,0.12)", label: "Paused" },
  draft: { color: "var(--cream-dim)", bg: "rgba(165,151,131,0.12)", label: "Draft" },
  ended: { color: "var(--plum)", bg: "rgba(196,96,126,0.12)", label: "Ended" },
  underperforming: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Underperforming" },
};

const creativeTypeIcons: Record<string, React.ReactNode> = {
  image: <Image size={14} />,
  video: <Video size={14} />,
  carousel: <Layers size={14} />,
  text: <FileText size={14} />,
};

export default function AdsDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"overview" | "campaigns" | "creatives">("overview");

  useEffect(() => {
    fetch("/api/agency/ads")
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-deep)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--cream-dim)", fontSize: 14 }}>Loading ads performance…</div>
      </div>
    );
  }

  const k = data.kpis;
  const spendTrend = k.totalSpendMTD > k.totalSpendPrev
    ? ((k.totalSpendMTD - k.totalSpendPrev) / k.totalSpendPrev) * 100
    : -((k.totalSpendPrev - k.totalSpendMTD) / k.totalSpendPrev) * 100;

  // Weekly chart SVG
  const chartW = 560;
  const chartH = 200;
  const padding = { top: 16, right: 16, bottom: 28, left: 48 };
  const plotW = chartW - padding.left - padding.right;
  const plotH = chartH - padding.top - padding.bottom;
  const wp = data.weeklyPerformance;
  const maxRevenue = Math.max(...wp.map((w: any) => w.revenue), 1);
  const maxSpend = Math.max(...wp.map((w: any) => w.spend), 1);
  const xStep = plotW / (wp.length - 1);

  const revPoints = wp.map((w: any, i: number) => ({
    x: padding.left + i * xStep,
    y: padding.top + plotH - (w.revenue / maxRevenue) * plotH,
  }));
  const revPath = revPoints.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const spendPoints = wp.map((w: any, i: number) => ({
    x: padding.left + i * xStep,
    y: padding.top + plotH - (w.spend / maxSpend) * plotH,
  }));
  const spendPath = spendPoints.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const roasTrend = wp.map((w: any, i: number) => ({
    x: padding.left + i * xStep,
    y: padding.top + plotH - (w.roas / Math.max(...wp.map((ww: any) => ww.roas))) * plotH,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)", padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <BarChart3 size={20} style={{ color: "var(--gold)" }} />
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "var(--cream-mute)", fontWeight: 600 }}>
            Advertising
          </span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 500, color: "var(--cream)", fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.02em" }}>
          Ads Performance Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "var(--cream-dim)", marginTop: 6 }}>
          {k.activeCampaigns} active campaigns across 3 platforms · {formatCurrency(k.totalSpendMTD)} spend MTD · {k.blendedROAS.toFixed(1)}x blended ROAS
        </p>
      </motion.div>

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, marginTop: 16, background: "var(--bg-card)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {(["overview", "campaigns", "creatives"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, textTransform: "capitalize",
              background: tab === t ? "var(--bg-elev)" : "transparent",
              color: tab === t ? "var(--gold)" : "var(--cream-dim)",
              transition: "all 0.2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          {/* KPI Cards */}
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Spend MTD", value: formatCurrency(k.totalSpendMTD), sub: `${spendTrend >= 0 ? "+" : ""}${spendTrend.toFixed(1)}% vs prev`, icon: <DollarSign size={16} />, accent: "var(--gold)", trend: spendTrend >= 0 },
                { label: "Revenue (Attributed)", value: formatCurrency(k.totalRevenue), sub: `${k.blendedROAS.toFixed(1)}x ROAS`, icon: <TrendingUp size={16} />, accent: "var(--emerald)", trend: true },
                { label: "Conversions", value: formatNumber(k.totalConversions), sub: `${formatCurrency(k.avgCPL)} avg CPL`, icon: <Target size={16} />, accent: "var(--plum)", trend: true },
                { label: "Clicks", value: formatNumber(k.totalClicks), sub: `${k.avgCTR.toFixed(2)}% CTR`, icon: <MousePointer size={16} />, accent: "#22d3ee", trend: true },
                { label: "Avg CPC", value: formatCurrency(k.avgCPC), sub: `${formatNumber(k.totalImpressions)} impressions`, icon: <Zap size={16} />, accent: "var(--rust)", trend: false },
                { label: "Budget Used", value: `${k.budgetUtilization.toFixed(0)}%`, sub: `${formatCurrency(k.totalBudget)} total budget`, icon: <BarChart3 size={16} />, accent: "var(--gold)", trend: true },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  style={{
                    background: "var(--bg-card)", borderRadius: 14, padding: 16,
                    border: "1px solid var(--line-soft)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ color: card.accent }}>{card.icon}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
                      color: card.trend ? "var(--emerald)" : "var(--plum)",
                    }}>
                      {card.trend ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    </span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--cream)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 2 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cream-mute)", fontWeight: 600 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--cream-dim)", marginTop: 4 }}>
                    {card.sub}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Revenue vs Spend Chart + ROAS */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
            <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}
              style={{ background: "var(--bg-card)", borderRadius: 16, padding: 20, border: "1px solid var(--line-soft)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)", marginBottom: 4 }}>Revenue vs Spend (8 Weeks)</h3>
              <p style={{ fontSize: 11, color: "var(--cream-mute)", marginBottom: 12 }}>Revenue trending up, spend efficiency improving</p>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: "auto" }}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                  <line key={i} x1={padding.left} x2={chartW - padding.right}
                    y1={padding.top + plotH * f} y2={padding.top + plotH * f}
                    stroke="var(--line-deep)" strokeWidth={1} />
                ))}
                {/* Revenue line */}
                <path d={revPath} fill="none" stroke="var(--emerald)" strokeWidth={2.5} />
                {/* Spend line */}
                <path d={spendPath} fill="none" stroke="var(--gold)" strokeWidth={2.5} strokeDasharray="4 3" />
                {/* ROAS dots */}
                {roasTrend.map((p: any, i: number) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--plum)" opacity={0.6} />
                ))}
                {/* X labels */}
                {wp.map((w: any, i: number) => (
                  <text key={i} x={padding.left + i * xStep} y={chartH - 8}
                    fill="var(--cream-mute)" fontSize={9} textAnchor="middle">{w.week}</text>
                ))}
              </svg>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "var(--emerald)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 2, background: "var(--emerald)", borderRadius: 2 }} /> Revenue
                </span>
                <span style={{ fontSize: 11, color: "var(--gold)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 2, background: "var(--gold)", borderRadius: 2, opacity: 0.6 }} /> Spend
                </span>
                <span style={{ fontSize: 11, color: "var(--plum)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, background: "var(--plum)", borderRadius: "50%" }} /> ROAS
                </span>
              </div>
            </motion.div>

            {/* Platform Breakdown */}
            <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}
              style={{ background: "var(--bg-card)", borderRadius: 16, padding: 20, border: "1px solid var(--line-soft)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)", marginBottom: 16 }}>By Platform</h3>
              {data.platforms.map((p: any) => {
                const roas = p.spendMTD > 0 ? p.revenue / p.spendMTD : 0;
                const pct = k.totalSpendMTD > 0 ? (p.spendMTD / k.totalSpendMTD) * 100 : 0;
                return (
                  <div key={p.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--cream)", fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>{roas.toFixed(1)}x</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--cream-dim)", marginBottom: 4 }}>
                      <span>Spend: {formatCurrency(p.spendMTD)}</span>
                      <span>Rev: {formatCurrency(p.revenue)}</span>
                    </div>
                    <div style={{ height: 6, background: "var(--bg-deep)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: p.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--cream-mute)", marginTop: 3 }}>
                      {pct.toFixed(0)}% of total · {p.conversions} conversions
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Top Creatives + Underperforming */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Top Performers */}
            <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}
              style={{ background: "var(--bg-card)", borderRadius: 16, padding: 20, border: "1px solid var(--line-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Award size={16} style={{ color: "var(--gold)" }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)" }}>Top Performing Creatives</h3>
              </div>
              {data.topCreatives.map((c: any, i: number) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? "1px solid var(--line-deep)" : "none" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    background: c.performanceScore >= 85 ? "rgba(212,165,116,0.15)" : "rgba(90,184,150,0.15)",
                    color: c.performanceScore >= 85 ? "var(--gold)" : "var(--emerald)", fontWeight: 700, fontSize: 12,
                  }}>
                    {c.performanceScore}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--cream)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.headline}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--cream-mute)" }}>
                      {c.campaignName} · {c.ctr.toFixed(1)}% CTR · {c.conversions} conv
                    </div>
                  </div>
                  <div style={{ color: "var(--cream-dim)" }}>{creativeTypeIcons[c.type]}</div>
                </div>
              ))}
            </motion.div>

            {/* Needs Attention */}
            <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}
              style={{ background: "var(--bg-card)", borderRadius: 16, padding: 20, border: "1px solid var(--line-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <AlertTriangle size={16} style={{ color: "#ef4444" }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)" }}>Needs Attention</h3>
              </div>
              {data.underperformingCreatives.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--cream-dim)", padding: 20, textAlign: "center" }}>
                  All creatives performing well ✅
                </div>
              ) : data.underperformingCreatives.map((c: any, i: number) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? "1px solid var(--line-deep)" : "none" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(239,68,68,0.12)", color: "#ef4444", fontWeight: 700, fontSize: 12,
                  }}>
                    {c.performanceScore}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--cream)", fontWeight: 600 }}>
                      {c.headline}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--cream-mute)" }}>
                      {c.campaignName} · {c.ctr.toFixed(1)}% CTR · {formatCurrency(c.spend)} spent
                    </div>
                  </div>
                  <span style={{
                    fontSize: 9, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
                    color: "#ef4444", background: "rgba(239,68,68,0.12)",
                  }}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </>
      )}

      {/* ── CAMPAIGNS TAB ────────────────────────────────────────── */}
      {tab === "campaigns" && (
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.campaigns.map((c: any) => {
              const st = statusStyles[c.status] || statusStyles.active;
              const budgetPct = c.budget > 0 ? (c.spend / c.budget) * 100 : 0;
              return (
                <div key={c.id} style={{
                  background: "var(--bg-card)", borderRadius: 14, padding: 18,
                  border: "1px solid var(--line-soft)", display: "grid",
                  gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center",
                }}>
                  {/* Platform dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: platformColors[c.platform], flexShrink: 0,
                  }} />

                  {/* Campaign details */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)" }}>{c.name}</span>
                      <span style={{
                        fontSize: 9, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
                        color: st.color, background: st.bg, textTransform: "uppercase",
                      }}>
                        {st.label}
                      </span>
                      <span style={{
                        fontSize: 9, padding: "2px 8px", borderRadius: 4, fontWeight: 500,
                        color: "var(--cream-mute)", background: "var(--bg-deep)", textTransform: "capitalize",
                      }}>
                        {c.objective}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--cream-dim)", marginBottom: 8 }}>{c.audience}</div>
                    <div style={{ display: "flex", gap: 20, fontSize: 11 }}>
                      <span><span style={{ color: "var(--cream-mute)" }}>Spend:</span> <span style={{ color: "var(--gold)", fontWeight: 600 }}>{formatCurrency(c.spend)}</span></span>
                      <span><span style={{ color: "var(--cream-mute)" }}>Revenue:</span> <span style={{ color: "var(--emerald)", fontWeight: 600 }}>{formatCurrency(c.revenue)}</span></span>
                      <span><span style={{ color: "var(--cream-mute)" }}>ROAS:</span> <span style={{ color: c.roas >= 7 ? "var(--emerald)" : c.roas >= 4 ? "var(--gold)" : "#ef4444", fontWeight: 700 }}>{c.roas.toFixed(1)}x</span></span>
                      <span><span style={{ color: "var(--cream-mute)" }}>Conv:</span> <span style={{ color: "var(--cream)" }}>{c.conversions}</span></span>
                      <span><span style={{ color: "var(--cream-mute)" }}>CTR:</span> <span style={{ color: "var(--cream)" }}>{c.ctr.toFixed(2)}%</span></span>
                      <span><span style={{ color: "var(--cream-mute)" }}>CPC:</span> <span style={{ color: "var(--cream)" }}>{formatCurrency(c.cpc)}</span></span>
                    </div>
                    {/* Budget bar */}
                    {c.budget > 0 && (
                      <div style={{ marginTop: 8, height: 4, background: "var(--bg-deep)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${Math.min(budgetPct, 100)}%`, borderRadius: 2,
                          background: budgetPct > 90 ? "#ef4444" : budgetPct > 70 ? "var(--gold)" : "var(--emerald)",
                        }} />
                      </div>
                    )}
                  </div>

                  {/* ROAS ring */}
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    background: `conic-gradient(${c.roas >= 7 ? "var(--emerald)" : c.roas >= 4 ? "var(--gold)" : "#ef4444"} ${Math.min(c.roas / 15 * 360, 360)}deg, var(--bg-deep) 0deg)`,
                  }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: "50%", background: "var(--bg-card)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--cream)" }}>{c.roas.toFixed(1)}</span>
                      <span style={{ fontSize: 7, color: "var(--cream-mute)", textTransform: "uppercase" }}>ROAS</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── CREATIVES TAB ────────────────────────────────────────── */}
      {tab === "creatives" && (
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {data.creatives.map((c: any) => {
              const st = statusStyles[c.status] || statusStyles.active;
              return (
                <div key={c.id} style={{
                  background: "var(--bg-card)", borderRadius: 14, padding: 16,
                  border: "1px solid var(--line-soft)",
                }}>
                  {/* Score badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: platformColors[c.platform?.toLowerCase()] || "var(--gold)" }}>{creativeTypeIcons[c.type]}</span>
                      <span style={{ fontSize: 10, color: "var(--cream-mute)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                        {c.type}
                      </span>
                    </div>
                    <div style={{
                      padding: "2px 10px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                      color: c.performanceScore >= 85 ? "var(--gold)" : c.performanceScore >= 70 ? "var(--emerald)" : "#ef4444",
                      background: c.performanceScore >= 85 ? "rgba(212,165,116,0.12)" : c.performanceScore >= 70 ? "rgba(90,184,150,0.12)" : "rgba(239,68,68,0.12)",
                    }}>
                      {c.performanceScore}
                    </div>
                  </div>

                  {/* Headline */}
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--cream)", marginBottom: 6, lineHeight: 1.4 }}>
                    "{c.headline}"
                  </h4>
                  <p style={{ fontSize: 11, color: "var(--cream-dim)", marginBottom: 10, lineHeight: 1.5 }}>
                    {c.body}
                  </p>

                  {/* CTA */}
                  <div style={{
                    display: "inline-block", padding: "4px 12px", borderRadius: 6,
                    fontSize: 11, fontWeight: 600, color: "var(--gold)",
                    border: "1px solid var(--line)", marginBottom: 12,
                  }}>
                    {c.cta}
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10 }}>
                    <div>
                      <span style={{ color: "var(--cream-mute)" }}>Impressions</span>
                      <div style={{ color: "var(--cream)", fontWeight: 600 }}>{formatNumber(c.impressions)}</div>
                    </div>
                    <div>
                      <span style={{ color: "var(--cream-mute)" }}>Clicks</span>
                      <div style={{ color: "var(--cream)", fontWeight: 600 }}>{formatNumber(c.clicks)}</div>
                    </div>
                    <div>
                      <span style={{ color: "var(--cream-mute)" }}>CTR</span>
                      <div style={{ color: "var(--cream)", fontWeight: 600 }}>{c.ctr.toFixed(2)}%</div>
                    </div>
                    <div>
                      <span style={{ color: "var(--cream-mute)" }}>Conversions</span>
                      <div style={{ color: "var(--cream)", fontWeight: 600 }}>{c.conversions}</div>
                    </div>
                    <div>
                      <span style={{ color: "var(--cream-mute)" }}>Spend</span>
                      <div style={{ color: "var(--gold)", fontWeight: 600 }}>{formatCurrency(c.spend)}</div>
                    </div>
                    <div>
                      <span style={{ color: "var(--cream-mute)" }}>Status</span>
                      <div style={{ color: st.color, fontWeight: 600, fontSize: 9, textTransform: "uppercase" }}>{st.label}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
