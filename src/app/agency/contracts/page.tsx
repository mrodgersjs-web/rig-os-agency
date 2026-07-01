"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileCheck, Plus, X, Trash2, RefreshCw, AlertTriangle,
  CheckCircle, Clock,
} from "lucide-react";
import type { Contract, ServiceTier } from "@/lib/agency-types";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "var(--cream-dim)", icon: <Clock size={12} /> },
  active: { label: "Active", color: "var(--emerald)", icon: <CheckCircle size={12} /> },
  expiring: { label: "Expiring", color: "var(--gold)", icon: <AlertTriangle size={12} /> },
  expired: { label: "Expired", color: "var(--plum)", icon: <Clock size={12} /> },
  terminated: { label: "Terminated", color: "#ef4444", icon: <X size={12} /> },
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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tiers, setTiers] = useState<ServiceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/contracts");
      const data = await res.json();
      setContracts(data.contracts || []);
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

  async function handleToggleRenew(id: string, current: boolean) {
    try {
      await fetch("/api/agency/contracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, autoRenew: !current }),
      });
      await load();
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/agency/contracts?id=${id}`, { method: "DELETE" });
      await load();
    } catch {
      // ignore
    }
  }

  // Compute auto-renewal alerts
  const expiringSoon = contracts.filter((c) => {
    if (c.status !== "active") return false;
    const days = daysUntil(c.endDate);
    return days <= 60 && days > 0;
  });

  const expired = contracts.filter((c) => {
    if (c.status !== "active") return false;
    return daysUntil(c.endDate) <= 0;
  });

  const totalMonthly = contracts
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + c.monthlyFee, 0);
  const totalAnnual = totalMonthly * 12;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>Contracts</h1>
        <div className="text-[14px]" style={{ color: "var(--cream-dim)" }}>Loading contracts…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <FileCheck size={22} style={{ color: "var(--gold)" }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Agency Operations
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Contracts
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--cream-dim)" }}>
              {contracts.length} contracts · {fmtMoney(totalMonthly)}/mo recurring · {fmtMoney(totalAnnual)}/yr total
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--gold)", color: "var(--bg-deep)" }}
          >
            <Plus size={16} />
            <span className="text-[13px] font-semibold">New Contract</span>
          </button>
        </div>
      </motion.section>

      {/* Renewal Alerts */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }}>
          {expired.length > 0 && (
            <div className="rounded-xl p-4 border mb-3" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)" }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} style={{ color: "#ef4444" }} />
                <span className="text-[14px] font-semibold" style={{ color: "#ef4444" }}>{expired.length} Expired Contract{expired.length > 1 ? "s" : ""}</span>
              </div>
              <div className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
                {expired.map((c) => c.clientName).join(", ")} — renewal action needed immediately.
              </div>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="rounded-xl p-4 border" style={{ background: "rgba(212,165,116,0.08)", borderColor: "rgba(212,165,116,0.3)" }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} style={{ color: "var(--gold)" }} />
                <span className="text-[14px] font-semibold" style={{ color: "var(--gold)" }}>{expiringSoon.length} Expiring Soon</span>
              </div>
              <div className="text-[12px]" style={{ color: "var(--cream-dim)" }}>
                {expiringSoon.map((c) => `${c.clientName} (${daysUntil(c.endDate)}d)`).join(", ")} — start renewal discussions.
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Contracts", value: contracts.filter((c) => c.status === "active").length, accent: "var(--emerald)" },
          { label: "Monthly Recurring", value: fmtMoney(totalMonthly), accent: "var(--gold)" },
          { label: "Annual Value", value: fmtMoney(totalAnnual), accent: "var(--cream)" },
          { label: "Auto-Renew", value: contracts.filter((c) => c.autoRenew).length, accent: "var(--plum)" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>{k.label}</div>
            <div className="text-2xl" style={{ color: k.accent, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500 }}>{k.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Contracts Table */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.1 }} className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--line-soft)" }}>
          <h2 className="text-[16px] font-semibold" style={{ color: "var(--cream)" }}>All Contracts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                {["ID", "Client", "Tier", "Monthly", "Start", "End", "Renewal", "SLA", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "var(--cream-dim)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const statusConfig = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
                const daysLeft = daysUntil(c.endDate);
                const tierInfo = tiers.find((t) => t.id === c.type);
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                    <td className="px-4 py-3 mono text-[11px]" style={{ color: "var(--cream-mute)" }}>{c.id}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--cream)" }}>{c.clientName}</td>
                    <td className="px-4 py-3" style={{ color: "var(--cream-dim)" }}>
                      {tierInfo ? (
                        <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: "var(--bg-mid)", color: tierInfo.color }}>
                          {tierInfo.name}
                        </span>
                      ) : c.type}
                    </td>
                    <td className="px-4 py-3 font-semibold mono" style={{ color: "var(--gold)" }}>{fmtMoney(c.monthlyFee)}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "var(--cream-dim)" }}>{fmtDate(c.startDate)}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: daysLeft <= 60 ? "var(--gold)" : "var(--cream-dim)" }}>
                      {fmtDate(c.endDate)}
                      {c.status === "active" && (
                        <span className="text-[10px] block" style={{ color: daysLeft <= 0 ? "#ef4444" : daysLeft <= 60 ? "var(--gold)" : "var(--cream-mute)" }}>
                          {daysLeft <= 0 ? "EXPIRED" : `${daysLeft}d left`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleRenew(c.id, c.autoRenew)}
                        className="flex items-center gap-1.5 text-[11px] transition-opacity"
                        style={{ color: c.autoRenew ? "var(--emerald)" : "var(--cream-mute)" }}
                      >
                        <RefreshCw size={11} className={c.autoRenew ? "" : "opacity-40"} />
                        {c.autoRenew ? "Auto" : "Manual"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "var(--cream-dim)" }}>{c.slaHours}h</td>
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
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 rounded transition-colors"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {contracts.length === 0 && (
            <div className="p-8 text-center" style={{ color: "var(--cream-dim)" }}>
              No contracts yet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}