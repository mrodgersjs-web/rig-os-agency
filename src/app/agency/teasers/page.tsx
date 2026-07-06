"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText, CheckCircle2, Mail, TrendingUp, Award, AlertCircle,
  Search, Filter, Building2, ChevronRight, ExternalLink, BarChart3,
} from "lucide-react";

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

interface Teaser {
  id: string; slug: string; firm: string; vertical: string; industry?: string;
  status: string; estimatedValue: number; recommendationScore?: number;
  evidenceCount?: number; campaign?: string;
}

export default function TeasersPage() {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVertical, setFilterVertical] = useState<string>("all");

  useEffect(() => {
    fetch("/api/agency/teasers")
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const teasers: Teaser[] = data?.teasers || [];

  const verticals = useMemo(() => {
    const set = new Set<string>();
    teasers.forEach((t) => t.vertical && set.add(t.vertical));
    return Array.from(set).sort();
  }, [teasers]);

  const filtered = useMemo(() => {
    return teasers.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterVertical !== "all" && t.vertical !== filterVertical) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.firm?.toLowerCase().includes(q) || t.slug?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [teasers, search, filterStatus, filterVertical]);

  const totalEstValue = filtered.reduce((s, t) => s + (t.estimatedValue || 0), 0);
  const totalCount = filtered.length;

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20" style={{ background: C.bg, minHeight: "50vh" }}>
        <div className="text-[13px]" style={{ color: C.mute }}>Loading teasers…</div>
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === "sent") return { bg: C.emeraldBg, fg: C.emerald };
    if (s === "drafting") return { bg: C.goldBg, fg: C.gold };
    if (s === "replied") return { bg: C.blueBg, fg: C.blue };
    if (s === "meeting") return { bg: C.purpleBg, fg: C.purple };
    return { bg: C.hover, fg: C.text2 };
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="grid place-items-center w-10 h-10 rounded-lg" style={{ background: C.goldBg }}>
            <FileText size={20} style={{ color: C.gold }} />
          </div>
          <div>
            <h1 className="text-[26px] font-bold" style={{ color: C.text }}>
              {data.source ? `${data.totalWithStrategy ?? data.total} Real Strategy Teasers` : "Strategy Teasers"}
            </h1>
            <p className="text-[12px]" style={{ color: C.mute }}>
              {data.source && `${data.source} · ${data.totalClientDirs} client dirs scanned`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Warning Banner */}
      {data.sentWithoutStrategy && data.sentWithoutStrategy.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-lg p-3 mb-6 border flex items-start gap-2"
          style={{ borderColor: C.orange, background: C.orangeBg }}
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: C.orange }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold mb-0.5" style={{ color: C.orange }}>
              {data.sentWithoutStrategy.length} companies sent emails but missing strategy.generated.json
            </p>
            <p className="text-[11px] truncate" style={{ color: C.text2 }}>
              {data.sentWithoutStrategy.slice(0, 8).join(", ")}{data.sentWithoutStrategy.length > 8 ? `, +${data.sentWithoutStrategy.length - 8} more` : ""}
            </p>
          </div>
        </motion.div>
      )}

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "With Strategy", value: data.totalWithStrategy ?? data.total ?? 0, icon: FileText, color: C.gold, bg: C.goldBg },
          { label: "Sent", value: data.sent ?? 0, icon: CheckCircle2, color: C.emerald, bg: C.emeraldBg },
          { label: "Drafting", value: data.drafting ?? 0, icon: AlertCircle, color: C.orange, bg: C.orangeBg },
          { label: "Send Rate", value: data.sendRate ?? "—", icon: TrendingUp, color: C.blue, bg: C.blueBg },
          { label: "Avg Score", value: `${data.avgAntiGeneric ?? 0}/100`, icon: Award, color: C.purple, bg: C.purpleBg },
          { label: "Pipeline $", value: `$${(data.pipelineValue ?? 0).toLocaleString()}`, icon: BarChart3, color: C.plum, bg: C.plumBg },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl p-3.5 border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="grid place-items-center w-7 h-7 rounded-md mb-2" style={{ background: s.bg }}>
              <s.icon size={13} style={{ color: s.color }} />
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.mute }}>{s.label}</div>
            <div className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Vertical Breakdown Chips */}
      {data.verticalBreakdown && Object.keys(data.verticalBreakdown).length > 0 && (
        <div className="rounded-xl p-4 border mb-6" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={14} style={{ color: C.gold }} />
            <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>Vertical Breakdown</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(data.verticalBreakdown)
              .sort((a: any, b: any) => b[1].total - a[1].total)
              .slice(0, 20)
              .map(([vert, stats]: any) => {
                const pct = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;
                return (
                  <div
                    key={vert}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px]"
                    style={{ borderColor: C.borderSoft, background: C.bg }}
                  >
                    <span className="font-medium truncate max-w-[160px]" style={{ color: C.text }}>{vert}</span>
                    <span className="tabular-nums" style={{ color: C.mute }}>
                      {stats.sent}/{stats.total}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{
                      background: pct >= 50 ? C.emerald : pct > 0 ? C.gold : C.mute
                    }} />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl p-3 border mb-4 flex flex-wrap items-center gap-3" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={13} style={{ color: C.mute }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search firm or slug…"
            className="flex-1 px-2 py-1.5 rounded-md border text-[12px] outline-none"
            style={{ borderColor: C.border, background: C.bg, color: C.text }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: C.mute }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 rounded-md border text-[12px] outline-none"
            style={{ borderColor: C.border, background: C.bg, color: C.text }}
          >
            <option value="all">All statuses</option>
            <option value="sent">Sent</option>
            <option value="drafting">Drafting</option>
            <option value="replied">Replied</option>
            <option value="meeting">Meeting</option>
          </select>
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="px-2 py-1.5 rounded-md border text-[12px] outline-none"
            style={{ borderColor: C.border, background: C.bg, color: C.text }}
          >
            <option value="all">All verticals</option>
            {verticals.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="text-[11px] tabular-nums" style={{ color: C.mute }}>
          {totalCount} of {teasers.length} · ${totalEstValue.toLocaleString()} est.
        </div>
      </div>

      {/* Teaser List */}
      <div className="rounded-xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="grid grid-cols-[40px_1fr_140px_120px_90px_90px] gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b" style={{ borderColor: C.borderSoft, color: C.mute, background: C.hover }}>
          <div>#</div>
          <div>Firm</div>
          <div>Vertical</div>
          <div>Campaign</div>
          <div className="text-right">Score</div>
          <div className="text-right">Status</div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-[12px]" style={{ color: C.mute }}>
            No teasers match your filters.
          </div>
        ) : (
          filtered.map((t, i) => {
            const sc = statusColor(t.status);
            return (
              <motion.a
                key={t.id}
                href={`/agency/recall`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.008, 0.4) }}
                className="grid grid-cols-[40px_1fr_140px_120px_90px_90px] gap-3 px-4 py-2.5 items-center border-b transition hover:bg-black/[0.02] cursor-pointer"
                style={{ borderColor: C.borderSoft }}
              >
                <div className="text-[11px] tabular-nums" style={{ color: C.mute }}>{i + 1}</div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate" style={{ color: C.text }}>{t.firm}</div>
                  <div className="text-[10px] truncate" style={{ color: C.mute }}>
                    {t.evidenceCount != null ? `${t.evidenceCount} evidence · ` : ""}
                    <code style={{ background: C.hover, padding: "0 4px", borderRadius: 3 }}>{t.slug}</code>
                  </div>
                </div>
                <div className="text-[11px] truncate" style={{ color: C.text2 }}>{t.vertical}</div>
                <div className="text-[11px] truncate" style={{ color: C.text3 }}>{t.campaign || "—"}</div>
                <div className="text-[12px] font-semibold tabular-nums text-right" style={{ color: C.gold }}>
                  {t.recommendationScore ?? "—"}
                </div>
                <div className="text-right">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                    style={{ background: sc.bg, color: sc.fg }}
                  >
                    {t.status}
                  </span>
                </div>
              </motion.a>
            );
          })
        )}
      </div>

      {/* Campaign breakdown footer */}
      {data.campaignBreakdown && Object.keys(data.campaignBreakdown).length > 0 && (
        <div className="mt-4 text-[10px] text-center" style={{ color: C.mute }}>
          Campaigns: {Object.entries(data.campaignBreakdown).map(([c, n]: any) => `${c} (${n})`).join(" · ")}
        </div>
      )}
    </div>
  );
}