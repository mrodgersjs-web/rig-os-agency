"use client";

import { motion } from "framer-motion";
import {
  Wand2, Sparkles, Zap, Image as ImageIcon, Layers, Palette,
  CheckCircle2, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const DESIGN_TOKENS = [
  { name: "--bg-deep", color: "#15101a", label: "Midnight base" },
  { name: "--bg-card", color: "#251d2c", label: "Aubergine card" },
  { name: "--cream", color: "#f3ebda", label: "Cream text" },
  { name: "--gold", color: "#d4a574", label: "Gold accent" },
  { name: "--emerald", color: "#5ab896", label: "Emerald success" },
  { name: "--plum", color: "#c4607e", label: "Plum alert" },
  { name: "--rust", color: "#c97c5e", label: "Rust warm" },
  { name: "--gold-soft", color: "#e6c69a", label: "Gold soft" },
];

const CAPABILITIES = [
  { name: "Site Builder", icon: <Layers size={16} />, desc: "Production sites engineered to outlast the engagement." },
  { name: "Brand Assets", icon: <Palette size={16} />, desc: "Logo, palette, typography, motion language, voice." },
  { name: "Design System", icon: <Wand2 size={16} />, desc: "Midnight Aubergine — tokens, components, primitives." },
  { name: "Higgsfield Cinema", icon: <Sparkles size={16} />, desc: "Image generation via Cinema Studio 3.0. Mike soul IDs: 9257aaf0, a4c09954." },
  { name: "Image Pipeline", icon: <ImageIcon size={16} />, desc: "16:9, cultural-parody style, NO TEXT in images, Mike IN every image." },
  { name: "Reverse Render", icon: <Zap size={16} />, desc: "Retrofit existing sites with the RIG design system." },
];

const PROJECTS = [
  { name: "rodgersintelligence.com", status: "live", accent: "var(--emerald)" },
  { name: "RIG LinkedIn Creative", status: "daily", accent: "var(--gold)" },
  { name: "RIG Agent OS Dashboard", status: "building", accent: "var(--gold-soft)" },
  { name: "TransformFit UI", status: "design", accent: "#22d3ee" },
];

export default function RigDesignPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Wand2 size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Studios
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Design <span className="hand text-[1.2em]" style={{ color: "var(--gold)" }}>Studio</span>
        </h1>
        <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          Brand · Sites · Creative Direction · Higgsfield Cinema. Midnight Aubergine design system.
          BDF target ≥85σ. Every image Mike is IN. No text in images.
        </p>
      </motion.section>

      {/* KPIs */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Design System", value: "Midnight Aubergine", icon: <Palette size={18} />, accent: "var(--gold)" },
            { label: "Image Engine", value: "Higgsfield 3.0", icon: <Sparkles size={18} />, accent: "var(--plum)" },
            { label: "Mike Soul ID", value: "9257aaf0", icon: <ImageIcon size={18} />, accent: "var(--gold-soft)" },
            { label: "BDF Target", value: "≥85σ", icon: <Zap size={18} />, accent: "var(--emerald)" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{kpi.label}</span>
              </div>
              <div className="text-[18px]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: kpi.accent }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Design Tokens */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>I.</span> Design System Tokens
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DESIGN_TOKENS.map((token) => (
            <div key={token.name} className="rounded-xl p-3 border flex items-center gap-3" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="w-8 h-8 rounded-md shrink-0 border" style={{ background: token.color, borderColor: "var(--line)" }} />
              <div className="min-w-0">
                <code className="text-[10px] block" style={{ color: "var(--cream-soft)" }}>{token.name}</code>
                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{token.label}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Capabilities */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>II.</span> Capabilities
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap) => (
            <div key={cap.name} className="rounded-xl p-4 border h-full" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="grid place-items-center w-9 h-9 rounded-lg mb-3" style={{ background: "rgba(212,165,116,0.12)", color: "var(--gold)", border: "1px solid rgba(212,165,116,0.3)" }}>
                {cap.icon}
              </div>
              <h3 className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{cap.name}</h3>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>{cap.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Active Projects */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>III.</span> Active Projects
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="space-y-2">
          {PROJECTS.map((p) => (
            <div key={p.name} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <span className="text-[14px] font-medium" style={{ color: "var(--cream)" }}>{p.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: `${p.accent === "var(--emerald)" ? "rgba(90,184,150,0.15)" : "rgba(212,165,116,0.15)"}`, color: p.accent }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Image Rules */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line)" }}>
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: "var(--cream)" }}>Image Generation Rules</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["NO TEXT in images", "Mike IN every image", "16:9 aspect ratio", "Cultural-parody style"].map((rule) => (
              <div key={rule} className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: "var(--emerald)" }} />
                <span className="text-[12px]" style={{ color: "var(--cream-soft)" }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
