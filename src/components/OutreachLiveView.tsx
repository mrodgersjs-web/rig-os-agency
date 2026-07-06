"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Send, CheckCircle2, AlertCircle, RefreshCw, Search, Filter,
  ExternalLink, Clock, Hash, Users, TrendingUp, Zap, FileJson,
  ChevronDown, ChevronRight, Copy, Database, Activity, Calendar,
  AlertTriangle, BarChart3, Eye,
} from "lucide-react";

// ── RIG OS Agency — Outreach LIVE ───────────────────────────────────────
// Wires to /api/agency/outreach (the REAL Resend tracking data).
// Shows: per-manifest breakdown, send counts, resend IDs, prospect overlap,
// live/dry-run split, tracking status, recent activity feed.
// Live data only — no fake numbers. Auto-refreshes every 30s.

interface EmailRow {
  slug: string;
  firm: string;
  status: "delivered" | "sent" | string;
  resend_id: string;
  manifest: string;
  angle: string;
  delivered?: boolean;
  ok?: boolean;
  code?: number;
}

interface ManifestRow {
  file: string;
  angle: string;
  armed_by: string;
  sent_count: number;
  dry_run: boolean;
  is_live: boolean;
}

interface OutreachData {
  _real: boolean;
  _source: string;
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
  manifests: ManifestRow[];
  emails: EmailRow[];
}

const ACCENT = "var(--gold)";
const ACCENT_2 = "var(--emerald)";

function fmtAgo(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  const d = Date.now() - t;
  if (d < 0) return "just now";
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function OutreachLiveView() {
  const [data, setData] = useState<OutreachData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [filterManifest, setFilterManifest] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedManifest, setExpandedManifest] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/agency/outreach", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as OutreachData;
      setData(j);
      setError(null);
      setLastFetch(Date.now());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const filteredEmails = useMemo(() => {
    if (!data) return [];
    return data.emails.filter((e) => {
      if (filterManifest !== "all" && e.manifest !== filterManifest) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.firm.toLowerCase().includes(q) && !e.slug.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, filterManifest, filterStatus, search]);

  const manifestGroups = useMemo(() => {
    if (!data) return [];
    const groups: Record<string, EmailRow[]> = {};
    for (const e of data.emails) {
      (groups[e.manifest] ??= []).push(e);
    }
    return Object.entries(groups)
      .map(([k, v]) => ({ name: k, emails: v }))
      .sort((a, b) => b.emails.length - a.emails.length);
  }, [data]);

  const copy = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 text-[var(--cream-dim)]">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-[13px]">Loading live outreach data…</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border p-6" style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.05)" }}>
        <div className="flex items-center gap-2 text-red-300 mb-1">
          <AlertCircle size={16} /> <span className="text-[13px] font-medium">Failed to load outreach data</span>
        </div>
        <div className="text-[12px] text-[var(--cream-mute)] font-mono">{error}</div>
        <button onClick={load} className="mt-3 px-3 py-1.5 rounded-lg border text-[11px]" style={{ borderColor: "rgba(212,200,180,0.2)", color: "var(--cream-dim)" }}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const s = data.summary;
  const liveManifests = data.manifests.filter((m) => m.is_live);
  const dryManifests = data.manifests.filter((m) => !m.is_live);
  const coverage = s.prospectCount > 0 ? ((s.uniqueCompanies / s.prospectCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl border p-5"
        style={{
          borderColor: "rgba(212,165,116,0.25)",
          background:
            "radial-gradient(ellipse at 0% 0%, rgba(212,165,116,0.18), transparent 55%)," +
            "radial-gradient(ellipse at 100% 100%, rgba(90,184,150,0.12), transparent 55%)," +
            "linear-gradient(180deg, rgba(212,165,116,0.06), transparent)",
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="grid place-items-center w-10 h-10 rounded-lg"
            style={{ background: "rgba(212,165,116,0.18)", color: ACCENT, boxShadow: "0 0 26px -10px var(--gold)" }}>
            <Mail size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
              Live · Resend Tracking
            </div>
            <div className="text-[18px] font-medium text-[var(--cream)]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Outreach Live — Real Sends &amp; Manifest Ledger
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {s.trackingEnabled && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest"
                style={{ background: "rgba(90,184,150,0.12)", color: ACCENT_2, border: "1px solid rgba(90,184,150,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT_2 }} />
                Tracking on
              </span>
            )}
            <button onClick={load}
              className="p-1.5 rounded-md border transition hover:bg-[rgba(212,165,116,0.08)]"
              style={{ borderColor: "rgba(212,200,180,0.15)", color: "var(--cream-dim)" }}
              title="Refresh now">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
        <p className="text-[12px] text-[var(--cream-dim)] max-w-[760px] mt-2">
          Wire-level view of every Resend send that has left the rig. Pulls manifests from{" "}
          <code className="text-[11px] px-1 py-0.5 rounded" style={{ background: "rgba(212,200,180,0.08)" }}>
            rig-gtm-studio-v2/proof/outbound/
          </code>
          {" "}— warmup day-1, follow-up one, reply-bait canary, autopilot, scale teasers, and any future
          /goal loops. Live manifests only fire when Mike&apos;s directive sets{" "}
          <code className="text-[11px] px-1 py-0.5 rounded" style={{ background: "rgba(212,200,180,0.08)" }}>LIVE_SEND=true</code>.
        </p>
        {lastFetch > 0 && (
          <div className="absolute bottom-2 right-3 text-[9.5px] uppercase tracking-widest text-[var(--cream-mute)] font-mono">
            synced {fmtAgo(new Date(lastFetch).toISOString())} · auto-refresh 30s
          </div>
        )}
      </motion.section>

      {/* ── KPI strip ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard label="Emails Sent" value={s.totalEmailsSent} sub="all manifests" icon={<Send size={14} />} accent="var(--cream)" />
        <KpiCard label="Live Sends" value={s.totalLiveSent} sub="real Resend API" icon={<Zap size={14} />} accent={ACCENT_2} highlight />
        <KpiCard label="Dry-Run" value={s.totalDryRun} sub="armed, not sent" icon={<FileJson size={14} />} accent="var(--cream-mute)" />
        <KpiCard label="Unique Firms" value={s.uniqueCompanies} sub={`${coverage}% of prospects`} icon={<Users size={14} />} accent={ACCENT} />
        <KpiCard label="Resend IDs" value={s.uniqueResendIds} sub="1:1 with sends" icon={<Hash size={14} />} accent="var(--cream-dim)" />
        <KpiCard label="Replies" value={s.replies} sub="live webhook" icon={<CheckCircle2 size={14} />} accent={ACCENT_2} />
        <KpiCard label="Prospects" value={s.prospectCount} sub="total GTM DB" icon={<Database size={14} />} accent="var(--cream-dim)" />
      </div>

      {/* ── Tracking status banner ───────────────────────────────────── */}
      <div className="rounded-xl border p-4 flex items-start gap-3"
        style={{
          borderColor: s.trackingEnabled ? "rgba(90,184,150,0.25)" : "rgba(212,165,116,0.2)",
          background: s.trackingEnabled ? "rgba(90,184,150,0.04)" : "rgba(212,165,116,0.04)",
        }}>
        <div className="grid place-items-center w-8 h-8 rounded-lg mt-0.5"
          style={{
            background: s.trackingEnabled ? "rgba(90,184,150,0.12)" : "rgba(212,165,116,0.12)",
            color: s.trackingEnabled ? ACCENT_2 : ACCENT,
          }}>
          {s.trackingEnabled ? <Activity size={15} /> : <AlertTriangle size={15} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>
            Resend webhook tracking {s.trackingEnabled ? "ACTIVE" : "INACTIVE"}
          </div>
          <div className="text-[11.5px] text-[var(--cream-dim)] mt-0.5">
            {s.trackingEnabled
              ? <>Webhooks wired since <span className="font-mono">{fmtDate(s.trackingSince)}</span>. Open / click / reply events will land here in real time as prospects engage.</>
              : <>Tracking not yet armed. Run <code className="text-[10.5px] px-1 py-0.5 rounded" style={{ background: "rgba(212,200,180,0.08)" }}>tracking-enabled</code> manifest from GTM Studio to flip the switch.</>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-[var(--cream-mute)]">Opens · Clicks · Replies</div>
          <div className="text-[14px] font-mono mt-0.5" style={{ color: "var(--cream)" }}>
            {s.opens} · {s.clicks} · {s.replies}
          </div>
        </div>
      </div>

      {/* ── Two columns: Manifests + Filtered feed ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Manifests column */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[var(--cream-mute)]">
            <FileJson size={11} />
            <span>Manifest Ledger · {data.manifests.length} total</span>
          </div>

          {/* Live manifests first */}
          {liveManifests.length > 0 && (
            <ManifestGroup
              title={`Live (${liveManifests.length})`}
              tone="emerald"
              items={liveManifests}
              counts={s.byManifest}
              onClick={(f) => setFilterManifest(filterManifest === f ? "all" : f)}
              active={filterManifest}
            />
          )}

          {/* Then dry-run */}
          {dryManifests.length > 0 && (
            <ManifestGroup
              title={`Armed / Dry-Run (${dryManifests.length})`}
              tone="dim"
              items={dryManifests}
              counts={s.byManifest}
              onClick={(f) => setFilterManifest(filterManifest === f ? "all" : f)}
              active={filterManifest}
            />
          )}
        </div>

        {/* Email feed column */}
        <div className="lg:col-span-3 space-y-3">
          {/* Filter bar */}
          <div className="rounded-xl border p-3 space-y-2"
            style={{ borderColor: "rgba(212,200,180,0.1)", background: "rgba(20,10,30,0.35)" }}>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--cream-mute)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search firm or slug…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-md text-[12px] bg-transparent border outline-none"
                  style={{ borderColor: "rgba(212,200,180,0.12)", color: "var(--cream)" }}
                />
              </div>
              <select value={filterManifest} onChange={(e) => setFilterManifest(e.target.value)}
                className="px-2 py-1.5 rounded-md text-[11px] border outline-none"
                style={{ borderColor: "rgba(212,200,180,0.12)", color: "var(--cream-dim)", background: "transparent" }}>
                <option value="all">All manifests</option>
                {Object.keys(s.byManifest).map((m) => <option key={m} value={m}>{m} ({s.byManifest[m]})</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1.5 rounded-md text-[11px] border outline-none"
                style={{ borderColor: "rgba(212,200,180,0.12)", color: "var(--cream-dim)", background: "transparent" }}>
                <option value="all">All status</option>
                {Object.keys(s.byStatus).map((st) => <option key={st} value={st}>{st} ({s.byStatus[st]})</option>)}
              </select>
            </div>
            <div className="text-[10.5px] text-[var(--cream-mute)] font-mono">
              Showing {filteredEmails.length} of {data.emails.length} emails
            </div>
          </div>

          {/* Email list */}
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredEmails.length === 0 && (
              <div className="rounded-xl border p-6 text-center"
                style={{ borderColor: "rgba(212,200,180,0.1)", background: "rgba(20,10,30,0.35)" }}>
                <div className="text-[12px] text-[var(--cream-mute)]">No emails match these filters.</div>
              </div>
            )}
            {filteredEmails.map((e, i) => {
              const isDelivered = e.status === "delivered";
              return (
                <motion.div
                  key={`${e.resend_id}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.2) }}
                  className="rounded-lg border p-3 hover:border-[rgba(212,165,116,0.3)] transition"
                  style={{
                    borderColor: "rgba(212,200,180,0.08)",
                    background: "rgba(20,10,30,0.4)",
                  }}>
                  <div className="flex items-start gap-3">
                    <div className="grid place-items-center w-7 h-7 rounded-md shrink-0 mt-0.5"
                      style={{
                        background: isDelivered ? "rgba(90,184,150,0.12)" : "rgba(212,200,180,0.06)",
                        color: isDelivered ? ACCENT_2 : "var(--cream-mute)",
                      }}>
                      {isDelivered ? <CheckCircle2 size={13} /> : <Send size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-[13px] font-medium truncate" style={{ color: "var(--cream)" }}>
                          {e.firm}
                        </div>
                        <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{
                            background: isDelivered ? "rgba(90,184,150,0.1)" : "rgba(212,200,180,0.05)",
                            color: isDelivered ? ACCENT_2 : "var(--cream-mute)",
                          }}>
                          {e.status}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: "rgba(212,200,180,0.05)", color: "var(--cream-mute)" }}>
                          {e.manifest}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-[var(--cream-mute)] mt-0.5 truncate">{e.angle}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <code className="text-[10px] font-mono text-[var(--cream-dim)] truncate flex-1 min-w-0">
                          {e.resend_id}
                        </code>
                        <button onClick={() => copy(e.resend_id)}
                          className="p-1 rounded hover:bg-[rgba(212,165,116,0.1)] transition shrink-0"
                          style={{ color: copiedId === e.resend_id ? ACCENT : "var(--cream-mute)" }}
                          title="Copy resend_id">
                          {copiedId === e.resend_id ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Source footer ────────────────────────────────────────────── */}
      <div className="rounded-lg border p-3 flex items-center gap-2"
        style={{ borderColor: "rgba(212,200,180,0.08)", background: "rgba(20,10,30,0.3)" }}>
        <Database size={12} className="text-[var(--cream-mute)] shrink-0" />
        <div className="text-[10.5px] text-[var(--cream-mute)] font-mono truncate flex-1">
          {data._source}
        </div>
        {data._real && (
          <span className="text-[9.5px] uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0"
            style={{ background: "rgba(90,184,150,0.1)", color: ACCENT_2 }}>
            real
          </span>
        )}
      </div>
    </div>
  );
}

// ── subcomponents ─────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, accent, highlight }:
  { label: string; value: number | string; sub: string; icon: React.ReactNode; accent: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border p-3"
      style={{
        borderColor: highlight ? `${accent}40` : "rgba(212,200,180,0.08)",
        background: highlight ? `${accent}0A` : "rgba(20,10,30,0.4)",
      }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: accent }}>
        {icon}
        <span className="text-[9.5px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>
          {label}
        </span>
      </div>
      <div className="text-[22px] tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "var(--cream)" }}>
        {value}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: "var(--cream-mute)" }}>{sub}</div>
    </div>
  );
}

function ManifestGroup({ title, items, counts, onClick, active, tone }:
  { title: string; items: ManifestRow[]; counts: Record<string, number>; onClick: (f: string) => void; active: string; tone: "emerald" | "dim" }) {
  const accent = tone === "emerald" ? "var(--emerald)" : "var(--cream-mute)";
  return (
    <div className="rounded-xl border p-3 space-y-1.5"
      style={{ borderColor: `${accent}30`, background: `${accent}08` }}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest pb-1" style={{ color: accent }}>
        {tone === "emerald" ? <Zap size={10} /> : <FileJson size={10} />}
        {title}
      </div>
      {items.map((m) => {
        const sent = counts[m.file.replace(".json", "").replace(/-SENT-\d+/, "").replace(/-sent$/, "").replace(/-2026.*$/, "").replace(/-batch$/, "")] ?? m.sent_count;
        const manifestKey = m.file.replace("-SENT-20260702.json", "").replace("-sent.json", "").replace(".json", "").replace(/-\d{8}/, "").replace("-batch", "");
        const isActive = active === manifestKey;
        return (
          <button key={m.file} onClick={() => onClick(manifestKey)}
            className="w-full text-left rounded-md p-2 border transition"
            style={{
              borderColor: isActive ? accent : "rgba(212,200,180,0.06)",
              background: isActive ? `${accent}12` : "rgba(20,10,30,0.3)",
            }}>
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-mono truncate flex-1" style={{ color: "var(--cream)" }}>
                {m.file}
              </span>
              <span className="text-[10px] font-mono shrink-0" style={{ color: accent }}>
                {m.sent_count}
              </span>
            </div>
            <div className="text-[10px] text-[var(--cream-mute)] mt-0.5 truncate">
              {m.angle !== "unknown" ? m.angle.slice(0, 80) : "—"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
