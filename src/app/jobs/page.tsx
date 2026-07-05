"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Target, Mail, Users, DollarSign, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, XCircle, Filter, RefreshCw,
  Building2, Phone, Calendar, ArrowUpRight, Search, Sparkles,
  ChevronRight, Flame, Star, Eye, Edit3, Send, Zap,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

type JobStage =
  | "inbox"
  | "qualifying"
  | "discovery"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | "parked";

type JobSource =
  | "email_inbox"
  | "linkedin"
  | "cold_outreach"
  | "referral"
  | "scraping_apify"
  | "exa_search"
  | "manual";

interface Job {
  id: string;
  company: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string | null;
  contactPhone: string | null;
  industry: string;
  source: JobSource;
  stage: JobStage;
  value: number; // annual contract value in USD
  probability: number; // 0-100
  score: number; // composite score 0-100
  priority: "low" | "medium" | "high" | "critical";
  painPoints: string[];
  lastActivity: string; // ISO timestamp
  nextAction: string;
  nextActionDue: string; // ISO timestamp
  emailsReceived: number;
  emailsSent: number;
  meetingsBooked: number;
  proposalsSent: number;
  contractsSigned: number;
  notes: string;
  createdAt: string;
}

interface EmailLead {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;
  receivedAt: string;
  category: "lead" | "client" | "partner" | "internal" | "personal" | "urgent";
  categoryScore: number;
  hasReply: boolean;
  threadId: string;
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const STAGE_META: Record<JobStage, { label: string; color: string; accent: string }> = {
  inbox:        { label: "Inbox",         color: "#a59783", accent: "var(--cream-dim)" },
  qualifying:   { label: "Qualifying",    color: "#fbbf24", accent: "var(--gold)" },
  discovery:    { label: "Discovery",     color: "#22d3ee", accent: "#22d3ee" },
  proposal:     { label: "Proposal",      color: "#c084fc", accent: "#c084fc" },
  negotiation:  { label: "Negotiation",   color: "#f97316", accent: "#f97316" },
  won:          { label: "Won",           color: "#5ab896", accent: "var(--emerald)" },
  lost:         { label: "Lost",          color: "#ef4444", accent: "#ef4444" },
  parked:       { label: "Parked",        color: "#6e6353", accent: "var(--cream-mute)" },
};

const SOURCE_META: Record<JobSource, { label: string; icon: string }> = {
  email_inbox:     { label: "Email Inbox",     icon: "📧" },
  linkedin:        { label: "LinkedIn",        icon: "💼" },
  cold_outreach:   { label: "Cold Outreach",   icon: "📤" },
  referral:        { label: "Referral",        icon: "🤝" },
  scraping_apify:  { label: "Apify Scrape",    icon: "🕷️" },
  exa_search:      { label: "Exa Search",      icon: "🔍" },
  manual:          { label: "Manual",          icon: "✍️" },
};

const PRIORITY_META: Record<Job["priority"], { color: string; bg: string; label: string }> = {
  low:      { color: "#6e6353", bg: "rgba(110,99,83,0.15)",   label: "Low" },
  medium:   { color: "#d4a574", bg: "rgba(212,165,116,0.15)", label: "Medium" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.15)",  label: "High" },
  critical: { color: "#c4607e", bg: "rgba(196,96,126,0.18)",  label: "Critical" },
};

/* ── Seed Jobs ────────────────────────────────────────────────────────────── */

const SEED_JOBS: Job[] = [
  {
    id: "JOB-001",
    company: "TechFlow SaaS",
    contactName: "Sarah Chen",
    contactTitle: "VP Engineering",
    contactEmail: "sarah.chen@techflow.io",
    contactPhone: "+1 (415) 555-0142",
    industry: "SaaS",
    source: "email_inbox",
    stage: "proposal",
    value: 48000,
    probability: 65,
    score: 87,
    priority: "high",
    painPoints: ["scaling infra", "cost optimization", "AI automation"],
    lastActivity: new Date(Date.now() - 1_800_000).toISOString(),
    nextAction: "Send revised Phase 2 SOW",
    nextActionDue: new Date(Date.now() + 86_400_000).toISOString(),
    emailsReceived: 4,
    emailsSent: 3,
    meetingsBooked: 1,
    proposalsSent: 1,
    contractsSigned: 0,
    notes: "Phase 1 delivered ahead of schedule. Phase 2 scope discussion Friday. Decision-maker engaged.",
    createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
  },
  {
    id: "JOB-002",
    company: "FinEdge",
    contactName: "Marcus Webb",
    contactTitle: "CTO",
    contactEmail: "marcus.webb@finedge.com",
    contactPhone: null,
    industry: "FinTech",
    source: "referral",
    stage: "discovery",
    value: 78000,
    probability: 50,
    score: 92,
    priority: "critical",
    painPoints: ["compliance automation", "data pipeline", "SOC2 prep"],
    lastActivity: new Date(Date.now() - 4_300_000).toISOString(),
    nextAction: "Send compliance automation one-pager",
    nextActionDue: new Date(Date.now() + 12 * 3_600_000).toISOString(),
    emailsReceived: 3,
    emailsSent: 2,
    meetingsBooked: 1,
    proposalsSent: 0,
    contractsSigned: 0,
    notes: "Board meeting Thursday. Needs executive-ready materials. Referred by Tom Anderson.",
    createdAt: new Date(Date.now() - 21 * 86_400_000).toISOString(),
  },
  {
    id: "JOB-003",
    company: "HealthBridge",
    contactName: "Dr. Emily Rodriguez",
    contactTitle: "Chief Medical Officer",
    contactEmail: "dr.emily@healthbridge.med",
    contactPhone: "+1 (617) 555-0193",
    industry: "HealthTech",
    source: "cold_outreach",
    stage: "discovery",
    value: 96000,
    probability: 35,
    score: 81,
    priority: "high",
    painPoints: ["patient data sync", "AI diagnostics", "HIPAA compliance"],
    lastActivity: new Date(Date.now() - 18_000_000).toISOString(),
    nextAction: "Schedule 20-min discovery call",
    nextActionDue: new Date(Date.now() + 18 * 3_600_000).toISOString(),
    emailsReceived: 3,
    emailsSent: 4,
    meetingsBooked: 0,
    proposalsSent: 0,
    contractsSigned: 0,
    notes: "Asked 3 specific questions about HIPAA, deployment, timeline. Warm signal.",
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  },
  {
    id: "JOB-004",
    company: "ShipRight Logistics",
    contactName: "James Park",
    contactTitle: "Head of Operations",
    contactEmail: "james.park@shipright.io",
    contactPhone: null,
    industry: "Logistics",
    source: "referral",
    stage: "qualifying",
    value: 62000,
    probability: 25,
    score: 76,
    priority: "medium",
    painPoints: ["route optimization", "real-time tracking"],
    lastActivity: new Date(Date.now() - 21_600_000).toISOString(),
    nextAction: "Send case study (ForgeWorks 37% cost reduction)",
    nextActionDue: new Date(Date.now() + 24 * 3_600_000).toISOString(),
    emailsReceived: 1,
    emailsSent: 2,
    meetingsBooked: 0,
    proposalsSent: 0,
    contractsSigned: 0,
    notes: "Referred by Tom Anderson. 400+ vehicles. Cold intro, warming up.",
    createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  },
  {
    id: "JOB-005",
    company: "EduScale",
    contactName: "Lisa Tran",
    contactTitle: "CEO",
    contactEmail: "lisa.tran@eduscale.com",
    contactPhone: "+1 (512) 555-0177",
    industry: "EdTech",
    source: "linkedin",
    stage: "negotiation",
    value: 84000,
    probability: 85,
    score: 89,
    priority: "critical",
    painPoints: ["content generation", "student analytics", "personalization"],
    lastActivity: new Date(Date.now() - 10_800_000).toISOString(),
    nextAction: "Send onboarding kickoff agenda",
    nextActionDue: new Date(Date.now() + 6 * 3_600_000).toISOString(),
    emailsReceived: 6,
    emailsSent: 5,
    meetingsBooked: 2,
    proposalsSent: 1,
    contractsSigned: 1,
    notes: "Contract signed. Onboarding next week. High-touch handoff.",
    createdAt: new Date(Date.now() - 45 * 86_400_000).toISOString(),
  },
  {
    id: "JOB-006",
    company: "ShopWave",
    contactName: "David Okafor",
    contactTitle: "VP Product",
    contactEmail: "david.okafor@shopwave.com",
    contactPhone: null,
    industry: "E-commerce",
    source: "exa_search",
    stage: "qualifying",
    value: 55000,
    probability: 15,
    score: 84,
    priority: "medium",
    painPoints: ["personalization engine", "cart abandonment"],
    lastActivity: new Date(Date.now() - 72_000_000).toISOString(),
    nextAction: "Send pricing options (usage-based vs flat)",
    nextActionDue: new Date(Date.now() + 12 * 3_600_000).toISOString(),
    emailsReceived: 1,
    emailsSent: 0,
    meetingsBooked: 0,
    proposalsSent: 0,
    contractsSigned: 0,
    notes: "2M MAU. Asked pricing question. Needs response within 24h.",
    createdAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
  },
  {
    id: "JOB-007",
    company: "PropTech AI",
    contactName: "Rachel Kim",
    contactTitle: "Founder",
    contactEmail: "rachel.kim@proptech.ai",
    contactPhone: null,
    industry: "Real Estate",
    source: "scraping_apify",
    stage: "inbox",
    value: 42000,
    probability: 10,
    score: 79,
    priority: "medium",
    painPoints: ["property valuation AI", "lead routing"],
    lastActivity: new Date(Date.now() - 43_200_000).toISOString(),
    nextAction: "Draft strategic partnership response",
    nextActionDue: new Date(Date.now() + 8 * 3_600_000).toISOString(),
    emailsReceived: 1,
    emailsSent: 0,
    meetingsBooked: 0,
    proposalsSent: 0,
    contractsSigned: 0,
    notes: "Partnership inquiry, not pure sale. Needs careful framing.",
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: "JOB-008",
    company: "ForgeWorks",
    contactName: "Tom Anderson",
    contactTitle: "Director of Manufacturing",
    contactEmail: "tom.anderson@forgeworks.com",
    contactPhone: "+1 (216) 555-0114",
    industry: "Manufacturing",
    source: "referral",
    stage: "won",
    value: 120000,
    probability: 100,
    score: 85,
    priority: "critical",
    painPoints: ["predictive maintenance", "IoT data pipeline"],
    lastActivity: new Date(Date.now() - 57_600_000).toISOString(),
    nextAction: "Send Q3 QBR prep materials (uptime, savings, roadmap)",
    nextActionDue: new Date(Date.now() + 36 * 3_600_000).toISOString(),
    emailsReceived: 8,
    emailsSent: 6,
    meetingsBooked: 3,
    proposalsSent: 2,
    contractsSigned: 1,
    notes: "Active client. QBR Wednesday. 37% cost reduction validated.",
    createdAt: new Date(Date.now() - 120 * 86_400_000).toISOString(),
  },
  {
    id: "JOB-009",
    company: "SecureNet",
    contactName: "Aisha Patel",
    contactTitle: "CISO",
    contactEmail: "aisha.patel@securenet.io",
    contactPhone: "+1 (408) 555-0166",
    industry: "Cybersecurity",
    source: "cold_outreach",
    stage: "discovery",
    value: 95000,
    probability: 45,
    score: 91,
    priority: "critical",
    painPoints: ["threat detection", "automated response", "SLA compliance"],
    lastActivity: new Date(Date.now() - 720_000).toISOString(),
    nextAction: "URGENT: jump on call tonight re: 2.4s latency vs 800ms SLA",
    nextActionDue: new Date(Date.now() + 2 * 3_600_000).toISOString(),
    emailsReceived: 2,
    emailsSent: 3,
    meetingsBooked: 1,
    proposalsSent: 0,
    contractsSigned: 0,
    notes: "URGENT: SLA breach. Latency 2.4s vs 800ms. Need immediate response.",
    createdAt: new Date(Date.now() - 18 * 86_400_000).toISOString(),
  },
  {
    id: "JOB-010",
    company: "NeuralScale",
    contactName: "Michael Chang",
    contactTitle: "CTO",
    contactEmail: "michael@neuralscale.ai",
    contactPhone: null,
    industry: "AI/ML",
    source: "linkedin",
    stage: "discovery",
    value: 88000,
    probability: 40,
    score: 88,
    priority: "high",
    painPoints: ["model deployment", "MLOps pipeline", "GPU optimization"],
    lastActivity: new Date(Date.now() - 14_400_000).toISOString(),
    nextAction: "Send MLOps case study + technical deep-dive invite",
    nextActionDue: new Date(Date.now() + 30 * 3_600_000).toISOString(),
    emailsReceived: 2,
    emailsSent: 4,
    meetingsBooked: 0,
    proposalsSent: 0,
    contractsSigned: 0,
    notes: "Strong technical fit. Engaged but hasn't booked call yet.",
    createdAt: new Date(Date.now() - 25 * 86_400_000).toISOString(),
  },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const hrs = Math.round(diff / 3_600_000);
  const mins = Math.round(diff / 60_000);
  if (Math.abs(mins) < 60) return mins < 0 ? `${Math.abs(mins)}m ago` : `in ${mins}m`;
  if (Math.abs(hrs) < 24) return hrs < 0 ? `${Math.abs(hrs)}h ago` : `in ${hrs}h`;
  const days = Math.round(hrs / 24);
  return days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`;
}

function isOverdue(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/* ── Email Lead → Job Conversion ─────────────────────────────────────────── */

function emailToJob(email: EmailLead): Job {
  const company = email.from.split("@")[1]?.split(".")[0] || "Unknown";
  const capitalized = company.charAt(0).toUpperCase() + company.slice(1);
  const value = 30000 + Math.floor(email.categoryScore * 90000);
  const score = Math.floor(email.categoryScore * 100);

  return {
    id: `JOB-EM-${email.id}`,
    company: capitalized,
    contactName: email.fromName,
    contactTitle: "Unknown",
    contactEmail: email.from,
    contactPhone: null,
    industry: "TBD",
    source: "email_inbox",
    stage: email.category === "urgent" ? "discovery" : "inbox",
    value,
    probability: email.category === "urgent" ? 50 : 20,
    score,
    priority: email.category === "urgent" ? "critical" : email.category === "lead" ? "high" : "medium",
    painPoints: [email.subject],
    lastActivity: email.receivedAt,
    nextAction: email.hasReply ? "Follow up on reply" : "Draft initial response",
    nextActionDue: new Date(Date.now() + 6 * 3_600_000).toISOString(),
    emailsReceived: 1,
    emailsSent: email.hasReply ? 1 : 0,
    meetingsBooked: 0,
    proposalsSent: 0,
    contractsSigned: 0,
    notes: email.body.slice(0, 200),
    createdAt: email.receivedAt,
  };
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function JobsTracker() {
  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS);
  const [activeStage, setActiveStage] = useState<JobStage | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Job["priority"] | "all">("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxImported, setInboxImported] = useState(false);
  const [view, setView] = useState<"board" | "list">("board");

  // Import email inbox leads as new jobs
  const importFromInbox = useCallback(async () => {
    setLoadingInbox(true);
    try {
      const res = await fetch("/api/email/inbox", { cache: "no-store" });
      if (!res.ok) throw new Error(`Inbox API ${res.status}`);
      const data = await res.json();
      const emails: EmailLead[] = data.emails || [];
      const newJobs = emails
        .filter((e) => e.category === "lead" || e.category === "client" || e.category === "urgent")
        .filter((e) => !jobs.some((j) => j.contactEmail === e.from))
        .map(emailToJob);
      if (newJobs.length > 0) {
        setJobs((prev) => [...newJobs, ...prev]);
      }
      setInboxImported(true);
    } catch (err) {
      console.error("Inbox import failed:", err);
    } finally {
      setLoadingInbox(false);
    }
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (activeStage !== "all" && job.stage !== activeStage) return false;
      if (priorityFilter !== "all" && job.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !job.company.toLowerCase().includes(q) &&
          !job.contactName.toLowerCase().includes(q) &&
          !job.industry.toLowerCase().includes(q) &&
          !job.notes.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [jobs, activeStage, priorityFilter, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const open = jobs.filter((j) => !["won", "lost"].includes(j.stage));
    const weightedPipeline = open.reduce((sum, j) => sum + j.value * (j.probability / 100), 0);
    const totalValue = open.reduce((sum, j) => sum + j.value, 0);
    const wonValue = jobs.filter((j) => j.stage === "won").reduce((sum, j) => sum + j.value, 0);
    const criticalCount = jobs.filter((j) => j.priority === "critical" && !["won", "lost"].includes(j.stage)).length;
    const overdueActions = open.filter((j) => isOverdue(j.nextActionDue)).length;
    const avgScore = Math.round(open.reduce((sum, j) => sum + j.score, 0) / Math.max(open.length, 1));
    return { openCount: open.length, weightedPipeline, totalValue, wonValue, criticalCount, overdueActions, avgScore };
  }, [jobs]);

  // Stage grouping for board view
  const stageOrder: JobStage[] = ["inbox", "qualifying", "discovery", "proposal", "negotiation", "won"];
  const jobsByStage = useMemo(() => {
    const map: Record<JobStage, Job[]> = {
      inbox: [], qualifying: [], discovery: [], proposal: [], negotiation: [],
      won: [], lost: [], parked: [],
    };
    filteredJobs.forEach((job) => map[job.stage].push(job));
    return map;
  }, [filteredJobs]);

  const moveStage = (jobId: string, newStage: JobStage) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, stage: newStage } : j)));
    if (selectedJob?.id === jobId) {
      setSelectedJob((prev) => prev ? { ...prev, stage: newStage } : prev);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto px-6 md:px-10 py-8 space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Briefcase size={22} style={{ color: "var(--gold)" }} />
          <span
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
          >
            Agency Operations · Jobs Tracker
          </span>
        </div>
        <h1
          className="text-3xl tracking-tight"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}
        >
          Jobs & Opportunities
        </h1>
        <p className="text-[14px] mt-2" style={{ color: "var(--cream-dim)" }}>
          Unified view of every active opportunity across email, LinkedIn, scraping, and referrals.
        </p>
      </motion.header>

      {/* KPIs */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Open Jobs", value: kpis.openCount.toString(), sub: "active opportunities", icon: <Briefcase size={16} />, color: "var(--gold)" },
            { label: "Pipeline Value", value: formatCurrency(kpis.totalValue), sub: "total open", icon: <DollarSign size={16} />, color: "var(--emerald)" },
            { label: "Weighted", value: formatCurrency(kpis.weightedPipeline), sub: "P×value", icon: <Target size={16} />, color: "#22d3ee" },
            { label: "Won (YTD)", value: formatCurrency(kpis.wonValue), sub: "closed-won", icon: <CheckCircle2 size={16} />, color: "#5ab896" },
            { label: "Critical", value: kpis.criticalCount.toString(), sub: "priority alerts", icon: <Flame size={16} />, color: "var(--plum)" },
            { label: "Overdue", value: kpis.overdueActions.toString(), sub: "actions past due", icon: <AlertTriangle size={16} />, color: "#f97316" },
            { label: "Avg Score", value: `${kpis.avgScore}/100`, sub: "lead quality", icon: <Star size={16} />, color: "var(--gold-soft)" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-3 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
                  {kpi.label}
                </span>
              </div>
              <div
                className="text-xl"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: kpi.color }}
              >
                {kpi.value}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--cream-mute)" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Controls */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl p-4 border flex flex-wrap items-center gap-3"
        style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={14} style={{ color: "var(--cream-dim)" }} />
          <input
            type="text"
            placeholder="Search company, contact, industry, notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none flex-1 text-[13px]"
            style={{ color: "var(--cream)", fontFamily: "'Manrope', sans-serif" }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "var(--cream-dim)" }} />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-transparent text-[12px] outline-none px-2 py-1 rounded border"
            style={{ color: "var(--cream)", borderColor: "var(--line-soft)", fontFamily: "'Manrope', sans-serif" }}
          >
            <option value="all">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "var(--bg-mid)" }}>
          <button
            onClick={() => setView("board")}
            className="px-3 py-1 text-[11px] rounded transition-all"
            style={{
              background: view === "board" ? "var(--bg-elev)" : "transparent",
              color: view === "board" ? "var(--gold)" : "var(--cream-dim)",
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 600,
            }}
          >
            Board
          </button>
          <button
            onClick={() => setView("list")}
            className="px-3 py-1 text-[11px] rounded transition-all"
            style={{
              background: view === "list" ? "var(--bg-elev)" : "transparent",
              color: view === "list" ? "var(--gold)" : "var(--cream-dim)",
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 600,
            }}
          >
            List
          </button>
        </div>

        <button
          onClick={importFromInbox}
          disabled={loadingInbox}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all disabled:opacity-50"
          style={{
            background: inboxImported ? "var(--bg-elev)" : "var(--gold)",
            color: inboxImported ? "var(--emerald)" : "var(--bg-deep)",
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            border: inboxImported ? "1px solid var(--emerald)" : "none",
          }}
        >
          {loadingInbox ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {loadingInbox ? "Importing…" : inboxImported ? "Imported from Inbox" : "Import from Email"}
        </button>
      </motion.section>

      {/* Stage Filter Pills */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="flex flex-wrap gap-2"
      >
        <button
          onClick={() => setActiveStage("all")}
          className="px-3 py-1.5 rounded-full text-[11px] transition-all border"
          style={{
            background: activeStage === "all" ? "var(--gold)" : "transparent",
            color: activeStage === "all" ? "var(--bg-deep)" : "var(--cream-dim)",
            borderColor: activeStage === "all" ? "var(--gold)" : "var(--line-soft)",
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
          }}
        >
          All ({jobs.length})
        </button>
        {stageOrder.map((stage) => {
          const count = jobs.filter((j) => j.stage === stage).length;
          const meta = STAGE_META[stage];
          return (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className="px-3 py-1.5 rounded-full text-[11px] transition-all border flex items-center gap-1.5"
              style={{
                background: activeStage === stage ? `${meta.accent}22` : "transparent",
                color: activeStage === stage ? meta.color : "var(--cream-dim)",
                borderColor: activeStage === stage ? meta.color : "var(--line-soft)",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
              }}
            >
              <span style={{ color: meta.color }}>●</span>
              {meta.label} ({count})
            </button>
          );
        })}
      </motion.section>

      {/* Board View */}
      {view === "board" && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="overflow-x-auto pb-4"
        >
          <div className="flex gap-3 min-w-max">
            {stageOrder.map((stage) => {
              const meta = STAGE_META[stage];
              const stageJobs = jobsByStage[stage];
              const stageValue = stageJobs.reduce((sum, j) => sum + j.value, 0);
              return (
                <div
                  key={stage}
                  className="w-[320px] flex-shrink-0 rounded-xl border"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                >
                  {/* Column header */}
                  <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--line-soft)" }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                      <span
                        className="text-[11px] uppercase tracking-wider"
                        style={{ color: meta.color, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                        {stageJobs.length}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: "var(--cream-mute)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatCurrency(stageValue)}
                    </span>
                  </div>

                  {/* Job cards */}
                  <div className="p-2 space-y-2 max-h-[700px] overflow-y-auto">
                    <AnimatePresence>
                      {stageJobs.map((job) => {
                        const overdue = isOverdue(job.nextActionDue) && !["won", "lost"].includes(job.stage);
                        const priorityMeta = PRIORITY_META[job.priority];
                        const sourceMeta = SOURCE_META[job.source];
                        return (
                          <motion.div
                            key={job.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => setSelectedJob(job)}
                            className="rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.02]"
                            style={{
                              background: "var(--bg-mid)",
                              border: `1px solid ${overdue ? "#f97316" : "var(--line-soft)"}`,
                              borderLeft: `3px solid ${priorityMeta.color}`,
                            }}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <Building2 size={11} style={{ color: "var(--cream-dim)" }} />
                                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                                  {sourceMeta.icon}
                                </span>
                              </div>
                              <div
                                className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider"
                                style={{ background: priorityMeta.bg, color: priorityMeta.color, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                              >
                                {priorityMeta.label}
                              </div>
                            </div>

                            <div className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--cream)" }}>
                              {job.company}
                            </div>
                            <div className="text-[11px] mb-2" style={{ color: "var(--cream-dim)" }}>
                              {job.contactName} · {job.contactTitle}
                            </div>

                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className="text-[14px] font-bold"
                                style={{ color: "var(--gold)", fontFamily: "'Bricolage Grotesque', sans-serif" }}
                              >
                                {formatCurrency(job.value)}
                              </span>
                              <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                                {job.probability}% prob
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: "var(--bg-deep)" }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${job.probability}%`, background: meta.color }}
                              />
                            </div>

                            {/* Score badge */}
                            <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--cream-mute)" }}>
                              <span className="flex items-center gap-1">
                                <Star size={9} style={{ color: "var(--gold-soft)" }} />
                                {job.score}
                              </span>
                              <span>·</span>
                              <span className={overdue ? "font-bold" : ""} style={{ color: overdue ? "#f97316" : "var(--cream-mute)" }}>
                                {overdue ? "⚠ " : ""}{formatRelative(job.nextActionDue)}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {stageJobs.length === 0 && (
                      <div className="text-center py-8 text-[11px]" style={{ color: "var(--cream-mute)" }}>
                        No jobs in {meta.label.toLowerCase()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* List View */}
      {view === "list" && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                {["Company", "Contact", "Stage", "Value", "Prob", "Score", "Next Action", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 text-[10px] uppercase tracking-wider"
                    style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const meta = STAGE_META[job.stage];
                const overdue = isOverdue(job.nextActionDue) && !["won", "lost"].includes(job.stage);
                const priorityMeta = PRIORITY_META[job.priority];
                return (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="cursor-pointer transition-colors hover:bg-[var(--bg-mid)]"
                    style={{ borderBottom: "1px solid var(--line-deep)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-8 rounded-full" style={{ background: priorityMeta.color }} />
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>{job.company}</div>
                          <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{job.industry}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[12px]" style={{ color: "var(--cream-soft)" }}>{job.contactName}</div>
                      <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{job.contactTitle}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px]"
                        style={{ background: `${meta.accent}22`, color: meta.color, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: "var(--gold)" }}>
                      {formatCurrency(job.value)}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "var(--cream-dim)" }}>{job.probability}%</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "var(--gold-soft)" }}>{job.score}</td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] max-w-[200px] truncate" style={{ color: "var(--cream-soft)" }}>{job.nextAction}</div>
                      <div className="text-[10px]" style={{ color: overdue ? "#f97316" : "var(--cream-mute)" }}>
                        {overdue ? "⚠ " : ""}{formatRelative(job.nextActionDue)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} style={{ color: "var(--cream-mute)" }} />
                    </td>
                  </tr>
                );
              })}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[12px]" style={{ color: "var(--cream-mute)" }}>
                    No jobs match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.section>
      )}

      {/* Job Detail Drawer */}
      <AnimatePresence>
        {selectedJob && (
          <JobDetailDrawer
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onMoveStage={(newStage) => moveStage(selectedJob.id, newStage)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Detail Drawer ───────────────────────────────────────────────────────── */

function JobDetailDrawer({
  job,
  onClose,
  onMoveStage,
}: {
  job: Job;
  onClose: () => void;
  onMoveStage: (stage: JobStage) => void;
}) {
  const meta = STAGE_META[job.stage];
  const priorityMeta = PRIORITY_META[job.priority];
  const overdue = isOverdue(job.nextActionDue);
  const sourceMeta = SOURCE_META[job.source];
  const weightedValue = job.value * (job.probability / 100);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(21,16,26,0.7)", backdropFilter: "blur(6px)" }}
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full md:w-[520px] z-50 overflow-y-auto"
        style={{
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--line-soft)",
          boxShadow: "var(--shadow-2)",
        }}
      >
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider"
                  style={{ background: priorityMeta.bg, color: priorityMeta.color, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                >
                  {priorityMeta.label}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px]"
                  style={{ background: `${meta.accent}22`, color: meta.color, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                >
                  {meta.label}
                </span>
              </div>
              <h2 className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
                {job.company}
              </h2>
              <p className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
                {sourceMeta.icon} {sourceMeta.label} · {job.industry}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--bg-mid)]"
              style={{ color: "var(--cream-dim)" }}
            >
              <XCircle size={18} />
            </button>
          </div>

          {/* Value block */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg p-3" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Value</div>
              <div className="text-xl font-bold" style={{ color: "var(--gold)" }}>{formatCurrency(job.value)}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Probability</div>
              <div className="text-xl font-bold" style={{ color: meta.color }}>{job.probability}%</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Weighted</div>
              <div className="text-xl font-bold" style={{ color: "var(--emerald)" }}>{formatCurrency(weightedValue)}</div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-lg p-4" style={{ background: "var(--bg-mid)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Primary Contact</div>
            <div className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{job.contactName}</div>
            <div className="text-[12px] mb-2" style={{ color: "var(--cream-dim)" }}>{job.contactTitle}</div>
            <div className="space-y-1">
              {job.contactEmail && (
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--cream-soft)" }}>
                  <Mail size={11} style={{ color: "var(--gold)" }} />
                  {job.contactEmail}
                </div>
              )}
              {job.contactPhone && (
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--cream-soft)" }}>
                  <Phone size={11} style={{ color: "var(--gold)" }} />
                  {job.contactPhone}
                </div>
              )}
            </div>
          </div>

          {/* Pain points */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Pain Points</div>
            <div className="flex flex-wrap gap-1.5">
              {job.painPoints.map((pp) => (
                <span
                  key={pp}
                  className="px-2 py-1 rounded text-[11px]"
                  style={{ background: "var(--bg-mid)", color: "var(--cream-soft)", border: "1px solid var(--line-soft)" }}
                >
                  {pp}
                </span>
              ))}
            </div>
          </div>

          {/* Score */}
          <div className="rounded-lg p-4" style={{ background: "var(--bg-mid)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>Composite Score</div>
              <div className="text-[20px] font-bold" style={{ color: "var(--gold-soft)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {job.score}/100
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-deep)" }}>
              <div className="h-full rounded-full" style={{ width: `${job.score}%`, background: "linear-gradient(90deg, var(--gold), var(--emerald))" }} />
            </div>
          </div>

          {/* Activity stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Received", value: job.emailsReceived },
              { label: "Sent", value: job.emailsSent },
              { label: "Meetings", value: job.meetingsBooked },
              { label: "Proposals", value: job.proposalsSent },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg p-2 text-center" style={{ background: "var(--bg-mid)" }}>
                <div className="text-[16px] font-bold" style={{ color: "var(--gold)" }}>{stat.value}</div>
                <div className="text-[10px] uppercase" style={{ color: "var(--cream-mute)" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Next action */}
          <div
            className="rounded-lg p-4 border-l-4"
            style={{
              background: overdue ? "rgba(249,115,22,0.08)" : "var(--bg-mid)",
              borderColor: overdue ? "#f97316" : "var(--emerald)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} style={{ color: overdue ? "#f97316" : "var(--emerald)" }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: overdue ? "#f97316" : "var(--emerald)" }}>
                {overdue ? "⚠ Overdue Action" : "Next Action"}
              </span>
            </div>
            <div className="text-[13px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{job.nextAction}</div>
            <div className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
              Due {formatRelative(job.nextActionDue)} · Last activity {formatRelative(job.lastActivity)}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Notes</div>
            <div
              className="rounded-lg p-3 text-[12px] leading-relaxed"
              style={{ background: "var(--bg-mid)", color: "var(--cream-soft)" }}
            >
              {job.notes}
            </div>
          </div>

          {/* Move stage controls */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Move to Stage</div>
            <div className="grid grid-cols-2 gap-2">
              {(["inbox", "qualifying", "discovery", "proposal", "negotiation", "won", "lost", "parked"] as JobStage[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onMoveStage(s)}
                  className="px-3 py-2 rounded-lg text-[11px] transition-all border"
                  style={{
                    background: job.stage === s ? `${STAGE_META[s].accent}22` : "transparent",
                    color: job.stage === s ? STAGE_META[s].color : "var(--cream-dim)",
                    borderColor: job.stage === s ? STAGE_META[s].color : "var(--line-soft)",
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {STAGE_META[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px]"
              style={{
                background: "var(--gold)",
                color: "var(--bg-deep)",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
              }}
            >
              <Send size={13} />
              Draft Reply
            </button>
            <button
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px] border"
              style={{
                background: "transparent",
                color: "var(--cream-soft)",
                borderColor: "var(--line)",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
              }}
            >
              <Calendar size={13} />
              Schedule Meeting
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}