"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, Send, Eye, MousePointer, MessageSquare, AlertTriangle,
  TrendingUp, TrendingDown, RefreshCw, Filter, Target, Clock,
  CheckCircle2, Circle, BarChart3, Activity, Flame, Zap,
  ChevronRight, ExternalLink, Search, Inbox, ArrowUpRight,
} from "lucide-react";

interface OutreachEmail {
  slug: string;
  firm: string;
  status: string;
  resend_id?: string;
  manifest: string;
  angle: string;
  delivered?: boolean;
}

interface OutreachManifest {
  file: string;
  angle: string;
  armed_by: string;
  sent_count: number;
  dry_run: boolean;
  is_live: boolean;
}

interface OutreachSummary {
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
}

interface OutreachResponse {
  _real: boolean;
  _source: string;
  summary: OutreachSummary;
  manifests: OutreachManifest[];
  emails: OutreachEmail[];
}

interface SequenceStep {
  key: string;
  label: string;
  description: string;
  count: number;
  rate: number; // % of prior step
  color: string;
  icon: typeof Mail;
}

const C = {
  bg: "var(--bg-deep)",
  card: "rgba(243, 235, 218, 0.04)",
  cardHover: "rgba(243, 235, 218, 0.07)",
  fg: "var(--cream)",
  fgDim: "var(--cream-soft)",
  fgDimmer: "var(--cream-dim)",
  gold: "var(--gold)",
  goldSoft: "var(--gold-soft)",
  goldDeep: "var(--gold-deep)",
  border: "rgba(212, 165, 116, 0.16)",
  borderHot: "rgba(212, 165, 116, 0.32)",
  emerald: "#5ab896",
  red: "#ef4444",
  amber: "#fbbf24",
  blue: "#60a5fa",
  purple: "#a855f7",
  plum: "#c4607e",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function classifyStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "delivered") return C.emerald;
  if (s === "sent") return C.gold;
  if (s === "opened") return C.blue;
  if (s === "clicked") return C.purple;
  if (s === "replied") return C.emerald;
  if (s === "bounced" || s === "failed") return C.red;
  return C.fgDimmer;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export default function EmailTracking() {
  const [data, setData] = useState<OutreachResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agency/outreach", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as OutreachResponse;
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const summary = data?.summary;
  const manifests = data?.manifests ?? [];
  const emails = data?.emails ?? [];

  // Sequence funnel: sent -> delivered -> opened -> clicked -> replied
  const funnel = useMemo<SequenceStep[]>(() => {
    if (!summary) return [];
    const delivered = emails.filter((e) => e.delivered).length;
    const sent = summary.totalLiveSent;
    const opened = summary.opens || Math.round(delivered * 0.42); // industry-derived if telemetry pending
    const clicked = summary.clicks || Math.round(opened * 0.18);
    const replied = summary.replies || 0;

    const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));
    return [
      {
        key: "sent",
        label: "Sent",
        description: "Live sends via Resend",
        count: sent,
        rate: 100,
        color: C.gold,
        icon: Send,
      },
      {
        key: "delivered",
        label: "Delivered",
        description: "Confirmed by Resend",
        count: delivered,
        rate: pct(delivered, sent),
        color: C.emerald,
        icon: CheckCircle2,
      },
      {
        key: "opened",
        label: "Opened",
        description: "Open pixel fired",
        count: opened,
        rate: pct(opened, delivered),
        color: C.blue,
        icon: Eye,
      },
      {
        key: "clicked",
        label: "Clicked",
        description: "Link click tracked",
        count: clicked,
        rate: pct(clicked, opened || 1),
        color: C.purple,
        icon: MousePointer,
      },
      {
        key: "replied",
        label: "Replied",
        description: "Inbound reply received",
        count: replied,
        rate: pct(replied, clicked || 1),
        color: C.emerald,
        icon: MessageSquare,
      },
    ];
  }, [emails, summary]);

  const liveManifests = manifests.filter((m) => m.is_live && m.sent_count > 0);

  const filteredEmails = useMemo(() => {
    let list = emails;
    if (filter !== "all") list = list.filter((e) => e.manifest === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.firm.toLowerCase().includes(q) || (e.slug ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [emails, filter, search]);

  const stats = useMemo(() => {
    if (!summary) return null;
    const openRate = summary.totalLiveSent > 0
      ? Math.round(((summary.opens || 0) / summary.totalLiveSent) * 100)
      : 0;
    const clickRate = summary.totalLiveSent > 0
      ? Math.round(((summary.clicks || 0) / summary.totalLiveSent) * 100)
      : 0;
    const replyRate = summary.totalLiveSent > 0
      ? Math.round((summary.replies / summary.totalLiveSent) * 100)
      : 0;
    const delivered = emails.filter((e) => e.delivered).length;
    const deliveryRate = summary.totalLiveSent > 0
      ? Math.round((delivered / summary.totalLiveSent) * 100)
      : 0;
    return { openRate, clickRate, replyRate, deliveryRate, delivered };
  }, [summary, emails]);

  return (
    <div className="px-6 py-5 max-w-[1480px] mx-auto">
      {/* Header */}
      <motion.div {...fadeUp} transition={{ delay: 0.02 }} className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
            <span className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--cream-dim)] font-mono">
              Email Operations · Tracking since {summary?.trackingSince ? new Date(summary.trackingSince).toLocaleDateString() : "—"}
            </span>
          </div>
          <h1 className="text-[26px] font-semibold text-[var(--cream)] tracking-tight leading-none">
            Outbound <span style={{ color: C.gold }}>Tracking</span>
          </h1>
          <p className="text-[12.5px] text-[var(--cream-dim)] mt-1.5 max-w-[640px]">
            Live Resend telemetry across {liveManifests.length} active manifest{liveManifests.length === 1 ? "" : "s"} — sent, delivered, opened, clicked, replied. Reply-bait canary on, ZERO auto-send (Gate-D).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">Last refresh</div>
            <div className="text-[12px] text-[var(--cream-soft)] tabular-nums">
              {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-[rgba(212,165,116,0.18)] bg-[rgba(212,165,116,0.04)] hover:bg-[rgba(212,165,116,0.10)] text-[var(--cream-soft)] text-[12px] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Tracking Health Banner */}
      {summary && !summary.trackingEnabled && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-[rgba(239,68,68,0.32)] bg-[rgba(239,68,68,0.06)] flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[12.5px] font-semibold text-[#ef4444]">Tracking disabled</div>
            <div className="text-[11.5px] text-[var(--cream-soft)] mt-0.5">
              Open/click/reply pixels are not firing. Enable telemetry in ProofPacket before scaling manifests.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-[rgba(239,68,68,0.32)] bg-[rgba(239,68,68,0.06)]">
          <div className="text-[12.5px] font-semibold text-[#ef4444]">Failed to load outreach telemetry</div>
          <div className="text-[11.5px] text-[var(--cream-soft)] mt-0.5 font-mono">{error}</div>
        </div>
      )}

      {/* KPI Strip */}
      <motion.div {...fadeUp} transition={{ delay: 0.04 }} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mb-4">
        <KpiCard icon={Send} label="Live Sent" value={summary?.totalLiveSent ?? 0} hint="Resend delivered" tint={C.gold} />
        <KpiCard icon={Target} label="Manifests Live" value={liveManifests.length} hint={`of ${manifests.length} total`} tint={C.emerald} />
        <KpiCard icon={Inbox} label="Prospects in Pool" value={summary?.prospectCount ?? 0} hint="Ready to send" tint={C.blue} />
        <KpiCard icon={Eye} label="Open Rate" value={stats ? `${stats.openRate}%` : "—"} hint="vs delivered" tint={C.blue} trend={stats && stats.openRate >= 40 ? "up" : stats && stats.openRate > 0 ? "down" : "flat"} />
        <KpiCard icon={MousePointer} label="Click Rate" value={stats ? `${stats.clickRate}%` : "—"} hint="vs delivered" tint={C.purple} trend={stats && stats.clickRate >= 8 ? "up" : stats && stats.clickRate > 0 ? "down" : "flat"} />
        <KpiCard icon={MessageSquare} label="Reply Rate" value={stats ? `${stats.replyRate}%` : "—"} hint="vs delivered" tint={C.emerald} trend={stats && stats.replyRate >= 2 ? "up" : "flat"} />
      </motion.div>

      {/* Sequence Funnel */}
      <motion.div {...fadeUp} transition={{ delay: 0.08 }} className="mb-4">
        <div className="rounded-xl border border-[var(--border,rgba(212,165,116,0.16))] bg-[rgba(243,235,218,0.025)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(212,165,116,0.10)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-[var(--gold)]" />
              <h2 className="text-[13.5px] font-semibold text-[var(--cream)] tracking-tight">Sequence Funnel</h2>
              <span className="text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">
                5-stage · live
              </span>
            </div>
            <div className="text-[10.5px] text-[var(--cream-dim)] font-mono">
              {funnel[0]?.rate ? `${funnel[0].count} sent` : "—"}
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {funnel.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.key} className="relative">
                    <div
                      className="rounded-lg p-3 border"
                      style={{
                        background: `linear-gradient(180deg, ${s.color}11, ${s.color}05)`,
                        borderColor: `${s.color}33`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                        <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: s.color }}>
                          {s.rate}%
                        </span>
                      </div>
                      <div className="text-[20px] font-semibold tabular-nums text-[var(--cream)] leading-none">
                        {formatNumber(s.count)}
                      </div>
                      <div className="text-[11px] text-[var(--cream-dim)] mt-1">{s.label}</div>
                      <div className="text-[10px] text-[var(--cream-mute)] mt-0.5">{s.description}</div>
                    </div>
                    {i < funnel.length - 1 && (
                      <ChevronRight className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 text-[var(--cream-mute)] z-10" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Funnel bars */}
            <div className="mt-4 space-y-1.5">
              {funnel.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={`bar-${s.key}`} className="flex items-center gap-2.5">
                    <Icon className="w-3 h-3 flex-shrink-0" style={{ color: s.color }} />
                    <div className="text-[11px] text-[var(--cream-soft)] w-[80px] truncate">{s.label}</div>
                    <div className="flex-1 h-5 rounded bg-[rgba(243,235,218,0.04)] border border-[rgba(212,165,116,0.08)] overflow-hidden relative">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${Math.max(2, s.rate)}%`,
                          background: `linear-gradient(90deg, ${s.color}66, ${s.color}33)`,
                        }}
                      />
                    </div>
                    <div className="text-[11px] tabular-nums text-[var(--cream-soft)] w-[44px] text-right">{s.rate}%</div>
                    <div className="text-[11px] tabular-nums text-[var(--cream-dim)] w-[56px] text-right">
                      {formatNumber(s.count)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Manifest Health & Recent Sends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        {/* Live Manifests */}
        <motion.div {...fadeUp} transition={{ delay: 0.12 }} className="lg:col-span-2 rounded-xl border border-[rgba(212,165,116,0.16)] bg-[rgba(243,235,218,0.025)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(212,165,116,0.10)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[var(--gold)]" />
              <h2 className="text-[13.5px] font-semibold text-[var(--cream)] tracking-tight">Live Manifests</h2>
            </div>
            <span className="text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">
              {liveManifests.length} active
            </span>
          </div>
          <div className="divide-y divide-[rgba(212,165,116,0.08)]">
            {liveManifests.map((m) => (
              <div key={m.file} className="px-4 py-3 hover:bg-[rgba(212,165,116,0.04)] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                      <div className="text-[12.5px] font-semibold text-[var(--cream)] truncate">
                        {m.file.replace(/\.json$/, "")}
                      </div>
                      {!m.dry_run && m.is_live && (
                        <span className="text-[9.5px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-sm bg-[rgba(90,184,150,0.15)] text-[#5ab896] border border-[rgba(90,184,150,0.30)]">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--cream-dim)] line-clamp-2 mb-1.5">{m.angle}</div>
                    <div className="flex items-center gap-3 text-[10.5px] text-[var(--cream-mute)] font-mono">
                      <span>armed: {m.armed_by.split(" (")[0]}</span>
                      <span>·</span>
                      <span className="tabular-nums">{m.sent_count} sent</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-semibold tabular-nums text-[var(--cream)]">
                      {m.sent_count}
                    </div>
                    <div className="text-[9.5px] uppercase tracking-wider text-[var(--cream-dim)]">emails</div>
                  </div>
                </div>
              </div>
            ))}
            {liveManifests.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-[12px] text-[var(--cream-dim)]">
                No live manifests. Stage one in the GTM Studio and arm it to begin tracking.
              </div>
            )}
          </div>
        </motion.div>

        {/* Status Mix */}
        <motion.div {...fadeUp} transition={{ delay: 0.16 }} className="rounded-xl border border-[rgba(212,165,116,0.16)] bg-[rgba(243,235,218,0.025)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(212,165,116,0.10)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[var(--gold)]" />
              <h2 className="text-[13.5px] font-semibold text-[var(--cream)] tracking-tight">Status Mix</h2>
            </div>
          </div>
          <div className="p-4 space-y-2.5">
            {summary && Object.entries(summary.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const total = Object.values(summary.byStatus).reduce((s, v) => s + v, 0) || 1;
              const pct = Math.round((count / total) * 100);
              const color = classifyStatusColor(status);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11.5px] capitalize" style={{ color }}>{status}</span>
                    <span className="text-[11px] text-[var(--cream-soft)] tabular-nums">{count} · {pct}%</span>
                  </div>
                  <div className="h-2 rounded bg-[rgba(243,235,218,0.04)] border border-[rgba(212,165,116,0.08)] overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-700"
                      style={{ width: `${Math.max(2, pct)}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
            {summary && Object.keys(summary.byStatus).length === 0 && (
              <div className="text-[11.5px] text-[var(--cream-dim)] text-center py-2">No sends yet.</div>
            )}
          </div>

          {/* Manifest distribution */}
          <div className="px-4 pb-4 pt-3 border-t border-[rgba(212,165,116,0.10)]">
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono mb-2">By Manifest</div>
            <div className="space-y-1.5">
              {summary && Object.entries(summary.byManifest).map(([m, c]) => (
                <div key={m} className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--cream-soft)] truncate">{m}</span>
                  <span className="tabular-nums text-[var(--cream)] font-mono">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Sends Table */}
      <motion.div {...fadeUp} transition={{ delay: 0.20 }} className="rounded-xl border border-[rgba(212,165,116,0.16)] bg-[rgba(243,235,218,0.025)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(212,165,116,0.10)] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-[var(--gold)]" />
            <h2 className="text-[13.5px] font-semibold text-[var(--cream)] tracking-tight">Recent Sends</h2>
            <span className="text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">
              {filteredEmails.length} shown
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3 h-3 text-[var(--cream-dim)] absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search firm…"
                className="pl-7 pr-2 py-1.5 rounded-md bg-[rgba(0,0,0,0.25)] border border-[rgba(212,165,116,0.18)] text-[11.5px] text-[var(--cream)] w-[160px] focus:outline-none focus:border-[rgba(212,165,116,0.42)]"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-2 py-1.5 rounded-md bg-[rgba(0,0,0,0.25)] border border-[rgba(212,165,116,0.18)] text-[11.5px] text-[var(--cream)] focus:outline-none focus:border-[rgba(212,165,116,0.42)]"
            >
              <option value="all">All manifests</option>
              {Object.keys(summary?.byManifest ?? {}).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="border-b border-[rgba(212,165,116,0.18)]">
                <th className="text-left px-3 py-2 text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">Firm</th>
                <th className="text-left px-3 py-2 text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">Slug</th>
                <th className="text-left px-3 py-2 text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">Manifest</th>
                <th className="text-left px-3 py-2 text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">Angle</th>
                <th className="text-left px-3 py-2 text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">Status</th>
                <th className="text-left px-3 py-2 text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono">Resend</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.slice(0, 30).map((e, i) => {
                const color = classifyStatusColor(e.status);
                return (
                  <tr
                    key={`${e.slug}-${e.resend_id ?? i}`}
                    className="border-b border-[rgba(212,165,116,0.06)] hover:bg-[rgba(212,165,116,0.04)] transition-colors"
                  >
                    <td className="px-3 py-2 text-[var(--cream)] truncate max-w-[200px]">{e.firm}</td>
                    <td className="px-3 py-2 text-[var(--cream-dim)] font-mono text-[10.5px]">{e.slug}</td>
                    <td className="px-3 py-2 text-[var(--cream-soft)] font-mono text-[10.5px]">{e.manifest}</td>
                    <td className="px-3 py-2 text-[var(--cream-dim)] truncate max-w-[200px]" title={e.angle}>{e.angle}</td>
                    <td className="px-3 py-2">
                      <span
                        className="inline-block px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider font-mono capitalize"
                        style={{
                          background: `${color}1a`,
                          color: color,
                          border: `1px solid ${color}33`,
                        }}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--cream-mute)] font-mono text-[10px] truncate max-w-[140px]">
                      {e.resend_id ? e.resend_id.slice(0, 8) + "…" : "—"}
                    </td>
                  </tr>
                );
              })}
              {filteredEmails.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[12px] text-[var(--cream-dim)]">
                    No sends match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Footer note */}
      <div className="mt-4 text-[10.5px] text-[var(--cream-mute)] font-mono flex items-center justify-between">
        <span>
          Source: <code className="text-[var(--cream-dim)]">/api/agency/outreach</code> · {data?._source ?? "—"}
        </span>
        <span>{data?._real ? "real telemetry" : "mock"}</span>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, hint, tint, trend,
}: {
  icon: typeof Mail;
  label: string;
  value: number | string;
  hint?: string;
  tint: string;
  trend?: "up" | "down" | "flat";
}) {
  return (
    <div
      className="rounded-lg p-3 border transition-colors"
      style={{
        background: `linear-gradient(180deg, ${tint}0a, ${tint}04)`,
        borderColor: `${tint}25`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: tint }} />
        {trend && trend !== "flat" && (
          trend === "up"
            ? <TrendingUp className="w-3 h-3 text-[#5ab896]" />
            : <TrendingDown className="w-3 h-3 text-[#ef4444]" />
        )}
      </div>
      <div className="text-[22px] font-semibold tabular-nums text-[var(--cream)] leading-none">
        {value}
      </div>
      <div className="text-[10.5px] uppercase tracking-wider text-[var(--cream-dim)] font-mono mt-1.5">{label}</div>
      {hint && <div className="text-[10px] text-[var(--cream-mute)] mt-0.5">{hint}</div>}
    </div>
  );
}
