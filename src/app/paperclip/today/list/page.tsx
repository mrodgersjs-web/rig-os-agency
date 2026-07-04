"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function TodayList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/paperclip/tasks");
      const d = await r.json();
      setRows(d.today || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = [{"key":"title","label":"Task"},{"key":"priority","label":"Priority","width":"100px"},{"key":"assignee","label":"Assignee","width":"120px"},{"key":"status","label":"Status","width":"100px"}];

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{"label":"Paperclip","href":"/paperclip"},{"label":"Today"}]} />
      <PageHeader
        title="Today"
        subtitle="Tasks scheduled for today"
        action={{ label: "New", onClick: () => openDetail({ id: "new-today", type: "system", title: "Create Today", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "task", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="No tasks today"
        emptyDescription="You're clear for the day"
      />
    </div>
  );
}
