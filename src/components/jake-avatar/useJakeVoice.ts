"use client";

import { useRef, useCallback, useState } from "react";

export type JakeVoiceStatus = "idle" | "loading" | "speaking" | "error";

/**
 * Hook to call Edge TTS for Jake's voice and play the resulting audio.
 * Integrates with useLipSync for real-time mouth animation.
 */
export function useJakeVoice(opts?: { onAudioElement?: (el: HTMLAudioElement) => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<JakeVoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  /**
   * Speak text using Edge TTS. Streams audio via a server endpoint.
   * The optional `onAudioElement` callback fires before playback so
   * the caller can hook into Web Audio for lip-sync analysis.
   */
  const speak = useCallback(async (text: string) => {
    try {
      setStatus("loading");
      setError(null);

      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Call the Edge TTS endpoint
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: "en-US-GuyNeural", // Jake's voice
          rate: "+10%",
          pitch: "-5Hz",
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error ?? `TTS failed: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;

      // Let the caller connect for lip-sync
      opts?.onAudioElement?.(audio);

      audio.onended = () => {
        setStatus("idle");
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setStatus("error");
        setError("Audio playback failed");
        URL.revokeObjectURL(url);
      };

      await audio.play();
      setStatus("speaking");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown TTS error");
    }
  }, [opts]);

  /** Stop current playback */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setStatus("idle");
  }, []);

  return { speak, stop, status, error };
}
