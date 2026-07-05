"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Database, Search, Globe, TrendingUp, Users,
  Building2, Sparkles, AlertCircle, CheckCircle2,
  Clock, Activity, ArrowUp, Zap, Brain, Target,
} from "lucide-react";

interface Source {
  id: string;
  name: string;
  profiles: number;
  dataGB: number;
  status: string;
  lastRun: string;
  successRate: number;
  avgScore: number;
  actors?: string[];
  queries?: string[];
}

interface Profile {
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

interface Run {
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

interface Vertical {
  vertical: string;
  count: number;
  qualified: number;
  avgScore: number;
  trend: string;
}

interface Summary {
  totalDataGB: number;
  totalProfiles: number;
  sources: number;
  overnight: boolean;
  newCompanies: number;
  decisionMakers: number;
  qualified: number;
  enrichmentRate: number;
  dedupRate: number;
  avgScore: number;
  successRate: number;
}

interface Config {
  targetProfiles: number;
  cadence: string;
  dataCap: string;
  dedup: boolean;
  enrich: boolean;
  geo: string;
  startTime: string;
}

interface ScrapingPayload {
  summary: Summary;
  sources: Source[];
  profiles: Profile[];
  runHistory: Run[];
  verticalBreakdown: Vertical[];
  config: Config;
  nextRun: string;
}

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ScrapingView() {
  const [data, setData] = useState<ScrapingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/agency/scraping")
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then((j) => alive && setData(j))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-10">
        <div
          className="rounded-lg p-6 border"
          style={{
            background: "rgba(239,68,68,0.08)",
            borderColor: "rgba(239,68,68,0.3)",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-400 mt-0.5" size={20} />
            <div>
              <div className="font-semibold text-cream">Scraping API unreachable</div>
              <div className="text-sm text-cream/60 mt-1">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-10">
        <div className="text-cream/60 text-sm">Loading scraping intel…</div>
      </div>
    );
  }

  const { summary, sources, profiles, runHistory, verticalBreakdown, config, nextRun } = data;

  const stats: Array<{ label: string; value: string; sub?: string; icon: any; tone: string }> = [
    { label: "Total Profiles", value: summary.totalProfiles.toLocaleString(), sub: `target ${config.targetProfiles}`, icon: Users, tone: "#fbbf24" },
    { label: "Data Captured", value: `${summary.totalDataGB.toFixed(1)} GB`, sub: `cap ${config.dataCap}`, icon: Database, tone: "#c084fc" },
    { label: "Qualified", value: summary.qualified.toLocaleString(), sub: fmtPct(summary.qualified / summary.totalProfiles), icon: CheckCircle2, tone: "#10b981" },
    { label: "Avg Score", value: summary.avgScore.toFixed(1), sub: "weighted", icon: Target, tone: "#4a9eff" },
    { label: "Enrichment", value: fmtPct(summary.enrichmentRate), sub: "auto", icon: Sparkles, tone: "#5ab896" },
    { label: "Dedup", value: fmtPct(summary.dedupRate), sub: "remove dupes", icon: Brain, tone: "#f97316" },
    { label: "Sources", value: summary.sources.toString(), sub: config.cadence, icon: Globe, tone: "#ec4899" },
    { label: "Success Rate", value: fmtPct(summary.successRate), sub: "last 7 runs", icon: Activity, tone: "#8b5cf6" },
  ];

  const progressPct = Math.min(100, (summary.totalProfiles / config.targetProfiles) * 100);

  return (
    <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cream/50 uppercase tracking-widest mb-2">
            <Search size={12} />
            Scraping Intelligence · Nightly Pipeline
          </div>
          <h1 className="text-3xl font-serif text-cream">Decision Maker Harvester</h1>
          <p className="text-cream/60 text-sm mt-1">
            Geo: {config.geo} · Next run {fmtTime(nextRun)} · Cadence {config.cadence} @ {config.startTime}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
             style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-emerald-300 font-medium">Pipeline live</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-lg p-4 border" style={{ background: "var(--bg-deep)", borderColor: "var(--rule)" }}>
        <div className="flex items-center justify-between text-xs text-cream/60 mb-2">
          <span>Profile harvest vs target</span>
          <span className="text-cream">{summary.totalProfiles} / {config.targetProfiles}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--gold) 0%, #c084fc 100%)" }}
          />
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-lg p-4 border"
            style={{ background: "var(--bg-deep)", borderColor: "var(--rule)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon size={16} style={{ color: s.tone }} />
              <span className="text-[10px] text-cream/40 uppercase tracking-widest">{s.label}</span>
            </div>
            <div className="text-2xl font-serif text-cream">{s.value}</div>
            {s.sub && <div className="text-xs text-cream/50 mt-1">{s.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Sources */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-serif text-cream">Active Sources</h2>
          <span className="text-xs text-cream/40">{sources.length} configured</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sources.map((s) => (
            <div key={s.id}
                 className="rounded-lg p-4 border"
                 style={{ background: "var(--bg-deep)", borderColor: "var(--rule)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-gold" />
                  <span className="text-cream font-medium">{s.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: s.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                        color: s.status === "active" ? "#10b981" : "rgba(255,255,255,0.4)",
                      }}>
                  {s.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-cream/40">Profiles</div>
                  <div className="text-cream text-lg font-serif">{s.profiles}</div>
                </div>
                <div>
                  <div className="text-cream/40">Data</div>
                  <div className="text-cream text-lg font-serif">{s.dataGB.toFixed(1)} GB</div>
                </div>
                <div>
                  <div className="text-cream/40">Success</div>
                  <div className="text-cream">{fmtPct(s.successRate)}</div>
                </div>
                <div>
                  <div className="text-cream/40">Avg score</div>
                  <div className="text-cream">{s.avgScore.toFixed(1)}</div>
                </div>
              </div>
              <div className="mt-3 text-[10px] text-cream/40">
                Last run: {fmtTime(s.lastRun)}
              </div>
              {(s.actors || s.queries) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(s.actors || s.queries || []).slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(192,132,252,0.08)", color: "#c084fc" }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Two-column: Profiles + Verticals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <section className="lg:col-span-2">
          <h2 className="text-lg font-serif text-cream mb-3">Recent Qualified Profiles</h2>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--rule)" }}>
            <table className="w-full text-xs">
              <thead style={{ background: "rgba(255,255,255,0.03)" }}>
                <tr className="text-cream/50 uppercase tracking-widest text-[10px]">
                  <th className="text-left px-3 py-2 font-normal">Name</th>
                  <th className="text-left px-3 py-2 font-normal">Company</th>
                  <th className="text-left px-3 py-2 font-normal">Industry</th>
                  <th className="text-right px-3 py-2 font-normal">Score</th>
                  <th className="text-left px-3 py-2 font-normal">Source</th>
                  <th className="text-center px-3 py-2 font-normal">State</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: "var(--rule)" }}>
                    <td className="px-3 py-2 text-cream">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-cream/40 text-[10px]">{p.title}</div>
                    </td>
                    <td className="px-3 py-2 text-cream/80">{p.company}</td>
                    <td className="px-3 py-2 text-cream/60">{p.industry}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-cream font-mono"
                            style={{ color: p.score >= 90 ? "#10b981" : p.score >= 80 ? "#fbbf24" : "#fb7185" }}>
                        {p.score}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-cream/60">{p.source}</td>
                    <td className="px-3 py-2 text-center">
                      {p.qualified ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                          qualified
                        </span>
                      ) : p.enriched ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(192,132,252,0.12)", color: "#c084fc" }}>
                          enriched
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                          scraped
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-serif text-cream mb-3">Vertical Breakdown</h2>
          <div className="space-y-2">
            {verticalBreakdown.map((v) => {
              const pct = (v.qualified / v.count) * 100;
              return (
                <div key={v.vertical} className="rounded-lg p-3 border"
                     style={{ background: "var(--bg-deep)", borderColor: "var(--rule)" }}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-cream font-medium">{v.vertical}</span>
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <ArrowUp size={10} /> {v.trend}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-cream/60 mb-2">
                    <span>{v.qualified} qualified / {v.count} total</span>
                    <span className="ml-auto">avg {v.avgScore.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: "var(--gold)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Run history */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-serif text-cream">Run History</h2>
          <span className="text-xs text-cream/40">Last 7 runs</span>
        </div>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--rule)" }}>
          <table className="w-full text-xs">
            <thead style={{ background: "rgba(255,255,255,0.03)" }}>
              <tr className="text-cream/50 uppercase tracking-widest text-[10px]">
                <th className="text-left px-3 py-2 font-normal">Run</th>
                <th className="text-right px-3 py-2 font-normal">Profiles</th>
                <th className="text-right px-3 py-2 font-normal">New</th>
                <th className="text-right px-3 py-2 font-normal">Companies</th>
                <th className="text-right px-3 py-2 font-normal">DMs</th>
                <th className="text-right px-3 py-2 font-normal">GB</th>
                <th className="text-right px-3 py-2 font-normal">Duration</th>
                <th className="text-right px-3 py-2 font-normal">Errors</th>
                <th className="text-center px-3 py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {runHistory.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: "var(--rule)" }}>
                  <td className="px-3 py-2 text-cream font-mono text-[11px]">{r.id}</td>
                  <td className="px-3 py-2 text-right text-cream">{r.profiles}</td>
                  <td className="px-3 py-2 text-right text-emerald-400">+{r.newProfiles}</td>
                  <td className="px-3 py-2 text-right text-cream/80">{r.companies}</td>
                  <td className="px-3 py-2 text-right text-cream/80">{r.decisionMakers}</td>
                  <td className="px-3 py-2 text-right text-cream/80">{r.dataGB.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right text-cream/60 flex items-center justify-end gap-1">
                    <Clock size={10} /> {r.duration}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={r.errors > 0 ? "text-red-400" : "text-cream/40"}>
                      {r.errors}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            background: r.status === "completed" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
                            color: r.status === "completed" ? "#10b981" : "rgba(255,255,255,0.4)",
                          }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}