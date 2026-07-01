"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Hammer, Loader2, RotateCw, ExternalLink, Sparkles, History, Square, X, Play } from "lucide-react";

const FCC = "#10b981";                 // Free Claude Code green
const PROJECT = "free-claude-code";     // shared with the gallery — spoken builds + the existing creations live here
const HISTORY_KEY = "agentic-os/speak-build/history/v1";

// ── Web Speech API (no first-class TS types) ──────────────────────────────────
type SR = {
  start: () => void; stop: () => void; abort: () => void;
  continuous: boolean; interimResults: boolean; lang: string; maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onstart: (() => void) | null; onend: (() => void) | null;
};
function getSR(): { new (): SR } | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: { new (): SR }; webkitSpeechRecognition?: { new (): SR } };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface Build { id: number; prompt: string; file: string | null; ts: number; seed?: boolean; }
interface WsFile { relPath: string; mtime: number; kind: string; name: string; }

const EXAMPLES = [
  "build me a neon galaxy game",
  "make a rainbow particle fountain I can click",
  "create a relaxing rain animation on a dark window",
  "build a synthwave grid that scrolls forever",
];

function previewUrl(file: string): string {
  return `/api/freeclaude/preview/${encodeURIComponent(PROJECT)}/${file.split("/").map(encodeURIComponent).join("/")}`;
}

export default function SpeakBuild() {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [building, setBuilding] = useState(false);
  const [log, setLog] = useState("");
  const [status, setStatus] = useState("Tap the mic and say what to build — or type it.");
  const [builds, setBuilds] = useState<Build[]>([]);
  const [files, setFiles] = useState<WsFile[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const recRef = useRef<SR | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const hydrated = useRef(false);  // guard: don't persist until history is loaded

  // ── load past builds (server-persisted) + gallery ──
  useEffect(() => {
    (async () => {
      let loaded: Build[] = [];
      try {
        // Source of truth: the server store. It self-heals from real files, so
        // the existing creations + every past build show up — and it survives
        // browser clears / new machines (localStorage did not).
        const r = await fetch(`/api/freeclaude/builds?project=${PROJECT}`, { cache: "no-store" });
        const j = await r.json();
        if (Array.isArray(j.builds)) loaded = j.builds;
      } catch { /* offline — fall back to the local cache below */ }
      if (loaded.length === 0) {
        try { const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); if (Array.isArray(h)) loaded = h; } catch {}
      }
      setBuilds(loaded);
      idRef.current = loaded.reduce((m, b) => Math.max(m, b.id), 0);
      hydrated.current = true;
    })();
    // Load the gallery list ONLY — do NOT auto-run a preview. These free-model
    // canvas apps animate at 60fps forever; auto-playing one on open pins the CPU.
    // The user clicks a gallery item (or builds one) to start a single preview.
    refreshFiles();
  }, []);
  useEffect(() => { if (!hydrated.current) return; try { localStorage.setItem(HISTORY_KEY, JSON.stringify(builds.slice(0, 40))); } catch {} }, [builds]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  const htmlFiles = files.filter((f) => f.relPath.endsWith(".html")).sort((a, b) => b.mtime - a.mtime);

  async function refreshFiles(): Promise<WsFile[]> {
    try {
      const r = await fetch(`/api/freeclaude/workspace?project=${PROJECT}`, { cache: "no-store" });
      const j = await r.json();
      const fs: WsFile[] = j.files ?? [];
      setFiles(fs);
      return fs;
    } catch { return []; }
  }

  // ── the build pipeline: prompt → LOCAL model (direct, no agent loop) → file → preview ──
  const build = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || building) return;
    setBuilding(true);
    setLog("");
    setStatus("Building it on your Mac…");

    const ctrl = new AbortController(); ctrlRef.current = ctrl;
    let acc = "", builtFile: string | null = null, errMsg: string | null = null;
    try {
      const r = await fetch("/api/freeclaude/build", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: text, project: PROJECT }), signal: ctrl.signal,
      });
      if (r.body) {
        const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "";
        while (true) {
          const { value, done } = await reader.read(); if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const j = JSON.parse(line);
              if (j.t === "d") { acc += j.c; setLog(acc); }
              else if (j.t === "done") { builtFile = j.file; }
              else if (j.t === "error") { errMsg = j.m; }
            } catch {}
          }
        }
      }
    } catch (e) { errMsg = String(e); }

    await refreshFiles();
    const id = ++idRef.current;
    setBuilds((b) => [{ id, prompt: text, file: builtFile, ts: Date.now() }, ...b.filter((x) => !builtFile || x.file !== builtFile)]);
    // Persist server-side so the history survives forever — the whole point.
    fetch("/api/freeclaude/builds", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ project: PROJECT, prompt: text, file: builtFile }),
    }).catch(() => {});
    if (builtFile) { setCurrent(builtFile); setIframeKey((k) => k + 1); setStatus(`Built ${builtFile} — running on the right →`); }
    else setStatus(errMsg ? `Hmm — ${errMsg}` : "No file produced — try rephrasing.");
    setBuilding(false);
  }, [building]);

  function stop() { ctrlRef.current?.abort(); setBuilding(false); setStatus("Stopped."); }

  // ── voice ──
  function toggleMic() {
    if (building) return;
    if (listening) { try { recRef.current?.stop(); } catch {} setListening(false); return; }
    const C = getSR();
    if (!C) { setStatus("Voice needs Chrome or Safari — type your idea instead."); return; }
    let rec = recRef.current;
    if (!rec) {
      rec = new C();
      rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
      rec.onstart = () => { setListening(true); setStatus("Listening… say what to build."); };
      rec.onerror = (e) => { setListening(false); setStatus(e?.error === "not-allowed" ? "Mic blocked — allow Microphone in the address bar." : "Didn't catch that — try again."); };
      rec.onend = () => setListening(false);
      rec.onresult = (e) => { const t = e?.results?.[0]?.[0]?.transcript || ""; if (t.trim()) { setInput(t); setStatus(`Heard: "${t}" — building…`); build(t); } };
      recRef.current = rec;
    }
    try { rec.start(); } catch {}
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,42%)_1fr] gap-4 h-[calc(100vh-200px)] min-h-[560px]">

      {/* ── LEFT: speak + build + history ─────────────────────────────── */}
      <div className="panel p-5 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[20px] font-semibold tracking-tight text-[var(--fg)]">Agent Factory</h2>
          <span className="text-[10.5px] px-2 py-0.5 rounded-full border" style={{ borderColor: `${FCC}55`, color: FCC, background: `${FCC}14` }}>$0 · runs on your Mac</span>
        </div>
        <p className="text-[12px] text-[var(--fg-dim)] mb-4">Say it — your agent builds it, on-device. It runs on the right →</p>

        {/* mic + input */}
        <div className="flex flex-col items-center gap-3 mb-3">
          <motion.button onClick={toggleMic} whileTap={{ scale: 0.94 }} disabled={building}
            className="relative grid place-items-center w-20 h-20 rounded-full transition disabled:opacity-40"
            style={{ background: listening ? FCC : `${FCC}1e`, color: listening ? "#06251f" : FCC, border: `1px solid ${FCC}55` }}>
            {listening ? <MicOff size={30} /> : <Mic size={30} />}
            {listening && <span className="absolute inset-0 rounded-full animate-ping" style={{ border: `2px solid ${FCC}` }} />}
          </motion.button>
          <div className="text-[12px] text-[var(--fg-dim)] text-center min-h-[18px]">{status}</div>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") build(input); }}
            placeholder="…or type: build me a neon galaxy game"
            className="flex-1 resize-none bg-[var(--bg-mid)] border border-[var(--panel-border)] rounded-xl px-3 py-2 text-[13.5px] text-[var(--fg)] placeholder:text-[var(--fg-dimmer)] focus:outline-none focus:border-[#10b981]" />
          {building
            ? <button onClick={stop} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold bg-rose-500/20 border border-rose-400/40 text-rose-300"><Square size={14} /> Stop</button>
            : <button onClick={() => build(input)} disabled={!input.trim()} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-40" style={{ background: FCC, color: "#06251f" }}><Hammer size={15} /> Build</button>}
        </div>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setInput(ex)} disabled={building}
              className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--panel-border)] text-[var(--fg-dim)] hover:border-[#10b981] hover:text-[var(--fg)] transition disabled:opacity-40">{ex}</button>
          ))}
        </div>

        {/* live build log */}
        {(building || log) && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)] mb-1">
              {building ? <Loader2 size={11} className="animate-spin" style={{ color: FCC }} /> : <Sparkles size={11} style={{ color: FCC }} />} live build
            </div>
            <div ref={logRef} className="rounded-lg border border-[var(--panel-border)] bg-[rgba(0,0,0,0.4)] p-2.5 text-[11px] font-[var(--font-geist-mono)] text-[var(--fg-dim)] whitespace-pre-wrap overflow-y-auto max-h-[150px] leading-relaxed">
              {log || "starting…"}
            </div>
          </div>
        )}

        {/* history */}
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)] mb-1.5 mt-auto pt-2">
          <History size={11} /> what you&apos;ve built ({builds.length})
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
          {builds.length === 0 && <div className="text-[12px] text-[var(--fg-dimmer)] py-3">Nothing yet — say your first idea above.</div>}
          {builds.map((b) => (
            <button key={b.id} onClick={() => { if (b.file) { setCurrent(b.file); setIframeKey((k) => k + 1); } }}
              className={`w-full text-left rounded-lg border px-3 py-2 transition ${b.file && current === b.file ? "border-[#10b981] bg-[rgba(16,185,129,0.08)]" : "border-[var(--panel-border)] hover:border-[#10b981]/60"}`}>
              <div className="flex items-center gap-1.5">
                <div className="text-[12.5px] text-[var(--fg)] truncate flex-1">{b.prompt}</div>
                {b.seed && <span className="shrink-0 text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ color: FCC, background: `${FCC}1a`, border: `1px solid ${FCC}44` }}>example</span>}
              </div>
              <div className="text-[10.5px] text-[var(--fg-dimmer)] font-[var(--font-geist-mono)] truncate">{b.file ?? "(no file)"}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT: live preview + gallery ─────────────────────────────── */}
      <div className="panel p-0 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--panel-border)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full" style={{ background: current ? FCC : "var(--fg-dimmer)" }} />
            <span className="text-[12.5px] text-[var(--fg)] font-[var(--font-geist-mono)] truncate">{current ?? "no preview yet"}</span>
          </div>
          {current && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setIframeKey((k) => k + 1)} title="Reload" className="p-1.5 rounded-lg hover:bg-[var(--bg-mid)] text-[var(--fg-dim)]"><RotateCw size={14} /></button>
              <a href={previewUrl(current)} target="_blank" rel="noopener noreferrer" title="Open in new tab" className="p-1.5 rounded-lg hover:bg-[var(--bg-mid)] text-[var(--fg-dim)]"><ExternalLink size={14} /></a>
              <button onClick={() => setCurrent(null)} title="Stop preview (frees your CPU)" className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-300/80"><X size={15} /></button>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 grid place-items-center bg-black/40 relative">
          {current ? (
            <iframe key={iframeKey} src={previewUrl(current)} title="preview" className="w-full h-full border-0" sandbox="allow-scripts allow-pointer-lock allow-same-origin" />
          ) : (
            <div className="text-center text-[var(--fg-dim)] text-[13px] px-6 max-w-[360px]">
              <Hammer size={26} className="mx-auto mb-2 opacity-50" style={{ color: FCC }} />
              Say or type an idea on the left — it builds here, live, for $0.
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px] text-[var(--fg-dimmer)]">
                <Play size={13} style={{ color: FCC }} /> or tap a build in the gallery below to play it
              </div>
              <div className="text-[11px] text-[var(--fg-dimmer)] mt-2">Previews stay paused until you start one — keeps your Mac cool.</div>
            </div>
          )}
          <AnimatePresence>
            {building && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 text-[var(--fg)]">
                  <Loader2 size={28} className="animate-spin" style={{ color: FCC }} />
                  <div className="text-[13px]">building it with a free model…</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* gallery strip */}
        {htmlFiles.length > 0 && (
          <div className="shrink-0 border-t border-[var(--panel-border)] px-3 py-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)] shrink-0 pr-1">gallery</span>
            {htmlFiles.map((f) => (
              <button key={f.relPath} onClick={() => { setCurrent(f.relPath); setIframeKey((k) => k + 1); }}
                className={`shrink-0 text-[11px] px-2.5 py-1.5 rounded-lg border font-[var(--font-geist-mono)] transition ${current === f.relPath ? "border-[#10b981] text-[var(--fg)] bg-[rgba(16,185,129,0.1)]" : "border-[var(--panel-border)] text-[var(--fg-dim)] hover:border-[#10b981]/60"}`}>
                {f.relPath.replace(/\.html$/, "")}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
