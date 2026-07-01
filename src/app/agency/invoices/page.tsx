"use client";

import { useState, useEffect } from "react";
import { DollarSign, Clock, Check, AlertTriangle, FileText } from "lucide-react";

interface Invoice {
  id: string; clientId: string; clientName: string; amount: number;
  status: string; sentDate: string; paidDate: string | null; dueDate: string;
  lineItems: { description: string; amount: number }[]; createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: "var(--cream-dim)", sent: "#fbbf24", paid: "#5ab896",
  overdue: "#ef4444", void: "var(--cream-mute)",
};

function formatCurrency(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    try {
      const res = await fetch("/api/agency/invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Invoices
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>{invoices.length} invoices</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Paid", value: formatCurrency(totalPaid), icon: <Check size={16} />, color: "var(--emerald)" },
          { label: "Outstanding", value: formatCurrency(totalOutstanding), icon: <Clock size={16} />, color: "#fbbf24" },
          { label: "Overdue", value: formatCurrency(totalOverdue), icon: <AlertTriangle size={16} />, color: "#ef4444" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center gap-2 mb-1"><span style={{ color: k.color }}>{k.icon}</span><span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{k.label}</span></div>
            <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>No invoices yet.</div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const color = statusColors[inv.status] || "var(--cream-dim)";
            return (
              <div key={inv.id} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{inv.clientName}</span>
                    <span className="text-[11px] ml-2 mono" style={{ color: "var(--cream-mute)" }}>{inv.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: color + "20", color }}>{inv.status}</span>
                    <span className="text-[14px] font-semibold" style={{ color: "var(--gold)" }}>{formatCurrency(inv.amount)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--cream-mute)" }}>
                  <span><DollarSign size={10} className="inline" /> Sent: {new Date(inv.sentDate).toLocaleDateString()}</span>
                  {inv.paidDate && <span style={{ color: "var(--emerald)" }}><Check size={10} className="inline" /> Paid: {new Date(inv.paidDate).toLocaleDateString()}</span>}
                  <span><Clock size={10} className="inline" /> Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                </div>
                {inv.lineItems && inv.lineItems.length > 0 && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
                    {inv.lineItems.map((li, i) => (
                      <div key={i} className="flex justify-between text-[12px]" style={{ color: "var(--cream-dim)" }}>
                        <span>{li.description}</span>
                        <span>{formatCurrency(li.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}