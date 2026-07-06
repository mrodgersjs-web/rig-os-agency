"use client";

// ── RIG OS Agency — GTM Real (Studio V2) ─────────────────────────────
// Live GTM Studio V2 pipeline surface. Pulls from /api/agency/gtm-real
// which reads manifests + Resend sends from the actual
// ~/Developer/rig-gtm-studio-v2 repo (no mocked numbers).
//
// Why this matters: operators need to see — at a glance — which companies
// have been touched, which campaigns are live, and where the 272 prospect
// pool stands relative to the 43 confirmed sends. This page turns the
// JSON manifest ledger into a Midnight Aubergine command surface.

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Building2,
  CheckCircle2, ChevronRight, Clock, Copy, Database, ExternalLink,
  FileJson, Filter, Flame, Hash, Inbox, Layers, Mail, MailCheck,
  MailOpen, MailPlus, MailX, PieChart as PieChartIcon, Radio,
  RefreshCw, Search, Send, Sparkles, Target, TrendingUp, Users,
  Zap, ArrowUpRight,
} from "lucide-react";

interface ManifestSummary {
  file: string;
  campaign: string;
  sent_count: number;
  dry_run_preview: boolean;
  armed_by: string;
}

interface CompanySend {
  status: string;
  resend_id: string | null;
  manifest: string;
  campaign: string;
  reason: string | null;
}

interface CompanyContacted {
  slug: string;
  status: string;
  total_sends: number;
  campaigns: string[];
  has_resend_id: boolean;
  sends: CompanySend[];
}

interface GTMRealData {
  source: string;
  real: boolean;
  pipeline_root: string;
  summary: {
    total_prospects: number;
    total_emails_sent: number;
    unique_companies_contacted: number;
    confirmed_sent: number;
    with_resend_id: number;
    send_rate: string;
  };
  manifests: {
    parsed: string[];
    summaries: ManifestSummary[];
  };
  companies_contacted: CompanyContacted[];
  all_client_slugs: string[];
}

const C = {
  bg: "var(--bg-deep)",
  bgMid: "var(--bg-mid)",
  card: "var(--bg-card)",
  elev: "var(--bg-elev)",
  text: "var(--cream)",
  text2: "var(--cream-soft)",
  text3: "var(--cream-dim)",
  mute: "var(--cream-mute)",
  border: "var(--line-soft)",
  borderHot: "var(--line)",
  borderDeep: "var(--line-deep)",
  gold: "var(--gold)",
  goldSoft: "var(--gold-soft)",
  goldDeep: "var(--gold-deep)",
  emerald: "var(--emerald)",
  emeraldDim: "var(--emerald-dim)",
  plum: "var(--plum)",
  rust: "var(--rust)",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const CAMPAIGN_META: Record<string, { label: string; color: string; angle: string }> = {
  "warmup-day1":     { label: "Warmup Day 1",   color: "#fbbf24", angle: "Initial send — first-touch intro" },
  "followup-one":    { label: "Follow-up One",  color: C.gold,    angle: "Second touch — value-led follow-up" },
  "replybait-canary":{ label: "Reply-Bait",     color: C.plum,    angle: "Third touch — canary reply-bait" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  sent:        { label: "Sent",         color: C.emerald, bg: "rgba(90,184,150,0.12)" },
  delivered:   { label: "Delivered",    color: C.gold,    bg: "rgba(212,165,116,0.14)" },
  queued:      { label: "Queued",       color: "#fbbf24",  bg: "rgba(251,191,36,0.12)" },
  failed:      { label: "Failed",       color: "#ef4444",  bg: "rgba(239,68,68,0.12)" },
  dry_run:     { label: "Dry Run",      color: C.text3,    bg: "rgba(165,151,131,0.12)" },
  draft:       { label: "Draft",        color: C.mute,     bg: "rgba(110,99,83,0.16)" },
};

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

function KpiTile({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  accent: string;
}) {
  return (
    <motion.div
      {...fadeUp}
      className="rounded-lg p-4 border"
      style={{ background: C.card, borderColor: C.border }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wider" style={{ color: C.mute }}>
          {label}
        </div>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="text-[24px] font-bold leading-none" style={{ color: C.text }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-1.5" style={{ color: C.text3 }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}

function CampaignBar({
  campaign, count, total, meta,
}: {
  campaign: string; count: number; total: number;
  meta: { label: string; color: string; angle: string };
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div
      className="rounded-lg p-3 border"
      style={{ background: C.card, borderColor: C.border }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
          <div className="text-[12px] font-medium truncate" style={{ color: C.text }}>
            {meta.label}
          </div>
        </div>
        <div className="text-[12px] font-bold" style={{ color: meta.color }}>
          {count}
        </div>
      </div>
      <div className="text-[10px] mb-2 truncate" style={{ color: C.mute }} title={meta.angle}>
        {meta.angle}
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: C.borderDeep }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full"
          style={{ background: meta.color }}
        />
      </div>
    </div>
  );
}

function CopyChip({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] border transition hover:opacity-80"
      style={{
        background: C.elev,
        borderColor: C.border,
        color: copied ? C.emerald : C.gold,
      }}
      title={value}
    >
      <Copy size={9} />
      {label || (copied ? "copied" : value.slice(0, 8) + "…")}
    </button>
  );
}

function CompanyRow({
  c, expanded, onToggle,
}: {
  c: CompanyContacted;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ background: C.card, borderColor: C.border }}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 text-left transition hover:opacity-90"
      >
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={12} style={{ color: C.mute }} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: C.text }}>
            {slugToName(c.slug)}
          </div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: C.mute }}>
            {c.slug}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {c.campaigns.map(camp => {
            const m = CAMPAIGN_META[camp];
            return m ? (
              <Pill key={camp} label={m.label} color={m.color} bg={`${m.color}20`} />
            ) : (
              <Pill key={camp} label={camp} color={C.text2} bg={C.border} />
            );
          })}
        </div>
        <div
          className="text-[11px] font-bold w-12 text-right tabular-nums"
          style={{ color: C.gold }}
        >
          ×{c.total_sends}
        </div>
        <Pill
          label={STATUS_META[c.status]?.label || c.status}
          color={STATUS_META[c.status]?.color || C.text3}
          bg={STATUS_META[c.status]?.bg || C.border}
        />
        {c.has_resend_id && (
          <CheckCircle2 size={12} style={{ color: C.emerald }} title="Resend ID confirmed" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            <div className="p-4 space-y-2">
              {c.sends.map((s, i) => (
                <div
                  key={i}
                  className="rounded p-2.5 flex items-center gap-3"
                  style={{ background: C.bgMid, border: `1px solid ${C.borderDeep}` }}
                >
                  <Mail size={12} style={{ color: CAMPAIGN_META[s.campaign]?.color || C.gold }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-medium" style={{ color: C.text }}>
                        {CAMPAIGN_META[s.campaign]?.label || s.campaign}
                      </span>
                      <Pill
                        label={s.status}
                        color={STATUS_META[s.status]?.color || C.text3}
                        bg={STATUS_META[s.status]?.bg || C.border}
                      />
                    </div>
                    <div className="text-[10px] truncate" style={{ color: C.mute }} title={s.manifest}>
                      manifest: {s.manifest}
                    </div>
                  </div>
                  {s.resend_id ? (
                    <CopyChip value={s.resend_id} label="resend_id" />
                  ) : (
                    <span className="text-[10px]" style={{ color: C.mute }}>
                      no resend id
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GTMRealPage() {
  const [data, setData] = useState<GTMRealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/agency/gtm-real", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Failed to load GTM Studio V2 data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(() => load(), 60_000);
    return () => clearInterval(i);
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.companies_contacted.filter(c => {
      if (campaignFilter !== "all" && !c.campaigns.includes(campaignFilter)) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (q) {
        const hay = `${c.slug} ${slugToName(c.slug)} ${c.campaigns.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, campaignFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!data) return null;
    const companies = data.companies_contacted;
    const totalSends = companies.reduce((sum, c) => sum + c.total_sends, 0);
    const multiTouch = companies.filter(c => c.campaigns.length > 1).length;
    const withResend = companies.filter(c => c.has_resend_id).length;
    const campaignCounts: Record<string, number> = {};
    companies.forEach(c => c.campaigns.forEach(camp => {
      campaignCounts[camp] = (campaignCounts[camp] || 0) + 1;
    }));
    return { totalSends, multiTouch, withResend, campaignCounts };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ background: C.bg, minHeight: "50vh" }}>
        <div className="text-[13px]" style={{ color: C.mute }}>
          Loading GTM Studio V2 real pipeline…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div
          className="rounded-lg p-6 border flex items-start gap-3"
          style={{ background: C.card, borderColor: "#ef4444" }}
        >
          <AlertTriangle size={18} style={{ color: "#ef4444" }} />
          <div>
            <div className="text-[13px] font-medium mb-1" style={{ color: C.text }}>
              GTM Studio V2 unreachable
            </div>
            <div className="text-[11px]" style={{ color: C.text3 }}>
              {error || "No data returned from /api/agency/gtm-real"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const s = data.summary;
  const allCampaigns = ["all", ...Object.keys(CAMPAIGN_META).filter(c =>
    data.manifests.summaries.some(m => m.campaign === c)
  )];

  return (
    <div className="max-w-[1500px] mx-auto px-6 md:px-8 py-8 pb-20">
      {/* Header */}
      <motion.div {...fadeUp} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="grid place-items-center w-9 h-9 rounded-lg"
                style={{ background: "rgba(212,165,116,0.12)" }}
              >
                <Radio size={18} style={{ color: C.gold }} />
              </div>
              <div>
                <h1 className="text-[24px] font-bold leading-none" style={{ color: C.text }}>
                  GTM Studio V2 — Real Pipeline
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px]" style={{ color: C.mute }}>
                    Source: <span className="font-mono">{data.source}</span>
                  </span>
                  <Pill label="LIVE" color={C.emerald} bg="rgba(90,184,150,0.14)" />
                  <span className="text-[11px]" style={{ color: C.mute }}>
                    · {data.pipeline_root.replace("/Users/rig128gb/Developer/", "~/Developer/")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => load(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-md flex items-center gap-2 text-[11px] font-medium border disabled:opacity-50"
            style={{ background: C.card, borderColor: C.borderHot, color: C.gold }}
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </motion.button>
        </div>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiTile label="Total Prospects"   value={fmt(s.total_prospects)}            icon={Users}        accent={C.gold}    sub="discovered pool" />
        <KpiTile label="Confirmed Sent"    value={fmt(s.confirmed_sent)}              icon={Send}         accent={C.emerald} sub="Resend IDs attached" />
        <KpiTile label="Unique Companies"  value={fmt(s.unique_companies_contacted)}  icon={Building2}    accent={C.gold}    sub={`×${stats?.multiTouch || 0} multi-touch`} />
        <KpiTile label="Send Rate"         value={s.send_rate}                        icon={TrendingUp}   accent={C.emerald} sub="contacted ÷ prospects" />
        <KpiTile label="With Resend ID"    value={fmt(s.with_resend_id)}              icon={CheckCircle2} accent={C.emerald} sub="verifiable sends" />
        <KpiTile label="Manifests"         value={fmt(data.manifests.parsed.length)}  icon={FileJson}     accent={C.gold}    sub="parsed" />
      </div>

      {/* Health banner */}
      <motion.div
        {...fadeUp}
        className="rounded-lg p-4 mb-6 border flex items-center gap-3"
        style={{
          background: s.confirmed_sent > 0
            ? "linear-gradient(90deg, rgba(90,184,150,0.10), rgba(212,165,116,0.04))"
            : C.card,
          borderColor: s.confirmed_sent > 0 ? C.emerald : C.border,
        }}
      >
        <div
          className="grid place-items-center w-10 h-10 rounded-full shrink-0"
          style={{ background: s.confirmed_sent > 0 ? "rgba(90,184,150,0.18)" : C.border }}
        >
          {s.confirmed_sent > 0
            ? <CheckCircle2 size={20} style={{ color: C.emerald }} />
            : <AlertTriangle size={20} style={{ color: C.gold }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold" style={{ color: C.text }}>
            {s.confirmed_sent > 0
              ? `Pipeline live — ${s.confirmed_sent} confirmed sends across ${s.unique_companies_contacted} companies`
              : "Pipeline idle — no confirmed sends yet"}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>
            {s.total_prospects} prospects in the pool · {data.manifests.parsed.length} manifests parsed · {s.with_resend_id} resend IDs verified
          </div>
        </div>
        <Pill
          label={s.confirmed_sent > 0 ? "ARMED" : "DORMANT"}
          color={s.confirmed_sent > 0 ? C.emerald : C.gold}
          bg={s.confirmed_sent > 0 ? "rgba(90,184,150,0.14)" : "rgba(212,165,116,0.14)"}
        />
      </motion.div>

      {/* Two-column: Manifests + Campaign breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Manifests ledger */}
        <div className="lg:col-span-2">
          <div
            className="rounded-lg border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: C.border }}
            >
              <div className="flex items-center gap-2">
                <FileJson size={14} style={{ color: C.gold }} />
                <span className="text-[12px] font-semibold" style={{ color: C.text }}>
                  Manifest Ledger
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: C.elev, color: C.mute }}>
                  {data.manifests.parsed.length}
                </span>
              </div>
              <span className="text-[10px]" style={{ color: C.mute }}>
                Resend-armed send manifests
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: C.borderDeep }}>
              {data.manifests.summaries.map((m, i) => {
                const meta = CAMPAIGN_META[m.campaign] || {
                  label: m.campaign, color: C.gold, angle: "—",
                };
                return (
                  <div key={i} className="px-4 py-3 flex items-center gap-3" style={{ borderColor: C.borderDeep }}>
                    <div
                      className="w-1.5 h-10 rounded-full shrink-0"
                      style={{ background: meta.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium" style={{ color: C.text }}>
                          {meta.label}
                        </span>
                        <Pill
                          label={m.dry_run_preview ? "DRY RUN" : "LIVE"}
                          color={m.dry_run_preview ? C.mute : C.emerald}
                          bg={m.dry_run_preview ? "rgba(110,99,83,0.14)" : "rgba(90,184,150,0.14)"}
                        />
                        <span className="text-[10px] font-mono" style={{ color: C.mute }}>
                          {m.sent_count} sends
                        </span>
                      </div>
                      <div className="text-[10px] mt-0.5 font-mono truncate" style={{ color: C.mute }} title={m.armed_by}>
                        {m.file}
                      </div>
                    </div>
                    <CopyChip value={m.file} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Campaign breakdown panel */}
        <div className="space-y-3">
          <div
            className="rounded-lg p-3 border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Layers size={13} style={{ color: C.gold }} />
              <span className="text-[12px] font-semibold" style={{ color: C.text }}>
                Campaign Mix
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(CAMPAIGN_META).map(([key, meta]) => {
                const count = stats?.campaignCounts[key] || 0;
                return (
                  <CampaignBar
                    key={key}
                    campaign={key}
                    count={count}
                    total={data.companies_contacted.length}
                    meta={meta}
                  />
                );
              })}
            </div>
          </div>

          <div
            className="rounded-lg p-3 border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={13} style={{ color: C.gold }} />
              <span className="text-[12px] font-semibold" style={{ color: C.text }}>
                Touch Distribution
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              {[
                { label: "1× touch", count: data.companies_contacted.filter(c => c.total_sends === 1).length, color: C.text3 },
                { label: "2× touches", count: data.companies_contacted.filter(c => c.total_sends === 2).length, color: C.gold },
                { label: "3× touches", count: data.companies_contacted.filter(c => c.total_sends === 3).length, color: C.plum },
                { label: "4× touches", count: data.companies_contacted.filter(c => c.total_sends >= 4).length, color: C.emerald },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: row.color }} />
                    <span style={{ color: C.text2 }}>{row.label}</span>
                  </div>
                  <span className="font-mono tabular-nums" style={{ color: C.text }}>
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div
        className="rounded-lg p-3 border mb-4 flex items-center gap-3 flex-wrap"
        style={{ background: C.card, borderColor: C.border }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={13} style={{ color: C.mute }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by slug, name, or campaign…"
            className="flex-1 bg-transparent border-none outline-none text-[12px] py-1"
            style={{ color: C.text }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: C.elev, color: C.mute }}
            >
              clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: C.mute }} />
          {allCampaigns.map(camp => {
            const isActive = campaignFilter === camp;
            const meta = camp === "all" ? null : CAMPAIGN_META[camp];
            return (
              <button
                key={camp}
                onClick={() => setCampaignFilter(camp)}
                className="px-2.5 py-1 rounded-full text-[10px] font-medium border transition"
                style={{
                  background: isActive
                    ? (meta ? `${meta.color}24` : C.gold)
                    : C.elev,
                  borderColor: isActive
                    ? (meta ? meta.color : C.gold)
                    : C.border,
                  color: isActive
                    ? (meta ? meta.color : C.bg)
                    : C.text3,
                }}
              >
                {camp === "all" ? "All campaigns" : (meta?.label || camp)}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          {["all", "sent", "delivered", "failed", "dry_run"].map(st => {
            const isActive = statusFilter === st;
            const meta = STATUS_META[st] || { label: st === "all" ? "All status" : st, color: C.text3, bg: C.border };
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className="px-2.5 py-1 rounded-full text-[10px] font-medium border transition"
                style={{
                  background: isActive ? (st === "all" ? C.gold : meta.bg) : C.elev,
                  borderColor: isActive ? (st === "all" ? C.gold : meta.color) : C.border,
                  color: isActive ? (st === "all" ? C.bg : meta.color) : C.text3,
                }}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Companies contacted list */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={14} style={{ color: C.gold }} />
          <span className="text-[12px] font-semibold" style={{ color: C.text }}>
            Companies Touched
          </span>
          <span className="text-[10px] font-mono" style={{ color: C.mute }}>
            {filtered.length} of {data.companies_contacted.length}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: C.mute }}>
          {expanded.size} expanded
        </span>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="text-[12px]" style={{ color: C.mute }}>
              No companies match the current filter.
            </div>
          </div>
        ) : (
          filtered.map(c => (
            <CompanyRow
              key={c.slug}
              c={c}
              expanded={expanded.has(c.slug)}
              onToggle={() => {
                setExpanded(prev => {
                  const next = new Set(prev);
                  if (next.has(c.slug)) next.delete(c.slug);
                  else next.add(c.slug);
                  return next;
                });
              }}
            />
          ))
        )}
      </div>

      {/* Footer doctrine */}
      <div
        className="mt-10 pt-4 border-t flex items-center justify-between"
        style={{ borderColor: C.border }}
      >
        <div className="text-[10px]" style={{ color: C.mute }}>
          Auto-refresh 60s · {data.source} · resend IDs verified via {data.pipeline_root.split("/").pop()}
        </div>
        <div className="text-[10px] font-mono" style={{ color: C.gold }}>
          ProofPacket or it didn't happen
        </div>
      </div>
    </div>
  );
}
