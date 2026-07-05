"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, Mail, TrendingUp, Activity, Database, ArrowRight, Zap 
} from "lucide-react";

const C = {
  bg: "var(--rig-bg)", card: "var(--rig-card)", text: "var(--rig-text)",
  text2: "var(--rig-text-2)", text3: "var(--rig-text-3)", mute: "var(--rig-text-mute)",
  border: "var(--rig-border)", gold: "var(--rig-gold)", emerald: "var(--rig-emerald)", 
  blue: "var(--rig-blue)", violet: "var(--rig-violet)"
};

interface DashboardData {
  realMetrics?: { prospects: number; emailsSent: number; revenue: number };
  kpis?: any;
}

export default function AgencyDashboardPage() {
  const [data, setData] = useState<DashboardData>({});
  const [lastFetch, setLastFetch] = useState<string>("");

  useEffect(() => {
    fetch("/api/agency/dashboard")
      .then(r => r.ok ? r.json() : null)
      .then(json => { setData(json || {}); setLastFetch("Just now"); });
  }, []);

return (
<div className="max-w-7xl mx-auto px-6 py-8">
  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
      <Zap size={28} color={C.gold} /> Agency Intelligence Hub
    </h2>
    <p style={{ color: C.text2 }} className="mb-10">Live pipeline data • Updated: {lastFetch || "—"}</p>

    <div className="grid grid-cols-4 gap-5 mb-8">
      {[ 
        { label: "Real Prospects", val: data.kpis?.realProspects ?? 0, icon: Users, color: C.emerald },
        { label: "Emails Sent",    val: data.kpis?.realEmailsSent ?? 0, icon: Mail,   color: C.blue },    
        { label: "Pipeline Views", val: (data as any).sampleData ? Object.keys((data as any).sampleData).length : 0, icon: Activity,    color: C.violet },
        { label: "Revenue",        val: data.kpis?.realRevenue ?? 0,     icon: TrendingUp,color: C.gold   } 
      ].map((card, i) => (
        <div key={i} className="rounded-xl p-5 border" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: C.text2 }}>{card.label}</span>
            <card.icon size={18} color={card.color} />
          </div>
          <div style={{ color: card.color }} className="text-3xl font-bold text-white mb-1">{Number(card.val || 0).toFixed(0)}</div>
        </div> 
      ))}
    </div>

    {data.sampleData ? (
      <section className="rounded-xl border p-6" style={{ borderColor: C.border }}>
        <h3 style={{ color: C.white }} className="text-lg font-semibold mb-4">Pipeline Stages</h3>
        <div className="grid grid-cols-5 gap-3">{data.sampleData.pipeline.map((stage, i) => ( 
          <div key={i} className="rounded-lg p-3 border" style={{ borderColor: C.border }}>
            <p>{stage}</p>
            <p className="font-bold text-white">{(data.kpis as any)[`dealCount_${i}`] || 0}</p>
          </div>
        ))}</div>
      </section>
    ) : (
      <p style={{ color: C.mute }}>No pipeline data yet.</p>
    )}

    {(data as any).sampleData && Object.keys((data as any).sampleData).length > 0 ? null : (
      <p className="text-sky-400">
        <ArrowRight size={16} /> <a href="/agency/clients">View Clients</a> •{" "}
        <a href="/agency/pipeline/deals/list">Deals</a>  </p>
    )}
  </motion.div></div> 
);}
