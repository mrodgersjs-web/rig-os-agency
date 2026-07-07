"use client";

import { useEffect, useCallback } from "react";
import AvatarScene from "./AvatarScene";
import { useLipSync } from "./useLipSync";
import { useJakeVoice } from "./useJakeVoice";

interface JakeAvatarProps {
  /** Text to speak — triggers TTS when set */
  text?: string;
  /** Called when speaking finishes */
  onSpeakEnd?: () => void;
}

export default function JakeAvatar({ text, onSpeakEnd }: JakeAvatarProps) {
  const { mouthOpen, eyeGlow, isSpeaking, connectAudio } = useLipSync();

  const { speak, status, error } = useJakeVoice({
    onAudioElement: (el) => connectAudio(el),
  });

  // Auto-speak when text changes
  useEffect(() => {
    if (text && text.trim()) {
      speak(text).then(() => onSpeakEnd?.());
    }
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-full">
      <AvatarScene mouthOpen={mouthOpen} eyeGlow={eyeGlow} isSpeaking={isSpeaking} />

      {/* Status overlay */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            background: status === "speaking" ? "#00ffc8" : status === "loading" ? "#d4a574" : status === "error" ? "#c4607e" : "#3a3a5a",
          }}
        />
        <span
          className="text-[10px] uppercase tracking-wider font-mono"
          style={{ color: "var(--cream-dim, #a59783)" }}
        >
          {status === "speaking" ? "SPEAKING" : status === "loading" ? "SYNTHESIZING" : status === "error" ? "ERROR" : "STANDBY"}
        </span>
      </div>

      {error && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono px-2 py-1 rounded" style={{ color: "#c4607e", background: "rgba(196,96,126,0.1)" }}>
          {error}
        </div>
      )}
    </div>
  );
}
