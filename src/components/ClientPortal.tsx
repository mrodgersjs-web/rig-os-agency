"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, FileText, Receipt, Shield, Activity, DollarSign,
  AlertCircle, CheckCircle2, Clock, ExternalLink, Building2,
  Mail, Phone, TrendingUp, Calendar, Sparkles, RefreshCw,
  ChevronRight, Eye, Download, Zap, CreditCard,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface Client {
  id: string;
  name: string;
  vertical: string;
  status: string;
  health: "green" | "yellow" | "red";
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  monthlyValue?: number;
  contractStart?: string;
  tags?: string[];
  notes?: string;
}

interface Contract {
  id: string;
  clientId: string;
  tier: string;
  monthlyValue: number;
  status: string;
  startDate: string;
  endDate?: string;
  scope?: string;
}

interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft";
  issuedAt: string;
  dueAt: string;
  description?: string;
}

interface Activity {
  id: string;
  clientId: string;
  type: string;
  message: string;
  timestamp: string;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const daysUntil = (iso?: string) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.round(ms / 86400000);
};

const healthColor = (h: string) =>
  h === "green" ? "var(--gold)" : h === "yellow" ? "#e6c69a" : "#c75c5c";

const statusColor = (s: string) => {
  if (s === "paid" || s === "active") return "var(--gold)";
  if (s === "pending" || s === "prospect") return "#e6c69a";
  if (s === "overdue") return "#c75c5c";
  return "var(--cream-mute)";
};

/* ── Component ────────────────────────────────────────────────────────────── */

export default function ClientPortal() {
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, co, inv] = await Promise.all([
        fetch("/api/agency/clients").then((r) => r.json()),
        fetch("/api/agency/contracts").then((r) => r.json()),
        fetch("/api/agency/invoices").then((r) => r.json()),
      ]);
      const clist: Client[] = c.clients || [];
      setClients(clist);
      setContracts(co.contracts || []);
      setInvoices(inv.invoices || []);
      if (!selectedClientId && clist.length > 0) {
        setSelectedClientId(clist[0].id);
      }
    } catch (err) {
      console.error("ClientPortal load error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Derived state ────────────────────────────────────────────────────── */

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.vertical?.toLowerCase().includes(q) ||
        c.contactEmail?.toLowerCase().includes(q) ||
        c.contactName?.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId],
  );

  const clientContracts = useMemo(
    () => contracts.filter((c) => c.clientId === selectedClientId),
    [contracts, selectedClientId],
  );

  const clientInvoices = useMemo(
    () => invoices.filter((i) => i.clientId === selectedClientId),
    [invoices, selectedClientId],
  );

  const stats = useMemo(() => {
    const totalMRR = clientContracts
      .filter((c) => c.status === "active")
      .reduce((sum, c) => sum + (c.monthlyValue || 0), 0);
    const outstanding = clientInvoices
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    const paidYTD = clientInvoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    const overdueCount = clientInvoices.filter((i) => i.status === "overdue").length;
    return { totalMRR, outstanding, paidYTD, overdueCount, contractCount: clientContracts.length };
  }, [clientContracts, clientInvoices]);

  const portfolioStats = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === "active").length;
    const totalRevenue = contracts
      .filter((c) => c.status === "active")
      .reduce((s, c) => s + (c.monthlyValue || 0), 0);
    const overdueInvoices = invoices.filter((i) => i.status === "overdue").length;
    const overdueAmount = invoices
      .filter((i) => i.status === "overdue")
      .reduce((s, i) => s + (i.amount || 0), 0);
    return { activeClients, totalRevenue, overdueInvoices, overdueAmount };
  }, [clients, contracts, invoices]);

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="px-6 py-6 space-y-6 text-[var(--cream)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-deep))" }}
            >
              <Shield size={20} className="text-[var(--bg-deep)]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Client Portal</h1>
              <p className="text-sm text-[var(--cream-mute)]">
                Read-only executive view of client health, contracts, and receivables.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--gold)]/30 bg-[var(--bg-deep)]/60 text-[var(--cream)] hover:border-[var(--gold)] transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="text-sm">{loading ? "Loading…" : "Refresh"}</span>
        </button>
      </motion.div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Users size={16} />}
          label="Active Clients"
          value={portfolioStats.activeClients.toString()}
          accent="var(--gold)"
          subtitle={`of ${clients.length} total`}
        />
        <KPICard
          icon={<TrendingUp size={16} />}
          label="Monthly Revenue"
          value={fmt(portfolioStats.totalRevenue)}
          accent="var(--gold-soft)"
          subtitle="recurring contracts"
        />
        <KPICard
          icon={<AlertCircle size={16} />}
          label="Overdue Invoices"
          value={portfolioStats.overdueInvoices.toString()}
          accent={portfolioStats.overdueInvoices > 0 ? "#c75c5c" : "var(--gold)"}
          subtitle={fmt(portfolioStats.overdueAmount)}
        />
        <KPICard
          icon={<Activity size={16} />}
          label="Total Contracts"
          value={contracts.length.toString()}
          accent="var(--gold-deep)"
          subtitle={`${clientContracts.length} for selected`}
        />
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Client list */}
        <div
          className="rounded-xl border border-[var(--gold)]/15 bg-[var(--bg-deep)]/40 overflow-hidden"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="p-3 border-b border-[var(--gold)]/10">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--bg-deep)]/70 border border-[var(--gold)]/15">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="flex-1 bg-transparent text-sm placeholder:text-[var(--cream-mute)] outline-none"
              />
            </div>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {filteredClients.length === 0 && (
              <div className="p-6 text-center text-sm text-[var(--cream-mute)]">
                {loading ? "Loading clients…" : "No clients match."}
              </div>
            )}
            {filteredClients.map((c) => {
              const active = c.id === selectedClientId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`w-full text-left p-3 border-b border-[var(--gold)]/5 transition ${
                    active
                      ? "bg-[var(--gold)]/10 border-l-2 border-l-[var(--gold)]"
                      : "hover:bg-[var(--gold)]/5 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{c.name}</div>
                      <div className="text-xs text-[var(--cream-mute)] truncate">{c.vertical}</div>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: healthColor(c.health) }}
                      title={`Health: ${c.health}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        background: `${statusColor(c.status)}22`,
                        color: statusColor(c.status),
                      }}
                    >
                      {c.status}
                    </span>
                    {c.monthlyValue ? (
                      <span className="text-xs text-[var(--gold-soft)]">
                        {fmt(c.monthlyValue)}/mo
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="space-y-4">
          {!selectedClient ? (
            <EmptyState />
          ) : (
            <>
              {/* Client header */}
              <motion.div
                key={selectedClient.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[var(--gold)]/15 bg-[var(--bg-deep)]/40 p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-[var(--bg-deep)]"
                      style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-deep))" }}
                    >
                      {selectedClient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{selectedClient.name}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-[var(--cream-mute)]">{selectedClient.vertical}</span>
                        <span
                          className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: `${statusColor(selectedClient.status)}22`,
                            color: statusColor(selectedClient.status),
                          }}
                        >
                          {selectedClient.status}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1"
                          style={{
                            background: `${healthColor(selectedClient.health)}22`,
                            color: healthColor(selectedClient.health),
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: healthColor(selectedClient.health) }}
                          />
                          {selectedClient.health}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {selectedClient.contactName && (
                    <ContactChip icon={<Users size={12} />} label="Contact" value={selectedClient.contactName} />
                  )}
                  {selectedClient.contactEmail && (
                    <ContactChip
                      icon={<Mail size={12} />}
                      label="Email"
                      value={selectedClient.contactEmail}
                      href={`mailto:${selectedClient.contactEmail}`}
                    />
                  )}
                  {selectedClient.contactPhone && (
                    <ContactChip
                      icon={<Phone size={12} />}
                      label="Phone"
                      value={selectedClient.contactPhone}
                      href={`tel:${selectedClient.contactPhone}`}
                    />
                  )}
                </div>
              </motion.div>

              {/* Client-level KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MiniStat icon={<DollarSign size={14} />} label="Active MRR" value={fmt(stats.totalMRR)} />
                <MiniStat icon={<Receipt size={14} />} label="Outstanding" value={fmt(stats.outstanding)} highlight={stats.outstanding > 0} />
                <MiniStat icon={<CheckCircle2 size={14} />} label="Paid (LTD)" value={fmt(stats.paidYTD)} />
                <MiniStat icon={<FileText size={14} />} label="Contracts" value={stats.contractCount.toString()} />
              </div>

              {/* Contracts */}
              <SectionCard title="Contracts" icon={<FileText size={14} />} count={clientContracts.length}>
                {clientContracts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[var(--cream-mute)]">No contracts on file.</div>
                ) : (
                  <div className="divide-y divide-[var(--gold)]/5">
                    {clientContracts.map((co) => {
                      const days = daysUntil(co.endDate);
                      return (
                        <div key={co.id} className="p-4 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{co.tier || "Standard"}</span>
                              <span
                                className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                  background: `${statusColor(co.status)}22`,
                                  color: statusColor(co.status),
                                }}
                              >
                                {co.status}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--cream-mute)] mt-1">
                              {fmtDate(co.startDate)} → {co.endDate ? fmtDate(co.endDate) : "open-ended"}
                            </div>
                            {co.scope && (
                              <div className="text-xs text-[var(--cream-mute)] mt-1 line-clamp-2">{co.scope}</div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-[var(--gold)]">
                              {fmt(co.monthlyValue || 0)}
                            </div>
                            <div className="text-[10px] text-[var(--cream-mute)]">per month</div>
                            {days !== null && days <= 30 && days >= 0 && (
                              <div className="text-[10px] text-[var(--gold-soft)] mt-1 flex items-center gap-1 justify-end">
                                <Clock size={10} />
                                {days}d left
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>

              {/* Invoices */}
              <SectionCard title="Invoices" icon={<Receipt size={14} />} count={clientInvoices.length}>
                {clientInvoices.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[var(--cream-mute)]">No invoices issued.</div>
                ) : (
                  <div className="divide-y divide-[var(--gold)]/5">
                    {clientInvoices
                      .slice()
                      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
                      .map((inv) => {
                        const overdue = inv.status === "overdue";
                        return (
                          <div key={inv.id} className="p-4 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-[var(--cream-mute)]">{inv.id}</span>
                                <span
                                  className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                                  style={{
                                    background: `${statusColor(inv.status)}22`,
                                    color: statusColor(inv.status),
                                  }}
                                >
                                  {inv.status}
                                </span>
                              </div>
                              {inv.description && (
                                <div className="text-xs text-[var(--cream-mute)] mt-1 truncate">
                                  {inv.description}
                                </div>
                              )}
                              <div className="text-xs text-[var(--cream-mute)] mt-1">
                                Issued {fmtDate(inv.issuedAt)} · Due {fmtDate(inv.dueAt)}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div
                                className="text-sm font-semibold"
                                style={{ color: overdue ? "#c75c5c" : "var(--gold)" }}
                              >
                                {fmt(inv.amount || 0)}
                              </div>
                              {overdue && (
                                <div className="text-[10px] text-[#c75c5c] mt-1">overdue</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Subcomponents ───────────────────────────────────────────────────────── */

function KPICard({
  icon, label, value, accent, subtitle,
}: {
  icon: React.ReactNode; label: string; value: string; accent: string; subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[var(--gold)]/15 bg-[var(--bg-deep)]/40 p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-[var(--cream-mute)]">{label}</div>
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <div className="text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </div>
      {subtitle && <div className="text-xs text-[var(--cream-mute)] mt-1">{subtitle}</div>}
    </motion.div>
  );
}

function MiniStat({
  icon, label, value, highlight,
}: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        borderColor: highlight ? "#c75c5c44" : "var(--gold) / 0.15",
        background: highlight ? "#c75c5c11" : "var(--bg-deep) / 0.40",
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--cream-mute)]">
        {icon}
        {label}
      </div>
      <div
        className="text-base font-semibold mt-1"
        style={{ color: highlight ? "#c75c5c" : "var(--gold)" }}
      >
        {value}
      </div>
    </div>
  );
}

function ContactChip({
  icon, label, value, href,
}: {
  icon: React.ReactNode; label: string; value: string; href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--bg-deep)]/60 border border-[var(--gold)]/10">
      <div className="text-[var(--gold)] mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-[var(--cream-mute)]">{label}</div>
        <div className="text-xs truncate">{value}</div>
      </div>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="block hover:border-[var(--gold)]/40 transition" style={{ textDecoration: "none" }}>
        {inner}
      </a>
    );
  }
  return inner;
}

function SectionCard({
  title, icon, count, children,
}: {
  title: string; icon: React.ReactNode; count: number; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--gold)]/15 bg-[var(--bg-deep)]/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gold)]/10">
        <div className="flex items-center gap-2">
          <div className="text-[var(--gold)]">{icon}</div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="text-xs text-[var(--cream-mute)]">{count}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-[var(--gold)]/15 bg-[var(--bg-deep)]/40 p-12 text-center">
      <div
        className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, var(--gold), var(--gold-deep))" }}
      >
        <Sparkles size={22} className="text-[var(--bg-deep)]" />
      </div>
      <h3 className="text-base font-semibold mb-1">Select a client</h3>
      <p className="text-sm text-[var(--cream-mute)]">Choose a client from the list to view their portfolio.</p>
    </div>
  );
}