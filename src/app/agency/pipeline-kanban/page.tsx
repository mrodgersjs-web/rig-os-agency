"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Workflow, DollarSign, Users, TrendingUp, Plus, X, ChevronRight, ChevronLeft, Trash2, Target, Clock, AlertTriangle, GripVertical } from "lucide-react";

const STAGES = ["discovery", "qualified", "proposal", "negotiation", "closed"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_META: Record<Stage, { label: string; color: string; weight: number }> = {
  discovery: { label: "Discovery", color: "#60a5fa", weight: 0.1 },
  qualified: { label: "Qualified", color: "#a78bfa", weight: 0.25 },
  proposal: { label: "Proposal", color: "#fbbf24", weight: 0.5 },
  negotiation: { label: "Negotiation", color: "#fb923c", weight: 0.75 },
  closed: { label: "Closed Won", color: "#22c55e", weight: 1.0 },
};

interface Deal {
  id: string;
  clientName: string;
  contact: string;
  dealValue: number;
  stage: Stage;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  stageEnteredAt?: string; // when deal entered current stage (for aging)
}

interface Summary {
  count: number;
  totalValue: number;
  closedValue: number;
  weightedValue: number;
}

export default function PipelineKanbanPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [summary, setSummary] = useState<Summary>({ count: 0, totalValue: 0, closedValue: 0, weightedValue: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<Stage | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/pipeline-deals?action=list");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      // backfill stageEnteredAt for any deal that doesn't have one
      const raw: Deal[] = data.deals || [];
      const now = new Date().toISOString();
      const backfilled = raw.map((d) => ({
        ...d,
        stageEnteredAt: d.stageEnteredAt || d.updatedAt || now,
      }));
      setDeals(backfilled);
      setSummary({ count: data.count, totalValue: data.totalValue, closedValue: data.closedValue, weightedValue: data.weightedValue });
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const moveStage = async (deal: Deal, dir: 1 | -1) => {
    const idx = STAGES.indexOf(deal.stage);
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, idx + dir))];
    if (next === deal.stage) return;
    const now = new Date().toISOString();
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage: next, stageEnteredAt: now, updatedAt: now } : d)));
    await fetch("/api/agency/pipeline-deals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", id: deal.id, stage: next }),
    });
  };

  const moveToStage = async (deal: Deal, target: Stage) => {
    if (target === deal.stage) return;
    const now = new Date().toISOString();
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage: target, stageEnteredAt: now, updatedAt: now } : d)));
    await fetch("/api/agency/pipeline-deals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", id: deal.id, stage: target }),
    });
  };

  const deleteDeal = async (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
    setSelectedDeal(null);
    await fetch("/api/agency/pipeline-deals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
  };

  const addDeal = async (deal: Partial<Deal>) => {
    const res = await fetch("/api/agency/pipeline-deals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deal),
    });
    if (res.ok) { setShowAdd(false); loadData(); }
  };

  // ── HTML5 drag-and-drop wiring ──────────────────────────────────────────
  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, dealId: string) => {
    setDraggingId(dealId);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", dealId); } catch { /* ignore */ }
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggingId(null);
    setHoverStage(null);
  }, []);

  const onColumnDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, stage: Stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoverStage !== stage) setHoverStage(stage);
  }, [hoverStage]);

  const onColumnDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>, stage: Stage) => {
    // only clear if we actually left the column
    if (e.currentTarget === e.target) setHoverStage((h) => (h === stage ? null : h));
  }, []);

  const onColumnDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, stage: Stage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    const deal = deals.find((d) => d.id === id);
    if (deal && deal.stage !== stage) {
      await moveToStage(deal, stage);
    }
    setDraggingId(null);
    setHoverStage(null);
  }, [deals, draggingId, moveToStage]);

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {} as Record<Stage, Deal[]>);

  // Stage aging stats — average days in stage per column (excluding closed)
  const stageAging = useMemo(() => {
    const stats: Record<Stage, { count: number; avgDays: number; oldest: number; staleCount: number }> = {} as any;
    STAGES.forEach((s) => {
      const arr = grouped[s] || [];
      const ages = arr.map((d) => {
        const ts = d.stageEnteredAt || d.updatedAt || d.createdAt;
        return (Date.now() - new Date(ts).getTime()) / 86_400_000;
      });
      const total = ages.reduce((a, b) => a + b, 0);
      const oldest = ages.length ? Math.max(...ages) : 0;
      const avg = ages.length ? total / ages.length : 0;
      const stale = ages.filter((a) => a > 14).length;
      stats[s] = { count: arr.length, avgDays: avg, oldest, staleCount: stale };
    });
    return stats;
  }, [deals, grouped]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[14px]" style={{ color: "var(--cream-mute)" }}>Loading pipeline…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--cream)" }}>
            Pipeline Kanban
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--cream-mute)" }}>
            {summary.count} deals · ${(summary.totalValue / 1000).toFixed(0)}K open · ${(summary.closedValue / 1000).toFixed(0)}K closed
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90"
          style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
        >
          <Plus size={15} /> New Deal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open Pipeline", value: `$${(summary.totalValue / 1000).toFixed(0)}K`, icon: DollarSign, color: "#60a5fa" },
          { label: "Weighted Forecast", value: `$${(summary.weightedValue / 1000).toFixed(0)}K`, icon: Target, color: "#d4a574" },
          { label: "Closed Won", value: `$${(summary.closedValue / 1000).toFixed(0)}K`, icon: TrendingUp, color: "#22c55e" },
          { label: "Active Deals", value: deals.filter((d) => d.stage !== "closed").length.toString(), icon: Workflow, color: "#fbbf24" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="panel p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon size={14} style={{ color: s.color }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>{s.label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: "var(--cream)" }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = grouped[stage];
          const meta = STAGE_META[stage];
          const stageValue = stageDeals.reduce((s, d) => s + d.dealValue, 0);
          const aging = stageAging[stage];
          const isHover = hoverStage === stage;
          const dropTargetActive = isHover;

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-[290px] rounded-xl p-3 transition-all"
              style={{
                background: dropTargetActive ? `${meta.color}10` : "rgba(255,255,255,0.02)",
                border: dropTargetActive ? `1px dashed ${meta.color}` : "1px solid var(--line-soft)",
                minHeight: 380,
              }}
              onDragOver={(e) => onColumnDragOver(e, stage)}
              onDragLeave={(e) => onColumnDragLeave(e, stage)}
              onDrop={(e) => onColumnDrop(e, stage)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                  <span className="text-[12px] font-semibold" style={{ color: "var(--cream)" }}>{meta.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${meta.color}20`, color: meta.color }}>
                    {stageDeals.length}
                  </span>
                  {aging.staleCount > 0 && (
                    <span
                      className="text-[9px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "#ef444420", color: "#ef4444" }}
                      title={`${aging.staleCount} deal${aging.staleCount === 1 ? "" : "s"} stuck > 14 days`}
                    >
                      <AlertTriangle size={9} />{aging.staleCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>${(stageValue / 1000).toFixed(0)}K</span>
              </div>

              {/* Aging summary line */}
              {aging.count > 0 && (
                <div className="text-[10px] mb-2 px-1 flex items-center gap-1.5" style={{ color: "var(--cream-mute)" }}>
                  <Clock size={9} />
                  <span>
                    avg {aging.avgDays.toFixed(1)}d in stage
                    {aging.oldest > 0 && aging.oldest !== aging.avgDays && (
                      <> · oldest <span style={{ color: aging.oldest > 14 ? "#ef4444" : "var(--cream-dim)" }}>{aging.oldest.toFixed(0)}d</span></>
                    )}
                  </span>
                </div>
              )}

              {/* Deal cards */}
              <div className="space-y-2 min-h-[200px]">
                <AnimatePresence>
                  {stageDeals.map((deal) => {
                    const ageDays = (Date.now() - new Date(deal.stageEnteredAt || deal.updatedAt || deal.createdAt).getTime()) / 86_400_000;
                    const isStale = ageDays > 14;
                    const isDragging = draggingId === deal.id;
                    return (
                      <motion.div
                        key={deal.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable
                        onDragStart={(e) => onDragStart(e as unknown as React.DragEvent<HTMLDivElement>, deal.id)}
                        onDragEnd={onDragEnd}
                        className="p-3 rounded-lg cursor-grab active:cursor-grabbing group"
                        style={{
                          background: "var(--bg-card)",
                          border: `1px solid ${isStale ? "#ef444450" : "var(--line-soft)"}`,
                          boxShadow: isDragging ? `0 0 0 2px ${meta.color}80` : "none",
                        }}
                        onClick={() => setSelectedDeal(deal)}
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={11} className="mt-0.5 opacity-30 group-hover:opacity-70 transition-opacity" style={{ color: "var(--cream-mute)" }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold mb-0.5 truncate" style={{ color: "var(--cream)" }}>{deal.clientName}</div>
                            {deal.contact && (
                              <div className="text-[10px] mb-1 truncate" style={{ color: "var(--cream-mute)" }}>{deal.contact}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-[14px] font-bold" style={{ color: meta.color }}>${(deal.dealValue / 1000).toFixed(0)}K</div>
                          <div className="flex items-center gap-1">
                            <span
                              className="text-[9px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                              style={{
                                background: isStale ? "#ef444420" : "var(--line-soft)",
                                color: isStale ? "#ef4444" : "var(--cream-mute)",
                              }}
                              title={`In ${meta.label} for ${ageDays.toFixed(1)} days`}
                            >
                              <Clock size={8} />{ageDays.toFixed(0)}d
                            </span>
                            {deal.source && (
                              <div className="text-[9px] px-1.5 py-0.5 rounded-full truncate max-w-[90px]" style={{ background: "var(--line-soft)", color: "var(--cream-mute)" }}>
                                {deal.source}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Move buttons */}
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveStage(deal, -1); }}
                            disabled={STAGES.indexOf(deal.stage) === 0}
                            className="p-1 rounded hover:bg-white/5 transition-colors disabled:opacity-20"
                            style={{ color: "var(--cream-mute)" }}
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveStage(deal, 1); }}
                            disabled={STAGES.indexOf(deal.stage) === STAGES.length - 1}
                            className="p-1 rounded hover:bg-white/5 transition-colors disabled:opacity-20"
                            style={{ color: "var(--cream-mute)" }}
                          >
                            <ChevronRight size={13} />
                          </button>
                          <span className="flex-1 text-center text-[9px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>
                            drag to move
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {stageDeals.length === 0 && (
                  <div
                    className="text-center py-10 text-[11px] rounded-lg border border-dashed"
                    style={{ color: "var(--cream-mute)", borderColor: isHover ? meta.color : "var(--line-soft)" }}
                  >
                    {isHover ? `Drop to move to ${meta.label}` : "No deals · drag here"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Deal Modal */}
      <AnimatePresence>
        {showAdd && <AddDealModal onClose={() => setShowAdd(false)} onAdd={addDeal} />}
      </AnimatePresence>

      {/* Deal Detail Modal */}
      <AnimatePresence>
        {selectedDeal && (
          <DealDetailModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} onDelete={deleteDeal} onMove={moveStage} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add Deal Modal ──────────────────────────────────────────────────────────
function AddDealModal({ onClose, onAdd }: { onClose: () => void; onAdd: (d: Partial<Deal>) => void }) {
  const [form, setForm] = useState<{ clientName: string; contact: string; dealValue: string; stage: Stage; source: string; notes: string }>({ clientName: "", contact: "", dealValue: "", stage: "discovery", source: "Manual Entry", notes: "" });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: "var(--cream)" }}>New Deal</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X size={18} style={{ color: "var(--cream-mute)" }} /></button>
        </div>
        <div className="space-y-3">
          <Field label="Company / Client">
            <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="w-full bg-transparent text-[13px] outline-none" style={{ color: "var(--cream)" }} placeholder="Acme Corp" autoFocus />
          </Field>
          <Field label="Contact (optional)">
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full bg-transparent text-[13px] outline-none" style={{ color: "var(--cream)" }} placeholder="Jane Doe" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deal Value ($)">
              <input type="number" value={form.dealValue} onChange={(e) => setForm({ ...form, dealValue: e.target.value })}
                className="w-full bg-transparent text-[13px] outline-none" style={{ color: "var(--cream)" }} placeholder="50000" />
            </Field>
            <Field label="Stage">
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full bg-transparent text-[13px] outline-none" style={{ color: "var(--cream)" }}>
                {STAGES.map((s) => <option key={s} value={s} style={{ background: "var(--bg-deep)" }}>{STAGE_META[s].label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Source">
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full bg-transparent text-[13px] outline-none" style={{ color: "var(--cream)" }}>
              {["Manual Entry", "LinkedIn Outreach", "Cold Email", "Referral", "Inbound", "Conference", "Partner Referral"].map((s) => (
                <option key={s} value={s} style={{ background: "var(--bg-deep)" }}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-transparent text-[13px] outline-none resize-none" rows={2} style={{ color: "var(--cream)" }} placeholder="Project scope, key context…" />
          </Field>
        </div>
        <button
          onClick={() => onAdd({ ...form, dealValue: Number(form.dealValue) || 0, stage: form.stage as Stage })}
          disabled={!form.clientName.trim()}
          className="w-full mt-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-30"
          style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
        >
          Create Deal
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Deal Detail Modal ───────────────────────────────────────────────────────
function DealDetailModal({ deal, onClose, onDelete, onMove }: {
  deal: Deal; onClose: () => void; onDelete: (id: string) => void; onMove: (d: Deal, dir: 1 | -1) => void;
}) {
  const meta = STAGE_META[deal.stage];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: meta.color }}>{meta.label}</span>
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--cream)" }}>{deal.clientName}</h2>
            {deal.contact && <p className="text-[12px] mt-0.5" style={{ color: "var(--cream-mute)" }}>{deal.contact}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X size={18} style={{ color: "var(--cream-mute)" }} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <InfoBox label="Deal Value" value={`$${deal.dealValue.toLocaleString()}`} />
          <InfoBox label="Weighted" value={`$${Math.round(deal.dealValue * meta.weight).toLocaleString()}`} />
          <InfoBox label="Source" value={deal.source} />
          <InfoBox label="Created" value={new Date(deal.createdAt).toLocaleDateString()} />
        </div>

        {deal.notes && (
          <div className="mb-5 p-3 rounded-lg" style={{ background: "var(--line-soft)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Notes</div>
            <div className="text-[13px]" style={{ color: "var(--cream)" }}>{deal.notes}</div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--line-soft)" }}>
          <button
            onClick={() => onDelete(deal.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors hover:bg-red-500/10"
            style={{ color: "#ef4444" }}
          >
            <Trash2 size={13} /> Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMove(deal, -1)} disabled={STAGES.indexOf(deal.stage) === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-30"
              style={{ background: "var(--line-soft)", color: "var(--cream)" }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => onMove(deal, 1)} disabled={STAGES.indexOf(deal.stage) === STAGES.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-30"
              style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Small UI helpers ────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>{label}</label>
      <div className="px-3 py-2 rounded-lg" style={{ background: "var(--line-soft)" }}>{children}</div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: "var(--line-soft)" }}>
      <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--cream-mute)" }}>{label}</div>
      <div className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>{value}</div>
    </div>
  );
}
