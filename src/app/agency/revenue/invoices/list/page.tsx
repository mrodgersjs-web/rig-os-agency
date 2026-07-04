"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { Plus } from "lucide-react";
import Link from "next/link";

const C = {
  card: "var(--rig-card)", text: "var(--rig-text)", text3: "var(--rig-text-3)", mute: "var(--rig-text-mute)",
  border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
};

interface Invoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  status: string;
  dueDate: string;
}

export default function InvoicesListPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/invoices");
      const d = await r.json();
      setRows(d.invoices || []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => {
    if (s === "paid") return { bg: C.goldBg, color: C.gold };
    if (s === "open") return { bg: "var(--rig-emerald-bg)", color: "var(--rig-emerald)" };
    return { bg: "var(--rig-hover)", color: C.mute };
  };

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Revenue", href: "/agency/revenue" }, { label: "Invoices" }]} />
      <PageHeader
        title="Invoices"
        subtitle="Create, send, and manage customer invoices"
        action={{ label: "New Invoice", onClick: () => {}, icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={[
          { key: "number", label: "Invoice #" },
          { key: "customer", label: "Customer" },
          { key: "amount", label: "Amount", align: "right", width: "100px", render: (row) => `$${row.amount}` },
          {
            key: "status",
            label: "Status",
            width: "100px",
            render: (row) => {
              const sc = statusColor(row.status);
              return <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: sc.bg, color: sc.color }}>{row.status}</span>;
            },
          },
          { key: "dueDate", label: "Due", width: "120px" },
        ]}
        rows={rows}
        loading={loading}
        onRowClick={(row) => window.location.href = `/agency/revenue/invoices/${row.id}/actions`}
        emptyTitle="No invoices"
        emptyDescription="Create your first invoice to bill a customer"
      />
    </div>
  );
}
