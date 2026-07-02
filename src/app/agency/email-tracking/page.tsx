"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Mail, Send, Inbox, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, XCircle, Clock, Target, Zap, Flame,
  MailCheck, Reply, Calendar, Activity, BarChart3, Gauge,
  ArrowRight, ArrowUpRight, Eye, MousePointer, DollarSign,
  Thermometer, ShieldCheck, Server, Wifi,
} from "lucide-react";
import {
  getOutreachKPIs, getCampaigns, getEmails, getSequences, getContacts,
  type OutreachStatus, type CampaignStatus,
} from "@/lib/outreach-data";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatHours(h: number): string {
  if (h < 24) return `${h.toFixed(0)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

// ─── Deliverability Score Model ──────────────────────────────────────────────
function calcDeliverabilityScore(kpis: ReturnType<typeof getOutreachKPIs>, emails: ReturnType<typeof getEmails>): {
  score: number;
  grade: string;
  color: string;
  factors: { label: string; value: number; weight: number; max: number; status: "good" | "warn" | "bad" }[];
} {
  const bounceRate = kpis.bounceRate;
  const openRate = kpis.openRate;
  const replyRate = kpis.replyRate;
  const unsubRate = kpis.totalSent > 0 ? kpis.totalUnsubscribed / kpis.totalSent : 0;
  const avgOpens = emails.filter(e => e.openCount > 0).reduce((s, e) => s + e.openCount, 0) /
    (emails.filter(e => e.openCount > 0).length || 1);

  const factors = [
    { label: "Bounce Rate", value: bounceRate, weight: 30, max: 0.05, status: bounceRate < 0.03 ? "good" as const : bounceRate < 0.05 ? "warn" as const : "bad" as const },
    { label: "Open Rate", value: openRate, weight: 25, max: 0.6, status: openRate >= 0.5 ? "good" as const : openRate >= 0.3 ? "warn" as const : "bad" as const },
    { label: "Reply Rate", value: replyRate, weight: 20, max: 0.15, status: replyRate >= 0.1 ? "good" as const : replyRate >= 0.05 ? "warn" as const : "bad" as const },
    { label: "Unsub Rate", value: unsubRate, weight: 15, max: 0.01, status: unsubRate < 0.005 ? "good" as const : unsubRate < 0.01 ? "warn" as const : "bad" as const },
    { label: "Avg Opens/Email", value: avgOpens, weight: 10, max: 3, status: avgOpens >= 2.5 ? "good" as const : avgOpens >= 1.5 ? "warn" as const : "bad" as const },
  ];

  let score = 0;
  for (const f of factors) {
    if (f.label.includes("Rate") && !f.label.includes("Avg")) {
      // Lower is better for bounce/unsub
      if (f.label === "Bounce Rate" || f.label === "Unsub Rate") {
        const ratio = f.value === 0 ? 1 : Math.max(0, 1 - f.value / f.max);
        score += f.weight * ratio;
      } else {
        // Higher is better for open/reply
        const ratio = Math.min(1, f.value / f.max);
        score += f.weight * ratio;
      }
    } else {
      // Higher is better
      const ratio = Math.min(1, f.value / f.max);
      score += f.weight * ratio;
    }
  }

  score = Math.round(score);
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";
  const color = score >= 85 ? "#5ab896" : score >= 70 ? "#d4a574" : score >= 55 ? "#fbbf24" : "#ef4444";

  return { score, grade, color, factors };
}

// ─── Funnel Analysis ─────────────────────────────────────────────────────────
function calcFunnel(kpis: ReturnType<typeof getOutreachKPIs>) {
  const stages = [
    { label: "Sent", count: kpis.totalSent, pct: 1.0, color: "var(--cream-dim)" },
    { label: "Delivered", count: kpis.totalSent - kpis.totalBounced, pct: kpis.totalSent > 0 ? (kpis.totalSent - kpis.totalBounced) / kpis.totalSent : 0, color: "#7dd3fc" },
    { label: "Opened", count: kpis.totalOpened, pct: kpis.openRate, color: "#a855f7" },
    { label: "Replied", count: kpis.totalReplied, pct: kpis.replyRate, color: "var(--gold)" },
    { label: "Meeting", count: kpis.totalMeetings, pct: kpis.meetingRate, color: "var(--emerald)" },
    { label: "Closed Won", count: kpis.totalClosedWon, pct: kpis.totalSent > 0 ? kpis.totalClosedWon / kpis.totalSent : 0, color: "#a3e635" },
  ];
  return stages;
}

// ─── Subject Line Performance ────────────────────────────────────────────────
function analyzeSubjects(emails: ReturnType<typeof getEmails>) {
  const grouped = new Map<string, { subject: string; count: number; opened: number; replied: number; meetings: number }>();
  for (const e of emails) {
    // Normalize subject (remove company-specific parts)
    const baseSubject = e.subject.replace(/\{[^}]+\}/g, "").replace(/about .*'s /i, "about ").trim();
    const key = baseSubject.substring(0, 40);
    const existing = grouped.get(key) || { subject: e.subject, count: 0, opened: 0, replied: 0, meetings: 0 };
    existing.count++;
    if (e.openCount > 0) existing.opened++;
    if (e.status === "replied" || e.status === "meeting_booked" || e.status === "closed_won") existing.replied++;
    if (e.status === "meeting_booked" || e.status === "closed_won") existing.meetings++;
    grouped.set(key, existing);
  }
  return Array.from(grouped.values()).sort((a, b) => b.replied / b.count - a.replied / a.count);
}

// ─── Time-of-Day Analysis ────────────────────────────────────────────────────
function analyzeSendTimes(emails: ReturnType<typeof getEmails>) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, sent: 0, opened: 0, replied: 0 }));
  for (const e of emails) {
    const h = new Date(e.sentDate).getHours();
    hours[h].sent++;
    if (e.openCount > 0) hours[h].opened++;
    if (e.status === "replied" || e.status === "meeting_booked" || e.status === "closed_won") hours[h].replied++;
  }
  return hours;
}

// ─── Campaign Performance Matrix ─────────────────────────────────────────────
function analyzeCampaigns(campaigns: ReturnType<typeof getCampaigns>) {
  return campaigns.map(c => ({
    ...c,
    openRate: c.totalSent > 0 ? c.totalOpened / c.totalSent : 0,
    replyRate: c.totalSent > 0 ? c.totalReplied / c.totalSent : 0,
    meetingRate: c.totalReplied > 0 ? c.totalMeetings / c.totalReplied : 0,
    closeRate: c.totalMeetings > 0 ? c.totalClosed / c.totalMeetings : 0,
    estRevenue: c.totalClosed * 144000, // avg $12K/mo × 12mo
  })).filter(c => c.totalSent > 0).sort((a, b) => b.replyRate - a.replyRate);
}

// ─── Sequence Step Analysis ──────────────────────────────────────────────────
function analyzeSteps(seqs: ReturnType<typeof getSequences>) {
  return seqs.sort((a, b) => a.campaignId.localeCompare(b.campaignId) || a.step - b.step);
}

// ─── ROI Projection ──────────────────────────────────────────────────────────
function calcROI(kpis: ReturnType<typeof getOutreachKPIs>) {
  const avgDealValue = 144000; // $12K/mo × 12mo
  const costPerEmail = 0.12; // tooling + labor amortized
  const totalCost = kpis.totalSent * costPerEmail;
  const revenue = kpis.totalClosedWon * avgDealValue;
  const pipelineProjected = kpis.totalMeetings * avgDealValue * 0.25; // 25% close rate
  const roi = totalCost > 0 ? (revenue - totalCost) / totalCost : 0;
  return { avgDealValue, costPerEmail, totalCost, revenue, pipelineProjected, roi, totalROI: revenue + pipelineProjected - totalCost };
}

type TabId = "overview" | "funnel" | "subjects" | "timing" | "campaigns" | "sequences" | "deliverability" | "roi";

export default function EmailTrackingPage() {
  const [tab, setTab] = useState<TabId>("overview");

  const kpis = useMemo(() => getOutreachKPIs(), []);
  const emails = useMemo(() => getEmails(), []);
  const campaigns = useMemo(() => getCampaigns(), []);
  const sequences = useMemo(() => getSequences(), []);
  const contacts = useMemo(() => getContacts(), []);

  const funnel = useMemo(() => calcFunnel(kpis), [kpis]);
  const delivScore = useMemo(() => calcDeliverabilityScore(kpis, emails), [kpis, emails]);
  const subjectAnalysis = useMemo(() => analyzeSubjects(emails), [emails]);
  const sendTimes = useMemo(() => analyzeSendTimes(emails), [emails]);
  const campaignMatrix = useMemo(() => analyzeCampaigns(campaigns), [campaigns]);
  const stepAnalysis = useMemo(() => analyzeSteps(sequences), [sequences]);
  const roi = useMemo(() => calcROI(kpis), [kpis]);

  const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "funnel", label: "Conversion Funnel", icon: Target },
    { id: "subjects", label: "Subject Lines", icon: Mail },
    { id: "timing", label: "Send Timing", icon: Clock },
    { id: "campaigns", label: "Campaign Matrix", icon: Activity },
    { id: "sequences", label: "Sequences", icon: Zap },
    { id: "deliverability", label: "Deliverability", icon: ShieldCheck },
    { id: "roi", label: "ROI Analysis", icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <MailCheck size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Agency Operations
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Email Tracking & Analytics
        </h1>
        <p className="text-[14px] mt-2" style={{ color: "var(--cream-dim)" }}>
          Deep funnel analytics, deliverability scoring, subject line performance, send-time optimization, and ROI tracking.
        </p>
      </motion.section>

      {/* ─── Tab Bar ─── */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="flex flex-wrap gap-2">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  background: active ? "rgba(212,165,116,0.14)" : "rgba(212,200,180,0.04)",
                  border: `1px solid ${active ? "rgba(212,165,116,0.3)" : "rgba(212,200,180,0.08)"}`,
                  color: active ? "var(--gold)" : "var(--cream-dim)",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* ─── OVERVIEW TAB ─── */}
      {tab === "overview" && (
        <motion.div initial="initial" animate="animate" variants={fadeUp} className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Sent", value: kpis.totalSent, icon: Send, color: "var(--cream-dim)", sub: `${kpis.totalContacts} contacts` },
              { label: "Open Rate", value: formatPct(kpis.openRate), icon: MailCheck, color: "#a855f7", sub: `${kpis.totalOpened} opened` },
              { label: "Reply Rate", value: formatPct(kpis.replyRate), icon: Reply, color: "var(--gold)", sub: `${kpis.totalReplied} replied` },
              { label: "Meeting Rate", value: formatPct(kpis.meetingRate), icon: Calendar, color: "var(--emerald)", sub: `${kpis.totalMeetings} booked` },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial="initial"
                  animate="animate"
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.03 }}
                  className="rounded-xl p-5"
                  style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={18} style={{ color: kpi.color }} />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>{kpi.sub}</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "var(--cream)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {kpi.value}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: "var(--cream-dim)" }}>{kpi.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Close Rate", value: formatPct(kpis.closeRate), icon: CheckCircle2, color: "#a3e635", sub: `${kpis.totalClosedWon} won` },
              { label: "Bounce Rate", value: formatPct(kpis.bounceRate), icon: AlertTriangle, color: "#f87171", sub: `${kpis.totalBounced} bounced` },
              { label: "Avg Reply Time", value: formatHours(kpis.avgReplyHours), icon: Clock, color: "var(--gold)", sub: "time to first reply" },
              { label: "Pipeline Value", value: formatCurrency(kpis.pipelineValue), icon: DollarSign, color: "var(--emerald)", sub: "est. from meetings" },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial="initial"
                  animate="animate"
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.03 }}
                  className="rounded-xl p-5"
                  style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={18} style={{ color: kpi.color }} />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>{kpi.sub}</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "var(--cream)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {kpi.value}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: "var(--cream-dim)" }}>{kpi.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Deliverability Gauge + Active Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Deliverability Score */}
            <div className="rounded-xl p-6 lg:col-span-1" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Gauge size={18} style={{ color: delivScore.color }} />
                <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
                  Deliverability Score
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(212,200,180,0.08)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke={delivScore.color} strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 42 * (delivScore.score / 100)} ${2 * Math.PI * 42}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: delivScore.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {delivScore.score}
                    </span>
                    <span className="text-[16px] font-bold" style={{ color: delivScore.color }}>
                      {delivScore.grade}
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {delivScore.factors.slice(0, 3).map(f => (
                    <div key={f.label} className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>{f.label}</span>
                      <span className="text-[11px] font-mono font-bold" style={{
                        color: f.status === "good" ? "#5ab896" : f.status === "warn" ? "#fbbf24" : "#ef4444"
                      }}>
                        {f.label.includes("Avg") ? f.value.toFixed(1) : formatPct(f.value)}
                      </span>
                    </div>
                  ))}
                  <button onClick={() => setTab("deliverability")} className="text-[11px] flex items-center gap-1 mt-1" style={{ color: "var(--gold)" }}>
                    View details <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Campaigns Summary */}
            <div className="rounded-xl p-6 lg:col-span-2" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={18} style={{ color: "var(--gold)" }} />
                  <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
                    Active Campaign Performance
                  </h3>
                </div>
                <button onClick={() => setTab("campaigns")} className="text-[11px] flex items-center gap-1" style={{ color: "var(--gold)" }}>
                  Full matrix <ArrowRight size={11} />
                </button>
              </div>
              <div className="space-y-3">
                {campaignMatrix.slice(0, 3).map(c => (
                  <div key={c.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: "var(--cream)" }}>{c.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{c.totalSent} sent</span>
                        <span className="text-[10px]" style={{ color: "#a855f7" }}>{formatPct(c.openRate)} open</span>
                        <span className="text-[10px]" style={{ color: "var(--gold)" }}>{formatPct(c.replyRate)} reply</span>
                      </div>
                    </div>
                    {/* Mini funnel bar */}
                    <div className="flex items-center gap-1" style={{ width: 120 }}>
                      <div className="h-2 rounded-full overflow-hidden flex-1" style={{ background: "rgba(212,200,180,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${c.replyRate * 100 * 4}%`, background: "var(--gold)" }} />
                      </div>
                      <span className="text-[11px] font-mono font-bold" style={{ color: c.replyRate >= 0.1 ? "var(--emerald)" : "var(--cream-dim)" }}>
                        {(c.replyRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Inbox size={18} style={{ color: "var(--gold)" }} />
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
                Recent Email Activity
              </h3>
            </div>
            <div className="space-y-2">
              {emails.slice(0, 5).map(e => {
                const statusConfig = {
                  sent: { label: "Sent", color: "var(--cream-dim)", icon: Send },
                  opened: { label: "Opened", color: "#7dd3fc", icon: Eye },
                  replied: { label: "Replied", color: "var(--gold)", icon: Reply },
                  meeting_booked: { label: "Meeting", color: "var(--emerald)", icon: Calendar },
                  closed_won: { label: "Won!", color: "#a3e635", icon: CheckCircle2 },
                  closed_lost: { label: "Lost", color: "var(--plum)", icon: XCircle },
                  bounced: { label: "Bounced", color: "#f87171", icon: AlertTriangle },
                  unsubscribed: { label: "Unsub", color: "var(--cream-mute)", icon: XCircle },
                };
                const cfg = statusConfig[e.status as keyof typeof statusConfig] || statusConfig.sent;
                const StatusIcon = cfg.icon;
                return (
                  <div key={e.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "rgba(212,200,180,0.04)" }}>
                    <StatusIcon size={14} style={{ color: cfg.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: "var(--cream)" }}>{e.contactName}</div>
                      <div className="text-[11px] truncate" style={{ color: "var(--cream-mute)" }}>{e.subject}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</div>
                      <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                        {e.openCount > 0 && `${e.openCount}× opened`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── FUNNEL TAB ─── */}
      {tab === "funnel" && (
        <motion.div initial="initial" animate="animate" variants={fadeUp} className="space-y-6">
          <div className="rounded-xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="text-[14px] font-semibold mb-6" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
              Email Conversion Funnel
            </h3>
            <div className="space-y-3">
              {funnel.map((stage, i) => {
                const prevPct = i > 0 ? funnel[i - 1].pct : 1;
                const dropoff = i > 0 ? ((prevPct - stage.pct) / prevPct) * 100 : 0;
                return (
                  <div key={stage.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{stage.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-mono font-bold" style={{ color: stage.color }}>{stage.count}</span>
                        <span className="text-[11px] font-mono" style={{ color: "var(--cream-dim)" }}>{formatPct(stage.pct)}</span>
                        {i > 0 && dropoff > 0 && (
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: "#f87171" }}>
                            <TrendingDown size={10} /> {dropoff.toFixed(0)}% drop
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-8 rounded-lg overflow-hidden relative" style={{ background: "rgba(212,200,180,0.04)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.pct * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="h-full flex items-center px-3"
                        style={{ background: `linear-gradient(90deg, ${stage.color}22, ${stage.color}44)` }}
                      >
                        <div className="h-full w-1" style={{ background: stage.color }} />
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step-by-step conversion */}
          <div className="rounded-xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="text-[14px] font-semibold mb-4" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
              Stage-by-Stage Conversion Rates
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { from: "Sent", to: "Opened", rate: kpis.openRate, benchmark: 0.4, color: "#a855f7" },
                { from: "Opened", to: "Replied", rate: kpis.totalOpened > 0 ? kpis.totalReplied / kpis.totalOpened : 0, benchmark: 0.15, color: "var(--gold)" },
                { from: "Replied", to: "Meeting", rate: kpis.totalReplied > 0 ? kpis.totalMeetings / kpis.totalReplied : 0, benchmark: 0.3, color: "var(--emerald)" },
                { from: "Meeting", to: "Closed", rate: kpis.closeRate, benchmark: 0.25, color: "#a3e635" },
                { from: "Sent", to: "Closed", rate: kpis.totalSent > 0 ? kpis.totalClosedWon / kpis.totalSent : 0, benchmark: 0.02, color: "#7dd3fc" },
              ].map(conv => {
                const beats = conv.rate >= conv.benchmark;
                return (
                  <div key={conv.from} className="text-center">
                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>
                      {conv.from} → {conv.to}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: conv.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {formatPct(conv.rate)}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: beats ? "var(--emerald)" : "#fbbf24" }}>
                      {beats ? "↑ above" : "↓ below"} {formatPct(conv.benchmark)} bench
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── SUBJECT LINES TAB ─── */}
      {tab === "subjects" && (
        <motion.div initial="initial" animate="animate" variants={fadeUp} className="space-y-6">
          <div className="rounded-xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="text-[14px] font-semibold mb-4" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
              Subject Line Performance Analysis
            </h3>
            <div className="space-y-4">
              {subjectAnalysis.map((s, i) => {
                const openRate = s.count > 0 ? s.opened / s.count : 0;
                const replyRate = s.count > 0 ? s.replied / s.count : 0;
                return (
                  <div key={i} className="rounded-lg p-4" style={{ background: "rgba(212,200,180,0.03)", border: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{s.subject}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>{s.count} emails</span>
                          {replyRate >= 0.15 && (
                            <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(163,230,53,0.1)", color: "#a3e635" }}>
                              <Flame size={10} /> High performer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>Open Rate</div>
                        <div className="text-[16px] font-mono font-bold" style={{ color: "#a855f7" }}>{formatPct(openRate)}</div>
                        <div className="h-1.5 rounded-full mt-1" style={{ background: "rgba(168,85,247,0.1)" }}>
                          <div className="h-full rounded-full" style={{ width: `${openRate * 100}%`, background: "#a855f7" }} />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>Reply Rate</div>
                        <div className="text-[16px] font-mono font-bold" style={{ color: "var(--gold)" }}>{formatPct(replyRate)}</div>
                        <div className="h-1.5 rounded-full mt-1" style={{ background: "rgba(212,165,116,0.1)" }}>
                          <div className="h-full rounded-full" style={{ width: `${replyRate * 100 * 4}%`, background: "var(--gold)" }} />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>Meetings</div>
                        <div className="text-[16px] font-mono font-bold" style={{ color: "var(--emerald)" }}>{s.meetings}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>Effectiveness</div>
                        <div className="text-[16px] font-mono font-bold" style={{
                          color: replyRate >= 0.15 ? "#a3e635" : replyRate >= 0.08 ? "var(--gold)" : "var(--cream-dim)"
                        }}>
                          {replyRate >= 0.15 ? "A" : replyRate >= 0.08 ? "B" : replyRate >= 0.04 ? "C" : "D"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TIMING TAB ─── */}
      {tab === "timing" && (
        <motion.div initial="initial" animate="animate" variants={fadeUp} className="space-y-6">
          <div className="rounded-xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="text-[14px] font-semibold mb-2" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
              Send Time Analysis — 24 Hour Distribution
            </h3>
            <p className="text-[12px] mb-6" style={{ color: "var(--cream-dim)" }}>
              Bars show email volume per hour. Green overlay = reply rate. Best times highlighted.
            </p>
            <div className="flex items-end gap-1" style={{ height: 180 }}>
              {sendTimes.map(h => {
                const maxSent = Math.max(...sendTimes.map(s => s.sent), 1);
                const sentH = (h.sent / maxSent) * 100;
                const replyRate = h.sent > 0 ? h.replied / h.sent : 0;
                const replyH = replyRate * 100 * 3; // amplified for visibility
                const isBest = replyRate >= 0.15 && h.sent >= 1;
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] z-10"
                      style={{ background: "var(--bg-deep)", border: "1px solid var(--border-subtle)", color: "var(--cream)" }}>
                      {h.hour}:00 — {h.sent} sent, {h.replied} replied ({formatPct(replyRate)})
                    </div>
                    <div className="w-full relative flex-1 flex items-end">
                      {/* Sent bar */}
                      <div className="w-full rounded-t" style={{
                        height: `${sentH}%`,
                        background: isBest ? "rgba(163,230,53,0.3)" : "rgba(168,85,247,0.15)",
                        borderTop: isBest ? "2px solid #a3e635" : "2px solid rgba(168,85,247,0.4)",
                      }} />
                      {/* Reply overlay */}
                      {h.replied > 0 && (
                        <div className="absolute bottom-0 w-full rounded-t" style={{
                          height: `${Math.min(sentH, replyH)}%`,
                          background: "rgba(212,165,116,0.4)",
                          borderTop: "2px solid var(--gold)",
                        }} />
                      )}
                    </div>
                    <span className="text-[9px]" style={{ color: h.hour % 3 === 0 ? "var(--cream-dim)" : "var(--cream-mute)" }}>
                      {h.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best time summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl p-5" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Thermometer size={16} style={{ color: "#a3e635" }} />
                <span className="text-[12px] font-semibold" style={{ color: "var(--cream)" }}>Best Reply Hours</span>
              </div>
              <div className="space-y-2">
                {sendTimes.filter(h => h.sent > 0).sort((a, b) => (b.replied / b.sent) - (a.replied / a.sent)).slice(0, 5).map(h => (
                  <div key={h.hour} className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{h.hour}:00 — {h.hour}:59</span>
                    <span className="text-[12px] font-mono font-bold" style={{ color: "var(--gold)" }}>
                      {formatPct(h.replied / h.sent)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} style={{ color: "#a855f7" }} />
                <span className="text-[12px] font-semibold" style={{ color: "var(--cream)" }}>Peak Send Volume</span>
              </div>
              <div className="space-y-2">
                {sendTimes.filter(h => h.sent > 0).sort((a, b) => b.sent - a.sent).slice(0, 5).map(h => (
                  <div key={h.hour} className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{h.hour}:00 — {h.hour}:59</span>
                    <span className="text-[12px] font-mono font-bold" style={{ color: "#a855f7" }}>{h.sent} emails</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} style={{ color: "var(--emerald)" }} />
                <span className="text-[12px] font-semibold" style={{ color: "var(--cream)" }}>Optimization Insight</span>
              </div>
              <div className="space-y-3">
                <div className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
                  Most emails sent between <span style={{ color: "var(--cream)" }}>
                    {sendTimes.filter(h => h.sent > 0).sort((a, b) => b.sent - a.sent)[0]?.hour}:00–{sendTimes.filter(h => h.sent > 0).sort((a, b) => b.sent - a.sent)[0]?.hour}:59
                  </span>.
                </div>
                <div className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
                  Best reply window: <span style={{ color: "var(--gold)" }}>
                    {sendTimes.filter(h => h.sent > 0).sort((a, b) => (b.replied / b.sent) - (a.replied / a.sent))[0]?.hour}:00
                  </span>.
                </div>
                <div className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
                  Avg time to reply: <span style={{ color: "var(--cream)" }}>{formatHours(kpis.avgReplyHours)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── CAMPAIGN MATRIX TAB ─── */}
      {tab === "campaigns" && (
        <motion.div initial="initial" animate="animate" variants={fadeUp} className="space-y-6">
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
                Campaign Performance Matrix
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {["Campaign", "Status", "Sent", "Open%", "Reply%", "Meet%", "Close%", "Revenue"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaignMatrix.map(c => {
                    const statusColors: Record<CampaignStatus, string> = {
                      active: "#5ab896", paused: "#fbbf24", draft: "var(--cream-dim)", completed: "var(--plum)",
                    };
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid rgba(212,200,180,0.04)" }}>
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: "var(--cream)" }}>{c.name}</div>
                          <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{c.targetSegment}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                            background: `${statusColors[c.status]}22`,
                            color: statusColors[c.status],
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: "var(--cream)" }}>{c.totalSent}</td>
                        <td className="px-4 py-3 font-mono" style={{ color: c.openRate >= 0.5 ? "#a3e635" : c.openRate >= 0.3 ? "var(--gold)" : "#fbbf24" }}>
                          {formatPct(c.openRate)}
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: c.replyRate >= 0.1 ? "#a3e635" : c.replyRate >= 0.05 ? "var(--gold)" : "#fbbf24" }}>
                          {formatPct(c.replyRate)}
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: c.meetingRate >= 0.3 ? "#a3e635" : "var(--cream-dim)" }}>
                          {formatPct(c.meetingRate)}
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: c.closeRate >= 0.25 ? "#a3e635" : "var(--cream-dim)" }}>
                          {formatPct(c.closeRate)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold" style={{ color: "var(--emerald)" }}>
                          {formatCurrency(c.estRevenue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── SEQUENCES TAB ─── */}
      {tab === "sequences" && (
        <motion.div initial="initial" animate="animate" variants={fadeUp} className="space-y-6">
          <div className="rounded-xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="text-[14px] font-semibold mb-2" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
              Sequence Step Performance
            </h3>
            <p className="text-[12px] mb-6" style={{ color: "var(--cream-dim)" }}>
              Multi-touch campaign sequences — open and reply rates per step, with delay intervals.
            </p>
            <div className="space-y-6">
              {Object.entries(
                stepAnalysis.reduce((acc, s) => {
                  if (!acc[s.campaignId]) acc[s.campaignId] = [];
                  acc[s.campaignId].push(s);
                  return acc;
                }, {} as Record<string, typeof stepAnalysis>)
              ).map(([campId, steps]) => {
                const camp = campaigns.find(c => c.id === campId);
                return (
                  <div key={campId}>
                    <div className="text-[13px] font-medium mb-3" style={{ color: "var(--cream)" }}>
                      {camp?.name || campId}
                    </div>
                    <div className="flex items-center gap-2">
                      {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2 flex-1">
                          <div className="flex-1 rounded-lg p-3" style={{ background: "rgba(212,200,180,0.03)", border: "1px solid var(--border-subtle)" }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                                style={{ background: "rgba(212,165,116,0.15)", color: "var(--gold)" }}>
                                {s.step}
                              </span>
                              <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>+{s.delayDays}d</span>
                            </div>
                            <div className="text-[11px] mb-2" style={{ color: "var(--cream)" }}>{s.subject}</div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>Open</span>
                                <span className="text-[10px] font-mono font-bold" style={{ color: "#a855f7" }}>{formatPct(s.openRate)}</span>
                              </div>
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(168,85,247,0.1)" }}>
                                <div className="h-full rounded-full" style={{ width: `${s.openRate * 100}%`, background: "#a855f7" }} />
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>Reply</span>
                                <span className="text-[10px] font-mono font-bold" style={{ color: "var(--gold)" }}>{formatPct(s.replyRate)}</span>
                              </div>
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(212,165,116,0.1)" }}>
                                <div className="h-full rounded-full" style={{ width: `${s.replyRate * 100 * 4}%`, background: "var(--gold)" }} />
                              </div>
                            </div>
                          </div>
                          {i < steps.length - 1 && (
                            <ArrowRight size={14} style={{ color: "var(--cream-mute)" }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── DELIVERABILITY TAB ─── */}
      {tab === "deliverability" && (
        <motion.div initial="initial" animate="animate" variants={fadeUp} className="space-y-6">
          {/* Score Gauge */}
          <div className="rounded-xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck size={20} style={{ color: delivScore.color }} />
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
                Deliverability Health Score
              </h3>
            </div>
            <div className="flex items-center gap-8">
              <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(212,200,180,0.08)" strokeWidth="10" />
                  <circle
                    cx="70" cy="70" r="60" fill="none" stroke={delivScore.color} strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 60 * (delivScore.score / 100)} ${2 * Math.PI * 60}`}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: delivScore.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {delivScore.score}
                  </span>
                  <span className="text-xl font-bold" style={{ color: delivScore.color }}>Grade {delivScore.grade}</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 gap-3">
                {delivScore.factors.map(f => (
                  <div key={f.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{f.label}</span>
                        <span className="text-[12px] font-mono font-bold" style={{
                          color: f.status === "good" ? "#5ab896" : f.status === "warn" ? "#fbbf24" : "#ef4444"
                        }}>
                          {f.label.includes("Avg") ? f.value.toFixed(1) : formatPct(f.value)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(212,200,180,0.06)" }}>
                        <div className="h-full rounded-full" style={{
                          width: f.status === "good" ? "100%" : f.status === "warn" ? "60%" : "25%",
                          background: f.status === "good" ? "#5ab896" : f.status === "warn" ? "#fbbf24" : "#ef4444"
                        }} />
                      </div>
                    </div>
                    <span className="text-[10px] w-12 text-right" style={{ color: "var(--cream-mute)" }}>
                      {f.weight}% weight
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "SPF Record", status: "passing", icon: Server, detail: "Domain authenticated" },
              { label: "DKIM Signature", status: "passing", icon: ShieldCheck, detail: "Signed & verified" },
              { label: "DMARC Policy", status: "passing", icon: Wifi, detail: "p=reject active" },
              { label: "Domain Reputation", status: "good", icon: Gauge, detail: "Above 85/100" },
              { label: "Bounce Handling", status: "active", icon: AlertTriangle, detail: "Auto-suppressing" },
              { label: "Warmup Status", status: "complete", icon: Thermometer, detail: "Ramp complete" },
            ].map(item => {
              const Icon = item.icon;
              const color = item.status === "passing" || item.status === "good" || item.status === "active" || item.status === "complete"
                ? "#5ab896" : "#fbbf24";
              return (
                <div key={item.label} className="rounded-xl p-4" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={16} style={{ color }} />
                    <CheckCircle2 size={14} style={{ color }} />
                  </div>
                  <div className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{item.label}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--cream-dim)" }}>{item.detail}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ─── ROI TAB ─── */}
      {tab === "roi" && (
        <motion.div initial="initial" animate="animate" variants={fadeUp} className="space-y-6">
          {/* ROI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Cost", value: formatCurrency(roi.totalCost), icon: DollarSign, color: "#f87171", sub: `$${roi.costPerEmail}/email × ${kpis.totalSent}` },
              { label: "Revenue Closed", value: formatCurrency(roi.revenue), icon: CheckCircle2, color: "#a3e635", sub: `${kpis.totalClosedWon} deals × $144K` },
              { label: "Pipeline (Projected)", value: formatCurrency(roi.pipelineProjected), icon: Target, color: "var(--gold)", sub: `${kpis.totalMeetings} meetings × 25% close` },
              { label: "Net ROI", value: formatCurrency(roi.totalROI), icon: TrendingUp, color: "var(--emerald)", sub: `${(roi.roi * 100).toFixed(0)}× return` },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial="initial"
                  animate="animate"
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-xl p-5"
                  style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={18} style={{ color: item.color }} />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>{item.sub}</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: item.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {item.value}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: "var(--cream-dim)" }}>{item.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* ROI Breakdown Chart */}
          <div className="rounded-xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="text-[14px] font-semibold mb-6" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
              Revenue vs Cost Analysis
            </h3>
            <div className="space-y-4">
              {/* Cost bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] flex items-center gap-2" style={{ color: "var(--cream-dim)" }}>
                    <DollarSign size={14} style={{ color: "#f87171" }} /> Total Cost
                  </span>
                  <span className="text-[14px] font-mono font-bold" style={{ color: "#f87171" }}>{formatCurrency(roi.totalCost)}</span>
                </div>
                <div className="h-6 rounded-lg overflow-hidden" style={{ background: "rgba(248,113,113,0.08)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: "8%" }} transition={{ duration: 0.6 }}
                    className="h-full rounded-lg" style={{ background: "rgba(248,113,113,0.3)" }} />
                </div>
              </div>

              {/* Revenue bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] flex items-center gap-2" style={{ color: "var(--cream-dim)" }}>
                    <CheckCircle2 size={14} style={{ color: "#a3e635" }} /> Revenue (Closed)
                  </span>
                  <span className="text-[14px] font-mono font-bold" style={{ color: "#a3e635" }}>{formatCurrency(roi.revenue)}</span>
                </div>
                <div className="h-6 rounded-lg overflow-hidden" style={{ background: "rgba(163,230,53,0.08)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (roi.revenue / (roi.revenue + roi.pipelineProjected)) * 100)}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full rounded-lg" style={{ background: "rgba(163,230,53,0.3)" }} />
                </div>
              </div>

              {/* Pipeline projected bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] flex items-center gap-2" style={{ color: "var(--cream-dim)" }}>
                    <Target size={14} style={{ color: "var(--gold)" }} /> Pipeline (Projected)
                  </span>
                  <span className="text-[14px] font-mono font-bold" style={{ color: "var(--gold)" }}>{formatCurrency(roi.pipelineProjected)}</span>
                </div>
                <div className="h-6 rounded-lg overflow-hidden" style={{ background: "rgba(212,165,116,0.08)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (roi.pipelineProjected / (roi.revenue + roi.pipelineProjected)) * 100)}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="h-full rounded-lg" style={{ background: "rgba(212,165,116,0.3)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Per-campaign ROI */}
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
                Campaign-Level ROI
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(212,200,180,0.04)" }}>
              {campaignMatrix.map(c => {
                const cost = c.totalSent * roi.costPerEmail;
                const revenue = c.estRevenue;
                const campROI = cost > 0 ? revenue / cost : 0;
                return (
                  <div key={c.id} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: "var(--cream)" }}>{c.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--cream-mute)" }}>
                        Cost: {formatCurrency(cost)} · Revenue: {formatCurrency(revenue)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[16px] font-mono font-bold" style={{
                        color: campROI >= 10 ? "#a3e635" : campROI >= 1 ? "var(--emerald)" : campROI > 0 ? "var(--gold)" : "#f87171"
                      }}>
                        {campROI.toFixed(0)}× ROI
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
