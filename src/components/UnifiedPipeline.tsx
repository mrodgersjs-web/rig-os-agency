"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, DollarSign, Target, TrendingUp, Users, ArrowUpRight,
  RefreshCw, Plus, ChevronRight, Building2, MapPin, Clock, AlertCircle,
  CheckCircle2, Star, Flame, Mail, Phone, ExternalLink, Calendar,
  CircleDollarSign, BarChart3,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface Deal {
  id: string;
  clientName: string;
  contact: string;
  dealValue: number;
  stage: "discovery" | "qualified" | "proposal" | "negotiation" | "closed";
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface DealSummary {
  count: number;
  totalValue: number;
  closedValue: number;
  weightedValue: number;
  stageCounts: Record<string, number>;
}

interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNote: string;
  jobUrl: string;
  status: "saved" | "applied" | "phone_screen" | "interview" | "final_round" | "offer" | "rejected";
  priority: "low" | "medium" | "high" | "urgent";
  appliedDate: string | null;
  deadline: string | null;
  contactName: string;
  contactEmail: string | null;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Constants ──────────────────────────────────────────────────────────── */

const DEAL_STAGES = ["discovery", "qualified", "proposal", "negotiation", "closed"] as const;
type DealStage = (typeof DEAL_STAGES)[number];

const DEAL_STAGE_META: Record<DealStage, { label: string; color: string; weight: number }> = {
  discovery:   { label: "Discovery",   color: "#60a5fa", weight: 0.1 },
  qualified:   { label: "Qualified",   color: "#a78bfa", weight: 0.25 },
  proposal:    { label: "Proposal",    color: "#fbbf24", weight: 0.5 },
  negotiation: { label: "Negotiation", color: "#fb923c", weight: 0.75 },
  closed:      { label: "Closed Won",  color: "#22c55e", weight: 1.0 },
};

const JOB_STAGES = ["saved", "applied", "phone_screen", "interview", "final_round", "offer", "rejected"] as const;
type JobStage = (typeof JOB_STAGES)[number];

const JOB_STAGE_META: Record<JobStage, { label: string; color: string }> = {
  saved:        { label: "Saved",        color: "#6e6353" },
  applied:      { label: "Applied",      color: "#60a5fa" },
  phone_screen: { label: "Phone Screen", color: "#a78bfa" },
  interview:    { label: "Interview",    color: "#fbbf24" },
  final_round:  { label: "Final Round",  color: "#fb923c" },
  offer:        { label: "Offer",        color: "#22c55e" },
  rejected:     { label: "Rejected",     color: "#ef4444" },
};

const PRIORITY_META: Record<Job["priority"], { label: string; color: string; bg: string }> = {
  low:    { label: "Low",    color: "#a59783", bg: "rgba(165,151,131,0.15)" },
  medium: { label: "Medium", color: "#d4a574", bg: "rgba(212,165,116,0.15)" },
  high:   { label: "High",   color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
  urgent: { label: "Urgent", color: "#c4607e", bg: "rgba(196,96,126,0.18)" },
};

const SOURCE_BREAKDOWN = ["LinkedIn", "Cold Outreach", "Referral (Jake)", "Referral (Mike)", "Indeed"];

/* ── Helpers ────────────────────────────────────────────────────────────── */

function fmtK(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function UnifiedPipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealSummary, setDealSummary] = useState<DealSummary>({ count: 0, totalValue: 0, closedValue: 0, weightedValue: 0, stageCounts: {} });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dealsRes, jobsRes] = await Promise.all([
        fetch("/api/agency/pipeline-deals?action=list").then(r => r.ok ? r.json() : null),
        fetch("/api/agency/jobs").then(r => r.ok ? r.json() : null),
      ]);
      if (dealsRes) {
        setDeals(dealsRes.deals || []);
        setDealSummary({
          count: dealsRes.count || 0,
          totalValue: dealsRes.totalValue || 0,
          closedValue: dealsRes.closedValue || 0,
          weightedValue: dealsRes.weightedValue || 0,
          stageCounts: dealsRes.stageCounts || {},
        });
      }
      if (jobsRes) {
        setJobs(jobsRes.jobs || []);
      }
      setLastSynced(new Date());
    } catch (e) {
      console.error("Pipeline load failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Derived state ── */
  const jobStats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    jobs.forEach(j => { byStatus[j.status] = (byStatus[j.status] || 0) + 1; });
    const active = jobs.filter(j => !["saved", "rejected"].includes(j.status));
    const offers = jobs.filter(j => j.status === "offer");
    const urgentDeadlines = jobs
      .filter(j => j.deadline)
      .map(j => ({ ...j, _days: daysUntil(j.deadline) }))
      .filter(j => j._days !== null && j._days >= 0 && j._days <= 7)
      .sort((a, b) => (a._days ?? 0) - (b._days ?? 0));
    return { byStatus, active: active.length, offers: offers.length, urgentDeadlines };
  }, [jobs]);

  const dealsByStage = useMemo(() => {
    const groups: Record<DealStage, Deal[]> = {
      discovery: [], qualified: [], proposal: [], negotiation: [], closed: [],
    };
    deals.forEach(d => { groups[d.stage].push(d); });
    return groups;
  }, [deals]);

  const conversionRate = dealSummary.count > 0
    ? ((dealSummary.stageCounts.closed || 0) / dealSummary.count) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--cream-mute)" }}>
          <RefreshCw size={14} className="animate-spin" /> Loading pipeline…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,165,116,0.12)", border: "1px solid rgba(212,165,116,0.3)" }}>
              <BarChart3 size={18} style={{ color: "var(--gold)" }} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--cream)" }}>
              Pipeline Command
            </h1>
          </div>
          <p className="text-[13px]" style={{ color: "var(--cream-mute)" }}>
            Unified sales + jobs funnel · {dealSummary.count} deals · {jobs.length} applications
            {lastSynced && <span className="ml-2 opacity-70">· synced {lastSynced.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all hover:opacity-80"
            style={{ background: "var(--bg-elev)", border: "1px solid var(--line-soft)", color: "var(--cream-soft)" }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <a href="/agency/pipeline-kanban" className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all hover:opacity-80"
            style={{ background: "rgba(212,165,116,0.12)", border: "1px solid rgba(212,165,116,0.3)", color: "var(--gold)" }}>
            <ArrowUpRight size={13} /> Full Kanban
          </a>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile icon={<DollarSign size={14} />} label="Open Pipeline" value={fmtK(dealSummary.totalValue)} sub={`${dealSummary.count - (dealSummary.stageCounts.closed || 0)} active deals`} color="#60a5fa" />
        <KpiTile icon={<Target size={14} />} label="Weighted Forecast" value={fmtK(dealSummary.weightedValue)} sub={`stage-weighted × probability`} color="#d4a574" />
        <KpiTile icon={<CheckCircle2 size={14} />} label="Closed Won" value={fmtK(dealSummary.closedValue)} sub={`${dealSummary.stageCounts.closed || 0} deals · ${conversionRate.toFixed(0)}% conversion`} color="#22c55e" />
        <KpiTile icon={<Briefcase size={14} />} label="Jobs in Play" value={jobStats.active.toString()} sub={`${jobStats.offers} offers · ${jobStats.urgentDeadlines.length} due ≤7d`} color="#c4607e" />
      </div>

      {/* ── Urgent deadlines banner ── */}
      {jobStats.urgentDeadlines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "rgba(196,96,126,0.10)", border: "1px solid rgba(196,96,126,0.30)" }}>
          <Flame size={18} style={{ color: "#c4607e" }} />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold mb-1" style={{ color: "#c4607e" }}>Urgent deadlines this week</div>
            <div className="flex flex-wrap gap-2">
              {jobStats.urgentDeadlines.slice(0, 5).map(j => (
                <a key={j.id} href={j.jobUrl || "#"} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                  style={{ background: "rgba(196,96,126,0.18)", color: "#e9b4c1", border: "1px solid rgba(196,96,126,0.30)" }}>
                  {j.company} · {j._days === 0 ? "today" : `${j._days}d`}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Sales Pipeline Board ── */}
      <Section title="Sales Pipeline" subtitle={`${dealSummary.count} deals · ${fmtK(dealSummary.totalValue)} open`} accent="var(--gold)">
        <div className="flex gap-3 overflow-x-auto pb-3">
          {DEAL_STAGES.map(stage => {
            const stageDeals = dealsByStage[stage];
            const meta = DEAL_STAGE_META[stage];
            const stageValue = stageDeals.reduce((s, d) => s + d.dealValue, 0);
            const stageWeighted = stageDeals.reduce((s, d) => s + d.dealValue * meta.weight, 0);
            return (
              <div key={stage} className="flex-shrink-0 w-[240px] rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line-soft)" }}>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--cream)" }}>{meta.label}</span>
                  </div>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded font-semibold"
                    style={{ background: `${meta.color}22`, color: meta.color }}>{stageDeals.length}</span>
                </div>
                <div className="text-[10px] mb-2.5 px-1 flex justify-between" style={{ color: "var(--cream-mute)" }}>
                  <span>{fmtK(stageValue)} open</span>
                  <span>×{meta.weight} = {fmtK(stageWeighted)}</span>
                </div>
                <div className="space-y-2">
                  {stageDeals.length === 0 && (
                    <div className="text-center py-6 text-[11px]" style={{ color: "var(--cream-mute)" }}>No deals</div>
                  )}
                  {stageDeals.map(deal => (
                    <motion.button
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      whileHover={{ y: -2 }}
                      className="w-full text-left p-2.5 rounded-lg transition-all"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}>
                      <div className="text-[12px] font-semibold mb-0.5 truncate" style={{ color: "var(--cream)" }}>{deal.clientName}</div>
                      {deal.contact && <div className="text-[10px] mb-1.5 truncate" style={{ color: "var(--cream-mute)" }}>{deal.contact}</div>}
                      <div className="flex items-center justify-between">
                        <div className="text-[14px] font-bold" style={{ color: meta.color }}>{fmtK(deal.dealValue)}</div>
                        <div className="text-[9px] truncate max-w-[110px]" style={{ color: "var(--cream-mute)" }}>{deal.source}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Jobs funnel split ── */}
      <Section title="Jobs Pipeline" subtitle={`${jobs.length} total · ${jobStats.active} active · ${jobStats.offers} offers`} accent="#c4607e">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Funnel viz */}
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line-soft)" }}>
            <div className="text-[12px] font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--cream)" }}>Application Funnel</div>
            <div className="space-y-2.5">
              {JOB_STAGES.map(stage => {
                const count = jobStats.byStatus[stage] || 0;
                const meta = JOB_STAGE_META[stage];
                const maxCount = Math.max(...JOB_STAGES.map(s => jobStats.byStatus[s] || 0), 1);
                const widthPct = (count / maxCount) * 100;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className="w-[100px] text-[11px] flex-shrink-0" style={{ color: "var(--cream-soft)" }}>{meta.label}</div>
                    <div className="flex-1 h-7 rounded-md overflow-hidden relative" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${widthPct}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-md flex items-center justify-end pr-2"
                        style={{ background: `${meta.color}88`, borderRight: `2px solid ${meta.color}` }}>
                        <span className="text-[11px] font-bold" style={{ color: "var(--cream)" }}>{count}</span>
                      </motion.div>
                    </div>
                    <div className="w-[60px] text-[10px] text-right" style={{ color: "var(--cream-mute)" }}>
                      {jobs.filter(j => j.status === stage).length > 0 && (
                        <span>{((count / jobs.length) * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top-priority jobs */}
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line-soft)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--cream)" }}>Active Priority Queue</div>
              <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{jobStats.active} in play</span>
            </div>
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {jobs
                .filter(j => !["saved", "rejected"].includes(j.status))
                .sort((a, b) => {
                  const ord: Record<string, number> = { offer: 0, final_round: 1, interview: 2, phone_screen: 3, applied: 4, saved: 5, rejected: 6 };
                  if (ord[a.status] !== ord[b.status]) return (ord[a.status] ?? 9) - (ord[b.status] ?? 9);
                  const pOrd: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
                  return (pOrd[a.priority] ?? 9) - (pOrd[b.priority] ?? 9);
                })
                .map(j => {
                  const pMeta = PRIORITY_META[j.priority];
                  const jMeta = JOB_STAGE_META[j.status];
                  const deadline = daysUntil(j.deadline);
                  return (
                    <div key={j.id} className="p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-semibold truncate" style={{ color: "var(--cream)" }}>{j.company}</div>
                          <div className="text-[11px] truncate" style={{ color: "var(--cream-soft)" }}>{j.role}</div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{ background: pMeta.bg, color: pMeta.color }}>{pMeta.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--cream-mute)" }}>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: `${jMeta.color}22`, color: jMeta.color }}>{jMeta.label}</span>
                          {j.location && <span className="flex items-center gap-1"><MapPin size={9} />{j.location}</span>}
                        </div>
                        {j.deadline && deadline !== null && (
                          <span style={{ color: deadline <= 3 ? "#ef4444" : deadline <= 7 ? "#fbbf24" : "var(--cream-mute)" }}>
                            <Clock size={9} className="inline mr-0.5" />
                            {deadline < 0 ? `${Math.abs(deadline)}d overdue` : deadline === 0 ? "today" : `${deadline}d`}
                          </span>
                        )}
                      </div>
                      {(j.salaryMin || j.salaryMax) && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px]" style={{ color: "var(--gold)" }}>
                          <CircleDollarSign size={10} />
                          {j.salaryMin ? fmtK(j.salaryMin) : ""}{j.salaryMin && j.salaryMax ? "–" : ""}{j.salaryMax ? fmtK(j.salaryMax) : ""}
                          {j.salaryNote && <span style={{ color: "var(--cream-mute)" }} className="ml-1">· {j.salaryNote}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Source breakdown ── */}
      <Section title="Revenue Pipeline by Source" subtitle="Where deals are coming from · evidence-based" accent="#22d3ee">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {SOURCE_BREAKDOWN.map(src => {
            const srcDeals = deals.filter(d => d.source === src);
            const srcValue = srcDeals.reduce((s, d) => s + d.dealValue, 0);
            const srcJobs = jobs.filter(j => j.source.includes(src.split(" ")[0]));
            return (
              <div key={src} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line-soft)" }}>
                <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "var(--cream-mute)" }}>{src}</div>
                <div className="text-[15px] font-bold mb-0.5" style={{ color: "var(--cream)" }}>{fmtK(srcValue)}</div>
                <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                  {srcDeals.length} deal{srcDeals.length !== 1 ? "s" : ""} · {srcJobs.length} app{srcJobs.length !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Deal detail modal ── */}
      {selectedDeal && <DealDetailModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />}
    </div>
  );
}

/* ── Section wrapper ── */

function Section({ title, subtitle, accent, children }: { title: string; subtitle?: string; accent: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: accent }} />
        <h2 className="text-[14px] font-bold uppercase tracking-wider" style={{ color: "var(--cream)" }}>{title}</h2>
        {subtitle && <span className="text-[11px]" style={{ color: "var(--cream-mute)" }}>· {subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

/* ── KPI tile ── */

function KpiTile({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="panel p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>{label}</span>
      </div>
      <div className="text-xl font-bold mb-0.5" style={{ color: "var(--cream)" }}>{value}</div>
      <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{sub}</div>
    </motion.div>
  );
}

/* ── Deal detail modal ── */

function DealDetailModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const meta = DEAL_STAGE_META[deal.stage];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--line)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: meta.color }}>{meta.label}</span>
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--cream)" }}>{deal.clientName}</h2>
            {deal.contact && <p className="text-[12px] mt-0.5" style={{ color: "var(--cream-mute)" }}>{deal.contact}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <InfoBox label="Deal Value" value={fmtK(deal.dealValue)} />
          <InfoBox label="Weighted" value={fmtK(deal.dealValue * meta.weight)} />
          <InfoBox label="Source" value={deal.source} />
          <InfoBox label="Updated" value={relativeTime(deal.updatedAt)} />
        </div>
        {deal.notes && (
          <div className="p-3 rounded-lg mb-4" style={{ background: "var(--line-soft)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Notes</div>
            <div className="text-[13px]" style={{ color: "var(--cream)" }}>{deal.notes}</div>
          </div>
        )}
        <button onClick={onClose}
          className="w-full py-2 rounded-lg text-[12px] font-semibold"
          style={{ background: "var(--gold)", color: "var(--bg-deep)" }}>
          Close
        </button>
      </motion.div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg" style={{ background: "var(--line-soft)" }}>
      <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--cream-mute)" }}>{label}</div>
      <div className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>{value}</div>
    </div>
  );
}
