"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon, DollarSign, Users, Shield, FileText, TrendingUp,
  Cpu, Zap, Clock, Hammer, Book, Target, Scissors, Heart,
  Camera, Database, Layers, ChevronDown, RefreshCw, Volume2,
  Loader2, AlertCircle,
} from "lucide-react";

interface BriefingData {
  date: string;
  timestamp: string;
  voiceGreeting: string;
  sections: Record<string, any>;
}

const iconMap: Record<string, any> = {
  moon: Moon, dollar: DollarSign, users: Users, shield: Shield,
  file: FileText, trending: TrendingUp, cpu: Cpu, zap: Zap,
  clock: Clock, hammer: Hammer, book: Book, target: Target,
  scissors: Scissors, heart: Heart, camera: Camera, database: Database,
  layers: Layers,
};

export default function BriefingPage() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    loadBriefing();
  }, []);

  async function loadBriefing() {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/briefing");
      const d = await res.json();
      setData(d);
      // Expand all by default
      const exp: Record<string, boolean> = {};
      Object.keys(d.sections || {}).forEach((k) => (exp[k] = true));
      setExpanded(exp);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function speakBriefing() {
    if (!data) return;
    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(data.voiceGreeting);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#5ab896" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <AlertCircle size={48} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--cream-dim)" }}>Failed to load briefing</p>
        <button onClick={loadBriefing} style={{ marginTop: 16, padding: "8px 16px", background: "#5ab896", border: "none", borderRadius: 8, color: "#000", cursor: "pointer" }}>
          Retry
        </button>
      </div>
    );
  }

  const sectionEntries = Object.entries(data.sections);

  return (
    <div style={{ padding: "32px 48px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Daily Briefing</h1>
          <p style={{ color: "var(--cream-dim)", marginTop: 4 }}>{data.date}</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={speakBriefing}
            disabled={speaking}
            style={{
              background: speaking ? "rgba(90,184,150,0.2)" : "#5ab896",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              color: speaking ? "#5ab896" : "#000",
              fontWeight: 700,
              cursor: speaking ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Volume2 size={18} />
            {speaking ? "Speaking..." : "Speak Briefing"}
          </button>
          <button
            onClick={loadBriefing}
            style={{
              background: "transparent",
              border: "1px solid var(--border-dim)",
              borderRadius: 10,
              padding: "10px 16px",
              color: "var(--cream)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Voice greeting banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(90,184,150,0.1), rgba(74,158,255,0.05))",
          border: "1px solid rgba(90,184,150,0.2)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Volume2 size={24} style={{ color: "#5ab896", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 12, textTransform: "uppercase", color: "#5ab896", fontWeight: 700, marginBottom: 4 }}>
              Jarvis Voice Greeting
            </div>
            <p style={{ color: "var(--cream)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              {data.voiceGreeting}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sectionEntries.map(([key, section]) => {
          const Icon = iconMap[section.icon] || Target;
          const isExpanded = expanded[key];
          return (
            <motion.div
              key={key}
              layout
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-dim)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Section header */}
              <button
                onClick={() => toggleSection(key)}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  background: "transparent",
                  border: "none",
                  color: "var(--cream)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Icon size={18} style={{ color: "#5ab896" }} />
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{section.title}</span>
                  {section.total !== undefined && (
                    <span style={{ fontSize: 11, color: "var(--cream-dim)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>
                      {section.total}
                    </span>
                  )}
                  {section.progress && (
                    <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                      {section.progress}
                    </span>
                  )}
                </div>
                <ChevronDown
                  size={16}
                  style={{
                    color: "var(--cream-dim)",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms",
                  }}
                />
              </button>

              {/* Section content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 200 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 20px 16px 20px" }}>
                      {/* Items */}
                      {section.items && Array.isArray(section.items) && section.items.map((item: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            padding: "8px 0",
                            borderBottom: i < section.items.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                            fontSize: 13,
                            color: "var(--cream)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span style={{ color: "#5ab896", fontSize: 10 }}>●</span>
                          {typeof item === "string" ? item : JSON.stringify(item)}
                        </div>
                      ))}

                      {/* Stats grid for fleet/mcp */}
                      {section.total !== undefined && section.byCategory && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 8 }}>
                          {Object.entries(section.byCategory).map(([cat, count]) => (
                            <div key={cat} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                              <div style={{ fontSize: 20, fontWeight: 700 }}>{count as number}</div>
                              <div style={{ fontSize: 10, color: "var(--cream-dim)", textTransform: "capitalize" }}>{cat.replace(/_/g, " ")}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* KPIs */}
                      {section.kpis && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 8 }}>
                          {Object.entries(section.kpis).map(([kpi, val]) => (
                            <div key={kpi} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 10 }}>
                              <div style={{ fontSize: 10, color: "var(--cream-dim)", textTransform: "uppercase" }}>{kpi.replace(/([A-Z])/g, " $1").trim()}</div>
                              <div style={{ fontSize: 16, fontWeight: 700 }}>{typeof val === "number" ? `$${val.toLocaleString()}` : String(val)}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Connected/tools for MCP */}
                      {section.connected !== undefined && (
                        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                          <div style={{ background: "rgba(90,184,150,0.05)", borderRadius: 8, padding: 10, flex: 1 }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "#5ab896" }}>{section.connected}/{section.total}</div>
                            <div style={{ fontSize: 10, color: "var(--cream-dim)" }}>Servers Connected</div>
                          </div>
                          <div style={{ background: "rgba(251,191,36,0.05)", borderRadius: 8, padding: 10, flex: 1 }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>{section.tools}</div>
                            <div style={{ fontSize: 10, color: "var(--cream-dim)" }}>Total Tools</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  );
}