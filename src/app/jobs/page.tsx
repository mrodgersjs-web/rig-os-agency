"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Target, MapPin, DollarSign, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, XCircle, Filter, RefreshCw,
  Building2, Phone, Calendar, ExternalLink, ArrowUpRight, Search, Sparkles,
  ChevronRight, Flame, Star, Eye, Edit3, Send, Zap, Globe,
  Mail, Trophy, Plus, X as XIcon, FileText,
} from "lucide-react";
import type { JobApplication, JobStatus, JobPriority } from "@/lib/agency-types";

/* ── Status → UX Stage mapping ─────────────────────────────────────────── */
// Real statuses (saved/applied/phone_screen/interview/final_round/offer/accepted/rejected/withdrawn)
// fold into 6 board lanes (inbox → won) plus a lost bucket.
type StageId = "inbox" | "applied" | "qualifying" | "interview" | "final_round" | "offer" | "won" | "lost";

const STAGE_META: Record<StageId, { label: string; color: string; accent: string; statuses: JobStatus[] }> = {
  inbox:        { label: "Saved",          color: "#a59783", accent: "var(--cream-dim)", statuses: ["saved"] },
  applied:      { label: "Applied",        color: "#7dd3fc", accent: "#7dd3fc",           statuses: ["applied"] },
  qualifying:   { label: "Phone Screen",   color: "#fbbf24", accent: "var(--gold)",        statuses: ["phone_screen"] },
  interview:    { label: "Interview",      color: "#c084fc", accent: "#c084fc",           statuses: ["interview"] },
  final_round:  { label: "Final Round",    color: "#f97316", accent: "#f97316",           statuses: ["final_round"] },
  offer:        { label: "Offer",          color: "#22d3ee", accent: "#22d3ee",           statuses: ["offer"] },
  won:          { label: "Won",            color: "#5ab896", accent: "var(--emerald)",    statuses: ["accepted"] },
  lost:         { label: "Rejected",       color: "#ef4444", accent: "#ef4444",           statuses: ["rejected", "withdrawn"] },
};

const STATUS_LABEL: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview: "Interview",
  final_round: "Final Round",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const PRIORITY_META: Record<JobPriority, { color: string; bg: string; label: string }> = {
  low:    { color: "#6e6353", bg: "rgba(110,99,83,0.15)",   label: "Low" },
  medium: { color: "#d4a574", bg: "rgba(212,165,116,0.15)", label: "Medium" },
  high:   { color: "#f97316", bg: "rgba(249,115,22,0.15)",  label: "High" },
  urgent: { color: "#c4607e", bg: "rgba(196,96,126,0.18)",  label: "Urgent" },
};

const BOARD_STAGES: StageId[] = ["inbox", "applied", "qualifying", "interview", "final_round", "offer", "won"];

function statusToStage(status: JobStatus): StageId {
  for (const [stage, meta] of Object.entries(STAGE_META) as [StageId, typeof STAGE_META[StageId]][]) {
    if (meta.statuses.includes(status)) return stage;
  }
  return "inbox";
}

function stageOrderIndex(stage: StageId): number {
  return BOARD_STAGES.indexOf(stage);
}

function formatSalary(min: number | null, max: number | null, note: string): string {
  if (min == null && max == null) return note || "Salary TBD";
  const fmt = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  if (max != null) return `up to ${fmt(max)}`;
  return "—";
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const days = Math.round(absDiff / 86_400_000);
  const hrs = Math.round(absDiff / 3_600_000);
  if (days >= 1) return diff < 0 ? `${days}d ago` : `in ${days}d`;
  if (hrs >= 1) return diff < 0 ? `${hrs}h ago` : `in ${hrs}h`;
  const mins = Math.round(absDiff / 60_000);
  return diff < 0 ? `${mins}m ago` : `in ${mins}m`;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.round(diff / 86_400_000);
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

/* ── Main Component ────────────────────────────────────────────────────── */

export default function JobsTracker() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<StageId | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | "all">("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await fetch("/api/agency/jobs", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setJobs(data.jobs || []);
      setLastFetch(new Date());
    } catch {
      // fall back to empty list, not seed data
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(() => load(true), 60_000);
    return () => clearInterval(i);
  }, [load]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (activeStage !== "all" && statusToStage(job.status) !== activeStage) return false;
      if (priorityFilter !== "all" && job.priority !== priorityFilter) return false;
      if (remoteOnly && !job.remote) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !job.company.toLowerCase().includes(q) &&
          !job.role.toLowerCase().includes(q) &&
          !job.location.toLowerCase().includes(q) &&
          !job.notes.toLowerCase().includes(q) &&
          !job.contactName.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [jobs, activeStage, priorityFilter, remoteOnly, searchQuery]);

  const kpis = useMemo(() => {
    const open = jobs.filter((j) => !["rejected", "withdrawn"].includes(j.status));
    const urgentCount = jobs.filter((j) => j.priority === "urgent" && !["rejected", "withdrawn", "accepted"].includes(j.status)).length;
    const offerCount = jobs.filter((j) => j.status === "offer").length;
    const finalRoundCount = jobs.filter((j) => j.status === "final_round").length;
    const wonCount = jobs.filter((j) => j.status === "accepted").length;
    const rejectedCount = jobs.filter((j) => j.status === "rejected").length;
    const overdueDeadlines = jobs.filter((j) => j.deadline && isOverdue(j.deadline) && !["rejected", "withdrawn", "accepted"].includes(j.status)).length;

    // Total target salary
    const totalPotential = open.reduce((sum, j) => {
      return sum + (j.salaryMax ?? j.salaryMin ?? 0);
    }, 0);

    // Recent activity (last 7 days)
    const weekAgo = Date.now() - 7 * 86_400_000;
    const recentActivity = jobs.filter((j) => new Date(j.updatedAt).getTime() > weekAgo).length;

    return {
      openCount: open.length,
      totalCount: jobs.length,
      urgentCount,
      offerCount,
      finalRoundCount,
      wonCount,
      rejectedCount,
      overdueDeadlines,
      totalPotential,
      recentActivity,
    };
  }, [jobs]);

  const jobsByStage = useMemo(() => {
    const map: Record<StageId, JobApplication[]> = {
      inbox: [], applied: [], qualifying: [], interview: [],
      final_round: [], offer: [], won: [], lost: [],
    };
    filteredJobs.forEach((job) => {
      map[statusToStage(job.status)].push(job);
    });
    return map;
  }, [filteredJobs]);

  const moveStatus = async (jobId: string, newStatus: JobStatus) => {
    // optimistic update
    const previous = jobs;
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus, updatedAt: new Date().toISOString() } : j)));
    if (selectedJob?.id === jobId) {
      setSelectedJob((prev) => prev ? { ...prev, status: newStatus } : prev);
    }
    try {
      await fetch("/api/agency/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: newStatus }),
      });
    } catch {
      setJobs(previous);
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-3xl tracking-tight"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}
            >
              Jobs & Opportunities
            </h1>
            <p className="text-[14px] mt-2" style={{ color: "var(--cream-dim)" }}>
              {jobs.length === 0 && !loading
                ? "No job applications yet. Add one to start tracking opportunities."
                : `${kpis.openCount} open · ${kpis.wonCount} won · ${kpis.rejectedCount} rejected · live data from /api/agency/jobs`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--cream-mute)" }}>
            {lastFetch && (
              <>
                <Clock size={11} />
                <span>Updated {formatRelative(lastFetch.toISOString())}</span>
              </>
            )}
            <button
              onClick={() => load()}
              disabled={loading}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] disabled:opacity-50"
              style={{
                background: "var(--bg-card)",
                color: "var(--cream-soft)",
                border: "1px solid var(--line-soft)",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
              }}
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </motion.header>

      {/* KPIs */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total Tracked", value: kpis.totalCount.toString(), sub: "all-time applications", icon: <Briefcase size={16} />, color: "var(--cream)" },
            { label: "Open", value: kpis.openCount.toString(), sub: "active opportunities", icon: <Target size={16} />, color: "var(--gold)" },
            { label: "Urgent", value: kpis.urgentCount.toString(), sub: "priority alerts", icon: <Flame size={16} />, color: "var(--plum)" },
            { label: "Final Round", value: kpis.finalRoundCount.toString(), sub: "close to offer", icon: <Star size={16} />, color: "#f97316" },
            { label: "Offers", value: kpis.offerCount.toString(), sub: "received offers", icon: <Trophy size={16} />, color: "#22d3ee" },
            { label: "Won (Accepted)", value: kpis.wonCount.toString(), sub: "signed deals", icon: <CheckCircle2 size={16} />, color: "var(--emerald)" },
            { label: "Overdue Deadlines", value: kpis.overdueDeadlines.toString(), sub: "past due", icon: <AlertTriangle size={16} />, color: "#ef4444" },
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
            placeholder="Search company, role, contact, notes…"
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
            onChange={(e) => setPriorityFilter(e.target.value as JobPriority | "all")}
            className="bg-transparent text-[12px] outline-none px-2 py-1 rounded border"
            style={{ color: "var(--cream)", borderColor: "var(--line-soft)", fontFamily: "'Manrope', sans-serif" }}
          >
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <button
          onClick={() => setRemoteOnly(!remoteOnly)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] border"
          style={{
            background: remoteOnly ? "var(--gold)" : "transparent",
            color: remoteOnly ? "var(--bg-deep)" : "var(--cream-dim)",
            borderColor: remoteOnly ? "var(--gold)" : "var(--line-soft)",
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
          }}
        >
          <Globe size={11} />
          Remote only
        </button>

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
        {BOARD_STAGES.map((stage) => {
          const count = jobs.filter((j) => statusToStage(j.status) === stage).length;
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
        {(kpis.rejectedCount > 0 || jobs.some((j) => j.status === "withdrawn")) && (
          <button
            onClick={() => setActiveStage("lost")}
            className="px-3 py-1.5 rounded-full text-[11px] transition-all border flex items-center gap-1.5"
            style={{
              background: activeStage === "lost" ? `${STAGE_META.lost.accent}22` : "transparent",
              color: activeStage === "lost" ? STAGE_META.lost.color : "var(--cream-dim)",
              borderColor: activeStage === "lost" ? STAGE_META.lost.color : "var(--line-soft)",
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 600,
            }}
          >
            <span style={{ color: STAGE_META.lost.color }}>●</span>
            Rejected/Withdrawn ({kpis.rejectedCount + jobs.filter((j) => j.status === "withdrawn").length})
          </button>
        )}
      </motion.section>

      {/* Loading State */}
      {loading && jobs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl p-12 border text-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <RefreshCw size={32} className="animate-spin mx-auto mb-3" style={{ color: "var(--gold)" }} />
          <div className="text-[13px]" style={{ color: "var(--cream-dim)" }}>Loading jobs from /api/agency/jobs…</div>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl p-12 border text-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <Briefcase size={48} className="mx-auto mb-3" style={{ color: "var(--cream-mute)" }} />
          <h3 className="text-[16px] font-semibold mb-1" style={{ color: "var(--cream)" }}>
            No jobs tracked yet
          </h3>
          <p className="text-[13px] mb-4" style={{ color: "var(--cream-dim)" }}>
            Job applications are persisted via POST /api/agency/jobs. Add one to see it here.
          </p>
          <code
            className="inline-block px-3 py-2 rounded-lg text-[11px]"
            style={{ background: "var(--bg-deep)", color: "var(--gold)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            POST /api/agency/jobs {`{ company, role, status, priority, ... }`}
          </code>
        </motion.div>
      )}

      {/* Board View */}
      {!loading && jobs.length > 0 && view === "board" && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="overflow-x-auto pb-4"
        >
          <div className="flex gap-3 min-w-max">
            {BOARD_STAGES.map((stage) => {
              const meta = STAGE_META[stage];
              const stageJobs = jobsByStage[stage];
              const stageTarget = stageJobs.reduce((sum, j) => sum + (j.salaryMax ?? j.salaryMin ?? 0), 0);
              return (
                <div
                  key={stage}
                  className="w-[300px] flex-shrink-0 rounded-xl border"
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
                    {stageTarget > 0 && (
                      <span className="text-[10px]" style={{ color: "var(--cream-mute)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatSalary(null, stageTarget, "")}
                      </span>
                    )}
                  </div>

                  {/* Job cards */}
                  <div className="p-2 space-y-2 max-h-[700px] overflow-y-auto">
                    <AnimatePresence>
                      {stageJobs.map((job) => {
                        const priorityMeta = PRIORITY_META[job.priority];
                        const overdueDeadline = job.deadline && isOverdue(job.deadline);
                        const days = daysUntil(job.deadline);
                        const isUrgent = overdueDeadline || (days !== null && days <= 7);
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
                              border: `1px solid ${isUrgent ? "#f97316" : "var(--line-soft)"}`,
                              borderLeft: `3px solid ${priorityMeta.color}`,
                            }}
                          >
                            <div className="flex items-start justify-between mb-1.5 gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Building2 size={11} style={{ color: "var(--cream-dim)", flexShrink: 0 }} />
                                <span className="text-[10px] truncate" style={{ color: "var(--cream-mute)" }}>
                                  {job.source}
                                </span>
                              </div>
                              <div
                                className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider flex-shrink-0"
                                style={{ background: priorityMeta.bg, color: priorityMeta.color, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                              >
                                {priorityMeta.label}
                              </div>
                            </div>

                            <div className="text-[13px] font-semibold mb-0.5 truncate" style={{ color: "var(--cream)" }}>
                              {job.company}
                            </div>
                            <div className="text-[11px] mb-2 truncate" style={{ color: "var(--cream-dim)" }}>
                              {job.role}
                            </div>

                            <div className="flex items-center justify-between mb-1.5 gap-2">
                              <span
                                className="text-[12px] font-bold truncate"
                                style={{ color: "var(--gold)", fontFamily: "'Bricolage Grotesque', sans-serif" }}
                              >
                                {formatSalary(job.salaryMin, job.salaryMax, job.salaryNote)}
                              </span>
                              {job.remote && (
                                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(125,211,252,0.12)", color: "#7dd3fc" }}>
                                  Remote
                                </span>
                              )}
                            </div>

                            {/* Deadline */}
                            {job.deadline && (
                              <div className="text-[10px] mb-1.5 flex items-center gap-1" style={{ color: overdueDeadline ? "#f97316" : days !== null && days <= 7 ? "#fbbf24" : "var(--cream-mute)" }}>
                                <Calendar size={9} />
                                {overdueDeadline ? "⚠ " : ""}
                                {days !== null && days >= 0 ? `${days}d to deadline` : `${Math.abs(days || 0)}d overdue`}
                              </div>
                            )}

                            {/* Meta row */}
                            <div className="flex items-center gap-2 text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>
                              {job.location && (
                                <span className="flex items-center gap-0.5 truncate">
                                  <MapPin size={9} />
                                  {job.location}
                                </span>
                              )}
                            </div>

                            {/* Updated ago */}
                            <div className="text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>
                              Updated {formatRelative(job.updatedAt)}
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
      {!loading && jobs.length > 0 && view === "list" && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  {["Company", "Role", "Status", "Salary", "Priority", "Deadline", "Source", ""].map((h) => (
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
                  const meta = STAGE_META[statusToStage(job.status)];
                  const priorityMeta = PRIORITY_META[job.priority];
                  const overdueDeadline = job.deadline && isOverdue(job.deadline);
                  const days = daysUntil(job.deadline);
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--line-deep)" }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-8 rounded-full" style={{ background: priorityMeta.color }} />
                          <div>
                            <div className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>{job.company}</div>
                            <div className="text-[10px] flex items-center gap-1" style={{ color: "var(--cream-mute)" }}>
                              <MapPin size={9} />
                              {job.location}
                              {job.remote && " · Remote"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px]" style={{ color: "var(--cream-soft)" }}>{job.role}</div>
                        {job.contactName && (
                          <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{job.contactName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px]"
                          style={{ background: `${meta.accent}22`, color: meta.color, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                        >
                          {STATUS_LABEL[job.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: "var(--gold)" }}>
                        {formatSalary(job.salaryMin, job.salaryMax, job.salaryNote)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] uppercase"
                          style={{ background: priorityMeta.bg, color: priorityMeta.color, fontWeight: 700 }}
                        >
                          {priorityMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {job.deadline ? (
                          <div className="text-[11px]" style={{ color: overdueDeadline ? "#f97316" : days !== null && days <= 7 ? "#fbbf24" : "var(--cream-dim)" }}>
                            {overdueDeadline ? "⚠ " : ""}
                            {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        ) : (
                          <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: "var(--cream-dim)" }}>{job.source}</td>
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
          </div>
        </motion.section>
      )}

      {/* Job Detail Drawer */}
      <AnimatePresence>
        {selectedJob && (
          <JobDetailDrawer
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onMoveStatus={(newStatus) => moveStatus(selectedJob.id, newStatus)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Detail Drawer ─────────────────────────────────────────────────────── */

function JobDetailDrawer({
  job,
  onClose,
  onMoveStatus,
}: {
  job: JobApplication;
  onClose: () => void;
  onMoveStatus: (status: JobStatus) => void;
}) {
  const stage = statusToStage(job.status);
  const meta = STAGE_META[stage];
  const priorityMeta = PRIORITY_META[job.priority];
  const overdueDeadline = job.deadline && isOverdue(job.deadline);
  const days = daysUntil(job.deadline);

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
        className="fixed top-0 right-0 h-full w-full md:w-[560px] z-50 overflow-y-auto"
        style={{
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--line-soft)",
          boxShadow: "var(--shadow-2)",
        }}
      >
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider"
                  style={{ background: priorityMeta.bg, color: priorityMeta.color, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                >
                  {priorityMeta.label} Priority
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px]"
                  style={{ background: `${meta.accent}22`, color: meta.color, fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}
                >
                  {STATUS_LABEL[job.status]}
                </span>
                {job.remote && (
                  <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: "rgba(125,211,252,0.12)", color: "#7dd3fc" }}>
                    Remote
                  </span>
                )}
              </div>
              <h2 className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
                {job.company}
              </h2>
              <p className="text-[13px]" style={{ color: "var(--cream-dim)" }}>
                {job.role}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--bg-mid)] flex-shrink-0"
              style={{ color: "var(--cream-dim)" }}
            >
              <XIcon size={18} />
            </button>
          </div>

          {/* Salary block */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg p-3" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Salary Min</div>
              <div className="text-lg font-bold" style={{ color: "var(--gold)" }}>
                {job.salaryMin ? `$${(job.salaryMin / 1000).toFixed(0)}K` : "—"}
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Salary Max</div>
              <div className="text-lg font-bold" style={{ color: "var(--gold)" }}>
                {job.salaryMax ? `$${(job.salaryMax / 1000).toFixed(0)}K` : "—"}
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Midpoint</div>
              <div className="text-lg font-bold" style={{ color: "var(--emerald)" }}>
                {job.salaryMin && job.salaryMax
                  ? `$${Math.round((job.salaryMin + job.salaryMax) / 2 / 1000)}K`
                  : "—"}
              </div>
            </div>
          </div>

          {job.salaryNote && (
            <div className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
              <span style={{ color: "var(--cream-mute)" }}>Comp note: </span>{job.salaryNote}
            </div>
          )}

          {/* Location + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Location</div>
              <div className="text-[13px] flex items-center gap-1.5" style={{ color: "var(--cream-soft)" }}>
                <MapPin size={11} style={{ color: "var(--gold)" }} />
                {job.location || "—"}
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Source</div>
              <div className="text-[13px]" style={{ color: "var(--cream-soft)" }}>{job.source}</div>
            </div>
          </div>

          {/* Contact */}
          {job.contactName && (
            <div className="rounded-lg p-4" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Primary Contact</div>
              <div className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{job.contactName}</div>
              <div className="space-y-1 mt-2">
                {job.contactEmail && (
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--cream-soft)" }}>
                    <Mail size={11} style={{ color: "var(--gold)" }} />
                    {job.contactEmail}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: "var(--bg-mid)" }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Applied</div>
              <div className="text-[12px]" style={{ color: "var(--cream-soft)" }}>
                {job.appliedDate ? new Date(job.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not yet"}
              </div>
            </div>
            <div
              className="rounded-lg p-3"
              style={{
                background: overdueDeadline ? "rgba(239,68,68,0.08)" : days !== null && days <= 7 ? "rgba(251,191,36,0.08)" : "var(--bg-mid)",
                borderLeft: overdueDeadline ? "3px solid #ef4444" : days !== null && days <= 7 ? "3px solid #fbbf24" : "none",
              }}
            >
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Deadline</div>
              <div className="text-[12px]" style={{ color: overdueDeadline ? "#ef4444" : days !== null && days <= 7 ? "#fbbf24" : "var(--cream-soft)" }}>
                {job.deadline ? (
                  <>
                    {overdueDeadline ? "⚠ " : ""}
                    {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    <span className="ml-2 text-[10px]" style={{ color: "var(--cream-mute)" }}>
                      ({days !== null && days >= 0 ? `${days}d` : `${Math.abs(days || 0)}d ago`})
                    </span>
                  </>
                ) : "—"}
              </div>
            </div>
          </div>

          {/* Job URL */}
          {job.jobUrl && (
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg p-3 transition-all hover:scale-[1.01]"
              style={{
                background: "var(--bg-mid)",
                border: "1px solid var(--line-soft)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <ExternalLink size={12} style={{ color: "var(--gold)", flexShrink: 0 }} />
                <span className="text-[12px] truncate" style={{ color: "var(--cream-soft)" }}>
                  {job.jobUrl}
                </span>
              </div>
              <ArrowUpRight size={12} style={{ color: "var(--gold)", flexShrink: 0 }} />
            </a>
          )}

          {/* Notes */}
          {job.notes && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Notes</div>
              <div
                className="rounded-lg p-3 text-[12px] leading-relaxed"
                style={{ background: "var(--bg-mid)", color: "var(--cream-soft)" }}
              >
                {job.notes}
              </div>
            </div>
          )}

          {/* Move status controls */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--cream-mute)" }}>Update Status</div>
            <div className="grid grid-cols-3 gap-2">
              {(["saved", "applied", "phone_screen", "interview", "final_round", "offer", "accepted", "rejected", "withdrawn"] as JobStatus[]).map((s) => {
                const sMeta = STAGE_META[statusToStage(s)];
                const isCurrent = job.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => onMoveStatus(s)}
                    className="px-3 py-2 rounded-lg text-[11px] transition-all border"
                    style={{
                      background: isCurrent ? `${sMeta.accent}22` : "transparent",
                      color: isCurrent ? sMeta.color : "var(--cream-dim)",
                      borderColor: isCurrent ? sMeta.color : "var(--line-soft)",
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meta footer */}
          <div className="text-[10px] pt-3 border-t" style={{ color: "var(--cream-mute)", borderColor: "var(--line-soft)" }}>
            Created {new Date(job.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            {" · "}
            Updated {formatRelative(job.updatedAt)}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {job.contactEmail && (
              <a
                href={`mailto:${job.contactEmail}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px]"
                style={{
                  background: "var(--gold)",
                  color: "var(--bg-deep)",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <Send size={13} />
                Email Contact
              </a>
            )}
            {job.jobUrl && (
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px] border"
                style={{
                  background: "transparent",
                  color: "var(--cream-soft)",
                  borderColor: "var(--line)",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={13} />
                View Posting
              </a>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}