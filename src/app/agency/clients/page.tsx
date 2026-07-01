"use client";
import { Users } from "lucide-react";
export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl tracking-tight" style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:500,color:"var(--cream)"}}>Clients</h1>
      <p className="text-[14px]" style={{color:"var(--cream-dim)"}}>Client management across 8 verticals with health scores, contracts, and service tiers.</p>
      <div className="rounded-xl p-6 border" style={{background:"var(--bg-card)",borderColor:"var(--line-soft)"}}>
        <div className="flex items-center gap-2 mb-2"><Users size={18} style={{color:"var(--emerald)"}}/><h2 className="text-[16px] font-semibold" style={{color:"var(--cream)"}}>Client Registry</h2></div>
        <p className="text-[13px]" style={{color:"var(--cream-dim)"}}>Full CRUD client management with vertical filtering, health scoring, service tier assignment, and agent allocation.</p>
      </div>
    </div>
  );
}
