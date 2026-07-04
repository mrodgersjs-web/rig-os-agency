"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function DepartmentsList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency-agents");
      const d = await r.json();
      setRows(d.departments || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = [{"key":"name","label":"Department"},{"key":"count","label":"Agents","align":"right","width":"80px"},{"key":"roles","label":"Roles"}];

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{"label":"Agents","href":"/agency/agents"},{"label":"Departments"}]} />
      <PageHeader
        title="Departments"
        subtitle="Agent teams by function"
        action={{ label: "New", onClick: () => openDetail({ id: "new-departments", type: "system", title: "Create Department", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "agent", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="No departments"
        emptyDescription="Department data comes from agency-agents catalog"
      />
    </div>
  );
}
