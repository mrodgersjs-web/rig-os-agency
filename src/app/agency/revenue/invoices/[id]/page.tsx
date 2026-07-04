"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader, StatCard } from "@/components/DepartmentUI";
import { Send, CheckCircle2, XCircle, RotateCcw, ArrowRight } from "lucide-react";

const C = {
  card: "var(--rig-card)", text: "var(--rig-text)", text2: "var(--rig-text-2)", text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)", border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)", red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
};

interface Invoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  status: string;
  dueDate: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/invoices");
      const d = await r.json();
      const found = (d.invoices || []).find((inv: Invoice) => inv.id === id);
      setInvoice(found || null);
    } catch {
      setInvoice(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="px-6 py-5">Loading invoice...</div>;
  if (!invoice) return <div className="px-6 py-5">Invoice not found</div>;

  const statusColor = (s: string) => {
    if (s === "paid") return { bg: C.emeraldBg, color: C.emerald };
    if (s === "open") return { bg: C.goldBg, color: C.gold };
    return { bg: C.redBg, color: C.red };
  };
  const sc = statusColor(invoice.status);

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Revenue", href: "/agency/revenue" }, { label: "Invoices", href: "/agency/revenue/invoices/list" }, { label: invoice.number }]} />
      <PageHeader title={`Invoice ${invoice.number}`} subtitle={`${invoice.customer} · ${invoice.status}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Amount" value={`$${invoice.amount.toLocaleString()}`} icon={<span style={{ color: C.gold }}>$</span>} color={C.gold} bg={C.goldBg} />
        <StatCard label="Status" value={invoice.status} icon={<span style={{ color: sc.color }}>●</span>} color={sc.color} bg={sc.bg} />
        <StatCard label="Customer" value={invoice.customer} icon={<span style={{ color: "var(--rig-blue)" }}>@</span>} color="var(--rig-blue)" bg="var(--rig-blue-bg)" />
        <StatCard label="Due Date" value={invoice.dueDate} icon={<span style={{ color: C.emerald }}>D</span>} color={C.emerald} bg={C.emeraldBg} />
      </div>

      <div className="rounded-lg border p-4 mb-6" style={{ background: C.goldBg, borderColor: C.gold, color: C.gold }}>
        <div className="text-[12px] font-medium mb-1">Stripe Integration Required</div>
        <div className="text-[11px]">Invoice actions require STRIPE_SECRET_KEY in ~/.hermes/.env. The actions page will show the honest integration state.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { icon: Send, label: "Send Invoice", desc: "Email invoice to customer", color: C.gold },
          { icon: CheckCircle2, label: "Mark Paid", desc: "Record payment manually", color: C.emerald },
          { icon: XCircle, label: "Void Invoice", desc: "Cancel open invoice", color: C.red },
          { icon: RotateCcw, label: "Refund", desc: "Issue a refund", color: C.red },
        ].map(a => (
          <Link
            key={a.label}
            href={`/agency/revenue/invoices/${id}/actions`}
            className="flex items-center gap-3 rounded-lg p-3 border transition hover:shadow-md"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ background: a.color + "15", color: a.color }}>
              <a.icon size={14} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium" style={{ color: C.text }}>{a.label}</div>
              <div className="text-[11px]" style={{ color: C.text3 }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
