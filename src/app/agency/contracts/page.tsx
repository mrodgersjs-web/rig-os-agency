"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, X, Save, Calendar, AlertTriangle, DollarSign, Clock, Check, Zap } from "lucide-react";
import { SERVICE_TIERS } from "@/lib/agency-data";

interface Contract {
  id: string; clientId: string; clientName: string; type: string;
  monthlyFee: number; startDate: string; endDate: string; autoRenew: boolean;
  status: string; terms: string; slaHours: number; createdAt: string;
}

interface Client {
  id: string; name: string; vertical: string; status: string; serviceTier: string; monthlyFee: number;
}

const statusColors: Record<string, string> = {
  active: "#5ab896", draft: "var(--cream-dim)", expiring: "#fbbf24",
  expired: "#ef4444", terminated: "#c4607e",
};

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  return Math.ceil((d - Date.now()) / 86400000);
}

function formatCurrency(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadContracts(); }, []);

  async function loadContracts() {
    try {
      const [conRes, cliRes] = await Promise.all([
        fetch("/api/agency/contracts"),
        fetch("/api/agency/clients"),
      ]);
      const conData = await conRes.json();
      const cliData = await cliRes.json();
      setContracts(conData.contracts || []);
      setClients(cliData.clients || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleStatusChange(id: string, status: string) {
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await fetch("/api/agency/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", id, status }),
    });
  }

  async function handleCreate(data: Record<string, unknown>) {
    await fetch("/api/agency/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowForm(false);
    await loadContracts();
  }

  const alerts = contracts.filter((c) => {
    const days = daysUntil(c.endDate);
    return days > 0 && days <= 90 && c.status === "active";
  });

  const activeContracts = contracts.filter((c) => c.status === "active");
  const totalMRR = activeContracts.reduce((s, c) => s + c.monthlyFee, 0);
  const totalARR = totalMRR * 12;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
            Contracts
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
            {contracts.length} contracts · MRR {formatCurrency(totalMRR)}/mo · ARR {formatCurrency(totalARR)}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition hover:opacity-90" style={{ background: "var(--gold)", color: "var(--bg-deep)" }}>
          <Plus size={16} /> New Contract
        </button>
      </div>

      {/* Renewal Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl p-4 border" style={{ background: "#fbbf2410", borderColor: "#fbbf2444" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} style={{ color: "#fbbf24" }} />
            <span className="text-[13px] font-semibold" style={{ color: "#fbbf24" }}>Renewal Alerts ({alerts.length})</span>
          </div>
          {alerts.map((c) => {
            const days = daysUntil(c.endDate);
            return (
              <div key={c.id} className="flex items-center justify-between py-1.5">
                <span className="text-[13px]" style={{ color: "var(--cream)" }}>{c.clientName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>{formatCurrency(c.monthlyFee)}/mo</span>
                  <span className="text-[12px] font-semibold" style={{ color: days <= 30 ? "#ef4444" : "#fbbf24" }}>
                    {days} days left {c.autoRenew ? "· auto-renews" : "· manual renewal"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contract Cards */}
      {loading ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
          Loading contracts...
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
          No contracts yet. Click &ldquo;New Contract&rdquo; to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => {
            const days = daysUntil(c.endDate);
            const color = statusColors[c.status] || "var(--cream-dim)";
            return (
              <div key={c.id} className="rounded-xl p-4 border transition hover:border-[var(--gold)]" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{c.clientName}</span>
                    <span className="text-[11px] ml-2 capitalize" style={{ color: "var(--cream-mute)" }}>{c.type} tier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className="text-[11px] px-2 py-1 rounded border cursor-pointer outline-none"
                      style={{ background: "var(--bg-mid)", borderColor: color + "44", color }}
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="expiring">expiring</option>
                      <option value="expired">expired</option>
                      <option value="terminated">terminated</option>
                    </select>
                    <span className="text-[14px] font-semibold" style={{ color: "var(--gold)" }}>{formatCurrency(c.monthlyFee)}/mo</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--cream-mute)" }}>
                  <span><Calendar size={10} className="inline" /> Start: {new Date(c.startDate).toLocaleDateString()}</span>
                  <span><Clock size={10} className="inline" /> End: {new Date(c.endDate).toLocaleDateString()} ({days > 0 ? `${days}d left` : "expired"})</span>
                  <span><Shield size={10} className="inline" /> SLA: {c.slaHours}h</span>
                  {c.autoRenew && <span style={{ color: "var(--emerald)" }}>Auto-renew</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <ContractForm clients={clients} onCreate={handleCreate} onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ContractForm({ clients, onCreate, onClose }: {
  clients: Client[];
  onCreate: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    type: "growth",
    monthlyFee: 5000,
    autoRenew: true,
    slaHours: 48,
    contractDurationDays: 365,
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
        type: client.serviceTier || "growth",
        monthlyFee: client.monthlyFee || SERVICE_TIERS.growth?.monthlyFee || 5000,
      }));
    } else {
      update("clientId", id);
    }
  }

  const tiers = Object.entries(SERVICE_TIERS);

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
        className="rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-semibold flex items-center gap-2" style={{ color: "var(--cream)" }}>
            <Shield size={18} style={{ color: "var(--gold)" }} /> New Contract
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-mid)]" style={{ color: "var(--cream-dim)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Client selector */}
          <div>
            <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Select Client *</label>
            {clients.length > 0 ? (
              <select
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.clientId}
                onChange={(e) => selectClient(e.target.value)}
              >
                <option value="">— Select existing client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <input
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.clientName}
                onChange={(e) => update("clientName", e.target.value)}
                placeholder="Client name (no clients loaded)"
              />
            )}
          </div>

          {/* Service Tier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Service Tier</label>
              <select
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.type}
                onChange={(e) => {
                  const tier = SERVICE_TIERS[e.target.value as keyof typeof SERVICE_TIERS];
                  update("type", e.target.value);
                  if (tier) update("monthlyFee", tier.monthlyFee);
                }}
              >
                {tiers.map(([id, tier]) => (
                  <option key={id} value={id}>{tier.name} — ${tier.monthlyFee}/mo</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Monthly Fee ($)</label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.monthlyFee}
                onChange={(e) => update("monthlyFee", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Duration & SLA */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Duration (days)</label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.contractDurationDays}
                onChange={(e) => update("contractDurationDays", parseInt(e.target.value) || 365)}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>SLA (hours)</label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.slaHours}
                onChange={(e) => update("slaHours", parseInt(e.target.value) || 48)}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Auto-Renew</label>
              <button
                onClick={() => update("autoRenew", !form.autoRenew)}
                className="w-full px-3 py-2 rounded-lg border text-[13px] flex items-center justify-center gap-1.5"
                style={{
                  background: form.autoRenew ? "rgba(90,184,150,0.15)" : "var(--bg-mid)",
                  borderColor: form.autoRenew ? "rgba(90,184,150,0.4)" : "var(--line-soft)",
                  color: form.autoRenew ? "var(--emerald)" : "var(--cream-dim)",
                }}
              >
                {form.autoRenew ? <Check size={14} /> : <X size={14} />}
                {form.autoRenew ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg p-3 border" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>Annual Contract Value</span>
              <span className="text-[18px] font-semibold" style={{ color: "var(--gold)" }}>
                {formatCurrency(form.monthlyFee * 12)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onCreate({
              clientId: form.clientId,
              clientName: form.clientName || clients.find((c) => c.id === form.clientId)?.name || "Untitled",
              type: form.type,
              monthlyFee: form.monthlyFee,
              autoRenew: form.autoRenew,
              slaHours: form.slaHours,
              contractDurationDays: form.contractDurationDays,
              status: "active",
            })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition hover:opacity-90"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Save size={14} /> Create Contract
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
