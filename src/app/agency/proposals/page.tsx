"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, X, Save, Send, Check, Clock, DollarSign } from "lucide-react";

interface Proposal {
  id: string;
  clientId: string;
  clientName: string;
  vertical: string;
  scope: string;
  monthlyFee: number;
  annualValue: number;
  status: string;
  sentDate: string | null;
  acceptedDate: string | null;
  validUntil: string;
  createdAt: string;
}

interface Template {
  vertical: string;
  name: string;
  scope: string;
  deliverables: string[];
  pricing: Record<string, { monthly: number; annual: number; scope: string }>;
  timeline: string;
}

const statusColors: Record<string, string> = {
  draft: "var(--cream-dim)",
  sent: "var(--gold)",
  accepted: "var(--emerald)",
  rejected: "var(--plum)",
  expired: "var(--cream-mute)",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <FileText size={12} />,
  sent: <Send size={12} />,
  accepted: <Check size={12} />,
  rejected: <X size={12} />,
  expired: <Clock size={12} />,
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/proposals");
      const data = await res.json();
      setProposals(data.proposals || []);
      setTemplates(data.templates || []);
    } catch (e) {
      console.error("Failed to load proposals:", e);
    }
    setLoading(false);
  }

  async function handleCreate(proposal: Record<string, unknown>) {
    await fetch("/api/agency/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposal),
    });
    setShowForm(false);
    await loadProposals();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
            Proposals
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
            {proposals.length} proposals · {templates.length} vertical templates
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition"
          style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
        >
          <Plus size={16} /> New Proposal
        </button>
      </div>

      {/* Templates Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {templates.map((t) => (
          <div key={t.vertical} className="rounded-xl p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{t.name}</div>
            <div className="text-[10px] mt-1" style={{ color: "var(--cream-dim)" }}>{t.deliverables.length} deliverables</div>
            <div className="text-[10px] mt-1" style={{ color: "var(--gold)" }}>{t.timeline}</div>
          </div>
        ))}
      </div>

      {/* Proposals List */}
      {loading ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
          Loading proposals...
        </div>
      ) : proposals.length === 0 ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream-dim)" }}>
          No proposals yet. Click "New Proposal" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.id} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{p.clientName}</div>
                  <div className="text-[11px] capitalize" style={{ color: "var(--cream-mute)" }}>{p.vertical}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded" style={{ background: (statusColors[p.status] || "var(--cream-dim)") + "20", color: statusColors[p.status] || "var(--cream-dim)" }}>
                    {statusIcons[p.status]} {p.status}
                  </span>
                  <span className="text-[14px] font-semibold" style={{ color: "var(--gold)" }}>{formatCurrency(p.annualValue)}</span>
                </div>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>{p.scope}</p>
              <div className="flex items-center gap-4 mt-2 text-[11px]" style={{ color: "var(--cream-mute)" }}>
                <span><DollarSign size={10} className="inline" /> {formatCurrency(p.monthlyFee)}/mo</span>
                {p.sentDate && <span>Sent: {new Date(p.sentDate).toLocaleDateString()}</span>}
                {p.acceptedDate && <span style={{ color: "var(--emerald)" }}>Accepted: {new Date(p.acceptedDate).toLocaleDateString()}</span>}
                <span>Valid until: {new Date(p.validUntil).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ProposalForm templates={templates} onCreate={handleCreate} onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProposalForm({ templates, onCreate, onClose }: {
  templates: Template[];
  onCreate: (proposal: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    clientName: "",
    vertical: "construction",
    scope: "",
    tier: "growth",
    monthlyFee: 5000,
  });

  // Auto-fill scope and pricing from template
  useEffect(() => {
    const template = templates.find((t) => t.vertical === form.vertical);
    if (template) {
      setForm((prev) => ({
        ...prev,
        scope: template.scope,
        monthlyFee: template.pricing[prev.tier]?.monthly || 5000,
      }));
    }
  }, [form.vertical, form.tier, templates]);

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const selectedTemplate = templates.find((t) => t.vertical === form.vertical);

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
          <h2 className="text-[18px] font-semibold" style={{ color: "var(--cream)" }}>New Proposal</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-mid)]" style={{ color: "var(--cream-dim)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Client Name *</label>
            <input
              className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
              style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
              value={form.clientName}
              onChange={(e) => update("clientName", e.target.value)}
              placeholder="Acme Corp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Vertical Template</label>
              <select
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.vertical}
                onChange={(e) => update("vertical", e.target.value)}
              >
                {templates.map((t) => <option key={t.vertical} value={t.vertical}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Service Tier</label>
              <select
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                value={form.tier}
                onChange={(e) => update("tier", e.target.value)}
              >
                <option value="starter">Starter ($2,500/mo)</option>
                <option value="growth">Growth ($5,000/mo)</option>
                <option value="scale">Scale ($8,000/mo)</option>
                <option value="enterprise">Enterprise ($18,000/mo)</option>
              </select>
            </div>
          </div>

          {/* Template preview */}
          {selectedTemplate && (
            <div className="rounded-lg p-3 border" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
              <div className="text-[12px] font-medium mb-1" style={{ color: "var(--gold)" }}>{selectedTemplate.name}</div>
              <div className="text-[11px] mb-2" style={{ color: "var(--cream-dim)" }}>Timeline: {selectedTemplate.timeline}</div>
              <div className="text-[11px] mb-1" style={{ color: "var(--cream-dim)" }}>Deliverables:</div>
              <ul className="text-[11px] space-y-0.5" style={{ color: "var(--cream-dim)" }}>
                {selectedTemplate.deliverables.map((d, i) => <li key={i}>• {d}</li>)}
              </ul>
            </div>
          )}

          <div>
            <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-dim)" }}>Scope</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
              style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
              rows={4}
              value={form.scope}
              onChange={(e) => update("scope", e.target.value)}
            />
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

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onCreate({
              clientName: form.clientName || "Untitled",
              vertical: form.vertical,
              scope: form.scope,
              monthlyFee: form.monthlyFee,
              annualValue: form.monthlyFee * 12,
              status: "draft",
            })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Save size={14} /> Create Proposal
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