"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, X, Save, Calendar, AlertTriangle, DollarSign, Clock } from "lucide-react";

interface Contract {
  id: string; clientId: string; clientName: string; type: string;
  monthlyFee: number; startDate: string; endDate: string; autoRenew: boolean;
  status: string; terms: string; slaHours: number; createdAt: string;
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadContracts(); }, []);

  async function loadContracts() {
    try {
      const res = await fetch("/api/agency/contracts");
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // Renewal alerts: contracts expiring within 90 days
  const alerts = contracts.filter((c) => {
    const days = daysUntil(c.endDate);
    return days > 0 && days <= 90 && c.status === "active";
  });

  const totalMRR = contracts.filter((c) => c.status === "active").reduce((s, c) => s + c.monthlyFee, 0);
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
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: "var(--gold)", color: "var(--bg-deep)" }}>
          <Plus size={16} /> New Contract
        </button>
      </div>

      {/* Renewal Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl p-4 border" style={{ background: "#fbbf2410", borderColor: "#fbbf2455" }}>
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
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => {
            const days = daysUntil(c.endDate);
            const color = statusColors[c.status] || "var(--cream-dim)";
            return (
              <div key={c.id} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{c.clientName}</span>
                    <span className="text-[11px] ml-2 capitalize" style={{ color: "var(--cream-mute)" }}>{c.type} tier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: color + "20", color }}>{c.status}</span>
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
    </div>
  );
}