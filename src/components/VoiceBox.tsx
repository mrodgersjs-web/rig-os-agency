"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Square, Sun, Settings, X } from "lucide-react";
import {
  speak as vbSpeak,
  stop as vbStop,
  initVoicebox,
  getVoices,
  setVoice as vbSetVoice,
  jarvisGreeting,
  isSpeaking as vbIsSpeaking,
  type VoiceInfo,
} from "@/lib/voicebox";

// ────────────────────────────────────────────────────────────────────────
// VoiceBox — floating Jarvis-style voice button
//
// A glowing orb that floats in the bottom-right corner. Click to hear the
// daily briefing. Long-press / secondary action for "Good Morning" mode.
// Shows real-time waveform animation while speaking.
// ────────────────────────────────────────────────────────────────────────

type VoiceBoxState = "idle" | "loading" | "speaking" | "error";

interface VoiceBoxProps {
  /** Override the default accent color */
  accent?: string;
  /** If true, auto-greet on first user interaction */
  autoGreet?: boolean;
  /** Name for greeting (default "Mike") */
  greetName?: string;
  /** If provided, clicking the orb speaks this instead of fetching briefing */
  customText?: string;
  /** If true, uses Hermes TTS (ElevenLabs) for higher quality */
  highQuality?: boolean;
}

export default function VoiceBox({
  accent = "var(--gold, #d4a574)",
  autoGreet = false,
  greetName = "Mike",
  customText,
  highQuality = false,
}: VoiceBoxProps) {
  const [state, setState] = useState<VoiceBoxState>("idle");
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState("");
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [hQ, setHQ] = useState(highQuality);
  const [waveform, setWaveform] = useState<number[]>(new Array(24).fill(0.1));

  // Refs
  const waveRaf = useRef<number | null>(null);
  const greeted = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // ── Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = initVoicebox();
    // Give it a tick for voices to load
    const t = setTimeout(() => {
      const v = getVoices();
      setVoices(v);
      if (v.length > 0 && !selectedVoice) {
        const defaultVoice = v.find((x) => x.lang === "en-GB") || v[0];
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
          vbSetVoice(defaultVoice.name);
        }
      }
    }, 200);
    return () => {
      cleanup();
      clearTimeout(t);
      if (waveRaf.current) cancelAnimationFrame(waveRaf.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-greet on first interaction ────────────────────────────────
  useEffect(() => {
    if (!autoGreet) return;
    const unlock = () => {
      if (greeted.current) return;
      greeted.current = true;
      const greeting = jarvisGreeting(greetName);
      doSpeak(greeting);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [autoGreet, greetName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Waveform animation ──────────────────────────────────────────────
  useEffect(() => {
    function loop() {
      if (state === "speaking") {
        // Simulate waveform with sinusoidal variation
        const t = performance.now() / 1000;
        setWaveform((prev) =>
          prev.map((_, i) => {
            const base = 0.15 + 0.35 * Math.abs(Math.sin(t * 3 + i * 0.5));
            const noise = 0.2 * Math.abs(Math.sin(t * 7 + i * 1.3));
            return Math.min(1, base + noise);
          }),
        );
      } else {
        setWaveform(new Array(24).fill(0.1));
      }
      waveRaf.current = requestAnimationFrame(loop);
    }
    loop();
    return () => {
      if (waveRaf.current) cancelAnimationFrame(waveRaf.current);
    };
  }, [state]);

  // ── Speak helper ────────────────────────────────────────────────────
  const doSpeak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError("");
      setState("speaking");
      await vbSpeak(text, {
        rate,
        pitch,
        voiceName: selectedVoice || undefined,
        highQuality: hQ,
        onStart: () => setState("speaking"),
        onEnd: () => setState("idle"),
        onError: (e) => {
          setError(e);
          setState("error");
          setTimeout(() => setState("idle"), 3000);
        },
      });
    },
    [rate, pitch, selectedVoice, hQ],
  );

  // ── Fetch briefing ──────────────────────────────────────────────────
  async function fetchBriefing(): Promise<string> {
    try {
      const r = await fetch("/api/agency/dashboard", { cache: "no-store" });
      const j = await r.json();
      const kpis = j.kpis;
      const parts: string[] = [];

      parts.push(jarvisGreeting("sir"));

      if (kpis) {
        if (kpis.totalRevenue !== undefined)
          parts.push(`Revenue stands at ${kpis.totalRevenue}.`);
        if (kpis.activeClients !== undefined)
          parts.push(`${kpis.activeClients} active clients on the books.`);
        if (kpis.pipelineValue !== undefined)
          parts.push(`Pipeline value: ${kpis.pipelineValue}.`);
        if (kpis.winRate !== undefined)
          parts.push(`Win rate at ${kpis.winRate}%.`);
      }

      if (j.pipeline && Array.isArray(j.pipeline) && j.pipeline.length > 0) {
        parts.push(
          `${j.pipeline.length} deals in the pipeline. Top deal: ${j.pipeline[0]?.name || "unnamed"}.`,
        );
      }

      parts.push("All systems nominal. What's our next move?");
      return parts.join(" ");
    } catch {
      return `${jarvisGreeting("sir")} Dashboard data unavailable, but all voice systems are operational.`;
    }
  }

  // ── Click handler ───────────────────────────────────────────────────
  async function handleClick() {
    if (state === "speaking") {
      vbStop();
      setState("idle");
      return;
    }

    setState("loading");

    if (customText) {
      await doSpeak(customText);
    } else {
      const briefing = await fetchBriefing();
      await doSpeak(briefing);
    }
  }

  // ── Good Morning ────────────────────────────────────────────────────
  function handleGreeting() {
    const greeting = jarvisGreeting(greetName);
    doSpeak(greeting);
  }

  // ── Voice selection ──────────────────────────────────────────────────
  function handleVoiceChange(name: string) {
    setSelectedVoice(name);
    vbSetVoice(name);
  }

  // ── Render ───────────────────────────────────────────────────────────
  const isSpeaking = state === "speaking";
  const isLoading = state === "loading";

  return (
    <>
      {/* Floating orb container */}
      <div className="voicebox-float fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="voicebox-settings rounded-2xl border p-5 w-72"
              style={{
                background: "var(--bg-card, #251d2c)",
                borderColor: "var(--line, rgba(212,165,116,0.2))",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: "var(--cream)" }}>
                  Voice Settings
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="opacity-50 hover:opacity-100 transition"
                  style={{ color: "var(--cream-dim)" }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Voice selector */}
              <label className="block mb-3">
                <span className="text-[11px] uppercase tracking-wide mb-1 block" style={{ color: "var(--cream-dim)" }}>
                  Voice
                </span>
                <select
                  value={selectedVoice}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="w-full bg-black/30 border rounded-lg px-3 py-2 text-xs outline-none"
                  style={{
                    borderColor: "var(--line, rgba(212,165,116,0.2))",
                    color: "var(--cream)",
                  }}
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </label>

              {/* Rate slider */}
              <label className="block mb-3">
                <span className="text-[11px] uppercase tracking-wide mb-1 flex justify-between" style={{ color: "var(--cream-dim)" }}>
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

              {/* Pitch slider */}
              <label className="block mb-3">
                <span className="text-[11px] uppercase tracking-wide mb-1 flex justify-between" style={{ color: "var(--cream-dim)" }}>
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

              {/* High quality toggle */}
              <label className="flex items-center gap-2 text-xs cursor-pointer mb-3" style={{ color: "var(--cream-dim)" }}>
                <input
                  type="checkbox"
                  checked={hQ}
                  onChange={(e) => setHQ(e.target.checked)}
                  style={{ accentColor: accent }}
                />
                <span>Use Hermes TTS (ElevenLabs)</span>
              </label>

              {/* Good Morning button */}
              <button
                onClick={handleGreeting}
                className="w-full py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2"
                style={{
                  background: `${accent}20`,
                  border: `1px solid ${accent}55`,
                  color: accent,
                }}
              >
                <Sun size={14} /> Good Morning {greetName}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11px] rounded-lg px-3 py-1.5 max-w-56"
              style={{
                background: "rgba(196, 96, 126, 0.15)",
                color: "var(--plum, #c4607e)",
                border: "1px solid rgba(196, 96, 126, 0.3)",
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform bars (visible when speaking) */}
        {isSpeaking && (
          <div className="flex items-end gap-[3px] h-8 mb-1">
            {waveform.map((h, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(4, h * 32)}px`,
                  background: accent,
                  opacity: 0.4 + h * 0.6,
                  boxShadow: `0 0 4px ${accent}`,
                }}
              />
            ))}
          </div>
        )}

        {/* Main orb button */}
        <div className="flex items-center gap-3">
          {/* Settings gear */}
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="grid place-items-center w-10 h-10 rounded-full border transition hover:scale-105"
            style={{
              borderColor: "var(--line, rgba(212,165,116,0.2))",
              background: "var(--bg-card, #251d2c)",
              color: "var(--cream-dim)",
            }}
            title="Voice settings"
          >
            <Settings size={16} />
          </button>

          {/* The orb */}
          <motion.button
            onClick={handleClick}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="voicebox-orb relative grid place-items-center rounded-full border-none cursor-pointer"
            style={{
              width: 56,
              height: 56,
              background: isSpeaking
                ? `radial-gradient(circle at 35% 30%, ${accent}, color-mix(in srgb, ${accent} 70%, #000) 80%)`
                : `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${accent} 50%, #000), color-mix(in srgb, ${accent} 30%, #000) 80%)`,
              boxShadow: isSpeaking
                ? `0 0 30px -2px ${accent}, 0 0 60px -10px ${accent}`
                : `0 0 15px -5px ${accent}`,
              color: "#fff",
              transition: "all 0.3s",
            }}
            title={
              isSpeaking ? "Click to stop" : isLoading ? "Loading briefing…" : "Click to hear briefing"
            }
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Radio size={22} />
              </motion.div>
            ) : isSpeaking ? (
              <Square size={18} fill="currentColor" />
            ) : (
              <Radio size={22} />
            )}

            {/* Pulsing ring when speaking */}
            {isSpeaking && (
              <span
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  animation: "vb-ring 1.4s ease-out infinite",
                }}
              />
            )}
          </motion.button>
        </div>
      </div>

      <style jsx>{`
        @keyframes vb-ring {
          0%   { box-shadow: 0 0 0 0 color-mix(in srgb, ${accent} 50%, transparent); }
          70%  { box-shadow: 0 0 0 16px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
    </>
  );
}