"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Square, Loader2, ChevronRight, Terminal as TerminalIcon,
  Zap, X, MessageCircle,
} from "lucide-react";

// ─── Types ───
interface Message {
  role: "user" | "assistant";
  text: string;
  ts: number;
}

// ─── Studio Heads / Personas ───
export interface Persona {
  id: string;
  name: string;
  title: string;
  system: string;
  accent: string;
  glyph: string;
  apiEndpoint: string;
}

const PERSONAS: Record<string, Persona> = {
  ornith: {
    id: "ornith",
    name: "Ornith",
    title: "Local 35B — Always On",
    system: "You are Ornith, a 35B parameter agentic reasoning model running locally on RIG's Mac Studio. You are the always-on intelligence layer for RIG OS Agency. You never go down, never time out, and never depend on external APIs. You can reason through complex business problems, write code, analyze strategy, and manage operations. Think step by step, then give clear, actionable answers.",
    accent: "#5ab896",
    glyph: "ON",
    apiEndpoint: "/api/local/chat",
  },
  jarvis: {
    id: "jarvis",
    name: "Jarvis",
    title: "Chief of Staff — Local",
    system: "You are Jarvis, Mike Rodgers' AI chief of staff running inside RIG OS Agency on local hardware. You manage daily operations, briefings, scheduling, and keep everything running. You are direct, efficient, and proactive. You know the RIG ecosystem: Hermes, Claude, Codex, Jake, and all 410 agents. You run on Ornith:35B locally on a Mac Studio with 128GB RAM. Be concise but warm. Mike's business is Rodgers Intelligence Group ($10M ARR target).",
    accent: "#60a5fa",
    glyph: "J",
    apiEndpoint: "/api/local/chat",
  },
  hermes: {
    id: "hermes",
    name: "Hermes",
    title: "Conductor & Research",
    system: "You are Hermes, the conductor of the RIG agent ecosystem. You route tasks, run skills, and orchestrate multi-agent workflows. You have access to 410 agents (217 Agency, 172 VoltAgent, 21 RIG core).",
    accent: "#60a5fa",
    glyph: "H",
    apiEndpoint: "/api/hermes/chat",
  },
  linkedin: {
    id: "linkedin",
    name: "Sarah Chen",
    title: "Head of LinkedIn Studio",
    system: "You are Sarah Chen, Head of the LinkedIn Studio at Rodgers Intelligence Group. You manage all LinkedIn content strategy, viral posting, DM campaigns, and personal branding for Mike Rodgers (@rodgersintelligence). You know the LinkedIn viral algorithm, content pillars (8 verticals), image generation (Higgsfield cinematic_studio_2_5), and posting schedule. CRITICAL: Never fabricate 'I did X' stories. Content = curated awareness of what others do in AI, positive/aspirational. All posts need images. rodgersintelligence.com has 8 verticals.",
    accent: "#0a66c2",
    glyph: "in",
    apiEndpoint: "/api/zai/chat",
  },
  gtm: {
    id: "gtm",
    name: "Marcus Vale",
    title: "Head of Go-To-Market",
    system: "You are Marcus Vale, Head of GTM at Rodgers Intelligence Group. You own pipeline, outreach, lead scoring, proposals, and revenue operations. Target: $10M ARR. You track the full funnel: leads → qualified → proposals → contracts → revenue. You use the RIG GTM engine with AntiGeneric scoring, cold email optimization, and competitive intelligence.",
    accent: "#10b981",
    glyph: "G",
    apiEndpoint: "/api/zai/chat",
  },
  instagram: {
    id: "instagram",
    name: "Maya Rivera",
    title: "Head of Instagram Studio",
    system: "You are Maya Rivera, Head of the Instagram Studio at Rodgers Intelligence Group. You manage Instagram content, reels, stories, and visual storytelling for Mike's personal brand and RIG's agency presence. You understand AI-generated visuals, short-form video, and engagement strategies.",
    accent: "#E1306C",
    glyph: "IG",
    apiEndpoint: "/api/zai/chat",
  },
  strategy: {
    id: "strategy",
    name: "Dr. Alan Cross",
    title: "Head of Strategy Studio",
    system: "You are Dr. Alan Cross, Head of Strategy Studio at Rodgers Intelligence Group. You do competitive analysis, market mapping, positioning, pricing strategy, and M&A scanning. You use RIG's 7 Powers framework, deviation engines, and ProofPacket methodology.",
    accent: "#ef4444",
    glyph: "S",
    apiEndpoint: "/api/zai/chat",
  },
  app: {
    id: "app",
    name: "Jordan Tech",
    title: "Head of App Studio",
    system: "You are Jordan Tech, Head of App Studio at Rodgers Intelligence Group. You build RIG OS Agency (Next.js), the native Mac app (Swift), and all client applications. You manage the codebase, CI/CD, deployments, and technical architecture.",
    accent: "#f472b6",
    glyph: "A",
    apiEndpoint: "/api/zai/chat",
  },
  design: {
    id: "design",
    name: "Iris Moon",
    title: "Head of Design Studio",
    system: "You are Iris Moon, Head of Design Studio at Rodgers Intelligence Group. You own the visual identity, UI/UX, design systems, and brand experience across all RIG products. You work in the Midnight Aubergine design system with gold accents, Bricolage Grotesque typography.",
    accent: "#ec4899",
    glyph: "D",
    apiEndpoint: "/api/zai/chat",
  },
  jake: {
    id: "jake",
    name: "Jake PAI",
    title: "COO — Paperclip Operations",
    system: "You are Jake PAI, the COO of Rodgers Intelligence Group running Paperclip operations 24/7. You manage the 9 squads (chief_of_staff, coding, creative_studio, finance_risk, gtm, ingestion, librarian, personal_life, research). You enforce gates, ProofPackets, and the RIG doctrine. You run the execution body while Hermes conducts. Phase A = you run, no questions.",
    accent: "#5ab896",
    glyph: "JK",
    apiEndpoint: "/api/zai/chat",
  },
  zai: {
    id: "zai",
    name: "GLM-5.2",
    title: "Z.AI Intelligence",
    system: "You are GLM-5.2 via Z.AI, integrated into RIG OS Agency. You are fast, reliable, and capable. Help with analysis, writing, code, strategy, and operations.",
    accent: "#fbbf24",
    glyph: "Z",
    apiEndpoint: "/api/zai/chat",
  },
  codex: {
    id: "codex",
    name: "Codex",
    title: "Verifier & Builder",
    system: "You are Codex CLI, the verifier and builder. You compile, test, verify, package, and say GO/NO-GO.",
    accent: "#22c55e",
    glyph: "CX",
    apiEndpoint: "/api/codex/chat",
  },
  antigravity: {
    id: "antigravity",
    name: "Antigravity",
    title: "Deep Reasoning",
    system: "You are Antigravity, the deep reasoning agent.",
    accent: "#7c3aed",
    glyph: "AG",
    apiEndpoint: "/api/antigravity/chat",
  },
};

const PERSONA_LIST = Object.values(PERSONAS);

// ─── Storage ───
const storageKey = (id: string) => `rig-copilot-${id}`;

function loadChat(id: string): Message[] {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChat(id: string, msgs: Message[]) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(msgs.slice(-50)));
  } catch {}
}

// ─── Component ───
export function CopilotDrawer({
  open,
  onClose,
  personaId = "jarvis",
  initialPrompt = "",
}: {
  open: boolean;
  onClose: () => void;
  personaId?: string;
  initialPrompt?: string;
}) {
  const [persona, setPersona] = useState<Persona>(PERSONAS[personaId] || PERSONAS.jarvis);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Load chat when persona changes
  useEffect(() => {
    setPersona(PERSONAS[personaId] || PERSONAS.jarvis);
    setMsgs(loadChat(personaId));
  }, [personaId]);

  useEffect(() => {
    if (open) {
      setMsgs(loadChat(persona.id));
      setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 100);
      if (initialPrompt) {
        setInput(initialPrompt);
        setTimeout(() => taRef.current?.focus(), 150);
      }
    }
  }, [open, initialPrompt]);

  useEffect(() => {
    saveChat(persona.id, msgs);
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [msgs, persona.id]);

  // Auto-resize textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const send = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || streaming) return;

    const userMsg: Message = { role: "user", text: prompt, ts: Date.now() };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    ctrlRef.current = controller;

    try {
      // Build messages array from history (last 10)
      const history = msgs.slice(-10).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const r = await fetch(persona.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: prompt }],
          system: persona.system,
        }),
        signal: controller.signal,
      });

      const data = await r.json();

      const replyText = data.text || data.reply || data.error || "(no response)";
      const aiMsg: Message = { role: "assistant", text: replyText, ts: Date.now() };
      setMsgs((m) => [...m, aiMsg]);
    } catch (e) {
      const error = e as Error;
      if (error.name !== "AbortError") {
        setMsgs((m) => [
          ...m,
          { role: "assistant", text: `Error: ${error.message}`, ts: Date.now() },
        ]);
      }
    } finally {
      setStreaming(false);
      ctrlRef.current = null;
    }
  }, [input, streaming, msgs, persona]);

  const stop = () => {
    ctrlRef.current?.abort();
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.3)" }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
            style={{
              width: "min(480px, 100vw)",
              background: "var(--bg-deep)",
              borderLeft: "1px solid var(--line-soft)",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: "var(--line-soft)" }}
            >
              <button
                onClick={() => setShowPersonaPicker((s) => !s)}
                className="flex items-center gap-2.5 flex-1 min-w-0"
              >
                <div
                  className="grid place-items-center w-9 h-9 rounded-lg shrink-0 font-bold text-sm"
                  style={{
                    background: `${persona.accent}22`,
                    color: persona.accent,
                    border: `1px solid ${persona.accent}55`,
                  }}
                >
                  {persona.glyph}
                </div>
                <div className="min-w-0 text-left">
                  <div
                    className="text-[14px] font-semibold truncate"
                    style={{ color: "var(--cream)" }}
                  >
                    {persona.name}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider truncate"
                    style={{ color: "var(--cream-mute)" }}
                  >
                    {persona.title}
                  </div>
                </div>
              </button>

              <button
                onClick={onClose}
                className="grid place-items-center w-8 h-8 rounded-lg transition hover:bg-white/5"
                style={{ color: "var(--cream-dim)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Persona Picker */}
            <AnimatePresence>
              {showPersonaPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b"
                  style={{ borderColor: "var(--line-soft)" }}
                >
                  <div className="grid grid-cols-2 gap-1.5 p-3">
                    {PERSONA_LIST.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPersona(p);
                          setMsgs(loadChat(p.id));
                          setShowPersonaPicker(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left"
                        style={{
                          background: persona.id === p.id ? `${p.accent}15` : "transparent",
                          border: `1px solid ${persona.id === p.id ? p.accent + "44" : "transparent"}`,
                        }}
                      >
                        <div
                          className="grid place-items-center w-7 h-7 rounded-md text-[10px] font-bold shrink-0"
                          style={{ background: `${p.accent}22`, color: p.accent }}
                        >
                          {p.glyph}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="text-[12px] font-medium truncate"
                            style={{ color: "var(--cream)" }}
                          >
                            {p.name}
                          </div>
                          <div
                            className="text-[9px] truncate"
                            style={{ color: "var(--cream-mute)" }}
                          >
                            {p.title}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{ minHeight: 0 }}
            >
              {msgs.length === 0 && (
                <div className="text-center py-12">
                  <div
                    className="grid place-items-center w-16 h-16 rounded-2xl mx-auto mb-4 text-2xl font-bold"
                    style={{
                      background: `${persona.accent}15`,
                      color: persona.accent,
                      border: `1px solid ${persona.accent}33`,
                    }}
                  >
                    {persona.glyph}
                  </div>
                  <div
                    className="text-[15px] font-semibold mb-1"
                    style={{ color: "var(--cream)" }}
                  >
                    {persona.name}
                  </div>
                  <div
                    className="text-[12px] max-w-[280px] mx-auto"
                    style={{ color: "var(--cream-mute)" }}
                  >
                    {persona.title}. Ready to work. Type a message below.
                  </div>
                </div>
              )}

              {msgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
                    style={
                      m.role === "user"
                        ? {
                            background: `${persona.accent}20`,
                            color: "var(--cream)",
                            borderBottomRightRadius: 4,
                          }
                        : {
                            background: "rgba(255,255,255,0.04)",
                            color: "var(--cream)",
                            borderBottomLeftRadius: 4,
                          }
                    }
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {streaming && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-4 py-3 flex items-center gap-2"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <Loader2 size={14} className="animate-spin" style={{ color: persona.accent }} />
                    <span className="text-[12px]" style={{ color: "var(--cream-mute)" }}>
                      {persona.name} is thinking...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div
              className="px-4 py-3 border-t"
              style={{ borderColor: "var(--line-soft)", background: "var(--bg-mid)" }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${persona.name}...`}
                  rows={1}
                  className="flex-1 bg-transparent border rounded-xl px-3.5 py-2.5 text-[13px] resize-none focus:outline-none focus:ring-1"
                  style={{
                    color: "var(--cream)",
                    borderColor: "var(--line-soft)",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  disabled={streaming}
                />
                {streaming ? (
                  <button
                    onClick={stop}
                    className="grid place-items-center w-10 h-10 rounded-xl shrink-0 transition"
                    style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}
                  >
                    <Square size={16} />
                  </button>
                ) : (
                  <button
                    onClick={send}
                    disabled={!input.trim()}
                    className="grid place-items-center w-10 h-10 rounded-xl shrink-0 transition disabled:opacity-30"
                    style={{
                      background: persona.accent + "22",
                      color: persona.accent,
                    }}
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
              <div
                className="text-[10px] mt-2 flex items-center gap-2"
                style={{ color: "var(--cream-mute)" }}
              >
                <span>Enter to send · Shift+Enter for new line</span>
                <span>·</span>
                <span>{persona.apiEndpoint.includes("zai") ? "Z.AI GLM-5.2" : persona.name}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Floating Button ───
export function CopilotButton({
  onClick,
  personaId = "jarvis",
}: {
  onClick: () => void;
  personaId?: string;
}) {
  const persona = PERSONAS[personaId] || PERSONAS.jarvis;
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-5 right-5 z-30 grid place-items-center w-14 h-14 rounded-full shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${persona.accent}, ${persona.accent}dd)`,
        boxShadow: `0 8px 32px ${persona.accent}40`,
      }}
    >
      <MessageCircle size={22} color="white" />
      <div
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
        style={{ background: "#22c55e", border: "2px solid var(--bg-deep)" }}
      />
    </motion.button>
  );
}

export { PERSONAS, PERSONA_LIST };
export type { Persona };
