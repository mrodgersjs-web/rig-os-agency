"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database, Zap, Users, Building2, TrendingUp, Activity,
  CheckCircle, Clock, AlertCircle, RefreshCw, Download,
  Gauge, Layers, MapPin, Server,
} from "lucide-react";

interface ScrapingSource {
  id: string;
  name: string;
  profiles: number;
  dataGB: number;
  status: string;
  lastRun: string;
  actors?: string[];
  queries?: string[];
  successRate: number;
  avgScore: number;
}

interface ScrapingProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  score: number;
  source: string;
  scraped: string;
  enriched: boolean;
  qualified: boolean;
}

interface RunHistoryItem {
  id: string;
  date: string;
  profiles: number;
  newProfiles: number;
  companies: number;
  decisionMakers: number;
  dataGB: number;
  duration: string;
  status: string;
  sources: number;
  errors: number;
}

interface VerticalStat {
  vertical: string;
  count: number;
  qualified: number;
  avgScore: number;
  trend: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function daysUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs < 1) return "<1h";
  return `${hrs}h`;
}

export default function ScrapingPage() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"overview" | "sources" | "profiles" | "history" | "verticals" | "config">("overview");

  useEffect(() => {
    fetch("/api/agency/scraping")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data)
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "var(--bg-deep)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--cream-dim)" }}>
          <RefreshCw size={20} className="animate-spin" style={{ color: "var(--gold)" }} />
          <span className="text-[14px]">Loading scraping intelligence…</span>
        </div>
      </div>
    );

  const summary = data.summary || {};
  const sources: ScrapingSource[] = data.sources || [];
  const profiles: ScrapingProfile[] = data.profiles || [];
  const runs: RunHistoryItem[] = data.runHistory || [];
  const verticals: VerticalStat[] = data.verticalBreakdown || [];
  const config = data.config || {};
  const maxProfiles = Math.max(...sources.map((s) => s.profiles), 1);

  const kpiCards = [
    { label: "Total Profiles", value: fmtNum(summary.totalProfiles || 0), sub: `${summary.newCompanies || 0} new companies`, icon: <Users size={18} />, accent: "var(--emerald)" },
    { label: "Data Volume", value: `${summary.totalDataGB || 0} GB`, sub: `${data.sources?.length || 0} active sources`, icon: <Database size={18} />, accent: "var(--gold)" },
    { label: "Decision Makers", value: fmtNum(summary.decisionMakers || 0), sub: `${summary.qualified || 0} qualified`, icon: <Building2 size={18} />, accent: "var(--plum)" },
    { label: "Avg Lead Score", value: `${summary.avgScore || 0}`, sub: `Enrichment ${((summary.enrichmentRate || 0) * 100).toFixed(0)}%`, icon: <Gauge size={18} />, accent: "#22d3ee" },
  ];

  const tabs: { id: typeof tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity size={14} /> },
    { id: "sources", label: "Sources", icon: <Server size={14} /> },
    { id: "profiles", label: "Profiles", icon: <Users size={14} /> },
    { id: "verticals", label: "Verticals", icon: <Layers size={14} /> },
    { id: "history", label: "Run History", icon: <Clock size={14} /> },
    { id: "config", label: "Config", icon: <MapPin size={14} /> },
  ];

  return (
    <div className="space-y-6 p-6 max-w-[1200px] mx-auto" style={{ background: "var(--bg-deep)", minHeight: "100vh" }}>
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-1">
          <Database size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Data Intelligence Pipeline
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
            Scraping Dashboard
          </h1>
          <div className="flex items-center gap-3 text-[12px]" style={{ color: "var(--cream-dim)" }}>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={12} style={{ color: "var(--emerald)" }} />
              Overnight run completed
            </span>
            <span style={{ color: "var(--cream-mute)" }}>·</span>
            <span>Next run in {daysUntil(data.nextRun)}</span>
          </div>
        </div>
        <p className="text-[13px] mt-1" style={{ color: "var(--cream-dim)" }}>
          {config.geo} · {config.cadence} cadence · {config.dataCap} cap per source
        </p>
      </motion.section>

      {/* KPI Cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{kpi.label}</span>
              </div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: kpi.accent }}>{kpi.value}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--cream-mute)" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Tabs */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.08 }}>
        <div className="flex gap-1 rounded-xl p-1 border" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition"
              style={{
                background: tab === t.id ? "var(--bg-elev)" : "transparent",
                color: tab === t.id ? "var(--gold)" : "var(--cream-dim)",
                border: tab === t.id ? "1px solid var(--line)" : "1px solid transparent",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Overview ─────────────────────────── */}
      {tab === "overview" && (
        <motion.section {...fadeUp} transition={{ duration: 0.3 }} className="space-y-4">
          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <h2 className="text-[14px] font-semibold mb-4" style={{ color: "var(--cream)" }}>Pipeline Quality</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>Enrichment Rate</div>
                <div className="text-xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--emerald)" }}>{((summary.enrichmentRate || 0) * 100).toFixed(0)}%</div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elev)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(summary.enrichmentRate || 0) * 100}%`, background: "var(--emerald)" }} />
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>Dedup Rate</div>
                <div className="text-xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--gold)" }}>{((summary.dedupRate || 0) * 100).toFixed(0)}%</div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elev)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(summary.dedupRate || 0) * 100}%`, background: "var(--gold)" }} />
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>Success Rate</div>
                <div className="text-xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#22d3ee" }}>{((summary.successRate || 0) * 100).toFixed(0)}%</div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elev)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(summary.successRate || 0) * 100}%`, background: "#22d3ee" }} />
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>Qualified Ratio</div>
                <div className="text-xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--plum)" }}>{summary.totalProfiles ? Math.round(((summary.qualified || 0) / summary.totalProfiles) * 100) : 0}%</div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elev)" }}>
                  <div className="h-full rounded-full" style={{ width: `${summary.totalProfiles ? ((summary.qualified || 0) / summary.totalProfiles) * 100 : 0}%`, background: "var(--plum)" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>7-Day Profile Growth</h2>
              <span className="text-[12px]" style={{ color: "var(--gold)" }}>{runs[0]?.profiles || 0} total</span>
            </div>
            <div className="flex items-end gap-2 h-32">
              {runs.slice().reverse().map((r) => {
                const max = runs[0]?.profiles || 1;
                const h = (r.profiles / max) * 100;
                return (
                  <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[10px]" style={{ color: "var(--cream-dim)" }}>{r.profiles}</div>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${h}%`,
                        background: `linear-gradient(180deg, var(--gold) 0%, var(--gold-deep) 100%)`,
                        minHeight: "4px",
                      }}
                    />
                    <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{fmtDate(r.date)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Sources ─────────────────────────── */}
      {tab === "sources" && (
        <motion.section {...fadeUp} transition={{ duration: 0.3 }} className="space-y-4">
          {sources.map((src, i) => (
            <motion.div
              key={src.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl p-5 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg grid place-items-center" style={{ background: "rgba(212,165,116,0.1)" }}>
                    <Zap size={18} style={{ color: "var(--gold)" }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{src.name}</h3>
                    <div className="text-[11px]" style={{ color: "var(--cream-mute)" }}>Last run {fmtTime(src.lastRun)} · {src.successRate ? `${(src.successRate * 100).toFixed(0)}% success` : ""}</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-[11px] font-semibold capitalize" style={{ background: "rgba(90,184,150,0.15)", color: "var(--emerald)" }}>
                  {src.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Profiles</div>
                  <div className="text-lg" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--gold)" }}>{src.profiles}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Data</div>
                  <div className="text-lg" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--gold)" }}>{src.dataGB} GB</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Avg Score</div>
                  <div className="text-lg" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--gold)" }}>{src.avgScore}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>Capacity</div>
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elev)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(src.profiles / maxProfiles) * 100}%`, background: "var(--gold)" }} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {src.actors?.map((a) => (
                  <span key={a} className="px-2.5 py-1 rounded-lg text-[11px]" style={{ background: "rgba(212,165,116,0.08)", color: "var(--cream-dim)" }}>
                    {a}
                  </span>
                ))}
                {src.queries?.map((q) => (
                  <span key={q} className="px-2.5 py-1 rounded-lg text-[11px]" style={{ background: "rgba(34,211,238,0.08)", color: "#22d3ee" }}>
                    {q}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.section>
      )}

      {/* ── Profiles ────────────────────────── */}
      {tab === "profiles" && (
        <motion.section {...fadeUp} transition={{ duration: 0.3 }}>
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            {profiles.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-4 px-5 py-3 transition"
                style={{
                  borderBottom: i < profiles.length - 1 ? "1px solid var(--line-soft)" : "none",
                  background: p.score > 90 ? "rgba(212,165,116,0.04)" : "transparent",
                }}
              >
                <div
                  className="w-12 h-12 rounded-lg grid place-items-center shrink-0 text-[15px] font-bold"
                  style={{
                    background: p.score > 90 ? "rgba(212,165,116,0.12)" : p.score > 85 ? "rgba(90,184,150,0.1)" : "var(--bg-elev)",
                    color: p.score > 90 ? "var(--gold)" : p.score > 85 ? "var(--emerald)" : "var(--cream-dim)",
                  }}
                >
                  {p.score}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold truncate" style={{ color: "var(--cream)" }}>{p.name}</span>
                    {p.qualified && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: "rgba(90,184,150,0.15)", color: "var(--emerald)" }}>QUAL</span>
                    )}
                  </div>
                  <div className="text-[12px] truncate" style={{ color: "var(--cream-dim)" }}>
                    {p.title} · {p.company} · {p.industry}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[12px] font-medium" style={{ color: "var(--gold)" }}>{p.source}</div>
                  <div className="text-[11px]" style={{ color: "var(--cream-mute)" }}>{fmtTime(p.scraped)}</div>
                </div>

                <div className="shrink-0">
                  {p.enriched ? (
                    <CheckCircle size={16} style={{ color: "var(--emerald)" }} />
                  ) : (
                    <Clock size={16} style={{ color: "var(--cream-mute)" }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Verticals ───────────────────────── */}
      {tab === "verticals" && (
        <motion.section {...fadeUp} transition={{ duration: 0.3 }} className="space-y-3">
          {verticals.map((v, i) => {
            const maxCount = Math.max(...verticals.map((vv) => vv.count), 1);
            const w = (v.count / maxCount) * 100;
            return (
              <motion.div
                key={v.vertical}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl p-4 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>{v.vertical}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "rgba(90,184,150,0.1)", color: "var(--emerald)" }}>{v.trend}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[12px]">
                    <span style={{ color: "var(--cream-dim)" }}>{v.qualified}/{v.count} qual</span>
                    <span style={{ color: "var(--gold)" }}>Score {v.avgScore}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elev)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${w}%` }}
                    transition={{ delay: i * 0.06 + 0.1, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--gold-deep), var(--gold))" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.section>
      )}

      {/* ── Run History ─────────────────────── */}
      {tab === "history" && (
        <motion.section {...fadeUp} transition={{ duration: 0.3 }}>
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] uppercase tracking-wider border-b" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream-mute)" }}>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-center">New</div>
              <div className="col-span-2 text-center">Profiles</div>
              <div className="col-span-2 text-center">Companies</div>
              <div className="col-span-1 text-center">Sources</div>
              <div className="col-span-2 text-center">Data</div>
              <div className="col-span-1 text-center">Duration</div>
              <div className="col-span-1 text-center">Status</div>
            </div>
            {runs.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 gap-2 px-5 py-3 text-[12px] items-center"
                style={{ borderBottom: "1px solid var(--line-soft)" }}
              >
                <div className="col-span-2" style={{ color: "var(--cream)" }}>
                  <span style={{ color: "var(--cream-dim)" }}>{fmtDate(r.date)}</span>
                  <span className="ml-1.5 text-[11px]" style={{ color: "var(--cream-mute)" }}>{fmtTime(r.date)}</span>
                </div>
                <div className="col-span-1 text-center font-semibold" style={{ color: "var(--emerald)" }}>+{r.newProfiles}</div>
                <div className="col-span-2 text-center" style={{ color: "var(--gold)" }}>{r.profiles}</div>
                <div className="col-span-2 text-center" style={{ color: "var(--cream-dim)" }}>{r.companies}</div>
                <div className="col-span-1 text-center" style={{ color: "var(--cream-dim)" }}>{r.sources}</div>
                <div className="col-span-2 text-center" style={{ color: "var(--cream-dim)" }}>{r.dataGB} GB</div>
                <div className="col-span-1 text-center" style={{ color: "var(--cream-mute)" }}>{r.duration}</div>
                <div className="col-span-1 text-center">
                  {r.status === "completed" && r.errors === 0 ? (
                    <CheckCircle size={14} className="inline" style={{ color: "var(--emerald)" }} />
                  ) : (
                    <AlertCircle size={14} className="inline" style={{ color: "#fbbf24" }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Config ──────────────────────────── */}
      {tab === "config" && (
        <motion.section {...fadeUp} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 border space-y-3" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>Schedule</h2>
              {[
                { label: "Cadence", value: config.cadence },
                { label: "Start Time", value: config.startTime },
                { label: "Next Run", value: `${fmtDate(data.nextRun)} ${fmtTime(data.nextRun)}` },
                { label: "Data Cap", value: config.dataCap },
                { label: "Geo Target", value: config.geo },
              ].map((c) => (
                <div key={c.label} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{c.label}</span>
                  <span className="text-[13px] font-medium" style={{ color: "var(--gold)" }}>{c.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-5 border space-y-3" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>Processing</h2>
              {[
                { label: "Target Profiles", value: `${config.targetProfiles}` },
                { label: "Dedup", value: config.dedup ? "Enabled" : "Disabled" },
                { label: "Enrichment", value: config.enrich ? "Enabled" : "Disabled" },
                { label: "Active Sources", value: `${data.sources?.length || 0}` },
                { label: "Total Sources (7-day)", value: `${runs[0]?.sources || 0}` },
              ].map((c) => (
                <div key={c.label} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{c.label}</span>
                  <span className="text-[13px] font-medium" style={{ color: "var(--gold)" }}>{c.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-5 border md:col-span-2" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <h2 className="text-[14px] font-semibold mb-3" style={{ color: "var(--cream)" }}>Notifications</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>Webhook</span>
                  <span className="text-[12px]" style={{ color: "var(--gold)" }}>{config.webhookUrl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>Alert Email</span>
                  <span className="text-[12px]" style={{ color: "var(--gold)" }}>{config.alertEmail}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
