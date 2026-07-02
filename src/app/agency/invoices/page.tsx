"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Clock, Check, AlertTriangle, FileText, Zap, Plus, X, Save } from "lucide-react";

interface Invoice {
  id: string; clientId: string; clientName: string; amount: number;
  status: string; sentDate: string; paidDate: string | null; dueDate: string;
  lineItems: { description: string; amount: number }[]; createdAt: string;
}

interface Client {
  id: string; name: string; monthlyFee: number;
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
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    try {
      const [invRes, cliRes] = await Promise.all([
        fetch("/api/agency/invoices"),
        fetch("/api/agency/clients"),
      ]);
      const invData = await invRes.json();
      const cliData = await cliRes.json();
      setInvoices(invData.invoices || []);
      setClients(cliData.clients || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleStatusChange(id: string, status: string) {
    const paidDate = status === "paid" ? new Date().toISOString() : null;
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status, paidDate } : i)));
    await fetch("/api/agency/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", id, status, paidDate }),
    });
  }

  async function handleGenerateFromContracts() {
    setGenerating(true);
    try {
      const res = await fetch("/api/agency/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateFromContracts" }),
      });
      const data = await res.json();
      if (data.success) {
        await loadInvoices();
      }
    } catch (e) { console.error(e); }
    setGenerating(false);
  }

  async function handleCreate(data: Record<string, unknown>) {
    await fetch("/api/agency/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowForm(false);
    await loadInvoices();
  }

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
            Invoices
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>{invoices.length} invoices</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateFromContracts}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border transition hover:opacity-90"
            style={{ borderColor: "var(--emerald)", color: "var(--emerald)", opacity: generating ? 0.5 : 1 }}
          >
            <Zap size={16} /> {generating ? "Generating..." : "Generate from Contracts"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition hover:opacity-90"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Plus size={16} /> New Invoice
          </button>
        </div>
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
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
          No invoices yet. Use &ldquo;Generate from Contracts&rdquo; or &ldquo;New Invoice&rdquo;.
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const color = statusColors[inv.status] || "var(--cream-dim)";
            return (
              <div key={inv.id} className="rounded-xl p-4 border transition hover:border-[var(--gold)]" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{inv.clientName}</span>
                    <span className="text-[11px] ml-2 font-mono" style={{ color: "var(--cream-mute)" }}>{inv.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                      className="text-[11px] px-2 py-1 rounded border cursor-pointer outline-none"
                      style={{ background: "var(--bg-mid)", borderColor: color + "44", color }}
                    >
                      <option value="draft">draft</option>
                      <option value="sent">sent</option>
                      <option value="paid">paid</option>
                      <option value="overdue">overdue</option>
                      <option value="void">void</option>
                    </select>
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

      <AnimatePresence>
        {showForm && (
          <InvoiceForm clients={clients} onCreate={handleCreate} onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function InvoiceForm({ clients, onCreate, onClose }: {
  clients: Client[];
  onCreate: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    amount: 5000,
    description: "Monthly retainer",
  });

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function selectClient(id: string) {
    const client = clients.find((c) => c.id === id);
    if (client) {
      setForm((prev) => ({
        ...prev,
        clientId: client.id,
        clientName: client.name,
        amount: client.monthlyFee || 5000,
      }));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl border max-w-lg w-full p-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-semibold flex items-center gap-2" style={{ color: "var(--cream)" }}>
            <FileText size={18} style={{ color: "var(--gold)" }} /> New Invoice
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-mid)]" style={{ color: "var(--cream-dim)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Select Client *</label>
            {clients.length > 0 ? (
              <select
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.clientId}
                onChange={(e) => selectClient(e.target.value)}
              >
                <option value="">— Select client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <input
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.clientName}
                onChange={(e) => update("clientName", e.target.value)}
                placeholder="Client name"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Amount ($)</label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.amount}
                onChange={(e) => update("amount", parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Description</label>
              <input
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onCreate({
              clientId: form.clientId,
              clientName: form.clientName || clients.find((c) => c.id === form.clientId)?.name || "Untitled",
              amount: form.amount,
              lineItems: [{ description: form.description, amount: form.amount }],
              status: "sent",
            })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition hover:opacity-90"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Save size={14} /> Create Invoice
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] border transition"
            style={{ borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
