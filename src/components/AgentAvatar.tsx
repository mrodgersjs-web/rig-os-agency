"use client";

import { motion } from "framer-motion";

export type AgentKey = "claude" | "openclaw" | "hermes" | "gemini" | "antigravity" | "fcc" | "codex";

interface Props {
  agent: AgentKey;
  size?: number;
  pulse?: boolean;
}

const STYLE: Record<AgentKey, {
  accent: string;
  bg: string;
  gradient: string;
  label: string;
  glyph: (size: number) => React.ReactNode;
}> = {
  claude: {
    accent: "#d97757",
    bg: "rgba(217,119,87,0.18)",
    gradient: "linear-gradient(135deg, #f4a07a, #c0563a)",
    label: "Claude",
    glyph: (s) => (
      <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2 L13.6 9 L21 10.4 L13.6 12.4 L12 22 L10.4 12.4 L3 10.4 L10.4 9 Z"
          fill="white"
          opacity="0.95"
        />
      </svg>
    ),
  },
  openclaw: {
    accent: "#f472b6",
    bg: "rgba(244,114,182,0.18)",
    gradient: "linear-gradient(135deg, #fda4d3, #c9268f)",
    label: "OpenClaw",
    glyph: (s) => (
      // Stylized claw mark
      <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round">
        <path d="M5 4 C 8 8, 8 14, 5 19" opacity="0.95" />
        <path d="M11 3 C 14 7, 14 16, 11 21" opacity="0.95" />
        <path d="M17 5 C 19 9, 19 15, 17 20" opacity="0.95" />
      </svg>
    ),
  },
  hermes: {
    accent: "#60a5fa",
    bg: "rgba(96,165,250,0.18)",
    gradient: "linear-gradient(135deg, #93c5fd, #2563eb)",
    label: "Hermes",
    glyph: (s) => (
      // Caduceus-style wing mark
      <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3 L12 21 M12 5 C 8 8, 6 7, 4 5 C 6 9, 9 10, 12 9 C 15 10, 18 9, 20 5 C 18 7, 16 8, 12 5"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <circle cx="12" cy="3" r="1.2" fill="white" opacity="0.95" />
      </svg>
    ),
  },
  gemini: {
    // Google's Gemini palette — blue/red/yellow/green sweep + the four-pointed star glyph.
    accent: "#4285F4",
    bg: "rgba(66,133,244,0.18)",
    gradient: "linear-gradient(135deg, #4285F4 0%, #9b72cb 35%, #d96570 65%, #f9ab00 100%)",
    label: "Gemini",
    glyph: (s) => (
      <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 4 L13 10 L18 12 L13 14 L12 20 L11 14 L6 12 L11 10 Z"
          fill="white"
          opacity="0.98"
        />
      </svg>
    ),
  },
  fcc: {
    // Free Claude Code = the open-source proxy sibling. Green/emerald gradient to
    // signal "free", with a stylised owl glyph (the default upstream is Owl Alpha).
    accent: "#10b981",
    bg: "rgba(16,185,129,0.18)",
    gradient: "linear-gradient(135deg, #34d399 0%, #10b981 60%, #065f46 100%)",
    label: "Free Claude Code",
    glyph: (s) => (
      <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24" fill="none">
        {/* Owl silhouette: two big round eyes + small triangle beak + ear tufts */}
        <path
          d="M5 4 L7 7 M19 4 L17 7"
          stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.95"
        />
        <circle cx="9" cy="11" r="3.2" fill="white" opacity="0.95" />
        <circle cx="15" cy="11" r="3.2" fill="white" opacity="0.95" />
        <circle cx="9" cy="11" r="1.2" fill="#065f46" />
        <circle cx="15" cy="11" r="1.2" fill="#065f46" />
        <path
          d="M11 14 L12 16 L13 14 Z"
          fill="white" opacity="0.9"
        />
        <path
          d="M6 17 C 8 19, 16 19, 18 17"
          stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85"
        />
      </svg>
    ),
  },
  codex: {
    // Codex (OpenAI) — onyx/charcoal gradient + open-spiral mark (riff on the
    // OpenAI logo without copying it). Sits visually between Claude and Gemini.
    accent: "#22c55e",
    bg: "rgba(34,197,94,0.18)",
    gradient: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 45%, #166534 100%)",
    label: "Codex",
    glyph: (s) => (
      <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24" fill="none">
        {/* Six-petal rosette à la OpenAI mark, rendered with thin strokes */}
        <g stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.96">
          <path d="M12 4 C 16 6, 16 10, 12 12 C 8 10, 8 6, 12 4 Z" />
          <path d="M19 8.5 C 19 12.5, 16 14.5, 12 12 C 12.5 8, 15.5 6.5, 19 8.5 Z" />
          <path d="M19 15.5 C 16 18, 13 16.5, 12 12 C 16 11, 18.5 12.5, 19 15.5 Z" />
          <path d="M12 20 C 8 18, 8 14, 12 12 C 16 14, 16 18, 12 20 Z" />
          <path d="M5 15.5 C 5.5 12.5, 8.5 11, 12 12 C 11 16.5, 8 18, 5 15.5 Z" />
          <path d="M5 8.5 C 8 6.5, 11.5 8, 12 12 C 8 14.5, 5 12.5, 5 8.5 Z" />
        </g>
      </svg>
    ),
  },
  antigravity: {
    // Antigravity = the "deep-space" sibling. Indigo + violet gradient with an orbital ring.
    accent: "#7c3aed",
    bg: "rgba(124,58,237,0.18)",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 40%, #7c3aed 70%, #a855f7 100%)",
    label: "Antigravity",
    glyph: (s) => (
      <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24" fill="none">
        {/* Inverted-gravity arrow shooting up out of a planet's surface */}
        <ellipse cx="12" cy="18.5" rx="7.5" ry="2.4" fill="none" stroke="white" strokeWidth="1.2" opacity="0.55" />
        <path
          d="M12 3 L12 17 M12 3 L9 6.5 M12 3 L15 6.5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.98"
        />
        <circle cx="12" cy="3" r="1.3" fill="white" opacity="0.98" />
      </svg>
    ),
  },
};

export default function AgentAvatar({ agent, size = 36, pulse = false }: Props) {
  const s = STYLE[agent];
  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 380, damping: 25 }}
      className="relative inline-grid place-items-center rounded-full overflow-hidden shrink-0"
      style={{
        width: size,
        height: size,
        background: s.gradient,
        boxShadow: `0 0 ${size}px -${size / 3}px ${s.accent}, inset 0 0 0 1px rgba(255,255,255,0.12)`,
      }}
      aria-label={s.label}
    >
      {s.glyph(size)}
      {pulse && (
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: `0 0 0 0 ${s.accent}`,
            animation: "avatar-pulse 1.8s ease-out infinite",
          }}
        />
      )}
      <style jsx>{`
        @keyframes avatar-pulse {
          0%   { box-shadow: 0 0 0 0 ${s.accent}88; }
          70%  { box-shadow: 0 0 0 ${size * 0.5}px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
    </motion.span>
  );
}

export function agentColor(agent: AgentKey): string {
  return STYLE[agent].accent;
}
export function agentBg(agent: AgentKey): string {
  return STYLE[agent].bg;
}
export function agentLabel(agent: AgentKey): string {
  return STYLE[agent].label;
}
