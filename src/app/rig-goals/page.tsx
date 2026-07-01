"use client";
import { Target } from "lucide-react";
export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>Goals & OKRs</h1>
      <p className="text-[14px]" style={{color:"var(--cream-dim)"}}>$10M ARR path with quarterly milestones, client pipeline, and daily ops targets.</p>
      <div className="rounded-xl p-6 border" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
        <div className="flex items-center gap-2 mb-4"><Target size={18} style={{color:"var(--gold)"}}/><h2 className="text-[16px] font-semibold" style={{color:"var(--cream)"}}>$10M ARR Path</h2></div>
        <div className="space-y-3">
          {[["Q3 2026","$250K ARR","10 clients"],["Q4 2026","$500K ARR","20 clients"],["Q1 2027","$1M ARR","40 clients"],["Q2 2027","$2.5M ARR","60 clients"],["Q3 2027","$5M ARR","80 clients"],["Q4 2027","$10M ARR","120 clients"]].map(([q,a,c])=>(
            <div key={q} className="flex items-center gap-4 py-2 border-b" style={{borderColor:"var(--line-soft)"}}>
              <div className="text-[12px] mono w-20" style={{color:"var(--cream-dim)"}}>{q}</div>
              <div className="text-[14px] font-semibold flex-1" style={{color:"var(--gold)"}}>{a}</div>
              <div className="text-[12px]" style={{color:"var(--cream-dim)"}}>{c}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
