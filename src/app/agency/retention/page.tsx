"use client";

// ── RIG OS Agency — Client Retention Watchtower ────────────────────────────
// Live retention scoring + churn risk for the active client book.
// Wires /api/agency/retention for: risk distribution, ARR-at-risk,
// renewal calendar, overdue invoices, open proposals, churn simulation,
// vertical & tier breakdowns.
//
// Doctrine:
//   - Score = 100 minus observable penalties (overdue invoices, contract
//     expiry proximity, reported health, account status). Never fabricated.
//   - ARR-at-risk comes only from real overdue amounts + contracts ending
//     within 60d. No speculation beyond what's in the persistent store.
//
// Routes:
//   /agency/retention          — this surface
//   /api/agency/retention      — supplies payload

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ShieldCheck, ShieldAlert, Activity, AlertTriangle, AlertCircle,
  Calendar, Clock, DollarSign, TrendingDown, TrendingUp, RefreshCw,
  Search, Filter, Mail, ExternalLink, Copy, X, ChevronRight,
  Building2, FileText, Briefcase, Award, Zap, Target, BarChart3,
  ArrowDown, ArrowUp, CheckCircle2, Phone, Globe, Heart,
} from "lucide-react";

const C = {
  bg: "var(--bg-deep)", bgMid: "var(--bg-mid)", card: "var(--bg-card)",
  elev: "var(--bg-elev)", text: "var(--cream)", text2: "var(--cream-soft)",
  text3: "var(--cream-dim)", textMute: "var(--cream-mute)",
  border: "var(--line-soft)", borderHot: "var(--line)",
  gold: "var(--gold)", goldSoft: "var(--gold-soft)", goldDeep: "var(--gold-deep)",
  emerald: "var(--emerald)", emeraldDim: "var(--emerald-dim)",
  plum: "var(--plum)", rust: "var(--rust)",
  blue: "#60a5fa", cyan: "#22d3ee",
  orange: "#e0934f",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

interface ClientRow {
  id: string; clientName: string; vertical: string; tier: string;
  status: string; health: string; contactName: string; contactEmail: string;
  monthlyFee: number; annualFee: number; startDate: string; endDate: string;
  autoRenew: boolean; arr: number; mrr: number; tenureMonths: number;
  invoices: { total: number; paid: number; outstanding: number; overdue: number; oldestDueAgeDays: number | null };
  contract: { id: string | null; endDate: string | null; daysUntilEnd: number | null; autoRenew: boolean; status: string | null };
  proposals: { total: number; open: number };
  retentionScore: number; risk: "healthy" | "watch" | "at_risk" | "critical";
  flags: string[]; nextAction: string;
}

interface OverdueInvoice {
  id: string; clientId: string; clientName: string; amount: number;
  dueDate: string; ageDays: number; severity: "moderate" | "high" | "severe";
  status: string;
}

interface RenewalRow {
  clientId: string; clientName: string; tier: string; arr: number;
  endDate: string | null; daysUntilEnd: number | null; autoRenew: boolean;
  risk: string;
}

interface OpenProposal {
  id: string; clientId: string; clientName: string; vertical: string;
  monthlyFee: number; annualValue: number; status: string; sentDate: string;
  validUntil: string; scope: string;
}

interface RetentionPayload {
  generatedAt: string; latencyMs: number; sources: string[];
  summary: {
    totalClients: number; activeClients: number; avgRetentionScore: number;
    totalArr: number; totalMrr: number; arrAtRisk: number; mrrAtRisk: number;
    netRevenueRetentionPct: number;
    healthyCount: number; watchCount: number; atRiskCount: number; criticalCount: number;
    overdueInvoiceCount: number; expiringSoonCount: number; contractsEnding60d: number;
  };
  riskDistribution: { label: string; count: number; color: string; key: string }[];
  clients: ClientRow[];
  verticalRollup: { vertical: string; count: number; arr: number; mrr: number; avgScore: number; atRisk: number; critical: number; healthy: number }[];
  tierRollup: { tier: string; count: number; arr: number; mrr: number; avgScore: number }[];
  renewalCalendar: RenewalRow[];
  overdueInvoices: OverdueInvoice[];
  openProposals: OpenProposal[];
  manualRenewalQueue: RenewalRow[];
  churnSim: { totalAtRiskArr: number; totalAtRiskMrr: number; retainedArr: number; retainedPct: number; worstCaseLostArr: number };
  style: { healthy: { color: string; bg: string; label: string }; watch: { color: string; bg: string; label: string }; at_risk: { color: string; bg: string; label: string }; critical: { color: string; bg: string; label: string } };
  doctrine: { truth: string; next: string };
}

type Tab = "all" | "renewals" | "overdue" | "expansion";

const RISK_META: Record<string, { icon: any; label: string; ringColor: string }> = {
  healthy: { icon: ShieldCheck, label: "Healthy", ringColor: "rgba(90,184,150,0.4)" },
  watch: { icon: Shield, label: "Watch", ringColor: "rgba(212,165,116,0.4)" },
  at_risk: { icon: ShieldAlert, label: "At Risk", ringColor: "rgba(224,147,79,0.4)" },
  critical: { icon: ShieldAlert, label: "Critical", ringColor: "rgba(196,96,126,0.4)" },
};

export default function RetentionPage() {
  const [data, setData] = useState<RetentionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "healthy" | "watch" | "at_risk" | "critical">("all");
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [showTruth, setShowTruth] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/retention", { cache: "no-store" });
      const j: RetentionPayload = await res.json();
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
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); }
  }, [refresh]);

  const filteredClients = useMemo(() => {
    if (!data) return [] as ClientRow[];
    let result = data.clients;
    if (riskFilter !== "all") result = result.filter((c) => c.risk === riskFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.vertical.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, riskFilter, search]);

  if (loading || !data) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ color: C.text3, fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}
        >
          <RefreshCw size={14} className="animate-spin" />
          Loading retention watchtower…
        </motion.div>
      </div>
    );
  }

  const s = data.summary;
  const riskScoreColor = (() => {
    if (s.avgRetentionScore >= 80) return C.emerald;
    if (s.avgRetentionScore >= 60) return C.gold;
    if (s.avgRetentionScore >= 40) return C.orange;
    return C.plum;
  })();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: 24, maxWidth: 1320, margin: "0 auto" }}>
      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Shield size={20} style={{ color: C.gold }} />
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: C.textMute, fontWeight: 600 }}>
                Growth · Retention Command
              </span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 500, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.02em" }}>
              Client Retention Watchtower
            </h1>
            <p style={{ fontSize: 14, color: C.text3, marginTop: 6 }}>
              {s.activeClients} active clients · {formatCurrency(s.totalArr)} ARR · {s.avgRetentionScore} avg retention score · {formatCurrency(s.arrAtRisk)} at risk
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: C.textMute, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                updated {Math.round((Date.now() - lastUpdated) / 1000)}s ago
              </span>
            )}
            <button
              onClick={refresh}
              style={{
                padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: "transparent", color: C.text3, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              onClick={() => setShowTruth(true)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: "transparent", color: C.text3, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <FileText size={12} /> Truth Layer
            </button>
          </div>
        </div>
      </motion.div>

      {/* Doctrine banner */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.03 }}>
        <div style={{
          marginTop: 18, padding: "10px 14px", borderRadius: 12,
          background: "rgba(90,184,150,0.06)", border: "1px solid rgba(90,184,150,0.25)",
          display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: C.emerald,
        }}>
          <ShieldCheck size={14} />
          <span>
            <strong>Doctrine:</strong> Retention score = 100 minus observable penalties. ARR-at-risk = real overdue amounts + contracts ending within 60d. No fabricated churn predictions.
          </span>
        </div>
      </motion.div>

      {/* KPI Strip — 6 tiles */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12, marginTop: 18,
        }}>
          <KPITile
            label="Avg Retention Score"
            value={s.avgRetentionScore.toString()}
            sub={`${s.activeClients} active`}
            icon={Activity}
            accent={riskScoreColor}
          />
          <KPITile
            label="Total ARR"
            value={formatCurrency(s.totalArr)}
            sub={`${formatCurrency(s.totalMrr)} MRR`}
            icon={DollarSign}
            accent={C.gold}
          />
          <KPITile
            label="ARR at Risk"
            value={formatCurrency(s.arrAtRisk)}
            sub={`${formatPct(s.netRevenueRetentionPct)} NRR`}
            icon={TrendingDown}
            accent={s.arrAtRisk > 0 ? C.plum : C.emerald}
          />
          <KPITile
            label="Healthy Clients"
            value={s.healthyCount.toString()}
            sub={`${s.watchCount} watch`}
            icon={ShieldCheck}
            accent={C.emerald}
          />
          <KPITile
            label="At Risk + Critical"
            value={`${s.atRiskCount + s.criticalCount}`}
            sub={`${s.atRiskCount} at risk · ${s.criticalCount} critical`}
            icon={ShieldAlert}
            accent={s.atRiskCount + s.criticalCount > 0 ? C.plum : C.emerald}
          />
          <KPITile
            label="Overdue Invoices"
            value={s.overdueInvoiceCount.toString()}
            sub={`${s.expiringSoonCount} ending soon`}
            icon={AlertCircle}
            accent={s.overdueInvoiceCount > 0 ? C.plum : C.emerald}
          />
        </div>
      </motion.div>

      {/* Hero: Retention ring + Risk distribution */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.08 }}>
        <div style={{
          marginTop: 18, display: "grid", gridTemplateColumns: "minmax(280px, 1fr) 2fr",
          gap: 16,
        }}>
          {/* Retention score ring */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
            padding: 24, display: "flex", flexDirection: "column", alignItems: "center",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.textMute, fontWeight: 600, marginBottom: 16 }}>
              Avg Retention Score
            </div>
            <RetentionRing score={s.avgRetentionScore} color={riskScoreColor} />
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: C.text2, fontWeight: 500 }}>
                {s.avgRetentionScore >= 80 ? "Book is healthy" :
                 s.avgRetentionScore >= 60 ? "Book needs attention" :
                 s.avgRetentionScore >= 40 ? "Book at risk" :
                 "Book in critical shape"}
              </div>
              <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>
                {s.healthyCount} healthy · {s.watchCount} watch · {s.atRiskCount} at risk · {s.criticalCount} critical
              </div>
            </div>
          </div>

          {/* Risk distribution + churn sim */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
            padding: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.textMute, fontWeight: 600 }}>
                Risk Distribution
              </div>
              <div style={{ fontSize: 10, color: C.textMute, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Churn Sim → {formatCurrency(data.churnSim.totalAtRiskArr)} at risk
              </div>
            </div>

            {/* Stacked bar */}
            <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
              {data.riskDistribution.map((r) => {
                const total = s.activeClients || 1;
                const pct = (r.count / total) * 100;
                if (pct === 0) return null;
                return (
                  <motion.div
                    key={r.key}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    title={`${r.label}: ${r.count}`}
                    style={{
                      background: r.color,
                      opacity: 0.7,
                      borderRight: `1px solid ${C.bg}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: "#fff", fontWeight: 600,
                    }}
                  >
                    {pct > 8 ? `${r.count}` : ""}
                  </motion.div>
                );
              })}
            </div>

            {/* Risk tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16 }}>
              {data.riskDistribution.map((r) => (
                <div
                  key={r.key}
                  style={{
                    padding: 12, borderRadius: 10,
                    background: `${r.color}10`, border: `1px solid ${r.color}35`,
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: r.color, fontWeight: 600 }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginTop: 4, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {r.count}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMute, marginTop: 2 }}>
                    {s.activeClients > 0 ? Math.round((r.count / s.activeClients) * 100) : 0}% of book
                  </div>
                </div>
              ))}
            </div>

            {/* Churn sim */}
            <div style={{
              marginTop: 16, padding: 14, borderRadius: 10,
              background: "rgba(196,96,126,0.06)", border: "1px solid rgba(196,96,126,0.25)",
            }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: C.plum, fontWeight: 600, marginBottom: 8 }}>
                Worst-Case Churn Simulation
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <SimTile label="ARR Retained" value={formatCurrency(data.churnSim.retainedArr)} color={C.emerald} />
                <SimTile label="ARR Lost" value={formatCurrency(data.churnSim.worstCaseLostArr)} color={C.plum} />
                <SimTile label="NRR" value={formatPct(data.churnSim.retainedPct)} color={data.churnSim.retainedPct >= 90 ? C.emerald : data.churnSim.retainedPct >= 75 ? C.gold : C.plum} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div style={{
          display: "flex", gap: 4, marginTop: 24, borderBottom: `1px solid ${C.border}`,
          flexWrap: "wrap",
        }}>
          <TabButton id="all" active={tab} setActive={setTab} count={s.activeClients}>
            All Clients
          </TabButton>
          <TabButton id="renewals" active={tab} setActive={setTab} count={data.renewalCalendar.length}>
            Renewal Calendar
          </TabButton>
          <TabButton id="overdue" active={tab} setActive={setTab} count={data.overdueInvoices.length}>
            Overdue Invoices
          </TabButton>
          <TabButton id="expansion" active={tab} setActive={setTab} count={data.openProposals.length}>
            Open Proposals
          </TabButton>
        </div>
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "all" && (
          <motion.div key="all" {...fadeUp} transition={{ duration: 0.3 }}>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: 10, color: C.textMute }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search client, vertical, contact…"
                  style={{
                    width: "100%", padding: "8px 10px 8px 30px", fontSize: 12,
                    background: C.elev, border: `1px solid ${C.border}`, borderRadius: 8,
                    color: C.text, outline: "none",
                  }}
                />
              </div>
              {(["all", "healthy", "watch", "at_risk", "critical"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setRiskFilter(k)}
                  style={{
                    padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                    border: `1px solid ${riskFilter === k ? data.style[k as keyof typeof data.style].color : C.border}`,
                    background: riskFilter === k ? data.style[k as keyof typeof data.style].bg : "transparent",
                    color: riskFilter === k ? data.style[k as keyof typeof data.style].color : C.text3,
                    textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
                  }}
                >
                  {k === "all" ? "All" : RISK_META[k].label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {filteredClients.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: C.textMute, fontSize: 13 }}>
                  No clients match these filters.
                </div>
              )}
              {filteredClients.map((c) => (
                <ClientRowCard
                  key={c.id}
                  client={c}
                  style={data.style[c.risk]}
                  onSelect={() => setSelectedClient(c)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {tab === "renewals" && (
          <motion.div key="renewals" {...fadeUp} transition={{ duration: 0.3 }}>
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "rgba(212,165,116,0.06)", border: "1px solid rgba(212,165,116,0.25)", fontSize: 12, color: C.gold, display: "flex", alignItems: "center", gap: 10 }}>
              <Calendar size={14} />
              <span>
                <strong>Renewal Calendar:</strong> Contracts ending in the next 120 days. Auto-renew OFF clients are highlighted for outreach.
              </span>
            </div>

            {data.renewalCalendar.length === 0 ? (
              <div style={{ marginTop: 16, padding: 32, textAlign: "center", color: C.textMute, fontSize: 13, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                No contracts ending in the next 120 days. Book is renewal-clear.
              </div>
            ) : (
              <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                {data.renewalCalendar.map((r) => (
                  <RenewalRow key={r.clientId} row={r} style={data.style[r.risk as keyof typeof data.style]} />
                ))}
              </div>
            )}

            {data.manualRenewalQueue.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.plum, fontWeight: 600, marginBottom: 10 }}>
                  Manual Outreach Queue ({data.manualRenewalQueue.length})
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {data.manualRenewalQueue.map((r) => (
                    <RenewalRow key={r.clientId} row={r} style={data.style[r.risk as keyof typeof data.style]} manual />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "overdue" && (
          <motion.div key="overdue" {...fadeUp} transition={{ duration: 0.3 }}>
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "rgba(196,96,126,0.06)", border: "1px solid rgba(196,96,126,0.25)", fontSize: 12, color: C.plum, display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle size={14} />
              <span>
                <strong>Overdue Invoices:</strong> {data.overdueInvoices.length} outstanding past due date.
                {data.overdueInvoices.length === 0 && " Book is paid-current."}
              </span>
            </div>

            {data.overdueInvoices.length === 0 ? (
              <div style={{ marginTop: 16, padding: 32, textAlign: "center", color: C.textMute, fontSize: 13, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <CheckCircle2 size={20} style={{ color: C.emerald, marginBottom: 8 }} />
                <div>No overdue invoices. All clients paid-current.</div>
              </div>
            ) : (
              <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: C.elev, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600 }}>
                  <div>Client</div>
                  <div>Amount</div>
                  <div>Due</div>
                  <div>Age</div>
                  <div>Severity</div>
                </div>
                {data.overdueInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                      padding: "12px 16px", borderTop: `1px solid ${C.border}`, fontSize: 12,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ color: C.text, fontWeight: 500 }}>{inv.clientName}</div>
                      <div style={{ color: C.textMute, fontSize: 10.5, marginTop: 2 }}>{inv.id}</div>
                    </div>
                    <div style={{ color: C.text2, fontWeight: 600 }}>{formatCurrency(inv.amount)}</div>
                    <div style={{ color: C.text3, fontSize: 11 }}>{new Date(inv.dueDate).toLocaleDateString()}</div>
                    <div style={{ color: inv.ageDays > 60 ? C.plum : C.gold, fontWeight: 600 }}>{inv.ageDays}d</div>
                    <div>
                      <span style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                        background: inv.severity === "severe" ? "rgba(196,96,126,0.14)" : inv.severity === "high" ? "rgba(224,147,79,0.14)" : "rgba(212,165,116,0.14)",
                        color: inv.severity === "severe" ? C.plum : inv.severity === "high" ? C.orange : C.gold,
                      }}>
                        {inv.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "expansion" && (
          <motion.div key="expansion" {...fadeUp} transition={{ duration: 0.3 }}>
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "rgba(90,184,150,0.06)", border: "1px solid rgba(90,184,150,0.25)", fontSize: 12, color: C.emerald, display: "flex", alignItems: "center", gap: 10 }}>
              <TrendingUp size={14} />
              <span>
                <strong>Open Proposals:</strong> Active revenue opportunities from existing book.
              </span>
            </div>

            {data.openProposals.length === 0 ? (
              <div style={{ marginTop: 16, padding: 32, textAlign: "center", color: C.textMute, fontSize: 13, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                No open proposals right now.
              </div>
            ) : (
              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {data.openProposals.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: 16, borderRadius: 12, background: C.card, border: `1px solid ${C.border}`,
                      display: "grid", gridTemplateColumns: "1fr auto", gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <FileText size={14} style={{ color: C.emerald }} />
                        <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{p.clientName}</span>
                        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: C.textMute, padding: "2px 6px", background: C.elev, borderRadius: 4 }}>
                          {p.vertical}
                        </span>
                        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: C.emerald, padding: "2px 6px", background: "rgba(90,184,150,0.12)", borderRadius: 4, fontWeight: 600 }}>
                          {p.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: C.text3, marginBottom: 8 }}>{p.scope}</div>
                      <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.textMute, flexWrap: "wrap" }}>
                        <span><Calendar size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />Sent {new Date(p.sentDate).toLocaleDateString()}</span>
                        <span><Clock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />Valid until {new Date(p.validUntil).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, color: C.emerald, fontWeight: 600, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        {formatCurrency(p.annualValue)}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMute, marginTop: 2 }}>
                        {formatCurrency(p.monthlyFee)}/mo
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vertical + Tier rollups */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.12 }}>
        <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Vertical */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.textMute, fontWeight: 600 }}>
                By Vertical
              </div>
              <Building2 size={14} style={{ color: C.textMute }} />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {data.verticalRollup.map((v) => {
                const maxArr = Math.max(...data.verticalRollup.map((x) => x.arr));
                const widthPct = maxArr > 0 ? (v.arr / maxArr) * 100 : 0;
                const scoreColor = v.avgScore >= 80 ? C.emerald : v.avgScore >= 60 ? C.gold : v.avgScore >= 40 ? C.orange : C.plum;
                return (
                  <div key={v.vertical} style={{ padding: 10, background: C.elev, borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.text2, textTransform: "capitalize" }}>{v.vertical}</span>
                      <span style={{ fontSize: 11, color: C.textMute }}>{v.count} · {formatCurrency(v.arr)}</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(165,151,131,0.1)", borderRadius: 3, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{ height: "100%", background: scoreColor, opacity: 0.6 }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: C.textMute }}>
                      <span>Avg score <span style={{ color: scoreColor, fontWeight: 600 }}>{v.avgScore}</span></span>
                      <span style={{ color: v.atRisk > 0 ? C.plum : C.textMute }}>{v.atRisk} at risk</span>
                      <span style={{ color: v.critical > 0 ? C.plum : C.textMute }}>{v.critical} critical</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.textMute, fontWeight: 600 }}>
                By Tier
              </div>
              <Award size={14} style={{ color: C.textMute }} />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {data.tierRollup.map((t) => {
                const maxArr = Math.max(...data.tierRollup.map((x) => x.arr));
                const widthPct = maxArr > 0 ? (t.arr / maxArr) * 100 : 0;
                const scoreColor = t.avgScore >= 80 ? C.emerald : t.avgScore >= 60 ? C.gold : t.avgScore >= 40 ? C.orange : C.plum;
                return (
                  <div key={t.tier} style={{ padding: 10, background: C.elev, borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: C.text2, textTransform: "capitalize" }}>{t.tier}</span>
                      <span style={{ fontSize: 11, color: C.textMute }}>{t.count} · {formatCurrency(t.arr)}</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(165,151,131,0.1)", borderRadius: 3, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{ height: "100%", background: C.gold, opacity: 0.6 }}
                      />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 10, color: C.textMute }}>
                      Avg score <span style={{ color: scoreColor, fontWeight: 600 }}>{t.avgScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Client detail modal */}
      <AnimatePresence>
        {selectedClient && (
          <ClientDetailModal
            client={selectedClient}
            style={data.style[selectedClient.risk]}
            onClose={() => setSelectedClient(null)}
          />
        )}
      </AnimatePresence>

      {/* Truth layer modal */}
      <AnimatePresence>
        {showTruth && (
          <TruthModal
            doctrine={data.doctrine}
            sources={data.sources}
            latency={data.latencyMs}
            onClose={() => setShowTruth(false)}
          />
        )}
      </AnimatePresence>

      <div style={{ height: 60 }} />
    </div>
  );
}

// ── Components ────────────────────────────────────────────────────────────

function KPITile({ label, value, sub, icon: Icon, accent }: any) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      style={{
        padding: 16, borderRadius: 14, background: C.card, border: `1px solid ${C.border}`,
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600 }}>
          {label}
        </span>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.01em" }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: C.textMute, marginTop: 4 }}>{sub}</div>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.4 }} />
    </motion.div>
  );
}

function RetentionRing({ score, color }: { score: number; color: string }) {
  const radius = 64;
  const stroke = 10;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 160, height: 160 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={80} cy={80} r={radius} stroke="rgba(165,151,131,0.15)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={80} cy={80} r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90 80 80)"
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ fontSize: 38, fontWeight: 600, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {score}
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute }}>
          Score
        </div>
      </div>
    </div>
  );
}

function SimTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, color, fontWeight: 600, marginTop: 2, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

function TabButton({ id, active, setActive, count, children }: any) {
  const isActive = active === id;
  return (
    <button
      onClick={() => setActive(id)}
      style={{
        padding: "10px 16px", border: "none",
        background: "transparent",
        color: isActive ? C.gold : C.text3,
        fontSize: 12, cursor: "pointer", fontWeight: 500,
        borderBottom: `2px solid ${isActive ? C.gold : "transparent"}`,
        marginBottom: -1,
        textTransform: "uppercase", letterSpacing: "0.1em",
        display: "flex", alignItems: "center", gap: 8,
      }}
    >
      {children}
      <span style={{
        padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
        background: isActive ? C.gold : C.elev,
        color: isActive ? C.bg : C.textMute,
      }}>
        {count}
      </span>
    </button>
  );
}

function ClientRowCard({ client, style, onSelect }: { client: ClientRow; style: any; onSelect: () => void }) {
  const RiskIcon = RISK_META[client.risk].icon;
  const scoreColor = client.retentionScore >= 80 ? C.emerald : client.retentionScore >= 60 ? C.gold : client.retentionScore >= 40 ? C.orange : C.plum;
  return (
    <motion.div
      whileHover={{ x: 2 }}
      onClick={onSelect}
      style={{
        padding: 14, borderRadius: 12, background: C.card,
        border: `1px solid ${client.risk === "critical" || client.risk === "at_risk" ? style.color + "55" : C.border}`,
        cursor: "pointer", display: "grid",
        gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center",
      }}
    >
      {/* Score badge */}
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: `conic-gradient(${scoreColor} ${client.retentionScore * 3.6}deg, rgba(165,151,131,0.15) 0deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%", background: C.card,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{client.retentionScore}</div>
        </div>
      </div>

      {/* Identity + flags */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{client.clientName}</span>
          <span style={{
            padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.1em",
            background: style.bg, color: style.color,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            <RiskIcon size={10} /> {style.label}
          </span>
          <span style={{ fontSize: 10, color: C.textMute, padding: "2px 6px", background: C.elev, borderRadius: 4, textTransform: "capitalize" }}>
            {client.vertical} · {client.tier}
          </span>
          <span style={{ fontSize: 10, color: C.textMute }}>{client.tenureMonths}mo tenure</span>
        </div>
        {client.flags.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {client.flags.slice(0, 3).map((f, i) => (
              <span key={i} style={{
                fontSize: 10, color: C.text3,
                padding: "2px 6px", borderRadius: 4,
                background: "rgba(165,151,131,0.06)",
              }}>
                {f}
              </span>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: C.textMute, marginTop: 4 }}>
          Next: {client.nextAction}
        </div>
      </div>

      {/* Money */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{formatCurrency(client.arr)}</div>
        <div style={{ fontSize: 10, color: C.textMute }}>ARR · {formatCurrency(client.mrr)}/mo</div>
      </div>

      {/* Chevron */}
      <ChevronRight size={16} style={{ color: C.textMute }} />
    </motion.div>
  );
}

function RenewalRow({ row, style, manual = false }: { row: RenewalRow; style: any; manual?: boolean }) {
  const daysColor = row.daysUntilEnd === null ? C.textMute : row.daysUntilEnd < 0 ? C.plum : row.daysUntilEnd <= 30 ? C.plum : row.daysUntilEnd <= 60 ? C.gold : C.text3;
  return (
    <div style={{
      padding: 12, borderRadius: 10, background: C.card,
      border: `1px solid ${manual ? C.plum + "55" : C.border}`,
      display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12, alignItems: "center",
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{row.clientName}</span>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: style.color, padding: "2px 6px", background: style.bg, borderRadius: 4, fontWeight: 600 }}>
            {style.label}
          </span>
          {manual && (
            <span style={{ fontSize: 10, color: C.plum, padding: "2px 6px", background: "rgba(196,96,126,0.1)", borderRadius: 4, fontWeight: 600, textTransform: "uppercase" }}>
              Manual Outreach
            </span>
          )}
          {row.autoRenew && (
            <span style={{ fontSize: 10, color: C.emerald, padding: "2px 6px", background: "rgba(90,184,150,0.1)", borderRadius: 4 }}>
              Auto-renew
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: C.textMute, marginTop: 2 }}>
          {row.tier} · ends {row.endDate ? new Date(row.endDate).toLocaleDateString() : "—"}
        </div>
      </div>
      <div style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}>
        {formatCurrency(row.arr)}
      </div>
      <div style={{ fontSize: 13, color: daysColor, fontWeight: 600 }}>
        {row.daysUntilEnd === null ? "—" :
         row.daysUntilEnd < 0 ? `${Math.abs(row.daysUntilEnd)}d ago` :
         `${row.daysUntilEnd}d`}
      </div>
      <ChevronRight size={14} style={{ color: C.textMute }} />
    </div>
  );
}

function ClientDetailModal({ client, style, onClose }: { client: ClientRow; style: any; onClose: () => void }) {
  const scoreColor = client.retentionScore >= 80 ? C.emerald : client.retentionScore >= 60 ? C.gold : client.retentionScore >= 40 ? C.orange : C.plum;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: 24, maxWidth: 720, width: "100%", maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: style.color, fontWeight: 600 }}>
              {style.label} Client
            </div>
            <div style={{ fontSize: 22, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif", marginTop: 4 }}>
              {client.clientName}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMute, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Score + KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 18 }}>
          <div style={{
            width: 110, height: 110, borderRadius: "50%",
            background: `conic-gradient(${scoreColor} ${client.retentionScore * 3.6}deg, rgba(165,151,131,0.15) 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 92, height: 92, borderRadius: "50%", background: C.card,
              display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
            }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: C.text }}>{client.retentionScore}</div>
              <div style={{ fontSize: 9, color: C.textMute, letterSpacing: "0.2em" }}>SCORE</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DetailStat label="ARR" value={formatCurrency(client.arr)} />
            <DetailStat label="MRR" value={formatCurrency(client.mrr)} />
            <DetailStat label="Tier" value={client.tier} cap />
            <DetailStat label="Vertical" value={client.vertical} cap />
            <DetailStat label="Tenure" value={`${client.tenureMonths}mo`} />
            <DetailStat label="Open Proposals" value={client.proposals.open.toString()} />
          </div>
        </div>

        {/* Flags */}
        {client.flags.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600, marginBottom: 8 }}>
              Risk Flags
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {client.flags.map((f, i) => (
                <div key={i} style={{
                  padding: "8px 10px", borderRadius: 8, fontSize: 12,
                  background: "rgba(196,96,126,0.06)", border: "1px solid rgba(196,96,126,0.2)",
                  color: C.text2, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertTriangle size={12} style={{ color: C.plum }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600, marginBottom: 8 }}>
            Invoice Health
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <DetailStat label="Total" value={client.invoices.total.toString()} />
            <DetailStat label="Paid" value={client.invoices.paid.toString()} />
            <DetailStat label="Outstanding" value={client.invoices.outstanding.toString()} />
            <DetailStat label="Overdue" value={client.invoices.overdue.toString()} accent={client.invoices.overdue > 0 ? C.plum : undefined} />
          </div>
          {client.invoices.oldestDueAgeDays !== null && (
            <div style={{ fontSize: 11, color: C.plum, marginTop: 6 }}>
              Oldest overdue invoice: {client.invoices.oldestDueAgeDays} days
            </div>
          )}
        </div>

        {/* Contract */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600, marginBottom: 8 }}>
            Contract
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <DetailStat label="End Date" value={client.contract.endDate ? new Date(client.contract.endDate).toLocaleDateString() : "—"} />
            <DetailStat label="Days Until End" value={client.contract.daysUntilEnd === null ? "—" : client.contract.daysUntilEnd < 0 ? `${Math.abs(client.contract.daysUntilEnd)}d overdue` : `${client.contract.daysUntilEnd}d`} accent={client.contract.daysUntilEnd !== null && client.contract.daysUntilEnd <= 30 ? C.plum : undefined} />
            <DetailStat label="Auto-Renew" value={client.autoRenew ? "Yes" : "No"} accent={client.autoRenew ? C.emerald : C.gold} />
          </div>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600, marginBottom: 8 }}>
            Primary Contact
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DetailStat label="Name" value={client.contactName || "—"} />
            <DetailStat label="Email" value={client.contactEmail || "—"} />
          </div>
        </div>

        {/* Next action */}
        <div style={{
          padding: 12, borderRadius: 10,
          background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.25)",
        }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 6 }}>
            Doctrine-Generated Next Action
          </div>
          <div style={{ fontSize: 13, color: C.text }}>{client.nextAction}</div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {client.contactEmail && (
            <a
              href={`mailto:${client.contactEmail}?subject=Check-in: ${encodeURIComponent(client.clientName)}`}
              style={{
                padding: "8px 14px", borderRadius: 8, background: C.gold, color: C.bg,
                textDecoration: "none", fontSize: 12, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Mail size={12} /> Email
            </a>
          )}
          {client.contactEmail && (
            <button
              onClick={() => navigator.clipboard.writeText(client.contactEmail)}
              style={{
                padding: "8px 14px", borderRadius: 8, background: "transparent",
                color: C.text3, border: `1px solid ${C.border}`, fontSize: 12, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Copy size={12} /> Copy Email
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailStat({ label, value, accent, cap }: { label: string; value: string; accent?: string; cap?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: accent || C.text2, fontWeight: 500, marginTop: 2, textTransform: cap ? "capitalize" : "none" }}>
        {value}
      </div>
    </div>
  );
}

function TruthModal({ doctrine, sources, latency, onClose }: { doctrine: { truth: string; next: string }; sources: string[]; latency: number; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, maxWidth: 640, width: "100%" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 18, color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Truth Layer — Retention Watchtower
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textMute, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: "rgba(90,184,150,0.06)", border: "1px solid rgba(90,184,150,0.25)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.emerald, fontWeight: 600, marginBottom: 6 }}>
            Real
          </div>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
            All retention scores, ARR-at-risk, and renewal counts come from the live persistent store (clients/contracts/invoices/proposals). Every number on this page traces back to a row in those JSON files.
          </div>
        </div>

        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: "rgba(212,165,116,0.06)", border: "1px solid rgba(212,165,116,0.25)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 6 }}>
            Computed
          </div>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
            Retention score = 100 − penalties (overdue invoices, contract expiry proximity, reported health, account status). NRR = (Total ARR − At-Risk ARR) / Total ARR. Worst-case churn sim assumes every at-risk and overdue client churns simultaneously.
          </div>
        </div>

        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: "rgba(165,151,131,0.06)", border: "1px solid rgba(165,151,131,0.2)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600, marginBottom: 6 }}>
            Not Fabricated
          </div>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
            No churn probability models, no ML churn predictions, no LTV projections, no "engagement score" without backing events. What you see is what the data store says today.
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMute, fontWeight: 600, marginBottom: 8 }}>
            Sources ({sources.length})
          </div>
          {sources.map((s) => (
            <div key={s} style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.text3, padding: "3px 0" }}>
              • {s}
            </div>
          ))}
          <div style={{ fontSize: 10, color: C.textMute, marginTop: 6 }}>
            Latency: {latency}ms
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 6 }}>
            Doctrine
          </div>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{doctrine.truth}</div>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 8, lineHeight: 1.6 }}>{doctrine.next}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}