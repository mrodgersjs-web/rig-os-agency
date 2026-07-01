"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Send, RefreshCw, MessageSquare, Library, Headphones,
  Video as VideoIcon, Image as ImageIcon, Brain, FileText, Layers, FileQuestion,
  Sparkles, AlertCircle, Download, Clock, ExternalLink, X, ChevronRight,
} from "lucide-react";
import VoiceButton from "./VoiceButton";

type Tab = "library" | "chat" | "studio" | "assets";
// The 9 artifact types the new MCP actually supports (matches studio_create + download_artifact).
type ArtifactType =
  | "audio" | "video" | "infographic" | "slide_deck" | "report"
  | "flashcards" | "quiz" | "data_table" | "mind_map";

interface Notebook {
  id: string;
  title?: string;          // new MCP returns "title", not "name"
  name?: string;           // tolerate old shape too
  description?: string;
  source_count?: number;
  created_at?: string | number;
  updated_at?: string | number;
  url?: string;
  share_url?: string;
}
interface Artifact {
  artifact_id: string;
  type: string;
  title?: string;
  status?: string;
  created_at?: string | number;
  // Per-type URL fields returned by studio_status — usually one will be populated
  audio_url?: string | null;
  video_url?: string | null;
  infographic_url?: string | null;
  slide_deck_url?: string | null;
  report_content?: string | null;
  flashcard_count?: number | null;
  duration_seconds?: number | null;
  custom_instructions?: string | null;
}
interface SavedAsset {
  name: string; path: string; relPath: string;
  bytes: number; mtime: number; notebook: string;
  kind: "audio" | "video" | "image" | "pdf" | "html" | "doc" | "other";
}
interface ChatMsg { role: "user" | "assistant"; text: string; ts: number; }

const STORAGE_PREFIX = "agentic-os-notebooklm-chat-v2:";

const ARTIFACT_TYPES: { value: ArtifactType; label: string; icon: React.ReactNode; colour: string }[] = [
  { value: "audio",       label: "Audio Overview", icon: <Headphones size={14} />,    colour: "#22d3ee" },
  { value: "video",       label: "Video",          icon: <VideoIcon size={14} />,     colour: "#a855f7" },
  { value: "slide_deck",  label: "Slide Deck",     icon: <Layers size={14} />,        colour: "#fde047" },
  { value: "mind_map",    label: "Mind Map",       icon: <Brain size={14} />,         colour: "#10b981" },
  { value: "infographic", label: "Infographic",    icon: <ImageIcon size={14} />,     colour: "#ec4899" },
  { value: "flashcards",  label: "Flashcards",     icon: <Layers size={14} />,        colour: "#fb923c" },
  { value: "quiz",        label: "Quiz",           icon: <FileQuestion size={14} />,  colour: "#f87171" },
  { value: "data_table",  label: "Data Table",     icon: <FileText size={14} />,      colour: "#60a5fa" },
  { value: "report",      label: "Report",         icon: <FileText size={14} />,      colour: "#fb7185" },
];

const ACCENT = "#fde047";

function fmtAgo(input: string | number | undefined): string {
  if (!input) return "—";
  const ts = typeof input === "number" ? input : Date.parse(input);
  if (!Number.isFinite(ts)) return "—";
  const d = Date.now() - (ts > 1e12 ? ts : ts * 1000);
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d/60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d/3_600_000)}h ago`;
  return `${Math.floor(d/86_400_000)}d ago`;
}
function notebookLabel(n: Notebook): string { return n.title || n.name || n.id; }

export default function NotebookView() {
  const [tab, setTab] = useState<Tab>("library");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Chat
  const [question, setQuestion] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [thinking, setThinking] = useState(false);

  // Studio
  const [studioType, setStudioType] = useState<ArtifactType>("audio");
  const [studioPrompt, setStudioPrompt] = useState("");
  const [studioBusy, setStudioBusy] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  // Saved assets (downloaded artifacts in the vault)
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);

  const activeNotebook = notebooks.find((n) => n.id === activeId) ?? null;

  const refreshNotebooks = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch("/api/notebooklm/notebooks", { cache: "no-store" });
      const j = await r.json();
      const list: Notebook[] = j?.notebooks ?? j?.data?.notebooks ?? (Array.isArray(j) ? j : []);
      setNotebooks(list);
    } catch (e) { setErr(String(e)); }
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const r = await fetch("/api/notebooklm/health", { cache: "no-store" });
      const j = await r.json();
      setAuthed(!!j?.data?.authenticated);
      setAuthErr(j?.data?.error ?? null);
    } catch (e) { setAuthed(false); setAuthErr(String(e)); }
  }, []);

  const refreshAssets = useCallback(async () => {
    try {
      const r = await fetch("/api/notebooklm/library", { cache: "no-store" });
      const j = await r.json();
      setSavedAssets(j?.savedAssets ?? []);
    } catch { /* ignore */ }
  }, []);

  const refreshArtifacts = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/notebooklm/studio?notebook_id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const j = await r.json();
      // studio_status returns: { status, notebook_id, summary: {total, completed, in_progress}, artifacts: [...] }
      const list: Artifact[] = j?.artifacts ?? [];
      setArtifacts(Array.isArray(list) ? list : []);
    } catch { setArtifacts([]); }
  }, []);

  useEffect(() => { refreshHealth(); refreshNotebooks(); refreshAssets(); }, [refreshHealth, refreshNotebooks, refreshAssets]);
  useEffect(() => {
    if (activeId) refreshArtifacts(activeId);
  }, [activeId, refreshArtifacts]);

  // Chat history persistence per notebook
  useEffect(() => {
    if (!activeId) { setMsgs([]); return; }
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + activeId);
      setMsgs(raw ? JSON.parse(raw) : []);
    } catch { setMsgs([]); }
  }, [activeId]);
  useEffect(() => {
    if (!activeId) return;
    try { localStorage.setItem(STORAGE_PREFIX + activeId, JSON.stringify(msgs.slice(-50))); } catch {}
  }, [msgs, activeId]);

  async function ask() {
    const q = question.trim();
    if (!q || !activeId || thinking) return;
    setMsgs((m) => [...m, { role: "user", text: q, ts: Date.now() }]);
    setQuestion(""); setThinking(true);
    try {
      const r = await fetch("/api/notebooklm/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, notebook_id: activeId, notebook_name: activeNotebook ? notebookLabel(activeNotebook) : undefined }),
      });
      const j = await r.json();
      const ans = j?.answer ?? j?.response ?? j?.error ?? "(no answer)";
      setMsgs((m) => [...m, { role: "assistant", text: String(ans), ts: Date.now() }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: `[error] ${String(e)}`, ts: Date.now() }]);
    }
    setThinking(false);
  }

  async function createArtifact() {
    if (!activeId || studioBusy) return;
    setStudioBusy(true); setErr(null);
    try {
      const r = await fetch("/api/notebooklm/studio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notebook_id: activeId,
          artifact_type: studioType,
          custom_prompt: studioPrompt.trim() || undefined,
        }),
      });
      const j = await r.json();
      if (j?.error) setErr(String(j.error));
      else { setStudioPrompt(""); await refreshArtifacts(activeId); }
    } catch (e) { setErr(String(e)); }
    setStudioBusy(false);
  }

  async function downloadArtifact(artifact: Artifact) {
    if (!activeId || !activeNotebook) return;
    setBusy(`dl-${artifact.artifact_id}`);
    setErr(null);
    try {
      const r = await fetch("/api/notebooklm/artifact/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notebook_id: activeId,
          artifact_id: artifact.artifact_id,
          artifact_type: artifact.type,
          title: artifact.title,
          notebook_name: notebookLabel(activeNotebook),
        }),
      });
      const j = await r.json();
      if (j?.error) setErr(String(j.error));
      else await refreshAssets();
    } catch (e) { setErr(String(e)); }
    setBusy(null);
  }

  async function createNotebook() {
    const title = prompt("Notebook title:");
    if (!title) return;
    setBusy("new-nb"); setErr(null);
    try {
      const r = await fetch("/api/notebooklm/notebooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const j = await r.json();
      if (j?.error) setErr(String(j.error));
      else await refreshNotebooks();
    } catch (e) { setErr(String(e)); }
    setBusy(null);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "library", label: "Library",  icon: <Library size={14} /> },
    { key: "chat",    label: "Chat",     icon: <MessageSquare size={14} /> },
    { key: "studio",  label: "Studio",   icon: <Sparkles size={14} /> },
    { key: "assets",  label: "Assets",   icon: <Download size={14} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header strip with auth status */}
      <div className="panel p-3 flex items-center gap-3 flex-wrap">
        <BookOpen size={16} style={{ color: ACCENT }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium" style={{ color: ACCENT }}>NotebookLM</div>
          <div className="text-[11px] text-[var(--fg-dim)]">
            {authed === null && "checking…"}
            {authed === false && <>⚠ Not authenticated — run <code>nlm login</code> in a terminal{authErr && <> · <span className="text-rose-300">{authErr.slice(0,140)}</span></>}</>}
            {authed === true && <>✓ Authenticated · {notebooks.length} notebook{notebooks.length === 1 ? "" : "s"} · {savedAssets.length} saved asset{savedAssets.length === 1 ? "" : "s"}{activeNotebook && <> · active: <span className="text-[var(--fg)]">{notebookLabel(activeNotebook)}</span></>}</>}
          </div>
        </div>
        <button
          onClick={() => { refreshHealth(); refreshNotebooks(); refreshAssets(); if (activeId) refreshArtifacts(activeId); }}
          className="px-2.5 h-[30px] rounded-lg border border-[var(--panel-border)] hover:border-[var(--panel-border-hot)] text-[11px] text-[var(--fg-dim)] hover:text-[var(--fg)] flex items-center gap-1 transition"
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {err && (
        <div className="panel p-3 border-rose-400/40 text-rose-300 text-[12.5px] flex items-start gap-2">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <pre className="font-[var(--font-geist-mono)] whitespace-pre-wrap break-words flex-1">{err}</pre>
          <button onClick={() => setErr(null)} className="text-rose-300 hover:text-rose-100"><X size={14}/></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12.5px] transition"
              style={{
                background: active ? `${ACCENT}22` : "transparent",
                borderColor: active ? ACCENT : "var(--panel-border)",
                color: active ? "var(--fg)" : "var(--fg-dim)",
              }}>
              {t.icon}{t.label}
            </button>
          );
        })}
      </div>

      {tab === "library" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={createNotebook}
              className="px-3 h-[34px] rounded-lg flex items-center gap-1.5 text-[12px] transition"
              style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, color: ACCENT }}
            >
              <Plus size={12} /> New notebook
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notebooks.length === 0 && (
              <div className="panel p-6 text-center text-[var(--fg-dim)] text-sm md:col-span-2 lg:col-span-3">
                {authed === false ? "Authenticate first: run `nlm login` in a terminal." : "No notebooks yet. Click \"New notebook\" or create one at notebooklm.google.com — they sync automatically."}
              </div>
            )}
            {notebooks.map((n) => {
              const active = n.id === activeId;
              return (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setActiveId(n.id)}
                  className="panel panel-hover p-4 text-left relative overflow-hidden transition"
                  style={{ borderColor: active ? ACCENT : "var(--panel-border)", background: active ? `${ACCENT}10` : undefined }}
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <BookOpen size={14} style={{ color: ACCENT }} className="shrink-0 mt-0.5" />
                    <div className="text-[14px] font-medium text-[var(--fg)] line-clamp-2 flex-1">{notebookLabel(n)}</div>
                    {active && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ background: `${ACCENT}22`, color: ACCENT }}>active</span>}
                  </div>
                  {n.description && <div className="text-[12px] text-[var(--fg-dim)] leading-snug line-clamp-3 mb-2">{n.description}</div>}
                  <div className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)] font-[var(--font-geist-mono)] truncate">
                    {n.id}{typeof n.source_count === "number" && ` · ${n.source_count} sources`}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {tab === "chat" && (
        <div className="panel flex flex-col" style={{ height: "min(70vh, 800px)" }}>
          {!activeNotebook ? (
            <div className="flex-1 grid place-items-center text-center p-8">
              <div>
                <BookOpen size={28} className="mx-auto mb-3" style={{ color: ACCENT }} />
                <div className="text-sm font-medium">Pick a notebook</div>
                <div className="mt-1 text-[12px] text-[var(--fg-dim)]">Go to Library and click one.</div>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-[var(--panel-border)]">
                <div className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)]">Notebook</div>
                <div className="text-sm font-medium truncate" style={{ color: ACCENT }}>{notebookLabel(activeNotebook)}</div>
              </div>
              <div className="scroll flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
                <AnimatePresence initial={false}>
                  {msgs.length === 0 && (
                    <div className="text-[var(--fg-dim)] text-sm text-center py-10">Ask anything about this notebook — answers come from NotebookLM grounded on its sources.</div>
                  )}
                  {msgs.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className="max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap"
                        style={m.role === "user"
                          ? { background: "rgba(255,255,255,0.05)", border: "1px solid var(--panel-border)", color: "var(--fg)" }
                          : { background: `linear-gradient(135deg, ${ACCENT}10, transparent 60%)`, border: `1px solid ${ACCENT}40`, color: "var(--fg)" }}>
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                  {thinking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                      <div className="rounded-2xl px-4 py-2.5 text-[13.5px] border" style={{ background: `${ACCENT}10`, borderColor: `${ACCENT}40` }}>
                        <span className="inline-flex">
                          <span className="tick live" style={{ color: ACCENT }} />
                          <span className="tick live" style={{ color: ACCENT, animationDelay: ".15s" }} />
                          <span className="tick live" style={{ color: ACCENT, animationDelay: ".3s" }} />
                        </span>
                        <span className="ml-2 text-[var(--fg-dim)]">NotebookLM thinking…</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="border-t border-[var(--panel-border)] p-3">
                <div className="flex items-end gap-2 rounded-2xl border border-[var(--panel-border)] bg-[rgba(0,0,0,0.25)] p-2 focus-within:border-[var(--panel-border-hot)]">
                  <VoiceButton onTranscript={(t, o) => { if (o.final) setQuestion((v) => (v ? v + " " : "") + t); }} size={38} />
                  <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(); } }}
                    rows={2} placeholder="Ask anything about this notebook… (⌘+Enter)"
                    className="flex-1 bg-transparent outline-none resize-none px-2 py-2 text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-dimmer)]" />
                  <button onClick={ask} disabled={!question.trim() || thinking}
                    className="px-3 h-[38px] rounded-lg flex items-center gap-1.5 text-sm transition disabled:opacity-40"
                    style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, color: ACCENT }}>
                    <Send size={14} /> Ask
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "studio" && (
        <div className="space-y-5">
          {!activeNotebook ? (
            <div className="panel p-6 text-center text-[var(--fg-dim)] text-sm">Pick a notebook from the Library tab first.</div>
          ) : (
            <>
              {/* Create artifact */}
              <div className="panel p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} style={{ color: ACCENT }} />
                  <h3 className="text-sm font-medium">Generate from <span className="text-[var(--fg-dim)] font-normal">{notebookLabel(activeNotebook)}</span></h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 mb-3">
                  {ARTIFACT_TYPES.map((t) => {
                    const active = studioType === t.value;
                    return (
                      <button key={t.value} onClick={() => setStudioType(t.value)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11.5px] border transition truncate"
                        style={{
                          background: active ? `${t.colour}22` : "transparent",
                          borderColor: active ? t.colour : "var(--panel-border)",
                          color: active ? "var(--fg)" : "var(--fg-dim)",
                        }}>
                        {t.icon}<span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-end gap-2">
                  <input value={studioPrompt} onChange={(e) => setStudioPrompt(e.target.value)}
                    placeholder="Optional focus prompt (e.g. 'beginner-friendly', 'just the comparison angle')…"
                    className="flex-1 bg-[rgba(0,0,0,0.25)] border border-[var(--panel-border)] rounded-lg px-3 h-[38px] text-sm outline-none focus:border-[var(--panel-border-hot)] text-[var(--fg)]" />
                  <button onClick={createArtifact} disabled={studioBusy}
                    className="px-4 h-[38px] rounded-lg flex items-center gap-1.5 text-sm transition disabled:opacity-40"
                    style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}66`, color: ACCENT }}>
                    {studioBusy ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {studioBusy ? "Generating…" : "Generate"}
                  </button>
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)]">
                  Audio: 2–10 min · Video: 5–15 min · Slide deck: 1–3 min · Others: 30 s–2 min · Returns immediately, generation continues in NotebookLM.
                </div>
              </div>

              {/* Existing artifacts in this notebook */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)] flex items-center gap-1.5">
                    <Library size={11} /> Artifacts in {notebookLabel(activeNotebook)} ({artifacts.length})
                  </div>
                  <button onClick={() => refreshArtifacts(activeId!)} className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)] hover:text-[var(--fg-dim)]">
                    <RefreshCw size={10} className="inline mr-1" />Refresh
                  </button>
                </div>
                {artifacts.length === 0 ? (
                  <div className="panel p-6 text-center text-[var(--fg-dim)] text-sm">No artifacts yet. Generate one above, or NotebookLM-side ones will appear after refresh.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {artifacts.map((a) => {
                      const meta = ARTIFACT_TYPES.find((t) => t.value === a.type) ?? { value: a.type as ArtifactType, label: a.type || "artifact", icon: <FileText size={14} />, colour: ACCENT };
                      const ready = a.status === "ready" || a.status === "complete" || a.status === "completed";
                      const ntblmUrl = a.audio_url || a.video_url || a.infographic_url || a.slide_deck_url;
                      return (
                        <div key={a.artifact_id} className="panel p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span style={{ color: meta.colour }}>{meta.icon}</span>
                              <span className="text-[12px] font-medium truncate">{a.title || meta.label}</span>
                            </div>
                            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: ready ? "rgba(134,239,172,0.12)" : `${meta.colour}14`, color: ready ? "#86efac" : meta.colour }}>
                              {a.status || "—"}
                            </span>
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)] font-[var(--font-geist-mono)] truncate mb-2">{a.artifact_id.slice(0, 18)}…</div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => downloadArtifact(a)} disabled={busy === `dl-${a.artifact_id}` || !ready}
                              className="px-2 py-1 rounded-md text-[11px] border flex items-center gap-1 transition disabled:opacity-40"
                              style={{ background: `${meta.colour}14`, borderColor: `${meta.colour}55`, color: meta.colour }}>
                              {busy === `dl-${a.artifact_id}` ? <RefreshCw size={10} className="animate-spin" /> : <Download size={10} />} Pull
                            </button>
                            {ntblmUrl && (
                              <a href={ntblmUrl} target="_blank" rel="noopener noreferrer"
                                className="px-2 py-1 rounded-md text-[11px] border border-[var(--panel-border)] text-[var(--fg-dim)] hover:text-[var(--fg)] flex items-center gap-1 transition">
                                <ExternalLink size={10} /> View
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "assets" && (
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)] flex items-center gap-1.5">
            <Download size={11} /> Downloaded from NotebookLM ({savedAssets.length}) · stored in <code>Agentic OS/Notebooks/_assets/</code>
          </div>
          {savedAssets.length === 0 ? (
            <div className="panel p-6 text-center text-[var(--fg-dim)] text-sm">Nothing downloaded yet. Go to a notebook&apos;s Studio tab and click <strong>Pull</strong> on any artifact.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedAssets.map((a) => (
                <div key={a.path} className="panel p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-[var(--fg)] truncate">{a.notebook}</div>
                      <div className="text-[10px] text-[var(--fg-dimmer)] font-[var(--font-geist-mono)] truncate">
                        {a.name} · {(a.bytes / 1024 / 1024).toFixed(1)}MB · {new Date(a.mtime).toLocaleString("en-GB", { hour12: false })}
                      </div>
                    </div>
                    <a href={`/api/notebooklm/artifact/download?path=${encodeURIComponent(a.path)}`} download={a.name}
                      className="text-[var(--fg-dim)] hover:text-[var(--fg)] flex items-center gap-1 text-[10px] uppercase tracking-widest">
                      <Download size={11} /> Save
                    </a>
                  </div>
                  <AssetPreview asset={a} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssetPreview({ asset }: { asset: SavedAsset }) {
  const src = `/api/notebooklm/artifact/download?path=${encodeURIComponent(asset.path)}`;
  if (asset.kind === "audio") return <audio src={src} controls preload="metadata" className="w-full" />;
  if (asset.kind === "video") return <video src={src} controls preload="metadata" className="w-full max-h-[300px] rounded-lg bg-black" />;
  if (asset.kind === "image") {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={asset.name} className="w-full max-h-[260px] object-cover rounded-lg" />
      </a>
    );
  }
  if (asset.kind === "pdf") return <iframe src={src} className="w-full h-[300px] rounded-lg bg-black" title={asset.name} />;
  if (asset.kind === "html") return <iframe src={src} className="w-full h-[300px] rounded-lg bg-white" title={asset.name} />;
  return (
    <a href={src} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--panel-border)] text-[var(--fg-dim)] hover:text-[var(--fg)] text-[12px] transition">
      <ChevronRight size={12} /> Open externally
    </a>
  );
}
