"use client";
import { Workflow } from "lucide-react";
export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>Sales Pipeline</h1>
      <p className="text-[14px]" style={{color:"var(--cream-dim)"}}>Kanban board: Prospect → Qualified → Proposal → Negotiation → Closed Won / Lost.</p>
      <div className="rounded-xl p-6 border" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
        <div className="flex items-center gap-2 mb-2"><Workflow size={18} style={{color:"var(--emerald)"}}/><h2 className="text-[16px] font-semibold" style={{color:"var(--cream)"}}>Pipeline Stages</h2></div>
        <div className="grid grid-cols-5 gap-3 mt-4">
          {["Prospect","Qualified","Proposal","Negotiation","Closed"].map((s,i)=>(
            <div key={s} className="rounded-lg p-3 border text-center" style={{background:"var(--bg-mid)",borderColor:"var(--line-soft)"}}>
              <div className="text-[12px] font-medium" style={{color:"var(--cream)"}}>{s}</div>
              <div className="text-[20px] mt-1" style={{color:"var(--gold)"}}>0</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
