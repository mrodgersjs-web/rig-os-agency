"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ActivitiesList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/connections");
      const d = await r.json();
      setRows(d.connections || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = [{"key":"name","label":"Contact"},{"key":"company","label":"Company"},{"key":"type","label":"Type","width":"100px"},{"key":"date","label":"Date","width":"120px"}];

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{"label":"Pipeline","href":"/agency/pipeline"},{"label":"Activities"}]} />
      <PageHeader
        title="Activities"
        subtitle="Calls, emails, meetings, and follow-ups"
        action={{ label: "New", onClick: () => openDetail({ id: "new-activities", type: "system", title: "Create Activitie", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "deal", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="No activities"
        emptyDescription="Log activities to track deal momentum"
      />
    </div>
  );
}
