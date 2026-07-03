"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Funnel, Target, TrendingUp, Clock, Users, DollarSign, ChevronDown,
  ArrowRight, Calendar, Zap,
} from "lucide-react";

interface Deal {
  id: string;
  name: string;
  client: string;
  value: number;
  stage: "discovery" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  probability: number;
}

const stages = [
  { key: "discovery", label: "Discovery", color: "#7dd3fc", bg: "rgba(125,211,252,0.1)" },
  { key: "proposal", label: "Proposal", color: "var(--gold)", bg: "rgba(212,165,116,0.1)" },
  { key: "negotiation", label: "Negotiation", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  { key: "closed_won", label: "Closed Won", color: "var(--emerald)", bg: "rgba(90,184,150,0.1)" },
] as const;

const deals = [
  { id: "d1", name: "AI Analytics Integration", client: "@acme-corp", value: 85000, stage: "proposal" as const, probability: 0.75, next_action: "Send proposal follow-up by Friday" },
  { id: "d2", name: "Full Stack Rebuild", client: "@nexus-startup", value: 120000, stage: "negotiation" as const, probability: 0.65, next_action: "Finalize SOW pricing with legal" },
  { id: "d3", name: "MCP Gateway Setup", client: "@retail-giant", value: 45000, stage: "discovery" as const, probability: 0.4, next_action: "Schedule discovery call Monday" },
];

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
function formatCurrency(n: number): string { return `$${(n / 1000).toFixed(0)}K`; }

export default function AgencyPipelinePage() {
  const [filterClient, setFilterClient] = useState("all");
  const filteredDeals = filterClient === "all" ? deals : deals.filter(d => d.client === filterClient);
  const totalValue = useMemo(() => filteredDeals.reduce((s, d) => s + d.value, 0), [filteredDeals]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section {...fadeUp}>
        <div className="flex items-center gap-3 mb-2"><Funnel size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)", fontWeight: 600 }}>Agency Pipeline — $450K+ pipeline</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Deal Flow & Forecasting</h1>
      </motion.section>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: "Total Pipeline", value: formatCurrency(totalValue), color: "#a3e635" },
          { label: "Active Deals", value: `${(filterClient === "all" ? deals : filteredDeals).length} of 12 pipeline`, color: "#7dd3fc" },
          { label: "Win Rate", value: "~72% (est.)", color: "var(--gold)" },
          { label: "Avg Close Time", value: "14 days", color: "#fbbf24" }].map(c => (
          <div key={c.label} className="panel p-5"><p style={{ color: c.color, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>{c.label}</p><div style={{ color: "var(--cream)", fontSize: 22, marginTop: 4 }}>{c.value}</div></div>
        ))}
      </section>

      {/* Pipeline Board */}
      <div className="grid grid-cols-[1.6fr_2fr] gap-6">
        {/* Stage funnel visual */}
        <motion.div {...fadeUp}>
          <h3 style={{ fontFamily: "Manrope" }} className="mb-4 text-xs uppercase tracking-widest opacity-50">Stage Funnel</h3>
          {stages.map((s, i) => (
            <div key={s.key} className="mt-2" onClick={() => setFilterClient(s.key === "closed_won" ? "@acme-corp" : "@nexus-startup")}>
              <div style={{ maxWidth: `${100 - i * 15}%`, width: '100%' }}><h3>• {s.label}</h3></div>
            </div>
          ))}
        </motion.div>

        {/* Deal list */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium" style={{ color: "var(--cream)" }}>Active Deals</span>
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="panel px-3 py-1.5 text-xs">
              <option>all</option><option>@acme-corp</option><option>@nexus-startup</option>
            </select></div>
          {filteredDeals.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="panel p-5 flex justify-between">
              <div className="space-y-2"><p style={{ fontSize: 'var(--text-lg)' }}>{d.name}</p><small>{d.client} · {formatCurrency(d.value)}</small>
                <small className="block opacity-50">Next: {d.next_action}</small></div>
              <div className="space-y-1"><span className="badge" style={{ background: `rgba(90,184,150,0.1)`, color: "var(--emerald)" }}>{stages.find(s => s.key === d.stage)?.label}</span></div>
            </motion.div>
          ))}
        </section>
      </div>
    </div>
  );
}
