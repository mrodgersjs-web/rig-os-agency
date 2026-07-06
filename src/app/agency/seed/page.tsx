"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, RefreshCw, Sprout, Trash2, AlertTriangle,
  CheckCircle2, Loader2, ChevronDown, Activity,
} from "lucide-react";

interface SeedCounts {
  clients: number;
  proposals: number;
  contracts: number;
  invoices: number;
  deals: number;
  total: number;
  ready: boolean;
}

interface SeedResult {
  success: boolean;
  seeded?: Record<string, number>;
  cleared?: boolean;
  timestamp?: string;
}

const C = {
  bg: "var(--bg-deep)",
  card: "var(--bg-card)",
  mid: "var(--bg-mid)",
  text: "var(--cream)",
  text2: "var(--cream-dim)",
  text3: "var(--cream-mute)",
  border: "var(--line-soft)",
  gold: "var(--gold)",
  emerald: "var(--emerald)",
  plum: "var(--plum)",
  rose: "#ef4444",
};

const collections = [
  { key: "clients", label: "Clients", note: "10 verticals seeded", tone: "var(--gold)" },
  { key: "proposals", label: "Proposals", note: "3 active proposals", tone: "var(--emerald)" },
  { key: "contracts", label: "Contracts", note: "5 active contracts", tone: "#5ab896" },
  { key: "invoices", label: "Invoices", note: "5 paid invoices", tone: "#fbbf24" },
  { key: "deals", label: "Pipeline Deals", note: "5 deals across stages", tone: "#c084fc" },
];

export default function SeedControlPage() {
  const [counts, setCounts] = useState<SeedCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [lastActionAt, setLastActionAt] = useState<string>("");

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/seed");
      const data = await res.json();
      setCounts({
        clients: data.counts?.clients ?? 0,
        proposals: data.counts?.proposals ?? 0,
        contracts: data.counts?.contracts ?? 0,
        invoices: data.counts?.invoices ?? 0,
        deals: data.counts?.deals ?? 0,
        total: data.total ?? 0,
        ready: !!data.ready,
      });
    } catch {
      setCounts(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  async function runSeed() {
    setBusy("seed"); setResult(null);
    try {
      const res = await fetch("/api/agency/seed", { method: "POST" });
      const data = await res.json();
      setResult({ success: !!data.success, seeded: data.seeded, timestamp: data.timestamp });
      setLastActionAt(new Date().toLocaleTimeString());
      await loadCounts();
    } catch (e: any) {
      setResult({ success: false, timestamp: new Date().toISOString() });
    } finally {
      setBusy(null);
    }
  }

  async function runClear() {
    setBusy("clear"); setResult(null); setConfirmClear(false);
    try {
      const res = await fetch("/api/agency/seed", { method: "DELETE" });
      const data = await res.json();
      setResult({ success: !!data.success, cleared: !!data.cleared, timestamp: new Date().toISOString() });
      setLastActionAt(new Date().toLocaleTimeString());
      await loadCounts();
    } catch {
      setResult({ success: false, timestamp: new Date().toISOString() });
    } finally {
      setBusy(null);
    }
  }

  const total = counts?.total ?? 0;
  const ready = counts?.ready ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: C.text }}>
            Seed Control
          </h1>
          <p className="text-[14px] mt-1" style={{ color: C.text2 }}>
            Populate or reset the agency JSON store · {total} records currently loaded
          </p>
        </div>
        <button
          onClick={loadCounts}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] border transition"
          style={{ borderColor: C.border, color: C.text2 }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Status banner */}
      <div
        className="rounded-xl p-4 border flex items-center justify-between"
        style={{
          background: ready ? `${C.emerald}10` : `${C.gold}10`,
          borderColor: ready ? `${C.emerald}60` : `${C.gold}60`,
        }}
      >
        <div className="flex items-center gap-3">
          {ready ? <CheckCircle2 size={20} color={C.emerald} /> : <Database size={20} color={C.gold} />}
          <div>
            <div className="text-[14px] font-medium" style={{ color: C.text }}>
              {ready ? "Agency store is seeded" : "Agency store is empty"}
            </div>
            <div className="text-[12px]" style={{ color: C.text2 }}>
              {ready
                ? `All 5 collections populated. Dashboard, clients, proposals, contracts, invoices, and pipeline will render live data.`
                : `Seed canonical data to make clients, deals, proposals, contracts, and invoices demoable.`}
            </div>
          </div>
        </div>
        <div className="text-[11px]" style={{ color: C.text3 }}>
          Last check: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Collections grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {collections.map((col) => {
          const n = counts?.[col.key as keyof SeedCounts] ?? 0;
          return (
            <div
              key={col.key}
              className="rounded-xl p-4 border"
              style={{ background: C.card, borderColor: C.border }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: C.text3 }}>
                  {col.label}
                </span>
                <Activity size={12} color={n > 0 ? col.tone : C.text3} />
              </div>
              <div className="text-[24px] font-semibold mb-1" style={{ color: n > 0 ? col.tone : C.text3 }}>
                {n}
              </div>
              <div className="text-[10px]" style={{ color: C.text3 }}>{col.note}</div>
            </div>
          );
        })}
      </div>

      {/* Action panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={runSeed}
          disabled={busy !== null}
          className="rounded-xl p-5 border text-left transition hover:scale-[1.005] disabled:opacity-50"
          style={{ background: C.card, borderColor: `${C.gold}60` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: `${C.gold}20` }}>
              {busy === "seed" ? <Loader2 size={20} className="animate-spin" color={C.gold} /> : <Sprout size={20} color={C.gold} />}
            </div>
            <div>
              <div className="text-[15px] font-semibold" style={{ color: C.text }}>
                Seed canonical data
              </div>
              <div className="text-[12px]" style={{ color: C.text2 }}>
                Writes 10 clients · 3 proposals · 5 contracts · 5 invoices · 5 deals
              </div>
            </div>
          </div>
          <div className="text-[11px]" style={{ color: C.text3 }}>
            Idempotent — safe to run repeatedly. Replaces existing data with the canonical agency-data.ts seed set.
          </div>
        </button>

        <button
          onClick={() => setConfirmClear(true)}
          disabled={busy !== null}
          className="rounded-xl p-5 border text-left transition hover:scale-[1.005] disabled:opacity-50"
          style={{ background: C.card, borderColor: `${C.rose}40` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: `${C.rose}20` }}>
              {busy === "clear" ? <Loader2 size={20} className="animate-spin" color={C.rose} /> : <Trash2 size={20} color={C.rose} />}
            </div>
            <div>
              <div className="text-[15px] font-semibold" style={{ color: C.text }}>
                Reset to empty
              </div>
              <div className="text-[12px]" style={{ color: C.text2 }}>
                Wipes all 5 collections back to zero
              </div>
            </div>
          </div>
          <div className="text-[11px]" style={{ color: C.text3 }}>
            Destructive — use to demo the empty state, then re-seed to restore.
          </div>
        </button>
      </div>

      {/* Confirm clear modal */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setConfirmClear(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border max-w-md w-full p-6"
              style={{ background: C.card, borderColor: `${C.rose}80` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={22} color={C.rose} />
                <h2 className="text-[16px] font-semibold" style={{ color: C.text }}>
                  Reset all agency data?
                </h2>
              </div>
              <p className="text-[13px] mb-5" style={{ color: C.text2 }}>
                This will delete all {total} records from the JSON store. You can re-seed afterward.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={runClear}
                  className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium"
                  style={{ background: C.rose, color: "#fff" }}
                >
                  Yes, wipe data
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-[13px] border"
                  style={{ borderColor: C.border, color: C.text2 }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result banner */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-4 border flex items-start gap-3"
            style={{
              background: result.success ? `${C.emerald}10` : `${C.rose}10`,
              borderColor: result.success ? `${C.emerald}60` : `${C.rose}60`,
            }}
          >
            {result.success ? <CheckCircle2 size={18} color={C.emerald} /> : <AlertTriangle size={18} color={C.rose} />}
            <div className="flex-1">
              <div className="text-[13px] font-medium" style={{ color: C.text }}>
                {result.cleared
                  ? "Agency data wiped"
                  : result.seeded
                  ? `Seeded ${Object.values(result.seeded).reduce((a, b) => a + b, 0)} records across ${Object.keys(result.seeded).length} collections`
                  : "Action failed"}
              </div>
              {result.seeded && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(result.seeded).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: `${C.emerald}20`, color: C.emerald }}
                    >
                      {k}: {v}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-[11px] mt-2" style={{ color: C.text3 }}>
                {lastActionAt} · {result.timestamp ? new Date(result.timestamp).toLocaleString() : ""}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer note */}
      <div className="text-[11px] text-center pt-4" style={{ color: C.text3 }}>
        Seed endpoint: <code style={{ color: C.gold }}>POST /api/agency/seed</code> · Reset: <code style={{ color: C.gold }}>DELETE /api/agency/seed</code> · Status: <code style={{ color: C.gold }}>GET /api/agency/seed</code>
      </div>
    </div>
  );
}