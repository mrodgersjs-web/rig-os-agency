"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Mail, Send, Inbox, Calendar, CheckCircle2, XCircle,
  AlertTriangle, Users, Clock, TrendingUp, DollarSign,
  Target, Flame, ChevronDown, ChevronRight, Reply,
  ExternalLink, BadgeCheck, Play, Pause, FileText,
  ArrowUpRight,
} from "lucide-react";
import {
  getOutreachKPIs, getCampaigns, getEmails, getSequences, getContacts,
  type OutreachStatus, type CampaignStatus, type EmailPriority,
} from "@/lib/outreach-data";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function formatHours(h: number): string {
  if (h < 24) return `${h.toFixed(0)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

const statusConfig: Record<OutreachStatus, { label: string; color: string; bg: string; icon: typeof Send }> = {
  sent:           { label: "Sent",           color: "var(--cream-dim)", bg: "rgba(212,200,180,0.08)", icon: Send },
  opened:         { label: "Opened",          color: "#7dd3fc", bg: "rgba(125,211,252,0.1)", icon: Mail },
  replied:        { label: "Replied",         color: "var(--gold)", bg: "rgba(212,165,116,0.1)", icon: Reply },
  meeting_booked: { label: "Meeting Booked",  color: "var(--emerald)", bg: "rgba(90,184,150,0.1)", icon: Calendar },
  closed_won:     { label: "Closed Won",      color: "#a3e635", bg: "rgba(163,230,53,0.12)", icon: CheckCircle2 },
  closed_lost:    { label: "Closed Lost",     color: "var(--plum)", bg: "rgba(196,96,126,0.1)", icon: XCircle },
  bounced:        { label: "Bounced",         color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: AlertTriangle },
  unsubscribed:   { label: "Unsubscribed",    color: "var(--cream-mute)", bg: "rgba(212,200,180,0.06)", icon: XCircle },
};

const campaignStatusConfig: Record<CampaignStatus, { label: string; color: string }> = {
  active:    { label: "Active",    color: "var(--emerald)" },
  paused:    { label: "Paused",    color: "var(--gold)" },
  draft:     { label: "Draft",     color: "var(--cream-mute)" },
  completed: { label: "Completed", color: "var(--plum)" },
};

export default function OutreachPage() {
  const kpis = useMemo(() => getOutreachKPIs(), []);
  const campaigns = useMemo(() => getCampaigns(), []);
  const emails = useMemo(() => getEmails(), []);
  const sequences = useMemo(() => getSequences(), []);
  const contacts = useMemo(() => getContacts(), []);

  const [filterStatus, setFilterStatus] = useState<OutreachStatus | "all">("all");
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(campaigns[0]?.id || null);
  const [tab, setTab] = useState<"emails" | "campaigns" | "funnel" | "contacts">("emails");

  const filteredEmails = filterStatus === "all"
    ? emails
    : emails.filter((e) => e.status === filterStatus);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    emails.forEach((e) => { counts[e.status] = (counts[e.status] || 0) + 1; });
    return counts;
  }, [emails]);

  // Funnel data
  const funnelSteps = [
    { label: "Sent",      value: kpis.totalSent,      color: "var(--cream-dim)" },
    { label: "Opened",    value: kpis.totalOpened,    color: "#7dd3fc" },
    { label: "Replied",   value: kpis.totalReplied,   color: "var(--gold)" },
    { label: "Meetings",  value: kpis.totalMeetings,  color: "var(--emerald)" },
    { label: "Closed Won", value: kpis.totalClosedWon, color: "#a3e635" },
  ];
  const maxFunnel = Math.max(...funnelSteps.map((s) => s.value), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Mail size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Agency Operations
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Email Outreach Tracker
        </h1>
        <p className="text-[14px] mt-2" style={{ color: "var(--cream-dim)" }}>
          {kpis.activeCampaigns} active campaigns · {kpis.totalSent} emails sent · {formatPct(kpis.replyRate)} reply rate · {formatCurrency(kpis.pipelineValue)} pipeline
        </p>
      </motion.section>

      {/* KPI Cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "Emails Sent", value: kpis.totalSent, sub: `${kpis.totalContacts} contacts`, icon: <Send size={18} />, accent: "var(--cream-dim)" },
            { label: "Open Rate", value: formatPct(kpis.openRate), sub: `${kpis.totalOpened} opened`, icon: <Mail size={18} />, accent: "#7dd3fc" },
            { label: "Reply Rate", value: formatPct(kpis.replyRate), sub: `${kpis.totalReplied} replies`, icon: <Reply size={18} />, accent: "var(--gold)" },
            { label: "Meetings", value: kpis.totalMeetings, sub: `${formatPct(kpis.meetingRate)} meeting rate`, icon: <Calendar size={18} />, accent: "var(--emerald)" },
            { label: "Closed Won", value: kpis.totalClosedWon, sub: `${formatPct(kpis.closeRate)} close rate`, icon: <CheckCircle2 size={18} />, accent: "#a3e635" },
            { label: "Pipeline", value: formatCurrency(kpis.pipelineValue), sub: `${kpis.activeCampaigns} active`, icon: <DollarSign size={18} />, accent: "var(--gold)" },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.03 }}
              className="rounded-xl p-4 border"
              style={{ background: "rgba(20,10,30,0.4)", borderColor: "rgba(212,200,180,0.08)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                {kpi.label === "Closed Won" && kpis.totalClosedWon > 0 && (
                  <Flame size={14} style={{ color: kpi.accent }} />
                )}
              </div>
              <div className="text-2xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "var(--cream)" }}>
                {kpi.value}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--cream-mute)" }}>
                {kpi.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: "rgba(212,200,180,0.08)" }}>
        {([
          { key: "emails", label: "Email Feed", icon: <Mail size={15} /> },
          { key: "campaigns", label: "Campaigns", icon: <Target size={15} /> },
          { key: "funnel", label: "Funnel", icon: <TrendingUp size={15} /> },
          { key: "contacts", label: "Contacts", icon: <Users size={15} /> },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-all"
            style={{
              color: tab === t.key ? "var(--gold)" : "var(--cream-mute)",
              borderBottom: tab === t.key ? "2px solid var(--gold)" : "2px solid transparent",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "emails" && (
        <motion.div {...fadeUp} transition={{ duration: 0.3 }} className="space-y-4">
          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className="px-3 py-1 rounded-full text-[11px] font-medium transition-all border"
              style={{
                background: filterStatus === "all" ? "rgba(212,165,116,0.12)" : "transparent",
                borderColor: filterStatus === "all" ? "var(--gold)" : "rgba(212,200,180,0.1)",
                color: filterStatus === "all" ? "var(--gold)" : "var(--cream-mute)",
              }}
            >
              All ({emails.length})
            </button>
            {(Object.keys(statusConfig) as OutreachStatus[]).map((s) => {
              const count = statusCounts[s] || 0;
              if (count === 0) return null;
              const cfg = statusConfig[s];
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium transition-all border flex items-center gap-1.5"
                  style={{
                    background: filterStatus === s ? cfg.bg : "transparent",
                    borderColor: filterStatus === s ? cfg.color : "rgba(212,200,180,0.1)",
                    color: filterStatus === s ? cfg.color : "var(--cream-mute)",
                  }}
                >
                  <cfg.icon size={11} />
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Email List */}
          <div className="space-y-2">
            {filteredEmails.map((email, i) => {
              const cfg = statusConfig[email.status];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="rounded-lg p-4 border transition-all hover:border-opacity-30"
                  style={{ background: "rgba(20,10,30,0.3)", borderColor: "rgba(212,200,180,0.06)" }}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
                    >
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[14px] font-medium truncate" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
                          {email.contactName}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>
                          · {email.contactCompany}
                        </span>
                        {email.priority === "high" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(196,96,126,0.15)", color: "var(--plum)", fontWeight: 700 }}>
                            URGENT
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}>
                          {cfg.label}
                        </span>
                        {email.step > 1 && (
                          <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                            Step {email.step}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] truncate mb-1" style={{ color: "var(--cream-dim)" }}>
                        <span style={{ fontWeight: 600 }}>{email.subject}</span>
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "var(--cream-mute)" }}>
                        {email.preview}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: "var(--cream-mute)" }}>
                        <span>{new Date(email.sentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        {email.openCount > 0 && <span className="flex items-center gap-1"><Mail size={9} /> {email.openCount}×</span>}
                        {email.replyDate && (
                          <span className="flex items-center gap-1">
                            <Reply size={9} />
                            {new Date(email.replyDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {email.replySentiment && email.replySentiment !== "neutral" && (
                              <span style={{ color: email.replySentiment === "positive" ? "var(--emerald)" : "var(--plum)" }}>
                                · {email.replySentiment}
                              </span>
                            )}
                          </span>
                        )}
                        {email.meetingDate && (
                          <span className="flex items-center gap-1" style={{ color: "var(--emerald)" }}>
                            <Calendar size={9} />
                            {new Date(email.meetingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {email.notes && (
                        <p className="text-[10px] mt-2 italic" style={{ color: "var(--cream-dim)", opacity: 0.7 }}>
                          "{email.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {tab === "campaigns" && (
        <motion.div {...fadeUp} transition={{ duration: 0.3 }} className="space-y-3">
          {campaigns.map((camp) => {
            const isExpanded = expandedCampaign === camp.id;
            const campEmails = emails.filter((e) => e.campaignId === camp.id);
            const campSeq = sequences.filter((s) => s.campaignId === camp.id);
            const cs = campaignStatusConfig[camp.status];
            return (
              <div
                key={camp.id}
                className="rounded-xl border overflow-hidden"
                style={{ background: "rgba(20,10,30,0.3)", borderColor: "rgba(212,200,180,0.06)" }}
              >
                {/* Campaign header */}
                <button
                  onClick={() => setExpandedCampaign(isExpanded ? null : camp.id)}
                  className="w-full text-left p-4 flex items-center gap-4"
                >
                  {isExpanded ? <ChevronDown size={16} style={{ color: "var(--cream-mute)" }} /> : <ChevronRight size={16} style={{ color: "var(--cream-mute)" }} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-medium" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
                        {camp.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${cs.color}15`, color: cs.color }}>
                        {cs.label}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--cream-mute)" }}>
                      {camp.targetSegment} · {camp.totalSent} sent · {formatPct(camp.totalSent > 0 ? camp.totalReplied / camp.totalSent : 0)} reply rate
                    </p>
                  </div>
                  {/* Mini stats */}
                  <div className="flex items-center gap-4 text-center">
                    <div>
                      <div className="text-[16px] font-bold" style={{ color: "var(--gold)" }}>{camp.totalSent}</div>
                      <div className="text-[9px] uppercase" style={{ color: "var(--cream-mute)" }}>Sent</div>
                    </div>
                    <div>
                      <div className="text-[16px] font-bold" style={{ color: "var(--emerald)" }}>{camp.totalMeetings}</div>
                      <div className="text-[9px] uppercase" style={{ color: "var(--cream-mute)" }}>Meetings</div>
                    </div>
                    <div>
                      <div className="text-[16px] font-bold" style={{ color: "#a3e635" }}>{camp.totalClosed}</div>
                      <div className="text-[9px] uppercase" style={{ color: "var(--cream-mute)" }}>Won</div>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="border-t px-4 pb-4"
                    style={{ borderColor: "rgba(212,200,180,0.06)" }}
                  >
                    {/* Pitch */}
                    <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(212,165,116,0.05)", border: "1px solid rgba(212,165,116,0.1)" }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gold)" }}>Pitch</div>
                      <p className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{camp.pitch}</p>
                    </div>

                    {/* Sequence steps */}
                    {campSeq.length > 0 && (
                      <div className="mt-4">
                        <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Sequence</div>
                        <div className="space-y-2">
                          {campSeq.map((seq) => (
                            <div key={seq.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "rgba(20,10,30,0.3)" }}>
                              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "rgba(212,165,116,0.15)", color: "var(--gold)" }}>
                                {seq.step}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] truncate" style={{ color: "var(--cream)" }}>{seq.subject}</p>
                                <p className="text-[10px] truncate" style={{ color: "var(--cream-mute)" }}>{seq.bodyPreview}</p>
                              </div>
                              <div className="text-right text-[10px]">
                                <div style={{ color: "#7dd3fc" }}>{formatPct(seq.openRate)} open</div>
                                <div style={{ color: "var(--gold)" }}>{formatPct(seq.replyRate)} reply</div>
                              </div>
                              {seq.delayDays > 0 && (
                                <div className="text-[10px] flex items-center gap-1" style={{ color: "var(--cream-mute)" }}>
                                  <Clock size={10} /> +{seq.delayDays}d
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent emails in this campaign */}
                    {campEmails.length > 0 && (
                      <div className="mt-4">
                        <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Recent Activity ({campEmails.length})</div>
                        <div className="space-y-1.5">
                          {campEmails.slice(0, 4).map((e) => {
                            const cfg = statusConfig[e.status];
                            return (
                              <div key={e.id} className="flex items-center gap-2 text-[11px]">
                                <span style={{ color: cfg.color }}>●</span>
                                <span style={{ color: "var(--cream)" }}>{e.contactName}</span>
                                <span style={{ color: "var(--cream-mute)" }}>·</span>
                                <span style={{ color: cfg.color }}>{cfg.label}</span>
                                <span className="ml-auto" style={{ color: "var(--cream-mute)" }}>
                                  {new Date(e.sentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      {tab === "funnel" && (
        <motion.div {...fadeUp} transition={{ duration: 0.3 }} className="space-y-6">
          {/* Funnel visualization */}
          <div className="rounded-xl border p-6" style={{ background: "rgba(20,10,30,0.3)", borderColor: "rgba(212,200,180,0.06)" }}>
            <h3 className="text-[14px] font-medium mb-4" style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}>
              Outreach Funnel — All Campaigns
            </h3>
            <div className="space-y-3">
              {funnelSteps.map((step, i) => {
                const width = (step.value / maxFunnel) * 100;
                const convFromPrev = i > 0 ? ((step.value / funnelSteps[i - 1].value) * 100) : 100;
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{step.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-bold" style={{ color: step.color }}>{step.value}</span>
                        {i > 0 && (
                          <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                            {convFromPrev.toFixed(0)}% conv
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-7 rounded-md overflow-hidden" style={{ background: "rgba(212,200,180,0.05)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
                        className="h-full rounded-md"
                        style={{ background: `linear-gradient(90deg, ${step.color}40, ${step.color}80)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Open Rate", value: formatPct(kpis.openRate), sub: "vs 35% industry avg", positive: kpis.openRate > 0.35, icon: <Mail size={16} /> },
              { label: "Reply Rate", value: formatPct(kpis.replyRate), sub: "vs 8% industry avg", positive: kpis.replyRate > 0.08, icon: <Reply size={16} /> },
              { label: "Meeting Rate", value: formatPct(kpis.meetingRate), sub: "from all emails", positive: true, icon: <Calendar size={16} /> },
              { label: "Close Rate", value: formatPct(kpis.closeRate), sub: "from meetings", positive: true, icon: <CheckCircle2 size={16} /> },
              { label: "Avg Reply Time", value: formatHours(kpis.avgReplyHours), sub: "from send to reply", positive: kpis.avgReplyHours < 48, icon: <Clock size={16} /> },
              { label: "Bounce Rate", value: formatPct(kpis.bounceRate), sub: `${kpis.totalBounced} bounced`, positive: kpis.bounceRate < 0.05, icon: <AlertTriangle size={16} /> },
              { label: "Pipeline Value", value: formatCurrency(kpis.pipelineValue), sub: "from meetings + won", positive: true, icon: <DollarSign size={16} /> },
              { label: "Contacts", value: kpis.totalContacts, sub: `${contacts.filter(c => c.verified).length} verified`, positive: true, icon: <Users size={16} /> },
            ].map((m) => (
              <div key={m.label} className="rounded-xl p-4 border" style={{ background: "rgba(20,10,30,0.4)", borderColor: "rgba(212,200,180,0.06)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: m.positive ? "var(--emerald)" : "var(--plum)" }}>{m.icon}</span>
                  {m.positive ? <ArrowUpRight size={12} style={{ color: "var(--emerald)" }} /> : null}
                </div>
                <div className="text-xl font-bold" style={{ color: "var(--cream)" }}>{m.value}</div>
                <div className="text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>{m.label}</div>
                <div className="text-[9px] mt-0.5" style={{ color: m.positive ? "var(--emerald)" : "var(--cream-mute)", opacity: 0.8 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === "contacts" && (
        <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
          <div className="rounded-xl border overflow-hidden" style={{ background: "rgba(20,10,30,0.3)", borderColor: "rgba(212,200,180,0.06)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(212,200,180,0.08)" }}>
                  {["Name", "Company", "Title", "Industry", "Source", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => {
                  const contactEmails = emails.filter((e) => e.contactId === c.id);
                  const bestStatus = contactEmails.length > 0
                    ? contactEmails.sort((a, b) => {
                        const order: Record<string, number> = { closed_won: 7, closed_lost: 6, unsubscribed: 5, bounced: 4, meeting_booked: 3, replied: 2, opened: 1, sent: 0 };
                        return order[b.status] - order[a.status];
                      })[0].status
                    : "sent";
                  const cfg = statusConfig[bestStatus as OutreachStatus];
                  return (
                    <tr key={c.id} style={{ borderBottom: i < contacts.length - 1 ? "1px solid rgba(212,200,180,0.04)" : "none" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{c.name}</span>
                          {c.verified && <BadgeCheck size={12} style={{ color: "var(--emerald)" }} />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--cream-dim)" }}>{c.company}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--cream-dim)" }}>{c.title}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--cream-dim)" }}>{c.industry}</td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: "var(--cream-mute)" }}>{c.source}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
