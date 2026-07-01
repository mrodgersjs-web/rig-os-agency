"use client";
import { Building2, DollarSign, Users, TrendingUp } from "lucide-react";

export default function AgencyDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque', sans-serif",fontWeight:500,color:"var(--cream)"}}>
          Agency Dashboard
        </h1>
        <p className="text-[14px] mt-2" style={{color:"var(--cream-dim)"}}>
          Revenue, clients, pipeline, and ARR trajectory. Target: $10M ARR.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Current ARR",value:"$0",sub:"Starting fresh",icon:<DollarSign size={18}/>,accent:"var(--gold)"},
          {label:"Active Clients",value:"0",sub:"across 8 verticals",icon:<Users size={18}/>,accent:"var(--emerald)"},
          {label:"Pipeline Value",value:"$0",sub:"proposals in flight",icon:<TrendingUp size={18}/>,accent:"var(--plum)"},
          {label:"Target ARR",value:"$10M",sub:"by Q4 2027",icon:<Building2 size={18}/>,accent:"var(--gold)"},
        ].map(k=>(
          <div key={k.label} className="rounded-xl p-4 border" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{color:k.accent}}>{k.icon}</span>
              <span className="text-[11px] uppercase tracking-wider" style={{color:"var(--cream-dim)"}}>{k.label}</span>
            </div>
            <div className="text-2xl" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>{k.value}</div>
            <div className="text-[11px] mt-1" style={{color:"var(--cream-mute)"}}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-6 border" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
        <h2 className="text-[16px] font-semibold mb-2" style={{color:"var(--cream)"}}>Agency Operations</h2>
        <p className="text-[13px]" style={{color:"var(--cream-dim)"}}>
          Full client management, sales pipeline, revenue tracking, proposals, contracts, and invoicing.
          Multi-tenant architecture with 8 verticals: construction, law, healthcare, dental, CPA, services, manufacturing, PE/CFO.
        </p>
      </div>
    </div>
  );
}
