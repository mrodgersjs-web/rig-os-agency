"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CommandPalette from "./CommandPalette";

interface PageMeta { numeral: string; label: string; title: string; sub: string; }

// Roman numeral + chapter label per route (Midnight Aubergine design system).
// numeral renders in Caveat gold, label in small-caps Manrope. See globals.css `.eyebrow`.
const TITLES: Record<string, PageMeta> = {
  "/":            { numeral: "I.",    label: "Mission Control",    title: "Mission Control",         sub: "Status of every agent, every memory, every signal." },
  "/claude":      { numeral: "II.",   label: "Agent · Claude",     title: "Claude",                  sub: "Direct streaming channel to your Claude Code CLI. Voice in, auto-logged to Obsidian." },
  "/openclaw":    { numeral: "III.",  label: "Agent · OpenClaw",   title: "OpenClaw",                sub: "Chat one-shot or open the control room. Logged to your vault." },
  "/hermes":      { numeral: "IV.",   label: "Agent · Hermes",     title: "Hermes",                  sub: "Nous Research agent. Sessions, skills, kanban — and a chat line." },
  "/gemini":      { numeral: "V.",    label: "Agent · Gemini",     title: "Gemini",                  sub: "Google's coding agent. Sunsets 18 June 2026 — use Antigravity for new work." },
  "/antigravity": { numeral: "VI.",   label: "Agent · Antigravity",title: "Antigravity",             sub: "Gemini's successor. Go-based, multi-agent harness, plugins, async workflows." },
  "/codex":       { numeral: "VII.",  label: "Agent · Codex",      title: "Codex",                   sub: "OpenAI's coding agent. Chat, set long-running goals, preview anything it builds." },
  "/freeclaude":  { numeral: "VIII.", label: "Agent · Free Claude Code", title: "Free Claude Code",  sub: "Open-source proxy. Same Claude CLI, routed through OpenRouter / Owl Alpha." },
  "/pipeline":    { numeral: "IX.",   label: "Self · Pipeline",    title: "From Inbox to Shipped",   sub: "Capture an idea → agents classify, route + plan it → you approve once → a PM + subagents build it. Lives in your vault." },
  "/goals":       { numeral: "X.",    label: "Self · Goals",       title: "Goals",                   sub: "Set targets. Tick them off. Watch the bar fill. Saved to Goals.md." },
  "/seo":         { numeral: "X.",    label: "Self · SEO Pipeline",title: "SEO Content Pipeline",    sub: "Pick a keyword + transcript. Generate 5 unique articles. Deploy to your Netlify funnel." },
  "/studio":      { numeral: "XI.",   label: "Self · Studio",      title: "Studio",                  sub: "Generate images, videos and speech with Hermes. Voice in, preview inline, save to vault." },
  "/notebook":    { numeral: "XII.",  label: "Self · Notebook",    title: "Notebook",                sub: "Your NotebookLM notebooks, audio overviews and chats — all in one place, synced to Obsidian." },
  "/kanban":      { numeral: "XIII.", label: "Self · Kanban",      title: "Kanban",                  sub: "Hermes Agent multi-agent board. Drop a prompt into triage, watch the orchestrator decompose + assign." },
  "/journal":     { numeral: "XIV.",  label: "Self · Journal",     title: "Journal",                 sub: "Daily entries with voice or text. One markdown file per day." },
  "/memory":      { numeral: "XV.",   label: "Self · Memory",      title: "Memory",                  sub: "Search 1261 Omi memories + your Obsidian vault." },
  "/guide":       { numeral: "XVI.",  label: "Build · Your Own",   title: "Build Your Own",          sub: "Step-by-step guide. Anyone can follow it. Share with your community." },
};

export default function TopBar() {
  const pathname = usePathname();
  const t = TITLES[pathname] ?? TITLES["/"];
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const set = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" }));
    set();
    const i = setInterval(set, 1000 * 15);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="flex items-start justify-between gap-6 mb-10">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-w-0"
      >
        {/* Chapter eyebrow — `I. ───── MISSION CONTROL` */}
        <div className="eyebrow">
          <span className="num">{t.numeral}</span>
          <span className="line" />
          <span className="label">{t.label}</span>
        </div>

        <h1 className="page-title">{t.title}</h1>
        <p className="page-subtitle">{t.sub}</p>

        <div className="mt-4 status-meta">
          <span className="hand">{time}</span>
          <span className="mx-2 opacity-40">·</span>
          Local · Studio
        </div>
      </motion.div>

      <div className="flex items-center gap-3 pt-2 shrink-0">
        <CommandPalette />
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--line-soft)] text-[11px]"
             style={{ color: "var(--cream-dim)", background: "rgba(243,235,218,0.02)" }}>
          <span className="inline-flex">
            <span className="tick live" style={{ color: "var(--gold)" }} />
            <span className="tick live" style={{ color: "var(--gold-soft)", animationDelay: ".15s" }} />
            <span className="tick live" style={{ color: "var(--emerald)", animationDelay: ".3s" }} />
            <span className="tick live" style={{ color: "var(--rust)", animationDelay: ".45s" }} />
          </span>
          <span className="uppercase tracking-widest" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            All systems
          </span>
        </div>
      </div>
    </header>
  );
}
