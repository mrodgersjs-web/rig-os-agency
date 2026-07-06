"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Search, X, ChevronDown, ChevronUp, Users,
  DollarSign, TrendingUp, Building2, Activity, Crown,
  Mail, Phone, Globe, Calendar, FileCheck, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const C = {
  card: "var(--rig-card)", text: "var(--rig-text)", text2: "var(--rig-text-2)", text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)", border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)", red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
  blue: "var(--rig-blue)", blueBg: "var(--rig-blue-bg)", plum: "var(--rig-plum)", plumBg: "var(--rig-plum-bg)",
};

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  company: string;
  status: "client" | "prospect" | "lead";
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Vertical {
  id: string;
  name: string;
  icon: string;
  targetARR: number;
  clientCount: number;
  avgDealSize: number;
  salesCycleDays: number;
  color: string;
}

function tierFromNotes(notes?: string): string {
  if (!notes) return "starter";
  const m = notes.match(/Tier:\s*([a-z]+)/i);
  return m?.[1]?.toLowerCase() || "starter";
}

function verticalFromNotes(notes?: string): string {
  if (!notes) return "general";
  const m = notes.match(/Vertical:\s*([^\s|]+)/i);
  return m?.[1] || "general";
}

function healthFromNotes(notes?: string): "green" | "yellow" | "red" {
  if (!notes) return "green";
  if (/Health:\s*red/i.test(notes)) return "red";
  if (/Health:\s*yellow/i.test(notes)) return "yellow";
  return "green";
}

function monthlyFromNotes(notes?: string): number {
  if (!notes) return 0;
  const m = notes.match(/Monthly:\s*\$?([\d,]+)/);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
}

function statusColor(s: string) {
  if (s === "client") return { bg: C.emeraldBg, color: C.emerald };
  if (s === "prospect") return { bg: C.goldBg, color: C.gold };
  return { bg: C.blueBg, color: C.blue };
}

function healthColor(h: string) {
  if (h === "green") return C.emerald;
  if (h === "yellow") return C.gold;
  return C.red;
}

function tierColor(t: string) {
  if (t === "enterprise") return { bg: C.plumBg, color: C.plum };
  if (t === "scale") return { bg: C.goldBg, color: C.gold };
  if (t === "growth") return { bg: C.emeraldBg, color: C.emerald };
  return { bg: C.blueBg, color: C.blue };
}

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function daysAgo(iso: string): number {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.round((Date.now() - d.getTime()) / 86400000);
}

export default function CustomersList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "monthlyFee" | "tier" | "updatedAt">("monthlyFee");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Client | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/clients");
      const d = await r.json();
      setClients(d.clients || []);
      setVerticals(d.verticals || []);
    } catch {
      setClients([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let out = clients.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (tierFilter !== "all" && tierFromNotes(c.notes) !== tierFilter) return false;
      if (verticalFilter !== "all" && verticalFromNotes(c.notes) !== verticalFilter) return false;
      if (q) {
        const haystack = `${c.name} ${c.email} ${c.company} ${c.website} ${c.notes} ${verticalFromNotes(c.notes)} ${tierFromNotes(c.notes)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    out.sort((a, b) => {
      let av: any, bv: any;
      if (sortBy === "name") { av = a.name; bv = b.name; }
      else if (sortBy === "monthlyFee") { av = monthlyFromNotes(a.notes); bv = monthlyFromNotes(b.notes); }
      else if (sortBy === "tier") {
        const tierOrder: Record<string, number> = { enterprise: 4, scale: 3, growth: 2, starter: 1 };
        av = tierOrder[tierFromNotes(a.notes)] || 0;
        bv = tierOrder[tierFromNotes(b.notes)] || 0;
      } else { av = new Date(a.updatedAt).getTime(); bv = new Date(b.updatedAt).getTime(); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [clients, search, statusFilter, tierFilter, verticalFilter, sortBy, sortDir]);

  const metrics = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === "client");
    const mrr = activeClients.reduce((s, c) => s + monthlyFromNotes(c.notes), 0);
    const arr = mrr * 12;
    const prospects = clients.filter((c) => c.status === "prospect").length;
    const leads = clients.filter((c) => c.status === "lead").length;
    const avgMonthly = activeClients.length ? mrr / activeClients.length : 0;
    const redHealth = clients.filter((c) => healthFromNotes(c.notes) === "red").length;
    const yellowHealth = clients.filter((c) => healthFromNotes(c.notes) === "yellow").length;
    return { activeClients: activeClients.length, prospects, leads, mrr, arr, avgMonthly, redHealth, yellowHealth };
  }, [clients]);

  const verticalRollup = useMemo(() => {
    const m = new Map<string, { count: number; mrr: number }>();
    clients.filter((c) => c.status === "client").forEach((c) => {
      const v = verticalFromNotes(c.notes);
      const cur = m.get(v) || { count: 0, mrr: 0 };
      cur.count += 1;
      cur.mrr += monthlyFromNotes(c.notes);
      m.set(v, cur);
    });
    return Array.from(m.entries()).sort((a, b) => b[1].mrr - a[1].mrr);
  }, [clients]);

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
      <div className="eyebrow mb-3">
        <span className="num">V.</span>
        <span className="line" />
        <span className="label">Customers</span>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--cream)" }}>Customers</h1>
          <p className="text-sm mt-1" style={{ color: "var(--cream-dim)" }}>
            Client roster with tier, vertical, and billing profile · {clients.length} record{clients.length === 1 ? "" : "s"}
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <KpiTile label="Active Clients" value={String(metrics.activeClients)} icon={<Users size={12} />} color={C.emerald} bg={C.emeraldBg} />
        <KpiTile label="Prospects" value={String(metrics.prospects)} icon={<Building2 size={12} />} color={C.gold} bg={C.goldBg} />
        <KpiTile label="Leads" value={String(metrics.leads)} icon={<ArrowUpRight size={12} />} color={C.blue} bg={C.blueBg} />
        <KpiTile label="MRR" value={fmt(metrics.mrr)} icon={<DollarSign size={12} />} color={C.gold} bg={C.goldBg} />
        <KpiTile label="ARR" value={fmt(metrics.arr)} icon={<TrendingUp size={12} />} color={C.emerald} bg={C.emeraldBg} />
        <KpiTile label="Avg Monthly" value={fmt(metrics.avgMonthly)} icon={<Activity size={12} />} color={C.blue} bg={C.blueBg} />
        <KpiTile label="Red Health" value={String(metrics.redHealth)} icon={<span style={{ color: C.red }}>●</span>} color={C.red} bg={C.redBg} />
        <KpiTile label="Yellow" value={String(metrics.yellowHealth)} icon={<span style={{ color: C.gold }}>●</span>} color={C.gold} bg={C.goldBg} />
      </div>

      {/* Vertical rollup */}
      <div className="rounded-lg border p-4 mb-6" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Crown size={14} style={{ color: C.gold }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--cream)" }}>Active MRR by Vertical</h3>
        </div>
        <div className="space-y-2">
          {verticalRollup.length === 0 && <div className="text-xs" style={{ color: C.text3 }}>No active clients</div>}
          {verticalRollup.map(([v, data]) => {
            const vertical = verticals.find((vv) => vv.id === v);
            const pct = metrics.mrr > 0 ? (data.mrr / metrics.mrr) * 100 : 0;
            const target = vertical?.targetARR || 0;
            const coverage = target > 0 ? (data.count / Math.max(vertical?.clientCount || 1, 1)) * 100 : 0;
            return (
              <button
                key={v}
                onClick={() => setVerticalFilter(verticalFilter === v ? "all" : v)}
                className="w-full flex items-center gap-3 hover:opacity-80"
              >
                <span
                  className="w-2 h-8 rounded-sm"
                  style={{ background: verticalFilter === v ? C.gold : vertical?.color || C.text3 }}
                />
                <span className="text-xs capitalize w-32 text-left truncate" style={{ color: verticalFilter === v ? C.gold : "var(--cream)" }}>
                  {v.replace(/_/g, " ")}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--rig-hover)" }}>
                  <motion.div
                    className="h-full"
                    style={{ background: vertical?.color || C.gold }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-xs font-mono w-16 text-right" style={{ color: "var(--cream)" }}>{fmt(data.mrr)}</span>
                <span className="text-[10px] w-12 text-right" style={{ color: C.text3 }}>{data.count} clients</span>
                <span className="text-[10px] w-12 text-right" style={{ color: C.text3 }}>{coverage.toFixed(0)}% target</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border flex-1 min-w-[200px] max-w-md" style={{ background: C.card, borderColor: C.border }}>
          <Search size={12} style={{ color: C.text3 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, vertical, tier…"
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: "var(--cream)" }}
          />
          {search && <button onClick={() => setSearch("")}><X size={10} style={{ color: C.text3 }} /></button>}
        </div>

        <div className="flex items-center gap-1">
          {[
            { id: "all", label: `All (${clients.length})` },
            { id: "client", label: `Clients (${clients.filter((c) => c.status === "client").length})` },
            { id: "prospect", label: `Prospects (${clients.filter((c) => c.status === "prospect").length})` },
            { id: "lead", label: `Leads (${clients.filter((c) => c.status === "lead").length})` },
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
          <button onClick={() => toggleSort("name")} className="col-span-3 text-left flex items-center gap-1">Client {sortIcon("name")}</button>
          <div className="col-span-2">Tier / Vertical</div>
          <button onClick={() => toggleSort("monthlyFee")} className="col-span-2 text-right flex items-center justify-end gap-1">Monthly {sortIcon("monthlyFee")}</button>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Contact</div>
          <button onClick={() => toggleSort("updatedAt")} className="col-span-1 text-right flex items-center justify-end gap-1">Updated {sortIcon("updatedAt")}</button>
        </div>

        {loading && (
          <div className="px-3 py-8 text-center text-xs" style={{ color: C.text3 }}>Loading customers…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-xs" style={{ color: C.text3 }}>No customers match the current filters</div>
        )}

        <AnimatePresence>
          {filtered.map((c, idx) => {
            const tier = tierFromNotes(c.notes);
            const vertical = verticalFromNotes(c.notes);
            const health = healthFromNotes(c.notes);
            const monthly = monthlyFromNotes(c.notes);
            const tc = tierColor(tier);
            const sc = statusColor(c.status);
            const hc = healthColor(health);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.015 }}
                onClick={() => setSelected(c)}
                className="grid grid-cols-12 px-3 py-2.5 text-xs cursor-pointer hover:opacity-90"
                style={{
                  borderTop: `1px solid ${C.border}`,
                  background: idx % 2 === 0 ? C.card : "transparent",
                }}
              >
                <div className="col-span-3 truncate">
                  <div className="font-medium flex items-center gap-1.5" style={{ color: "var(--cream)" }}>
                    <span style={{ color: hc }}>●</span>
                    {c.name}
                  </div>
                  <div className="text-[10px]" style={{ color: C.text3 }}>{c.id} · {c.source}</div>
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: tc.bg, color: tc.color }}>{tier}</span>
                  <span className="text-[10px] capitalize truncate" style={{ color: C.text2 }}>{vertical.replace(/_/g, " ")}</span>
                </div>
                <div className="col-span-2 text-right font-mono" style={{ color: monthly > 0 ? C.gold : C.text3 }}>{monthly > 0 ? fmt(monthly) : "—"}</div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>
                    {c.status}
                  </span>
                </div>
                <div className="col-span-2 truncate text-[10px]" style={{ color: C.text2 }}>
                  {c.email}
                </div>
                <div className="col-span-1 text-right font-mono text-[10px]" style={{ color: C.text3 }}>
                  {daysAgo(c.updatedAt)}d
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
                    <Users size={14} style={{ color: C.gold }} />
                    <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: C.text3 }}>Customer</span>
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--cream)" }}>{selected.name}</h2>
                  <span className="text-[10px] font-mono" style={{ color: C.text3 }}>{selected.id} · {selected.company}</span>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded" style={{ background: "var(--rig-hover)" }}>
                  <X size={14} style={{ color: "var(--cream-dim)" }} />
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <DetailRow label="Status" value={
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: statusColor(selected.status).bg, color: statusColor(selected.status).color }}>
                    {selected.status}
                  </span>
                } />
                <DetailRow label="Tier" value={
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: tierColor(tierFromNotes(selected.notes)).bg, color: tierColor(tierFromNotes(selected.notes)).color }}>
                    {tierFromNotes(selected.notes)}
                  </span>
                } />
                <DetailRow label="Monthly" value={<span className="font-mono" style={{ color: C.gold }}>{fmt(monthlyFromNotes(selected.notes))}</span>} />
                <DetailRow label="Annual Value" value={<span className="font-mono" style={{ color: C.emerald }}>{fmt(monthlyFromNotes(selected.notes) * 12)}</span>} />
                <DetailRow label="Vertical" value={<span className="capitalize" style={{ color: "var(--cream)" }}>{verticalFromNotes(selected.notes).replace(/_/g, " ")}</span>} />
                <DetailRow label="Health" value={<span style={{ color: healthColor(healthFromNotes(selected.notes)) }}>● {healthFromNotes(selected.notes).toUpperCase()}</span>} />
                <DetailRow label="Email" value={
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 hover:opacity-80" style={{ color: C.blue }}>
                    <Mail size={11} /> {selected.email}
                  </a>
                } />
                <DetailRow label="Phone" value={
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-1.5 hover:opacity-80" style={{ color: "var(--cream)" }}>
                    <Phone size={11} /> {selected.phone}
                  </a>
                } />
                <DetailRow label="Website" value={
                  <a href={`https://${selected.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:opacity-80" style={{ color: "var(--cream-dim)" }}>
                    <Globe size={11} /> {selected.website}
                  </a>
                } />
                <DetailRow label="Source" value={<span style={{ color: "var(--cream-dim)" }}>{selected.source}</span>} />
                <DetailRow label="Created" value={<span style={{ color: "var(--cream-dim)" }}>{new Date(selected.createdAt).toLocaleDateString()}</span>} />
                <DetailRow label="Updated" value={<span style={{ color: "var(--cream-dim)" }}>{new Date(selected.updatedAt).toLocaleDateString()} ({daysAgo(selected.updatedAt)}d ago)</span>} />
              </div>
              {selected.notes && (
                <div className="px-4 pb-3">
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.text3 }}>Notes</div>
                  <div className="text-xs p-3 rounded-md" style={{ background: "var(--rig-hover)", color: "var(--cream-dim)" }}>{selected.notes}</div>
                </div>
              )}
              <div className="p-4 border-t flex gap-2" style={{ borderColor: C.border }}>
                <Link href={`/agency/clients`} className="flex-1 text-center px-3 py-2 rounded-md text-xs font-medium border" style={{ background: C.goldBg, color: C.gold, borderColor: C.gold }}>
                  Open Client Detail
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
        Customers from /api/agency/clients · {filtered.length} of {clients.length} shown · ProofPacket or it didn't happen
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