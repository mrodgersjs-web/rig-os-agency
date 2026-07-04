"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function CustomersList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/clients");
      const d = await r.json();
      setRows(d.clients || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = [{"key":"name","label":"Name"},{"key":"vertical","label":"Vertical","width":"120px"},{"key":"monthlyFee","label":"MRR","align":"right","width":"100px"},{"key":"status","label":"Status","width":"100px"}];

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{"label":"Revenue","href":"/agency/revenue"},{"label":"Customers"}]} />
      <PageHeader
        title="Customers"
        subtitle="Stripe customer records and billing details"
        action={{ label: "New", onClick: () => openDetail({ id: "new-customers", type: "system", title: "Create Customer", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "client", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="No customers"
        emptyDescription="Customers appear when Stripe is connected"
      />
    </div>
  );
}
