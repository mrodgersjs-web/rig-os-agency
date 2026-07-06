"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Clock, CheckCircle2, AlertCircle, TrendingUp,
  FileText, Hash, RefreshCw, ChevronRight, Send, Eye,
} from "lucide-react";
import { LinkedinIcon, InstagramIcon, TwitterIcon } from "@/components/BrandIcons";

const C = {
  bg: "var(--rig-bg)", card: "var(--rig-card)", text: "var(--rig-text)",
  text2: "var(--rig-text-2)", text3: "var(--rig-text-3)", mute: "var(--rig-text-mute)",
  border: "var(--rig-border)", borderSoft: "var(--rig-border-soft)",
  hover: "var(--rig-hover)", active: "var(--rig-active)",
  gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)",
  blue: "var(--rig-blue)", blueBg: "var(--rig-blue-bg)",
  plum: "var(--rig-plum)", plumBg: "var(--rig-plum-bg)",
  red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
  orange: "var(--rig-orange)", orangeBg: "var(--rig-orange-bg)",
  purple: "var(--rig-purple)", purpleBg: "var(--rig-purple-bg)",
};

interface Slot {
  date: string;
  channel: "linkedin" | "instagram" | "twitter" | "blog" | "newsletter";
  status: "published" | "scheduled" | "queued" | "draft" | "expired";
  title: string;
  excerpt: string;
  source: string;
  proofHash?: string;
  score?: number;
}

interface Truth {
  generated_at: string;
  week_start: string;
  week_end: string;
  evidence: {
    linkedin_studio: boolean;
    ai_company_proof: boolean;
    postiz_runtime: boolean;
    ledger_present: boolean;
    campaign_post_count: number;
    ai_company_published_count: number;
  };
}

interface CalendarData {
  _truth: Truth;
  weeks: Record<string, Record<string, Slot[]>>;
  totals: { published: number; scheduled: number; queued: number; draft: number; total: number };
  channelSplit: Record<string, number>;
  gaps: string[];
  week_start: string;
  week_end: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "linkedin") return <LinkedinIcon size={12} color="var(--rig-blue)" />;
  if (channel === "instagram") return <InstagramIcon size={12} color="#ec4899" />;
  if (channel === "twitter") return <TwitterIcon size={12} color="#1d9bf0" />;
  return <FileText size={12} style={{ color: C.plum }} />;
}

function StatusBadge({ status }: { status: Slot["status"] }) {
  const cfg: Record<Slot["status"], { bg: string; fg: string; label: string }> = {
    published: { bg: C.emeraldBg, fg: C.emerald, label: "Published" },
    scheduled: { bg: C.blueBg, fg: C.blue, label: "Scheduled" },
    queued: { bg: C.goldBg, fg: C.gold, label: "Queued" },
    draft: { bg: C.hover, fg: C.text3, label: "Draft" },
    expired: { bg: C.redBg, fg: C.red, label: "Expired" },
  };
  const c = cfg[status];
  return (
    <span className="text-[9px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded" style={{ background: c.bg, color: c.fg }}>
      {c.label}
    </span>
  );
}

export default function ContentCalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/content-calendar");
      const j = await r.json();
      setData(j);
      setLastFetch(new Date());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 120_000);
    return () => clearInterval(i);
  }, []);

  const weekLabels = useMemo(() => (data ? Object.keys(data.weeks) : []), [data]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20" style={{ background: C.bg, minHeight: "50vh" }}>
        <div className="text-[13px]" style={{ color: C.mute }}>Building editorial calendar…</div>
      </div>
    );
  }

  const truth = data._truth;
  const evidence = truth.evidence;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-20">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-lg" style={{ background: C.goldBg }}>
              <Calendar size={20} style={{ color: C.gold }} />
            </div>
            <div>
              <h1 className="text-[26px] font-bold" style={{ color: C.text }}>Content Calendar</h1>
              <p className="text-[12px]" style={{ color: C.mute }}>
                Editorial schedule · {truth.week_start} → {truth.week_end} · evidence-backed slots only
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors"
            style={{ borderColor: C.border, color: C.text2, background: C.card }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        {lastFetch && (
          <div className="text-[10px] font-mono" style={{ color: C.mute }}>
            last fetch: {lastFetch.toLocaleTimeString()}
          </div>
        )}
      </motion.div>

      {/* Truth strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
        <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[9px] uppercase font-semibold tracking-wider mb-1" style={{ color: C.mute }}>Published</div>
          <div className="text-[18px] font-bold" style={{ color: C.emerald }}>{data.totals.published}</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[9px] uppercase font-semibold tracking-wider mb-1" style={{ color: C.mute }}>Scheduled</div>
          <div className="text-[18px] font-bold" style={{ color: C.blue }}>{data.totals.scheduled}</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[9px] uppercase font-semibold tracking-wider mb-1" style={{ color: C.mute }}>Queued</div>
          <div className="text-[18px] font-bold" style={{ color: C.gold }}>{data.totals.queued}</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[9px] uppercase font-semibold tracking-wider mb-1" style={{ color: C.mute }}>Drafts</div>
          <div className="text-[18px] font-bold" style={{ color: C.text2 }}>{data.totals.draft}</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[9px] uppercase font-semibold tracking-wider mb-1" style={{ color: C.mute }}>Coverage Gaps</div>
          <div className="text-[18px] font-bold" style={{ color: data.gaps.length > 0 ? C.red : C.emerald }}>{data.gaps.length}</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-[9px] uppercase font-semibold tracking-wider mb-1" style={{ color: C.mute }}>Total Slots</div>
          <div className="text-[18px] font-bold" style={{ color: C.text }}>{data.totals.total}</div>
        </div>
      </div>

      {/* Evidence strip */}
      <div className="rounded-xl p-4 border mb-6" style={{ background: C.card, borderColor: C.border }}>
        <div className="text-[11px] uppercase font-bold tracking-wider mb-3" style={{ color: C.text2 }}>Evidence</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: "LinkedIn studio", on: evidence.linkedin_studio },
            { label: "ai-company proof", on: evidence.ai_company_proof },
            { label: "Postiz runtime", on: evidence.postiz_runtime },
            { label: "Receipt ledger", on: evidence.ledger_present },
            { label: `Campaign posts: ${evidence.campaign_post_count}`, on: true },
            { label: `Proof files: ${evidence.ai_company_published_count}`, on: true },
          ].map((e) => (
            <div key={e.label} className="flex items-center gap-2 px-2 py-1.5 rounded border text-[10px]" style={{ borderColor: C.borderSoft, background: C.bg }}>
              {e.on ? <CheckCircle2 size={11} style={{ color: C.emerald }} /> : <AlertCircle size={11} style={{ color: C.red }} />}
              <span style={{ color: C.text2 }}>{e.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage gap warning */}
      {data.gaps.length > 0 && (
        <div className="rounded-lg p-3 mb-6 flex items-start gap-2" style={{ background: C.redBg, border: `1px solid ${C.red}` }}>
          <AlertCircle size={14} style={{ color: C.red, marginTop: 2 }} />
          <div className="text-[11px]" style={{ color: C.red }}>
            <strong>Coverage gap this week:</strong> {data.gaps.join(", ")} have no content scheduled. Fill before week starts.
          </div>
        </div>
      )}

      {/* Channel split */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(data.channelSplit).map(([ch, n]) => (
          <div key={ch} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px]" style={{ borderColor: C.border, background: C.card }}>
            <ChannelIcon channel={ch} />
            <span style={{ color: C.text2 }}>{ch}</span>
            <span className="font-bold" style={{ color: C.text }}>{n}</span>
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-6">
        {weekLabels.map((weekLabel, weekIdx) => {
          const week = data.weeks[weekLabel] || {};
          const weekTotal = DAYS.reduce((acc, d) => acc + ((week as any)[d]?.length || 0), 0);
          const isCurrent = weekIdx === 0;
          return (
            <motion.div
              key={weekLabel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: weekIdx * 0.05 }}
              className="rounded-xl border overflow-hidden"
              style={{ background: C.card, borderColor: isCurrent ? C.gold : C.border, borderWidth: isCurrent ? 2 : 1 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.borderSoft }}>
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} style={{ color: C.gold }} />
                  <h2 className="text-[13px] font-bold" style={{ color: C.text }}>{weekLabel}</h2>
                  {isCurrent && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: C.goldBg, color: C.gold }}>
                      Current
                    </span>
                  )}
                </div>
                <div className="text-[10px]" style={{ color: C.mute }}>
                  {weekTotal} slot{weekTotal !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="grid grid-cols-7 divide-x" style={{ borderColor: C.borderSoft }}>
                {DAYS.map((day) => {
                  const list: Slot[] = (week as any)[day] || [];
                  return (
                    <div key={day} className="min-h-[140px] p-2" style={{ borderColor: C.borderSoft }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: C.text2 }}>{day}</span>
                        <span className="text-[10px] font-mono" style={{ color: C.mute }}>{list.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {list.length === 0 && (
                          <div className="text-[10px] italic p-2 rounded border border-dashed" style={{ borderColor: C.borderSoft, color: C.mute }}>
                            open slot
                          </div>
                        )}
                        {list.slice(0, 4).map((s, i) => (
                          <div key={i} className="rounded p-1.5 border" style={{ background: C.bg, borderColor: C.borderSoft }}>
                            <div className="flex items-center gap-1 mb-1">
                              <ChannelIcon channel={s.channel} />
                              <StatusBadge status={s.status} />
                            </div>
                            <div className="text-[10px] font-semibold line-clamp-2 mb-0.5" style={{ color: C.text }}>{s.title}</div>
                            <div className="text-[9px] line-clamp-1" style={{ color: C.mute }}>{s.excerpt}</div>
                            {s.proofHash && (
                              <div className="flex items-center gap-1 mt-1">
                                <Hash size={8} style={{ color: C.gold }} />
                                <span className="text-[8px] font-mono truncate" style={{ color: C.mute }}>
                                  {s.proofHash.slice(0, 12)}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {list.length > 4 && (
                          <div className="text-[10px] text-center" style={{ color: C.mute }}>
                            +{list.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={14} style={{ color: C.gold }} />
            <div>
              <div className="text-[12px] font-semibold" style={{ color: C.text }}>Auto-refresh every 2 min</div>
              <div className="text-[10px]" style={{ color: C.mute }}>
                Generated {new Date(truth.generated_at).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: C.hover, color: C.text2 }}>
              /api/agency/content-calendar
            </span>
            <Send size={12} style={{ color: C.mute }} />
          </div>
        </div>
      </div>
    </div>
  );
}