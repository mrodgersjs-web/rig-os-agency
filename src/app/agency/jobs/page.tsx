"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, MapPin, DollarSign, Clock, ExternalLink,
  Plus, Trash2, X, Loader2, AlertCircle, TrendingUp,
  Target, Flame, CheckCircle2, Calendar,
} from "lucide-react";

interface JobApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNote: string;
  jobUrl: string;
  status: string;
  priority: string;
  appliedDate: string | null;
  deadline: string | null;
  contactName: string;
  contactEmail: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STAGES = [
  { id: "saved", label: "Saved", color: "#6b7280" },
  { id: "applied", label: "Applied", color: "#5ab896" },
  { id: "phone_screen", label: "Phone Screen", color: "#22d3ee" },
  { id: "interview", label: "Interview", color: "#fbbf24" },
  { id: "final_round", label: "Final Round", color: "#f97316" },
  { id: "offer", label: "Offer", color: "#5ab896" },
  { id: "accepted", label: "Accepted", color: "#22c55e" },
  { id: "rejected", label: "Rejected", color: "#ef4444" },
  { id: "withdrawn", label: "Withdrawn", color: "#6b7280" },
];

const PRIORITY_META: Record<string, { color: string }> = {
  urgent: { color: "#ef4444" },
  high: { color: "#f97316" },
  medium: { color: "#fbbf24" },
  low: { color: "#6b7280" },
};

const ALL_STATUSES = STAGES.map((s) => s.id);
const ALL_PRIORITIES = ["urgent", "high", "medium", "low"];

function formatSalary(min: number | null, max: number | null): string {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `up to ${fmt(max)}`;
  return "—";
}

function daysUntil(dateStr: string): number {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  return Math.ceil((target - now) / 86400000);
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/jobs");
      const d = await res.json();
      setJobs(d.jobs || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Stats
  const activeJobs = jobs.filter((j) => !["rejected", "withdrawn", "accepted"].includes(j.status));
  const interviewStage = jobs.filter((j) =>
    ["phone_screen", "interview", "final_round"].includes(j.status)
  );
  const offers = jobs.filter((j) => j.status === "offer");
  const accepted = jobs.filter((j) => j.status === "accepted");
  const responseRate = jobs.length > 0
    ? Math.round((interviewStage.length + offers.length + accepted.length) / jobs.filter((j) => j.status !== "saved").length * 100)
    : 0;
  const upcomingDeadlines = activeJobs
    .filter((j) => j.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  const filteredJobs = filterPriority === "all"
    ? jobs
    : jobs.filter((j) => j.priority === filterPriority);

  async function updateStatus(id: string, status: string) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    try {
      await fetch("/api/agency/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch (e) {
      console.error(e);
      loadJobs();
    }
  }

  async function deleteJob(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    try {
      await fetch(`/api/agency/jobs?id=${id}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#5ab896" }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Briefcase size={22} style={{ color: "var(--gold)" }} />
            <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
              Agency Operations
            </span>
          </div>
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
            Jobs Applied Tracker
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
            Track outbound opportunities, client pitches, and retainer proposals in one pipeline
          </p>
        </div>
        <button
          onClick={() => { setEditingJob(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: "var(--gold)", color: "#1a1a2e", fontWeight: 600, fontSize: 14 }}
        >
          <Plus size={18} />
          Add Job
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Tracked", value: jobs.length, icon: Briefcase, accent: "var(--gold)" },
          { label: "Active Pipeline", value: activeJobs.length, icon: Target, accent: "var(--emerald)" },
          { label: "In Interview", value: interviewStage.length, icon: Clock, accent: "var(--gold)" },
          { label: "Offers", value: offers.length, icon: CheckCircle2, accent: "var(--plum)" },
          { label: "Response Rate", value: `${responseRate}%`, icon: TrendingUp, accent: "var(--emerald)" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon size={16} style={{ color: kpi.accent }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--cream)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {kpi.value}
            </div>
            <div className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="rounded-xl p-4 border mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} style={{ color: "var(--gold)" }} />
            <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
              Upcoming Deadlines
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingDeadlines.map((job) => {
              const days = daysUntil(job.deadline!);
              const urgent = days <= 3;
              return (
                <div
                  key={job.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px]"
                  style={{
                    background: urgent ? "rgba(239,68,68,0.1)" : "rgba(212,165,116,0.08)",
                    border: `1px solid ${urgent ? "rgba(239,68,68,0.3)" : "rgba(212,165,116,0.2)"}`,
                    color: urgent ? "#ef4444" : "var(--cream)",
                  }}
                >
                  <span className="font-medium">{job.company}</span>
                  <span style={{ color: urgent ? "#ef4444" : "var(--cream-dim)" }}>
                    {days === 0 ? "today!" : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Priority Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Priority:</span>
        {["all", ...ALL_PRIORITIES].map((p) => {
          const meta = p === "all" ? { color: "var(--cream-dim)" } : PRIORITY_META[p];
          const active = filterPriority === p;
          return (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className="px-3 py-1 rounded-md text-[11px] uppercase tracking-wider transition-all"
              style={{
                background: active ? `${meta.color}20` : "transparent",
                border: `1px solid ${active ? meta.color : "var(--line-soft)"}`,
                color: active ? meta.color : "var(--cream-dim)",
                fontWeight: 600,
              }}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3" style={{ minWidth: 0 }}>
        {STAGES.slice(0, 5).map((stage) => {
          const stageJobs = filteredJobs
            .filter((j) => j.status === stage.id)
            .sort((a, b) => {
              const pri = ALL_PRIORITIES.indexOf(a.priority) - ALL_PRIORITIES.indexOf(b.priority);
              if (pri !== 0) return pri;
              const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
              const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
              return ad - bd;
            });

          return (
            <div key={stage.id} className="flex flex-col" style={{ minWidth: 0 }}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                  <span className="text-[12px] font-semibold" style={{ color: "var(--cream)" }}>
                    {stage.label}
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>{stageJobs.length}</span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2" style={{ minHeight: 60 }}>
                <AnimatePresence mode="popLayout">
                  {stageJobs.map((job) => {
                    const meta = PRIORITY_META[job.priority] || PRIORITY_META.medium;
                    const daysLeft = job.deadline ? daysUntil(job.deadline) : null;
                    return (
                      <motion.div
                        key={job.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg p-3 border cursor-pointer group"
                        style={{
                          background: "var(--bg-card)",
                          borderColor: "var(--line-soft)",
                          borderLeft: `3px solid ${meta.color}`,
                        }}
                        onClick={() => { setEditingJob(job); setShowForm(true); }}
                      >
                        {/* Company + Priority */}
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-[13px] font-semibold leading-tight" style={{ color: "var(--cream)" }}>
                            {job.company}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteJob(job.id); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "var(--cream-dim)" }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Role */}
                        <p className="text-[12px] mb-2" style={{ color: "var(--cream-dim)" }}>
                          {job.role}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {job.remote && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(90,184,150,0.1)", color: "#5ab896", fontWeight: 600 }}>
                              REMOTE
                            </span>
                          )}
                          {job.location && !job.remote && (
                            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(212,165,116,0.1)", color: "#d4a574" }}>
                              <MapPin size={8} /> {job.location.split(",")[0]}
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${meta.color}15`, color: meta.color, fontWeight: 600, textTransform: "uppercase" }}>
                            {job.priority}
                          </span>
                        </div>

                        {/* Salary */}
                        {(job.salaryMin || job.salaryMax) && (
                          <div className="flex items-center gap-1 mb-1.5 text-[11px]" style={{ color: "var(--cream-mute)" }}>
                            <DollarSign size={10} />
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </div>
                        )}

                        {/* Deadline */}
                        {daysLeft !== null && (
                          <div
                            className="flex items-center gap-1 text-[10px] font-medium"
                            style={{ color: daysLeft <= 3 ? "#ef4444" : daysLeft <= 7 ? "#fbbf24" : "var(--cream-mute)" }}
                          >
                            <Clock size={10} />
                            {daysLeft === 0 ? "Due today" : daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                          </div>
                        )}

                        {/* Applied date */}
                        {job.appliedDate && (
                          <div className="text-[9px] mt-1" style={{ color: "var(--cream-mute)" }}>
                            Applied {timeAgo(job.appliedDate)}
                          </div>
                        )}

                        {/* Source */}
                        {job.source && (
                          <div className="text-[9px] mt-1" style={{ color: "var(--cream-mute)" }}>
                            via {job.source}
                          </div>
                        )}

                        {/* Status Changer */}
                        <select
                          value={job.status}
                          onChange={(e) => { e.stopPropagation(); updateStatus(job.id, e.target.value); }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 w-full text-[10px] rounded border px-1.5 py-1 cursor-pointer"
                          style={{
                            background: "var(--bg-deep)",
                            borderColor: "var(--line-soft)",
                            color: "var(--cream-dim)",
                          }}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {stageJobs.length === 0 && (
                  <div className="rounded-lg border border-dashed p-3 text-center" style={{ borderColor: "var(--line-soft)" }}>
                    <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>Empty</span>
                  </div>
                )}
              </div>

              {/* Quick advance to this stage */}
            </div>
          );
        })}
      </div>

      {/* Collapsed stages (offer, accepted, rejected, withdrawn) */}
      <div className="mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAGES.slice(5).map((stage) => {
            const stageJobs = filteredJobs.filter((j) => j.status === stage.id);
            if (stageJobs.length === 0) return null;
            return (
              <div key={stage.id} className="rounded-xl border p-3" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", opacity: 0.7 }}>
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: stage.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: "var(--cream)" }}>{stage.label}</span>
                  <span className="text-[10px]" style={{ color: "var(--cream-dim)" }}>{stageJobs.length}</span>
                </div>
                {stageJobs.map((job) => (
                  <div
                    key={job.id}
                    className="text-[11px] py-1 cursor-pointer hover:underline"
                    style={{ color: "var(--cream-dim)" }}
                    onClick={() => { setEditingJob(job); setShowForm(true); }}
                  >
                    {job.company} <span style={{ color: "var(--cream-mute)" }}>— {job.role}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <JobForm
            job={editingJob}
            onClose={() => { setShowForm(false); setEditingJob(null); }}
            onSaved={() => { setShowForm(false); setEditingJob(null); loadJobs(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function JobForm({
  job,
  onClose,
  onSaved,
}: {
  job: JobApplication | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    company: job?.company || "",
    role: job?.role || "",
    location: job?.location || "",
    remote: job?.remote ?? true,
    salaryMin: job?.salaryMin || "",
    salaryMax: job?.salaryMax || "",
    salaryNote: job?.salaryNote || "",
    jobUrl: job?.jobUrl || "",
    status: job?.status || "saved",
    priority: job?.priority || "medium",
    appliedDate: job?.appliedDate ? job.appliedDate.split("T")[0] : "",
    deadline: job?.deadline ? job.deadline.split("T")[0] : "",
    contactName: job?.contactName || "",
    contactEmail: job?.contactEmail || "",
    source: job?.source || "LinkedIn",
    notes: job?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      appliedDate: form.appliedDate ? new Date(form.appliedDate).toISOString() : null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    };

    try {
      if (job) {
        await fetch("/api/agency/jobs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: job.id, ...payload }),
        });
      } else {
        await fetch("/api/agency/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="rounded-2xl border max-w-lg w-full max-h-[85vh] overflow-y-auto"
        style={{ background: "var(--bg-deep)", borderColor: "var(--line-soft)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--line-soft)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--cream)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {job ? "Edit Opportunity" : "Add Job Application"}
          </h2>
          <button onClick={onClose} style={{ color: "var(--cream-dim)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Company *</label>
              <input
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Role *</label>
              <input
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City, State or Remote"
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Source</label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="LinkedIn, Indeed, Referral..."
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              >
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              >
                {ALL_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Salary Min</label>
              <input
                type="number"
                value={form.salaryMin}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                placeholder="Annual or monthly"
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Salary Max</label>
              <input
                type="number"
                value={form.salaryMax}
                onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                placeholder="Annual or monthly"
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Salary Note</label>
            <input
              value={form.salaryNote}
              onChange={(e) => setForm({ ...form, salaryNote: e.target.value })}
              placeholder="Equity, bonus structure, retainer scope..."
              className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Applied Date</label>
              <input
                type="date"
                value={form.appliedDate}
                onChange={(e) => setForm({ ...form, appliedDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Contact Name</label>
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Job URL</label>
            <input
              value={form.jobUrl}
              onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
              placeholder="https://..."
              className="w-full mt-1 px-3 py-2 rounded-lg text-[14px]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Context, learning, next steps..."
              className="w-full mt-1 px-3 py-2 rounded-lg text-[14px] resize-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)", color: "var(--cream)" }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, remote: !form.remote })}
              className="flex items-center gap-2 text-[12px]"
              style={{ color: form.remote ? "#5ab896" : "var(--cream-dim)" }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 4,
                border: `2px solid ${form.remote ? "#5ab896" : "var(--line-soft)"}`,
                background: form.remote ? "#5ab896" : "transparent",
              }} />
              Remote / Hybrid
            </button>
          </div>

          {form.jobUrl && (
            <a
              href={form.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[12px]"
              style={{ color: "var(--gold)" }}
            >
              <ExternalLink size={12} /> Open job posting
            </a>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-semibold"
              style={{ background: "transparent", border: "1px solid var(--line-soft)", color: "var(--cream-dim)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--gold)", color: "#1a1a2e" }}
            >
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : job ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
