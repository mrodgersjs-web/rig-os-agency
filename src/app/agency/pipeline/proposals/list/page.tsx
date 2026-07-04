"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ProposalsList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/proposals");
      const d = await r.json();
      setRows(d.proposals || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = [{"key":"title","label":"Title"},{"key":"client","label":"Client"},{"key":"value","label":"Value","align":"right","width":"100px"},{"key":"status","label":"Status","width":"100px"}];

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{"label":"Pipeline","href":"/agency/pipeline"},{"label":"Proposals"}]} />
      <PageHeader
        title="Proposals"
        subtitle="Draft and sent proposals"
        action={{ label: "New", onClick: () => openDetail({ id: "new-proposals", type: "system", title: "Create Proposal", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "deal", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="No proposals"
        emptyDescription="Generate a proposal from a deal"
      />
    </div>
  );
}
