"use client";

import { useState, useEffect, useCallback } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader, StatCard, SubsectionCard, LoadingRows } from "@/components/DepartmentUI";
import { useDetail } from "@/components/DetailContext";
import {
  DollarSign, CreditCard, Users, AlertCircle, RefreshCw,
  Receipt, ArrowRightLeft, Wallet, Zap,
} from "lucide-react";
import Link from "next/link";

const C = {
  card: "var(--rig-card)", text: "var(--rig-text)", text3: "var(--rig-text-3)", mute: "var(--rig-text-mute)",
  border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)", red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
};

interface RevenueData {
  connected: boolean;
  mrr: number;
  arr: number;
  customers: number;
  failedPayments: number;
  recentCharges: any[];
  message?: string;
}

export default function RevenueLanding() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/stripe/revenue");
      setData(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Revenue" }]} />
      <PageHeader
        title="Revenue"
        subtitle={data?.connected ? "Live data from Stripe" : "Connect Stripe to see real revenue data"}
        action={{ label: "Refresh", onClick: load, icon: <RefreshCw size={12} /> }}
      />

      {!data?.connected && (
        <div className="rounded-lg p-3 mb-5 flex items-center gap-2 text-[12px]"
          style={{ background: C.redBg, border: `1px solid ${C.red}22`, color: C.red }}
        >
          <AlertCircle size={14} />
          {data?.message || "Stripe not connected"}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="MRR"
          value={loading ? "—" : fmt(data?.mrr || 0)}
          subtext="Monthly recurring revenue"
          icon={<DollarSign size={12} style={{ color: C.gold }} />}
          color={C.gold}
          bg={C.goldBg}
          onClick={() => openDetail({ id: "mrr", type: "revenue", title: "Monthly Recurring Revenue", description: "Total recurring revenue per month", source: "Stripe", data: { value: data?.mrr, connected: data?.connected } })}
        />
        <StatCard
          label="ARR"
          value={loading ? "—" : fmt(data?.arr || 0)}
          subtext="Annual recurring revenue"
          icon={<Wallet size={12} style={{ color: C.emerald }} />}
          color={C.emerald}
          bg={C.emeraldBg}
          onClick={() => openDetail({ id: "arr", type: "revenue", title: "Annual Recurring Revenue", description: "MRR × 12", source: "Stripe", data: { value: data?.arr, connected: data?.connected } })}
        />
        <StatCard
          label="Customers"
          value={loading ? "—" : data?.customers || 0}
          subtext="Active paying customers"
          icon={<Users size={12} style={{ color: "var(--rig-blue)" }} />}
          color="var(--rig-blue)"
          bg="var(--rig-blue-bg)"
          onClick={() => openDetail({ id: "customers", type: "revenue", title: "Customers", description: "Active Stripe customers", source: "Stripe", data: { value: data?.customers, connected: data?.connected } })}
        />
        <StatCard
          label="Failed Payments"
          value={loading ? "—" : data?.failedPayments || 0}
          subtext="Requires attention"
          icon={<AlertCircle size={12} style={{ color: C.red }} />}
          color={C.red}
          bg={C.redBg}
          onClick={() => openDetail({ id: "failed-payments", type: "revenue", title: "Failed Payments", description: "Invoices/charges that failed", source: "Stripe", data: { value: data?.failedPayments, connected: data?.connected } })}
        />
      </div>

      <h2 className="text-[14px] font-semibold mb-3" style={{ color: C.text }}>Revenue Functions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <SubsectionCard
          title="Invoices"
          description="Create, send, and manage customer invoices"
          href="/agency/revenue/invoices/list"
          icon={<Receipt size={14} style={{ color: C.gold }} />}
          color={C.gold}
          bg={C.goldBg}
        />
        <SubsectionCard
          title="Charges"
          description="Recent successful charges and receipts"
          href="/agency/revenue/charges/list"
          icon={<CreditCard size={14} style={{ color: C.emerald }} />}
          color={C.emerald}
          bg={C.emeraldBg}
        />
        <SubsectionCard
          title="Customers"
          description="Stripe customer records and billing details"
          href="/agency/revenue/customers/list"
          icon={<Users size={14} style={{ color: "var(--rig-blue)" }} />}
          color="var(--rig-blue)"
          bg="var(--rig-blue-bg)"
        />
        <SubsectionCard
          title="Subscriptions"
          description="Active subscriptions and renewal dates"
          href="/agency/revenue/subscriptions/list"
          icon={<ArrowRightLeft size={14} style={{ color: "var(--rig-purple)" }} />}
          color="var(--rig-purple)"
          bg="var(--rig-purple-bg)"
        />
        <SubsectionCard
          title="Failed Payments"
          description="Failed charges and retry status"
          href="/agency/revenue/failed-payments/list"
          icon={<AlertCircle size={14} style={{ color: C.red }} />}
          color={C.red}
          bg={C.redBg}
        />
        <SubsectionCard
          title="Revenue Command"
          description="Run revenue calculations and forecasts"
          href="/agency/revenue-command"
          icon={<Zap size={14} style={{ color: C.gold }} />}
          color={C.gold}
          bg={C.goldBg}
        />
      </div>

      <h2 className="text-[14px] font-semibold mb-3" style={{ color: C.text }}>Recent Charges</h2>
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.border, background: C.card }}>
        {!data?.connected || !data?.recentCharges?.length ? (
          <div className="p-6 text-center text-[12px]" style={{ color: C.mute }}>No recent charges</div>
        ) : (
          data.recentCharges.slice(0, 5).map((charge, i) => (
            <Link
              key={i}
              href={`/agency/revenue/invoices/${charge.id || i}/actions`}
              className="flex items-center justify-between px-4 py-2.5 text-[12px] hover:bg-black/[0.02]"
              style={{ borderBottom: `1px solid var(--rig-border-soft)` }}
            >
              <span style={{ color: C.text }}>{charge.email}</span>
              <span className="font-medium" style={{ color: C.text }}>${charge.amount}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
