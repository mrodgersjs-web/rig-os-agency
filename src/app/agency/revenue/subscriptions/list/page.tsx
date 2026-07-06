"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Search, Filter, ChevronDown, ChevronUp, X,
  CreditCard, Calendar, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, DollarSign, Users, Crown, Activity, Plus,
} from "lucide-react";
import Link from "next/link";

const C = {
  card: "var(--rig-card)", text: "var(--rig-text)", text2: "var(--rig-text-2)", text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)", border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)", red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
  blue: "var(--rig-blue)", blueBg: "var(--rig-blue-bg)", plum: "var(--rig-plum)", plumBg: "var(--rig-plum-bg)",
};

interface Subscription {
  id: string;
  clientId: string;
  clientName: string;
  vertical: string;
  tier: "starter" | "growth" | "scale" | "enterprise";
  monthlyFee: number;
  status: "active" | "past_due" | "canceled" | "paused";
  startDate: string;
  renewalDate: string;
  health: "green" | "yellow" | "red";
  daysToRenewal: number;
  source: string;
}

interface ClientRecord {
  id: string;
  name: string;
  status: string;
  notes?: string;
  updatedAt?: string;
  createdAt?: string;
  source?: string;
}

function tierColor(t: string) {
  if (t === "enterprise") return { bg: C.plumBg, color: C.plum };
  if (t === "scale") return { bg: C.goldBg, color: C.gold };
  if (t === "growth") return { bg: C.emeraldBg, color: C.emerald };
  return { bg: C.blueBg, color: C.blue };
}

function statusColor(s: string) {
  if (s === "active") return { bg: C.emeraldBg, color: C.emerald };
  if (s === "past_due") return { bg: C.goldBg, color: C.gold };
  if (s === "paused") return { bg: C.blueBg, color: C.blue };
  return { bg: C.redBg, color: C.red };
}

function healthColor(h: string) {
  if (h === "green") return C.emerald;
  if (h === "yellow") return C.gold;
  return C.red;
}

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function daysUntil(iso: string): number {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.round((d.getTime() - Date.now()) / 86400000);
}

function extractTier(notes?: string): "starter" | "growth" | "scale" | "enterprise" {
  if (!notes) return "starter";
  const m = notes.match(/Tier:\s*(starter|growth|scale|enterprise)/i);
  return (m?.[1]?.toLowerCase() as any) || "starter";
}

function extractVertical(notes?: string): string {
  if (!notes) return "general";
  const m = notes.match(/Vertical:\s*([^\s|]+)/i);
  return m?.[1] || "general";
}

function deriveHealth(notes?: string): "green" | "yellow" | "red" {
  if (!notes) return "green";
  if (/Health:\s*red/i.test(notes)) return "red";
  if (/Health:\s*yellow/i.test(notes)) return "yellow";
  return "green";
}

function deriveStatus(clientStatus: string, health: string): "active" | "past_due" | "canceled" | "paused" {
  if (clientStatus === "lead") return "paused";
  if (clientStatus === "prospect") return "paused";
  if (health === "red") return "past_due";
  if (clientStatus === "client") return "active";
  return "active";
}

export default function SubscriptionsList() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"monthlyFee" | "renewal" | "clientName" | "daysToRenewal">("monthlyFee");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Subscription | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, invRes] = await Promise.all([
        fetch("/api/agency/clients").then((r) => r.json()),
        fetch("/api/agency/invoices").then((r) => r.json()),
      ]);
      const clients: ClientRecord[] = clientsRes.clients || [];
      const invoices = invRes.invoices || [];

      const derived: Subscription[] = clients.map((c) => {
        const tier = extractTier(c.notes);
        const vertical = extractVertical(c.notes);
        const health = deriveHealth(c.notes);
        const monthlyMatch = c.notes?.match(/Monthly:\s*\$?([\d,]+)/);
        const monthlyFee = monthlyMatch ? Number(monthlyMatch[1].replace(/,/g, "")) : 2500;
        const renewalDate = c.updatedAt || new Date(Date.now() + 30 * 86400000).toISOString();
        const status = deriveStatus(c.status, health);
        const clientInvoice = invoices.find((i: any) => i.clientId === c.id);
        return {
          id: `SUB-${c.id}`,
          clientId: c.id,
          clientName: c.name,
          vertical,
          tier,
          monthlyFee,
          status,
          startDate: c.createdAt || new Date().toISOString(),
          renewalDate,
          health,
          daysToRenewal: daysUntil(renewalDate),
          source: c.source || "Outbound",
        };
      });

      setSubs(derived);
    } catch {
      setSubs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let out = subs.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (tierFilter !== "all" && s.tier !== tierFilter) return false;
      if (verticalFilter !== "all" && s.vertical !== verticalFilter) return false;
      if (q && !s.clientName.toLowerCase().includes(q) && !s.vertical.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      return true;
    });
    out.sort((a, b) => {
      let av: any, bv: any;
      if (sortBy === "monthlyFee") { av = a.monthlyFee; bv = b.monthlyFee; }
      else if (sortBy === "renewal") { av = new Date(a.renewalDate).getTime(); bv = new Date(b.renewalDate).getTime(); }
      else if (sortBy === "clientName") { av = a.clientName; bv = b.clientName; }
      else { av = a.daysToRenewal; bv = b.daysToRenewal; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [subs, search, statusFilter, tierFilter, verticalFilter, sortBy, sortDir]);

  const metrics = useMemo(() => {
    const active = subs.filter((s) => s.status === "active");
    const mrr = active.reduce((s, x) => s + x.monthlyFee, 0);
    const arr = mrr * 12;
    const pastDue = subs.filter((s) => s.status === "past_due").length;
    const paused = subs.filter((s) => s.status === "paused").length;
    const renewingSoon = subs.filter((s) => s.daysToRenewal >= 0 && s.daysToRenewal <= 30).length;
    const avgDeal = active.length ? mrr / active.length : 0;
    return { activeCount: active.length, mrr, arr, pastDue, paused, renewingSoon, avgDeal };
  }, [subs]);

  const verticals = useMemo(() => {
    const m = new Map<string, number>();
    subs.forEach((s) => m.set(s.vertical, (m.get(s.vertical) || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [subs]);

  const tierRollup = useMemo(() => {
    const m = new Map<string, { count: number; mrr: number }>();
    subs.filter((s) => s.status === "active").forEach((s) => {
      const cur = m.get(s.tier) || { count: 0, mrr: 0 };
      cur.count += 1;
      cur.mrr += s.monthlyFee;
      m.set(s.tier, cur);
    });
    return Array.from(m.entries());
  }, [subs]);

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const sortIcon = (key: typeof sortBy) => {
    if (sortBy !== key) return null;
    return sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  };

  return (
    <div className="px-6 py-5 pb-20 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="eyebrow mb-3">
        <span className="num">III.</span>
        <span className="line" />
        <span className="label">Subscriptions</span>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--cream)" }}>Subscriptions</h1>
          <p className="text-sm mt-1" style={{ color: "var(--cream-dim)" }}>
            Active and paused subscriptions derived from {subs.length} client record{subs.length === 1 ? "" : "s"} · MRR/ARR rollup by tier and vertical
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border"
          style={{ background: C.card, borderColor: C.border, color: "var(--cream)" }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <KpiTile label="Active" value={String(metrics.activeCount)} icon={<CheckCircle2 size={12} />} color={C.emerald} bg={C.emeraldBg} />
        <KpiTile label="MRR" value={fmt(metrics.mrr)} icon={<DollarSign size={12} />} color={C.gold} bg={C.goldBg} />
        <KpiTile label="ARR" value={fmt(metrics.arr)} icon={<TrendingUp size={12} />} color={C.emerald} bg={C.emeraldBg} />
        <KpiTile label="Avg Deal" value={fmt(metrics.avgDeal)} icon={<CreditCard size={12} />} color={C.blue} bg={C.blueBg} />
        <KpiTile label="Past Due" value={String(metrics.pastDue)} icon={<AlertTriangle size={12} />} color={C.red} bg={C.redBg} />
        <KpiTile label="Paused" value={String(metrics.paused)} icon={<Clock size={12} />} color={C.blue} bg={C.blueBg} />
        <KpiTile label="Renewing 30d" value={String(metrics.renewingSoon)} icon={<Calendar size={12} />} color={C.plum} bg={C.plumBg} />
      </div>

      {/* Tier rollup + Vertical rollup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-3">
            <Crown size={14} style={{ color: C.gold }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--cream)" }}>Tier Rollup</h3>
          </div>
          <div className="space-y-2">
            {tierRollup.length === 0 && <div className="text-xs" style={{ color: C.text3 }}>No active subscriptions</div>}
            {tierRollup.sort((a, b) => b[1].mrr - a[1].mrr).map(([tier, v]) => {
              const tc = tierColor(tier);
              const pct = metrics.mrr > 0 ? (v.mrr / metrics.mrr) * 100 : 0;
              return (
                <div key={tier} className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold w-20 px-2 py-0.5 rounded text-center" style={{ background: tc.bg, color: tc.color }}>
                    {tier}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--rig-hover)" }}>
                    <motion.div
                      className="h-full"
                      style={{ background: tc.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="text-xs font-mono w-16 text-right" style={{ color: "var(--cream)" }}>{fmt(v.mrr)}</span>
                  <span className="text-[10px] w-8 text-right" style={{ color: C.text3 }}>{v.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} style={{ color: C.gold }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--cream)" }}>Verticals</h3>
          </div>
          <div className="space-y-2">
            {verticals.length === 0 && <div className="text-xs" style={{ color: C.text3 }}>No vertical data</div>}
            {verticals.map(([v, count]) => (
              <button
                key={v}
                onClick={() => setVerticalFilter(verticalFilter === v ? "all" : v)}
                className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover:opacity-80"
                style={{
                  background: verticalFilter === v ? C.goldBg : "transparent",
                  color: verticalFilter === v ? C.gold : "var(--cream-dim)",
                }}
              >
                <span className="capitalize flex-1 text-left">{v.replace(/_/g, " ")}</span>
                <span className="font-mono">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border flex-1 min-w-[200px] max-w-md" style={{ background: C.card, borderColor: C.border }}>
          <Search size={12} style={{ color: C.text3 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, vertical, id…"
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: "var(--cream)" }}
          />
          {search && <button onClick={() => setSearch("")}><X size={10} style={{ color: C.text3 }} /></button>}
        </div>

        <div className="flex items-center gap-1">
          {[
            { id: "all", label: `All (${subs.length})` },
            { id: "active", label: `Active (${subs.filter((s) => s.status === "active").length})` },
            { id: "past_due", label: `Past Due (${subs.filter((s) => s.status === "past_due").length})` },
            { id: "paused", label: `Paused (${subs.filter((s) => s.status === "paused").length})` },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setStatusFilter(p.id)}
              className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold transition"
              style={{
                background: statusFilter === p.id ? C.goldBg : "transparent",
                color: statusFilter === p.id ? C.gold : C.text3,
                border: `1px solid ${statusFilter === p.id ? C.gold : C.border}`,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {["all", "starter", "growth", "scale", "enterprise"].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold transition"
              style={{
                background: tierFilter === t ? C.emeraldBg : "transparent",
                color: tierFilter === t ? C.emerald : C.text3,
                border: `1px solid ${tierFilter === t ? C.emerald : C.border}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {(search || statusFilter !== "all" || tierFilter !== "all" || verticalFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); setTierFilter("all"); setVerticalFilter("all"); }}
            className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold"
            style={{ background: C.redBg, color: C.red, border: `1px solid ${C.red}` }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="grid grid-cols-12 px-3 py-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: C.text3, background: "var(--rig-hover)", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => toggleSort("clientName")} className="col-span-3 text-left flex items-center gap-1">Client {sortIcon("clientName")}</button>
          <div className="col-span-2">Tier / Vertical</div>
          <button onClick={() => toggleSort("monthlyFee")} className="col-span-2 text-right flex items-center justify-end gap-1">MRR {sortIcon("monthlyFee")}</button>
          <div className="col-span-2">Status</div>
          <button onClick={() => toggleSort("renewal")} className="col-span-2 text-left flex items-center gap-1">Renewal {sortIcon("renewal")}</button>
          <button onClick={() => toggleSort("daysToRenewal")} className="col-span-1 text-right flex items-center justify-end gap-1">Days {sortIcon("daysToRenewal")}</button>
        </div>

        {loading && (
          <div className="px-3 py-8 text-center text-xs" style={{ color: C.text3 }}>Loading subscriptions…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-xs" style={{ color: C.text3 }}>No subscriptions match the current filters</div>
        )}

        <AnimatePresence>
          {filtered.map((s, idx) => {
            const tc = tierColor(s.tier);
            const sc = statusColor(s.status);
            const hc = healthColor(s.health);
            const overdue = s.daysToRenewal < 0;
            const soon = s.daysToRenewal >= 0 && s.daysToRenewal <= 30;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.015 }}
                onClick={() => setSelected(s)}
                className="grid grid-cols-12 px-3 py-2.5 text-xs cursor-pointer hover:opacity-90"
                style={{ borderTop: `1px solid ${C.border}`, background: idx % 2 === 0 ? C.card : "transparent" }}
              >
                <div className="col-span-3 truncate">
                  <div className="font-medium" style={{ color: "var(--cream)" }}>{s.clientName}</div>
                  <div className="text-[10px]" style={{ color: C.text3 }}>{s.id}</div>
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: tc.bg, color: tc.color }}>{s.tier}</span>
                  <span className="text-[10px] capitalize truncate" style={{ color: C.text2 }}>{s.vertical.replace(/_/g, " ")}</span>
                </div>
                <div className="col-span-2 text-right font-mono" style={{ color: C.gold }}>{fmt(s.monthlyFee)}</div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>{s.status.replace("_", " ")}</span>
                  <span className="text-[10px]" style={{ color: hc }}>●</span>
                </div>
                <div className="col-span-2 truncate text-[10px]" style={{ color: C.text2 }}>
                  {new Date(s.renewalDate).toLocaleDateString()}
                </div>
                <div className="col-span-1 text-right font-mono text-[10px]" style={{ color: overdue ? C.red : soon ? C.gold : C.text2 }}>
                  {s.daysToRenewal < 0 ? `${Math.abs(s.daysToRenewal)}d late` : `${s.daysToRenewal}d`}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 grid place-items-center p-6"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg border max-w-2xl w-full"
              style={{ background: C.card, borderColor: C.gold }}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: C.border }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={14} style={{ color: C.gold }} />
                    <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: C.text3 }}>Subscription</span>
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--cream)" }}>{selected.clientName}</h2>
                  <span className="text-[10px] font-mono" style={{ color: C.text3 }}>{selected.id}</span>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded" style={{ background: "var(--rig-hover)" }}>
                  <X size={14} style={{ color: "var(--cream-dim)" }} />
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <DetailRow label="Tier" value={<span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: tierColor(selected.tier).bg, color: tierColor(selected.tier).color }}>{selected.tier}</span>} />
                <DetailRow label="Status" value={<span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: statusColor(selected.status).bg, color: statusColor(selected.status).color }}>{selected.status.replace("_", " ")}</span>} />
                <DetailRow label="Monthly MRR" value={<span style={{ color: C.gold }} className="font-mono">{fmt(selected.monthlyFee)}</span>} />
                <DetailRow label="Annual Value" value={<span style={{ color: C.emerald }} className="font-mono">{fmt(selected.monthlyFee * 12)}</span>} />
                <DetailRow label="Vertical" value={<span className="capitalize" style={{ color: "var(--cream)" }}>{selected.vertical.replace(/_/g, " ")}</span>} />
                <DetailRow label="Health" value={<span style={{ color: healthColor(selected.health) }}>● {selected.health.toUpperCase()}</span>} />
                <DetailRow label="Start Date" value={<span style={{ color: "var(--cream-dim)" }}>{new Date(selected.startDate).toLocaleDateString()}</span>} />
                <DetailRow label="Renewal" value={<span style={{ color: "var(--cream-dim)" }}>{new Date(selected.renewalDate).toLocaleDateString()}</span>} />
                <DetailRow label="Days to Renewal" value={
                  <span className="font-mono" style={{ color: selected.daysToRenewal < 0 ? C.red : selected.daysToRenewal <= 30 ? C.gold : C.emerald }}>
                    {selected.daysToRenewal < 0 ? `${Math.abs(selected.daysToRenewal)} days overdue` : `${selected.daysToRenewal} days`}
                  </span>
                } />
                <DetailRow label="Source" value={<span style={{ color: "var(--cream-dim)" }}>{selected.source}</span>} />
              </div>
              <div className="p-4 border-t flex gap-2" style={{ borderColor: C.border }}>
                <Link href={`/agency/clients`} className="flex-1 text-center px-3 py-2 rounded-md text-xs font-medium border" style={{ background: C.goldBg, color: C.gold, borderColor: C.gold }}>
                  Open Client
                </Link>
                <Link href={`/agency/revenue/invoices/list`} className="flex-1 text-center px-3 py-2 rounded-md text-xs font-medium border" style={{ background: C.card, borderColor: C.border, color: "var(--cream)" }}>
                  View Invoices
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 text-[10px] text-center" style={{ color: C.mute }}>
        Subscriptions derived from client records · {filtered.length} of {subs.length} shown · ProofPacket or it didn't happen
      </div>
    </div>
  );
}

function KpiTile({ label, value, icon, color, bg }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: C.card, borderColor: C.border }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="grid place-items-center w-5 h-5 rounded" style={{ background: bg, color }}>{icon}</span>
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: C.text3 }}>{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color: "var(--cream)" }}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md p-2.5" style={{ background: "var(--rig-hover)" }}>
      <div className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.text3 }}>{label}</div>
      <div className="text-xs">{value}</div>
    </div>
  );
}