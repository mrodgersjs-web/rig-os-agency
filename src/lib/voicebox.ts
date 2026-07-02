"use client";

// ══════════════════════════════════════════════════════════════════════
// VoiceBox — Voice synthesis module for the RIG Agent OS
// Uses the browser Web Speech API for local TTS, and optionally calls
// /api/hermes/tts (ElevenLabs / MiniMax) for higher quality voices.
// ══════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────

export interface SpeakOptions {
  /** Speech rate (0.5–2.0, default 1.0) */
  rate?: number;
  /** Speech pitch (0–2, default 1.0) */
  pitch?: number;
  /** Volume (0–1, default 1.0) */
  volume?: number;
  /** Voice URI / name to use (overrides the default set via setVoice) */
  voiceName?: string;
  /** If true, use /api/hermes/tts (ElevenLabs) instead of Web Speech API */
  highQuality?: boolean;
  /** Voice ID for the Hermes TTS endpoint (ElevenLabs voice ID) */
  voiceId?: string;
  /** Provider for Hermes TTS: "elevenlabs" (default) or "minimax" */
  provider?: "elevenlabs" | "minimax";
  /** Called when speech starts */
  onStart?: () => void;
  /** Called when speech ends (normally or cancelled) */
  onEnd?: () => void;
  /** Called on error */
  onError?: (err: string) => void;
  /** Called with boundary events (word index) */
  onBoundary?: (charIndex: number) => void;
}

export interface VoiceInfo {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  voiceURI: string;
}

// ── Internal State ─────────────────────────────────────────────────────

let synth: SpeechSynthesis | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentVoice: SpeechSynthesisVoice | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReady = false;

/** Callback registry for the current utterance */
let activeCallbacks: SpeakOptions = {};

// ── Initialization ──────────────────────────────────────────────────────

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  if (!synth) {
    synth = window.speechSynthesis;
  }
  return synth;
}

/**
 * Load available voices. On some browsers, voices load asynchronously,
 * so we set up a listener for the voiceschanged event.
 */
function loadVoices(): SpeechSynthesisVoice[] {
  const s = getSynth();
  if (!s) return [];
  const voices = s.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
    voicesReady = true;
    // Set a sensible default voice (prefer en-GB or en-US)
    if (!currentVoice) {
      currentVoice =
        voices.find((v) => v.lang === "en-GB" && v.name.includes("Daniel")) ||
        voices.find((v) => v.lang === "en-GB") ||
        voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("google")) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0] ||
        null;
    }
  }
  return voices;
}

/**
 * Initialize the voice system. Call this on the client side (e.g. in a useEffect).
 * Returns a cleanup function.
 */
export function initVoicebox(): () => void {
  if (typeof window === "undefined") return () => {};

  const s = getSynth();
  if (!s) return () => {};

  loadVoices();

  const onVoicesChanged = () => {
    loadVoices();
  };

  s.addEventListener("voiceschanged", onVoicesChanged);

  // Some browsers need a tickle to populate voices
  if (s.getVoices().length === 0) {
    // Trick: speak an empty string to force voice loading
    const u = new SpeechSynthesisUtterance("");
    s.speak(u);
  }

  return () => {
    s.removeEventListener("voiceschanged", onVoicesChanged);
  };
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Get available voices as a simplified array.
 */
export function getVoices(): VoiceInfo[] {
  if (!voicesReady) loadVoices();
  return cachedVoices.map((v) => ({
    name: v.name,
    lang: v.lang,
    localService: v.localService,
    default: v.default,
    voiceURI: v.voiceURI,
  }));
}

/**
 * Set the default voice by name (matches against voice.name or voiceURI).
 */
export function setVoice(name: string): boolean {
  if (!voicesReady) loadVoices();
  const match = cachedVoices.find(
    (v) => v.name === name || v.voiceURI === name || v.name.toLowerCase().includes(name.toLowerCase()),
  );
  if (match) {
    currentVoice = match;
    return true;
  }
  return false;
}

/**
 * Get the currently selected voice name.
 */
export function getCurrentVoiceName(): string | null {
  return currentVoice?.name ?? null;
}

/**
 * Speak text using the Web Speech API (local) or Hermes TTS (high quality).
 *
 * If opts.highQuality is true, calls /api/hermes/tts for ElevenLabs/MiniMax
 * voice and plays the returned audio. Otherwise uses the Web Speech API.
 */
export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (!text.trim()) return;

  // Cancel any existing speech
  stop();

  if (opts.highQuality) {
    await speakViaHermes(text, opts);
  } else {
    speakViaWebSpeech(text, opts);
  }
}

/**
 * Stop all speech (both Web Speech API and Hermes audio).
 */
let hermesAudio: HTMLAudioElement | null = null;

export function stop(): void {
  const s = getSynth();
  if (s) {
    s.cancel();
  }
  currentUtterance = null;

  if (hermesAudio) {
    try {
      hermesAudio.pause();
      hermesAudio.src = "";
      hermesAudio = null;
    } catch {
      /* ignore */
    }
  }
}

/**
 * Check if speech is currently in progress.
 */
export function isSpeaking(): boolean {
  const s = getSynth();
  return (s?.speaking ?? false) || hermesAudio !== null;
}

// ── Web Speech API path ─────────────────────────────────────────────────

function speakViaWebSpeech(text: string, opts: SpeakOptions): void {
  const s = getSynth();
  if (!s) {
    opts.onError?.("Speech synthesis not supported in this browser");
    return;
  }

  // Ensure voices are loaded
  if (!voicesReady) loadVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  activeCallbacks = opts;

  // Voice selection
  const voiceName = opts.voiceName;
  let voice: SpeechSynthesisVoice | null = null;
  if (voiceName) {
    voice = cachedVoices.find((v) => v.name === voiceName || v.voiceURI === voiceName) ?? null;
  }
  if (!voice && currentVoice) {
    voice = currentVoice;
  }
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }

  // Settings
  utterance.rate = opts.rate ?? 1.0;
  utterance.pitch = opts.pitch ?? 1.0;
  utterance.volume = opts.volume ?? 1.0;

  // Callbacks
  utterance.onstart = () => {
    opts.onStart?.();
  };
  utterance.onend = () => {
    currentUtterance = null;
    opts.onEnd?.();
  };
  utterance.onerror = (e) => {
    currentUtterance = null;
    opts.onError?.(e.error || "speech error");
  };
  utterance.onboundary = (e) => {
    opts.onBoundary?.(e.charIndex);
  };

  currentUtterance = utterance;

  // Chrome bug: sometimes need to cancel first, then speak
  s.cancel();
  // Small delay to avoid the cancel-race
  setTimeout(() => {
    s.speak(utterance);
  }, 10);
}

// ── Hermes TTS path ─────────────────────────────────────────────────────

async function speakViaHermes(text: string, opts: SpeakOptions): Promise<void> {
  try {
    opts.onStart?.();

    const r = await fetch("/api/hermes/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.slice(0, 2500),
        voiceId: opts.voiceId,
        provider: opts.provider ?? "elevenlabs",
      }),
    });

    const j = await r.json();

    if (!j.audio) {
      opts.onError?.(j.error || "TTS returned no audio");
      opts.onEnd?.();
      return;
    }

    // Play the audio
    const audio = new Audio(j.audio);
    hermesAudio = audio;

    audio.onended = () => {
      hermesAudio = null;
      opts.onEnd?.();
    };
    audio.onerror = () => {
      hermesAudio = null;
      opts.onError?.("audio playback error");
      opts.onEnd?.();
    };

    await audio.play();
  } catch (e) {
    hermesAudio = null;
    opts.onError?.(String(e));
    opts.onEnd?.();
  }
}

// ── Utility ─────────────────────────────────────────────────────────────

/**
 * Generate a greeting based on time of day.
 */
export function timeGreeting(name?: string): string {
  const h = new Date().getHours();
  const n = name ? `, ${name}` : "";
  if (h < 5) return `Burning the midnight oil${n}`;
  if (h < 12) return `Good morning${n}`;
  if (h < 18) return `Good afternoon${n}`;
  return `Good evening${n}`;
}

/**
 * Generate a full Jarvis-style greeting with date and time.
 */
export function jarvisGreeting(name?: string): string {
  const greeting = timeGreeting(name);
  const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${greeting}. It's ${time} on ${date}. All systems online. What shall we accomplish today?`;
}