"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, MailOpen, MousePointerClick, MessageSquareReply, RefreshCw,
  Send, AlertTriangle, CheckCircle2, XCircle, ExternalLink, Activity, Building2,
} from "lucide-react";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

interface OutreachEmail {
  slug: string;
  firm: string;
  status: string;
  resend_id: string;
  manifest: string;
  angle: string;
  delivered: boolean;
}
interface Manifest {
  file: string;
  angle: string;
  armed_by: string;
  sent_count: number;
  dry_run: boolean;
  is_live: boolean;
}
interface OutreachData {
  _real?: boolean;
  _source?: string;
  summary: {
    totalEmailsSent: number;
    totalDryRun: number;
    totalLiveSent: number;
    uniqueCompanies: number;
    uniqueResendIds: number;
    replies: number;
    opens: number;
    clicks: number;
    byManifest: Record<string, number>;
    byStatus: Record<string, number>;
    prospectCount: number;
    trackingEnabled: boolean;
    trackingSince: string;
  };
  manifests: Manifest[];
  emails: OutreachEmail[];
}

const FALLBACK: OutreachData = {
  _real: false,
  _source: "API unreachable — fallback sample",
  summary: {
    totalEmailsSent: 0, totalDryRun: 0, totalLiveSent: 0, uniqueCompanies: 0,
    uniqueResendIds: 0, replies: 0, opens: 0, clicks: 0, byManifest: {},
    byStatus: {}, prospectCount: 0, trackingEnabled: false, trackingSince: "",
  },
  manifests: [],
  emails: [],
};

export default function EmailTrackingPage() {
  const [data, setData] = useState<OutreachData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/agency/outreach", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(j || FALLBACK);
    } catch (e: any) {
      setError(e?.message || "fetch failed");
      setData(FALLBACK);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { summary, emails, manifests } = data;

  // Evidence-backed metrics: computed from real data, never hardcoded.
  const sent = summary.totalEmailsSent;
  const live = summary.totalLiveSent;
  const dry = summary.totalDryRun;
  const opens = summary.opens;
  const clicks = summary.clicks;
  const replies = summary.replies;
  const companies = summary.uniqueCompanies;
  const openRate = sent > 0 ? (opens / sent) * 100 : 0;
  const clickRate = sent > 0 ? (clicks / sent) * 100 : 0;
  const replyRate = sent > 0 ? (replies / sent) * 100 : 0;
  const delivered = emails.filter(e => e.delivered).length;
  const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;

  // firm-level aggregation
  const byFirm = useMemo(() => {
    const map = new Map<string, { firm: string; count: number; delivered: number; manifests: Set<string> }>();
    for (const e of emails) {
      const key = e.slug || e.firm;
      if (!map.has(key)) map.set(key, { firm: e.firm || key, count: 0, delivered: 0, manifests: new Set() });
      const row = map.get(key)!;
      row.count++; if (e.delivered) row.delivered++; row.manifests.add(e.manifest);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 12);
  }, [emails]);

  const filtered = useMemo(() => {
    let list = emails;
    if (selected !== "all") {
      if (selected === "delivered") list = list.filter(e => e.delivered);
      else list = list.filter(e => !e.delivered);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.firm.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q) || e.manifest.toLowerCase().includes(q));
    }
    return list.slice(0, 60);
  }, [emails, selected, search]);

  const statCards = [
    { label: "Emails Sent", value: sent, sub: `${live} live · ${dry} dry-run`, color: "#d4a574", icon: Send },
    { label: "Delivered", value: delivered, sub: `${deliveryRate.toFixed(0)}% delivery`, color: "#5ab896", icon: CheckCircle2 },
    { label: "Unique Firms", value: companies, sub: `${summary.prospectCount} prospects`, color: "#7dd3fc", icon: Building2 },
    { label: "Manifests", value: manifests.length, sub: `${manifests.filter(m => m.is_live).length} live`, color: "#c084fc", icon: Activity },
  ];
  const engageCards = [
    { label: "Opens", value: opens, rate: openRate, color: "#fbbf24", icon: MailOpen },
    { label: "Clicks", value: clicks, rate: clickRate, color: "#5ab896", icon: MousePointerClick },
    { label: "Replies", value: replies, rate: replyRate, color: "#7dd3fc", icon: MessageSquareReply },
    { label: "Delivery Rate", value: delivered, rate: deliveryRate, color: "#d4a574", icon: Mail },
  ];

  return (
    <div className="space-y-7 px-1">
      {/* Header */}
      <motion.section {...fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Mail size={22} style={{ color: "var(--gold)" }} />
            <h1 style={{ fontFamily: "Manrope" }} className="text-3xl font-bold tracking-tight text-[var(--cream)]">
              Email Engagement Tracking
            </h1>
          </div>
          <p style={{ color: "var(--cream-dim)" }} className="text-sm mt-2 max-w-2xl">
            Real-time outbound engagement computed from live GTM Studio send manifests and Resend IDs.
            Every metric below is derived from actual sends — no fabricated numbers.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{ background: "var(--panel)", color: "var(--gold)", border: "1px solid var(--border)" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Syncing…" : "Refresh"}
        </button>
      </motion.section>

      {/* Source banner */}
      <motion.div {...fadeUp} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
        style={{ background: data._real ? "rgba(90,184,150,0.08)" : "rgba(251,191,36,0.08)", color: data._real ? "#5ab896" : "#fbbf24", border: `1px solid ${data._real ? "rgba(90,184,150,0.2)" : "rgba(251,191,36,0.2)"}` }}>
        {data._real ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
        <span className="truncate">{data._source}</span>
        {summary.trackingSince && (
          <span className="opacity-60 ml-auto whitespace-nowrap">since {new Date(summary.trackingSince).toLocaleDateString()}</span>
        )}
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          <XCircle size={13} /> {error}
        </div>
      )}

      {/* Top stat cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="panel p-5 flex items-center gap-3">
            <div style={{ background: `${c.color}16`, color: c.color, padding: "10px", borderRadius: "12px" }}>
              <c.icon size={18} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--cream)]">{c.value.toLocaleString()}</div>
              <p className="opacity-50 text-[10px] mt-0.5 uppercase tracking-wide text-[var(--cream-dim)]">{c.label}</p>
              <p className="text-[10px] text-[var(--cream-mute)]">{c.sub}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Engagement funnel */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--cream-dim)] mb-3">Engagement Funnel</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {engageCards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              className="panel p-5">
              <div className="flex items-center justify-between mb-3">
                <c.icon size={16} style={{ color: c.color }} />
                <span className="text-xl font-bold" style={{ color: c.color }}>{c.rate.toFixed(0)}%</span>
              </div>
              <div className="text-2xl font-bold text-[var(--cream)]">{c.value.toLocaleString()}</div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--cream-dim)] mt-1">{c.label}</p>
              <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(212,200,180,0.08)" }}>
                <div style={{ width: `${Math.min(c.rate, 100)}%`, height: "100%", background: c.color, transition: "width .6s" }} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Email log */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--cream-dim)]">Send Log ({emails.length})</h2>
            <div className="flex gap-2 items-center">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter firm, slug, manifest…"
                className="text-xs px-3 py-1.5 rounded-md outline-none w-48"
                style={{ background: "var(--panel)", color: "var(--cream)", border: "1px solid var(--border)" }}
              />
            </div>
          </div>

          <div className="flex gap-1 border-b" style={{ borderColor: "rgba(212,200,180,0.06)" }}>
            {([["all", "All"], ["delivered", "Delivered"], ["failed", "Failed"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setSelected(k)}
                style={{ color: selected === k ? "var(--gold)" : "var(--cream-mute)", borderBottom: selected === k ? "2px solid var(--gold)" : "2px solid transparent" }}
                className="px-4 py-2 text-sm font-medium">
                {label}
              </button>
            ))}
          </div>

          <section className="space-y-2">
            {filtered.length === 0 && (
              <div className="panel p-8 text-center text-sm text-[var(--cream-dim)]">No sends match this filter.</div>
            )}
            {filtered.map((e, i) => (
              <motion.div key={`${e.slug}-${e.resend_id}-${i}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="panel p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--cream)] text-sm">{e.firm}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(192,132,252,0.12)", color: "#c084fc" }}>{e.manifest}</span>
                  </div>
                  <p className="text-xs text-[var(--cream-dim)] mt-1 truncate">{e.angle}</p>
                  <p className="text-[10px] text-[var(--cream-mute)] mt-1 font-mono">{e.resend_id || "no-id"}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold whitespace-nowrap"
                  style={{ background: e.delivered ? "rgba(90,184,150,0.14)" : "rgba(239,68,68,0.14)", color: e.delivered ? "#5ab896" : "#ef4444" }}>
                  {e.delivered ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {e.status}
                </div>
              </motion.div>
            ))}
          </section>
        </div>

        {/* Right rail: top firms + manifests */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--cream-dim)] mb-3">Top Firms</h2>
            <div className="space-y-1.5">
              {byFirm.length === 0 && <div className="panel p-4 text-center text-xs text-[var(--cream-dim)]">No firm data.</div>}
              {byFirm.map((f, i) => (
                <motion.div key={f.firm + i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="panel p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--cream)] truncate">{f.firm}</p>
                    <p className="text-[10px] text-[var(--cream-mute)]">{f.delivered}/{f.count} delivered · {f.manifests.size} touches</p>
                  </div>
                  <span className="text-lg font-bold text-[var(--gold)]">{f.count}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--cream-dim)] mb-3">Send Manifests</h2>
            <div className="space-y-1.5">
              {manifests.length === 0 && <div className="panel p-4 text-center text-xs text-[var(--cream-dim)]">No manifests found.</div>}
              {manifests.map((m, i) => (
                <motion.div key={m.file + i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="panel p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-[var(--cream)] truncate flex-1">{m.file}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: m.is_live ? "rgba(90,184,150,0.14)" : "rgba(251,191,36,0.14)", color: m.is_live ? "#5ab896" : "#fbbf24" }}>
                      {m.is_live ? "LIVE" : "DRY"}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--cream-dim)] mt-1">{m.angle}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-[var(--cream-mute)]">{m.sent_count} sent</span>
                    <span className="text-[10px] text-[var(--cream-mute)]">armed: {m.armed_by}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
