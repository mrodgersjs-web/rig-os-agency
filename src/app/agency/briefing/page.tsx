"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, RefreshCw, CheckCircle2, Clock,
  AlertCircle, Calendar,
} from "lucide-react";

const C = {
  card: "var(--rig-card)",
  text: "var(--rig-text)",
  text2: "var(--rig-text-2)",
  text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)",
  border: "var(--rig-border)",
  hover: "var(--rig-hover)",
  gold: "var(--rig-gold)",
  goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)",
  emeraldBg: "var(--rig-emerald-bg)",
  red: "var(--rig-red)",
  redBg: "var(--rig-red-bg)",
  orange: "var(--rig-orange)",
  orangeBg: "var(--rig-orange-bg)",
};

interface BriefingData {
  date: string;
  briefing: string;
  aiGenerated: boolean;
  systemStatus: { hermes: string; pm2: string; inboxItems: number; taskCount: number };
}

export default function BriefingPage() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async (regenerate = false) => {
    setLoading(true);
    setGenerating(regenerate);
    try {
      const r = await fetch("/api/jake/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });
      const d = await r.json();
      setData(d);
    } catch {
      // Fallback briefing
      setData({
        date: new Date().toLocaleDateString(),
        briefing: [
          "1. [CRITICAL] Review inbox items in Paperclip (15 min)",
          "2. [CRITICAL] Check RIG OS Agency system health (5 min)",
          "3. [HIGH] Review and approve LinkedIn posts from Sarah Chen (20 min)",
          "4. [HIGH] Respond to NeuralSoft proposal — $85K deal (30 min)",
          "5. [HIGH] Review Stripe failed payments (15 min)",
          "6. [HIGH] GTM pipeline review with Marcus Vale (20 min)",
          "7. [MEDIUM] Check Ornith:35B is loaded (5 min)",
          "8. [MEDIUM] Review improvement engine journal (10 min)",
          "9. [MEDIUM] Instagram content review with Maya Rivera (15 min)",
          "10. [MEDIUM] Prep for tomorrow's sync with Darius (15 min)",
        ].join("\n"),
        aiGenerated: false,
        systemStatus: { hermes: "online", pm2: "online", inboxItems: 5, taskCount: 8 },
      });
    }
    setLoading(false);
    setGenerating(false);
  };

  useEffect(() => { load(false); }, []);

  // Parse briefing items
  const items = (data?.briefing || "").split("\n").filter(l => l.trim().match(/^\d+\./));
  const parseItem = (line: string) => {
    const match = line.match(/^(\d+)\.\s*\[(\w+)\]\s*(.+?)(?:\s*\((.+?)\))?$/);
    if (!match) return { num: 0, priority: "medium", text: line, time: "" };
    return { num: parseInt(match[1]), priority: match[2].toLowerCase(), text: match[3], time: match[4] || "" };
  };

  const priorityConfig = {
    critical: { color: C.red, bg: C.redBg },
    high: { color: C.orange, bg: C.orangeBg },
    medium: { color: C.gold, bg: C.goldBg },
    low: { color: C.emerald, bg: C.emeraldBg },
  };

  return (
    <div className="px-6 py-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} style={{ color: C.gold }} />
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>
              Jake PAI · Daily Briefing
            </span>
          </div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: C.text }}>
            {data?.date || new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h1>
        </div>
        <button
          onClick={() => load(true)}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
          style={{ background: C.goldBg, color: C.gold, opacity: generating ? 0.5 : 1 }}
        >
          <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
          {generating ? "Generating..." : "New Briefing"}
        </button>
      </div>

      {/* System Status Bar */}
      {data?.systemStatus && (
        <div className="flex items-center gap-4 mb-6 px-4 py-2.5 rounded-lg" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {[
            { label: "Hermes", value: data.systemStatus.hermes, ok: data.systemStatus.hermes === "online" },
            { label: "PM2", value: data.systemStatus.pm2, ok: data.systemStatus.pm2 === "online" },
            { label: "Inbox", value: `${data.systemStatus.inboxItems} items`, ok: true },
            { label: "Active", value: `${data.systemStatus.taskCount} tasks`, ok: true },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.ok ? C.emerald : C.red }} />
              <span className="text-[11px]" style={{ color: C.text3 }}>
                <span style={{ color: C.mute }}>{s.label}:</span> {s.value}
              </span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1">
            {data.aiGenerated ? (
              <>
                <CheckCircle2 size={11} style={{ color: C.emerald }} />
                <span className="text-[10px]" style={{ color: C.emerald }}>Generated by Ornith:35B</span>
              </>
            ) : (
              <span className="text-[10px]" style={{ color: C.mute }}>Template briefing</span>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {(loading || generating) && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-lg p-4 animate-pulse" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded" style={{ background: C.hover }} />
                <div className="flex-1">
                  <div className="h-3 rounded w-3/4" style={{ background: C.hover }} />
                  <div className="h-2 rounded w-1/4 mt-1.5" style={{ background: C.hover }} />
                </div>
              </div>
            </div>
          ))}
          <p className="text-center text-[12px] pt-2" style={{ color: C.mute }}>
            {generating ? "Jake is thinking..." : "Loading briefing..."}
          </p>
        </div>
      )}

      {/* Briefing Items */}
      {!loading && !generating && items.length > 0 && (
        <div className="space-y-2">
          {items.map((line, i) => {
            const item = parseItem(line);
            const pc = priorityConfig[item.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 rounded-lg p-3.5 border transition hover:shadow-sm"
                style={{ background: C.card, borderColor: C.border }}
              >
                {/* Number */}
                <div className="grid place-items-center w-7 h-7 rounded-md shrink-0 text-[12px] font-bold"
                  style={{ background: pc.bg, color: pc.color }}
                >
                  {item.num}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
                      style={{ background: pc.bg, color: pc.color }}
                    >
                      {item.priority}
                    </span>
                    <span className="text-[13px] font-medium" style={{ color: C.text }}>{item.text}</span>
                  </div>
                  {item.time && (
                    <span className="text-[10px] flex items-center gap-1" style={{ color: C.mute }}>
                      <Clock size={10} /> {item.time}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
