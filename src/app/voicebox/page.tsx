"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Square,
  Sun,
  Play,
  Trash2,
  Volume2,
  Settings2,
  History,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  speak as vbSpeak,
  stop as vbStop,
  initVoicebox,
  getVoices,
  setVoice as vbSetVoice,
  jarvisGreeting,
  timeGreeting,
  type VoiceInfo,
} from "@/lib/voicebox";

// ────────────────────────────────────────────────────────────────────────
// VoiceBox Page — Full voice control center
//
// Big "Speak Briefing" button, voice settings, custom script editor,
// history of spoken items, and Jarvis wake-up greeting integration.
// ────────────────────────────────────────────────────────────────────────

interface HistoryItem {
  id: number;
  text: string;
  timestamp: string;
  source: "briefing" | "greeting" | "custom" | "script";
}

type SpeakState = "idle" | "loading" | "speaking" | "error";

const DEFAULT_SCRIPT = `Good morning, sir. All systems are online and operational.

Today's priorities:
1. Review the active pipeline — three deals are approaching close
2. The Q3 revenue target is on track at 87% of goal
3. Two new client proposals are ready for review

All deviation engines are running. The fleet is coordinated. What shall we accomplish today?`;

export default function VoiceBoxPage() {
  // ── State ──────────────────────────────────────────────────────────
  const [speakState, setSpeakState] = useState<SpeakState>("idle");
  const [error, setError] = useState("");
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [useHermes, setUseHermes] = useState(false);
  const [scriptText, setScriptText] = useState(DEFAULT_SCRIPT);
  const [customText, setCustomText] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [waveform, setWaveform] = useState<number[]>(new Array(32).fill(0.1));
  const [connected, setConnected] = useState<{ elevenlabs: string; minimax: string } | null>(null);
  const [voicePresets, setVoicePresets] = useState<
    { id: string; label: string; provider: string }[]
  >([]);

  const historyIdRef = useRef(0);
  const waveRafRef = useRef<number | null>(null);

  // ── Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = initVoicebox();
    const t = setTimeout(() => {
      const v = getVoices();
      setVoices(v);
      if (v.length > 0) {
        const defaultVoice = v.find((x) => x.lang === "en-GB") || v.find((x) => x.lang.startsWith("en")) || v[0];
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
          vbSetVoice(defaultVoice.name);
        }
      }
    }, 300);

    // Fetch TTS provider status
    fetch("/api/voicebox")
      .then((r) => r.json())
      .then((j) => {
        setConnected(j.providers);
        setVoicePresets(j.voicePresets || []);
      })
      .catch(() => {});

    return () => {
      cleanup();
      clearTimeout(t);
      if (waveRafRef.current) cancelAnimationFrame(waveRafRef.current);
    };
  }, []);

  // ── Waveform animation ───────────────────────────────────────────────
  useEffect(() => {
    function loop() {
      if (speakState === "speaking") {
        const t = performance.now() / 1000;
        setWaveform((prev) =>
          prev.map((_, i) => {
            const base = 0.12 + 0.3 * Math.abs(Math.sin(t * 2.5 + i * 0.4));
            const noise = 0.25 * Math.abs(Math.sin(t * 8 + i * 1.7));
            return Math.min(1, base + noise + Math.random() * 0.15);
          }),
        );
      } else {
        setWaveform(new Array(32).fill(0.08));
      }
      waveRafRef.current = requestAnimationFrame(loop);
    }
    loop();
    return () => {
      if (waveRafRef.current) cancelAnimationFrame(waveRafRef.current);
    };
  }, [speakState]);

  // ── Add to history ───────────────────────────────────────────────────
  const addHistory = useCallback((text: string, source: HistoryItem["source"]) => {
    historyIdRef.current += 1;
    setHistory((prev) =>
      [
        {
          id: historyIdRef.current,
          text,
          timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          source,
        },
        ...prev,
      ].slice(0, 50),
    );
  }, []);

  // ── Speak helper ─────────────────────────────────────────────────────
  const doSpeak = useCallback(
    async (text: string, source: HistoryItem["source"]) => {
      if (!text.trim()) return;
      setError("");
      setSpeakState("speaking");
      addHistory(text, source);

      await vbSpeak(text, {
        rate,
        pitch,
        volume,
        voiceName: selectedVoice || undefined,
        highQuality: useHermes,
        onStart: () => setSpeakState("speaking"),
        onEnd: () => setSpeakState("idle"),
        onError: (e) => {
          setError(e);
          setSpeakState("error");
          setTimeout(() => setSpeakState("idle"), 3000);
        },
      });
    },
    [rate, pitch, volume, selectedVoice, useHermes, addHistory],
  );

  // ── Fetch & speak briefing ────────────────────────────────────────────
  async function speakBriefing() {
    if (speakState === "speaking") {
      vbStop();
      setSpeakState("idle");
      return;
    }

    setSpeakState("loading");
    try {
      const r = await fetch("/api/agency/dashboard", { cache: "no-store" });
      const j = await r.json();
      const kpis = j.kpis;
      const parts: string[] = [];

      parts.push(jarvisGreeting("sir"));

      if (kpis) {
        if (kpis.totalRevenue !== undefined)
          parts.push(`Total revenue: ${kpis.totalRevenue}.`);
        if (kpis.activeClients !== undefined)
          parts.push(`${kpis.activeClients} active clients.`);
        if (kpis.pipelineValue !== undefined)
          parts.push(`Pipeline value: ${kpis.pipelineValue}.`);
        if (kpis.winRate !== undefined)
          parts.push(`Win rate: ${kpis.winRate}%.`);
      }

      if (j.pipeline && Array.isArray(j.pipeline) && j.pipeline.length > 0) {
        const topDeals = j.pipeline.slice(0, 3).map((d: { name?: string }) => d?.name || "unnamed");
        parts.push(`${j.pipeline.length} deals in pipeline. Top: ${topDeals.join(", ")}.`);
      }

      if (j.verticals && Array.isArray(j.verticals)) {
        parts.push(`${j.verticals.length} active verticals.`);
      }

      parts.push("All systems nominal. Ready for your orders, sir.");
      await doSpeak(parts.join(" "), "briefing");
    } catch {
      const fallback = `${jarvisGreeting("sir")} Dashboard data unavailable. All voice systems operational.`;
      await doSpeak(fallback, "briefing");
    }
  }

  // ── Speak greeting ───────────────────────────────────────────────────
  function speakGreeting() {
    if (speakState === "speaking") {
      vbStop();
      setSpeakState("idle");
      return;
    }
    const greeting = jarvisGreeting("Mike");
    doSpeak(greeting, "greeting");
  }

  // ── Speak custom text ────────────────────────────────────────────────
  function speakCustom() {
    if (!customText.trim()) return;
    doSpeak(customText, "custom");
  }

  // ── Speak script ──────────────────────────────────────────────────────
  function speakScript() {
    if (!scriptText.trim()) return;
    doSpeak(scriptText, "script");
  }

  // ── Clear history ─────────────────────────────────────────────────────
  function clearHistory() {
    setHistory([]);
  }

  // ── Voice change ─────────────────────────────────────────────────────
  function handleVoiceChange(name: string) {
    setSelectedVoice(name);
    vbSetVoice(name);
  }

  // ── Render ───────────────────────────────────────────────────────────
  const isSpeaking = speakState === "speaking";
  const isLoading = speakState === "loading";
  const accent = "var(--gold, #d4a574)";

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="grid place-items-center w-11 h-11 rounded-xl"
          style={{ background: "rgba(212,165,116,0.15)", color: accent }}
        >
          <Volume2 size={22} />
        </div>
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--cream)" }}
          >
            VoiceBox
          </h1>
          <p className="text-sm" style={{ color: "var(--cream-dim)" }}>
            Jarvis-style voice interface · Briefings · Greetings · Custom announcements
          </p>
        </div>
      </div>

      {/* ── Big Speak Briefing Button + Waveform ────────────────────── */}
      <div
        className="rounded-2xl border p-8 flex flex-col items-center"
        style={{
          background: "var(--bg-card, #251d2c)",
          borderColor: "var(--line, rgba(212,165,116,0.2))",
        }}
      >
        {/* Glowing orb */}
        <motion.button
          onClick={speakBriefing}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          className="relative grid place-items-center rounded-full border-none cursor-pointer mb-4"
          style={{
            width: 120,
            height: 120,
            background: isSpeaking
              ? `radial-gradient(circle at 35% 30%, ${accent}, color-mix(in srgb, ${accent} 70%, #000) 80%)`
              : isLoading
                ? `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${accent} 60%, #000), color-mix(in srgb, ${accent} 30%, #000) 80%)`
                : `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${accent} 50%, #000), color-mix(in srgb, ${accent} 25%, #000) 80%)`,
            boxShadow: isSpeaking
              ? `0 0 60px -5px ${accent}, 0 0 100px -15px ${accent}`
              : `0 0 20px -5px ${accent}`,
            color: "#fff",
            transition: "all 0.3s",
          }}
        >
          {isLoading ? (
            <Loader2 size={40} className="animate-spin" />
          ) : isSpeaking ? (
            <Square size={32} fill="currentColor" />
          ) : (
            <Radio size={40} />
          )}
          {isSpeaking && (
            <span
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ animation: "vb-big-ring 1.4s ease-out infinite" }}
            />
          )}
          <style jsx>{`
            @keyframes vb-big-ring {
              0% { box-shadow: 0 0 0 0 color-mix(in srgb, ${accent} 40%, transparent); }
              70% { box-shadow: 0 0 0 30px transparent; }
              100% { box-shadow: 0 0 0 0 transparent; }
            }
          `}</style>
        </motion.button>

        {/* Waveform */}
        <div className="flex items-end gap-[3px] h-12 mb-3">
          {waveform.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(3, h * 48)}px`,
                background: isSpeaking ? accent : "var(--cream-mute, #6e6353)",
                opacity: isSpeaking ? 0.4 + h * 0.6 : 0.3,
                boxShadow: isSpeaking ? `0 0 6px ${accent}` : "none",
              }}
            />
          ))}
        </div>

        <div className="text-center mb-4">
          <p className="text-sm font-medium" style={{ color: "var(--cream)" }}>
            {isSpeaking ? "Speaking…" : isLoading ? "Loading briefing…" : "Speak Daily Briefing"}
          </p>
          <p className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
            {isSpeaking ? "Click orb to stop" : "Fetches dashboard data and speaks a summary"}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={speakGreeting}
            className="px-4 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2"
            style={{
              background: `${accent}15`,
              border: `1px solid ${accent}44`,
              color: accent,
            }}
          >
            <Sun size={14} /> Good Morning Mike
          </button>
          <button
            onClick={() => setUseHermes((v) => !v)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2"
            style={{
              background: useHermes ? `${accent}20` : "transparent",
              border: `1px solid ${useHermes ? `${accent}55` : "var(--line, rgba(212,165,116,0.2))"}`,
              color: useHermes ? accent : "var(--cream-dim)",
            }}
          >
            <Sparkles size={14} /> Hermes TTS {useHermes ? "ON" : "OFF"}
          </button>
        </div>

        {/* Provider status */}
        {connected && (
          <div className="flex gap-3 mt-3 text-[10px]" style={{ color: "var(--cream-dim)" }}>
            <span>
              ElevenLabs:{" "}
              <span style={{ color: connected.elevenlabs === "connected" ? "var(--emerald)" : "var(--plum)" }}>
                {connected.elevenlabs}
              </span>
            </span>
            <span>
              MiniMax:{" "}
              <span style={{ color: connected.minimax === "connected" ? "var(--emerald)" : "var(--plum)" }}>
                {connected.minimax}
              </span>
            </span>
          </div>
        )}

        {error && (
          <div
            className="mt-3 text-xs rounded-lg px-3 py-2"
            style={{
              background: "rgba(196, 96, 126, 0.15)",
              color: "var(--plum, #c4607e)",
              border: "1px solid rgba(196, 96, 126, 0.3)",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* ── Two-column layout: Settings + Script Editor ──────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Voice Settings */}
        <div
          className="rounded-2xl border p-5"
          style={{
            background: "var(--bg-card, #251d2c)",
            borderColor: "var(--line, rgba(212,165,116,0.2))",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={16} style={{ color: accent }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
              Voice Settings
            </h2>
          </div>

          {/* Voice selector */}
          <label className="block mb-4">
            <span
              className="text-[11px] uppercase tracking-wide mb-1.5 block"
              style={{ color: "var(--cream-dim)" }}
            >
              System Voice
            </span>
            <select
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full bg-black/30 border rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--line, rgba(212,165,116,0.2))",
                color: "var(--cream)",
              }}
            >
              <option value="">Default</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.name}>
                  {v.name} ({v.lang}){v.localService ? " — local" : ""}
                </option>
              ))}
            </select>
          </label>

          {/* Hermes voice presets */}
          {useHermes && voicePresets.length > 0 && (
            <label className="block mb-4">
              <span
                className="text-[11px] uppercase tracking-wide mb-1.5 block"
                style={{ color: "var(--cream-dim)" }}
              >
                Hermes Voice (High Quality)
              </span>
              <select
                className="w-full bg-black/30 border rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--line, rgba(212,165,116,0.2))",
                  color: "var(--cream)",
                }}
                onChange={(e) => {
                  const preset = voicePresets.find((p) => p.id === e.target.value);
                  if (preset) {
                    setUseHermes(true);
                    // Store the selected voiceId for Hermes calls
                    // (passed via the voiceId option)
                  }
                }}
              >
                {voicePresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.provider})
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Rate */}
          <label className="block mb-4">
            <span
              className="text-[11px] uppercase tracking-wide mb-1.5 flex justify-between"
              style={{ color: "var(--cream-dim)" }}
            >
              Rate
              <span style={{ color: "var(--cream)" }}>{rate.toFixed(1)}×</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: accent }}
            />
          </label>

          {/* Pitch */}
          <label className="block mb-4">
            <span
              className="text-[11px] uppercase tracking-wide mb-1.5 flex justify-between"
              style={{ color: "var(--cream-dim)" }}
            >
              Pitch
              <span style={{ color: "var(--cream)" }}>{pitch.toFixed(1)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: accent }}
            />
          </label>

          {/* Volume */}
          <label className="block mb-4">
            <span
              className="text-[11px] uppercase tracking-wide mb-1.5 flex justify-between"
              style={{ color: "var(--cream-dim)" }}
            >
              Volume
              <span style={{ color: "var(--cream)" }}>{Math.round(volume * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: accent }}
            />
          </label>

          {/* Quick announcement */}
          <div className="pt-3 border-t" style={{ borderColor: "var(--line, rgba(212,165,116,0.1))" }}>
            <span
              className="text-[11px] uppercase tracking-wide mb-1.5 block"
              style={{ color: "var(--cream-dim)" }}
            >
              Quick Announcement
            </span>
            <div className="flex gap-2">
              <input
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    speakCustom();
                  }
                }}
                placeholder="Type something to speak…"
                className="flex-1 bg-black/30 border rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--line, rgba(212,165,116,0.2))",
                  color: "var(--cream)",
                }}
              />
              <button
                onClick={speakCustom}
                disabled={!customText.trim() || isSpeaking}
                className="px-3 rounded-lg transition disabled:opacity-40 flex items-center gap-1"
                style={{
                  background: `${accent}20`,
                  border: `1px solid ${accent}55`,
                  color: accent,
                }}
              >
                <Play size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Script Editor */}
        <div
          className="rounded-2xl border p-5"
          style={{
            background: "var(--bg-card, #251d2c)",
            borderColor: "var(--line, rgba(212,165,116,0.2))",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: accent }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
                Script Editor
              </h2>
            </div>
            <button
              onClick={() => setScriptText(DEFAULT_SCRIPT)}
              className="text-[11px] transition hover:opacity-100 opacity-50"
              style={{ color: "var(--cream-dim)" }}
            >
              Reset
            </button>
          </div>

          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={12}
            className="w-full bg-black/30 border rounded-lg px-3 py-2.5 text-sm leading-relaxed outline-none resize-y font-mono"
            style={{
              borderColor: "var(--line, rgba(212,165,116,0.2))",
              color: "var(--cream)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px",
            }}
            placeholder="Write a custom announcement script…"
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
              {scriptText.length} chars
              {scriptText.length > 2500 && useHermes && (
                <span style={{ color: "var(--plum)" }}> (ElevenLabs truncates at 2500)</span>
              )}
            </span>
            <button
              onClick={speakScript}
              disabled={!scriptText.trim() || isSpeaking || isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 flex items-center gap-2"
              style={{
                background: `${accent}20`,
                border: `1px solid ${accent}55`,
                color: accent,
              }}
            >
              {isSpeaking ? <Square size={14} /> : <Play size={14} />}
              {isSpeaking ? "Stop" : "Speak Script"}
            </button>
          </div>
        </div>
      </div>

      {/* ── History ───────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: "var(--bg-card, #251d2c)",
          borderColor: "var(--line, rgba(212,165,116,0.2))",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={16} style={{ color: accent }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--cream)" }}>
              Spoken History
            </h2>
            {history.length > 0 && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `${accent}15`, color: accent }}
              >
                {history.length}
              </span>
            )}
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-[11px] transition hover:opacity-100 opacity-50"
              style={{ color: "var(--cream-dim)" }}
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--cream-dim)" }}>
            No items spoken yet. Click the orb above to start.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto scroll">
            <AnimatePresence initial={false}>
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--line, rgba(212,165,116,0.1))",
                  }}
                >
                  {/* Source badge */}
                  <span
                    className="text-[9px] uppercase px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5"
                    style={{
                      background:
                        item.source === "briefing"
                          ? "rgba(90,184,150,0.15)"
                          : item.source === "greeting"
                            ? "rgba(212,165,116,0.15)"
                            : item.source === "script"
                              ? "rgba(196,96,126,0.15)"
                              : "rgba(101,99,83,0.15)",
                      color:
                        item.source === "briefing"
                          ? "var(--emerald, #5ab896)"
                          : item.source === "greeting"
                            ? accent
                            : item.source === "script"
                              ? "var(--plum, #c4607e)"
                              : "var(--cream-dim)",
                    }}
                  >
                    {item.source}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] leading-relaxed whitespace-pre-wrap line-clamp-3"
                      style={{ color: "var(--cream)" }}
                    >
                      {item.text}
                    </p>
                  </div>
                  <span className="text-[10px] whitespace-nowrap mt-0.5" style={{ color: "var(--cream-dim)" }}>
                    {item.timestamp}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}