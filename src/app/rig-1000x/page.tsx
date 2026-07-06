"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Cpu, HardDrive, Zap, RefreshCw, Server, Database,
  Terminal, ChevronRight, Hash, CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";

// ── RIG 1000x CAR — Strategic Intelligence Convergence Engine ─────────────
// Live control surface for the RIG 1000x improvement loop.
// Pulls real signals: load avg, disk, cron tail, marathon turn, vitals.
// Was a stub (hardcoded "INITIALIZING..."); now wires live data.

interface CronLine {
  ts: string;
  job: string;
  cycle: string;
  preview: string;
  file: string;
}

interface CronFeed {
  total: number;
  lastTs: string | null;
  lines: CronLine[];
}

interface VitalsSummary {
  ok: number;
  total: number;
  clis: { name: string; ok: boolean; version?: string }[];
}

interface LiveState {
  load: { l1: number; l5: number; l15: number } | null;
  disk: { usedPct: number; free: string; total: string } | null;
  uptime: string | null;
  marathonTurn: number | null;
  cron: CronFeed | null;
  vitals: VitalsSummary | null;
  ts: string;
}

async function fetchLive(): Promise<LiveState> {
  const r = await fetch("/api/rig-1000x/live", { cache: "no-store" });
  if (!r.ok) throw new Error(`live ${r.status}`);
  return r.json();
}

export default function Rig1000xCarPage() {
  const [state, setState] = useState<LiveState | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [auto, setAuto] = useState(true);

  const load = useCallback(async () => {
    try {
      const s = await fetchLive();
      setState(s);
      setErr(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setTick((t) => t + 1), 8000);
    return () => clearInterval(id);
  }, [auto]);

  useEffect(() => {
    if (auto) load();
  }, [tick, auto, load]);

  const loadColor = (v: number) =>
    v >= 50 ? "text-red-400" : v >= 20 ? "text-amber-300" : "text-emerald-400";
  const diskColor = (p: number) =>
    p >= 90 ? "text-red-400" : p >= 75 ? "text-amber-300" : "text-emerald-400";

  return (
    <div className="flex flex-col h-full w-full bg-[#050506] text-white p-6 md:p-8 font-sans overflow-y-auto">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-bold text-[#FFCD03] tracking-tight font-serif">
              RIG 1000x CAR
            </h1>
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-gray-300">
              L4-D1-A3-S
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Strategic Intelligence Convergence Engine — live improvement loop
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAuto((a) => !a)}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition ${
              auto
                ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-300"
                : "bg-zinc-800 border-zinc-700 text-gray-400"
            }`}
          >
            {auto ? "AUTO 8s" : "PAUSED"}
          </button>
          <button
            onClick={load}
            className="px-3 py-1.5 rounded text-xs font-mono bg-zinc-800 border border-zinc-700 text-gray-200 hover:bg-zinc-700 flex items-center gap-1.5"
          >
            <RefreshCw size={12} /> REFRESH
          </button>
          <div className="px-3 py-1 rounded bg-green-900/20 border border-green-500/50 text-xs text-green-400 font-mono">
            PHASE A · ACTIVE
          </div>
        </div>
      </header>

      {err && (
        <div className="mb-4 p-3 rounded bg-red-900/20 border border-red-500/40 text-xs text-red-300 font-mono">
          <AlertTriangle size={12} className="inline mr-2" />
          live fetch error: {err}
        </div>
      )}

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi
          icon={<Cpu size={16} />}
          label="LOAD AVG (1m)"
          value={state?.load?.l1.toFixed(2) ?? "—"}
          color={state ? loadColor(state.load!.l1) : "text-gray-400"}
          sub={state ? `${state.load?.l5.toFixed(2)} / ${state.load?.l15.toFixed(2)}` : "—"}
        />
        <Kpi
          icon={<HardDrive size={16} />}
          label="DISK /"
          value={state ? `${state.disk?.usedPct}%` : "—"}
          color={state ? diskColor(state.disk!.usedPct) : "text-gray-400"}
          sub={state ? `${state.disk?.free} free of ${state.disk?.total}` : "—"}
        />
        <Kpi
          icon={<Activity size={16} />}
          label="MARATHON TURN"
          value={state?.marathonTurn != null ? `#${state.marathonTurn}` : "—"}
          color="text-[#FFCD03]"
          sub="rig-1000x loop counter"
        />
        <Kpi
          icon={<Zap size={16} />}
          label="VITALS OK"
          value={
            state?.vitals
              ? `${state.vitals.ok}/${state.vitals.total}`
              : "—"
          }
          color={
            state?.vitals && state.vitals.ok === state.vitals.total
              ? "text-emerald-400"
              : "text-amber-300"
          }
          sub={state?.vitals?.clis.map((c) => c.name).join(" · ") ?? "—"}
        />
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Substrate status */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel
            icon={<Database size={16} />}
            title="Knowledge Lattice"
            rows={[
              ["Backend", "Supabase + AGE Graph"],
              ["Vector Space", "pgvector (1536d)"],
              [
                "Status",
                state ? "LIVE — wired" : "fetching…",
              ],
            ]}
            statusOk={!!state}
          />
          <Panel
            icon={<Server size={16} />}
            title="Control Plane"
            rows={[
              ["Dashboard", "Agent OS :3737"],
              ["Coordination", "BMS A1-A4 Routing"],
              ["Uptime", state?.uptime ?? "—"],
            ]}
            statusOk={!!state}
          />
        </div>

        {/* Phase 0 Decisions — fixed doctrine */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-[#FFCD03]/30 shadow-2xl">
          <h2 className="text-base font-semibold text-[#FFCD03] mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} /> Doctrine Locked
          </h2>
          <ul className="space-y-3 text-sm">
            {[
              "Deterministic before agentic",
              "ProofPacket or it did not happen",
              "No gate JSON, no ship",
              "No source, no number",
              "Escalate, never fail silently",
              "LAN-first, Tailscale backup",
            ].map((d) => (
              <li key={d} className="flex items-start gap-3 text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFCD03] mt-2 shrink-0" />
                <span className="leading-snug">{d}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 p-2.5 rounded bg-zinc-800 text-center text-[10px] text-gray-400 italic font-mono">
            anti-generic-force ≥ 80 internal · ≥ 85 public
          </div>
        </div>
      </div>

      {/* Cron feed + last decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-[#0f0f10] border border-zinc-800">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Terminal size={14} /> Live Cron Output
            </h2>
            <span className="text-[10px] font-mono text-gray-500">
              {state?.cron?.total ?? 0} jobs · tail 8
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <AnimatePresence>
              {state?.cron?.lines.map((l, i) => (
                <motion.div
                  key={l.file}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="text-[11px] font-mono p-2 rounded bg-zinc-900/60 border border-zinc-800/60"
                >
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span className="text-[#FFCD03]">{l.job}</span>
                    <span>{l.ts}</span>
                  </div>
                  <div className="text-gray-300 line-clamp-2">{l.preview}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!state?.cron?.lines.length && (
              <div className="text-[11px] font-mono text-gray-500 p-2">
                no cron output yet
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0f0f10] border border-zinc-800">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Hash size={14} /> Recent Decisions
            </h2>
            <span className="text-[10px] font-mono text-gray-500">
              last 8 commits · rig-os-agency
            </span>
          </div>
          <ol className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {state?.cron?.lines.slice(0, 8).map((l, i) => (
              <li
                key={l.file + i}
                className="text-[11px] font-mono flex gap-2 items-start p-1.5 rounded hover:bg-zinc-900/60"
              >
                <ChevronRight size={10} className="text-[#FFCD03] mt-0.5 shrink-0" />
                <span className="text-gray-300 line-clamp-2">{l.preview}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-zinc-800 flex flex-wrap justify-between items-center text-[10px] font-mono text-gray-500 gap-2">
        <div className="flex items-center gap-3">
          <Clock size={10} />
          <span>last refresh: {state?.ts ?? "—"}</span>
        </div>
        <div>coordinate L4-D1-A3-S · gate-pre-proof · auto-refresh {auto ? "ON" : "OFF"}</div>
      </footer>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#0f0f10] border border-zinc-800 hover:border-zinc-700 transition">
      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-1 truncate">{sub}</div>}
    </div>
  );
}

function Panel({
  icon,
  title,
  rows,
  statusOk,
}: {
  icon: React.ReactNode;
  title: string;
  rows: [string, string][];
  statusOk: boolean;
}) {
  return (
    <div className="p-5 rounded-xl bg-[#0f0f10] border border-zinc-800">
      <h2 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-gray-500">{k}</span>
            <span
              className={`font-mono ${
                v.toLowerCase().includes("live") || v.toLowerCase().includes("ok")
                  ? "text-emerald-400"
                  : "text-gray-300"
              }`}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-1.5 text-[10px] font-mono">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            statusOk ? "bg-emerald-400" : "bg-gray-600"
          }`}
        />
        <span className={statusOk ? "text-emerald-400" : "text-gray-500"}>
          {statusOk ? "CONNECTED" : "PENDING"}
        </span>
      </div>
    </div>
  );
}