"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Bot, Activity, Shield, Users, Zap,
  Radio, Clock, CheckCircle2, AlertCircle, Volume2, VolumeX,
  Play, FileText, BarChart3, Settings, Brain, MessageSquare,
  ChevronDown, RefreshCw, Wifi, WifiOff,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// Jake PAI — RIG OS Agency Command Interface
// 3D avatar, chat, voice input, governor status, quick actions
// ────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "jake" | "system";
  content: string;
  timestamp: string;
  mode?: "text" | "voice";
}

interface GovernorStatus {
  online: boolean;
  agentsActive: number;
  daemonsRunning: number;
  lastTick: string;
  pendingApprovals: number;
  model: string;
}

const P = {
  canvas:  "#0A0A0F",
  card:    "#12121A",
  cardHover: "#1A1A25",
  line:    "#1E1E2E",
  lineSoft:"#161622",
  ink:     "#E8E8F0",
  ink2:    "#A8A8B8",
  ink3:    "#6B6B80",
  mute:    "#4A4A60",
  accent:  "#7C5CFC",
  accentBg:"rgba(124,92,252,0.12)",
  green:   "#10B981",
  greenBg: "rgba(16,185,129,0.12)",
  amber:   "#F59E0B",
  amberBg: "rgba(245,158,11,0.12)",
  red:     "#EF4444",
  redBg:   "rgba(239,68,68,0.12)",
};

const SANS = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, 'SF Mono', monospace";

function JakeAvatar({ speaking, size = 200 }: { speaking?: boolean; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${P.accent}33 0%, transparent 70%)`,
        }}
        animate={{
          scale: speaking ? [1, 1.1, 1] : 1,
          opacity: speaking ? [0.5, 0.8, 0.5] : 0.3,
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {/* Avatar container */}
      <div
        className="absolute inset-2 rounded-full overflow-hidden border-2"
        style={{
          borderColor: speaking ? P.accent : P.line,
          background: `linear-gradient(135deg, ${P.card} 0%, #1a1030 100%)`,
        }}
      >
        {/* Stylized Jake face */}
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Face circle */}
          <div
            className="w-3/5 h-3/5 rounded-full relative"
            style={{ background: `linear-gradient(180deg, #2a2040 0%, #1a1030 100%)` }}
          >
            {/* Eyes */}
            <motion.div
              className="absolute top-[35%] left-[25%] w-[12%] h-[12%] rounded-full"
              style={{ background: P.accent }}
              animate={{ opacity: speaking ? [1, 0.5, 1] : 1 }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.div
              className="absolute top-[35%] right-[25%] w-[12%] h-[12%] rounded-full"
              style={{ background: P.accent }}
              animate={{ opacity: speaking ? [1, 0.5, 1] : 1 }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }}
            />
            {/* Mouth */}
            <motion.div
              className="absolute bottom-[25%] left-1/2 -translate-x-1/2 rounded-full"
              style={{
                background: speaking ? P.accent : `${P.accent}66`,
                width: speaking ? "30%" : "20%",
                height: speaking ? "8%" : "4%",
              }}
              animate={speaking ? {
                height: ["8%", "12%", "8%", "6%", "10%", "8%"],
                width: ["30%", "25%", "32%", "28%", "30%"],
              } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          </div>
          {/* Label */}
          <div
            className="absolute bottom-2 text-[10px] font-bold tracking-wider uppercase"
            style={{ color: P.accent, fontFamily: MONO }}
          >
            JAKE
          </div>
        </div>
      </div>
      {/* Status dot */}
      <div
        className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2"
        style={{
          background: P.green,
          borderColor: P.canvas,
        }}
      />
    </div>
  );
}

function StatusBadge({ label, value, color, icon: Icon }: {
  label: string; value: string | number; color: string; icon: any;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ background: `${color}12`, border: `1px solid ${color}22` }}
    >
      <Icon size={14} style={{ color }} />
      <div>
        <div className="text-[9px] uppercase tracking-wider" style={{ color: P.ink3 }}>{label}</div>
        <div className="text-[13px] font-semibold" style={{ color, fontFamily: MONO }}>{value}</div>
      </div>
    </div>
  );
}

function QuickAction({ label, icon: Icon, onClick, accent }: {
  label: string; icon: any; onClick: () => void; accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all hover:scale-[1.02]"
      style={{
        background: P.card,
        border: `1px solid ${P.line}`,
        color: P.ink2,
        fontFamily: SANS,
      }}
    >
      <Icon size={14} style={{ color: accent || P.accent }} />
      {label}
    </button>
  );
}

export default function JakePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "jake",
      content: "Hey Mike. I'm online and monitoring all systems. Governor is active, 47 agents standing by. What do you need?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [governor, setGovernor] = useState<GovernorStatus>({
    online: true,
    agentsActive: 47,
    daemonsRunning: 12,
    lastTick: new Date().toISOString(),
    pendingApprovals: 3,
    model: "ornith:35b",
  });
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll governor status
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch("/api/jake/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" }),
        });
        if (r.ok) {
          const data = await r.json();
          if (data.governor) setGovernor(data.governor);
          setWsConnected(true);
        }
      } catch {
        setWsConnected(false);
      }
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(async (text: string, mode: "text" | "voice" = "text") => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
      mode,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await fetch("/api/jake/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), mode }),
      });
      const data = await resp.json();

      const jakeMsg: Message = {
        id: `jake-${Date.now()}`,
        role: "jake",
        content: data.response || "I'm processing that. Stand by.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, jakeMsg]);

      // Update governor status if returned
      if (data.governor) setGovernor(data.governor);
      
      // Play voice if available (ElevenLabs)
      if (data.hasVoice && data.voice) {
        try {
          const audio = new Audio("data:audio/mpeg;base64," + data.voice);
          setIsSpeaking(true);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          await audio.play();
        } catch {
          setIsSpeaking(false);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "system",
        content: "Connection issue. Retrying...",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleQuickAction = (action: string) => {
    const actions: Record<string, string> = {
      status: "Give me a full system status report",
      approvals: "What approvals are pending?",
      agents: "Show me active agents and their status",
      tick: "Run a governor tick now",
      report: "Generate today's performance report",
    };
    sendMessage(actions[action] || action);
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const toggleVoice = async () => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          
          // Send to Whisper API (or local faster-whisper)
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            // For now, send a placeholder — in production, send to /api/jake/transcribe
            sendMessage("[voice input received]", "voice");
          };
          reader.readAsDataURL(blob);
        };
        
        recorder.start();
        setIsListening(true);
        
        // Auto-stop after 30 seconds
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
            setIsListening(false);
          }
        }, 30000);
      } catch (err) {
        console.error("Microphone error:", err);
        sendMessage("[voice unavailable]", "voice");
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: P.canvas, fontFamily: SANS }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: P.line, background: P.card }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: P.accentBg }}
          >
            <Bot size={18} style={{ color: P.accent }} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold" style={{ color: P.ink }}>
              Jake PAI
            </h1>
            <p className="text-[10px]" style={{ color: P.ink3 }}>
              COO · Rodgers Intelligence Group
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {wsConnected ? (
              <Wifi size={12} style={{ color: P.green }} />
            ) : (
              <WifiOff size={12} style={{ color: P.red }} />
            )}
            <span className="text-[10px]" style={{ color: wsConnected ? P.green : P.red }}>
              {wsConnected ? "Live" : "Offline"}
            </span>
          </div>
          <div
            className="px-2 py-1 rounded text-[10px] font-mono"
            style={{ background: P.accentBg, color: P.accent }}
          >
            {governor.model}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Avatar + Status */}
        <aside
          className="w-[280px] border-r flex flex-col p-4 gap-4 overflow-y-auto shrink-0"
          style={{ borderColor: P.line, background: P.card }}
        >
          {/* Avatar */}
          <div className="flex justify-center py-4">
            <JakeAvatar speaking={isSpeaking || isLoading} size={180} />
          </div>

          {/* Governor Status */}
          <div className="space-y-2">
            <h3
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: P.ink3 }}
            >
              Governor Status
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatusBadge
                label="Status"
                value={governor.online ? "Online" : "Offline"}
                color={governor.online ? P.green : P.red}
                icon={governor.online ? CheckCircle2 : AlertCircle}
              />
              <StatusBadge
                label="Agents"
                value={governor.agentsActive}
                color={P.accent}
                icon={Users}
              />
              <StatusBadge
                label="Daemons"
                value={governor.daemonsRunning}
                color={P.amber}
                icon={Radio}
              />
              <StatusBadge
                label="Approvals"
                value={governor.pendingApprovals}
                color={governor.pendingApprovals > 0 ? P.amber : P.green}
                icon={Shield}
              />
            </div>
          </div>

          {/* Last tick */}
          <div
            className="px-3 py-2 rounded-lg text-[10px]"
            style={{ background: P.lineSoft, color: P.ink3 }}
          >
            <Clock size={10} className="inline mr-1" />
            Last tick: {new Date(governor.lastTick).toLocaleTimeString()}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: P.ink3 }}
            >
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              <QuickAction
                label="System Status"
                icon={Activity}
                onClick={() => handleQuickAction("status")}
              />
              <QuickAction
                label="Pending Approvals"
                icon={Shield}
                onClick={() => handleQuickAction("approvals")}
                accent={P.amber}
              />
              <QuickAction
                label="Active Agents"
                icon={Users}
                onClick={() => handleQuickAction("agents")}
              />
              <QuickAction
                label="Run Tick"
                icon={Zap}
                onClick={() => handleQuickAction("tick")}
                accent={P.green}
              />
              <QuickAction
                label="Daily Report"
                icon={FileText}
                onClick={() => handleQuickAction("report")}
              />
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "rounded-br-md"
                        : msg.role === "jake"
                        ? "rounded-bl-md"
                        : "rounded-md"
                    }`}
                    style={{
                      background:
                        msg.role === "user"
                          ? P.accent
                          : msg.role === "jake"
                          ? P.card
                          : P.lineSoft,
                      border: msg.role === "jake" ? `1px solid ${P.line}` : "none",
                      color: msg.role === "user" ? "#fff" : P.ink,
                    }}
                  >
                    {msg.role === "jake" && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Bot size={12} style={{ color: P.accent }} />
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: P.accent }}
                        >
                          Jake
                        </span>
                        {msg.mode === "voice" && (
                          <Volume2 size={10} style={{ color: P.ink3 }} />
                        )}
                      </div>
                    )}
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <div
                      className="text-[9px] mt-1.5"
                      style={{
                        color: msg.role === "user" ? "rgba(255,255,255,0.6)" : P.ink3,
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-4"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ background: P.accent }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span className="text-[11px]" style={{ color: P.ink3 }}>
                  Jake is thinking...
                </span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div
            className="border-t px-6 py-4"
            style={{ borderColor: P.line, background: P.card }}
          >
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: P.canvas, border: `1px solid ${P.line}` }}
            >
              {/* Voice button */}
              <button
                onClick={toggleVoice}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: isListening ? P.redBg : P.accentBg,
                  color: isListening ? P.red : P.accent,
                }}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Text input */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask Jake anything..."
                className="flex-1 bg-transparent outline-none text-[14px]"
                style={{ color: P.ink, fontFamily: SANS }}
                disabled={isLoading}
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: input.trim() ? P.accent : P.lineSoft,
                  color: input.trim() ? "#fff" : P.mute,
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                <Send size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[9px]" style={{ color: P.mute }}>
                {isListening ? "🔴 Listening..." : "Press mic or type to chat"}
              </span>
              <span className="text-[9px]" style={{ color: P.mute }}>
                Powered by {governor.model}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
