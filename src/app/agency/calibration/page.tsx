// src/app/agency/calibration/page.tsx
// ── RIG OS Agency — Department Calibration Command ────────────────────
// Midnight Aubergine surface for /api/departments/calibration — shows
// substrate, telos, memory, quality gates, and proof paths for every
// RIG department. Wires live data, animates gate pass/fail status, and
// lets operators drill into a department's identity + boundaries.
//
// Why this matters: calibration is how we turn a generic LLM into a
// bounded, source-checked, mechanism-driven RIG worker. This page is
// the operator's view of the calibration contract.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Shield, Database, CheckCircle2, AlertCircle, AlertTriangle,
  XCircle, FileSearch, Search, RefreshCw, Hash, Sparkles, BookOpen,
  ListChecks, X, Activity, Zap, Brain, Code2, Palette, Megaphone,
  TrendingUp, Building2, Crosshair, ArrowRight, BarChart3, Cpu,
  CheckCheck, Layers, Clock, FileText,
} from "lucide-react";

// ── Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "var(--bg-deep)", card: "var(--bg-card)", text: "var(--cream)",
  text2: "var(--cream-soft)", text3: "var(--cream-dim)", mute: "var(--cream-mute)",
  border: "var(--line-soft)", borderHot: "var(--line)",
  gold: "var(--gold)", goldSoft: "var(--gold-soft)", goldDeep: "var(--gold-deep)",
  emerald: "var(--emerald)", emeraldDim: "var(--emerald-dim)",
  plum: "var(--plum)", rust: "var(--rust)", line: "var(--line)",
  lineSoft: "var(--line-soft)", lineDeep: "var(--line-deep)",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// ── Department icons & accent colors ─────────────────────────────────
const DEPT_META: Record<string, { icon: any; accent: string; bg: string }> = {
  strategy:   { icon: Target,      accent: "#d4a574", bg: "rgba(212,165,116,0.10)" },
  market:     { icon: Megaphone,   accent: "#c4607e", bg: "rgba(196,96,126,0.10)" },
  app:        { icon: Code2,       accent: "#5ab896", bg: "rgba(90,184,150,0.10)" },
  design:     { icon: Palette,     accent: "#c97c5e", bg: "rgba(201,124,94,0.10)" },
  linkedin:   { icon: Sparkles,    accent: "#e6c69a", bg: "rgba(230,198,154,0.10)" },
  forecast:   { icon: TrendingUp,  accent: "#a87f54", bg: "rgba(168,127,84,0.10)" },
  companyos:  { icon: Building2,   accent: "#3a8a6e", bg: "rgba(58,138,110,0.10)" },
};

// ── Types ─────────────────────────────────────────────────────────────
interface QualityGate {
  name: string;
  description: string;
  weight: number;
  passed: boolean | null;
  check_command?: string;
  last_checked?: string | null;
}

interface DepartmentCalibration {
  department_id: string;
  department_name: string;
  substrate: {
    identity: string;
    role: string;
    boundaries: string[];
    load_order: string[];
    runtime_surfaces?: string[];
  };
  telos: {
    outcome: string;
    success_metrics: string[];
    failure_modes: string[];
  };
  memory: {
    good_examples: any[];
    weak_examples: any[];
    decisions: any[];
    patterns: any[];
    total_count: number;
  };
  quality_gates: QualityGate[];
  calibration_score: number | null;
  calibration_history: any[];
  worker_slots: any[];
  proof_path?: {
    artifact_family?: string;
    required_fields?: string[];
    verifier?: string;
    storage?: string;
  };
}

interface RegistrySummary {
  total: number;
  active: number;
  by_department: Record<string, number>;
  by_kind: Record<string, number>;
  avg_calibration: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────
function gateColor(passed: boolean | null): { label: string; color: string; bg: string; icon: any } {
  if (passed === true)  return { label: "PASS",    color: C.emerald,   bg: "rgba(90,184,150,0.10)",  icon: CheckCircle2 };
  if (passed === false) return { label: "FAIL",    color: C.plum,      bg: "rgba(196,96,126,0.12)",  icon: XCircle };
  return                       { label: "PENDING", color: C.gold,      bg: "rgba(212,165,116,0.10)", icon: AlertTriangle };
}

function scoreColor(score: number | null): string {
  if (score == null) return C.gold;
  if (score >= 0.7)   return C.emerald;
  if (score >= 0.4)   return C.gold;
  return C.plum;
}

function scoreTier(score: number | null): { label: string; color: string } {
  if (score == null)   return { label: "Uncalibrated", color: C.gold };
  if (score >= 0.85)   return { label: "Excellent",    color: C.emerald };
  if (score >= 0.7)    return { label: "Healthy",      color: C.emerald };
  if (score >= 0.5)    return { label: "Degraded",     color: C.gold };
  return                       { label: "Critical",     color: C.plum };
}

// ── Main Component ────────────────────────────────────────────────────
export default function CalibrationCommand() {
  const [calibrations, setCalibrations] = useState<DepartmentCalibration[]>([]);
  const [registry, setRegistry] = useState<RegistrySummary | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [c, r] = await Promise.all([
        fetch("/api/departments/calibration", { cache: "no-store" }).then((x) => x.json()),
        fetch("/api/agents/registry",          { cache: "no-store" }).then((x) => x.json()),
      ]);
      setCalibrations(c.calibrations || []);
      setRegistry(r.summary || null);
      setError(null);
      setLastUpdated(Date.now());
    } catch (e: any) {
      setError(e?.message ?? "fetch failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(() => refresh(true), 60_000);
    const tk = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { clearInterval(id); clearInterval(tk); };
  }, [refresh]);

  // ── Derived metrics ───────────────────────────────────────────────
  const totalGates = useMemo(
    () => calibrations.reduce((s, c) => s + c.quality_gates.length, 0),
    [calibrations],
  );
  const passedGates = useMemo(
    () => calibrations.reduce(
      (s, c) => s + c.quality_gates.filter((g) => g.passed === true).length, 0,
    ),
    [calibrations],
  );
  const failedGates = useMemo(
    () => calibrations.reduce(
      (s, c) => s + c.quality_gates.filter((g) => g.passed === false).length, 0,
    ),
    [calibrations],
  );
  const pendingGates = useMemo(
    () => calibrations.reduce(
      (s, c) => s + c.quality_gates.filter((g) => g.passed === null).length, 0,
    ),
    [calibrations],
  );
  const totalMemory = useMemo(
    () => calibrations.reduce((s, c) => s + (c.memory?.total_count || 0), 0),
    [calibrations],
  );
  const totalWorkers = useMemo(
    () => calibrations.reduce((s, c) => s + c.worker_slots.length, 0),
    [calibrations],
  );
  const calibrated = useMemo(
    () => calibrations.filter((c) => c.calibration_score != null).length,
    [calibrations],
  );

  // Overall pass rate (only counting decided gates)
  const decidedGates = passedGates + failedGates;
  const passRate = decidedGates > 0 ? Math.round((passedGates / decidedGates) * 100) : 0;
  const gateHealthPct = totalGates > 0 ? Math.round(((passedGates + pendingGates * 0.5) / totalGates) * 100) : 0;
  const gateHealthTier = gateHealthPct >= 80 ? { label: "Healthy",  color: C.emerald }
                       : gateHealthPct >= 60 ? { label: "Degraded", color: C.gold }
                       :                       { label: "Critical", color: C.plum };

  // Filter
  const filtered = useMemo(() => {
    if (!search) return calibrations;
    const q = search.toLowerCase();
    return calibrations.filter((c) =>
      c.department_id.toLowerCase().includes(q) ||
      c.department_name.toLowerCase().includes(q) ||
      c.substrate.identity.toLowerCase().includes(q) ||
      c.substrate.role.toLowerCase().includes(q),
    );
  }, [calibrations, search]);

  const selected = calibrations.find((c) => c.department_id === selectedDept) || null;

  // ── KPIs ──────────────────────────────────────────────────────────
  const kpis = [
    { label: "Departments",    value: calibrations.length, icon: Layers,    color: C.gold,    bg: "rgba(212,165,116,0.10)" },
    { label: "Calibrated",     value: `${calibrated}/${calibrations.length}`, icon: CheckCheck, color: C.emerald, bg: "rgba(90,184,150,0.10)" },
    { label: "Quality Gates",  value: totalGates,           icon: Shield,    color: C.goldSoft, bg: "rgba(230,198,154,0.10)" },
    { label: "Pass Rate",      value: `${passRate}%`,       icon: CheckCircle2, color: passRate >= 80 ? C.emerald : passRate >= 50 ? C.gold : C.plum, bg: passRate >= 80 ? "rgba(90,184,150,0.10)" : passRate >= 50 ? "rgba(212,165,116,0.10)" : "rgba(196,96,126,0.10)" },
    { label: "Memory Entries", value: totalMemory,          icon: Database,  color: C.rust,    bg: "rgba(201,124,94,0.10)" },
    { label: "Worker Slots",   value: totalWorkers,         icon: Cpu,       color: C.plum,    bg: "rgba(196,96,126,0.10)" },
    { label: "Gate Health",    value: `${gateHealthPct}%`,  icon: Activity,  color: gateHealthTier.color, bg: "rgba(212,165,116,0.10)" },
    { label: "Registry",       value: registry?.total ?? 0, icon: Hash,      color: C.emeraldDim, bg: "rgba(58,138,110,0.10)" },
  ];

  // ── Render ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-6 py-10" style={{ background: C.bg, minHeight: "100vh" }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3"
          style={{ color: C.text2 }}
        >
          <RefreshCw className="animate-spin" size={18} style={{ color: C.gold }} />
          <span>Loading calibration data from PAI database…</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12" style={{ background: C.bg, minHeight: "100vh" }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.header {...fadeUp} className="px-6 pt-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-2 rounded-lg"
                style={{ background: "rgba(212,165,116,0.10)", border: `1px solid ${C.line}` }}
              >
                <Crosshair size={22} style={{ color: C.gold }} />
              </div>
              <span
                className="text-[10px] uppercase tracking-[0.2em] font-mono"
                style={{ color: C.mute }}
              >
                Department Calibration · PAI Substrate
              </span>
            </div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "Bricolage Grotesque", color: C.text }}
            >
              Calibration Command
            </h1>
            <p className="text-[13px] mt-1" style={{ color: C.text3 }}>
              Substrate · Telos · Memory · Quality Gates · Proof Paths for every RIG department
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="text-[10px] font-mono px-2.5 py-1 rounded"
              style={{ color: C.mute, background: C.card, border: `1px solid ${C.border}` }}
            >
              {lastUpdated
                ? `tick ${Math.floor((Date.now() - lastUpdated) / 1000)}s ago`
                : "—"}
            </div>
            <button
              onClick={() => refresh(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all"
              style={{
                background: refreshing ? C.card : "rgba(212,165,116,0.10)",
                border: `1px solid ${refreshing ? C.border : C.line}`,
                color: C.gold,
              }}
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>
        {error && (
          <div
            className="mt-3 text-[12px] px-3 py-2 rounded"
            style={{ color: C.plum, background: "rgba(196,96,126,0.10)", border: `1px solid ${C.plum}` }}
          >
            <AlertCircle size={12} className="inline mr-1" /> {error}
          </div>
        )}
      </motion.header>

      {/* ── KPI Strip ──────────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.25, delay: 0.05 }} className="px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {kpis.map((k, i) => {
            const Ic = k.icon;
            return (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 + i * 0.03 }}
                className="rounded-lg p-3"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[9px] uppercase tracking-wider font-semibold"
                    style={{ color: C.mute }}
                  >
                    {k.label}
                  </span>
                  <Ic size={12} style={{ color: k.color }} />
                </div>
                <div className="text-[18px] font-bold leading-none" style={{ color: k.color }}>
                  {k.value}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ── Health Ring + Summary Card ─────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.25, delay: 0.1 }} className="px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gate Health Ring */}
          <div
            className="rounded-lg p-4 flex items-center gap-4"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="relative" style={{ width: 110, height: 110 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle
                  cx="55" cy="55" r="48"
                  fill="none"
                  stroke={C.lineSoft}
                  strokeWidth="8"
                />
                <motion.circle
                  cx="55" cy="55" r="48"
                  fill="none"
                  stroke={gateHealthTier.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - gateHealthPct / 100) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <text
                  x="55" y="58"
                  textAnchor="middle"
                  fontSize="22"
                  fontWeight="700"
                  fill={gateHealthTier.color}
                  fontFamily="Bricolage Grotesque"
                >
                  {gateHealthPct}%
                </text>
                <text
                  x="55" y="74"
                  textAnchor="middle"
                  fontSize="8"
                  fill={C.mute}
                  fontFamily="monospace"
                  letterSpacing="0.1em"
                >
                  GATE HEALTH
                </text>
              </svg>
            </div>
            <div className="flex-1">
              <div
                className="text-[10px] uppercase tracking-wider font-mono mb-1"
                style={{ color: C.mute }}
              >
                Quality Gate Health
              </div>
              <div className="text-[18px] font-bold" style={{ color: gateHealthTier.color }}>
                {gateHealthTier.label}
              </div>
              <div className="text-[11px] mt-1.5" style={{ color: C.text3 }}>
                {passedGates} pass · {pendingGates} pending · {failedGates} fail
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: C.mute }}>
                decided: {decidedGates}/{totalGates} gates
              </div>
            </div>
          </div>

          {/* Department Mix */}
          <div
            className="rounded-lg p-4"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div
              className="text-[10px] uppercase tracking-wider font-mono mb-2"
              style={{ color: C.mute }}
            >
              Department Mix
            </div>
            <div className="space-y-1.5">
              {calibrations.slice(0, 5).map((c) => {
                const meta = DEPT_META[c.department_id] || { icon: Layers, accent: C.gold, bg: "rgba(212,165,116,0.10)" };
                return (
                  <div key={c.department_id} className="flex items-center gap-2 text-[11px]">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: meta.accent }}
                    />
                    <span className="flex-1 truncate" style={{ color: C.text2 }}>
                      {c.department_id}
                    </span>
                    <span className="font-mono" style={{ color: C.text3 }}>
                      {c.quality_gates.length}g · {c.worker_slots.length}w
                    </span>
                  </div>
                );
              })}
              {calibrations.length > 5 && (
                <div className="text-[10px] pt-1" style={{ color: C.mute }}>
                  +{calibrations.length - 5} more
                </div>
              )}
            </div>
          </div>

          {/* Memory & Workers */}
          <div
            className="rounded-lg p-4"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div
              className="text-[10px] uppercase tracking-wider font-mono mb-2"
              style={{ color: C.mute }}
            >
              Memory · Workers · Proof
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] flex items-center gap-1.5" style={{ color: C.text2 }}>
                  <Database size={11} style={{ color: C.rust }} /> Memory entries
                </span>
                <span className="text-[14px] font-bold" style={{ color: C.rust }}>{totalMemory}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] flex items-center gap-1.5" style={{ color: C.text2 }}>
                  <Cpu size={11} style={{ color: C.plum }} /> Worker slots
                </span>
                <span className="text-[14px] font-bold" style={{ color: C.plum }}>{totalWorkers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] flex items-center gap-1.5" style={{ color: C.text2 }}>
                  <FileText size={11} style={{ color: C.gold }} /> Proof paths
                </span>
                <span className="text-[14px] font-bold" style={{ color: C.gold }}>
                  {calibrations.filter((c) => c.proof_path).length}/{calibrations.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] flex items-center gap-1.5" style={{ color: C.text2 }}>
                  <Hash size={11} style={{ color: C.emeraldDim }} /> Avg calibration
                </span>
                <span
                  className="text-[14px] font-bold"
                  style={{ color: registry?.avg_calibration != null ? scoreColor(registry.avg_calibration) : C.gold }}
                >
                  {registry?.avg_calibration != null
                    ? `${(registry.avg_calibration * 100).toFixed(1)}%`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Search & Filter Bar ────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.25, delay: 0.15 }} className="px-6">
        <div
          className="rounded-lg p-3 flex items-center gap-3 flex-wrap"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={14} style={{ color: C.mute }} />
            <input
              type="text"
              placeholder="Filter departments (strategy, market, app, design, linkedin, forecast, companyos)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-[12px] flex-1 placeholder:opacity-50"
              style={{ color: C.text }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ color: C.mute }}>
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: C.mute }}>
              {filtered.length}/{calibrations.length} departments
            </span>
          </div>
        </div>
      </motion.section>

      {/* ── Department Grid ────────────────────────────────────────── */}
      <motion.section {...fadeUp} transition={{ duration: 0.25, delay: 0.2 }} className="px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c, i) => {
            const meta = DEPT_META[c.department_id] || { icon: Layers, accent: C.gold, bg: "rgba(212,165,116,0.10)" };
            const Ic = meta.icon;
            const tier = scoreTier(c.calibration_score);
            const isSelected = selectedDept === c.department_id;
            const deptPassed = c.quality_gates.filter((g) => g.passed === true).length;
            const deptFailed = c.quality_gates.filter((g) => g.passed === false).length;
            const deptPending = c.quality_gates.filter((g) => g.passed === null).length;
            return (
              <motion.button
                key={c.department_id}
                onClick={() => setSelectedDept(isSelected ? null : c.department_id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 + i * 0.03 }}
                className="rounded-lg p-4 text-left transition-all"
                style={{
                  background: C.card,
                  border: `1px solid ${isSelected ? C.line : C.border}`,
                  boxShadow: isSelected ? `0 0 0 1px ${C.line}, 0 8px 24px rgba(0,0,0,0.4)` : "none",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-1.5 rounded-md"
                      style={{ background: meta.bg, border: `1px solid ${C.lineSoft}` }}
                    >
                      <Ic size={14} style={{ color: meta.accent }} />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold leading-tight" style={{ color: C.text }}>
                        {c.department_id}
                      </div>
                      <div className="text-[10px]" style={{ color: C.mute }}>
                        {c.department_name}
                      </div>
                    </div>
                  </div>
                  {c.calibration_score != null && (
                    <div
                      className="text-[14px] font-bold"
                      style={{ color: scoreColor(c.calibration_score) }}
                    >
                      {(c.calibration_score * 100).toFixed(0)}%
                    </div>
                  )}
                </div>

                <div className="text-[11px] leading-snug mb-3 line-clamp-2" style={{ color: C.text3 }}>
                  {c.substrate.role}
                </div>

                {/* Gate stats */}
                <div className="flex items-center gap-1.5 mb-2">
                  {c.quality_gates.map((g, j) => {
                    const gc = gateColor(g.passed);
                    const Gi = gc.icon;
                    return (
                      <div
                        key={j}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono"
                        style={{ background: gc.bg, color: gc.color, border: `1px solid ${C.lineSoft}` }}
                        title={`${g.name}: ${gc.label}`}
                      >
                        <Gi size={8} />
                        {g.weight ? `${Math.round(g.weight * 100)}` : ""}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: C.mute }}>
                  <span>
                    {deptPassed}P · {deptPending ? `${deptPending}⏳` : ""}{deptFailed ? ` · ${deptFailed}F` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Database size={9} /> {c.memory.total_count}
                    <Cpu size={9} className="ml-1.5" /> {c.worker_slots.length}
                  </span>
                </div>

                {isSelected && (
                  <div
                    className="mt-3 pt-3 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1"
                    style={{ color: C.gold, borderTop: `1px solid ${C.border}` }}
                  >
                    <ArrowRight size={10} /> viewing details
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* ── Department Detail Modal ────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.section
            key={selected.department_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="px-6"
          >
            <div
              className="rounded-lg p-5"
              style={{ background: C.card, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const meta = DEPT_META[selected.department_id] || { icon: Layers, accent: C.gold, bg: "rgba(212,165,116,0.10)" };
                    const Ic = meta.icon;
                    return (
                      <div
                        className="p-2 rounded-lg"
                        style={{ background: meta.bg, border: `1px solid ${C.line}` }}
                      >
                        <Ic size={20} style={{ color: meta.accent }} />
                      </div>
                    );
                  })()}
                  <div>
                    <h2
                      className="text-[20px] font-bold tracking-tight"
                      style={{ fontFamily: "Bricolage Grotesque", color: C.text }}
                    >
                      {selected.department_name}
                    </h2>
                    <div className="text-[11px] font-mono" style={{ color: C.mute }}>
                      id: {selected.department_id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider font-mono" style={{ color: C.mute }}>
                      Calibration
                    </div>
                    <div
                      className="text-[20px] font-bold leading-none"
                      style={{ color: scoreColor(selected.calibration_score) }}
                    >
                      {selected.calibration_score != null
                        ? `${(selected.calibration_score * 100).toFixed(1)}%`
                        : "—"}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: scoreTier(selected.calibration_score).color }}>
                      {scoreTier(selected.calibration_score).label}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDept(null)}
                    className="p-1.5 rounded transition-all"
                    style={{ color: C.mute, background: C.bg, border: `1px solid ${C.border}` }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Substrate */}
              <div className="mb-4">
                <SectionHeader icon={BookOpen} title="Substrate" color={C.gold} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Field label="Identity" value={selected.substrate.identity} />
                  <Field label="Role" value={selected.substrate.role} />
                  <div>
                    <Label>Boundaries</Label>
                    <ul className="space-y-1.5 mt-1">
                      {selected.substrate.boundaries.map((b, i) => (
                        <li
                          key={i}
                          className="text-[12px] flex items-start gap-1.5"
                          style={{ color: C.text2 }}
                        >
                          <Shield size={10} className="mt-0.5 flex-shrink-0" style={{ color: C.plum }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Label>Load Order</Label>
                    <div className="space-y-1 mt-1">
                      {selected.substrate.load_order.map((l, i) => (
                        <div
                          key={i}
                          className="text-[11px] font-mono px-2 py-1 rounded flex items-center gap-1.5"
                          style={{ background: C.bg, color: C.text2, border: `1px solid ${C.border}` }}
                        >
                          <span
                            className="text-[9px] font-mono w-4"
                            style={{ color: C.gold }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                  {selected.substrate.runtime_surfaces && selected.substrate.runtime_surfaces.length > 0 && (
                    <div className="md:col-span-2">
                      <Label>Runtime Surfaces</Label>
                      <div className="space-y-1 mt-1">
                        {selected.substrate.runtime_surfaces.map((p, i) => (
                          <div
                            key={i}
                            className="text-[11px] font-mono px-2 py-1 rounded truncate"
                            style={{ background: C.bg, color: C.text3, border: `1px solid ${C.border}` }}
                          >
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Telos */}
              <div className="mb-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <SectionHeader icon={Target} title="Telos" color={C.plum} />
                <div className="mt-3 space-y-3">
                  <Field label="Outcome" value={selected.telos.outcome} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Success Metrics</Label>
                      <ul className="space-y-1.5 mt-1">
                        {selected.telos.success_metrics.map((m, i) => (
                          <li
                            key={i}
                            className="text-[12px] flex items-center gap-1.5"
                            style={{ color: C.emerald }}
                          >
                            <CheckCircle2 size={11} />
                            <span className="font-mono">{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <Label>Failure Modes</Label>
                      <ul className="space-y-1.5 mt-1">
                        {selected.telos.failure_modes.map((f, i) => (
                          <li
                            key={i}
                            className="text-[12px] flex items-center gap-1.5"
                            style={{ color: C.plum }}
                          >
                            <XCircle size={11} />
                            <span className="font-mono">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Gates */}
              <div className="mb-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <SectionHeader
                  icon={Shield}
                  title="Quality Gates"
                  color={C.goldSoft}
                  meta={`${selected.quality_gates.length} gates · ${selected.quality_gates.filter((g) => g.passed === true).length} pass`}
                />
                <div className="space-y-2 mt-3">
                  {selected.quality_gates.map((gate, i) => {
                    const gc = gateColor(gate.passed);
                    const Gi = gc.icon;
                    return (
                      <div
                        key={i}
                        className="rounded-lg p-3 flex items-center gap-3"
                        style={{ background: C.bg, border: `1px solid ${C.border}` }}
                      >
                        <div
                          className="p-1.5 rounded-md flex-shrink-0"
                          style={{ background: gc.bg, border: `1px solid ${C.lineSoft}` }}
                        >
                          <Gi size={14} style={{ color: gc.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[12px] font-semibold font-mono"
                              style={{ color: C.text }}
                            >
                              {gate.name}
                            </span>
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
                              style={{ background: gc.bg, color: gc.color }}
                            >
                              {gc.label}
                            </span>
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>
                            {gate.description}
                          </div>
                          {gate.check_command && (
                            <div
                              className="text-[10px] font-mono mt-1 truncate"
                              style={{ color: C.mute }}
                            >
                              $ {gate.check_command}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[10px] font-mono" style={{ color: C.mute }}>
                            weight
                          </div>
                          <div
                            className="text-[14px] font-bold font-mono"
                            style={{ color: C.gold }}
                          >
                            {(gate.weight * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Memory */}
              <div className="mb-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <SectionHeader
                  icon={Database}
                  title="Memory"
                  color={C.rust}
                  meta={`${selected.memory.total_count} total entries`}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <MemoryTile
                    label="Good examples"
                    value={selected.memory.good_examples?.length || 0}
                    color={C.emerald}
                    icon={CheckCircle2}
                  />
                  <MemoryTile
                    label="Weak examples"
                    value={selected.memory.weak_examples?.length || 0}
                    color={C.plum}
                    icon={AlertCircle}
                  />
                  <MemoryTile
                    label="Patterns"
                    value={selected.memory.patterns?.length || 0}
                    color={C.gold}
                    icon={BarChart3}
                  />
                  <MemoryTile
                    label="Decisions"
                    value={selected.memory.decisions?.length || 0}
                    color={C.goldSoft}
                    icon={ListChecks}
                  />
                </div>
              </div>

              {/* Worker Slots */}
              {selected.worker_slots && selected.worker_slots.length > 0 && (
                <div className="mb-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                  <SectionHeader
                    icon={Cpu}
                    title="Worker Slots"
                    color={C.emerald}
                    meta={`${selected.worker_slots.length} workers`}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                    {selected.worker_slots.map((slot: any, i: number) => (
                      <div
                        key={i}
                        className="rounded p-2.5"
                        style={{ background: C.bg, border: `1px solid ${C.border}` }}
                      >
                        <div className="text-[12px] font-semibold" style={{ color: C.text }}>
                          {slot.name || `Worker ${i + 1}`}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: C.text3 }}>
                          {slot.role || "—"}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: slot.status === "active" ? C.emerald
                                : slot.status === "idle" ? C.gold
                                : C.mute,
                            }}
                          />
                          <span className="text-[10px] font-mono" style={{ color: C.mute }}>
                            {slot.status || "unknown"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proof Path */}
              {selected.proof_path && (
                <div className="pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                  <SectionHeader icon={FileText} title="Proof Path" color={C.emeraldDim} />
                  <div className="mt-3 space-y-2">
                    {selected.proof_path.artifact_family && (
                      <Field label="Artifact Family" value={selected.proof_path.artifact_family} mono />
                    )}
                    {selected.proof_path.verifier && (
                      <Field label="Verifier" value={selected.proof_path.verifier} mono />
                    )}
                    {selected.proof_path.storage && (
                      <Field label="Storage" value={selected.proof_path.storage} mono />
                    )}
                    {selected.proof_path.required_fields && selected.proof_path.required_fields.length > 0 && (
                      <div>
                        <Label>Required Fields</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selected.proof_path.required_fields.map((f, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                              style={{ background: C.bg, color: C.gold, border: `1px solid ${C.border}` }}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        className="px-6 pt-4 text-[10px] flex items-center justify-between flex-wrap gap-2"
        style={{ color: C.mute, borderTop: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2">
          <code style={{ color: C.text3 }}>GET /api/departments/calibration</code>
          <span>·</span>
          <code style={{ color: C.text3 }}>GET /api/agents/registry</code>
        </div>
        <div className="flex items-center gap-3">
          <span>{tick > 0 ? `${tick}s` : "—"}</span>
          <span style={{ color: C.gold }}>ProofPacket or it didn&apos;t happen</span>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon, title, color, meta,
}: { icon: any; title: string; color: string; meta?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span
          className="text-[11px] uppercase tracking-wider font-semibold"
          style={{ color }}
        >
          {title}
        </span>
      </div>
      {meta && (
        <span className="text-[10px] font-mono" style={{ color: "var(--cream-mute)" }}>
          {meta}
        </span>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] uppercase tracking-wider font-mono font-semibold"
      style={{ color: "var(--cream-mute)" }}
    >
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <div
        className="text-[12px] mt-1 leading-snug"
        style={{
          color: "var(--cream)",
          fontFamily: mono ? "JetBrains Mono, monospace" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MemoryTile({
  label, value, color, icon: Icon,
}: { label: string; value: number; color: string; icon: any }) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{ background: "var(--bg-deep)", border: `1px solid var(--line-soft)` }}
    >
      <Icon size={14} className="mx-auto mb-1" style={{ color }} />
      <div className="text-[20px] font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: "var(--cream-mute)" }}>
        {label}
      </div>
    </div>
  );
}
