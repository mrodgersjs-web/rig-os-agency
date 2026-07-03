"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

interface EmailTracked { id: string; to: string; sentDate: string; openTime?: string; clickLink?: string; reply?: boolean; notes?: string; status: "opened" | "clicked" | "replied" | "bounced"; subject: string; company: string }

const mockEmails: EmailTracked[] = [
  { id: "e1", to: "alice@acme.io", sentDate: "2024-06-28T10:30:00Z", openTime: "2024-06-28T11:05:00Z", clickLink: "/pricing/v3", notes: "Requested follow-up meeting", status: "clicked", subject: "Re: AI strategy for 2025 Q3", company: "ACME Corp" },
  { id: "e2", to: "bob@nova.org", sentDate: "2024-06-27T14:15:00Z", reply:true, notes: "Positive — wants proposal by Friday", status: "replied", subject: "Agency services for enterprise rebuild", company: "Nova Labs" },
  { id: "e3", to: "carol@retailco.com", sentDate: "2024-06-27T09:00:00Z", openTime: "2024-06-27T13:45:00Z", clickLink: "/capabilities", status: "clicked", subject: "Your AI-driven operations proposal", company: "RetailCo" },
  { id: "e4", to: "dave@startup.io", sentDate: "2024-06-26T16:00:00Z", openTime: "2024-06-27T08:30:00Z", status: "opened", subject: "Quick intro — AI ops partner for scaling startups", company: "Startup.io" }
];

const statusMap = { opened: "#fbbf24", clicked: "#5ab896", replied: "#7dd3fc", bounced: "#ef4444" };

export default function EmailTrackingPage() {
  const [selected, setSelected] = useState<string>("all");
  const filtered = selected === "all" ? mockEmails : mockEmails.filter(e => e.status === selected);
  const counts = { all: mockEmails.length, opened: mockEmails.filter(e=>e.status==="opened").length, clicked: mockEmails.filter(e=>e.status==="clicked").length, replied: mockEmails.filter(e=>e.status==="replied").length };

  return (
    <div className="space-y-7">
      <motion.section {...fadeUp}>
        <h1 style={{ fontFamily:"Manrope" }} className="text-3xl font-bold tracking-tight text-[var(--cream)]">Email Engagement Tracking</h1>
        <p style={{ color:"var(--cream-dim)" }} className="text-sm mt-2">Track opens, clicks and replies across agency outbound — identify warm leads by engagement signals.</p>
      </motion.section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label:"Open Rate", value:"68%", color:"#fbbf24" }, { label:"Click Through", value:"23%", color:"#5ab896" }, { label:"Reply Rate", value:"12%", color:"#7dd3fc" }, { label:"Bounce Rate", value:"3%", color:"#ef4444" }].map(c => (
          <motion.div key={c.label} {...fadeUp} transition={{ y: 0 }} whileHover={{ scale:1.04 }} className="panel p-5 flex items-center gap-3">
            <div style={{ background:`${c.color}16`, color:c.color, padding:"8px", borderRadius:"12px" }}>●</div>
            <div><div className="text-2xl font-bold">{c.value}</div><p className="opacity-50 text-[10px] mt-1 uppercase tracking-wide">{c.label}</p></div>

          </motion.div>
        ))}
      </section>

      {/* Filter */}
      <div className="flex gap-2 border-b" style={{ borderColor:"rgba(212,200,180,0.06)" }}>
        {(["all","clicked","opened","replied"] as const).map(k => (
          <button key={k} onClick={()=>setSelected(k)} style={{ 
            color: selected===k?"var(--gold)":"var(--cream-mute)",
            borderBottom: selected===k?"2px solid var(--gold)" :"2px solid transparent",
            fontSize:"13px" }} className="flex items-center gap-2 px-4 py-2 font-medium">
            {k} <span style={{ color:"var(--cream-dim)" }}>({counts[k]})</span>
          </button>
        ))}
      </div>

      {/* Email List */}
      <section className="space-y-2.5">
        {filtered.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>
            <div className="panel p-5 flex items-start justify-between gap-4">
              <div style={{ flex: 1 }}>
                <div style={{ color:"var(--cream)" }}>{e.to} — {e.company}</div>
                <p style={{ fontSize:"13px" }}>{e.subject}</p>
                <small>{new Date(e.sentDate).toLocaleString()}</small>
                <div className="flex gap-2 mt-2">
                  <span>{e.openTime ? `Opened ${new Date(e.openTime).toLocaleTimeString()}` : "No open" }</span>
                  {e.clickLink && <span style={{ color:"var(--emerald)" }}>Clicked {e.clickLink}</span>}
                </div>
              </div>
              <motion.div whileHover={{ scale:1.05 }} onClick={()=>setSelected("all")} className="flex items-center px-3 py-1 rounded text-xs font-semibold" style={{ background:`${statusMap[e.status]}26`, color: statusMap[e.status] }}>
                {e.status.toUpperCase()}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </section>

    </div>
  );
}