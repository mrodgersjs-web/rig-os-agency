"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Receipt, Plus, X, Trash2, Download, CheckCircle, Clock, AlertCircle, Ban,
} from "lucide-react";
import type { Invoice } from "@/lib/agency-types";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "var(--cream-dim)", icon: <Clock size={12} /> },
  sent: { label: "Sent", color: "var(--gold)", icon: <Receipt size={12} /> },
  paid: { label: "Paid", color: "var(--emerald)", icon: <CheckCircle size={12} /> },
  overdue: { label: "Overdue", color: "#ef4444", icon: <AlertCircle size={12} /> },
  void: { label: "Void", color: "#666", icon: <Ban size={12} /> },
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(s: string): number {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86400000);
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkPaid(id: string) {
    try {
      await fetch("/api/agency/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "paid", paidDate: new Date().toISOString() }),
      });
      await load();
    } catch {
      // ignore
    }
  }

  async function handleMarkSent(id: string) {
    try {
      await fetch("/api/agency/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "sent", sentDate: new Date().toISOString() }),
      });
      await load();
    } catch {
      // ignore
    }
  }

  async function handleVoid(id: string) {
    try {
      await fetch("/api/agency/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "void" }),
      });
      await load();
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/agency/invoices?id=${id}`, { method: "DELETE" });
      await load();
    } catch {
      // ignore
    }
  }

  function downloadInvoice(inv: Invoice) {
    const content = `RIG OS AGENCY — INVOICE
═══════════════════════════════════════════════

Invoice ID:  ${inv.id}
Client:      ${inv.clientName}
Status:      ${inv.status.toUpperCase()}
Sent Date:   ${fmtDate(inv.sentDate)}
Due Date:    ${fmtDate(inv.dueDate)}
${inv.paidDate ? `Paid Date:    ${fmtDate(inv.paidDate)}` : ""}

═══════════════════════════════════════════════
LINE ITEMS
═══════════════════════════════════════════════

${inv.lineItems.map((item, i) => `${i + 1}. ${item.description} ........................... ${fmtMoney(item.amount)}`).join("\n")}

═══════════════════════════════════════════════
TOTAL DUE: ${fmtMoney(inv.amount)}
═══════════════════════════════════════════════

Payment terms: Net 30
Late fee: 1.5% per month on overdue balances

RIG OS Agency — AI Operator for Vertical Industries
═══════════════════════════════════════════════
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_${inv.id}_${inv.clientName.replace(/\s/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = filterStatus === "all"
    ? invoices
    : invoices.filter((i) => i.status === filterStatus);

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const draftCount = invoices.filter((i) => i.status === "draft").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>Invoices</h1>
        <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>Loading invoices…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Receipt size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Agency Operations
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Invoices
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
              {invoices.length} invoices · {fmtMoney(totalPaid)} collected · {fmtMoney(totalOutstanding)} outstanding
            </p>
          </div>
        </div>
      </motion.section>

      {/* KPI Cards */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Collected", value: fmtMoney(totalPaid), accent: "var(--emerald)" },
          { label: "Outstanding", value: fmtMoney(totalOutstanding), accent: "var(--gold)" },
          { label: "Overdue", value: fmtMoney(totalOverdue), accent: "#ef4444" },
          { label: "Drafts", value: draftCount, accent: "var(--cream-dim)" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>{k.label}</div>
            <div className="text-2xl" style={{ color: k.accent, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500 }}>{k.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "draft", "sent", "paid", "overdue", "void"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors capitalize"
            style={{
              background: filterStatus === s ? "var(--gold)" : "var(--bg-card)",
              color: filterStatus === s ? "var(--bg-deep)" : "var(--cream-dim)",
              border: "1px solid var(--line-soft)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.1 }} className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                {["Invoice #", "Client", "Amount", "Sent", "Due", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "var(--cream-dim)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const statusConfig = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                const dueDays = daysUntil(inv.dueDate);
                return (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                    <td className="px-4 py-3 mono text-[11px]" style={{ color: "var(--cream-mute)" }}>{inv.id}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--cream)" }}>{inv.clientName}</td>
                    <td className="px-4 py-3 font-semibold mono" style={{ color: "var(--gold)" }}>{fmtMoney(inv.amount)}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "var(--cream-dim)" }}>{fmtDate(inv.sentDate)}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: inv.status === "overdue" ? "#ef4444" : "var(--cream-dim)" }}>
                      {fmtDate(inv.dueDate)}
                      {inv.status === "sent" && dueDays < 0 && (
                        <span className="text-[10px] block" style={{ color: "#ef4444" }}>{Math.abs(dueDays)}d overdue</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full inline-flex"
                        style={{ background: "var(--bg-mid)", color: statusConfig.color }}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {inv.status === "draft" && (
                          <button
                            onClick={() => handleMarkSent(inv.id)}
                            className="text-[11px] px-2 py-1 rounded transition-colors"
                            style={{ background: "var(--bg-mid)", color: "var(--gold)" }}
                          >
                            Send
                          </button>
                        )}
                        {(inv.status === "sent" || inv.status === "overdue") && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="text-[11px] px-2 py-1 rounded transition-colors"
                            style={{ background: "var(--bg-mid)", color: "var(--emerald)" }}
                          >
                            Mark Paid
                          </button>
                        )}
                        {inv.status !== "void" && inv.status !== "paid" && (
                          <button
                            onClick={() => handleVoid(inv.id)}
                            className="text-[11px] px-2 py-1 rounded transition-colors"
                            style={{ background: "var(--bg-mid)", color: "var(--cream-mute)" }}
                          >
                            Void
                          </button>
                        )}
                        <button
                          onClick={() => downloadInvoice(inv)}
                          className="p-1 rounded transition-colors"
                          style={{ color: "var(--cream-dim)" }}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1 rounded transition-colors"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center" style={{ color: "var(--cream-dim)" }}>
              No {filterStatus !== "all" ? filterStatus : ""} invoices found.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}