"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, Globe, FileCode, CheckCircle, AlertCircle,
  TrendingUp, Layers, Zap, ExternalLink, Clock,
  BarChart3, Target, Award, BookOpen, Rocket,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function daysAgo(days: number | null): string {
  if (days === null || isNaN(days)) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface KeywordRow {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: string;
  totalPosts: number;
  assignedSites: { id: string; name: string; url: string }[];
}

interface SiteIndexRow {
  id: string;
  name: string;
  url: string;
  postCount: number;
  daysSincePublish: number | null;
}

interface SiteStat {
  site: { id: string; name: string; url: string; path: string; postsDir: string };
  postCount: number;
  recent: { slug: string; mtime: number; title?: string; date?: string }[];
}

interface VelocityWeek {
  week: string;
  posts: number;
}

export default function SeoPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agency/seo")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => {
        setError(e.message);
        setData({});
      });
  }, []);

  if (!data && !error) {
    return (
      <div style={{ padding: "3rem", color: "var(--cream-dim)" }}>
        Loading SEO data…
      </div>
    );
  }

  if (error && !data?.pages) {
    return (
      <div style={{ padding: "3rem", color: "var(--plum)" }}>
        Error loading SEO data: {error}
      </div>
    );
  }

  const pages = data.pages || {};
  const live = data.live_site || {};
  const tech = data.technical || {};
  const pipeline = data.pipeline || {};
  const keywords: KeywordRow[] = data.keywords || [];
  const siteIndex: SiteIndexRow[] = data.siteIndexability || [];
  const velocity: VelocityWeek[] = data.velocity || [];
  const history = data.history || {};

  const totalKeywordVolume = keywords.reduce((s, k) => s + k.volume, 0);
  const maxVelocity = Math.max(...velocity.map((v) => v.posts), 1);
  const activeSites = siteIndex.filter((s) => s.postCount > 0).length;

  return (
    <div className="space-y-8" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Search size={22} style={{ color: "var(--gold)" }} />
          <span
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{
              color: "var(--cream-mute)",
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 600,
            }}
          >
            SEO Command Center
          </span>
        </div>
        <h1
          className="text-3xl tracking-tight"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 500,
            color: "var(--cream)",
          }}
        >
          SEO Ranking Dashboard
        </h1>
        <p className="text-[14px] mt-2" style={{ color: "var(--cream-dim)" }}>
          rodgersintelligence.com · {pipeline.totalFunnelSites || 5}-site SEO funnel ·{" "}
          {pipeline.totalBlogPosts || 0} blog posts published ·{" "}
          {keywords.length} keyword clusters tracked
        </p>
      </motion.section>

      {/* KPI Cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Funnel Pages",
              value: pipeline.totalFunnelPages || pages.total || 31,
              sub: `${activeSites}/${pipeline.totalFunnelSites || 5} sites active`,
              icon: <FileCode size={18} />,
              accent: "var(--gold)",
            },
            {
              label: "Blog Posts Published",
              value: pipeline.totalBlogPosts || 0,
              sub: `across ${pipeline.totalFunnelSites || 5} sites`,
              icon: <BookOpen size={18} />,
              accent: "var(--emerald)",
            },
            {
              label: "Keyword Volume Tracked",
              value: formatNum(totalKeywordVolume),
              sub: `${keywords.length} target clusters`,
              icon: <TrendingUp size={18} />,
              accent: "var(--plum)",
            },
            {
              label: "Content Sessions",
              value: history.totalSessions || 0,
              sub: `${history.completedSessions || 0} completed`,
              icon: <Zap size={18} />,
              accent: "#22d3ee",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-4 border"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--line-soft)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--cream-dim)" }}
                >
                  {kpi.label}
                </span>
              </div>
              <div
                className="text-2xl"
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 500,
                  color: kpi.accent,
                }}
              >
                {kpi.value}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--cream-mute)" }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Live Site + Technical SEO */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Live Site Status */}
          <div
            className="rounded-xl p-5 border"
            style={{
              background: "var(--bg-card)",
              borderColor: live.status === "live" ? "rgba(90,184,150,0.3)" : "rgba(196,96,126,0.3)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              {live.status === "live" ? (
                <CheckCircle size={20} style={{ color: "var(--emerald)" }} />
              ) : (
                <AlertCircle size={20} style={{ color: "var(--plum)" }} />
              )}
              <span
                className="text-[11px] uppercase tracking-wider"
                style={{ color: "var(--cream-dim)" }}
              >
                Primary Site Status
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={16} style={{ color: "var(--gold)" }} />
              <a
                href={live.url || "https://rodgersintelligence.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-semibold hover:underline"
                style={{ color: "var(--cream)" }}
              >
                {live.url || "rodgersintelligence.com"}
              </a>
              <ExternalLink size={12} style={{ color: "var(--cream-mute)" }} />
            </div>
            <div
              className="text-[12px] mt-1"
              style={{
                color: live.status === "live" ? "var(--emerald)" : "var(--plum)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              HTTP {live.http_code} — {live.status}
            </div>
          </div>

          {/* Technical SEO */}
          <div
            className="rounded-xl p-5 border"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Layers size={18} style={{ color: "var(--gold)" }} />
              <span
                className="text-[11px] uppercase tracking-wider"
                style={{ color: "var(--cream-dim)" }}
              >
                Technical SEO
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "sitemap.xml", ok: tech.sitemap },
                { label: "robots.txt", ok: tech.robots_txt },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  {s.ok ? (
                    <CheckCircle size={16} style={{ color: "var(--emerald)" }} />
                  ) : (
                    <AlertCircle size={16} style={{ color: "var(--plum)" }} />
                  )}
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>
                      {s.label}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{ color: s.ok ? "var(--emerald)" : "var(--plum)" }}
                    >
                      {s.ok ? "Present" : "Missing"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
                  Pages on primary site:
                </span>
                <span className="text-[13px] font-semibold" style={{ color: "var(--gold)" }}>
                  {pages.main || 0} main · {pages.offers || 0} offers · {pages.blog || 0} blog = {pages.total || 0} total
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Content Velocity Chart */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div
          className="rounded-xl p-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} style={{ color: "var(--emerald)" }} />
              <h2
                className="text-[15px] font-semibold"
                style={{ color: "var(--cream)" }}
              >
                Content Velocity (4 weeks)
              </h2>
            </div>
            <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
              {velocity.reduce((s, v) => s + v.posts, 0)} posts published
            </span>
          </div>
          <div className="flex items-end gap-3" style={{ height: 120 }}>
            {velocity.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="text-[11px] font-semibold"
                  style={{ color: "var(--gold)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {v.posts}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((v.posts / maxVelocity) * 80, v.posts > 0 ? 8 : 2)}px` }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                  className="w-full rounded-t-md"
                  style={{
                    background:
                      v.posts > 0
                        ? "linear-gradient(180deg, var(--gold), var(--gold-deep))"
                        : "var(--bg-mid)",
                    minHeight: 2,
                  }}
                />
                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                  {v.week}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Keyword Cluster Tracking */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <Target size={18} style={{ color: "var(--gold)" }} />
          <h2
            className="text-[18px] font-semibold"
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              color: "var(--cream)",
            }}
          >
            Keyword Cluster Tracking
          </h2>
          <span className="text-[12px]" style={{ color: "var(--cream-mute)" }}>
            {keywords.length} target keywords · {formatNum(totalKeywordVolume)} monthly search volume
          </span>
        </div>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--line-soft)",
                  color: "var(--cream-dim)",
                }}
              >
                <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wider">
                  Keyword
                </th>
                <th className="text-right px-3 py-3 font-medium text-[11px] uppercase tracking-wider">
                  Volume
                </th>
                <th className="text-right px-3 py-3 font-medium text-[11px] uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="text-center px-3 py-3 font-medium text-[11px] uppercase tracking-wider">
                  Intent
                </th>
                <th className="text-right px-3 py-3 font-medium text-[11px] uppercase tracking-wider">
                  Content
                </th>
                <th className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wider">
                  Target Sites
                </th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid var(--line-deep)",
                  }}
                  className="hover:bg-[var(--bg-elev)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: "var(--cream)" }}>
                      {kw.keyword}
                    </div>
                  </td>
                  <td
                    className="px-3 py-3 text-right font-semibold"
                    style={{
                      color: "var(--gold)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {formatNum(kw.volume)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <div
                        className="w-8 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-mid)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${kw.difficulty}%`,
                            background:
                              kw.difficulty > 50
                                ? "var(--plum)"
                                : kw.difficulty > 35
                                  ? "var(--gold)"
                                  : "var(--emerald)",
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px]"
                        style={{
                          color:
                            kw.difficulty > 50
                              ? "var(--plum)"
                              : kw.difficulty > 35
                                ? "var(--gold)"
                                : "var(--emerald)",
                        }}
                      >
                        {kw.difficulty}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        background:
                          kw.intent === "brand"
                            ? "rgba(90,184,150,0.15)"
                            : "rgba(212,165,116,0.15)",
                        color: kw.intent === "brand" ? "var(--emerald)" : "var(--gold)",
                      }}
                    >
                      {kw.intent}
                    </span>
                  </td>
                  <td
                    className="px-3 py-3 text-right font-semibold"
                    style={{
                      color: kw.totalPosts > 5 ? "var(--emerald)" : "var(--cream-dim)",
                    }}
                  >
                    {kw.totalPosts}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {kw.assignedSites.map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded text-[10px] hover:opacity-80 transition-opacity"
                          style={{
                            background: "var(--bg-mid)",
                            color: "var(--gold)",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {s.name.replace(/\.(com|org|net)$/, "")}
                        </a>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Multi-Site Indexability */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <Rocket size={18} style={{ color: "var(--emerald)" }} />
          <h2
            className="text-[18px] font-semibold"
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              color: "var(--cream)",
            }}
          >
            Multi-Site Funnel Indexability
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {siteIndex.map((site, i) => (
            <div
              key={site.id}
              className="rounded-xl p-4 border"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--line-soft)",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold hover:underline truncate max-w-[180px]"
                  style={{ color: "var(--cream)" }}
                >
                  {site.name}
                </a>
                <ExternalLink size={12} style={{ color: "var(--cream-mute)" }} />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <div
                    className="text-[20px] font-bold"
                    style={{
                      color: site.postCount > 0 ? "var(--gold)" : "var(--cream-mute)",
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                    }}
                  >
                    {site.postCount}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--cream-dim)" }}>
                    posts
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Clock size={12} style={{ color: "var(--cream-mute)" }} />
                    <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
                      {daysAgo(site.daysSincePublish)}
                    </span>
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{
                      color:
                        (site.daysSincePublish ?? 999) <= 7
                          ? "var(--emerald)"
                          : (site.daysSincePublish ?? 999) <= 30
                            ? "var(--gold)"
                            : "var(--plum)",
                    }}
                  >
                    {(site.daysSincePublish ?? 999) <= 7
                      ? "Fresh content"
                      : (site.daysSincePublish ?? 999) <= 30
                        ? "Needs refresh"
                        : "Stale"}
                  </div>
                </div>
              </div>
              <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(site.postCount * 3, 100)}%`,
                    background:
                      site.postCount > 20
                        ? "var(--emerald)"
                        : site.postCount > 5
                          ? "var(--gold)"
                          : "var(--plum)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Recent Sessions & Deploys */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Generate Sessions */}
          <div
            className="rounded-xl p-5 border"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} style={{ color: "var(--gold)" }} />
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
                Content Generation Sessions
              </h3>
              <span className="text-[11px] ml-auto" style={{ color: "var(--cream-mute)" }}>
                {history.totalSessions || 0} total · {history.completedSessions || 0} completed
              </span>
            </div>
            {(history.recentSessions || []).length === 0 ? (
              <div className="text-[12px] py-4 text-center" style={{ color: "var(--cream-mute)" }}>
                No generation sessions yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {(history.recentSessions || []).slice(0, 8).map((s: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg"
                    style={{ background: "var(--bg-mid)" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background:
                          s.status === "completed"
                            ? "var(--emerald)"
                            : s.status === "running"
                              ? "var(--gold)"
                              : s.status === "failed"
                                ? "var(--plum)"
                                : "var(--cream-mute)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium truncate" style={{ color: "var(--cream)" }}>
                        {s.keyword}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                        {s.articles?.length || 0} articles · {s.status}
                      </div>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "var(--cream-mute)" }}>
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Deploys */}
          <div
            className="rounded-xl p-5 border"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Rocket size={16} style={{ color: "var(--emerald)" }} />
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
                Recent Deploys
              </h3>
              <span className="text-[11px] ml-auto" style={{ color: "var(--cream-mute)" }}>
                {history.totalDeploys || 0} total
              </span>
            </div>
            {(history.recentDeploys || []).length === 0 ? (
              <div className="text-[12px] py-4 text-center" style={{ color: "var(--cream-mute)" }}>
                No deploys yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {(history.recentDeploys || []).slice(0, 8).map((d: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg"
                    style={{ background: "var(--bg-mid)" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background:
                          d.status === "ok"
                            ? "var(--emerald)"
                            : d.status === "running"
                              ? "var(--gold)"
                              : "var(--plum)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium truncate" style={{ color: "var(--cream)" }}>
                        {d.siteName}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                        {d.liveSlug || "—"} · {d.status}
                      </div>
                    </div>
                    {d.netlifyUrl && (
                      <a
                        href={d.netlifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] flex-shrink-0 hover:underline"
                        style={{ color: "var(--gold)" }}
                      >
                        Preview →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Indexed Pages List */}
      {(data.main_page_list || []).length > 0 && (
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.35 }}>
          <div
            className="rounded-xl p-5 border"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FileCode size={16} style={{ color: "var(--gold)" }} />
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>
                Indexed Pages on Primary Site
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data.main_page_list || []).map((page: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                  style={{ background: "var(--bg-mid)" }}
                >
                  <FileCode size={11} style={{ color: "var(--cream-mute)" }} />
                  <code
                    className="text-[11px]"
                    style={{
                      color: "var(--gold)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {page}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Footer timestamp */}
      <div className="text-[10px] text-center pt-4 pb-8" style={{ color: "var(--cream-mute)" }}>
        Data generated at {data.generated_at ? new Date(data.generated_at).toLocaleString() : "—"}
      </div>
    </div>
  );
}
