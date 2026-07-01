"use client";
import { DollarSign } from "lucide-react";
export default function RevenuePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>Revenue Dashboard</h1>
      <p className="text-[14px]" style={{color:"var(--cream-dim)"}}>ARR trajectory, MRR growth, churn, and cash flow projection toward $10M ARR.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Current MRR",value:"$0",accent:"var(--gold)"},
          {label:"Target MRR",value:"$833K",accent:"var(--emerald)"},
          {label:"ARR Gap",value:"$10M",accent:"var(--plum)"},
          {label:"Growth Rate",value:"—",accent:"var(--gold)"},
        ].map(k=>(
          <div key={k.label} className="rounded-xl p-4 border" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{color:"var(--cream-dim)"}}>{k.label}</div>
            <div className="text-2xl" style={{color:k.accent,fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500}}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
