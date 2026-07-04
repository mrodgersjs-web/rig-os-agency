"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ForecastList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/pipeline-deals");
      const d = await r.json();
      setRows(d.deals || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = [{"key":"name","label":"Deal"},{"key":"stage","label":"Stage","width":"120px"},{"key":"value","label":"Value","align":"right","width":"100px"},{"key":"probability","label":"Probability","width":"100px"},{"key":"weighted","label":"Weighted","align":"right","width":"100px"}];

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{"label":"Pipeline","href":"/agency/pipeline"},{"label":"Forecast"}]} />
      <PageHeader
        title="Forecast"
        subtitle="Weighted pipeline forecast by stage"
        action={{ label: "New", onClick: () => openDetail({ id: "new-forecast", type: "system", title: "Create Forecast", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "deal", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="No forecast data"
        emptyDescription="Add deals to generate a forecast"
      />
    </div>
  );
}
