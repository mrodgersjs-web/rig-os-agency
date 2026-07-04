"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { DataTable } from "@/components/DataTable";
import { Plus } from "lucide-react";

const C = {
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)",
  red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
  gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
};

interface Client {
  id: string;
  name: string;
  vertical: string;
  serviceTier: string;
  monthlyFee: number;
  health: string;
  status: string;
}

export default function ActiveClientsListPage() {
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/clients");
      const d = await r.json();
      setRows((d.clients || []).filter((c: any) => c.status === "active"));
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const healthColor = (h: string) => {
    if (h === "green") return { bg: C.emeraldBg, color: C.emerald };
    if (h === "yellow") return { bg: C.goldBg, color: C.gold };
    if (h === "red") return { bg: C.redBg, color: C.red };
    return { bg: "var(--rig-hover)", color: "var(--rig-text-mute)" };
  };

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Clients", href: "/agency/clients" }, { label: "Active" }]} />
      <PageHeader
        title="Active Clients"
        subtitle="Currently paying and engaged clients"
        action={{ label: "New Client", onClick: () => {}, icon: <Plus size={12} /> }}
      />
      <DataTable
        columns={[
          { key: "name", label: "Client" },
          { key: "vertical", label: "Vertical", width: "120px" },
          { key: "serviceTier", label: "Tier", width: "100px", render: (row) => <span className="capitalize">{row.serviceTier}</span> },
          { key: "monthlyFee", label: "MRR", align: "right", width: "100px", render: (row) => `$${row.monthlyFee.toLocaleString()}` },
          {
            key: "health",
            label: "Health",
            width: "80px",
            render: (row) => {
              const hc = healthColor(row.health);
              return <span className="text-[10px] px-2 py-0.5 rounded font-medium capitalize" style={{ background: hc.bg, color: hc.color }}>{row.health}</span>;
            },
          },
        ]}
        rows={rows}
        loading={loading}
        onRowClick={(row) => window.location.href = `/agency/clients/${row.id}/actions`}
        emptyTitle="No active clients"
        emptyDescription="Activate a prospect to see them here"
      />
    </div>
  );
}
