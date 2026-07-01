"use client";
import { Layers } from "lucide-react";
export default function DeviationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>Deviation Engines</h1>
      <p className="text-[14px]" style={{color:"var(--cream-dim)"}}>40 engines: Physics (31-40, ±30σ HARD), Cognitive (01-20, ±20σ), Nature (21-30, ±20σ).</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {title:"Cognitive 01-20",desc:"OUTPUT scoring. Gravity Escape, Reality Anchor, Feynman X-Ray, Mechanism Furnace, and 16 more.",accent:"#d4a574",count:20},
          {title:"Nature 21-30",desc:"PROCESS scoring. Ant Colony, Bee Foraging, Slime Mold, Genetic Diversity, and 6 more.",accent:"#5ab896",count:10},
          {title:"Physics 31-40",desc:"STATE scoring. Quantum Tunneling, Pauli Exclusion, Casimir, Speed of Light, and 6 more.",accent:"#ef4444",count:10},
        ].map(c=>(
          <div key={c.title} className="rounded-xl p-5 border" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
            <div className="flex items-center justify-between mb-3"><div className="grid place-items-center w-10 h-10 rounded-lg" style={{color:c.accent,border:`1px solid ${c.accent}55`,background:`${c.accent}12`}}><Layers size={18}/></div><span className="text-2xl" style={{color:c.accent,fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500}}>{c.count}</span></div>
            <h3 className="text-[14px] font-semibold mb-1" style={{color:"var(--cream)"}}>{c.title}</h3>
            <p className="text-[11.5px]" style={{color:"var(--cream-dim)"}}>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
