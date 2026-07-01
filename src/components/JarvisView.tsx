"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Zap, Cpu, Radio, Maximize2, X } from "lucide-react";

const CYAN = "#22d3ee";
const TEAL = "#34d399";
const AMBER = "#fbbf24";

interface Turn { id: number; who: "you" | "hermes"; text: string; working?: boolean }
type Phase = "idle" | "listening" | "thinking" | "speaking";

const VOICES = [
  { id: "onwK4e9ZLuTAKqWW03F9", label: "Daniel (JARVIS)" },
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George (warm)" },
];

type SR = {
  start: () => void; stop: () => void; abort: () => void;
  continuous: boolean; interimResults: boolean; lang: string; maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onstart: (() => void) | null; onend: (() => void) | null;
};
function getSR(): { new (): SR } | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: { new (): SR }; webkitSpeechRecognition?: { new (): SR } };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const phaseColor = (p: Phase) => (p === "thinking" ? AMBER : p === "listening" ? CYAN : p === "speaking" ? TEAL : CYAN);

// ── Synthesized sound design (no audio files — pure Web Audio oscillators) ──
function makeSfx() {
  let ctx: AudioContext | null = null;
  const ensure = (): AudioContext | null => {
    try {
      const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      if (!ctx) { const AC = W.AudioContext || W.webkitAudioContext; if (AC) ctx = new AC(); }
      if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});
    } catch { /* */ }
    return ctx;
  };
  const tone = (freq: number, dur: number, type: OscillatorType = "sine", vol = 0.06, to = 0, delay = 0) => {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.04);
  };
  return {
    ensure,
    boot() { tone(70, 1.15, "sawtooth", 0.05, 380); tone(523, 0.5, "sine", 0.04, 880, 0.5); tone(1046, 0.35, "sine", 0.035, 0, 0.95); }, // power-up sweep + ping
    listen() { tone(620, 0.12, "sine", 0.06, 900); },     // blip up
    stop() { tone(780, 0.1, "sine", 0.05, 520); },        // blip down
    wake() { tone(880, 0.1, "sine", 0.06, 1180); tone(1320, 0.14, "sine", 0.05, 0, 0.1); }, // acknowledged
    chime() { tone(660, 0.16, "sine", 0.05); tone(990, 0.34, "sine", 0.05, 0, 0.12); },     // done
  };
}

// Heuristic: is this a "build me something" request → route to the local Agent
// Factory (builds a single HTML app on-device) and preview it in the HUD.
function looksLikeBuild(p: string): boolean {
  const s = p.toLowerCase();
  return /\b(build|make|create|generate|whip up|code(?:\s+me)?|design)\b/.test(s)
    && /\b(game|app|animation|animate|visual|visualis|visualiz|tool|toy|simulator|simulation|demo|website|web ?page|landing|canvas|clock|particles?|fractal|galaxy|snake|pong|tetris|breakout|effect|art|scene|starfield|fireworks|matrix|globe|3d)\b/.test(s);
}
const BUILD_PROJECT = "free-claude-code"; // shared with the Agent Factory gallery
function jPreviewUrl(file: string): string {
  return `/api/freeclaude/preview/${encodeURIComponent(BUILD_PROJECT)}/${file.split("/").map(encodeURIComponent).join("/")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARC REACTOR — a self-contained, audio-reactive canvas core. Reads live phase
// + level from refs so it never forces React re-renders (smooth 60fps).
// ─────────────────────────────────────────────────────────────────────────────
function ArcReactor({ phaseRef, levelRef, size }: { phaseRef: React.MutableRefObject<Phase>; levelRef: React.MutableRefObject<number>; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    cv.width = size * dpr; cv.height = size * dpr; ctx.scale(dpr, dpr);
    let raf = 0; let t = 0;

    const hexToRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

    const draw = () => {
      t += 0.016;
      const phase = phaseRef.current;
      const lvl = levelRef.current;
      const c = phaseColor(phase);
      const [r, g, b] = hexToRgb(c);
      const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
      const cx = size / 2, cy = size / 2;
      const R = size * 0.34;

      ctx.clearRect(0, 0, size, size);

      // ambient radial glow
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
      bg.addColorStop(0, rgba(0.10 + lvl * 0.10));
      bg.addColorStop(0.6, rgba(0.03));
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size);

      // outer tick ring (slow rotate)
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.15);
      ctx.strokeStyle = rgba(0.5); ctx.lineWidth = 1;
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const long = i % 6 === 0;
        const r0 = R * 1.32, r1 = R * (long ? 1.42 : 1.37);
        ctx.globalAlpha = long ? 0.7 : 0.3;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke();
      }
      ctx.restore(); ctx.globalAlpha = 1;

      // two HUD arcs counter-rotating
      ctx.lineWidth = 2;
      for (let k = 0; k < 2; k++) {
        const dir = k === 0 ? 1 : -1;
        const rr = R * (1.12 + k * 0.1);
        const start = t * (0.6 + k * 0.5) * dir;
        ctx.strokeStyle = rgba(0.55 - k * 0.2);
        ctx.beginPath(); ctx.arc(cx, cy, rr, start, start + Math.PI * (0.6 - k * 0.15)); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, rr, start + Math.PI, start + Math.PI + Math.PI * (0.6 - k * 0.15)); ctx.stroke();
      }

      // reactive corona — spikes driven by level
      const spikes = 96;
      ctx.save(); ctx.translate(cx, cy);
      ctx.shadowBlur = 12; ctx.shadowColor = rgba(0.6);
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2;
        const n = 0.5 + 0.5 * Math.sin(i * 1.7 + t * 4);
        const len = R * (0.06 + (lvl * 0.5 + 0.08) * n);
        ctx.strokeStyle = rgba(0.25 + n * 0.5 * (0.3 + lvl));
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R); ctx.lineTo(Math.cos(a) * (R + len), Math.sin(a) * (R + len)); ctx.stroke();
      }
      ctx.restore();

      // core ring
      ctx.shadowBlur = 18; ctx.shadowColor = rgba(0.7);
      ctx.strokeStyle = rgba(0.85); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;

      // pulsing core
      const coreR = R * (0.30 + lvl * 0.22 + 0.03 * Math.sin(t * 3));
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      cg.addColorStop(0, "rgba(255,255,255,0.95)");
      cg.addColorStop(0.4, rgba(0.85));
      cg.addColorStop(1, rgba(0));
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();

      // triangular reactor vanes inside the core ring
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-t * 0.4);
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath(); ctx.moveTo(0, -R * 0.34); ctx.lineTo(R * 0.10, -R * 0.50); ctx.lineTo(-R * 0.10, -R * 0.50); ctx.closePath(); ctx.stroke();
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [size, phaseRef, levelRef]);

  return <canvas ref={ref} style={{ width: size, height: size }} />;
}

// Animated wall backdrop — drifting particle field, perspective floor grid, and a
// slow radar sweep. Pure ambience behind the reactor.
function WallBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0;
    const resize = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    const ps = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() * 0.8 + 0.2, s: Math.random() * 1.6 + 0.3 }));
    let raf = 0, t = 0;
    const draw = () => {
      t += 0.016; ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y -= 0.0007 * p.z; if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        ctx.fillStyle = `rgba(34,211,238,${0.05 + p.z * 0.16})`;
        ctx.beginPath(); ctx.arc(p.x * w, p.y * h, p.s * p.z, 0, Math.PI * 2); ctx.fill();
      }
      // perspective floor grid
      ctx.strokeStyle = "rgba(34,211,238,0.07)"; ctx.lineWidth = 1;
      const horizon = h * 0.66, cxg = w / 2;
      for (let i = 1; i <= 9; i++) { const yy = horizon + (h - horizon) * (i / 9) ** 1.8; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); }
      for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(cxg + i * (w * 0.018), horizon); ctx.lineTo(cxg + i * (w * 0.16), h); ctx.stroke(); }
      // radar sweep behind the reactor
      const cx = w / 2, cy = h * 0.42, R = Math.min(w, h) * 0.55;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.45);
      const g = ctx.createLinearGradient(0, 0, R, 0);
      g.addColorStop(0, "rgba(34,211,238,0.14)"); g.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, -0.28, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// Audio-reactive waveform strip for the bottom of wall mode.
function Waveform({ levelRef }: { levelRef: React.MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0;
    const resize = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener("resize", resize);
    let raf = 0, t = 0;
    const draw = () => {
      t += 0.06; ctx.clearRect(0, 0, w, h);
      const lvl = levelRef.current, cy = h / 2, gap = 7;
      for (let x = 3; x < w; x += gap) {
        const n = 0.5 + 0.5 * Math.sin(x * 0.045 + t) * Math.sin(x * 0.011 - t * 0.6);
        const bh = 3 + (lvl * 0.9 + 0.04) * h * n;
        ctx.fillStyle = `rgba(34,211,238,${0.22 + n * 0.5 * (0.4 + lvl)})`;
        ctx.fillRect(x, cy - bh / 2, 3, bh);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [levelRef]);
  return <canvas ref={ref} className="w-full" style={{ height: 56 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ── "Show me …" — Jarvis paints a live HUD panel when you ask ──
type ShowKind = "gallery" | "chart" | "agents" | "system";
function detectShow(p: string): ShowKind | null {
  const s = p.toLowerCase();
  if (!/\b(show|pull up|display|bring up|open up|let me see|let's see|gimme|give me)\b/.test(s)) return null;
  if (/\b(build|builds|creation|creations|gallery|made|workshop|apps?|games?)\b/.test(s)) return "gallery";
  if (/\b(chart|graph|traffic|stats?|numbers?|analytics|growth|metrics|revenue|sales|progress)\b/.test(s)) return "chart";
  if (/\b(agent|agents|team|company|paperclip|org|roster|employees?|crew)\b/.test(s)) return "agents";
  if (/\b(system|status|diagnostics?|health|vitals|telemetry|readouts?)\b/.test(s)) return "system";
  return null;
}
function showLine(k: ShowKind): string {
  return k === "gallery" ? "Here's everything we've built, sir."
    : k === "chart" ? "Pulling up the numbers, sir."
    : k === "agents" ? "Here's the team, sir."
    : "Running a full diagnostic, sir.";
}

const SHOW_AGENTS = [
  { n: "Claude", c: "#d97757" }, { n: "OpenClaw", c: "#f472b6" }, { n: "Hermes", c: "#60a5fa" },
  { n: "Gemini", c: "#4285F4" }, { n: "Antigravity", c: "#7c3aed" }, { n: "Codex", c: "#22c55e" },
  { n: "Free Claude", c: "#10b981" }, { n: "Jarvis", c: "#22d3ee" },
];
const SHOW_GAUGES = [["Throughput", 87, "TB/s"], ["Latency", 96, "ms⁻¹"], ["Neural load", 41, "%"], ["Signal", 98, "%"]] as const;

function ShowPanel({ kind, onPlay }: { kind: ShowKind; onPlay: (f: string) => void }) {
  const [files, setFiles] = useState<string[]>([]);
  useEffect(() => {
    if (kind !== "gallery") return;
    fetch("/api/freeclaude/workspace?project=free-claude-code", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { files?: { relPath: string }[] }) => setFiles((j.files || []).filter((f) => f.relPath.endsWith(".html")).map((f) => f.relPath)))
      .catch(() => {});
  }, [kind]);

  if (kind === "gallery") return (
    <div className="w-full">
      <div className="text-[10px] font-mono tracking-[0.3em] mb-3" style={{ color: CYAN }}>» BUILD ARCHIVE · {files.length}</div>
      <div className="grid grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        {files.map((f, i) => (
          <motion.button key={f} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => onPlay(f)} className="text-left rounded-lg border p-2.5 transition group"
            style={{ borderColor: `${CYAN}33`, background: "rgba(34,211,238,0.05)" }}>
            <div className="aspect-video rounded grid place-items-center mb-1.5" style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${CYAN}22` }}>
              <span className="text-[18px]" style={{ color: TEAL }}>▶</span>
            </div>
            <div className="text-[10.5px] font-mono truncate" style={{ color: "var(--fg-dim)" }}>{f.replace(/\.html$/, "").replace(/-/g, " ").slice(0, 24)}</div>
          </motion.button>
        ))}
        {files.length === 0 && <div className="col-span-3 text-center text-[12px] py-6" style={{ color: "var(--fg-dimmer)" }}>Loading the archive…</div>}
      </div>
    </div>
  );

  if (kind === "chart") {
    const bars = [38, 52, 47, 68, 74, 89, 100];
    return (
      <div className="w-full text-center">
        <div className="text-[10px] font-mono tracking-[0.3em] mb-1" style={{ color: CYAN }}>» GROWTH · LAST 7</div>
        <div className="text-[40px] font-bold" style={{ color: TEAL, fontFamily: "'Bricolage Grotesque',sans-serif" }}>+342%</div>
        <div className="flex items-end justify-center gap-2.5 h-[160px] mt-3">
          {bars.map((b, i) => (
            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${b}%` }} transition={{ delay: i * 0.08, type: "spring", stiffness: 120, damping: 14 }}
              className="w-7 rounded-t" style={{ background: `linear-gradient(180deg, ${TEAL}, ${CYAN}55)`, boxShadow: `0 0 14px ${CYAN}66` }} />
          ))}
        </div>
        <div className="flex justify-center gap-2.5 mt-2 text-[9px] font-mono" style={{ color: "var(--fg-dimmer)" }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="w-7 text-center">{d}</span>)}
        </div>
      </div>
    );
  }

  if (kind === "agents") return (
    <div className="w-full">
      <div className="text-[10px] font-mono tracking-[0.3em] mb-3" style={{ color: CYAN }}>» AGENT MESH · {SHOW_AGENTS.length} ONLINE</div>
      <div className="grid grid-cols-2 gap-2.5">
        {SHOW_AGENTS.map((a, i) => (
          <motion.div key={a.n} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2.5 rounded-lg border px-3 py-2" style={{ borderColor: `${a.c}40`, background: `${a.c}10` }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: a.c, boxShadow: `0 0 8px ${a.c}` }} />
            <span className="text-[12.5px]" style={{ color: "var(--fg)" }}>{a.n}</span>
            <span className="ml-auto text-[9px] font-mono tracking-widest" style={{ color: a.c }}>ONLINE</span>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return ( // system
    <div className="w-full">
      <div className="text-[10px] font-mono tracking-[0.3em] mb-3" style={{ color: TEAL }}>» ALL SYSTEMS NOMINAL</div>
      <div className="space-y-3.5">
        {SHOW_GAUGES.map(([label, val, unit], i) => (
          <div key={label}>
            <div className="flex justify-between text-[11px] font-mono mb-1" style={{ color: "var(--fg-dim)" }}>
              <span>{label}</span><span style={{ color: CYAN }}>{val}{unit}</span>
            </div>
            <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ delay: i * 0.1, duration: 0.9 }}
                className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${CYAN}, ${TEAL})`, boxShadow: `0 0 10px ${CYAN}88` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JarvisView() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [wake, setWake] = useState(false);
  const [wall, setWall] = useState(false);
  const [status, setStatus] = useState("Tap the core and speak — or enable the wake word.");
  const [voice, setVoice] = useState("onwK4e9ZLuTAKqWW03F9");
  const [mode, setMode] = useState<"auto" | "agent">("auto");
  const [input, setInput] = useState("");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [clock, setClock] = useState("");
  const [phaseState, setPhaseState] = useState<Phase>("idle");
  const [building, setBuilding] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [showKind, setShowKind] = useState<ShowKind | null>(null);
  const [telem, setTelem] = useState({ throughput: 87, latency: 0.4, load: 32, signal: 98 });

  const audioRef = useRef<HTMLAudioElement>(null);
  const recRef = useRef<SR | null>(null);
  const wakeRef = useRef<SR | null>(null);
  const idRef = useRef(0);
  const busyRef = useRef(false);
  const armedRef = useRef(false);
  const wakeOnRef = useRef(false);
  const wakeRunningRef = useRef(false);   // is the wake recognizer currently live?
  const wakeBackoffRef = useRef(0);        // backoff counter to stop error-loops
  const listeningRef = useRef(false);      // push-to-talk active? (so wake won't collide)
  const phaseRef = useRef<Phase>("idle");
  const levelRef = useRef(0.12);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lvlRafRef = useRef(0);
  const sfxRef = useRef<ReturnType<typeof makeSfx> | null>(null);
  if (!sfxRef.current && typeof window !== "undefined") sfxRef.current = makeSfx();
  const briefRef = useRef("");
  const spokenBriefRef = useRef(false);

  const setPhase = useCallback((p: Phase) => { phaseRef.current = p; setPhaseState(p); }, []);

  // Proactive briefing — Jarvis greets + briefs you, spoken once audio is unlocked.
  function speakBrief() {
    if (spokenBriefRef.current || !briefRef.current) return;
    spokenBriefRef.current = true;
    setStatus(briefRef.current);
    speak(briefRef.current);
  }

  useEffect(() => { setSupported(!!getSR()); }, []);

  // live clock (HUD)
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  // drive levelRef: real audio analysis while speaking, procedural otherwise
  useEffect(() => {
    const loop = () => {
      const phase = phaseRef.current;
      let target = 0.12;
      if (phase === "speaking" && analyserRef.current) {
        const an = analyserRef.current; const arr = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(arr); let s = 0; for (const v of arr) s += v;
        target = Math.min(1, (s / arr.length) / 130);
      } else if (phase === "listening") {
        target = 0.45 + 0.22 * Math.abs(Math.sin(performance.now() / 130));
      } else if (phase === "thinking") {
        target = 0.32 + 0.18 * Math.abs(Math.sin(performance.now() / 90));
      }
      levelRef.current += (target - levelRef.current) * 0.18;
      lvlRafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(lvlRafRef.current);
  }, []);

  // ── Boot-up sequence + proactive briefing on mount ──
  useEffect(() => {
    const h = new Date().getHours();
    const greet = h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    briefRef.current = `${greet}, sir. All systems are online — it's ${time}. What shall we create today?`;
    fetch("/api/freeclaude/workspace?project=free-claude-code", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { files?: { relPath: string }[] }) => {
        const n = (j.files || []).filter((f) => f.relPath.endsWith(".html")).length;
        if (n > 0) briefRef.current = `${greet}, sir. All systems online — ${n} builds in your workshop, and it's ${time}. What shall we create today?`;
      })
      .catch(() => {});
    const t = setTimeout(() => { setBooting(false); sfxRef.current?.boot(); setTimeout(speakBrief, 750); }, 2600);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Unlock audio + deliver the briefing on the first user interaction (browser autoplay policy).
  useEffect(() => {
    const unlock = () => { sfxRef.current?.ensure(); speakBrief(); };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function ensureAnalyser() {
    if (analyserRef.current || !audioRef.current) return;
    try {
      const AC = (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext });
      const Ctor = AC.AudioContext || AC.webkitAudioContext!;
      const ctx = new Ctor(); audioCtxRef.current = ctx;
      const src = ctx.createMediaElementSource(audioRef.current);
      const an = ctx.createAnalyser(); an.fftSize = 128; an.smoothingTimeConstant = 0.7;
      src.connect(an); an.connect(ctx.destination); analyserRef.current = an;
    } catch { /* analysis optional */ }
  }

  async function speak(text: string) {
    try {
      const r = await fetch("/api/hermes/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 600), voiceId: voice, provider: "elevenlabs" }),
      });
      const j = await r.json();
      if (j.audio && audioRef.current) {
        ensureAnalyser(); audioCtxRef.current?.resume().catch(() => {});
        audioRef.current.src = j.audio;
        audioRef.current.onended = () => { setPhase("idle"); if (wakeOnRef.current) restartWake(); };
        setPhase("speaking");
        audioRef.current.play().catch(() => {});
      } else { setPhase("idle"); if (wakeOnRef.current) restartWake(); }
    } catch { setPhase("idle"); }
  }

  // BUILD → preview: route a "build me a …" request to the local Agent Factory,
  // then show the running app live in the Jarvis HUD.
  async function buildAndPreview(prompt: string) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setBuilding(true); setPhase("thinking");
    try { wakeRef.current?.stop(); } catch {}
    const youId = ++idRef.current; const hermesId = ++idRef.current;
    setTurns((t) => [{ id: hermesId, who: "hermes", text: "Building it on your Mac, sir…", working: true }, { id: youId, who: "you", text: prompt }, ...t]);
    setStatus("Building it on your Mac, sir…");
    let file: string | null = null, err: string | null = null;
    try {
      const r = await fetch("/api/freeclaude/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, project: BUILD_PROJECT }) });
      if (r.body) {
        const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "";
        while (true) { const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) { if (!line.trim()) continue; try { const j = JSON.parse(line); if (j.t === "done") file = j.file; else if (j.t === "error") err = j.m; } catch {} } }
      }
    } catch (e) { err = String(e); }
    if (file) {
      setPreviewFile(file);
      const reply = "Built and running, sir — have a look.";
      setTurns((t) => t.map((x) => x.id === hermesId ? { ...x, text: reply, working: false } : x));
      setStatus("Built · previewing →"); speak(reply);
    } else {
      const reply = err ? `I hit a snag building that, sir — ${err}` : "I couldn't build that, sir — try rephrasing.";
      setTurns((t) => t.map((x) => x.id === hermesId ? { ...x, text: reply, working: false } : x));
      setStatus(reply); setPhase("idle"); if (wakeOnRef.current) restartWake();
    }
    busyRef.current = false; setBusy(false); setBuilding(false);
  }

  const ask = useCallback(async (prompt: string) => {
    const p = (prompt || "").trim();
    if (!p || busyRef.current) return;
    if (looksLikeBuild(p)) { buildAndPreview(p); return; }
    const sk = detectShow(p);
    if (sk) {
      setShowKind(sk); const line = showLine(sk);
      const yId = ++idRef.current, hId = ++idRef.current;
      setTurns((t) => [{ id: hId, who: "hermes", text: line }, { id: yId, who: "you", text: p }, ...t]);
      setStatus(line); sfxRef.current?.chime(); speak(line); return;
    }
    busyRef.current = true; setBusy(true);
    setPhase("thinking");                       // INSTANT feedback — zero dead air
    try { wakeRef.current?.stop(); } catch {}    // don't let Jarvis hear itself
    const youId = ++idRef.current; const hermesId = ++idRef.current;
    setTurns((t) => [{ id: hermesId, who: "hermes", text: mode === "agent" ? "On it, sir…" : "…", working: true }, { id: youId, who: "you", text: p }, ...t]);
    setStatus(mode === "agent" ? "JARVIS is acting…" : "JARVIS is thinking…");
    try {
      const history = [...turns].reverse().slice(-6).map((x) => ({ role: (x.who === "you" ? "user" : "assistant") as "user" | "assistant", content: x.text }));
      const r = await fetch("/api/hermes/jarvis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: p, mode, history }) });
      const j = await r.json();
      const reply = String(j.text || j.error || "(no response)").trim();
      setTurns((t) => t.map((x) => x.id === hermesId ? { ...x, text: reply, working: false } : x));
      setStatus(j.ms ? `Replied in ${(j.ms / 1000).toFixed(1)}s` : "Done.");
      if (j.ok !== false) speak(reply); else { setPhase("idle"); if (wakeOnRef.current) restartWake(); }
    } catch (e) {
      setTurns((t) => t.map((x) => x.id === hermesId ? { ...x, text: "Error reaching Hermes: " + String(e), working: false } : x));
      setStatus("Something went wrong reaching the agent."); setPhase("idle");
    }
    busyRef.current = false; setBusy(false);
  }, [mode, turns, voice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart the wake recognizer (uses ONLY refs → no stale closures). A short
  // gap minimizes the mic flicker; backoff stops genuine error-loops.
  function safeStartWake() {
    if (!wakeOnRef.current || wakeRunningRef.current || busyRef.current || listeningRef.current) return;
    try { wakeRef.current?.start(); } catch { /* already running */ }
  }
  function scheduleWakeRestart() {
    if (!wakeOnRef.current) return;
    wakeBackoffRef.current = Math.min(wakeBackoffRef.current + 1, 12);
    const delay = wakeBackoffRef.current > 5 ? 1500 : 180;   // back off if it keeps dying
    window.setTimeout(safeStartWake, delay);
  }

  // ── manual push-to-talk ──
  function startListening() {
    if (busyRef.current || listening) return;
    const C = getSR(); if (!C) { setStatus("Voice needs Chrome or Safari — type instead."); return; }
    if (wakeOnRef.current) { try { wakeRef.current?.stop(); } catch {} }   // never two recognizers at once
    let rec = recRef.current;
    if (!rec) {
      rec = new C(); rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
      rec.onstart = () => { listeningRef.current = true; setListening(true); setPhase("listening"); setStatus("Listening… speak now."); sfxRef.current?.listen(); };
      rec.onerror = (e) => { listeningRef.current = false; setListening(false); if (phaseRef.current === "listening") setPhase("idle"); const err = e?.error || "unknown";
        setStatus(err === "not-allowed" || err === "service-not-allowed" ? "Mic blocked — allow Microphone in the address bar, then reload." : err === "no-speech" ? "Didn't catch that — tap and try again." : err === "aborted" ? "Tap the core to speak." : "Mic error: " + err);
        if (wakeOnRef.current && !busyRef.current) scheduleWakeRestart(); };
      rec.onend = () => { listeningRef.current = false; setListening(false); if (phaseRef.current === "listening") setPhase("idle"); if (wakeOnRef.current && !busyRef.current) scheduleWakeRestart(); };
      rec.onresult = (e) => { const t = e?.results?.[0]?.[0]?.transcript || ""; if (t.trim()) { setStatus("Heard: " + t); ask(t); } };
      recRef.current = rec;
    }
    try { rec.start(); } catch {}
  }
  function stopListening() { try { recRef.current?.stop(); } catch {} listeningRef.current = false; setListening(false); sfxRef.current?.stop(); if (phaseRef.current === "listening") setPhase("idle"); }

  // ── wake word — one continuous recognizer that self-heals, armed-state capture.
  // Wake aliases cover how browsers mis-hear "Jarvis" (jervis/harvis) + "Hermes".
  function startWake() {
    const C = getSR(); if (!C) { setStatus("Wake word needs Chrome or Safari."); return; }
    wakeOnRef.current = true; setWake(true); wakeBackoffRef.current = 0;
    let rec = wakeRef.current;
    if (!rec) {
      rec = new C(); rec.continuous = true; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
      rec.onstart = () => { wakeRunningRef.current = true; if (phaseRef.current === "idle" && !busyRef.current) setStatus('Standing by — say "Jarvis" or "Hermes".'); };
      rec.onerror = (e) => {
        const err = e?.error || "";
        if (err === "not-allowed" || err === "service-not-allowed") {
          wakeOnRef.current = false; setWake(false);
          setStatus("Mic blocked — allow Microphone in the address bar, then turn the wake word on again.");
        }
        // no-speech / aborted / network → let onend reschedule
      };
      rec.onend = () => { wakeRunningRef.current = false; if (wakeOnRef.current && !busyRef.current && !listening) scheduleWakeRestart(); };
      rec.onresult = (e) => {
        if (busyRef.current) return;
        const res = e.results[e.results.length - 1];
        if (!res || !res.isFinal) return;
        const raw = (res[0]?.transcript || "").trim();
        if (!raw) return;
        wakeBackoffRef.current = 0;                 // it's working — clear backoff
        const low = raw.toLowerCase();
        const m = low.match(/\b(jarvis|jervis|jarviss|harvis|hermes|hey jarvis|ok jarvis)\b/);
        if (m) {
          const after = raw.slice((m.index ?? 0) + m[0].length).replace(/^[\s,.:!?]+/, "").trim();
          if (after.length > 1) { try { rec!.stop(); } catch {} setStatus("Heard: " + after); ask(after); }
          else { armedRef.current = true; setPhase("listening"); setStatus("Yes, sir? I'm listening…"); sfxRef.current?.wake(); }
        } else if (armedRef.current) {
          armedRef.current = false; try { rec!.stop(); } catch {} setStatus("Heard: " + raw); ask(raw);
        }
      };
      wakeRef.current = rec;
    }
    safeStartWake();
  }
  function stopWake() { wakeOnRef.current = false; setWake(false); armedRef.current = false; wakeRunningRef.current = false; try { wakeRef.current?.stop(); } catch {} if (phaseRef.current === "listening") setPhase("idle"); setStatus("Wake word off — tap the core to talk."); }
  function toggleWake() { if (wake) stopWake(); else startWake(); }
  const restartWake = safeStartWake;   // speak()/build resume the wake loop after Jarvis finishes

  useEffect(() => () => { try { wakeRef.current?.stop(); recRef.current?.stop(); } catch {} }, []);

  // Esc exits wall mode
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && wall) setWall(false); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [wall]);

  // Live-looking telemetry (random-walk) — only ticks while wall mode is open.
  useEffect(() => {
    if (!wall) return;
    const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const id = setInterval(() => setTelem((t) => ({
      throughput: cl(t.throughput + (Math.random() * 6 - 3), 72, 99),
      latency: cl(t.latency + (Math.random() * 0.12 - 0.06), 0.2, 0.9),
      load: cl(t.load + (Math.random() * 10 - 5), 8, 74),
      signal: cl(t.signal + (Math.random() * 3 - 1.5), 90, 100),
    })), 1500);
    return () => clearInterval(id);
  }, [wall]);

  const phaseLabel = building ? "BUILDING" : busy ? (mode === "agent" ? "ACTING" : "THINKING") : listening || armedRef.current ? "LISTENING" : phaseState === "speaking" ? "SPEAKING" : "ONLINE";
  const coreTap = () => { if (busy) return; listening ? stopListening() : startListening(); };

  // shared controls row
  const controls = (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <button onClick={toggleWake} title='Wake word — say "Jarvis" hands-free'
        className="px-3 h-9 rounded-lg border text-[12px] flex items-center gap-1.5 transition"
        style={{ borderColor: wake ? CYAN : "var(--panel-border)", color: wake ? CYAN : "var(--fg-dim)", background: wake ? "rgba(34,211,238,0.12)" : "transparent" }}>
        <Radio size={13} className={wake ? "animate-pulse" : ""} /> Wake word {wake ? "ON" : "OFF"}
      </button>
      <button onClick={() => setMode((m) => (m === "auto" ? "agent" : "auto"))}
        title={mode === "auto" ? "Auto: instant answers, opens apps/sites, escalates big tasks. Click for Agent." : "Agent: full Hermes agent with tools (~28s). Click for Auto."}
        className="px-3 h-9 rounded-lg border text-[12px] flex items-center gap-1.5 transition"
        style={{ borderColor: mode === "auto" ? TEAL : "#60a5fa", color: mode === "auto" ? TEAL : "#60a5fa", background: mode === "auto" ? "rgba(52,211,153,0.10)" : "rgba(96,165,250,0.10)" }}>
        {mode === "auto" ? <><Zap size={13} /> Auto</> : <><Cpu size={13} /> Agent</>}
      </button>
      <select value={voice} onChange={(e) => setVoice(e.target.value)} title="Reply voice"
        className="bg-[rgba(0,0,0,0.3)] border border-[var(--panel-border)] rounded-lg px-2 h-9 text-[12px] text-[var(--fg-dim)] outline-none">
        {VOICES.map((v) => <option key={v.id} value={v.id}>🔊 {v.label}</option>)}
      </select>
    </div>
  );

  const previewPanel = previewFile ? (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${CYAN}55` }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: `${CYAN}33`, background: "rgba(34,211,238,0.06)" }}>
        <span className="text-[12px] font-mono flex items-center gap-2" style={{ color: CYAN }}>
          <span className="w-2 h-2 rounded-full" style={{ background: TEAL }} /> PREVIEW · {previewFile}
        </span>
        <div className="flex items-center gap-1.5">
          <a href={jPreviewUrl(previewFile)} target="_blank" rel="noopener noreferrer" title="Open in new tab" className="p-1.5 rounded-lg hover:bg-[var(--bg-mid)] text-[var(--fg-dim)]"><Maximize2 size={13} /></a>
          <button onClick={() => setPreviewFile(null)} title="Close preview" className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-300/80"><X size={14} /></button>
        </div>
      </div>
      <iframe key={previewFile} src={jPreviewUrl(previewFile)} title="jarvis build" className="w-full border-0 bg-black" style={{ height: 360 }} sandbox="allow-scripts allow-pointer-lock allow-same-origin" />
    </div>
  ) : null;

  return (
    <div className="max-w-[920px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-xl border" style={{ borderColor: `${CYAN}55`, background: `${CYAN}14`, color: CYAN }}>
            <Mic size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Hermes-<span style={{ color: CYAN }}>Jarvis</span></h1>
            <div className="text-[12px] text-[var(--fg-dim)] font-mono">NEURAL LINK · {phaseLabel} · {clock}</div>
          </div>
        </div>
        <button onClick={() => setWall(true)} title="Wall mode — fullscreen HUD"
          className="px-3 h-9 rounded-lg border border-[var(--panel-border)] hover:border-[var(--panel-border-hot)] text-[12px] text-[var(--fg-dim)] flex items-center gap-1.5 transition">
          <Maximize2 size={13} /> Wall mode
        </button>
      </div>

      {/* Reactor */}
      <div className="relative rounded-2xl border border-[var(--panel-border)] overflow-hidden mb-5"
        style={{ background: "radial-gradient(120% 100% at 50% 0%, rgba(34,211,238,0.06), rgba(0,0,0,0.5) 60%)" }}>
        <div className="hud-grid absolute inset-0 opacity-[0.18] pointer-events-none" />
        <div className="hud-scan absolute inset-0 pointer-events-none" />
        {/* corner brackets */}
        {["tl", "tr", "bl", "br"].map((p) => (
          <span key={p} className={`hud-bracket hud-${p}`} style={{ borderColor: `${CYAN}66` }} />
        ))}
        <div className="relative flex flex-col items-center py-8">
          <button onClick={coreTap} disabled={supported === false} className="relative grid place-items-center disabled:opacity-50" title="Tap to talk" style={{ width: 300, height: 300 }}>
            <ArcReactor phaseRef={phaseRef} levelRef={levelRef} size={300} />
            <span className="absolute text-[10px] font-mono tracking-[0.3em]" style={{ color: phaseColor(phaseState), bottom: 26 }}>{phaseLabel}</span>
          </button>
          <div className="text-[12.5px] font-mono text-center px-4 mt-1" style={{ color: CYAN }}>{status}</div>
        </div>

        {/* ── Boot-up sequence overlay ── */}
        <AnimatePresence>
          {booting && (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              className="absolute inset-0 z-10 grid place-items-center" style={{ background: "rgba(4,7,10,0.92)" }}>
              <div className="text-center font-mono">
                <motion.div initial={{ letterSpacing: "0.1em", opacity: 0 }} animate={{ letterSpacing: "0.55em", opacity: 1 }} transition={{ duration: 1.1 }}
                  className="text-[20px] font-semibold mb-5" style={{ color: CYAN }}>J A R V I S</motion.div>
                {[
                  "NEURAL LINK", "VOICE CORE", "AGENT MESH", "REACTOR", "ONLINE",
                ].map((line, i) => (
                  <motion.div key={line} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.42 }}
                    className="text-[11px] tracking-[0.18em] flex items-center justify-center gap-2 mb-1.5"
                    style={{ color: i === 4 ? TEAL : "var(--fg-dim)" }}>
                    <span>{line === "ONLINE" ? "» SYSTEM ONLINE" : line + " …"}</span>
                    {line !== "ONLINE" && <span style={{ color: TEAL }}>✓</span>}
                  </motion.div>
                ))}
                <motion.div initial={{ width: 0 }} animate={{ width: "180px" }} transition={{ duration: 2.4 }}
                  className="h-[2px] mt-4 mx-auto rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${CYAN}, ${TEAL})` }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── "Show me …" holographic panel ── */}
        <AnimatePresence>
          {showKind && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="absolute inset-0 z-20 grid place-items-center px-6 py-8" style={{ background: "rgba(4,7,10,0.95)" }}>
              <button onClick={() => setShowKind(null)} title="Dismiss" className="absolute top-3 right-3 grid place-items-center w-8 h-8 rounded-lg border z-10" style={{ borderColor: `${CYAN}55`, color: CYAN }}><X size={15} /></button>
              <div className="w-full max-w-[440px]">
                <ShowPanel kind={showKind} onPlay={(f) => { setPreviewFile(f); setShowKind(null); }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {controls}

      {previewPanel && <div className="mt-4">{previewPanel}</div>}

      {/* Text input */}
      <div className="flex gap-2 my-5">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { const v = input; setInput(""); ask(v); } }}
          placeholder="…or type a command for JARVIS and press Enter"
          className="flex-1 bg-[rgba(0,0,0,0.3)] border border-[var(--panel-border)] rounded-lg px-3.5 h-11 text-sm outline-none focus:border-[var(--panel-border-hot)] text-[var(--fg)]" />
        <button onClick={() => { const v = input; setInput(""); ask(v); }} disabled={busy || !input.trim()}
          className="px-4 h-11 rounded-lg border border-[var(--panel-border)] hover:border-[var(--panel-border-hot)] text-[13px] text-[var(--fg-dim)] transition disabled:opacity-30 flex items-center gap-1.5">
          <Send size={14} /> Send
        </button>
      </div>

      {/* Conversation */}
      <div className="space-y-2.5 pb-10">
        <AnimatePresence initial={false}>
          {turns.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="panel p-3.5">
              <div className="text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: t.who === "you" ? "var(--gold)" : CYAN }}>
                {t.who === "you" ? "You" : <><Zap size={10} /> JARVIS</>}
              </div>
              <div className={`text-[14.5px] leading-relaxed whitespace-pre-wrap ${t.working ? "italic text-[var(--fg-dimmer)]" : "text-[var(--fg)]"}`}>{t.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        {turns.length === 0 && (
          <div className="text-center text-[12.5px] text-[var(--fg-dimmer)] leading-relaxed pt-3">
            Try: <span className="text-[var(--fg-dim)]">&ldquo;Jarvis, what&rsquo;s the latest on Gemma 4?&rdquo;</span><br />
            <span className="text-[var(--fg-dim)]">&ldquo;Jarvis, open YouTube.&rdquo;</span> · <span className="text-[var(--fg-dim)]">&ldquo;Build a snake game in my workspace.&rdquo;</span>
          </div>
        )}
      </div>

      {/* ── WALL MODE — fullscreen ambient HUD ── */}
      <AnimatePresence>
        {wall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: "#04070a", backgroundImage: "radial-gradient(130% 90% at 50% 12%, rgba(34,211,238,0.12), rgba(4,7,10,0.86) 58%)" }}>
            <WallBackdrop />
            <div className="hud-grid absolute inset-0 opacity-[0.10] pointer-events-none" />
            <div className="hud-scan absolute inset-0 pointer-events-none" />
            {["tl", "tr", "bl", "br"].map((p) => (<span key={p} className={`hud-bracket hud-${p}`} style={{ borderColor: `${CYAN}88` }} />))}

            {/* top bar */}
            <div className="relative flex items-start justify-between p-7 font-mono text-[12px]" style={{ color: CYAN }}>
              <div>
                <div className="text-[16px] tracking-[0.3em] mb-1" style={{ color: "var(--fg)" }}>HERMES-<span style={{ color: CYAN }}>JARVIS</span></div>
                <div className="text-[var(--fg-dim)]">NEURAL INTERFACE · ONLINE</div>
              </div>
              <div className="text-right">
                <div className="text-[34px] leading-none tabular-nums" style={{ color: "var(--fg)" }}>{clock}</div>
                <div className="text-[var(--fg-dim)] mt-1">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
              </div>
              <button onClick={() => setWall(false)} title="Exit (Esc)" className="absolute top-6 right-6 hidden" />
            </div>
            <button onClick={() => setWall(false)} title="Exit wall mode (Esc)"
              className="absolute top-6 right-6 grid place-items-center w-9 h-9 rounded-lg border z-10" style={{ borderColor: `${CYAN}55`, color: CYAN }}>
              <X size={16} />
            </button>

            {/* center reactor + side readouts */}
            <div className="relative flex-1 grid grid-cols-[1fr_auto_1fr] items-center px-8 min-h-0">
              {/* left readouts — live status + animated telemetry bars */}
              <div className="font-mono text-[11.5px] space-y-2.5 justify-self-start max-w-[280px] w-full">
                {([["STATUS", phaseLabel], ["MODE", mode.toUpperCase()], ["WAKE WORD", wake ? "ARMED" : "OFF"], ["VOICE", "DANIEL · EN-GB"]] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-6 border-b border-[var(--line-soft)] pb-1.5" style={{ color: "var(--fg-dim)" }}>
                    <span className="tracking-widest">{k}</span><span style={{ color: CYAN }}>{v}</span>
                  </div>
                ))}
                {([["NEURAL THROUGHPUT", telem.throughput, 99], ["CORE LOAD", telem.load, 100], ["SIGNAL", telem.signal, 100]] as [string, number, number][]).map(([k, v, max]) => (
                  <div key={k}>
                    <div className="flex justify-between mb-1" style={{ color: "var(--fg-dim)" }}><span className="tracking-widest">{k}</span><span style={{ color: CYAN }}>{v.toFixed(1)}%</span></div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--line-soft)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(v / max) * 100}%`, background: `linear-gradient(90deg, ${TEAL}, ${CYAN})` }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-6 pt-1" style={{ color: "var(--fg-dim)" }}><span className="tracking-widest">LATENCY</span><span style={{ color: CYAN }}>{telem.latency.toFixed(2)}s</span></div>
              </div>
              {/* reactor */}
              <button onClick={coreTap} className="relative grid place-items-center justify-self-center" title="Tap to talk" style={{ width: 460, height: 460 }}>
                <ArcReactor phaseRef={phaseRef} levelRef={levelRef} size={460} />
                <span className="absolute text-[12px] font-mono tracking-[0.4em]" style={{ color: phaseColor(phaseState), bottom: 56 }}>{phaseLabel}</span>
              </button>
              {/* right: live preview when there's a build, else transcript */}
              <div className="justify-self-end w-full max-w-[440px]">
                {showKind ? (
                  <div className="relative">
                    <button onClick={() => setShowKind(null)} title="Dismiss" className="absolute -top-2 -right-2 grid place-items-center w-7 h-7 rounded-lg border z-10" style={{ borderColor: `${CYAN}55`, color: CYAN }}><X size={13} /></button>
                    <ShowPanel kind={showKind} onPlay={(f) => { setPreviewFile(f); setShowKind(null); }} />
                  </div>
                ) : previewFile ? previewPanel : (
                  <div className="font-mono text-[12px] space-y-2" style={{ color: "var(--fg-dim)" }}>
                    <div className="tracking-widest mb-1" style={{ color: CYAN }}>TRANSCRIPT</div>
                    <div className="space-y-2 max-h-[44vh] overflow-hidden">
                      {turns.slice(0, 6).map((t) => (
                        <div key={t.id}><span style={{ color: t.who === "you" ? "var(--gold)" : TEAL }}>{t.who === "you" ? "» YOU  " : "» JARVIS  "}</span><span style={{ color: "var(--fg)" }}>{t.text}</span></div>
                      ))}
                      {turns.length === 0 && <div className="opacity-60">Awaiting command, sir…</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* audio waveform */}
            <div className="relative px-7 opacity-90"><Waveform levelRef={levelRef} /></div>

            {/* bottom status + controls */}
            <div className="relative px-7 pb-7 pt-1 flex items-center justify-between">
              <div className="font-mono text-[13px]" style={{ color: CYAN }}>{status}</div>
              {controls}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} className="hidden" />

      <style jsx global>{`
        .hud-grid { background-image: linear-gradient(${CYAN}22 1px, transparent 1px), linear-gradient(90deg, ${CYAN}22 1px, transparent 1px); background-size: 42px 42px; }
        .hud-scan { background: repeating-linear-gradient(0deg, rgba(34,211,238,0.04) 0px, rgba(34,211,238,0.04) 1px, transparent 2px, transparent 4px); animation: hudscan 8s linear infinite; }
        @keyframes hudscan { from { background-position-y: 0; } to { background-position-y: 100px; } }
        .hud-bracket { position: absolute; width: 22px; height: 22px; border-style: solid; }
        .hud-tl { top: 12px; left: 12px; border-width: 2px 0 0 2px; }
        .hud-tr { top: 12px; right: 12px; border-width: 2px 2px 0 0; }
        .hud-bl { bottom: 12px; left: 12px; border-width: 0 0 2px 2px; }
        .hud-br { bottom: 12px; right: 12px; border-width: 0 2px 2px 0; }
      `}</style>
    </div>
  );
}
