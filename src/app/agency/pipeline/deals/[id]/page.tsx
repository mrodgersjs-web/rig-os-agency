"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader, StatCard } from "@/components/DepartmentUI";
import { useDetail } from "@/components/DetailContext";
import { ArrowRight, FileText, Mail, Trophy, XCircle } from "lucide-react";

const C = {
  card: "var(--rig-card)", text: "var(--rig-text)", text2: "var(--rig-text-2)", text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)", border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)", red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
};

interface Deal {
  id: string;
  clientName: string;
  contact: string;
  dealValue: number;
  stage: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function DealDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<any>(null);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/pipeline-deals?action=list");
      const d = await r.json();
      const found = d.deals.find((deal: Deal) => deal.id === id);
      setDeal(found || null);

      // Run A2 scoring via lattice
      if (found) {
        const scoreR = await fetch("/api/lattice/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coordinate: "L3-D2-A2-R",
            intent: "Score deal probability",
            handler: "score-deal",
            context: { deal: found },
          }),
        });
        setScore(await scoreR.json());
      }
    } catch {
      setDeal(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="px-6 py-5">Loading deal...</div>;
  if (!deal) return <div className="px-6 py-5">Deal not found</div>;

  const stageOrder = ["discovery", "qualified", "proposal", "negotiation", "closed"];
  const stageIdx = stageOrder.indexOf(deal.stage);
  const nextStage = stageIdx >= 0 && stageIdx < stageOrder.length - 1 ? stageOrder[stageIdx + 1] : null;

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Pipeline", href: "/agency/pipeline" }, { label: "Deals", href: "/agency/pipeline/deals/list" }, { label: deal.clientName }]} />
      <PageHeader title={deal.clientName} subtitle={`Deal ${deal.id} · ${deal.stage}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Deal Value" value={`$${deal.dealValue.toLocaleString()}`} icon={<span style={{ color: C.gold }}>$</span>} color={C.gold} bg={C.goldBg} />
        <StatCard label="Stage" value={deal.stage} icon={<span style={{ color: C.emerald }}>●</span>} color={C.emerald} bg={C.emeraldBg} />
        <StatCard label="Source" value={deal.source} icon={<span style={{ color: "var(--rig-blue)" }}>◎</span>} color="var(--rig-blue)" bg="var(--rig-blue-bg)" />
        <StatCard label="AI Score" value={score?.result?.tier || "—"} subtext={score?.result?.score ? `${score.result.score}/100` : ""} icon={<span style={{ color: "var(--rig-purple)" }}>AI</span>} color="var(--rig-purple)" bg="var(--rig-purple-bg)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-[12px] uppercase tracking-wider font-semibold mb-3" style={{ color: C.mute }}>Properties</div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              {[
                { label: "Contact", value: deal.contact },
                { label: "Stage", value: deal.stage },
                { label: "Source", value: deal.source },
                { label: "Created", value: new Date(deal.createdAt).toLocaleDateString() },
                { label: "Updated", value: new Date(deal.updatedAt).toLocaleDateString() },
                { label: "Value", value: `$${deal.dealValue.toLocaleString()}` },
              ].map(p => (
                <div key={p.label} className="rounded p-2" style={{ background: "var(--rig-bg)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.mute }}>{p.label}</div>
                  <div style={{ color: C.text }}>{p.value}</div>
                </div>
              ))}
            </div>          </div>

          {deal.notes && (
            <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
              <div className="text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.mute }}>Notes</div>
              <p className="text-[13px]" style={{ color: C.text2 }}>{deal.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>Actions</div>
          {[
            { icon: ArrowRight, label: "Advance Stage", desc: nextStage ? `Move to ${nextStage}` : "Already at closed", color: C.gold },
            { icon: FileText, label: "Generate Proposal", desc: "Draft proposal for this deal", color: C.gold },
            { icon: Mail, label: "Send Follow-up", desc: "Email the prospect", color: C.gold },
            { icon: Trophy, label: "Mark Closed Won", desc: "Close as won", color: C.emerald },
            { icon: XCircle, label: "Mark Closed Lost", desc: "Close as lost", color: C.red },
          ].map(a => (
            <Link
              key={a.label}
              href={`/agency/pipeline/deals/${id}/actions`}
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
