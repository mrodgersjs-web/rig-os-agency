"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, FileText, FolderOpen, Clock, Hash, ArrowLeft,
  RefreshCw, ChevronRight, BookOpen, TrendingUp, HardDrive,
  Layers, Sparkles, Target, Zap, Calendar, Brain, CheckCircle2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

interface SessionEntry {
  time: string;
  agent: string;
  type: string;
  summary: string;
}

interface SessionLog {
  date: string;
  title: string;
  path: string;
  entries: SessionEntry[];
  size: number;
  mtime: string;
}

interface ResearchEntry {
  path: string;
  title: string;
  subfolder: string;
  size: number;
  mtime: string;
  preview: string;
}

interface ArtifactEntry {
  path: string;
  title: string;
  size: number;
  mtime: string;
  preview: string;
}

interface GoalLoopProgress {
  proofPacketPath: string;
  proofPacketContent: string;
  auditPath: string | null;
  processOutlinePath: string;
  processOutlineContent: string;
  runId: string;
  verdict: string;
  timestamp: string;
}

interface WorkLogEntry {
  date: string;
  title: string;
  content: string;
}

interface VaultStats {
  vaultPath: string;
  totalFiles: number;
  totalWords: number;
  totalSize: number;
  totalFolders: number;
  lastModified: string;
  folders: { name: string; count: number; size: number }[];
  topByWords: { title: string; path: string; words: number; mtime: string }[];
}

interface SearchResult {
  path: string;
  title: string;
  folder: string;
  size: number;
  mtime: string;
  ctime: string;
  preview?: string;
  tags?: string[];
}

interface ObsidianData {
  sessions: { count: number; logs: SessionLog[] };
  research: { count: number; entries: ResearchEntry[] };
  artifacts: { count: number; entries: ArtifactEntry[] };
  goalLoop: GoalLoopProgress | null;
  workLog: { path: string; content: string; entries: WorkLogEntry[] } | null;
  stats: VaultStats | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatWords(n: number): string {
  if (n > 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n > 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Animations ────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// ── Main Component ───────────────────────────────────────────────────

export default function ObsidianEnrichmentPage() {
  const [data, setData] = useState<ObsidianData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"sessions" | "research" | "artifacts" | "goalloop" | "worklog" | "search">("sessions");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // ── Load overview on mount ─────────────────────────────────────────
  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/obsidian?action=overview").then((r) => r.json());
      setData(res);
    } catch (err) {
      console.error("Failed to load vault data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Search ─────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/agency/obsidian?action=search&q=${encodeURIComponent(q)}&limit=30`).then((r) => r.json());
      setSearchResults(res.results ?? []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => doSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  // ── Derived ────────────────────────────────────────────────────────
  const totalEntries = useMemo(() => {
    if (!data) return 0;
    return (
      (data.sessions.logs?.length ?? 0) +
      (data.research.entries?.length ?? 0) +
      (data.artifacts.entries?.length ?? 0)
    );
  }, [data]);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--gold)", fontWeight: 600 }}>
            JakeStudio Vault · Enriched
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Obsidian <span className="hand text-[1.2em]" style={{ color: "var(--gold)" }}>Vault Browser</span>
            </h1>
            <p className="text-[13px] mt-1.5" style={{ color: "var(--cream-dim)" }}>
              Sessions, research, artifacts, goal-loop progress, and vault search across {data?.stats ? data.stats.totalFiles.toLocaleString() : "9,754"} notes.
            </p>
          </div>
          <button
            onClick={loadOverview}
            className="px-3 py-2 rounded-lg text-[12px] font-medium border flex items-center gap-2 transition"
            style={{ borderColor: "var(--line)", color: "var(--cream)" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </motion.section>

      {/* Stats Cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Vault Files", value: data?.stats ? data.stats.totalFiles.toLocaleString() : "9,754", icon: <FileText size={16} />, accent: "var(--gold)" },
            { label: "Total Words", value: data?.stats ? formatWords(data.stats.totalWords) : "—", icon: <BookOpen size={16} />, accent: "var(--emerald)" },
            { label: "Folders", value: data?.stats?.totalFolders?.toString() ?? "—", icon: <FolderOpen size={16} />, accent: "var(--plum)" },
            { label: "Vault Size", value: data?.stats ? formatSize(data.stats.totalSize) : "—", icon: <HardDrive size={16} />, accent: "var(--rust)" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{kpi.label}</span>
              </div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Search Bar */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.08 }}>
        <div className="rounded-xl border p-3 flex items-center gap-2" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <Search size={16} style={{ color: "var(--cream-dim)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) setActiveTab("search");
              else setActiveTab("sessions");
            }}
            placeholder="Search across entire vault — titles, content, paths..."
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: "var(--cream)" }}
          />
          {searching && <RefreshCw size={12} className="animate-spin" style={{ color: "var(--cream-dim)" }} />}
          {searchQuery && (
            <span className="text-[10px] mono px-2 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}>
              {searchResults.length} results
            </span>
          )}
        </div>
      </motion.section>

      {/* Tabs */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex flex-wrap gap-1">
          {[
            { id: "sessions" as const, label: "Sessions", icon: <Calendar size={13} />, count: data?.sessions.count },
            { id: "research" as const, label: "Research", icon: <BookOpen size={13} />, count: data?.research.count },
            { id: "artifacts" as const, label: "Artifacts", icon: <Layers size={13} />, count: data?.artifacts.count },
            { id: "goalloop" as const, label: "Goal Loop", icon: <Target size={13} />, count: data?.goalLoop ? 1 : 0 },
            { id: "worklog" as const, label: "Work Log", icon: <Clock size={13} />, count: data?.workLog?.entries?.length },
            ...(searchQuery.trim() ? [{ id: "search" as const, label: `Search (${searchResults.length})`, icon: <Search size={13} />, count: undefined }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition"
              style={{
                background: activeTab === tab.id ? "var(--gold)" : "transparent",
                color: activeTab === tab.id ? "var(--bg-deep)" : "var(--cream-dim)",
                border: `1px solid ${activeTab === tab.id ? "var(--gold)" : "var(--line-soft)"}`,
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[9px] mono px-1 rounded" style={{
                  background: activeTab === tab.id ? "rgba(21,16,26,0.2)" : "var(--bg-mid)",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Content Area */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.12 }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin" style={{ color: "var(--cream-dim)" }} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── Sessions Tab ── */}
            {activeTab === "sessions" && (
              <motion.div key="sessions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {(data?.sessions.logs ?? []).length === 0 && (
                  <div className="text-center py-12 text-[13px]" style={{ color: "var(--cream-dim)" }}>
                    No recent sessions in the last 7 days
                  </div>
                )}
                {(data?.sessions.logs ?? []).map((log, idx) => (
                  <motion.div
                    key={log.path}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-xl border overflow-hidden"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <button
                      onClick={() => setExpandedSession(expandedSession === log.path ? null : log.path)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left transition hover:bg-[var(--bg-mid)]"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar size={16} style={{ color: "var(--gold)" }} />
                        <div>
                          <div className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>
                            {log.date}
                          </div>
                          <div className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                            {log.entries.length} entries · {formatSize(log.size)} · {formatDate(log.mtime)}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        style={{
                          color: "var(--cream-dim)",
                          transform: expandedSession === log.path ? "rotate(90deg)" : "none",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    {expandedSession === log.path && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="border-t"
                        style={{ borderColor: "var(--line-soft)" }}
                      >
                        {log.entries.map((entry, ei) => (
                          <div key={ei} className="flex gap-3 px-4 py-2.5 border-b last:border-0" style={{ borderColor: "var(--line-deep)" }}>
                            <div className="text-[10px] mono shrink-0 mt-0.5" style={{ color: "var(--gold)" }}>
                              {entry.time}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded mono" style={{ background: "var(--bg-elev)", color: "var(--emerald)" }}>
                                  {entry.agent}
                                </span>
                                <span className="text-[10px]" style={{ color: "var(--cream-dim)" }}>
                                  {entry.type}
                                </span>
                              </div>
                              <p className="text-[12px] line-clamp-2" style={{ color: "var(--cream-soft)" }}>
                                {entry.summary}
                              </p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── Research Tab ── */}
            {activeTab === "research" && (
              <motion.div key="research" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(data?.research.entries ?? []).map((entry, idx) => (
                  <motion.div
                    key={entry.path}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="rounded-xl border p-4 transition hover:border-[var(--line)]"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <BookOpen size={14} style={{ color: "var(--emerald)", marginTop: 2 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate" style={{ color: "var(--cream)" }}>
                          {entry.title}
                        </div>
                        <div className="text-[10px] mono flex items-center gap-2 mt-0.5" style={{ color: "var(--cream-dim)" }}>
                          <span>{entry.subfolder}</span>
                          <span>·</span>
                          <span>{formatSize(entry.size)}</span>
                          <span>·</span>
                          <span>{formatDate(entry.mtime)}</span>
                        </div>
                      </div>
                    </div>
                    {entry.preview && (
                      <p className="text-[11px] line-clamp-3 mt-1" style={{ color: "var(--cream-dim)" }}>
                        {entry.preview}
                      </p>
                    )}
                  </motion.div>
                ))}
                {(data?.research.entries ?? []).length === 0 && (
                  <div className="col-span-full text-center py-12 text-[13px]" style={{ color: "var(--cream-dim)" }}>
                    No research entries found
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Artifacts Tab ── */}
            {activeTab === "artifacts" && (
              <motion.div key="artifacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(data?.artifacts.entries ?? []).map((artifact, idx) => (
                  <motion.div
                    key={artifact.path}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="rounded-xl border p-4 transition hover:border-[var(--line)]"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Layers size={14} style={{ color: "var(--plum)", marginTop: 2 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate" style={{ color: "var(--cream)" }}>
                          {artifact.title}
                        </div>
                        <div className="text-[10px] mono flex items-center gap-2 mt-0.5" style={{ color: "var(--cream-dim)" }}>
                          <span>{formatSize(artifact.size)}</span>
                          <span>·</span>
                          <span>{formatDate(artifact.mtime)}</span>
                        </div>
                      </div>
                    </div>
                    {artifact.preview && (
                      <p className="text-[11px] line-clamp-3 mt-1" style={{ color: "var(--cream-dim)" }}>
                        {artifact.preview}
                      </p>
                    )}
                  </motion.div>
                ))}
                {(data?.artifacts.entries ?? []).length === 0 && (
                  <div className="col-span-full text-center py-12 text-[13px]" style={{ color: "var(--cream-dim)" }}>
                    No artifacts found
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Goal Loop Tab ── */}
            {activeTab === "goalloop" && data?.goalLoop && (
              <motion.div key="goalloop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--line)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <Target size={20} style={{ color: "var(--gold)" }} />
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
                        Goal Loop Global Capability
                      </div>
                      <div className="text-[11px] mono" style={{ color: "var(--cream-dim)" }}>
                        Run ID: {data.goalLoop.runId} · {data.goalLoop.timestamp}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: "var(--bg-mid)" }}>
                      <CheckCircle2 size={14} style={{ color: "var(--emerald)" }} />
                      <span className="text-[12px] font-semibold" style={{ color: "var(--emerald)" }}>
                        {data.goalLoop.verdict}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>Proof Packet</div>
                      <div className="text-[12px] mono" style={{ color: "var(--gold)" }}>{data.goalLoop.proofPacketPath}</div>
                    </div>
                    <div className="rounded-lg border p-3" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>Process Outline</div>
                      <div className="text-[12px] mono" style={{ color: "var(--emerald)" }}>{data.goalLoop.processOutlinePath}</div>
                    </div>
                  </div>
                  {data.goalLoop.auditPath && (
                    <div className="rounded-lg border p-3 mt-3" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>Audit Report</div>
                      <div className="text-[12px] mono" style={{ color: "var(--plum)" }}>{data.goalLoop.auditPath}</div>
                    </div>
                  )}
                </div>
                {/* Proof packet content preview */}
                <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                  <div className="text-[12px] uppercase tracking-wider mb-3" style={{ color: "var(--cream-dim)" }}>
                    Proof Packet Content
                  </div>
                  <pre className="text-[11px] leading-relaxed overflow-x-auto max-h-[400px] overflow-y-auto" style={{ color: "var(--cream-soft)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {data.goalLoop.proofPacketContent.slice(0, 2000)}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* ── Work Log Tab ── */}
            {activeTab === "worklog" && (
              <motion.div key="worklog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {(data?.workLog?.entries ?? []).map((entry, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-xl border p-4"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} style={{ color: "var(--gold)" }} />
                      <span className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>
                        {entry.title}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed line-clamp-4" style={{ color: "var(--cream-soft)" }}>
                      {entry.content}
                    </p>
                  </motion.div>
                ))}
                {(data?.workLog?.entries ?? []).length === 0 && (
                  <div className="text-center py-12 text-[13px]" style={{ color: "var(--cream-dim)" }}>
                    No work log entries found
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Search Tab ── */}
            {activeTab === "search" && (
              <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {searchResults.length === 0 && !searching && (
                  <div className="text-center py-12 text-[13px]" style={{ color: "var(--cream-dim)" }}>
                    {searchQuery ? "No results found" : "Start typing to search the vault..."}
                  </div>
                )}
                {searchResults.map((result, idx) => (
                  <motion.div
                    key={result.path}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="rounded-lg border p-3 transition hover:border-[var(--line)]"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={13} style={{ color: "var(--cream-dim)" }} />
                      <span className="text-[13px] font-medium truncate flex-1" style={{ color: "var(--cream)" }}>
                        {result.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                      <span className="flex items-center gap-1">
                        <FolderOpen size={10} />
                        {result.folder}
                      </span>
                      <span>{formatSize(result.size)}</span>
                      <span>{formatDate(result.mtime)}</span>
                    </div>
                    {result.preview && (
                      <p className="text-[11px] mt-1.5 line-clamp-2" style={{ color: "var(--cream-dim)" }}>
                        {result.preview}
                      </p>
                    )}
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {result.tags.slice(0, 5).map((tag, ti) => (
                          <span key={ti} className="text-[9px] px-1.5 py-0.5 rounded mono" style={{ background: "var(--bg-mid)", color: "var(--gold)" }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.section>

      {/* Folder Breakdown */}
      {!loading && data?.stats && activeTab !== "search" && (
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen size={16} style={{ color: "var(--gold)" }} />
              <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: "var(--cream)" }}>
                Vault Folders
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {data.stats.folders.slice(0, 16).map((f) => (
                <div key={f.name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--bg-mid)" }}>
                  <span className="text-[12px] truncate" style={{ color: "var(--cream-soft)" }}>
                    {f.name}
                  </span>
                  <span className="text-[10px] mono px-1.5 rounded" style={{ background: "var(--bg-elev)", color: "var(--gold)" }}>
                    {f.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}