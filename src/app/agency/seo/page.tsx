"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowUp, ArrowUpRight, BarChart3, BookOpen,
  CheckCircle2, ChevronRight, Clock, ExternalLink, FileText, Filter,
  Globe, Layers, LineChart, RefreshCw, Search, Sparkles, Target, TrendingUp,
  Zap, XCircle, Hash, Rocket, Eye, Hash as HashIcon, Gauge,
} from "lucide-react";

const C = {
  bg: "var(--bg-deep)",
  bgMid: "var(--bg-mid)",
  card: "var(--bg-card)",
  elev: "var(--bg-elev)",
  text: "var(--cream)",
  text2: "var(--cream-soft)",
  text3: "var(--cream-dim)",
  textMute: "var(--cream-mute)",
  border: "var(--line-soft)",
  borderHot: "var(--line)",
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

interface SEOPages {
  main: number;
  offers: number;
  blog: number;
  total: number;
}

interface LiveSite {
  url: string;
  status: string;
  http_code: number;
}

interface Technical {
  sitemap: boolean;
  robots_txt: boolean;
}

interface Keyword {
  keyword: string;
  volume: number;
  difficulty: number;
  sites: string[];
  intent: string;
  assignedSites: { id: string; name: string; url: string }[];
  totalPosts: number;
}

interface VelocityWeek {
  week: string;
  posts: number;
}

interface SiteIndex {
  id: string;
  name: string;
  url: string;
  postCount: number;
  lastPublish: string | null;
  daysSincePublish: number | null;
}

interface SEOData {
  pages: SEOPages;
  live_site: LiveSite;
  technical: Technical;
  main_page_list: string[];
  pipeline: { sites: any[]; totalFunnelSites: number; totalBlogPosts: number; totalFunnelPages: number };
  keywords: Keyword[];
  velocity: VelocityWeek[];
  siteIndexability: SiteIndex[];
  history: { totalSessions: number; completedSessions: number; totalDeploys: number; recentSessions: any[]; recentDeploys: any[] };
  generated_at: string;
}

const INTENT_COLORS: Record<string, string> = {
  brand: C.gold,
  commercial: C.emerald,
  informational: "#4a9eff",
  transactional: C.plum,
};

const SITE_ACCENT: Record<string, string> = {
  rodgersintelligence: C.rust,
  bestaiagentcommunity: "#d97757",
  aiprofitboardroom: "#a855f7",
  juliangoldieautomation: "#22d3ee",
  aisuccesslab: "#ec4899",
  aimoneylab: "#a3e635",
};

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "never";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function HealthRing({ score, status }: { score: number; status: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    status === "live" && score >= 80 ? C.emerald :
    status === "live" ? C.gold : "#ef4444";

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke={C.border} strokeWidth="8" />
        <motion.circle
          cx="64" cy="64" r={radius}
          fill="none" stroke={color}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[28px] font-bold" style={{ color }}>{score}</div>
        <div className="text-[9px] uppercase tracking-[0.2em]" style={{ color: C.text3 }}>
          {status === "live" ? "INDEX" : "DOWN"}
        </div>
      </div>
    </div>
  );
}

function VelocityBar({ weeks }: { weeks: VelocityWeek[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.posts));
  return (
    <div className="flex items-end gap-2 h-20">
      {weeks.map((w, i) => {
        const heightPct = (w.posts / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex-1 flex items-end">
              <motion.div
                className="w-full rounded-t-sm"
                style={{
                  background: `linear-gradient(180deg, ${C.goldSoft}, ${C.goldDeep})`,
                  boxShadow: `0 0 12px ${C.gold}40`,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              />
            </div>
            <div className="text-[9px] uppercase tracking-wider text-center" style={{ color: C.textMute }}>
              {w.week}
            </div>
            <div className="text-[11px] font-semibold tabular-nums" style={{ color: C.text2 }}>
              {w.posts}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DifficultyMeter({ difficulty }: { difficulty: number }) {
  const color = difficulty < 25 ? C.emerald : difficulty < 50 ? C.gold : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${difficulty}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-[11px] font-mono tabular-nums w-6 text-right" style={{ color }}>
        {difficulty}
      </span>
    </div>
  );
}

export default function SEOCommandPage() {
  const [data, setData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "brand" | "commercial" | "informational" | "transactional">("all");
  const [sortBy, setSortBy] = useState<"volume" | "difficulty" | "keyword">("volume");
  const [lastTick, setLastTick] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/seo", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: SEOData = await res.json();
      setData(json);
      setError(null);
      setLastTick(new Date().toLocaleTimeString("en-US", { hour12: false }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000); // 60s auto-refresh
    return () => clearInterval(id);
  }, [fetchData]);

  const filteredKeywords = useMemo(() => {
    if (!data) return [];
    let kws = data.keywords;
    if (filter !== "all") kws = kws.filter((k) => k.intent === filter);
    return [...kws].sort((a, b) => {
      if (sortBy === "volume") return b.volume - a.volume;
      if (sortBy === "difficulty") return a.difficulty - b.difficulty;
      return a.keyword.localeCompare(b.keyword);
    });
  }, [data, filter, sortBy]);

  const kpis = useMemo(() => {
    if (!data) return null;
    const totalVolume = data.keywords.reduce((s, k) => s + k.volume, 0);
    const avgDifficulty = data.keywords.length
      ? data.keywords.reduce((s, k) => s + k.difficulty, 0) / data.keywords.length
      : 0;
    const brandKw = data.keywords.filter((k) => k.intent === "brand").length;
    const commercialKw = data.keywords.filter((k) => k.intent === "commercial").length;
    const indexedSites = data.siteIndexability.filter((s) => s.postCount > 0).length;
    const indexScore = Math.round((indexedSites / Math.max(1, data.siteIndexability.length)) * 100);
    return { totalVolume, avgDifficulty, brandKw, commercialKw, indexedSites, indexScore };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2"
          style={{ borderColor: C.gold, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={32} style={{ color: C.plum }} className="mx-auto mb-3" />
        <div className="text-[14px]" style={{ color: C.text }}>SEO API unreachable</div>
        <div className="text-[12px] mt-1" style={{ color: C.text3 }}>{error}</div>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 rounded-md text-[12px] font-medium"
          style={{ background: `${C.gold}1a`, color: C.gold, border: `1px solid ${C.gold}40` }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || !kpis) return null;

  const liveIsUp = data.live_site.status === "live" && data.live_site.http_code === 200;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${C.gold}1a`, border: `1px solid ${C.gold}40` }}
          >
            <TrendingUp size={20} style={{ color: C.gold }} />
          </div>
          <div>
            <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: C.text }}>
              SEO Command
            </h1>
            <div className="text-[12px]" style={{ color: C.text3 }}>
              Multi-site search presence · 6 sites · {data.keywords.length} keyword clusters
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: C.textMute }}>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.emerald }} />
            auto-refresh 60s
          </span>
          <span>·</span>
          <span>last tick {lastTick || "—"}</span>
          <span>·</span>
          <span>generated {new Date(data.generated_at).toLocaleTimeString("en-US", { hour12: false })}</span>
          <span>·</span>
          <span>source /api/agency/seo</span>
        </div>
      </motion.div>

      {/* ── HERO KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Pages", val: data.pages.total, sub: `${data.pages.main} main / ${data.pages.offers} offer / ${data.pages.blog} blog`, icon: FileText, color: C.gold },
          { label: "Live Site", val: liveIsUp ? "LIVE" : "DOWN", sub: `HTTP ${data.live_site.http_code} · rodgersintelligence.com`, icon: Globe, color: liveIsUp ? C.emerald : "#ef4444" },
          { label: "Keyword Volume", val: formatNumber(kpis.totalVolume), sub: `${data.keywords.length} clusters tracked`, icon: Search, color: C.goldSoft },
          { label: "Avg Difficulty", val: kpis.avgDifficulty.toFixed(1), sub: `${kpis.brandKw} brand / ${kpis.commercialKw} commercial`, icon: Gauge, color: C.gold },
          { label: "Indexability", val: `${kpis.indexScore}%`, sub: `${kpis.indexedSites}/${data.siteIndexability.length} sites with posts`, icon: Layers, color: kpis.indexScore >= 50 ? C.emerald : C.gold },
          { label: "Deploys", val: data.history.totalDeploys, sub: `${data.history.totalSessions} sessions · ${data.history.completedSessions} done`, icon: Rocket, color: C.goldDeep },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl p-4 border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest" style={{ color: C.textMute }}>{k.label}</div>
              <k.icon size={14} style={{ color: k.color }} />
            </div>
            <div className="text-[22px] font-bold tabular-nums" style={{ color: k.color }}>{k.val}</div>
            <div className="text-[10px] mt-1 leading-tight" style={{ color: C.text3 }}>{k.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── LIVE SITE + TECHNICAL + HEALTH RING ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Live site status */}
        <motion.div
          {...fadeUp} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl p-5 border"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={16} style={{ color: C.gold }} />
              <div className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: C.text }}>Live Site Status</div>
            </div>
            <a
              href={data.live_site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md"
              style={{ background: `${C.gold}1a`, color: C.gold, border: `1px solid ${C.gold}40` }}
            >
              Open <ExternalLink size={10} />
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg p-3" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>HTTP</div>
              <div className="flex items-center gap-2">
                {liveIsUp ? <CheckCircle2 size={14} style={{ color: C.emerald }} /> : <XCircle size={14} style={{ color: "#ef4444" }} />}
                <span className="text-[20px] font-bold tabular-nums" style={{ color: liveIsUp ? C.emerald : "#ef4444" }}>
                  {data.live_site.http_code || "—"}
                </span>
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Sitemap</div>
              <div className="flex items-center gap-2">
                {data.technical.sitemap ? <CheckCircle2 size={14} style={{ color: C.emerald }} /> : <XCircle size={14} style={{ color: C.plum }} />}
                <span className="text-[12px]" style={{ color: data.technical.sitemap ? C.emerald : C.plum }}>
                  {data.technical.sitemap ? "Present" : "Missing"}
                </span>
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Robots.txt</div>
              <div className="flex items-center gap-2">
                {data.technical.robots_txt ? <CheckCircle2 size={14} style={{ color: C.emerald }} /> : <XCircle size={14} style={{ color: C.plum }} />}
                <span className="text-[12px]" style={{ color: data.technical.robots_txt ? C.emerald : C.plum }}>
                  {data.technical.robots_txt ? "Present" : "Missing"}
                </span>
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Last Check</div>
              <div className="text-[11px] font-mono" style={{ color: C.text2 }}>
                {new Date(data.generated_at).toLocaleString("en-US", { hour12: false })}
              </div>
            </div>
          </div>
          {/* Page breakdown */}
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: C.textMute }}>Page Inventory</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Main", n: data.pages.main, color: C.gold },
                { l: "Offer", n: data.pages.offers, color: C.emerald },
                { l: "Blog", n: data.pages.blog, color: C.plum },
              ].map((p) => (
                <div key={p.l} className="rounded-md p-3" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                  <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: C.textMute }}>{p.l}</div>
                  <div className="text-[20px] font-bold tabular-nums" style={{ color: p.color }}>{p.n}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Health ring + index score */}
        <motion.div
          {...fadeUp} transition={{ delay: 0.15 }}
          className="rounded-xl p-5 border flex flex-col items-center"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.text }}>Index Score</div>
          <HealthRing score={kpis.indexScore} status={data.live_site.status} />
          <div className="mt-4 text-center">
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMute }}>Pipeline Pages</div>
            <div className="text-[18px] font-bold tabular-nums" style={{ color: C.gold }}>
              {formatNumber(data.pipeline.totalFunnelPages)}
            </div>
            <div className="text-[10px] mt-1" style={{ color: C.text3 }}>
              {data.pipeline.totalFunnelSites} funnel sites · {data.pipeline.totalBlogPosts} blog posts
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── SITE INDEXABILITY GRID ─────────────────────────────────────── */}
      <motion.div
        {...fadeUp} transition={{ delay: 0.2 }}
        className="rounded-xl p-5 border mb-6"
        style={{ background: C.card, borderColor: C.border }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Layers size={16} style={{ color: C.gold }} />
          <div className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: C.text }}>Multi-Site Indexability</div>
          <div className="text-[10px] ml-auto" style={{ color: C.textMute }}>{data.siteIndexability.length} sites tracked</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.siteIndexability.map((site) => {
            const accent = SITE_ACCENT[site.id] || C.gold;
            const status = site.postCount > 0 ? "live" : "down";
            const score = site.postCount > 0 ? 100 : 0;
            return (
              <a
                key={site.id}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-4 border transition-all hover:scale-[1.01]"
                style={{ background: C.bgMid, borderColor: C.border }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate" style={{ color: C.text }}>{site.name}</div>
                    <div className="text-[10px] font-mono truncate mt-0.5" style={{ color: C.text3 }}>{site.url.replace("https://", "")}</div>
                  </div>
                  <div
                    className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      background: `${status === "live" ? C.emerald : "#ef4444"}1a`,
                      color: status === "live" ? C.emerald : "#ef4444",
                      border: `1px solid ${status === "live" ? C.emerald : "#ef4444"}40`,
                    }}
                  >
                    {status}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: C.textMute }}>Posts</div>
                    <div className="text-[16px] font-bold tabular-nums" style={{ color: accent }}>
                      {site.postCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: C.textMute }}>Last Publish</div>
                    <div className="text-[10px] font-mono" style={{ color: C.text2 }}>
                      {formatDate(site.lastPublish)}
                    </div>
                    {site.daysSincePublish !== null && (
                      <div className="text-[9px]" style={{ color: C.text3 }}>
                        {site.daysSincePublish}d ago
                      </div>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </motion.div>

      {/* ── KEYWORD CLUSTERS + VELOCITY ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Keyword clusters table */}
        <motion.div
          {...fadeUp} transition={{ delay: 0.25 }}
          className="lg:col-span-2 rounded-xl p-5 border"
          style={{ background: C.card, borderColor: C.border }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <HashIcon size={16} style={{ color: C.gold }} />
              <div className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: C.text }}>Keyword Clusters</div>
              <div className="text-[10px]" style={{ color: C.textMute }}>{filteredKeywords.length}/{data.keywords.length}</div>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter pills */}
              <div className="flex items-center gap-1 rounded-md p-0.5" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                {(["all", "brand", "commercial"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider"
                    style={{
                      background: filter === f ? `${C.gold}1a` : "transparent",
                      color: filter === f ? C.gold : C.text3,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-[10px] px-2 py-1 rounded-md uppercase tracking-wider"
                style={{ background: C.bgMid, color: C.text2, border: `1px solid ${C.border}` }}
              >
                <option value="volume">Vol ↓</option>
                <option value="difficulty">Diff ↑</option>
                <option value="keyword">A-Z</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredKeywords.map((kw) => {
              const intentColor = INTENT_COLORS[kw.intent] || C.text3;
              return (
                <div
                  key={kw.keyword}
                  className="rounded-md p-2.5 border flex items-center gap-3"
                  style={{ background: C.bgMid, borderColor: C.border }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[12px] font-medium truncate" style={{ color: C.text }}>{kw.keyword}</div>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: `${intentColor}1a`, color: intentColor, border: `1px solid ${intentColor}40` }}
                      >
                        {kw.intent}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <DifficultyMeter difficulty={kw.difficulty} />
                      <div className="text-[9px] flex items-center gap-1" style={{ color: C.text3 }}>
                        {kw.assignedSites.slice(0, 2).map((s) => (
                          <span
                            key={s.id}
                            className="px-1.5 py-0.5 rounded font-mono"
                            style={{
                              background: `${SITE_ACCENT[s.id] || C.text3}1a`,
                              color: SITE_ACCENT[s.id] || C.text3,
                              border: `1px solid ${SITE_ACCENT[s.id] || C.text3}40`,
                            }}
                          >
                            {s.id.replace("rodgersintelligence", "rig-main")}
                          </span>
                        ))}
                        {kw.assignedSites.length > 2 && (
                          <span style={{ color: C.textMute }}>+{kw.assignedSites.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[16px] font-bold tabular-nums" style={{ color: C.gold }}>
                      {formatNumber(kw.volume)}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: C.textMute }}>vol/mo</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Velocity + history stack */}
        <div className="space-y-4">
          <motion.div
            {...fadeUp} transition={{ delay: 0.3 }}
            className="rounded-xl p-5 border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-center gap-2 mb-3">
              <LineChart size={16} style={{ color: C.gold }} />
              <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: C.text }}>Content Velocity</div>
            </div>
            <VelocityBar weeks={data.velocity} />
            <div className="mt-3 text-[10px] text-center" style={{ color: C.textMute }}>
              Posts published · last 4 weeks
            </div>
          </motion.div>

          <motion.div
            {...fadeUp} transition={{ delay: 0.35 }}
            className="rounded-xl p-5 border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} style={{ color: C.gold }} />
              <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: C.text }}>Pipeline Funnels</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-md" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                <div className="text-[11px]" style={{ color: C.text2 }}>Funnel Sites</div>
                <div className="text-[14px] font-bold tabular-nums" style={{ color: C.gold }}>
                  {data.pipeline.totalFunnelSites}
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                <div className="text-[11px]" style={{ color: C.text2 }}>Blog Posts</div>
                <div className="text-[14px] font-bold tabular-nums" style={{ color: C.goldSoft }}>
                  {data.pipeline.totalBlogPosts}
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md" style={{ background: C.bgMid, border: `1px solid ${C.border}` }}>
                <div className="text-[11px]" style={{ color: C.text2 }}>Total Funnel Pages</div>
                <div className="text-[14px] font-bold tabular-nums" style={{ color: C.emerald }}>
                  {formatNumber(data.pipeline.totalFunnelPages)}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp} transition={{ delay: 0.4 }}
            className="rounded-xl p-5 border"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} style={{ color: C.gold }} />
              <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: C.text }}>Actions</div>
            </div>
            <div className="space-y-2">
              <a
                href="/seo"
                className="flex items-center justify-between p-2.5 rounded-md transition-colors"
                style={{ background: `${C.gold}1a`, border: `1px solid ${C.gold}40` }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={12} style={{ color: C.gold }} />
                  <div className="text-[11px] font-medium" style={{ color: C.gold }}>SEO Generator</div>
                </div>
                <ChevronRight size={12} style={{ color: C.gold }} />
              </a>
              <a
                href="/seo-guide"
                className="flex items-center justify-between p-2.5 rounded-md"
                style={{ background: C.bgMid, border: `1px solid ${C.border}` }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={12} style={{ color: C.text2 }} />
                  <div className="text-[11px] font-medium" style={{ color: C.text2 }}>SEO Guide</div>
                </div>
                <ChevronRight size={12} style={{ color: C.text3 }} />
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── DOCTRINE FOOTER ──────────────────────────────────────────── */}
      <motion.div
        {...fadeUp} transition={{ delay: 0.5 }}
        className="mt-6 pt-4 border-t flex items-center justify-between text-[10px]"
        style={{ borderColor: C.border, color: C.textMute }}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono">RIG-OS / SEO-COMMAND</span>
          <span>·</span>
          <span>coordinate L2-D2-A2-S</span>
          <span>·</span>
          <span>50-loop #47 research-studio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles size={10} />
          <span>Multi-site search presence is a compounding edge</span>
        </div>
      </motion.div>
    </div>
  );
}
