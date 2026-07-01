"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText, Plus, X, Send, Check, Clock, Ban, Trash2, Download,
} from "lucide-react";
import type { Proposal, Client, Vertical } from "@/lib/agency-types";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: { label: "Draft", color: "var(--cream-dim)", icon: <Clock size={12} /> },
  sent: { label: "Sent", color: "var(--gold)", icon: <Send size={12} /> },
  accepted: { label: "Accepted", color: "var(--emerald)", icon: <Check size={12} /> },
  rejected: { label: "Rejected", color: "var(--plum)", icon: <Ban size={12} /> },
  expired: { label: "Expired", color: "#666", icon: <Clock size={12} /> },
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Proposal templates per vertical ──────────────────────────────
const PROPOSAL_TEMPLATES: Record<string, { scope: string; monthlyFee: number }> = {
  construction: {
    scope: "5 AI agents: project risk monitoring, bid estimation engine, safety compliance, supply chain optimization, scheduling automation",
    monthlyFee: 8000,
  },
  law: {
    scope: "4 AI agents: contract review automation, case research engine, client intake bot, billing compliance monitor",
    monthlyFee: 5000,
  },
  healthcare: {
    scope: "4 AI agents: claims processing, OR utilization optimizer, denials management, patient scheduling",
    monthlyFee: 9000,
  },
  dental: {
    scope: "3 AI agents: patient scheduling, insurance verification, recall automation",
    monthlyFee: 5000,
  },
  cpa: {
    scope: "4 AI agents: tax document processing, audit prep engine, client communication bot, bookkeeping automation",
    monthlyFee: 5000,
  },
  services: {
    scope: "3 AI agents: lead qualification, appointment scheduling, customer follow-up automation",
    monthlyFee: 2500,
  },
  manufacturing: {
    scope: "5 AI agents: quality control, supply chain, predictive maintenance, safety monitoring, production scheduling",
    monthlyFee: 8000,
  },
  pe_cfo: {
    scope: "Enterprise: unlimited agents, white-label dashboards, fractional CFO AI, portfolio monitoring, deal flow screening",
    monthlyFee: 18000,
  },
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [scope, setScope] = useState("");
  const [monthlyFee, setMonthlyFee] = useState(5000);

  const load = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/agency/proposals"),
        fetch("/api/agency/clients"),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      setProposals(pData.proposals || []);
      setClients(cData.clients || []);
      setVerticals(cData.verticals || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleClientSelect(clientId: string) {
    setSelectedClient(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      const template = PROPOSAL_TEMPLATES[client.vertical];
      if (template) {
        setScope(template.scope);
        setMonthlyFee(template.monthlyFee);
      }
    }
  }

  async function handleCreate() {
    if (!selectedClient || !scope) return;
    try {
      await fetch("/api/agency/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient,
          scope,
          monthlyFee,
          annualValue: monthlyFee * 12,
          status: "draft",
        }),
      });
      await load();
      setShowCreate(false);
      setSelectedClient("");
      setScope("");
      setMonthlyFee(5000);
    } catch {
      // ignore
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    const updates: Record<string, string | null> = { status };
    if (status === "sent") updates.sentDate = new Date().toISOString();
    if (status === "accepted") updates.acceptedDate = new Date().toISOString();
    try {
      await fetch("/api/agency/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      await load();
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/agency/proposals?id=${id}`, { method: "DELETE" });
      await load();
    } catch {
      // ignore
    }
  }

  function downloadProposal(p: Proposal) {
    const vInfo = verticals.find((v) => v.id === p.vertical);
    const content = `RIG OS AGENCY — PROPOSAL
═══════════════════════════════════════════════

Proposal ID: ${p.id}
Client: ${p.clientName}
Vertical: ${vInfo?.name || p.vertical}
Date: ${fmtDate(p.createdAt)}
Status: ${p.status.toUpperCase()}
Valid Until: ${fmtDate(p.validUntil)}

═══════════════════════════════════════════════
SCOPE OF WORK
═══════════════════════════════════════════════

${p.scope}

═══════════════════════════════════════════════
PRICING
═══════════════════════════════════════════════

Monthly Retainer: ${fmtMoney(p.monthlyFee)}
Annual Value:     ${fmtMoney(p.annualValue)}

═══════════════════════════════════════════════
ProofPacket binding: ${p.proofPacketId || "Pending — generated on acceptance"}
═══════════════════════════════════════════════
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal_${p.id}_${p.clientName.replace(/\s/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalValue = proposals.reduce((s, p) => s + p.annualValue, 0);
  const acceptedValue = proposals
    .filter((p) => p.status === "accepted")
    .reduce((s, p) => s + p.annualValue, 0);
  const sentCount = proposals.filter((p) => p.status === "sent").length;
  const draftCount = proposals.filter((p) => p.status === "draft").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>Proposals</h1>
        <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>Loading proposals…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <FileText size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Agency Operations
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Proposals
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
              {proposals.length} proposals · {fmtMoney(totalValue)} total value · {fmtMoney(acceptedValue)} accepted
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Plus size={16} />
            <span className="text-[13px] font-semibold">New Proposal</span>
          </button>
        </div>
      </motion.section>

      {/* KPI Cards */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Proposals", value: proposals.length, accent: "var(--cream)" },
          { label: "Draft", value: draftCount, accent: "var(--cream-dim)" },
          { label: "Sent", value: sentCount, accent: "var(--gold)" },
          { label: "Accepted Value", value: fmtMoney(acceptedValue), accent: "var(--emerald)" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>{k.label}</div>
            <div className="text-2xl" style={{ color: k.accent, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500 }}>{k.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Proposals List */}
      <motion.section {...fadeUp} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="space-y-3">
          {proposals.map((p) => {
            const statusConfig = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
            const vInfo = verticals.find((v) => v.id === p.vertical);
            const daysToExpire = p.validUntil
              ? Math.ceil((new Date(p.validUntil).getTime() - Date.now()) / 86400000)
              : 0;
            return (
              <div
                key={p.id}
                className="rounded-xl p-5 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] mono px-2 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: "var(--cream-mute)" }}>
                        {p.id}
                      </span>
                      {vInfo && (
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: vInfo.color }}>
                          {vInfo.name}
                        </span>
                      )}
                      <span
                        className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ background: "var(--bg-mid)", color: statusConfig.color }}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{p.clientName}</div>
                    <div className="text-[12px] mt-1" style={{ color: "var(--cream-dim)" }}>{p.scope}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-semibold mono" style={{ color: "var(--gold)" }}>{fmtMoney(p.monthlyFee)}/mo</div>
                    <div className="text-[12px] mono" style={{ color: "var(--emerald)" }}>{fmtMoney(p.annualValue)}/yr</div>
                    {p.status === "sent" && daysToExpire > 0 && (
                      <div className="text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>
                        Expires in {daysToExpire}d
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4 text-[11px] mb-3" style={{ color: "var(--cream-mute)" }}>
                  <span>Created: {fmtDate(p.createdAt)}</span>
                  {p.sentDate && <span>Sent: {fmtDate(p.sentDate)}</span>}
                  {p.acceptedDate && <span>Accepted: {fmtDate(p.acceptedDate)}</span>}
                  <span>Valid: {fmtDate(p.validUntil)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {p.status === "draft" && (
                    <button
                      onClick={() => handleStatusUpdate(p.id, "sent")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                      style={{ background: "var(--bg-mid)", color: "var(--gold)" }}
                    >
                      <Send size={13} /> Send
                    </button>
                  )}
                  {p.status === "sent" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(p.id, "accepted")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                        style={{ background: "var(--bg-mid)", color: "var(--emerald)" }}
                      >
                        <Check size={13} /> Mark Accepted
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(p.id, "rejected")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                        style={{ background: "var(--bg-mid)", color: "var(--plum)" }}
                      >
                        <Ban size={13} /> Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => downloadProposal(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                    style={{ background: "var(--bg-mid)", color: "var(--cream-dim)" }}
                  >
                    <Download size={13} /> Export
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ml-auto"
                    style={{ background: "var(--bg-mid)", color: "#ef4444" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
          {proposals.length === 0 && (
            <div className="rounded-xl p-8 text-center border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <FileText size={32} style={{ color: "var(--cream-mute)", margin: "0 auto 8px" }} />
              <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>No proposals yet. Create your first proposal.</div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Create Proposal Modal */}
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
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--cream)" }}>New Proposal</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: "var(--cream-mute)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Select Client *</label>
                <select
                  value={selectedClient}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                >
                  <option value="">Choose a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Scope of Work</label>
                <textarea
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none resize-none"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  placeholder="Describe the AI agents, deliverables, and services…"
                />
                {selectedClient && (
                  <div className="text-[10px] mt-1" style={{ color: "var(--cream-mute)" }}>
                    Template auto-filled from vertical: {clients.find((c) => c.id === selectedClient)?.vertical}
                  </div>
                )}
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Monthly Fee ($)</label>
                <input
                  type="number"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                />
                <div className="text-[11px] mt-1" style={{ color: "var(--emerald)" }}>
                  Annual value: {fmtMoney(monthlyFee * 12)}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t" style={{ borderColor: "var(--line-soft)" }}>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-[13px]" style={{ color: "var(--cream-dim)" }}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!selectedClient || !scope}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
              >
                Create Proposal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}