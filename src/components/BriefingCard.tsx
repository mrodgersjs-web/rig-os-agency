"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sun, TrendingUp, Users, FileText, Boxes, Server,
  Activity, DollarSign, Heart, Newspaper, Zap, AlertCircle,
} from "lucide-react";

interface BriefingSection {
  title: string;
  icon: string;
  items?: Array<{ label: string; value?: string; status?: string; sub?: string }>;
  total?: number;
  active?: number;
  kpis?: Record<string, string | number>;
  progress?: string;
}

interface BriefingData {
  date: string;
  voiceGreeting: string;
  sections: Record<string, BriefingSection>;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  overnight: <Sun size={14} />,
  revenue: <DollarSign size={14} />,
  clients: <Users size={14} />,
  contracts: <FileText size={14} />,
  proposals: <FileText size={14} />,
  pipeline: <TrendingUp size={14} />,
  fleet: <Boxes size={14} />,
  mcp: <Server size={14} />,
  cron: <Activity size={14} />,
  vault: <Boxes size={14} />,
  priorities: <Zap size={14} />,
  spend: <DollarSign size={14} />,
  loveTest: <Heart size={14} />,
  socialMedia: <Newspaper size={14} />,
  scraping: <Activity size={14} />,
};

export default function BriefingCard() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/agency/briefing");
        if (!res.ok) return;
        const json = await res.json();
        if (active) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) return null;

  const priorities = data.sections.priorities?.items ?? [];
  const revenue = data.sections.revenue;
  const overnight = data.sections.overnightWork?.items ?? [];
  const contracts = data.sections.contracts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--line-soft)", background: "var(--bg-card)" }}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2">
            <Sun size={16} style={{ color: "var(--gold)" }} />
            <h3 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
              Daily Briefing
            </h3>
            <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
              {data.date}
            </span>
          </div>
          <Link
            href="/agency/briefing"
            className="text-[11px] font-medium px-3 py-1 rounded-md transition"
            style={{ color: "var(--gold)", border: "1px solid var(--line-soft)" }}
          >
            Full briefing →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-x" style={{ borderColor: "var(--line-soft)" }}>
          {/* Priorities */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Zap size={13} style={{ color: "#fbbf24" }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>
                Top Priorities
              </span>
            </div>
            <div className="space-y-2">
              {priorities.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="text-[10px] font-bold mono shrink-0 mt-0.5"
                    style={{ color: "var(--gold)", minWidth: "16px" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[12px] leading-relaxed" style={{ color: "var(--cream)" }}>
                    {p.label || p.value || ""}
                  </span>
                </div>
              ))}
              {priorities.length === 0 && (
                <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
                  No priorities loaded.
                </span>
              )}
            </div>
          </div>

          {/* Revenue snapshot */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <DollarSign size={13} style={{ color: "var(--gold)" }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>
                Revenue & Pipeline
              </span>
            </div>
            <div className="space-y-2.5">
              {revenue?.kpis &&
                Object.entries(revenue.kpis).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[11px] capitalize" style={{ color: "var(--cream-dim)" }}>
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-[12px] font-semibold mono" style={{ color: "var(--cream)" }}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              {contracts?.progress && (
                <div className="pt-1 mt-1 border-t" style={{ borderColor: "var(--line-soft)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
                      Contracts progress
                    </span>
                    <span className="text-[12px] font-semibold" style={{ color: "#22c55e" }}>
                      {contracts.progress}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Overnight work */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Activity size={13} style={{ color: "#60a5fa" }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>
                Overnight Work
              </span>
            </div>
            <div className="space-y-2">
              {overnight.slice(0, 5).map((item, i) => (
                <div key={i} className="text-[11px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>
                  {item.label || item.value || ""}
                </div>
              ))}
              {overnight.length === 0 && (
                <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
                  No overnight activity recorded.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
