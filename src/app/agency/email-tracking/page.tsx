"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Mail, MailOpen, Inbox as InboxIcon, AlertCircle, Clock, CheckCircle2,
  CircleDot, Search, Filter, ChevronRight, Reply, Send, Sparkles,
  TrendingUp, Users, Briefcase, Handshake, User, Zap, RefreshCw,
  ShieldAlert, Eye, MousePointerClick,
} from "lucide-react";

const C = {
  bg: "var(--rig-bg)", card: "var(--rig-card)", text: "var(--rig-text)",
  text2: "var(--rig-text-2)", text3: "var(--rig-text-3)", mute: "var(--rig-text-mute)",
  border: "var(--rig-border)", borderSoft: "var(--rig-border-soft)",
  hover: "var(--rig-hover)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)",
  blue: "var(--rig-blue)", blueBg: "var(--rig-blue-bg)",
  plum: "var(--rig-plum)", plumBg: "var(--rig-plum-bg)",
  red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
  orange: "var(--rig-orange)", orangeBg: "var(--rig-orange-bg)",
  purple: "var(--rig-purple)", purpleBg: "var(--rig-purple-bg)",
};

interface Email {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;
  receivedAt: string;
  category: "lead" | "client" | "partner" | "internal" | "personal" | "urgent";
  categoryScore: number;
  hasReply: boolean;
  repliedAt?: string;
  replyStatus: "none" | "drafting" | "sent" | "failed";
  threadId: string;
}

interface InboxResponse {
  _real: boolean;
  _source: string;
  emails: Email[];
  summary: {
    total: number;
    unread: number;
    urgent: number;
    needsReply: number;
    byCategory: Record<string, number>;
  };
}

const CATEGORY_META: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  client: { color: C.emerald, bg: C.emeraldBg, icon: Briefcase, label: "Client" },
  lead: { color: C.gold, bg: C.goldBg, icon: TrendingUp, label: "Lead" },
  partner: { color: C.blue, bg: C.blueBg, icon: Handshake, label: "Partner" },
  urgent: { color: C.red, bg: C.redBg, icon: ShieldAlert, label: "Urgent" },
  internal: { color: C.plum, bg: C.plumBg, icon: Users, label: "Internal" },
  personal: { color: C.purple, bg: C.purpleBg, icon: User, label: "Personal" },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

function formatAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function previewBody(b: string, n = 160): string {
  const flat = b.replace(/\s+/g, " ").trim();
  return flat.length > n ? flat.slice(0, n) + "…" : flat;
}

export default function EmailTrackingPage() {
  const [data, setData] = useState<InboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Email | null>(null);
  const [showReplied, setShowReplied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/email/inbox", { cache: "no-store" });
      const j: InboxResponse = await r.json();
      setData(j);
      setError(null);
      if (!selected && j.emails?.length) {
        const urgent = j.emails.find(e => e.category === "urgent") || j.emails[0];
        setSelected(urgent);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.emails.filter(e => {
      if (filterCat !== "all" && e.category !== filterCat) return false;
      if (!showReplied && e.hasReply) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.fromName} ${e.from} ${e.subject} ${e.body}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, filterCat, showReplied, search]);

  const stats = data?.summary;
  const replyRate = stats ? Math.round(((stats.total - stats.needsReply) / stats.total) * 100) : 0;
  const needsReplyCount = stats?.needsReply ?? 0;
  const sortedCats = useMemo(() => {
    if (!stats) return [] as Array<[string, number]>;
    return Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.25 }}>
        <div className="flex items-center gap-2 mb-2">
          <MailOpen size={20} style={{ color: C.gold }} />
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.mute, fontWeight: 600 }}>
            Email Intelligence · /api/email/inbox
          </span>
        </div>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Bricolage Grotesque" }}>
              Email Tracking & Reply Intelligence
            </h1>
            <p className="text-[13px] mt-1" style={{ color: C.text3 }}>
              Live inbox from <code style={{ color: C.gold }}>email_calendar_manager.py</code> · categorize, triage, reply
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition"
            style={{ background: C.card, color: C.text2, border: `1px solid ${C.border}` }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </motion.section>

      {/* Truth banner */}
      <motion.div {...fadeUp} transition={{ duration: 0.25, delay: 0.05 }}
        className="rounded-lg p-3 flex items-start gap-3 text-[12px]"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <Sparkles size={14} style={{ color: C.gold, marginTop: 1 }} />
        <div className="flex-1">
          <span style={{ color: C.text, fontWeight: 600 }}>Truth:</span>{" "}
          <span style={{ color: C.text2 }}>
            {loading ? "Loading live inbox…" :
              data?._real
                ? `Real data from ${data._source}`
                : "Mock data — wire to local backend"}
          </span>
          {error && <span style={{ color: C.red, marginLeft: 8 }}>· {error}</span>}
          {stats && (
            <span style={{ color: C.mute, marginLeft: 8 }}>
              · {stats.total} messages · {stats.unread} unread · {stats.urgent} urgent · {stats.needsReply} need reply
            </span>
          )}
        </div>
      </motion.div>

      {/* KPI grid */}
      {stats && (
        <motion.section {...fadeUp} transition={{ duration: 0.25, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: C.text, icon: InboxIcon, sub: "in inbox" },
            { label: "Unread", value: stats.unread, color: C.blue, icon: Mail, sub: `${Math.round((stats.unread/stats.total)*100)}% of inbox` },
            { label: "Urgent", value: stats.urgent, color: C.red, icon: ShieldAlert, sub: stats.urgent > 0 ? "needs triage" : "all clear" },
            { label: "Needs Reply", value: needsReplyCount, color: C.orange, icon: Reply, sub: `${Math.round((needsReplyCount/stats.total)*100)}% outstanding` },
            { label: "Reply Rate", value: `${replyRate}%`, color: C.emerald, icon: CheckCircle2, sub: "replied or sent" },
          ].map((k, i) => {
            const Ic = k.icon;
            return (
              <motion.div key={k.label} {...fadeUp} transition={{ duration: 0.25, delay: 0.1 + i*0.04 }}
                className="rounded-lg p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: C.mute, fontWeight: 600 }}>{k.label}</span>
                  <Ic size={14} style={{ color: k.color }} />
                </div>
                <div className="text-[26px] font-bold leading-none" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[10px] mt-1" style={{ color: C.mute }}>{k.sub}</div>
              </motion.div>
            );
          })}
        </motion.section>
      )}

      {/* Category breakdown + main split */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
        {/* LEFT: category mix + email list */}
        <div className="space-y-4">
          {/* Category mix */}
          {sortedCats.length > 0 && (
            <motion.div {...fadeUp} transition={{ duration: 0.25, delay: 0.15 }}
              className="rounded-lg p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>Category Mix</span>
                <Filter size={12} style={{ color: C.mute }} />
              </div>
              <div className="space-y-2">
                {sortedCats.map(([cat, count]) => {
                  const meta = CATEGORY_META[cat] || CATEGORY_META.personal;
                  const pct = stats ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCat(filterCat === cat ? "all" : cat)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                          <span className="text-[12px]" style={{ color: filterCat === cat ? meta.color : C.text2, fontWeight: filterCat === cat ? 600 : 400 }}>
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono" style={{ color: C.text3 }}>{count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--rig-hover)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: meta.color }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
              {filterCat !== "all" && (
                <button onClick={() => setFilterCat("all")}
                  className="mt-3 text-[11px]" style={{ color: C.mute }}>
                  · clear filter
                </button>
              )}
            </motion.div>
          )}

          {/* List header + filters */}
          <motion.div {...fadeUp} transition={{ duration: 0.25, delay: 0.2 }}
            className="rounded-lg p-3 flex items-center gap-2"
            style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <Search size={13} style={{ color: C.mute }} />
            <input
              placeholder="Search sender, subject, body…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[12px]"
              style={{ color: C.text }}
            />
            <label className="flex items-center gap-1.5 text-[11px]" style={{ color: C.text3 }}>
              <input type="checkbox" checked={showReplied} onChange={e => setShowReplied(e.target.checked)} />
              Replied
            </label>
          </motion.div>

          {/* Email list */}
          <div className="space-y-2">
            {loading && !data && (
              <div className="rounded-lg p-6 text-center text-[12px]" style={{ background: C.card, color: C.mute, border: `1px solid ${C.border}` }}>
                Loading inbox…
              </div>
            )}
            {data && filtered.length === 0 && (
              <div className="rounded-lg p-6 text-center text-[12px]" style={{ background: C.card, color: C.mute, border: `1px solid ${C.border}` }}>
                No emails match the current filter.
              </div>
            )}
            {filtered.map((e, i) => {
              const meta = CATEGORY_META[e.category] || CATEGORY_META.personal;
              const Ic = meta.icon;
              const isSel = selected?.id === e.id;
              return (
                <motion.button
                  key={e.id}
                  onClick={() => setSelected(e)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="w-full text-left rounded-lg p-3 transition"
                  style={{
                    background: isSel ? meta.bg : C.card,
                    border: `1px solid ${isSel ? meta.color : C.border}`,
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="grid place-items-center w-8 h-8 rounded-md shrink-0"
                      style={{ background: meta.bg, color: meta.color }}>
                      <Ic size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{e.fromName}</span>
                        <span className="text-[10px] shrink-0" style={{ color: C.mute }}>{formatAgo(e.receivedAt)}</span>
                      </div>
                      <div className="text-[12px] truncate mt-0.5" style={{ color: C.text2 }}>{e.subject}</div>
                      <div className="text-[11px] truncate mt-1" style={{ color: C.mute }}>{previewBody(e.body, 110)}</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
                          style={{ background: meta.bg, color: meta.color }}>
                          {meta.label} · {Math.round(e.categoryScore * 100)}%
                        </span>
                        {!e.hasReply && e.category !== "internal" && e.category !== "personal" && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                            style={{ background: C.orangeBg, color: C.orange }}>
                            <Reply size={8} /> reply needed
                          </span>
                        )}
                        {e.hasReply && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                            style={{ background: C.emeraldBg, color: C.emerald }}>
                            <CheckCircle2 size={8} /> {e.replyStatus}
                          </span>
                        )}
                        {e.category === "urgent" && !e.hasReply && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                            style={{ background: C.redBg, color: C.red }}>
                            <ShieldAlert size={8} /> urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: detail panel */}
        <motion.div {...fadeUp} transition={{ duration: 0.25, delay: 0.2 }}
          className="rounded-lg p-5 sticky top-4 self-start"
          style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {selected ? (
            <DetailPanel email={selected} onClear={() => setSelected(null)} />
          ) : (
            <div className="text-center py-12" style={{ color: C.mute }}>
              <Mail size={28} style={{ color: C.mute, margin: "0 auto 8px" }} />
              <div className="text-[13px]">Select a message to inspect</div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div {...fadeUp} transition={{ duration: 0.25, delay: 0.3 }}
        className="text-[10px] flex items-center justify-between pt-3"
        style={{ color: C.mute, borderTop: `1px solid ${C.borderSoft}` }}>
        <span>
          Source: <code style={{ color: C.text3 }}>GET /api/email/inbox</code> · returns simulated inbox ready for live backend wiring
        </span>
        <span style={{ color: C.gold }}>ProofPacket or it didn't happen</span>
      </motion.div>
    </div>
  );
}

function DetailPanel({ email, onClear }: { email: Email; onClear: () => void }) {
  const meta = CATEGORY_META[email.category] || CATEGORY_META.personal;
  const Ic = meta.icon;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="grid place-items-center w-10 h-10 rounded-md shrink-0"
            style={{ background: meta.bg, color: meta.color }}>
            <Ic size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold" style={{ color: C.text }}>{email.fromName}</div>
            <div className="text-[11px]" style={{ color: C.mute }}>{email.from}</div>
          </div>
        </div>
        <button onClick={onClear} className="text-[11px] px-2 py-1 rounded" style={{ color: C.mute, background: C.hover }}>
          close
        </button>
      </div>

      <h2 className="text-[18px] font-bold mb-3" style={{ color: C.text, fontFamily: "Bricolage Grotesque" }}>
        {email.subject}
      </h2>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: meta.bg, color: meta.color }}>
          {meta.label} · {Math.round(email.categoryScore * 100)}% confidence
        </span>
        <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: C.hover, color: C.text3 }}>
          thread {email.threadId}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] flex items-center gap-1" style={{ background: C.hover, color: C.text3 }}>
          <Clock size={9} /> received {formatAgo(email.receivedAt)}
        </span>
        {email.hasReply ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
            style={{ background: C.emeraldBg, color: C.emerald }}>
            <CheckCircle2 size={9} /> replied {email.repliedAt ? `· ${formatAgo(email.repliedAt)}` : ""} · {email.replyStatus}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
            style={{ background: C.orangeBg, color: C.orange }}>
            <Reply size={9} /> awaiting reply
          </span>
        )}
      </div>

      {/* Body */}
      <div className="rounded-md p-4 mb-4 text-[13px] leading-relaxed whitespace-pre-wrap"
        style={{ background: "var(--rig-bg)", color: C.text2, border: `1px solid ${C.borderSoft}`, fontFamily: "Manrope" }}>
        {email.body}
      </div>

      {/* Engagement funnel (simulated — tracking events) */}
      <div className="rounded-md p-3 mb-4" style={{ background: "var(--rig-bg)", border: `1px solid ${C.borderSoft}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text3 }}>Engagement Funnel</span>
          <span className="text-[10px]" style={{ color: C.mute }}>thread {email.threadId}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <EngageCell label="Opened" icon={Eye} value={email.hasReply ? "3×" : "1×"} color={C.blue} />
          <EngageCell label="Clicked" icon={MousePointerClick} value={email.hasReply ? "2" : "1"} color={C.gold} />
          <EngageCell label="Replied" icon={Reply} value={email.hasReply ? "yes" : "—"} color={email.hasReply ? C.emerald : C.mute} />
        </div>
      </div>

      {/* Action footer */}
      <div className="flex flex-wrap gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold"
          style={{ background: C.gold, color: "#0d0408" }}>
          <Send size={12} /> Draft Reply
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
          style={{ background: C.card, color: C.text2, border: `1px solid ${C.border}` }}>
          <Zap size={12} style={{ color: C.gold }} /> Mark Priority
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
          style={{ background: C.card, color: C.text2, border: `1px solid ${C.border}` }}>
          <Users size={12} style={{ color: C.blue }} /> Assign to Dept
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium ml-auto"
          style={{ background: C.hover, color: C.text3 }}>
          Snooze
        </button>
      </div>
    </div>
  );
}

function EngageCell({ label, icon: Icon, value, color }: any) {
  return (
    <div className="rounded p-2 flex items-center gap-2" style={{ background: C.card, border: `1px solid ${C.borderSoft}` }}>
      <Icon size={14} style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] uppercase tracking-wider" style={{ color: C.mute }}>{label}</div>
        <div className="text-[13px] font-semibold" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}
