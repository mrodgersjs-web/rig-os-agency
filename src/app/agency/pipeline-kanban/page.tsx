"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Workflow, DollarSign, Users, TrendingUp } from "lucide-react";

const STAGES = ["discovery", "qualified", "proposal", "negotiation", "closed"] as const;
type Stage = typeof STAGES[number];

const STAGE_META: Record<Stage, { label: string; color: string }> = {
  discovery: { label: "Discovery", color: "#60a5fa" },
  qualified: { label: "Qualified", color: "#a78bfa" },
  proposal: { label: "Proposal", color: "#fbbf24" },
  negotiation: { label: "Negotiation", color: "#fb923c" },
  closed: { label: "Closed", color: "#22c55e" },
};

interface Deal {
  id: string;
  company: string;
  contact: string;
  value: number;
  stage: Stage;
}

const SEED_DEALS: Deal[] = [
  { id: "1", company: "TechFlow Inc", contact: "Sarah Chen", value: 48000, stage: "discovery" },
  { id: "2", company: "DataMeld", contact: "James Park", value: 120000, stage: "qualified" },
  { id: "3", company: "NeuralSoft", contact: "Dr. Lisa Zhao", value: 85000, stage: "proposal" },
  { id: "4", company: "CloudVista", contact: "Mark Reeves", value: 220000, stage: "negotiation" },
  { id: "5", company: "AIPartner Co", contact: "Tom Bridges", value: 95000, stage: "closed" },
  { id: "6", company: "ScaleUp Labs", contact: "Nina Patel", value: 67000, stage: "discovery" },
  { id: "7", company: "DeepTech AI", contact: "Chris Wong", value: 180000, stage: "qualified" },
  { id: "8", company: "BioMetric Systems", contact: "Amy Liu", value: 75000, stage: "proposal" },
];

export default function PipelineKanbanPage() {
  const [deals] = useState(SEED_DEALS);

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {} as Record<Stage, Deal[]>);

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--cream)" }}>
          Pipeline Kanban
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--cream-mute)" }}>
          {deals.length} deals · ${(totalValue / 1000).toFixed(0)}K total pipeline value
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Deals", value: deals.length.toString(), icon: Workflow, color: "#60a5fa" },
          { label: "Pipeline Value", value: `$${(totalValue / 1000).toFixed(0)}K`, icon: DollarSign, color: "#d4a574" },
          { label: "Avg Deal Size", value: `$${(totalValue / deals.length / 1000).toFixed(0)}K`, icon: TrendingUp, color: "#22c55e" },
          { label: "Win Rate", value: "32%", icon: Users, color: "#fbbf24" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="panel p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon size={14} style={{ color: s.color }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                {s.label}
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: "var(--cream)" }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = grouped[stage];
          const meta = STAGE_META[stage];
          const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-[280px] rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                  <span className="text-[12px] font-semibold" style={{ color: "var(--cream)" }}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${meta.color}20`, color: meta.color }}>
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>
                  ${(stageValue / 1000).toFixed(0)}K
                </span>
              </div>

              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-lg cursor-pointer"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--line-soft)" }}
                  >
                    <div className="text-[12px] font-semibold mb-1" style={{ color: "var(--cream)" }}>
                      {deal.company}
                    </div>
                    <div className="text-[10px] mb-2" style={{ color: "var(--cream-mute)" }}>
                      {deal.contact}
                    </div>
                    <div className="text-[14px] font-bold" style={{ color: meta.color }}>
                      ${(deal.value / 1000).toFixed(0)}K
                    </div>
                  </motion.div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-[11px]" style={{ color: "var(--cream-mute)" }}>
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
