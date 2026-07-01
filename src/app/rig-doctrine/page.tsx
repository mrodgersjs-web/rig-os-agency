"use client";
import { Shield, GitBranch, Gauge } from "lucide-react";
export default function DoctrinePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>RIG Doctrine</h1>
      <p className="text-[14px]" style={{color:"var(--cream-dim)"}}>IQRSQPI loop, A1-A4 build modes, 40 deviation engines, Gate-D approval, ProofPacket schema.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {title:"IQRSQPI Loop",desc:"7-stage: Intent → Question → Research → Solution → Quality → Proof → Integrate",icon:<GitBranch size={18}/>,accent:"#ef4444"},
          {title:"Build Modes",desc:"A1 Python (≥0.75) · A2 Hybrid · A3 Agent Bounded · A4 LLM Free (<0.25)",icon:<Gauge size={18}/>,accent:"#fbbf24"},
          {title:"Gate-D",desc:"Mike's scoped current instruction approves outward/irreversible actions.",icon:<Shield size={18}/>,accent:"#d4a574"},
        ].map(c=>(
          <div key={c.title} className="rounded-xl p-5 border" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
            <div className="grid place-items-center w-10 h-10 rounded-lg mb-3" style={{color:c.accent,borderColor:c.accent+"55",background:c.accent+"12",border:"1px solid"}}>{c.icon}</div>
            <h3 className="text-[15px] font-semibold mb-1" style={{color:"var(--cream)"}}>{c.title}</h3>
            <p className="text-[12px]" style={{color:"var(--cream-dim)"}}>{c.desc}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-6 border mono text-[12px]" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)",color:"var(--cream-dim)"}}>
        <div style={{color:"var(--gold)"}}>Prime Directive:</div>
        Code owns decisions. LLMs assist transformation. Gates decide if it ships. ProofPacket or it didn&apos;t happen.
      </div>
    </div>
  );
}
