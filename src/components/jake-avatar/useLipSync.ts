"use client";

import { useRef, useCallback, useEffect, useState } from "react";

export interface LipSyncState {
  /** 0–1 mouth open amount */
  mouthOpen: number;
  /** 0–1 eye glow intensity */
  eyeGlow: number;
  /** true while audio is playing */
  isSpeaking: boolean;
}

/**
 * Analyses audio from an HTMLAudioElement or MediaStream via the Web Audio API
 * and drives mouth / eye animation values at ~60 fps.
 */
export function useLipSync() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);

  const [state, setState] = useState<LipSyncState>({
    mouthOpen: 0,
    eyeGlow: 0,
    isSpeaking: false,
  });

  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  /** Connect an HTMLAudioElement for analysis */
  const connectAudio = useCallback((audio: HTMLAudioElement) => {
    const ctx = ensureCtx();
    if (ctx.state === "suspended") ctx.resume();

    // Disconnect previous source
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch { /* noop */ }
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    analyserRef.current = analyser;
    sourceRef.current = source;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
  }, [ensureCtx]);

  /** Connect a MediaStream (microphone) for analysis — does NOT route to destination */
  const connectStream = useCallback((stream: MediaStream) => {
    const ctx = ensureCtx();
    if (ctx.state === "suspended") ctx.resume();

    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch { /* noop */ }
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    analyserRef.current = analyser;
    sourceRef.current = source;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
  }, [ensureCtx]);

  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation loop
  useEffect(() => {
    const tick = () => {
      const analyser = analyserRef.current;
      const data = dataArrayRef.current;
      if (!analyser || !data) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      analyser.getByteFrequencyData(data);

      // Compute RMS amplitude from lower frequencies (voice range 80–3000 Hz ≈ bins 2–40)
      let sum = 0;
      const voiceBins = Math.min(40, data.length);
      for (let i = 2; i < voiceBins; i++) {
        sum += data[i];
      }
      const avg = sum / ((voiceBins - 2) * 255);
      const mouthOpen = Math.min(1, avg * 2.5);

      // Speaking detection with hysteresis
      const speaking = mouthOpen > 0.08;
      if (speaking) {
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = null;
      }

      setState((prev) => {
        const nowSpeaking = speaking || (prev.isSpeaking && mouthOpen > 0.03);
        return {
          mouthOpen,
          eyeGlow: nowSpeaking ? 0.6 + mouthOpen * 0.4 : 0.15,
          isSpeaking: nowSpeaking,
        };
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch { /* noop */ }
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return { ...state, connectAudio, connectStream };
}
