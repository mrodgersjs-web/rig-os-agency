"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function AgentCatalogList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/agents");
      const d = await r.json();
      setRows(d.agents || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = [{"key":"name","label":"Agent"},{"key":"category","label":"Category","width":"120px"},{"key":"role","label":"Role"},{"key":"status","label":"Status","width":"100px"}];

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{"label":"Agents","href":"/agency/agents"},{"label":"Catalog"}]} />
      <PageHeader
        title="Agent Catalog"
        subtitle="All 410 agents across departments"
        action={{ label: "New", onClick: () => openDetail({ id: "new-agent-catalog", type: "system", title: "Create Agent Catalog", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "agent", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="No agents"
        emptyDescription="Agents are loaded from the unified registry"
      />
    </div>
  );
}
