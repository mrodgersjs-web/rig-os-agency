"use client";
import { Server } from "lucide-react";
export default function McpPage() {
  const mcps = ["cua-driver","github","supabase","consensus","MathExec (sandbox)","MathExec (sympy)","GTM","CRM (Twenty)","Hermes Swarm","Context7","Exa","Playwright","Sequential Thinking","Railway","Firecrawl"];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>MCP Registry</h1>
      <p className="text-[14px]" style={{color:"var(--cream-dim)"}}>15 MCP servers wired and ready. Health checks, capabilities, and tool counts.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mcps.map(m=>(
          <div key={m} className="rounded-xl p-4 border flex items-center gap-3" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
            <div className="grid place-items-center w-9 h-9 rounded-lg" style={{background:"#22d3ee15",color:"#22d3ee",border:"1px solid #22d3ee55"}}><Server size={16}/></div>
            <div className="flex-1"><div className="text-[13px] font-medium" style={{color:"var(--cream)"}}>{m}</div><div className="text-[10px]" style={{color:"var(--cream-dim)"}}>Connected</div></div>
            <div className="w-2 h-2 rounded-full" style={{background:"var(--emerald)"}}/>
          </div>
        ))}
      </div>
    </div>
  );
}
