"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Plus, X, Trash2, Mail, Phone, Globe, Activity,
} from "lucide-react";
import type { Client, Vertical, ServiceTier, ClientStatus, ClientHealth } from "@/lib/agency-types";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const STATUS_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  active: "Active",
  churned: "Churned",
  lost: "Lost",
};

const STATUS_COLORS: Record<string, string> = {
  prospect: "#a855f7",
  qualified: "#fbbf24",
  proposal_sent: "#d4a574",
  negotiation: "#c4607e",
  active: "#5ab896",
  churned: "#ef4444",
  lost: "#666",
};

const HEALTH_COLORS: Record<string, string> = {
  green: "#5ab896",
  yellow: "#fbbf24",
  red: "#ef4444",
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [tiers, setTiers] = useState<ServiceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterVertical, setFilterVertical] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createForm, setCreateForm] = useState({
    name: "",
    vertical: "services",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    serviceTier: "starter",
    monthlyFee: 2500,
    notes: "",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/clients/crud");
      const data = await res.json();
      setClients(data.clients || []);
      setVerticals(data.verticals || []);
      setTiers(data.serviceTiers || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!createForm.name || !createForm.contactName || !createForm.contactEmail) return;
    try {
      await fetch("/api/agency/clients/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          annualFee: createForm.monthlyFee * 12,
          status: "prospect",
          health: "green",
          autoRenew: false,
          services: [],
          assignedAgents: [],
        }),
      });
      await load();
      setShowCreate(false);
      setCreateForm({
        name: "",
        vertical: "services",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        website: "",
        serviceTier: "starter",
        monthlyFee: 2500,
        notes: "",
      });
    } catch {
      // ignore
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await fetch("/api/agency/clients/crud", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await load();
    } catch {
      // ignore
    }
  }

  async function handleUpdateHealth(id: string, health: string) {
    try {
      await fetch("/api/agency/clients/crud", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, health }),
      });
      await load();
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/agency/clients/crud?id=${id}`, { method: "DELETE" });
      await load();
    } catch {
      // ignore
    }
  }

  const filtered = clients.filter((c) => {
    if (filterVertical !== "all" && c.vertical !== filterVertical) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  const activeClients = clients.filter((c) => c.status === "active");
  const totalARR = activeClients.reduce((s, c) => s + c.annualFee, 0);
  const totalMRR = activeClients.reduce((s, c) => s + c.monthlyFee, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>Clients</h1>
        <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>Loading clients…</div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Clients
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
              {clients.length} total · {activeClients.length} active · {fmtMoney(totalMRR)}/mo · {fmtMoney(totalARR)}/yr
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Plus size={16} />
            <span className="text-[13px] font-semibold">Add Client</span>
          </button>
        </div>
      </motion.section>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>Vertical:</span>
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="px-2 py-1 rounded-lg text-[12px] outline-none"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)", border: "1px solid var(--line-soft)" }}
          >
            <option value="all">All</option>
            {verticals.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1 rounded-lg text-[12px] outline-none"
            style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)", border: "1px solid var(--line-soft)" }}
          >
            <option value="all">All</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <span className="text-[12px] ml-auto" style={{ color: "var(--cream-mute)" }}>{filtered.length} shown</span>
      </div>

      {/* Client Cards */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => {
          const vInfo = verticals.find((v) => v.id === c.vertical);
          const tierInfo = tiers.find((t) => t.id === c.serviceTier);
          return (
            <div
              key={c.id}
              className="rounded-xl p-5 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: HEALTH_COLORS[c.health] }}
                      title={`Health: ${c.health}`}
                    />
                    <span className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {vInfo && (
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: vInfo.color }}>
                        {vInfo.name}
                      </span>
                    )}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-mid)", color: STATUS_COLORS[c.status] }}
                    >
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-semibold mono" style={{ color: "var(--gold)" }}>{fmtMoney(c.monthlyFee)}/mo</div>
                  <div className="text-[11px] mono" style={{ color: "var(--emerald)" }}>{fmtMoney(c.annualFee)}/yr</div>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--cream-dim)" }}>
                  <Users size={13} style={{ color: "var(--cream-mute)" }} />
                  {c.contactName}
                </div>
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--cream-dim)" }}>
                  <Mail size={13} style={{ color: "var(--cream-mute)" }} />
                  {c.contactEmail}
                </div>
                {c.contactPhone && (
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--cream-dim)" }}>
                    <Phone size={13} style={{ color: "var(--cream-mute)" }} />
                    {c.contactPhone}
                  </div>
                )}
                {c.website && (
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--cream-dim)" }}>
                    <Globe size={13} style={{ color: "var(--cream-mute)" }} />
                    {c.website}
                  </div>
                )}
              </div>

              {/* Tier & Services */}
              {tierInfo && (
                <div className="mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: tierInfo.color }}>
                    {tierInfo.name} tier
                  </span>
                </div>
              )}
              {c.services.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Services</div>
                  <div className="flex flex-wrap gap-1">
                    {c.services.map((s, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {c.notes && (
                <div className="text-[11px] mb-3 italic" style={{ color: "var(--cream-mute)" }}>
                  "{c.notes}"
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
                {/* Status selector */}
                <select
                  value={c.status}
                  onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                  className="px-2 py-1 rounded-lg text-[11px] outline-none"
                  style={{ background: "var(--bg-mid)", color: "var(--cream-dim)", border: "1px solid var(--line-soft)" }}
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {/* Health selector */}
                <select
                  value={c.health}
                  onChange={(e) => handleUpdateHealth(c.id, e.target.value)}
                  className="px-2 py-1 rounded-lg text-[11px] outline-none"
                  style={{ background: "var(--bg-mid)", color: "var(--cream-dim)", border: "1px solid var(--line-soft)" }}
                >
                  <option value="green">🟢 Green</option>
                  <option value="yellow">🟡 Yellow</option>
                  <option value="red">🔴 Red</option>
                </select>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="ml-auto p-1.5 rounded-lg transition-colors"
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && !loading && (
        <div className="rounded-xl p-8 text-center border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <Users size={32} style={{ color: "var(--cream-mute)", margin: "0 auto 8px" }} />
          <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>No clients match the current filter.</div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreate(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border max-w-lg w-full max-h-[85vh] overflow-y-auto"
            style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: "var(--line-soft)", background: "var(--bg-mid)" }}>
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--cream)" }}>Add Client</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: "var(--cream-mute)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Company Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Vertical</label>
                <select
                  value={createForm.vertical}
                  onChange={(e) => setCreateForm({ ...createForm, vertical: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                >
                  {verticals.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Contact Name *</label>
                  <input
                    type="text"
                    value={createForm.contactName}
                    onChange={(e) => setCreateForm({ ...createForm, contactName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Contact Email *</label>
                  <input
                    type="email"
                    value={createForm.contactEmail}
                    onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                    placeholder="jane@acme.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Phone</label>
                  <input
                    type="text"
                    value={createForm.contactPhone}
                    onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                    placeholder="303-555-0100"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Website</label>
                  <input
                    type="text"
                    value={createForm.website}
                    onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                    placeholder="acme.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Service Tier</label>
                  <select
                    value={createForm.serviceTier}
                    onChange={(e) => {
                      const tier = tiers.find((t) => t.id === e.target.value);
                      setCreateForm({
                        ...createForm,
                        serviceTier: e.target.value,
                        monthlyFee: tier?.monthlyFee || 2500,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  >
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({fmtMoney(t.monthlyFee)}/mo)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Monthly Fee ($)</label>
                  <input
                    type="number"
                    value={createForm.monthlyFee}
                    onChange={(e) => setCreateForm({ ...createForm, monthlyFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none resize-none"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  placeholder="Initial context, lead source, etc."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t" style={{ borderColor: "var(--line-soft)" }}>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-[13px]" style={{ color: "var(--cream-dim)" }}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!createForm.name || !createForm.contactName || !createForm.contactEmail}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
              >
                Add Client
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}