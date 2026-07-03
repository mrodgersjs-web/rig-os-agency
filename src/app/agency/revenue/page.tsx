"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Users, AlertCircle,
  CheckCircle2, RefreshCw, ExternalLink,
} from "lucide-react";

const C = {
  card: "var(--rig-card)",
  text: "var(--rig-text)",
  text2: "var(--rig-text-2)",
  text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)",
  border: "var(--rig-border)",
  hover: "var(--rig-hover)",
  gold: "var(--rig-gold)",
  goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)",
  emeraldBg: "var(--rig-emerald-bg)",
  red: "var(--rig-red)",
  redBg: "var(--rig-red-bg)",
};

interface RevenueData {
  connected: boolean;
  mrr: number;
  arr: number;
  customers: number;
  failedPayments: number;
  recentCharges: Array<{ amount: number; date: string; status: string; email: string }>;
  message?: string;
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/stripe/revenue");
      const d = await r.json();
      setData(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;

  return (
    <div className="px-6 py-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: C.text }}>Revenue</h1>
          <p className="text-[13px] mt-0.5" style={{ color: C.text3 }}>
            {data?.connected ? "Verified from Stripe" : "Connect Stripe to see real data"}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border"
          style={{ borderColor: C.border, color: C.text2, background: C.card }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stripe Connection Warning */}
      {data && !data.connected && (
        <div
          className="rounded-lg p-4 mb-6 flex items-start gap-3"
          style={{ background: C.redBg, border: `1px solid var(--rig-red)` + "22" }}
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: C.red }} />
          <div>
            <div className="text-[13px] font-semibold mb-0.5" style={{ color: C.red }}>Stripe Not Connected</div>
            <p className="text-[12px]" style={{ color: C.text2 }}>{data.message}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "MRR", value: data ? fmt(data.mrr) : "—", icon: DollarSign, color: C.gold, bg: C.goldBg, verified: data?.connected },
          { label: "ARR (projected)", value: data ? fmt(data.arr) : "—", icon: TrendingUp, color: C.emerald, bg: C.emeraldBg, verified: data?.connected },
          { label: "Customers", value: data?.customers?.toString() || "—", icon: Users, color: "var(--rig-purple)", bg: "var(--rig-purple-bg)", verified: data?.connected },
          { label: "Failed Payments", value: data?.failedPayments?.toString() || "—", icon: AlertCircle, color: data?.failedPayments > 0 ? C.red : C.emerald, bg: data?.failedPayments > 0 ? C.redBg : C.emeraldBg, verified: data?.connected },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-lg p-4 border"
            style={{ background: C.card, borderColor: C.border, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="grid place-items-center w-6 h-6 rounded" style={{ background: stat.bg }}>
                <stat.icon size={12} style={{ color: stat.color }} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>{stat.label}</span>
            </div>
            <div className="text-[22px] font-bold mb-0.5" style={{ color: C.text }}>{stat.value}</div>
            {stat.verified && (
              <div className="flex items-center gap-1">
                <CheckCircle2 size={10} style={{ color: C.emerald }} />
                <span className="text-[9px]" style={{ color: C.emerald }}>Verified from Stripe</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Charges */}
      {data?.connected && data.recentCharges && data.recentCharges.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[14px] font-semibold mb-3" style={{ color: C.text }}>Recent Charges</h2>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.border, background: C.card }}>
            {/* Header */}
            <div className="flex items-center px-4 py-2 text-[10px] font-semibold uppercase tracking-wider border-b"
              style={{ background: "var(--rig-sidebar)", color: C.mute, borderColor: C.border }}
            >
              <div className="flex-1">Customer</div>
              <div className="w-24 text-right">Amount</div>
              <div className="w-24 text-right">Status</div>
              <div className="w-32 text-right">Date</div>
            </div>
            {/* Rows */}
            {data.recentCharges.map((charge, i) => (
              <div key={i} className="flex items-center px-4 py-2.5 text-[12px]"
                style={{ borderBottom: `1px solid var(--rig-border-soft)` }}
              >
                <span className="flex-1 truncate" style={{ color: C.text }}>{charge.email}</span>
                <span className="w-24 text-right font-medium" style={{ color: C.text }}>${charge.amount}</span>
                <div className="w-24 text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded font-medium"
                    style={{ background: charge.status === "paid" ? C.emeraldBg : C.redBg, color: charge.status === "paid" ? C.emerald : C.red }}
                  >
                    {charge.status}
                  </span>
                </div>
                <span className="w-32 text-right text-[11px]" style={{ color: C.mute }}>
                  {new Date(charge.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No charges state */}
      {data?.connected && (!data.recentCharges || data.recentCharges.length === 0) && (
        <div className="rounded-lg border p-8 text-center" style={{ borderColor: C.border, background: C.card }}>
          <DollarSign size={24} className="mx-auto mb-2" style={{ color: C.mute }} />
          <p className="text-[13px]" style={{ color: C.text3 }}>No charges in the last 30 days</p>
        </div>
      )}
    </div>
  );
}
