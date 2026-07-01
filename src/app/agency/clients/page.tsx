"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, Trash2, Edit3, X, Save,
  Building2, Heart, DollarSign, Activity, Filter,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  vertical: string;
  status: string;
  health: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  serviceTier: string;
  monthlyFee: number;
  annualFee: number;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  services: string[];
  assignedAgents: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Vertical {
  id: string;
  name: string;
  color: string;
}

const VERTICALS: Vertical[] = [
  { id: "construction", name: "Construction", color: "#d4a574" },
  { id: "law", name: "Law Firms", color: "#5ab896" },
  { id: "healthcare", name: "Healthcare", color: "#ef4444" },
  { id: "dental", name: "Dental", color: "#22d3ee" },
  { id: "cpa", name: "CPA", color: "#fbbf24" },
  { id: "services", name: "Services", color: "#a855f7" },
  { id: "manufacturing", name: "Manufacturing", color: "#c97c5e" },
  { id: "pe_cfo", name: "PE / CFO", color: "#c4607e" },
];

const SERVICE_TIERS = [
  { id: "starter", name: "Starter", fee: 2500 },
  { id: "growth", name: "Growth", fee: 5000 },
  { id: "scale", name: "Scale", fee: 8000 },
  { id: "enterprise", name: "Enterprise", fee: 18000 },
];

const STATUSES = ["prospect", "qualified", "proposal_sent", "negotiation", "active", "churned", "lost"];
const HEALTHS = ["green", "yellow", "red"];

const healthColors: Record<string, string> = {
  green: "#5ab896",
  yellow: "#fbbf24",
  red: "#ef4444",
};

const statusColors: Record<string, string> = {
  active: "#5ab896",
  prospect: "#a855f7",
  qualified: "#22d3ee",
  proposal_sent: "#fbbf24",
  negotiation: "#c4607e",
  churned: "#ef4444",
  lost: "#ef4444",
};

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [filterVertical, setFilterVertical] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      setClients(data.clients || []);
    } catch (e) {
      console.error("Failed to load clients:", e);
    }
    setLoading(false);
  }

  async function handleSave(client: Partial<Client>) {
    if (editingClient) {
      await fetch(`/api/agency/clients/${editingClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });
    } else {
      await fetch("/api/agency/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });
    }
    setShowForm(false);
    setEditingClient(null);
    await loadClients();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    await fetch(`/api/agency/clients/${id}`, { method: "DELETE" });
    await loadClients();
  }

  function handleEdit(client: Client) {
    setEditingClient(client);
    setShowForm(true);
  }

  // Filtered clients
  const filtered = clients.filter((c) => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase());
    const matchesVertical = filterVertical === "all" || c.vertical === filterVertical;
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesVertical && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
            Clients
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
            {clients.length} clients across {VERTICALS.length} verticals — SQLite persisted
          </p>
        </div>
        <button
          onClick={() => { setEditingClient(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition"
          style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
        >
          <Plus size={16} /> New Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <Search size={14} style={{ color: "var(--cream-dim)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="bg-transparent text-[13px] outline-none w-48"
            style={{ color: "var(--cream)" }}
          />
        </div>
        <select
          value={filterVertical}
          onChange={(e) => setFilterVertical(e.target.value)}
          className="px-3 py-2 rounded-lg border text-[13px] outline-none"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
        >
          <option value="all">All Verticals</option>
          {VERTICALS.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border text-[13px] outline-none"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Client Table */}
      {loading ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
          Loading clients from SQLite...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
          No clients match your filters.
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                {["Client", "Vertical", "Status", "Health", "Tier", "MRR", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const vert = VERTICALS.find((v) => v.id === client.vertical);
                return (
                  <tr key={client.id} style={{ borderBottom: "1px solid var(--line-soft)" }} className="hover:bg-[var(--bg-mid)] transition">
                    <td className="px-4 py-3">
                      <div className="text-[14px] font-medium" style={{ color: "var(--cream)" }}>{client.name}</div>
                      <div className="text-[11px]" style={{ color: "var(--cream-mute)" }}>{client.contactName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] px-2 py-0.5 rounded" style={{ background: (vert?.color || "#999") + "20", color: vert?.color || "#999" }}>
                        {vert?.name || client.vertical}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px]" style={{ color: statusColors[client.status] || "var(--cream-dim)" }}>
                        {client.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: healthColors[client.health] }} />
                        <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>{client.health}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] capitalize" style={{ color: "var(--cream)" }}>{client.serviceTier}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--gold)" }}>{formatCurrency(client.monthlyFee)}/mo</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(client)} className="p-1.5 rounded hover:bg-[var(--bg-mid)] transition" style={{ color: "var(--cream-dim)" }}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDelete(client.id)} className="p-1.5 rounded hover:bg-[var(--bg-mid)] transition" style={{ color: "var(--cream-dim)" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ClientForm
            client={editingClient}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditingClient(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Client Form Modal ──────────────────────────────────────────────
function ClientForm({ client, onSave, onClose }: {
  client: Client | null;
  onSave: (client: Partial<Client>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: client?.name || "",
    vertical: client?.vertical || "services",
    status: client?.status || "prospect",
    health: client?.health || "green",
    contactName: client?.contactName || "",
    contactEmail: client?.contactEmail || "",
    contactPhone: client?.contactPhone || "",
    website: client?.website || "",
    serviceTier: client?.serviceTier || "starter",
    monthlyFee: client?.monthlyFee || 2500,
    annualFee: client?.annualFee || 30000,
    autoRenew: client?.autoRenew || false,
    notes: client?.notes || "",
  });

  function update(field: string, value: unknown) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "serviceTier") {
        const tier = SERVICE_TIERS.find((t) => t.id === value);
        if (tier) {
          next.monthlyFee = tier.fee;
          next.annualFee = tier.fee * 12;
        }
      }
      if (field === "monthlyFee") {
        next.annualFee = (value as number) * 12;
      }
      return next;
    });
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border text-[13px] outline-none focus:border-[var(--gold)]";
  const inputStyle = { background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" };
  const labelClass = "text-[11px] uppercase tracking-wider mb-1 block";
  const labelStyle = { color: "var(--cream-dim)" };

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
          <h2 className="text-[18px] font-semibold" style={{ color: "var(--cream)" }}>
            {client ? "Edit Client" : "New Client"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-mid)]" style={{ color: "var(--cream-dim)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <label className={labelClass} style={labelStyle}>Client Name *</label>
            <input className={inputClass} style={inputStyle} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Acme Corp" />
          </div>

          {/* Vertical */}
          <div>
            <label className={labelClass} style={labelStyle}>Vertical</label>
            <select className={inputClass} style={inputStyle} value={form.vertical} onChange={(e) => update("vertical", e.target.value)}>
              {VERTICALS.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          {/* Service Tier */}
          <div>
            <label className={labelClass} style={labelStyle}>Service Tier</label>
            <select className={inputClass} style={inputStyle} value={form.serviceTier} onChange={(e) => update("serviceTier", e.target.value)}>
              {SERVICE_TIERS.map((t) => <option key={t.id} value={t.id}>{t.name} (${t.fee}/mo)</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className={labelClass} style={labelStyle}>Status</label>
            <select className={inputClass} style={inputStyle} value={form.status} onChange={(e) => update("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          {/* Health */}
          <div>
            <label className={labelClass} style={labelStyle}>Health</label>
            <select className={inputClass} style={inputStyle} value={form.health} onChange={(e) => update("health", e.target.value)}>
              {HEALTHS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Contact Name */}
          <div>
            <label className={labelClass} style={labelStyle}>Contact Name</label>
            <input className={inputClass} style={inputStyle} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="John Smith" />
          </div>

          {/* Contact Email */}
          <div>
            <label className={labelClass} style={labelStyle}>Contact Email</label>
            <input className={inputClass} style={inputStyle} value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="john@acme.com" />
          </div>

          {/* Contact Phone */}
          <div>
            <label className={labelClass} style={labelStyle}>Contact Phone</label>
            <input className={inputClass} style={inputStyle} value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} placeholder="303-555-0100" />
          </div>

          {/* Website */}
          <div>
            <label className={labelClass} style={labelStyle}>Website</label>
            <input className={inputClass} style={inputStyle} value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="acme.com" />
          </div>

          {/* Monthly Fee */}
          <div>
            <label className={labelClass} style={labelStyle}>Monthly Fee ($)</label>
            <input type="number" className={inputClass} style={inputStyle} value={form.monthlyFee} onChange={(e) => update("monthlyFee", parseInt(e.target.value) || 0)} />
          </div>

          {/* Annual Fee */}
          <div>
            <label className={labelClass} style={labelStyle}>Annual Fee ($)</label>
            <input type="number" className={inputClass} style={inputStyle} value={form.annualFee} onChange={(e) => update("annualFee", parseInt(e.target.value) || 0)} />
          </div>

          {/* Auto Renew */}
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={form.autoRenew} onChange={(e) => update("autoRenew", e.target.checked)} id="autoRenew" />
            <label htmlFor="autoRenew" className="text-[13px]" style={{ color: "var(--cream-dim)" }}>Auto-renew contract</label>
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className={labelClass} style={labelStyle}>Notes</label>
            <textarea className={inputClass} style={inputStyle} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Context, pilot results, renewal status..." />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onSave(form)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Save size={14} /> {client ? "Update Client" : "Create Client"}
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