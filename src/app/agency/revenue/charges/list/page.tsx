"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { useDetail } from "@/components/DetailContext";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ChargesList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/stripe/revenue");
      const d = await r.json();
      setRows(d.recentCharges || d.items || d.rows || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const cols = [{"key":"email","label":"Customer"},{"key":"amount","label":"Amount","align":"right","width":"100px"},{"key":"status","label":"Status","width":"100px"},{"key":"date","label":"Date","width":"120px"}];

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{"label":"Revenue","href":"/agency/revenue"},{"label":"Charges"}]} />
      <PageHeader
        title="Charges"
        subtitle="Recent successful charges and receipts"
        action={{ label: "New", onClick: () => openDetail({ id: "new-charges", type: "system", title: "Create Charge", description: "Open creation flow", source: "UI" }), icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={cols}
        rows={rows}
        loading={loading}
        onRowClick={(row) => openDetail({ id: row.id, type: "revenue", title: row.name || row.title || row.id, description: row.description || "", data: row })}
        emptyTitle="No charges"
        emptyDescription="Charges appear here when Stripe is connected"
      />
    </div>
  );
}
