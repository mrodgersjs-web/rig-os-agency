"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Plus, Search, Edit3, Trash2, X, Building2,
  Mail, Phone, Globe, Heart, Activity, DollarSign, Shield,
  ChevronDown, Filter,
} from "lucide-react";
import type { Client, VerticalId, ClientStatus, ClientHealth, ServiceTierId } from "@/lib/agency-types";
import { VERTICALS, SERVICE_TIERS } from "@/lib/agency-data";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STATUS_COLORS: Record<ClientStatus, string> = {
  active: "var(--emerald)",
  prospect: "var(--gold)",
  qualified: "#22d3ee",
  proposal_sent: "var(--plum)",
  negotiation: "#fbbf24",
  churned: "#ef4444",
  lost: "#6e6353",
};

const HEALTH_COLORS: Record<ClientHealth, string> = {
  green: "var(--emerald)",
  yellow: "var(--gold)",
  red: "#ef4444",
};

const STATUSES: ClientStatus[] = ["prospect", "qualified", "proposal_sent", "negotiation", "active", "churned", "lost"];
const HEALTHS: ClientHealth[] = ["green", "yellow", "red"];
const TIERS: ServiceTierId[] = ["starter", "growth", "scale", "enterprise"];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterVertical, setFilterVertical] = useState<VerticalId | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ClientStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(search.toLowerCase());
    const matchesVertical = filterVertical === "all" || c.vertical === filterVertical;
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesVertical && matchesStatus;
  });

  async function handleSave(clientData: Partial<Client>) {
    try {
      if (editingClient) {
        // Update
        const res = await fetch(`/api/agency/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientData),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Failed to update client");
          return;
        }
      } else {
        // Create
        const res = await fetch("/api/agency/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientData),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Failed to create client");
          return;
        }
      }
      setShowModal(false);
      setEditingClient(null);
      await fetchClients();
    } catch {
      setError("Network error");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/agency/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete client");
        return;
      }
      setDeleteConfirm(null);
      await fetchClients();
    } catch {
      setError("Network error");
    }
  }

  // Summary stats
  const activeCount = clients.filter((c) => c.status === "active").length;
  const totalARR = clients.filter((c) => c.status === "active").reduce((s, c) => s + c.annualFee, 0);
  const pipelineClients = clients.filter((c) => ["prospect", "qualified", "proposal_sent", "negotiation"].includes(c.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Users size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Agency Operations
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
          Clients
        </h1>
        <p className="text-[14px] mt-2" style={{ color: "var(--cream-dim)" }}>
          Full CRUD client management with vertical filtering, health scoring, service tier assignment, and agent allocation.
        </p>
      </motion.section>

      {/* Summary cards */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Clients", value: String(clients.length), icon: <Users size={16} />, accent: "var(--gold)" },
            { label: "Active", value: String(activeCount), icon: <Activity size={16} />, accent: "var(--emerald)" },
            { label: "In Pipeline", value: String(pipelineClients), icon: <Shield size={16} />, accent: "var(--plum)" },
            { label: "Total ARR", value: formatCurrency(totalARR), icon: <DollarSign size={16} />, accent: "#22d3ee" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{kpi.label}</span>
              </div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: kpi.accent }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Controls */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--cream-mute)" }} />
            <input
              type="text"
              placeholder="Search clients, contacts, emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg pl-9 pr-3 py-2 text-[13px] border outline-none"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
            />
          </div>

          {/* Vertical filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--cream-mute)" }} />
            <select
              value={filterVertical}
              onChange={(e) => setFilterVertical(e.target.value as VerticalId | "all")}
              className="rounded-lg pl-9 pr-8 py-2 text-[13px] border outline-none appearance-none cursor-pointer"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
            >
              <option value="all">All Verticals</option>
              {VERTICALS.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ClientStatus | "all")}
              className="rounded-lg pl-3 pr-8 py-2 text-[13px] border outline-none appearance-none cursor-pointer"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Add button */}
          <button
            onClick={() => { setEditingClient(null); setShowModal(true); }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium border transition hover:opacity-80"
            style={{ background: "var(--gold)", borderColor: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Plus size={14} />
            Add Client
          </button>
        </div>
      </motion.section>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-[13px]" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">dismiss</button>
        </div>
      )}

      {/* Client table */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          {loading ? (
            <div className="p-12 text-center text-[13px]" style={{ color: "var(--cream-dim)" }}>Loading clients...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[13px]" style={{ color: "var(--cream-dim)" }}>
              No clients found. {search || filterVertical !== "all" || filterStatus !== "all" ? "Try adjusting filters." : "Add your first client."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--cream-mute)" }}>Client</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--cream-mute)" }}>Vertical</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--cream-mute)" }}>Status</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--cream-mute)" }}>Health</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--cream-mute)" }}>Tier</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-right" style={{ color: "var(--cream-mute)" }}>MRR</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-right" style={{ color: "var(--cream-mute)" }}>ARR</th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-center" style={{ color: "var(--cream-mute)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client, i) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b transition hover:opacity-80"
                      style={{ borderColor: "var(--line-soft)" }}
                    >
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{client.name}</div>
                        <div className="text-[11px]" style={{ color: "var(--cream-mute)" }}>{client.contactName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] px-2 py-1 rounded-md" style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}>
                          {VERTICALS.find((v) => v.id === client.vertical)?.name || client.vertical}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-medium" style={{ color: STATUS_COLORS[client.status] }}>
                          {client.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: HEALTH_COLORS[client.health] }} />
                          <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>{client.health}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
                          {SERVICE_TIERS.find((t) => t.id === client.serviceTier)?.name || client.serviceTier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-mono" style={{ color: "var(--gold)" }}>
                        {formatCurrency(client.monthlyFee)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-mono" style={{ color: "var(--emerald)" }}>
                        {formatCurrency(client.annualFee)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setEditingClient(client); setShowModal(true); }}
                            className="p-1.5 rounded-md transition hover:opacity-70"
                            style={{ color: "var(--cream-dim)" }}
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(client.id)}
                            className="p-1.5 rounded-md transition hover:opacity-70"
                            style={{ color: "#ef4444" }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.section>

      {/* Add/Edit Modal */}
      {showModal && (
        <ClientModal
          client={editingClient}
          onClose={() => { setShowModal(false); setEditingClient(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setDeleteConfirm(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-xl p-6 border max-w-sm w-full mx-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
          >
            <h3 className="text-[16px] font-semibold mb-2" style={{ color: "var(--cream)" }}>Delete Client?</h3>
            <p className="text-[13px] mb-4" style={{ color: "var(--cream-dim)" }}>
              This will permanently remove the client and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-[13px] border"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg text-[13px] font-medium"
                style={{ background: "#ef4444", color: "var(--cream)" }}
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ── Client Modal (Add/Edit Form) ─────────────────────────────────
function ClientModal({
  client,
  onClose,
  onSave,
}: {
  client: Client | null;
  onClose: () => void;
  onSave: (data: Partial<Client>) => void;
}) {
  const [form, setForm] = useState({
    name: client?.name || "",
    vertical: client?.vertical || ("construction" as VerticalId),
    status: client?.status || ("prospect" as ClientStatus),
    health: client?.health || ("green" as ClientHealth),
    contactName: client?.contactName || "",
    contactEmail: client?.contactEmail || "",
    contactPhone: client?.contactPhone || "",
    website: client?.website || "",
    serviceTier: client?.serviceTier || ("starter" as ServiceTierId),
    monthlyFee: client?.monthlyFee || 2500,
    annualFee: client?.annualFee || 30000,
    autoRenew: client?.autoRenew ?? false,
    notes: client?.notes || "",
  });

  const inputStyle = {
    background: "var(--bg-mid)",
    border: "1px solid var(--line-soft)",
    color: "var(--cream)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
  } as React.CSSProperties;

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--cream-mute)",
    marginBottom: "4px",
    display: "block",
  };

  // Auto-calculate annual fee from monthly
  function updateMonthlyFee(val: number) {
    setForm({ ...form, monthlyFee: val, annualFee: val * 12 });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl border max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10" style={{ borderColor: "var(--line-soft)", background: "var(--bg-card)" }}>
          <div className="flex items-center gap-2">
            {client ? <Edit3 size={16} style={{ color: "var(--gold)" }} /> : <Plus size={16} style={{ color: "var(--emerald)" }} />}
            <h3 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
              {client ? "Edit Client" : "Add New Client"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md transition hover:opacity-70" style={{ color: "var(--cream-mute)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Client Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Acme Corp" />
            </div>
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} style={inputStyle} placeholder="Jane Doe" />
            </div>
            <div>
              <label style={labelStyle}>Contact Email</label>
              <input required type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} style={inputStyle} placeholder="jane@acme.com" />
            </div>
            <div>
              <label style={labelStyle}>Contact Phone</label>
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} style={inputStyle} placeholder="303-555-0100" />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} style={inputStyle} placeholder="acme.com" />
            </div>
            <div>
              <label style={labelStyle}>Vertical</label>
              <select value={form.vertical} onChange={(e) => setForm({ ...form, vertical: e.target.value as VerticalId })} style={inputStyle}>
                {VERTICALS.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })} style={inputStyle}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Health</label>
              <select value={form.health} onChange={(e) => setForm({ ...form, health: e.target.value as ClientHealth })} style={inputStyle}>
                {HEALTHS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Service Tier</label>
              <select
                value={form.serviceTier}
                onChange={(e) => {
                  const tier = SERVICE_TIERS.find((t) => t.id === e.target.value);
                  setForm({ ...form, serviceTier: e.target.value as ServiceTierId, monthlyFee: tier?.monthlyFee || form.monthlyFee, annualFee: tier?.annualFee || form.annualFee });
                }}
                style={inputStyle}
              >
                {TIERS.map((t) => {
                  const tier = SERVICE_TIERS.find((s) => s.id === t);
                  return (
                    <option key={t} value={t}>{tier?.name} — {formatCurrency(tier?.monthlyFee || 0)}/mo</option>
                  );
                })}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Monthly Fee ($)</label>
              <input type="number" value={form.monthlyFee} onChange={(e) => updateMonthlyFee(Number(e.target.value))} style={inputStyle} min={0} />
            </div>
            <div>
              <label style={labelStyle}>Annual Fee ($)</label>
              <input type="number" value={form.annualFee} onChange={(e) => setForm({ ...form, annualFee: Number(e.target.value) })} style={inputStyle} min={0} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} className="accent-[var(--gold)]" />
                <span className="text-[12px]" style={{ color: "var(--cream-dim)" }}>Auto-renew</span>
              </label>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: "60px" }} placeholder="Internal notes about this client..." />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] border" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: "var(--gold)", color: "var(--bg-deep)" }}>
              {client ? "Save Changes" : "Create Client"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}