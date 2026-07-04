"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader, StatCard } from "@/components/DepartmentUI";
import { FileText, Mail, Calendar, Paperclip, RefreshCw, ArrowRight } from "lucide-react";

const C = {
  card: "var(--rig-card)", text: "var(--rig-text)", text2: "var(--rig-text-2)", text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)", border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)", red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
};

interface Client {
  id: string;
  name: string;
  vertical: string;
  status: string;
  health: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  serviceTier: string;
  monthlyFee: number;
  annualFee: number;
  services: string[];
  notes: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/clients");
      const d = await r.json();
      const found = (d.clients || []).find((c: Client) => c.id === id);
      setClient(found || null);
    } catch {
      setClient(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="px-6 py-5">Loading client...</div>;
  if (!client) return <div className="px-6 py-5">Client not found</div>;

  const healthColor = (h: string) => {
    if (h === "green") return { bg: C.emeraldBg, color: C.emerald };
    if (h === "yellow") return { bg: C.goldBg, color: C.gold };
    if (h === "red") return { bg: C.redBg, color: C.red };
    return { bg: "var(--rig-hover)", color: C.mute };
  };
  const hc = healthColor(client.health);

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Clients", href: "/agency/clients" }, { label: client.name }]} />
      <PageHeader title={client.name} subtitle={`${client.vertical} · ${client.serviceTier} tier · ${client.status}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="MRR" value={`$${client.monthlyFee.toLocaleString()}`} icon={<span style={{ color: C.gold }}>$</span>} color={C.gold} bg={C.goldBg} />
        <StatCard label="ARR" value={`$${client.annualFee.toLocaleString()}`} icon={<span style={{ color: C.emerald }}>$</span>} color={C.emerald} bg={C.emeraldBg} />
        <StatCard label="Health" value={client.health} icon={<span style={{ color: hc.color }}>●</span>} color={hc.color} bg={hc.bg} />
        <StatCard label="Services" value={client.services.length} subtext="active services" icon={<span style={{ color: "var(--rig-blue)" }}>S</span>} color="var(--rig-blue)" bg="var(--rig-blue-bg)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-[12px] uppercase tracking-wider font-semibold mb-3" style={{ color: C.mute }}>Properties</div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { label: "Contact", value: client.contactName },
                { label: "Email", value: client.contactEmail },
                { label: "Phone", value: client.contactPhone },
                { label: "Website", value: client.website },
                { label: "Vertical", value: client.vertical },
                { label: "Tier", value: client.serviceTier },
              ].map(p => (
                <div key={p.label} className="rounded p-2" style={{ background: "var(--rig-bg)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.mute }}>{p.label}</div>
                  <div style={{ color: C.text }}>{p.value}</div>
                </div>
              ))}
            </div>          </div>

          <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.mute }}>Services</div>
            <div className="flex flex-wrap gap-1.5">
              {client.services.map((s, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded border" style={{ borderColor: C.border, color: C.text2 }}>{s}</span>
              ))}
            </div>
          </div>

          {client.notes && (
            <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
              <div className="text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.mute }}>Notes</div>
              <p className="text-[13px]" style={{ color: C.text2 }}>{client.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>Actions</div>
          {[
            { icon: FileText, label: "Create Proposal", desc: "Generate a new proposal", color: C.gold },
            { icon: Mail, label: "Send Email", desc: "Email primary contact", color: C.gold },
            { icon: Calendar, label: "Schedule Meeting", desc: "Book a calendar slot", color: C.gold },
            { icon: Paperclip, label: "Add Note", desc: "Log a client note", color: C.gold },
            { icon: RefreshCw, label: "Renew Contract", desc: "Renew or upgrade tier", color: C.emerald },
          ].map(a => (
            <Link
              key={a.label}
              href={`/agency/clients/${id}/actions`}
              className="flex items-center gap-3 rounded-lg p-3 border transition hover:shadow-md"
              style={{ background: C.card, borderColor: C.border }}
            >
              <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ background: a.color + "15", color: a.color }}>
                <a.icon size={14} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium" style={{ color: C.text }}>{a.label}</div>
                <div className="text-[11px]" style={{ color: C.text3 }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
