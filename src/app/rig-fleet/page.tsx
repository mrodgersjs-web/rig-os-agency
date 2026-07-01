"use client";
import { Boxes } from "lucide-react";
export default function FleetPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>Agent Fleet</h1>
      <p className="text-[14px]" style={{color:"var(--cream-dim)"}}>232 Agency Agents + 86 RIG domain experts + VoltAgent Codex subagents + 6 RIG core.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Agency Agents",value:"232",accent:"#7c3aed"},
          {label:"RIG Experts",value:"86",accent:"#d4a574"},
          {label:"VoltAgent Subagents",value:"30+",accent:"#22c55e"},
          {label:"RIG Core",value:"6",accent:"#ef4444"},
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
