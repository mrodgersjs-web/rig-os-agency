"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, FileText, FolderOpen, Clock, Hash, ArrowLeft,
  Download, Database, RefreshCw, ChevronRight, BookOpen,
  TrendingUp, HardDrive, Layers, Sparkles,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
interface Note {
  path: string;
  title: string;
  folder: string;
  size: number;
  mtime: string;
  ctime: string;
  preview?: string;
  excerpt?: string;
  content?: string;
}

interface VaultStats {
  vaultPath: string;
  totalNotes: number;
  totalFolders: number;
  totalSize: number;
  folders: { name: string; count: number; size: number }[];
  topNotes: { title: string; path: string; mtime: string }[];
}

// ── Helpers ──────────────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function stripYaml(md: string): string {
  const lines = md.split("\n");
  if (lines[0]?.trim() === "---") {
    const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (endIdx > 0) return lines.slice(endIdx + 1).join("\n").trim();
  }
  return md;
}

function renderMarkdown(md: string): string {
  const content = stripYaml(md);
  let html = content
    // Code blocks (```lang\ncode```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre style="background:var(--bg-mid);border:1px solid var(--line-soft);border-radius:8px;padding:14px 16px;overflow-x:auto;margin:12px 0;font-size:13px;line-height:1.6"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:var(--bg-mid);padding:2px 6px;border-radius:4px;font-size:0.9em;font-family:JetBrains Mono,monospace">$1</code>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;color:var(--cream);margin:16px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:600;color:var(--cream);margin:20px 0 8px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:600;color:var(--cream);margin:24px 0 10px">$1</h1>')
    // Bold and italic
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--cream)">$1</strong>')
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Links [[wikilinks]]
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, link, label) =>
      `<span style="color:var(--gold);cursor:pointer;text-decoration:underline;text-underline-offset:2px">${label || link}</span>`)
    // External links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--gold);text-decoration:underline">$1</a>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--gold);padding-left:12px;margin:10px 0;color:var(--cream-dim)">$1</blockquote>')
    // HR
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--line-soft);margin:16px 0" />')
    // Lists
    .replace(/^- (.+)$/gm, '<li style="margin-left:20px;list-style:disc;color:var(--cream-soft)">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:20px;list-style:decimal;color:var(--cream-soft)">$1</li>')
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[h|p|l|b|h|<])(.+)$/gm, '<p style="margin:8px 0;color:var(--cream-soft);line-height:1.7">$1</p>');

  return html;
}

// ── Animations ───────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};
const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

// ── Component ─────────────────────────────────────────────────────────
export default function ObsidianBrowserPage() {
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"recent" | "search" | "folders">("recent");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // ── Load stats + recent on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch("/api/obsidian?action=stats").then((r) => r.json()),
          fetch("/api/obsidian?action=recent&limit=12").then((r) => r.json()),
        ]);
        setStats(statsRes.stats ?? null);
        setRecentNotes(recentRes.notes ?? []);
      } catch (err) {
        console.error("Failed to load vault data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Search ────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/obsidian?action=search&q=${encodeURIComponent(q)}&limit=30`).then((r) => r.json());
      setSearchResults(res.notes ?? []);
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

  // ── Open note ─────────────────────────────────────────────────────
  const openNote = useCallback(async (path: string) => {
    setLoadingNote(true);
    try {
      const res = await fetch(`/api/obsidian?action=note&path=${encodeURIComponent(path)}`).then((r) => r.json());
      setSelectedNote(res.note ?? null);
    } catch (err) {
      console.error("Failed to open note:", err);
    } finally {
      setLoadingNote(false);
    }
  }, []);

  // ── Import ────────────────────────────────────────────────────────
  const importNotes = useCallback(async (paths?: string[]) => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/obsidian/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: paths ?? recentNotes.map((n) => n.path) }),
      }).then((r) => r.json());
      setImportResult(`Imported ${res.imported ?? 0} notes to knowledge base`);
    } catch (err) {
      setImportResult("Import failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setImporting(false);
    }
  }, [recentNotes]);

  // ── Derived data ──────────────────────────────────────────────────
  const notesToShow = useMemo(() => {
    if (activeTab === "search") return searchResults;
    if (activeTab === "folders" && activeFolder) {
      return recentNotes.filter((n) => n.folder === activeFolder);
    }
    return recentNotes;
  }, [activeTab, searchResults, recentNotes, activeFolder]);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--gold)", fontWeight: 600 }}>
            JakeStudio Vault
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Obsidian <span className="hand text-[1.2em]" style={{ color: "var(--gold)" }}>Browser</span>
            </h1>
            <p className="text-[13px] mt-1.5" style={{ color: "var(--cream-dim)" }}>
              Browse, search, and import notes from the JakeStudio vault into the knowledge base.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => importNotes()}
              disabled={importing}
              className="px-4 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2 transition disabled:opacity-50"
              style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
            >
              <Download size={14} />
              {importing ? "Importing..." : "Import Recent"}
            </button>
            <button
              onClick={async () => {
                setLoading(true);
                const [statsRes, recentRes] = await Promise.all([
                  fetch("/api/obsidian?action=stats").then((r) => r.json()),
                  fetch("/api/obsidian?action=recent&limit=12").then((r) => r.json()),
                ]);
                setStats(statsRes.stats ?? null);
                setRecentNotes(recentRes.notes ?? []);
                setLoading(false);
              }}
              className="px-3 py-2 rounded-lg text-[12px] font-medium border flex items-center gap-2 transition"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 px-4 py-2 rounded-lg text-[12px]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--line)", color: "var(--cream-soft)" }}
          >
            {importResult}
          </motion.div>
        )}
      </motion.section>

      {/* Stats Cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Notes", value: stats?.totalNotes?.toLocaleString() ?? "—", icon: <FileText size={16} />, accent: "#d4a574" },
            { label: "Folders", value: stats?.totalFolders?.toString() ?? "—", icon: <FolderOpen size={16} />, accent: "#5ab896" },
            { label: "Vault Size", value: stats ? formatSize(stats.totalSize) : "—", icon: <HardDrive size={16} />, accent: "#c4607e" },
            { label: "Avg Size", value: stats && stats.totalNotes > 0 ? formatSize(Math.floor(stats.totalSize / stats.totalNotes)) : "—", icon: <TrendingUp size={16} />, accent: "#22d3ee" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-4 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
                  {kpi.label}
                </span>
              </div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Main Grid: Left = Notes List, Right = Note Viewer */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          {/* Left: Notes List + Search */}
          <div className="space-y-4">
            {/* Search */}
            <div
              className="rounded-xl border p-3 flex items-center gap-2"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <Search size={16} style={{ color: "var(--cream-dim)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) setActiveTab("search");
                  else setActiveTab("recent");
                }}
                placeholder="Search vault..."
                className="flex-1 bg-transparent outline-none text-[13px]"
                style={{ color: "var(--cream)" }}
              />
              {searching && <RefreshCw size={12} className="animate-spin" style={{ color: "var(--cream-dim)" }} />}
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
              {[
                { id: "recent" as const, label: "Recent", icon: <Clock size={13} /> },
                { id: "search" as const, label: `Search${searchResults.length > 0 ? ` (${searchResults.length})` : ""}`, icon: <Search size={13} /> },
                { id: "folders" as const, label: "Folders", icon: <FolderOpen size={13} /> },
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
                </button>
              ))}
            </div>

            {/* Folder list when on folders tab */}
            {activeTab === "folders" && stats && (
              <div className="space-y-1 max-h-[200px] overflow-y-auto rounded-lg border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                {stats.folders.slice(0, 25).map((f) => (
                  <button
                    key={f.name}
                    onClick={() => {
                      setActiveFolder(activeFolder === f.name ? null : f.name);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[12px] transition hover:bg-[var(--bg-mid)]"
                    style={{ color: activeFolder === f.name ? "var(--gold)" : "var(--cream-soft)" }}
                  >
                    <span className="flex items-center gap-2">
                      <FolderOpen size={13} />
                      {f.name}
                    </span>
                    <span className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>{f.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Notes List */}
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {notesToShow.length === 0 && !loading && (
                  <div className="text-center py-12 text-[13px]" style={{ color: "var(--cream-dim)" }}>
                    {searchQuery ? "No results found" : "No notes to display"}
                  </div>
                )}
                {notesToShow.map((note, idx) => (
                  <motion.button
                    key={note.path}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    onClick={() => {
                      setSelectedNote(note);
                      openNote(note.path);
                    }}
                    className="w-full text-left rounded-lg p-3 border transition hover:border-[var(--line)]"
                    style={{
                      background: selectedNote?.path === note.path ? "var(--bg-elev)" : "var(--bg-card)",
                      borderColor: selectedNote?.path === note.path ? "var(--gold)" : "var(--line-soft)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={13} style={{ color: "var(--cream-dim)" }} />
                      <span className="text-[13px] font-medium truncate flex-1" style={{ color: "var(--cream)" }}>
                        {note.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                      <span className="flex items-center gap-1">
                        <FolderOpen size={10} />
                        {note.folder}
                      </span>
                      <span>{formatSize(note.size)}</span>
                      <span>{formatDate(note.mtime)}</span>
                    </div>
                    {note.preview && (
                      <p className="text-[11px] mt-1.5 line-clamp-2" style={{ color: "var(--cream-dim)" }}>
                        {note.preview.slice(0, 120)}...
                      </p>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Note Viewer */}
          <div
            className="rounded-xl border min-h-[600px] overflow-hidden"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
          >
            {selectedNote ? (
              <div className="h-full flex flex-col">
                {/* Note header */}
                <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--line-soft)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedNote.content && (
                      <button
                        onClick={() => setSelectedNote(null)}
                        className="grid place-items-center w-7 h-7 rounded-lg border shrink-0 transition hover:bg-[var(--bg-mid)]"
                        style={{ borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}
                      >
                        <ArrowLeft size={14} />
                      </button>
                    )}
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold truncate" style={{ color: "var(--cream)" }}>
                        {selectedNote.title}
                      </div>
                      <div className="text-[10px] mono flex items-center gap-2" style={{ color: "var(--cream-dim)" }}>
                        <span className="flex items-center gap-1">
                          <ChevronRight size={10} />
                          {selectedNote.path}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => importNotes([selectedNote.path])}
                      disabled={importing}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                      style={{ background: "var(--bg-elev)", color: "var(--gold)", border: "1px solid var(--line)" }}
                    >
                      <Download size={12} />
                      Import
                    </button>
                  </div>
                </div>

                {/* Note metadata bar */}
                <div className="flex items-center gap-4 px-5 py-2 border-b text-[10px] mono" style={{ borderColor: "var(--line-soft)", background: "var(--bg-mid)" }}>
                  <span className="flex items-center gap-1" style={{ color: "var(--cream-dim)" }}>
                    <FolderOpen size={11} />
                    {selectedNote.folder}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: "var(--cream-dim)" }}>
                    <Hash size={11} />
                    {formatSize(selectedNote.size)}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: "var(--cream-dim)" }}>
                    <Clock size={11} />
                    Modified {formatDate(selectedNote.mtime)}
                  </span>
                  <span style={{ color: "var(--cream-dim)" }}>
                    Created {formatDate(selectedNote.ctime)}
                  </span>
                </div>

                {/* Note content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {loadingNote ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw size={24} className="animate-spin" style={{ color: "var(--cream-dim)" }} />
                    </div>
                  ) : selectedNote.content ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.content) }}
                      className="text-[14px] leading-relaxed"
                      style={{ color: "var(--cream-soft)" }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <BookOpen size={32} style={{ color: "var(--cream-dim)" }} />
                      <p className="text-[13px] mt-3" style={{ color: "var(--cream-dim)" }}>Loading note content...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="grid place-items-center w-16 h-16 rounded-2xl border mb-4"
                  style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}
                >
                  <BookOpen size={28} style={{ color: "var(--gold)" }} />
                </motion.div>
                <h3 className="text-[16px] font-semibold mb-1" style={{ color: "var(--cream)" }}>
                  Select a note to view
                </h3>
                <p className="text-[13px] max-w-xs" style={{ color: "var(--cream-dim)" }}>
                  Browse recent notes, search the vault, or pick a folder to explore.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Folder Overview */}
      {stats && stats.folders.length > 0 && (
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
              <span style={{ color: "var(--gold)" }}>§</span> Vault Structure
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.folders.slice(0, 16).map((folder) => (
              <button
                key={folder.name}
                onClick={() => {
                  setActiveTab("folders");
                  setActiveFolder(folder.name);
                }}
                className="rounded-lg p-3 border text-left transition hover:border-[var(--line)]"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FolderOpen size={14} style={{ color: "var(--gold)" }} />
                  <span className="text-[12px] font-medium truncate" style={{ color: "var(--cream)" }}>
                    {folder.name}
                  </span>
                </div>
                <div className="text-[10px] mono flex items-center gap-3" style={{ color: "var(--cream-dim)" }}>
                  <span>{folder.count} notes</span>
                  <span>{formatSize(folder.size)}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Top Recent (from stats) */}
      {stats && stats.topNotes.length > 0 && (
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
              <span style={{ color: "var(--gold)" }}>§</span> Recently Modified
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
          </div>
          <div className="space-y-1.5">
            {stats.topNotes.slice(0, 8).map((note) => (
              <button
                key={note.path}
                onClick={() => {
                  setSelectedNote({ ...note, folder: note.path.split("/")[0], size: 0, ctime: note.mtime } as Note);
                  openNote(note.path);
                }}
                className="w-full flex items-center gap-3 rounded-lg p-2.5 border text-left transition hover:border-[var(--line)]"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <FileText size={14} style={{ color: "var(--cream-dim)" }} />
                <span className="text-[13px] font-medium truncate flex-1" style={{ color: "var(--cream)" }}>
                  {note.title}
                </span>
                <span className="text-[10px] mono shrink-0" style={{ color: "var(--cream-dim)" }}>
                  {formatDate(note.mtime)}
                </span>
              </button>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}