"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw, CreditCard, Users, TrendingDown, TrendingUp,
  AlertTriangle, DollarSign, Activity, ExternalLink,
} from "lucide-react";

interface Charge {
  amount: number;
  date: string;
  status: string;
  email: string;
}

interface RevenueData {
  connected: boolean;
  mrr: number;
  arr: number;
  customers: number;
  failedPayments?: number;
  recentCharges?: Charge[];
  message?: string;
  verifiedAt?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function currency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function StripeDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/stripe/revenue", { cache: "no-store" });
      const j: RevenueData = await r.json();
      setData(j);
      setError(null);
      setLastUpdated(Date.now());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshTimer.current = setInterval(refresh, 60_000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [refresh]);

  const connected = data?.connected === true;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--cream)" }}>
            Stripe Revenue
          </h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: "var(--cream-dim)" }}>
            Live payment data from your Stripe account. Zero if not connected — no fabrication.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10.5px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>
              updated {Math.round((Date.now() - lastUpdated) / 1000)}s ago
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="px-2.5 h-[34px] rounded-lg border border-[var(--panel-border)] hover:border-[var(--panel-border-hot)] text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Connection banner */}
      {connected ? (
        <div
          className="rounded-xl p-3 border flex items-center gap-2.5 text-[12.5px]"
          style={{
            background: "rgba(90,184,150,0.08)",
            borderColor: "rgba(90,184,150,0.35)",
            color: "var(--emerald)",
          }}
        >
          <Activity size={14} className="shrink-0" />
          <span className="flex-1">Connected to Stripe · verified at {data?.verifiedAt ? new Date(data.verifiedAt).toLocaleString() : "—"}</span>
        </div>
      ) : (
        <div
          className="rounded-xl p-3 border flex items-start gap-2.5 text-[12.5px]"
          style={{
            background: "rgba(201,124,94,0.08)",
            borderColor: "rgba(201,124,94,0.35)",
            color: "var(--rust)",
          }}
        >
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium">Stripe not connected</div>
            <div className="text-[11.5px] mt-0.5 opacity-90">
              {data?.message || "Add STRIPE_SECRET_KEY to ~/.hermes/.env to surface live revenue. All metrics show zero until then."}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-3 border text-[12.5px]"
          style={{ background: "rgba(196,96,126,0.08)", borderColor: "rgba(196,96,126,0.35)", color: "var(--plum)" }}
        >
          {error}
        </div>
      )}

      {/* KPI cards */}
      <motion.div {...fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="MRR (30d)"
          value={connected ? currency(data?.mrr ?? 0) : "—"}
          icon={<DollarSign size={16} />}
          accent="#d4a574"
          sub={connected ? "last 30 days" : "not connected"}
        />
        <KpiCard
          label="ARR (projected)"
          value={connected ? currency(data?.arr ?? 0) : "—"}
          icon={<TrendingUp size={16} />}
          accent="#5ab896"
          sub={connected ? "MRR × 12" : "not connected"}
        />
        <KpiCard
          label="Customers"
          value={connected ? String(data?.customers ?? 0) : "—"}
          icon={<Users size={16} />}
          accent="#e6c69a"
          sub={connected ? "active accounts" : "not connected"}
        />
        <KpiCard
          label="Failed payments"
          value={connected ? String(data?.failedPayments ?? 0) : "—"}
          icon={<TrendingDown size={16} />}
          accent="#c4607e"
          sub={connected ? "last 30 days" : "not connected"}
        />
      </motion.div>

      {/* Recent charges */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--line-soft)" }}>
            <div className="flex items-center gap-2">
              <CreditCard size={14} style={{ color: "var(--gold)" }} />
              <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--cream)" }}>
                Recent Charges
              </h2>
            </div>
            <span className="text-[10.5px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>
              {data?.recentCharges?.length ?? 0} records
            </span>
          </div>

          {!connected || !data?.recentCharges || data.recentCharges.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <CreditCard size={28} className="mx-auto opacity-30 mb-2" style={{ color: "var(--cream-dim)" }} />
              <div className="text-[12.5px]" style={{ color: "var(--cream-dim)" }}>
                {connected ? "No charges in the last 30 days." : "Connect Stripe to see recent charges."}
              </div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--line-soft)" }}>
              {data.recentCharges.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5" style={{ borderColor: "var(--line-soft)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-mono shrink-0"
                      style={{
                        background: c.status === "paid" ? "rgba(90,184,150,0.12)" : "rgba(196,96,126,0.12)",
                        color: c.status === "paid" ? "var(--emerald)" : "var(--plum)",
                        border: `1px solid ${c.status === "paid" ? "rgba(90,184,150,0.3)" : "rgba(196,96,126,0.3)"}`,
                      }}
                    >
                      {c.status === "paid" ? "✓" : "✕"}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12.5px] truncate" style={{ color: "var(--cream)" }}>
                        {c.email || "—"}
                      </div>
                      <div className="text-[10.5px]" style={{ color: "var(--cream-mute)" }}>
                        {new Date(c.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-[13px] font-mono font-medium" style={{ color: "var(--cream)" }}>
                      {currency(c.amount)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: c.status === "paid" ? "var(--emerald-dim)" : "var(--plum)" }}>
                      {c.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stripe dashboard link */}
      <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--cream-mute)" }}>
        <span>Source: Stripe API · `/api/stripe/revenue` · no fabrication, zero when disconnected</span>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-[var(--gold)] transition"
        >
          Stripe Dashboard <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, icon, accent, sub,
}: { label: string; value: string; icon: React.ReactNode; accent: string; sub: string }) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-[10.5px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-mono font-medium" style={{ color: "var(--cream)" }}>
        {value}
      </div>
      <div className="text-[10.5px] mt-1" style={{ color: "var(--cream-mute)" }}>{sub}</div>
    </div>
  );
}
