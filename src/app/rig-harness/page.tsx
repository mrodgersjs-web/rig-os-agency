"use client";
import { Command } from "lucide-react";
export default function HarnessPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>Harnesses</h1>
      <p className="text-[14px]" style={{color:"var(--cream-dim)"}}>50 goal loops, agent harness resolver, and session-type matching.</p>
      <div className="rounded-xl p-6 border" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
        <div className="flex items-center gap-2 mb-2"><Command size={18} style={{color:"#a855f7"}}/><h2 className="text-[16px] font-semibold" style={{color:"var(--cream)"}}>Goal Loop Fleet</h2></div>
        <p className="text-[13px]" style={{color:"var(--cream-dim)"}}>49 mission-control loops + 50 rig-fullbuild. Run mission-control first in the 50-loop fleet.</p>
      </div>
    </div>
  );
}
