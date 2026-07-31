"use client";

// ── RIG OS Agency — Lead Scoring Command ─────────────────────────────────
// Hot/Warm/Cold tier scoring for 15+ scored leads across 10 verticals.
// Wires /api/agency/leads for live scoring payloads, tier breakdowns,
// source mix, action queue, and pipeline value tracking.
//
// Routes:
//   /agency/leads              — this surface
//   /api/agency/leads          — supplies payload

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Thermometer, Snowflake, Target, Users, Building2,
  TrendingUp, DollarSign, Search, Filter, X, ChevronRight,
  ChevronLeft, Calendar, Award, Zap, Activity, RefreshCw, BarChart3,
  Mail, ExternalLink, Copy, ArrowUp, ArrowDown, AlertCircle,
  CheckCircle2, Eye, Sparkles, Briefcase, Globe, MessageSquare,
} from "lucide-react";

const C = {
  bg: "var(--bg-deep)", bgMid: "var(--bg-mid)", card: "var(--bg-card)",
  elev: "var(--bg-elev)", text: "var(--cream)", text2: "var(--cream-soft)",
  text3: "var(--cream-dim)", textMute: "var(--cream-mute)",
  border: "var(--line-soft)", borderHot: "var(--line)",
  gold: "var(--gold)", goldSoft: "var(--gold-soft)", goldDeep: "var(--gold-deep)",
  emerald: "var(--emerald)", emeraldDim: "var(--emerald-dim)",
  plum: "var(--plum)", rust: "var(--rust)",
  blue: "#60a5fa", cyan: "#22d3ee",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const TIER_STYLES: Record<string, { color: string; bg: string; icon: any; label: string; ringColor: string }> = {
  hot: { color: C.rust, bg: "rgba(201,124,94,0.12)", icon: Flame, label: "Hot", ringColor: "rgba(201,124,94,0.4)" },
  warm: { color: C.gold, bg: "rgba(212,165,116,0.12)", icon: Thermometer, label: "Warm", ringColor: "rgba(212,165,116,0.4)" },
  cold: { color: C.blue, bg: "rgba(96,165,250,0.12)", icon: Snowflake, label: "Cold", ringColor: "rgba(96,165,250,0.4)" },
};

const STAGE_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  prospect: { color: C.textMute, bg: "rgba(165,151,131,0.1)", label: "Prospect" },
  enriched: { color: C.cyan, bg: "rgba(34,211,238,0.12)", label: "Enriched" },
  contacted: { color: C.blue, bg: "rgba(96,165,250,0.12)", label: "Contacted" },
  engaged: { color: C.gold, bg: "rgba(212,165,116,0.12)", label: "Engaged" },
  meeting_booked: { color: C.gold, bg: "rgba(212,165,116,0.18)", label: "Meeting" },
  proposal_sent: { color: C.emerald, bg: "rgba(90,184,150,0.12)", label: "Proposal" },
  negotiation: { color: C.emerald, bg: "rgba(90,184,150,0.2)", label: "Negotiation" },
  closed_won: { color: C.emerald, bg: "rgba(90,184,150,0.3)", label: "Closed Won" },
  closed_lost: { color: C.plum, bg: "rgba(196,96,126,0.12)", label: "Lost" },
  nurture: { color: C.textMute, bg: "rgba(165,151,131,0.1)", label: "Nurture" },
};

const SCORE_DIMENSIONS = [
  { key: "fit", label: "ICP Fit", description: "Matches ideal customer profile" },
  { key: "intent", label: "Intent", description: "Active buying signals" },
  { key: "engagement", label: "Engagement", description: "Email/reply/meeting activity" },
  { key: "timing", label: "Timing", description: "Trigger events, funding, hiring" },
  { key: "authority", label: "Authority", description: "Decision-maker seniority" },
];

interface Lead {
  id: string; name: string; title: string; company: string;
  industry: string; employees: number; arr: number; geography: string;
  linkedinUrl: string;
  painPoints: string[]; score: number; tier: "hot" | "warm" | "cold";
  stage: string; source: string;
  enrichedAt: string | null; lastContactAt: string | null;
  emailsSent: number; emailsOpened: number; emailsReplied: number;
  meetingsBooked: number; proposalsSent: number; contractsSigned: number;
  value: number; scoreBreakdown: Record<string, number>;
  nextAction: string; nextActionDate: string;
}

interface LeadsPayload {
  /** Provenance from the API. Rendered verbatim in the footer — the UI must never
      restate the data source in its own words, which is how "internal lead scoring DB"
      outlived the fixture it described. */
  _source?: string;
  _real?: boolean;
  /** Fields the registry does not carry (headcount, revenue, geography). They arrive
      as null and must render as "unknown" — a 0 here reads as a fact nobody measured. */
  _unknown_fields?: string[];
  summary: {
    total: number; hot: number; warm: number; cold: number;
    totalPipelineValue: number; hotPipelineValue: number;
    weightedPipelineValue: number; wonValue: number;
    closedWonCount: number; avgScore: number;
  };
  engagement: {
    totalEmailsSent: number; totalEmailsOpened: number;
    totalReplies: number; totalMeetings: number;
    openRate: number; replyRate: number; meetingRate: number;
  };
  scoreBuckets: { range: string; count: number; label: string }[];
  industryRollup: {
    industry: string; count: number; hot: number; warm: number; cold: number;
    value: number; avgScore: number;
  }[];
  sourceRollup: {
    source: string; count: number; hot: number; warm: number; cold: number;
    replied: number; booked: number; value: number;
  }[];
  funnel: { stage: string; count: number; value: number; weightedValue: number }[];
  actionQueue: Lead[];
  leads: Lead[];
}

type Tab = "queue" | "all" | "industries" | "sources";

export default function LeadScoringPage() {
  const [data, setData] = useState<LeadsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("queue");
  const [tierFilter, setTierFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/leads", { cache: "no-store" });
      const j: LeadsPayload = await res.json();
      setData(j);
      setError(null);
      setLastUpdated(Date.now());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshTimer.current = setInterval(refresh, 60_000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [refresh]);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    let result = data.leads;
    if (tierFilter !== "all") result = result.filter((l) => l.tier === tierFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.industry.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, tierFilter, search]);

  if (loading || !data) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ color: C.text3, fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}
        >
          <RefreshCw size={14} className="animate-spin" />
          Loading lead scoring…
        </motion.div>
      </div>
    );
  }

  const s = data.summary;
  const e = data.engagement;
  const hotPct = Math.round((s.hot / s.total) * 100);
  const warmPct = Math.round((s.warm / s.total) * 100);
  const coldPct = Math.round((s.cold / s.total) * 100);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Target size={20} style={{ color: C.gold }} />
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: C.textMute, fontWeight: 600 }}>
                Growth · Lead Intelligence
              </span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 500, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.02em" }}>
              Lead Scoring Command
            </h1>
            <p style={{ fontSize: 14, color: C.text3, marginTop: 6 }}>
              {s.total} scored leads · {formatCurrency(s.totalPipelineValue)} pipeline · {s.avgScore} avg score
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                updated {Math.round((Date.now() - lastUpdated) / 1000)}s ago
              </span>
            )}
            <button
              onClick={refresh}
              style={{
                padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: "transparent", color: C.text3, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
              }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(196,96,126,0.08)", border: "1px solid rgba(196,96,126,0.35)",
          color: C.plum, padding: 12, borderRadius: 12, marginTop: 16, fontSize: 12.5,
        }}>
          {error}
        </div>
      )}

      {/* KPI Strip — 6 tiles */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12, marginTop: 18,
        }}>
          <KPITile label="Total Pipeline" value={formatCurrency(s.totalPipelineValue)} sub={`${formatCurrency(s.weightedPipelineValue)} weighted`} icon={DollarSign} accent={C.gold} />
          <KPITile label="Hot Leads" value={s.hot.toString()} sub={`${hotPct}% of pipeline`} icon={Flame} accent={C.rust} />
          <KPITile label="Warm Leads" value={s.warm.toString()} sub={`${warmPct}% of pipeline`} icon={Thermometer} accent={C.gold} />
          <KPITile label="Cold Leads" value={s.cold.toString()} sub={`${coldPct}% of pipeline`} icon={Snowflake} accent={C.blue} />
          <KPITile label="Avg Score" value={s.avgScore.toString()} sub={`${s.closedWonCount} closed won`} icon={Award} accent={C.emerald} />
          <KPITile label="Won Value" value={formatCurrency(s.wonValue)} sub={`${s.closedWonCount} contracts signed`} icon={CheckCircle2} accent={C.emerald} />
        </div>
      </motion.div>

      {/* Tier Distribution + Engagement Block */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 18 }}>
          {/* Hot Bar */}
          <TierBar tier="hot" count={s.hot} pct={hotPct} total={s.total} pipelineValue={s.hotPipelineValue} />
          {/* Warm Bar */}
          <TierBar tier="warm" count={s.warm} pct={warmPct} total={s.total} pipelineValue={
            data.leads.filter((l) => l.tier === "warm").reduce((sum, l) => sum + l.value, 0)
          } />
          {/* Cold Bar */}
          <TierBar tier="cold" count={s.cold} pct={coldPct} total={s.total} pipelineValue={
            data.leads.filter((l) => l.tier === "cold").reduce((sum, l) => sum + l.value, 0)
          } />
        </div>
      </motion.div>

      {/* Engagement Row + Score Distribution */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 18 }}>
          {/* Engagement Card */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Mail size={14} style={{ color: C.gold }} />
              <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Engagement Funnel
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <MetricBox label="Emails Sent" value={e.totalEmailsSent.toString()} accent={C.text3} />
              <MetricBox label="Opens" value={`${e.totalEmailsOpened} (${e.openRate}%)`} accent={C.cyan} />
              <MetricBox label="Replies" value={`${e.totalReplies} (${e.replyRate}%)`} accent={C.gold} />
              <MetricBox label="Meetings" value={`${e.totalMeetings} (${e.meetingRate}%)`} accent={C.emerald} />
            </div>
            {/* Conversion funnel */}
            <div style={{ marginTop: 16, padding: 12, background: "var(--bg-deep)", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.textMute, marginBottom: 8 }}>
                <TrendingUp size={12} /> Conversion Rate
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", height: 28 }}>
                <div style={{ flex: e.totalEmailsSent || 1, height: "100%", background: `linear-gradient(90deg, ${C.cyan}, ${C.cyan}88)`, borderRadius: 4, position: "relative" }}>
                  <span style={{ position: "absolute", left: 6, top: 6, fontSize: 10, color: C.bg, fontWeight: 700 }}>Sent</span>
                </div>
                <div style={{ flex: e.totalEmailsOpened || 1, height: "100%", background: `linear-gradient(90deg, ${C.gold}, ${C.gold}88)`, borderRadius: 4, position: "relative" }}>
                  <span style={{ position: "absolute", left: 6, top: 6, fontSize: 10, color: C.bg, fontWeight: 700 }}>Open</span>
                </div>
                <div style={{ flex: e.totalReplies || 1, height: "100%", background: `linear-gradient(90deg, ${C.rust}, ${C.rust}88)`, borderRadius: 4, position: "relative" }}>
                  <span style={{ position: "absolute", left: 6, top: 6, fontSize: 10, color: C.bg, fontWeight: 700 }}>Reply</span>
                </div>
                <div style={{ flex: Math.max(e.totalMeetings, 1), height: "100%", background: `linear-gradient(90deg, ${C.emerald}, ${C.emerald}88)`, borderRadius: 4, position: "relative" }}>
                  <span style={{ position: "absolute", left: 6, top: 6, fontSize: 10, color: C.bg, fontWeight: 700 }}>Meet</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <BarChart3 size={14} style={{ color: C.gold }} />
              <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Score Distribution
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.scoreBuckets.map((b, i) => {
                const maxCount = Math.max(...data.scoreBuckets.map((x) => x.count), 1);
                const pct = (b.count / maxCount) * 100;
                const colors = [C.emerald, C.rust, C.gold, C.blue, C.textMute];
                return (
                  <div key={b.range} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: C.textMute, width: 36, textAlign: "right", fontFamily: "monospace" }}>{b.range}</span>
                    <div style={{ flex: 1, height: 18, background: "var(--bg-deep)", borderRadius: 4, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                        style={{ height: "100%", background: colors[i], borderRadius: 4 }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: C.text, fontWeight: 700, minWidth: 20, textAlign: "right" }}>{b.count}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, padding: 10, background: "var(--bg-deep)", borderRadius: 8, fontSize: 11, color: C.textMute, lineHeight: 1.5 }}>
              <strong style={{ color: C.gold }}>Champions (90+):</strong> Priority outreach, exec sponsorship
              <br />
              <strong style={{ color: C.rust }}>Hot (80-89):</strong> Multi-touch sequence
              <br />
              <strong style={{ color: C.gold }}>Warm (70-79):</strong> Value-prop nurture
              <br />
              <strong style={{ color: C.blue }}>Cold (&lt;70):</strong> Trigger-event wait
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div style={{ display: "flex", gap: 4, marginTop: 24, background: C.card, borderRadius: 12, padding: 4, width: "fit-content", border: `1px solid ${C.border}` }}>
          {([
            { id: "queue", label: "Action Queue", icon: Zap, count: data.actionQueue.length },
            { id: "all", label: "All Leads", icon: Users, count: data.leads.length },
            { id: "industries", label: "By Industry", icon: Building2, count: data.industryRollup.length },
            { id: "sources", label: "By Source", icon: Globe, count: data.sourceRollup.length },
          ] as const).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                  background: tab === t.id ? C.elev : "transparent",
                  color: tab === t.id ? C.gold : C.text3,
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                }}
              >
                <Icon size={13} />
                {t.label}
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: tab === t.id ? C.gold + "33" : "var(--bg-deep)", color: tab === t.id ? C.gold : C.textMute }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }} style={{ marginTop: 18 }}>
        {tab === "queue" && (
          <ActionQueueView leads={data.actionQueue} onSelect={setSelectedLead} />
        )}

        {tab === "all" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMute }} />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, company, industry…"
                  style={{
                    width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8,
                    border: `1px solid ${C.border}`, background: "var(--bg-deep)",
                    color: C.text, fontSize: 12, outline: "none",
                  }}
                />
              </div>
              {(["all", "hot", "warm", "cold"] as const).map((t) => {
                const TierIcon = t === "all" ? Target : TIER_STYLES[t].icon;
                const tierColor = t === "all" ? C.gold : TIER_STYLES[t].color;
                return (
                  <button
                    key={t} onClick={() => setTierFilter(t)}
                    style={{
                      padding: "8px 12px", borderRadius: 8,
                      border: `1px solid ${tierFilter === t ? tierColor : C.border}`,
                      background: tierFilter === t ? TIER_STYLES[t]?.bg || "rgba(212,165,116,0.12)" : "transparent",
                      color: tierFilter === t ? tierColor : C.text3,
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}
                  >
                    <TierIcon size={11} /> {t}
                  </button>
                );
              })}
            </div>

            {/* Lead Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredLeads.map((l) => (
                <LeadRow key={l.id} lead={l} onClick={() => setSelectedLead(l)} />
              ))}
              {filteredLeads.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: C.textMute, fontSize: 13, background: C.card, borderRadius: 12 }}>
                  No leads match your filters
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "industries" && (
          <IndustryGrid rollup={data.industryRollup} leads={data.leads} onSelect={setSelectedLead} />
        )}

        {tab === "sources" && (
          <SourceRollup rollup={data.sourceRollup} leads={data.leads} onSelect={setSelectedLead} />
        )}
      </motion.div>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
        )}
      </AnimatePresence>

      {/* Footer */}
      <div style={{
        marginTop: 32, padding: 14, borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: C.textMute, flexWrap: "wrap", gap: 8,
      }}>
        {/* Reads the API's own provenance rather than restating it. The literal
            "internal lead scoring DB" sat here while the API underneath had already
            been labelled a HARDCODED FIXTURE — the UI was the last place still
            claiming the invented rows were real. Never hardcode this string again. */}
        <span>Data source: <span style={{ fontFamily: "monospace", color: C.text3 }}>{data?._source ?? "unknown"}</span>{typeof data?.summary?.total === "number" ? ` · ${data.summary.total} leads` : ""}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={11} style={{ color: C.gold }} /> Doctrine: Hot ≥ 80 · Warm ≥ 70 · Cold &lt; 70
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function KPITile({ label, value, sub, icon: Icon, accent }: any) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ color: accent }}><Icon size={16} /></div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textMute, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function MetricBox({ label, value, accent }: any) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textMute, fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

function TierBar({ tier, count, pct, total, pipelineValue }: any) {
  const style = TIER_STYLES[tier];
  const Icon = style.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + (tier === "hot" ? 0 : tier === "warm" ? 0.05 : 0.1) }}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16,
        borderTop: `2px solid ${style.color}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon size={16} style={{ color: style.color }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {style.label}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 4, background: style.bg, color: style.color, fontWeight: 700 }}>
          {pct}%
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {count}
        </span>
        <span style={{ fontSize: 12, color: C.textMute }}>of {total}</span>
      </div>
      <div style={{ height: 6, background: "var(--bg-deep)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }}
          style={{ height: "100%", background: style.color, borderRadius: 3 }}
        />
      </div>
      <div style={{ fontSize: 11, color: C.text3 }}>{formatCurrency(pipelineValue)} pipeline</div>
    </motion.div>
  );
}

function LeadRow({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const tier = TIER_STYLES[lead.tier];
  const stage = STAGE_STYLES[lead.stage] || STAGE_STYLES.prospect;
  const TierIcon = tier.icon;
  const isStale = lead.lastContactAt && (Date.now() - new Date(lead.lastContactAt).getTime()) > 7 * 24 * 60 * 60 * 1000;
  const isOverdue = lead.nextActionDate && new Date(lead.nextActionDate).getTime() < new Date("2026-07-06").getTime();

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14,
        display: "grid", gridTemplateColumns: "auto 1fr auto auto auto auto",
        gap: 16, alignItems: "center", cursor: "pointer", transition: "all 0.2s",
      }}
      whileHover={{ borderColor: C.borderHot, transform: "translateX(2px)" }}
    >
      {/* Score badge */}
      <div style={{
        width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: `conic-gradient(${tier.color} ${(lead.score / 100) * 360}deg, var(--bg-deep) 0deg)`,
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%", background: C.card,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{lead.score}</span>
        </div>
      </div>

      {/* Identity */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{lead.name}</span>
          <span style={{ fontSize: 11, color: C.textMute }}>·</span>
          <span style={{ fontSize: 12, color: C.text3 }}>{lead.title}</span>
          {isOverdue && (
            <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "rgba(196,96,126,0.15)", color: C.plum, fontWeight: 700, textTransform: "uppercase" }}>
              Overdue
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: C.text3 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Building2 size={10} /> {lead.company}</span>
          <span>·</span>
          <span>{lead.industry}</span>
          <span>·</span>
          <span>{lead.geography}</span>
          <span>·</span>
          <span>{lead.employees} emp · {formatCurrency(lead.arr)} ARR</span>
        </div>
      </div>

      {/* Stage */}
      <span style={{
        fontSize: 10, padding: "3px 10px", borderRadius: 6, fontWeight: 700,
        color: stage.color, background: stage.bg, textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        {stage.label}
      </span>

      {/* Tier */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: tier.bg }}>
        <TierIcon size={11} style={{ color: tier.color }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: tier.color, textTransform: "uppercase" }}>{tier.label}</span>
      </div>

      {/* Value */}
      <div style={{ textAlign: "right", minWidth: 80 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {formatCurrency(lead.value)}
        </div>
        <div style={{ fontSize: 10, color: C.textMute }}>deal value</div>
      </div>

      {/* Chevron */}
      <ChevronRight size={16} style={{ color: C.textMute }} />
    </motion.div>
  );
}

function ActionQueueView({ leads, onSelect }: { leads: Lead[]; onSelect: (l: Lead) => void }) {
  const today = new Date("2026-07-06");
  return (
    <div>
      <div style={{ marginBottom: 12, padding: 12, background: "rgba(212,165,116,0.06)", border: "1px solid rgba(212,165,116,0.2)", borderRadius: 10, fontSize: 12, color: C.gold }}>
        <strong>⚡ Next 7 days:</strong> {leads.length} actions queued. Prioritize overdue items first.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {leads.map((l) => {
          const tier = TIER_STYLES[l.tier];
          const actionDate = new Date(l.nextActionDate);
          const daysOut = Math.ceil((actionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysOut < 0;
          const isToday = daysOut === 0;
          return (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelect(l)}
              style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14,
                display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 14, alignItems: "center",
                cursor: "pointer", transition: "all 0.2s",
                borderLeft: `3px solid ${isOverdue ? C.plum : isToday ? C.gold : tier.color}`,
              }}
              whileHover={{ borderColor: C.borderHot }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textMute, fontWeight: 600 }}>
                  {isOverdue ? "Overdue" : isToday ? "Today" : `+${daysOut}d`}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: isOverdue ? C.plum : isToday ? C.gold : C.text, marginTop: 2 }}>
                  {actionDate.getDate()}
                </div>
                <div style={{ fontSize: 9, color: C.textMute, textTransform: "uppercase" }}>
                  {actionDate.toLocaleString("en", { month: "short" })}
                </div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{l.name}</span>
                  <span style={{ fontSize: 11, color: C.textMute }}>·</span>
                  <span style={{ fontSize: 11, color: C.text3 }}>{l.company}</span>
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: tier.bg, color: tier.color, fontWeight: 700, textTransform: "uppercase" }}>
                    {l.tier} · {l.score}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.gold, fontWeight: 500 }}>→ {l.nextAction}</div>
              </div>
              <ChevronRight size={16} style={{ color: C.textMute }} />
            </motion.div>
          );
        })}
        {leads.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: C.textMute, fontSize: 13, background: C.card, borderRadius: 12 }}>
            ✨ No actions queued in the next 7 days. Take a break or research new prospects.
          </div>
        )}
      </div>
    </div>
  );
}

function IndustryGrid({ rollup, leads, onSelect }: { rollup: any[]; leads: Lead[]; onSelect: (l: Lead) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
      {rollup.map((ind) => {
        const leadsInInd = leads.filter((l) => l.industry === ind.industry);
        const topLead = leadsInInd.sort((a, b) => b.score - a.score)[0];
        const hotPct = ind.count > 0 ? Math.round((ind.hot / ind.count) * 100) : 0;
        return (
          <motion.div
            key={ind.industry}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Building2 size={14} style={{ color: C.gold }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{ind.industry}</span>
              </div>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(212,165,116,0.12)", color: C.gold, fontWeight: 700 }}>
                {ind.count} leads
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, textTransform: "uppercase", color: C.textMute, letterSpacing: "0.1em" }}>Pipeline</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.gold }}>{formatCurrency(ind.value)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, textTransform: "uppercase", color: C.textMute, letterSpacing: "0.1em" }}>Avg Score</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{ind.avgScore}</div>
              </div>
            </div>
            {/* Tier breakdown */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12, height: 6 }}>
              {ind.hot > 0 && <div style={{ flex: ind.hot, background: C.rust, borderRadius: 2 }} />}
              {ind.warm > 0 && <div style={{ flex: ind.warm, background: C.gold, borderRadius: 2 }} />}
              {ind.cold > 0 && <div style={{ flex: ind.cold, background: C.blue, borderRadius: 2 }} />}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 12 }}>
              <span style={{ color: C.rust }}>{ind.hot} hot</span>
              <span style={{ color: C.gold }}>{ind.warm} warm</span>
              <span style={{ color: C.blue }}>{ind.cold} cold</span>
            </div>
            {topLead && (
              <div
                onClick={() => onSelect(topLead)}
                style={{
                  padding: 8, background: "var(--bg-deep)", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 9, textTransform: "uppercase", color: C.textMute, letterSpacing: "0.1em", marginBottom: 2 }}>Top Lead</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{topLead.name}</div>
                <div style={{ fontSize: 10, color: C.text3 }}>{topLead.company} · {topLead.score}</div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function SourceRollup({ rollup, leads, onSelect }: { rollup: any[]; leads: Lead[]; onSelect: (l: Lead) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Source cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {rollup.map((src) => {
          const replyRate = src.count > 0 ? Math.round((src.replied / src.count) * 100) : 0;
          const bookRate = src.count > 0 ? Math.round((src.booked / src.count) * 100) : 0;
          return (
            <div key={src.source} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Globe size={12} style={{ color: C.gold }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{src.source}</span>
                </div>
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(212,165,116,0.12)", color: C.gold, fontWeight: 700 }}>
                  {src.count}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 8 }}>{formatCurrency(src.value)}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, fontSize: 10 }}>
                <div>
                  <div style={{ color: C.textMute, textTransform: "uppercase", fontSize: 8 }}>Hot</div>
                  <div style={{ color: C.rust, fontWeight: 700 }}>{src.hot}</div>
                </div>
                <div>
                  <div style={{ color: C.textMute, textTransform: "uppercase", fontSize: 8 }}>Reply</div>
                  <div style={{ color: C.gold, fontWeight: 700 }}>{replyRate}%</div>
                </div>
                <div>
                  <div style={{ color: C.textMute, textTransform: "uppercase", fontSize: 8 }}>Book</div>
                  <div style={{ color: C.emerald, fontWeight: 700 }}>{bookRate}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Source leaderboard */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Source Pipeline Ranking
        </h3>
        {rollup.map((src, i) => {
          const maxValue = Math.max(...rollup.map((r) => r.value));
          const pct = (src.value / maxValue) * 100;
          return (
            <div key={src.source} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: C.textMute, fontFamily: "monospace", width: 24 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text, width: 90 }}>{src.source}</span>
              <div style={{ flex: 1, height: 16, background: "var(--bg-deep)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                  style={{ height: "100%", background: `linear-gradient(90deg, ${C.gold}, ${C.rust})`, borderRadius: 4 }}
                />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, width: 70, textAlign: "right" }}>
                {formatCurrency(src.value)}
              </span>
              <span style={{ fontSize: 10, color: C.textMute, width: 40, textAlign: "right" }}>
                {src.count} leads
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadDetailModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const tier = TIER_STYLES[lead.tier];
  const stage = STAGE_STYLES[lead.stage] || STAGE_STYLES.prospect;
  const TierIcon = tier.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 18,
          maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 24,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: `conic-gradient(${tier.color} ${(lead.score / 100) * 360}deg, var(--bg-deep) 0deg)`,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: "50%", background: C.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{lead.score}</span>
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 2 }}>{lead.name}</h2>
                <p style={{ fontSize: 13, color: C.text3 }}>{lead.title} · {lead.company}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 6, fontWeight: 700,
                    background: tier.bg, color: tier.color, textTransform: "uppercase",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <TierIcon size={10} /> {tier.label}
                  </span>
                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 6, fontWeight: 700,
                    background: stage.bg, color: stage.color, textTransform: "uppercase",
                  }}>
                    {stage.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.text3, cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Top metrics row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          <DetailBox label="Deal Value" value={formatCurrency(lead.value)} accent={C.gold} />
          <DetailBox label="Company ARR" value={formatCurrency(lead.arr)} accent={C.emerald} />
          <DetailBox label="Employees" value={lead.employees.toString()} accent={C.cyan} />
          <DetailBox label="Geography" value={lead.geography} accent={C.text} small />
        </div>

        {/* Score Breakdown */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Score Breakdown
          </h3>
          {SCORE_DIMENSIONS.map((dim) => {
            const score = lead.scoreBreakdown[dim.key] || 0;
            return (
              <div key={dim.key} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div>
                    <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{dim.label}</span>
                    <span style={{ fontSize: 10, color: C.textMute, marginLeft: 8 }}>{dim.description}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>{score}</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-deep)", borderRadius: 3, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6 }}
                    style={{
                      height: "100%",
                      background: score >= 85 ? C.emerald : score >= 70 ? C.gold : C.rust,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Engagement Stats */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Engagement Activity
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            <DetailBox label="Sent" value={lead.emailsSent.toString()} accent={C.text3} small />
            <DetailBox label="Opened" value={lead.emailsOpened.toString()} accent={C.cyan} small />
            <DetailBox label="Replied" value={lead.emailsReplied.toString()} accent={C.gold} small />
            <DetailBox label="Meetings" value={lead.meetingsBooked.toString()} accent={C.emerald} small />
            <DetailBox label="Proposals" value={lead.proposalsSent.toString()} accent={C.emerald} small />
            <DetailBox label="Contracts" value={lead.contractsSigned.toString()} accent={C.emerald} small />
          </div>
        </div>

        {/* Pain Points */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Pain Points
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {lead.painPoints.map((p) => (
              <span key={p} style={{
                padding: "4px 10px", borderRadius: 6, background: "var(--bg-deep)",
                border: `1px solid ${C.border}`, fontSize: 11, color: C.text,
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Next Action */}
        <div style={{
          background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.3)",
          borderRadius: 10, padding: 12, marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.gold, fontWeight: 700, marginBottom: 4 }}>
            ⚡ Next Action · {lead.nextActionDate}
          </div>
          <div style={{ fontSize: 13, color: C.text }}>{lead.nextAction}</div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8,
              background: C.gold, color: C.bg, fontSize: 12, fontWeight: 600,
              textAlign: "center", textDecoration: "none", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <ExternalLink size={12} /> Open LinkedIn
          </a>
          <button
            onClick={() => navigator.clipboard?.writeText(`${lead.name} (${lead.title}) at ${lead.company} — Score ${lead.score}, ${lead.tier.toUpperCase()}`)}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.text3, fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Copy size={12} /> Copy Summary
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailBox({ label, value, accent, small }: any) {
  return (
    <div style={{ padding: 10, background: "var(--bg-deep)", borderRadius: 8, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textMute, fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: small ? 13 : 16, fontWeight: 700, color: accent, fontFamily: small ? "'Bricolage Grotesque', sans-serif" : "'Bricolage Grotesque', sans-serif" }}>
        {value}
      </div>
    </div>
  );
}