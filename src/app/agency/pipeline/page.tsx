"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Workflow, Plus, X, TrendingUp } from "lucide-react";
import type { PipelineDeal, Vertical } from "@/lib/agency-types";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const STAGES = [
  { id: "prospect", name: "Prospect", color: "#a855f7" },
  { id: "qualified", name: "Qualified", color: "#fbbf24" },
  { id: "proposal_sent", name: "Proposal Sent", color: "#d4a574" },
  { id: "negotiation", name: "Negotiation", color: "#c4607e" },
  { id: "active", name: "Closed Won", color: "#5ab896" },
] as const;

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    clientName: "",
    vertical: "services",
    dealSize: 30000,
    probability: 20,
    nextAction: "Initial outreach",
    stage: "prospect",
  });

  const load = useCallback(async () => {
    try {
      const [dealsRes, clientsRes] = await Promise.all([
        fetch("/api/agency/pipeline/crud"),
        fetch("/api/agency/clients"),
      ]);
      const dealsData = await dealsRes.json();
      const clientsData = await clientsRes.json();
      setDeals(dealsData.deals || []);
      setVerticals(clientsData.verticals || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDragStart(e: React.DragEvent, dealId: string) {
    setDraggedId(dealId);
    e.dataTransfer.effectAllowed = "move";
  }

  async function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedId) return;
    const deal = deals.find((d) => d.id === draggedId);
    if (!deal || deal.stage === stage) {
      setDraggedId(null);
      return;
    }
    // Update locally first for instant feedback
    setDeals((prev) => prev.map((d) => (d.id === draggedId ? { ...d, stage } : d)));
    // Persist to API
    try {
      await fetch("/api/agency/pipeline/crud", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draggedId, stage }),
      });
    } catch {
      // Revert on failure
      await load();
    }
    setDraggedId(null);
  }

  async function handleAddDeal() {
    if (!addForm.clientName) return;
    try {
      await fetch("/api/agency/pipeline/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        }),
      });
      await load();
      setShowAdd(false);
      setAddForm({ clientName: "", vertical: "services", dealSize: 30000, probability: 20, nextAction: "Initial outreach", stage: "prospect" });
    } catch {
      // ignore
    }
  }

  const verticalName = (id: string) => verticals.find((v) => v.id === id)?.name || id;
  const totalPipelineValue = deals.reduce((s, d) => s + d.dealSize * (d.probability / 100), 0);

  return (
    <div className="space-y-6">
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Workflow size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Agency Operations
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Sales Pipeline
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
              {deals.length} deals · {formatCurrency(totalPipelineValue)} weighted pipeline value
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Plus size={16} />
            <span className="text-[13px] font-semibold">Add Deal</span>
          </button>
        </div>
      </motion.section>

      {/* Kanban Board */}
      {loading ? (
        <div className="p-8 text-center" style={{ color: "var(--cream-dim)" }}>Loading pipeline...</div>
      ) : (
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.id);
              const stageValue = stageDeals.reduce((s, d) => s + d.dealSize, 0);
              const weightedValue = stageDeals.reduce((s, d) => s + d.dealSize * (d.probability / 100), 0);
              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className="rounded-xl border min-h-[200px] transition-colors"
                  style={{
                    background: dragOverStage === stage.id ? "var(--bg-card)" : "var(--bg-mid)",
                    borderColor: dragOverStage === stage.id ? stage.color : "var(--line-soft)",
                  }}
                >
                  {/* Stage Header */}
                  <div className="p-3 border-b" style={{ borderColor: "var(--line-soft)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                      <span className="text-[12px] font-semibold" style={{ color: "var(--cream)" }}>{stage.name}</span>
                      <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-deep)", color: "var(--cream-mute)" }}>
                        {stageDeals.length}
                      </span>
                    </div>
                    <div className="text-[10px] mono" style={{ color: "var(--cream-mute)" }}>
                      {formatCurrency(stageValue)} · {formatCurrency(weightedValue)} weighted
                    </div>
                  </div>
                  {/* Deal Cards */}
                  <div className="p-2 space-y-2">
                    {stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className="rounded-lg p-3 border cursor-grab active:cursor-grabbing transition-all"
                        style={{
                          background: "var(--bg-card)",
                          borderColor: draggedId === deal.id ? "var(--gold)" : "var(--line-soft)",
                          opacity: draggedId === deal.id ? 0.5 : 1,
                        }}
                      >
                        <div className="text-[12px] font-medium mb-1" style={{ color: "var(--cream)" }}>{deal.clientName}</div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{verticalName(deal.vertical)}</span>
                          <span className="text-[11px] font-semibold mono" style={{ color: "var(--gold)" }}>{formatCurrency(deal.dealSize)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Probability bar */}
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-deep)" }}>
                            <div className="h-full rounded-full" style={{ width: `${deal.probability}%`, background: stage.color }} />
                          </div>
                          <span className="text-[9px] mono" style={{ color: "var(--cream-mute)" }}>{deal.probability}%</span>
                        </div>
                        <div className="text-[9px] mt-1.5" style={{ color: "var(--cream-dim)" }}>
                          → {deal.nextAction}
                        </div>
                      </div>
                    ))}
                    {stageDeals.length === 0 && (
                      <div className="text-center py-4 text-[10px]" style={{ color: "var(--cream-mute)" }}>
                        Drag deals here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Add Deal Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowAdd(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border max-w-md w-full"
            style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--line-soft)" }}>
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--cream)" }}>Add Deal</h2>
              <button onClick={() => setShowAdd(false)} style={{ color: "var(--cream-mute)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Client Name *</label>
                <input
                  type="text"
                  value={addForm.clientName}
                  onChange={(e) => setAddForm({ ...addForm, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Vertical</label>
                  <select
                    value={addForm.vertical}
                    onChange={(e) => setAddForm({ ...addForm, vertical: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  >
                    {verticals.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Stage</label>
                  <select
                    value={addForm.stage}
                    onChange={(e) => setAddForm({ ...addForm, stage: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Deal Size ($)</label>
                  <input
                    type="number"
                    value={addForm.dealSize}
                    onChange={(e) => setAddForm({ ...addForm, dealSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Probability (%)</label>
                  <input
                    type="number"
                    value={addForm.probability}
                    onChange={(e) => setAddForm({ ...addForm, probability: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                    min={0} max={100}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider mb-1 block" style={{ color: "var(--cream-mute)" }}>Next Action</label>
                <input
                  type="text"
                  value={addForm.nextAction}
                  onChange={(e) => setAddForm({ ...addForm, nextAction: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)", color: "var(--cream)" }}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t" style={{ borderColor: "var(--line-soft)" }}>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-[13px]" style={{ color: "var(--cream-dim)" }}>
                Cancel
              </button>
              <button
                onClick={handleAddDeal}
                disabled={!addForm.clientName}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
              >
                Add Deal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}