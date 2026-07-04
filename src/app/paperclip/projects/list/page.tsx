"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ProjectsList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/goals");
      const d = await r.json();
      setRows(d.goals || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = [{"key":"title","label":"Project"},{"key":"status","label":"Status","width":"100px"},{"key":"progress","label":"Progress","width":"100px"}];

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{"label":"Paperclip","href":"/paperclip"},{"label":"Projects"}]} />
      <PageHeader
        title="Projects"
        subtitle="Grouped initiatives and deliverables"
        action={{ label: "New", onClick: () => openDetail({ id: "new-projects", type: "system", title: "Create Project", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "task", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="No projects"
        emptyDescription="Create a project to group tasks"
      />
    </div>
  );
}
