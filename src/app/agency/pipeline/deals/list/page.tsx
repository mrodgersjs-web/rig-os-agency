"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { Plus } from "lucide-react";

const C = {
  gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)",
  blue: "var(--rig-blue)", blueBg: "var(--rig-blue-bg)",
  red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
};

interface Deal {
  id: string;
  clientName: string;
  dealValue: number;
  stage: string;
  probability: number;
  source: string;
}

export default function DealsListPage() {
  const [rows, setRows] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/pipeline-deals?action=list");
      const d = await r.json();
      // Add probability if missing
      const enriched = (d.deals || []).map((deal: any) => ({
        ...deal,
        probability: deal.probability ?? probabilityForStage(deal.stage),
      }));
      setRows(enriched);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function probabilityForStage(stage: string) {
    const map: Record<string, number> = { discovery: 0.1, qualified: 0.25, proposal: 0.5, negotiation: 0.75, closed: 1.0 };
    return map[stage] || 0;
  }

  const stageColor = (stage: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      discovery: { bg: "var(--rig-blue-bg)", color: C.blue },
      qualified: { bg: "var(--rig-purple-bg)", color: "var(--rig-purple)" },
      proposal: { bg: C.goldBg, color: C.gold },
      negotiation: { bg: "var(--rig-orange-bg)", color: "var(--rig-orange)" },
      closed: { bg: C.emeraldBg, color: C.emerald },
    };
    return colors[stage] || { bg: "var(--rig-hover)", color: "var(--rig-text-mute)" };
  };

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Pipeline", href: "/agency/pipeline" }, { label: "Deals" }]} />
      <PageHeader
        title="Deals"
        subtitle="All active opportunities and their stages"
        action={{ label: "New Deal", onClick: () => {}, icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={[
          { key: "clientName", label: "Client" },
          { key: "source", label: "Source", width: "140px" },
          { key: "dealValue", label: "Value", align: "right", width: "100px", render: (row) => `$${row.dealValue.toLocaleString()}` },
          {
            key: "stage",
            label: "Stage",
            width: "120px",
            render: (row) => {
              const sc = stageColor(row.stage);
              return <span className="text-[10px] px-2 py-0.5 rounded font-medium capitalize" style={{ background: sc.bg, color: sc.color }}>{row.stage}</span>;
            },
          },
          { key: "probability", label: "Probability", width: "100px", render: (row) => `${Math.round((row.probability || 0) * 100)}%` },
        ]}
        rows={rows}
        loading={loading}
        onRowClick={(row) => window.location.href = `/agency/pipeline/deals/${row.id}/actions`}
        emptyTitle="No deals"
        emptyDescription="Create a deal to start tracking opportunities"
      />
    </div>
  );
}
