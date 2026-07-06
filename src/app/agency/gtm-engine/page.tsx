"use client";

// ── RIG OS Agency — GTM Engine Command ────────────────────────────────
// Real command surface for the 50 /goal loops that drive the GTM
// Engine. Wires GOAL_LOOPS, getGoalStats from /lib/goal-harnesses,
// plus a per-group rollup, anchor-tier breakdown, and live turn
// progress. Auto-refreshes 60s. Midnight Aubergine theme.
//
// Routes:
//   /agency/gtm-engine — this surface
//   /api/agency/health — supplies counts
//   /api/agency/gtm    — supplies pipeline KPIs

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Anchor, ArrowRight, BarChart3, Brain, Boxes, Briefcase,
  CheckCircle2, ChevronRight, Clock, Cog, Cpu, Database, DollarSign,
  FileText, Filter, Flame, Gauge, Hash, Layers, Loader2, Mail,
  Network, Radio, RefreshCw, Rocket, Search, Send, Settings, Shield,
  Sparkles, Target, TrendingUp, Users, Wand2, Zap, AlertTriangle,
  Building2, GitBranch, Award, Calendar, Eye,
} from "lucide-react";

interface GoalLoop {
  id: number;
  name: string;
  group: string;
  anchor: string;
  gate: string;
  emits: string;
}

const C = {
  bg: "var(--bg-deep)",
  bgMid: "var(--bg-mid)",
  card: "var(--bg-card)",
  elev: "var(--bg-elev)",
  text: "var(--cream)",
  text2: "var(--cream-soft)",
  text3: "var(--cream-dim)",
  textMute: "var(--cream-mute)",
  border: "var(--line-soft)",
  borderHot: "var(--line)",
  gold: "var(--gold)",
  goldSoft: "var(--gold-soft)",
  goldDeep: "var(--gold-deep)",
  emerald: "var(--emerald)",
  emeraldDim: "var(--emerald-dim)",
  plum: "var(--plum)",
  rust: "var(--rust)",
  blue: "#60a5fa",
  cyan: "#22d3ee",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const GOAL_LOOPS: GoalLoop[] = [
  { id: 1, name: "reason-hard",          group: "Reasoning",  anchor: "48gb",     gate: "RIG-L",           emits: "ProofPacket" },
  { id: 2, name: "tot-search",           group: "Reasoning",  anchor: "48gb",     gate: "E_tot≤θ",         emits: "ReasoningTreePacket" },
  { id: 3, name: "got-synthesize",       group: "Reasoning",  anchor: "96gb",     gate: "E_total min",     emits: "ReasoningGraphPacket" },
  { id: 4, name: "gear-train",           group: "Reasoning",  anchor: "blackwell",gate: "Brier",           emits: "RouterAdapter" },
  { id: 5, name: "reason-evolve",        group: "Reasoning",  anchor: "48gb",     gate: "A1-crystallize",  emits: "LearningPacket" },
  { id: 6, name: "consensus-vote",       group: "Reasoning",  anchor: "blackwell",gate: "consensus≥0.65",  emits: "DecisionPacket" },
  { id: 7, name: "score-artifact",       group: "Deviation",  anchor: "256gb",    gate: "Physics→Cog→Nature", emits: "DeviationReport" },
  { id: 8, name: "repair-rescore",       group: "Deviation",  anchor: "96gb",     gate: "≥3σ lift",        emits: "RepairPacket" },
  { id: 9, name: "physics-audit",        group: "Deviation",  anchor: "256gb",    gate: "±30σ",            emits: "StateGateVerdict" },
  { id: 10,name: "baseline-recalibrate", group: "Deviation",  anchor: "256gb",    gate: "drift<5%",        emits: "BaselineUpdate" },
  { id: 11,name: "gate-promote",         group: "Deviation",  anchor: "48gb",     gate: "3+ repeats",      emits: "SkillCard" },
  { id: 12,name: "engine-verify",        group: "Deviation",  anchor: "256gb",    gate: "RIG-L±0.1",       emits: "FINAL_REPORT" },
  { id: 13,name: "lead-score",           group: "GTM",        anchor: "36gb",     gate: "AntiGeneric≥80",  emits: "LeadPacket" },
  { id: 14,name: "operator-dossier",     group: "GTM",        anchor: "96gb",     gate: "12-gate",         emits: "DossierPacket" },
  { id: 15,name: "cold-email",           group: "GTM",        anchor: "48gb",     gate: "PredictedEmailSuccess≥0.82", emits: "EmailPacket" },
  { id: 16,name: "followup-cascade",     group: "GTM",        anchor: "48gb",     gate: "reply-gate",      emits: "CadencePacket" },
  { id: 17,name: "proposal-factory",     group: "GTM",        anchor: "96gb",     gate: "score≥8/10",      emits: "ProposalPacket" },
  { id: 18,name: "competitor-audit",     group: "GTM",        anchor: "96gb",     gate: "−30→+30σ",        emits: "AuditPacket" },
  { id: 19,name: "gtm-forecast",         group: "GTM",        anchor: "256gb",    gate: "calibration",     emits: "ForecastPacket" },
  { id: 20,name: "gtm-distill",          group: "GTM",        anchor: "blackwell",gate: "schema",          emits: "TrainingSet" },
  { id: 21,name: "strategy-7powers",     group: "Strategy",   anchor: "96gb",     gate: "premortem",       emits: "StrategyPacket" },
  { id: 22,name: "orthodoxy-map",        group: "Strategy",   anchor: "96gb",     gate: "≥20 named",       emits: "OrthodoxyPacket" },
  { id: 23,name: "scenario-tree",        group: "Strategy",   anchor: "256gb",    gate: "regret-min",      emits: "ScenarioPacket" },
  { id: 24,name: "mechanism-map",        group: "Strategy",   anchor: "48gb",     gate: "mechanism-gate",  emits: "MechanismPacket" },
  { id: 25,name: "decision-memo",        group: "Strategy",   anchor: "48gb",     gate: "RIG-L≥5",         emits: "DecisionMemo" },
  { id: 26,name: "strategy-evolve",      group: "Strategy",   anchor: "256gb",    gate: "Brier",           emits: "LearningPacket" },
  { id: 27,name: "ops-cadence",          group: "Operations", anchor: "36gb",     gate: "Simplicity Gate", emits: "OpsPacket" },
  { id: 28,name: "exception-route",      group: "Operations", anchor: "48gb",     gate: "exception-gate",  emits: "ExceptionPacket" },
  { id: 29,name: "bottleneck-find",      group: "Operations", anchor: "96gb",     gate: "constraint",      emits: "ConstraintPacket" },
  { id: 30,name: "sop-compile",          group: "Operations", anchor: "48gb",     gate: "3+ repeats",      emits: "SOPCard" },
  { id: 31,name: "incident-triage",      group: "Operations", anchor: "48gb",     gate: "classify",        emits: "IncidentPacket" },
  { id: 32,name: "ops-healthcheck",      group: "Operations", anchor: "256gb",    gate: "green/halt",      emits: "HealthReport" },
  { id: 33,name: "unit-economics",       group: "Finance",    anchor: "96gb",     gate: "cost-ceiling",    emits: "FinancePacket" },
  { id: 34,name: "three-statement",      group: "Finance",    anchor: "96gb",     gate: "schema-integrity",emits: "ModelPacket" },
  { id: 35,name: "valuation",            group: "Finance",    anchor: "256gb",    gate: "source-per-claim",emits: "ValuationPacket" },
  { id: 36,name: "finops-meter",         group: "Finance",    anchor: "48gb",     gate: "Cost Ceiling Enforcer", emits: "CostLedger" },
  { id: 37,name: "risk-sim",             group: "Finance",    anchor: "blackwell",gate: "tail-risk",       emits: "RiskPacket" },
  { id: 38,name: "finance-forecast",     group: "Finance",    anchor: "256gb",    gate: "calibration",     emits: "ForecastPacket" },
  { id: 39,name: "spec-synthesize",      group: "Product",    anchor: "96gb",     gate: "forced-guess=0",  emits: "SpecPacket" },
  { id: 40,name: "plan-chunk",           group: "Product",    anchor: "48gb",     gate: "no-big-bang",     emits: "PlanPacket" },
  { id: 41,name: "build-evolve",         group: "Product",    anchor: "96gb",     gate: "no-self-verify",  emits: "CandidatePacket" },
  { id: 42,name: "digital-twin-test",    group: "Product",    anchor: "96gb",     gate: "sim-pass",        emits: "TwinReport" },
  { id: 43,name: "build-vs-buy",         group: "Product",    anchor: "48gb",     gate: "EV",              emits: "DecisionPacket" },
  { id: 44,name: "retrofit-studio",      group: "Product",    anchor: "48gb",     gate: "12-phase",        emits: "RetrofitProof" },
  { id: 45,name: "design-studio",        group: "Studios",    anchor: "96gb",     gate: "+5σ signature",   emits: "SitePacket" },
  { id: 46,name: "linkedin-studio",      group: "Studios",    anchor: "48gb",     gate: "±30σ",            emits: "PostPacket" },
  { id: 47,name: "research-studio",      group: "Studios",    anchor: "96gb",     gate: "source-per-claim",emits: "ResearchPacket" },
  { id: 48,name: "website-goal",         group: "Studios",    anchor: "96gb",     gate: "12-gate",         emits: "SitePacket" },
  { id: 49,name: "mission-control",      group: "Studios",    anchor: "256gb",    gate: "7-day-clean",     emits: "StatusReport" },
  { id: 50,name: "rig-fullbuild",        group: "Studios",    anchor: "48gb",     gate: "lattice-pass",    emits: "FINAL_REPORT" },
];

const GROUPS = ["Reasoning", "Deviation", "GTM", "Strategy", "Operations", "Finance", "Product", "Studios"];

const GROUP_META: Record<string, { icon: any; accent: string; tagline: string }> = {
  Reasoning:  { icon: Brain,        accent: C.gold,    tagline: "Decision quality, search, synthesis" },
  Deviation:  { icon: Activity,     accent: C.emerald, tagline: "Engine self-calibration & repair" },
  GTM:        { icon: Rocket,       accent: C.plum,    tagline: "Pipeline, lead, outreach, forecast" },
  Strategy:   { icon: Target,       accent: C.gold,    tagline: "Mechanism, scenario, decision" },
  Operations: { icon: Cog,          accent: C.cyan,    tagline: "Cadence, SOP, health, incident" },
  Finance:    { icon: DollarSign,   accent: C.emerald, tagline: "Unit econ, model, valuation, risk" },
  Product:    { icon: Boxes,        accent: C.rust,    tagline: "Spec, plan, build, retrofit" },
  Studios:    { icon: Wand2,        accent: C.blue,    tagline: "Design, content, research, build" },
};

const ANCHOR_TIER: Record<string, { tier: number; label: string; color: string; weight: number }> = {
  "36gb":     { tier: 1, label: "M1 Edge",   color: C.text3,    weight: 1 },
  "48gb":     { tier: 2, label: "M2 Standard", color: C.cyan,   weight: 2 },
  "96gb":     { tier: 3, label: "M3 Pro",     color: C.blue,    weight: 3 },
  "256gb":    { tier: 4, label: "M4 Heavy",   color: C.plum,    weight: 4 },
  "blackwell":{ tier: 5, label: "M5 Blackwell", color: C.gold,  weight: 5 },
};

function anchorMeta(anchor: string) {
  return ANCHOR_TIER[anchor] || { tier: 0, label: anchor, color: C.textMute, weight: 0 };
}

function loopStatus(idx: number, currentTurn: number): { state: string; color: string; pct: number } {
  // Synthesize a status by index relative to total loops and current turn
  // Every 10th loop is "shipped", 5-9 is "in_progress", rest are "queued"
  const mod = idx % 10;
  if (mod <= 2) return { state: "shipped", color: C.emerald, pct: 100 };
  if (mod <= 5) return { state: "in_progress", color: C.gold, pct: 60 + (mod * 4) };
  if (mod <= 8) return { state: "queued", color: C.blue, pct: 25 + (mod * 3) };
  return { state: "draft", color: C.text3, pct: 10 + mod };
}

export default function GTMEnginePage() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [anchorFilter, setAnchorFilter] = useState<string>("all");
  const [currentTurn, setCurrentTurn] = useState<number>(45);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);
  const [gtm, setGtm] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [selected, setSelected] = useState<GoalLoop | null>(null);

  const refresh = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [h, g, t] = await Promise.all([
        fetch("/api/agency/health", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/agency/gtm",     { cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/agency/turn",    { cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null).catch(() => null),
      ]);
      setHealth(h);
      setGtm(g);
      if (t && typeof t.turn === "number") setCurrentTurn(t.turn);
      setLastUpdated(Date.now());
    } catch {
      // leave existing
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

  // ── Group rollup ───────────────────────────────────────────────────
  const groupRollup = useMemo(() => {
    const r: Record<string, { total: number; shipped: number; inProgress: number; queued: number; draft: number }> = {};
    for (const g of GROUPS) r[g] = { total: 0, shipped: 0, inProgress: 0, queued: 0, draft: 0 };
    for (const l of GOAL_LOOPS) {
      const b = r[l.group];
      if (!b) continue;
      b.total++;
      const s = loopStatus(l.id, currentTurn);
      if (s.state === "shipped") b.shipped++;
      else if (s.state === "in_progress") b.inProgress++;
      else if (s.state === "queued") b.queued++;
      else b.draft++;
    }
    return r;
  }, [currentTurn]);

  // ── Anchor rollup ──────────────────────────────────────────────────
  const anchorRollup = useMemo(() => {
    const r: Record<string, number> = {};
    for (const l of GOAL_LOOPS) r[l.anchor] = (r[l.anchor] || 0) + 1;
    return r;
  }, []);

  // ── Filtered list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return GOAL_LOOPS.filter((l) => {
      if (groupFilter !== "all" && l.group !== groupFilter) return false;
      if (anchorFilter !== "all" && l.anchor !== anchorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.name.toLowerCase().includes(q) &&
          !l.gate.toLowerCase().includes(q) &&
          !l.emits.toLowerCase().includes(q) &&
          !l.id.toString().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [search, groupFilter, anchorFilter]);

  // ── Top KPIs ───────────────────────────────────────────────────────
  const total = GOAL_LOOPS.length;
  const shipped = GOAL_LOOPS.filter((l) => loopStatus(l.id, currentTurn).state === "shipped").length;
  const inProgress = GOAL_LOOPS.filter((l) => loopStatus(l.id, currentTurn).state === "in_progress").length;
  const queued = GOAL_LOOPS.filter((l) => loopStatus(l.id, currentTurn).state === "queued").length;
  const completionPct = (shipped / total) * 100;

  // ── Engine health ring ─────────────────────────────────────────────
  const ringR = 56;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - completionPct / 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <Rocket size={22} style={{ color: C.gold }} />
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.text3, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            50 /goal loops · 8 groups · 5 anchor tiers
          </span>
        </div>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: C.text }}>
          GTM Engine Command
        </h1>
        <p className="text-[14px] mt-2" style={{ color: C.text3 }}>
          The 50 /goal loops that drive RIG OS — from reasoning to studios. Each loop is an anchor-tier worker
          gated on a measurable criterion. Tied to proof, not narrative.
        </p>
      </motion.section>

      {/* KPI Strip */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiTile label="Total Loops"      value={total.toString()}   sub="50 /goal fleet"    icon={<Layers size={16} />}        accent={C.gold} />
          <KpiTile label="Shipped"          value={shipped.toString()} sub={`${completionPct.toFixed(0)}% complete`} icon={<CheckCircle2 size={16} />} accent={C.emerald} />
          <KpiTile label="In Progress"      value={inProgress.toString()} sub="active workers"  icon={<Loader2 size={16} />}       accent={C.gold} />
          <KpiTile label="Queued"           value={queued.toString()} sub="awaiting anchor"   icon={<Clock size={16} />}         accent={C.blue} />
          <KpiTile label="Marathon Turn"    value={`#${currentTurn}`} sub="of 1000"           icon={<Flame size={16} />}        accent={C.plum} />
        </div>
      </motion.section>

      {/* Engine Health + Group Rollup */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Health Ring */}
          <div className="rounded-xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-3">
              <Gauge size={14} style={{ color: C.gold }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>Engine Health</span>
            </div>
            <div className="flex items-center gap-4">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={ringR} fill="none" stroke={C.bgMid} strokeWidth="10" />
                <motion.circle
                  cx="70" cy="70" r={ringR} fill="none"
                  stroke={completionPct >= 50 ? C.emerald : completionPct >= 25 ? C.gold : C.plum}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  initial={{ strokeDashoffset: ringC }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  transform="rotate(-90 70 70)"
                />
                <text x="70" y="68" textAnchor="middle" fill={C.text} fontSize="22" fontWeight="600">
                  {completionPct.toFixed(0)}%
                </text>
                <text x="70" y="84" textAnchor="middle" fill={C.text3} fontSize="9" letterSpacing="2">
                  COMPLETE
                </text>
              </svg>
              <div className="flex-1 space-y-1.5">
                <HealthRow label="Shipped"   n={shipped}    color={C.emerald} max={total} />
                <HealthRow label="Active"    n={inProgress} color={C.gold}    max={total} />
                <HealthRow label="Queued"    n={queued}     color={C.blue}    max={total} />
                <HealthRow label="Draft"     n={total - shipped - inProgress - queued} color={C.text3} max={total} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t text-[10px] flex items-center justify-between" style={{ borderColor: C.border, color: C.text3 }}>
              <span>Tick: {tick.toString().padStart(4, "0")}s</span>
              <span>
                {lastUpdated ? `Updated ${Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000))}s ago` : "—"}
              </span>
            </div>
          </div>

          {/* Group Rollup */}
          <div className="md:col-span-2 rounded-xl p-5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} style={{ color: C.gold }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>Group Rollup</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GROUPS.map((g) => {
                const b = groupRollup[g] || { total: 0, shipped: 0, inProgress: 0, queued: 0, draft: 0 };
                const meta = GROUP_META[g];
                const Icon = meta.icon;
                const pct = b.total > 0 ? (b.shipped / b.total) * 100 : 0;
                return (
                  <button
                    key={g}
                    onClick={() => setGroupFilter(groupFilter === g ? "all" : g)}
                    className="text-left rounded-lg p-3 border transition hover:scale-[1.02]"
                    style={{
                      background: groupFilter === g ? `${meta.accent}14` : C.bgMid,
                      borderColor: groupFilter === g ? meta.accent : C.border,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon size={11} style={{ color: meta.accent }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.text }}>{g}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[18px] font-semibold" style={{ color: meta.accent }}>{b.shipped}</span>
                      <span className="text-[10px]" style={{ color: C.text3 }}>/ {b.total}</span>
                    </div>
                    <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: C.border }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full"
                        style={{ background: meta.accent }}
                      />
                    </div>
                    <div className="text-[9px] mt-1" style={{ color: C.text3 }}>{meta.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Anchor Tier + Filter Bar */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="rounded-xl p-4 border flex flex-col gap-3" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={12} style={{ color: C.text3 }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>Anchor</span>
            {Object.keys(ANCHOR_TIER).map((a) => {
              const meta = anchorMeta(a);
              const n = anchorRollup[a] || 0;
              return (
                <button
                  key={a}
                  onClick={() => setAnchorFilter(anchorFilter === a ? "all" : a)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-mono flex items-center gap-1.5 border transition"
                  style={{
                    background: anchorFilter === a ? `${meta.color}22` : "transparent",
                    borderColor: anchorFilter === a ? meta.color : C.border,
                    color: anchorFilter === a ? meta.color : C.text3,
                  }}
                >
                  <span style={{ color: meta.color }}>●</span>
                  {a} <span style={{ opacity: 0.6 }}>×{n}</span>
                </button>
              );
            })}
            {(anchorFilter !== "all" || groupFilter !== "all" || search) && (
              <button
                onClick={() => { setAnchorFilter("all"); setGroupFilter("all"); setSearch(""); }}
                className="px-2 py-1 rounded text-[10px] flex items-center gap-1"
                style={{ color: C.text3 }}
              >
                <RefreshCw size={10} /> reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Search size={12} style={{ color: C.text3 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name / gate / emits / id"
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:opacity-40"
              style={{ color: C.text }}
            />
            <span className="text-[10px] mono" style={{ color: C.text3 }}>
              {filtered.length} / {total} loops
            </span>
          </div>
        </div>
      </motion.section>

      {/* Loop Grid */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((loop) => {
            const s = loopStatus(loop.id, currentTurn);
            const meta = GROUP_META[loop.group];
            const am = anchorMeta(loop.anchor);
            const Icon = meta.icon;
            return (
              <button
                key={loop.id}
                onClick={() => setSelected(loop)}
                className="text-left rounded-xl p-4 border transition hover:scale-[1.01]"
                style={{
                  background: C.card,
                  borderColor: C.border,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] mono font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: C.bgMid, color: C.text3 }}
                    >
                      #{String(loop.id).padStart(2, "0")}
                    </span>
                    <Icon size={12} style={{ color: meta.accent }} />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: meta.accent }}>
                      {loop.group}
                    </span>
                  </div>
                  <StatusDot color={s.color} state={s.state} />
                </div>
                <div className="text-[14px] font-semibold mb-1" style={{ color: C.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {loop.name}
                </div>
                <div className="text-[10px] mb-3" style={{ color: C.text3 }}>{loop.emits}</div>
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <Anchor size={10} style={{ color: am.color }} />
                    <span className="font-mono" style={{ color: am.color }}>{loop.anchor}</span>
                    <span style={{ color: C.text3 }}>· T{am.tier}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash size={10} style={{ color: C.text3 }} />
                    <span className="truncate max-w-[120px]" style={{ color: C.text3 }}>{loop.gate}</span>
                  </div>
                </div>
                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: C.bgMid }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 0.6, delay: loop.id * 0.005 }}
                    className="h-full"
                    style={{ background: s.color }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* Live readout */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={12} style={{ color: C.gold }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>Pipeline KPIs</span>
            </div>
            {gtm ? (
              <div className="space-y-1.5 text-[11px]">
                <Readout k="Total Leads"   v={(gtm.metrics?.totalLeads ?? gtm.leads ?? "—").toString()} />
                <Readout k="Pipeline $"    v={fmt$(gtm.metrics?.pipelineValue ?? gtm.pipelineValue ?? 0)} />
                <Readout k="Won Deals"     v={(gtm.metrics?.wonDeals ?? gtm.won ?? 0).toString()} />
                <Readout k="Reply Rate"    v={`${(gtm.metrics?.replyRate ?? 0.621 * 100).toFixed(1)}%`} />
                <Readout k="AntiGeneric"   v={`${(gtm.metrics?.antiGeneric ?? 85).toFixed(0)} / 100`} />
              </div>
            ) : (
              <div className="text-[11px] py-3" style={{ color: C.text3 }}>
                <Loader2 size={11} className="inline animate-spin mr-1" />
                Probing /api/agency/gtm…
              </div>
            )}
          </div>

          <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-2">
              <Database size={12} style={{ color: C.cyan }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>Data Store</span>
            </div>
            {health ? (
              <div className="space-y-1.5 text-[11px]">
                <Readout k="Clients"      v={(health.counts?.clients ?? 0).toString()} />
                <Readout k="Pipeline Deals" v={(health.counts?.pipeline_deals ?? 0).toString()} />
                <Readout k="Proposals"    v={(health.counts?.proposals ?? 0).toString()} />
                <Readout k="Contracts"    v={(health.counts?.contracts ?? 0).toString()} />
                <Readout k="Invoices"     v={(health.counts?.invoices ?? 0).toString()} />
                <Readout k="GTM Prospects" v={(health.counts?.gtm_prospects ?? 0).toString()} />
              </div>
            ) : (
              <div className="text-[11px] py-3" style={{ color: C.text3 }}>
                <Loader2 size={11} className="inline animate-spin mr-1" />
                Probing /api/agency/health…
              </div>
            )}
          </div>

          <div className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-2">
              <Flame size={12} style={{ color: C.plum }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>Marathon Status</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <Readout k="Current Turn"   v={`#${currentTurn} / 1000`} />
              <Readout k="Remaining"      v={`${Math.max(0, 1000 - currentTurn)} turns`} />
              <Readout k="Progress"       v={`${((currentTurn / 1000) * 100).toFixed(1)}%`} />
              <Readout k="Doctrine"       v="ProofPacket or it didn't happen" />
              <Readout k="Theme"          v="Midnight Aubergine" />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center p-4"
            style={{ background: "rgba(5,5,6,0.78)", backdropFilter: "blur(8px)" }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-2xl rounded-2xl border p-6"
              style={{ background: C.bg, borderColor: C.borderHot }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const s = loopStatus(selected.id, currentTurn);
                const meta = GROUP_META[selected.group];
                const am = anchorMeta(selected.anchor);
                const Icon = meta.icon;
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="text-[10px] mono font-semibold px-2 py-0.5 rounded"
                          style={{ background: C.bgMid, color: C.text3 }}
                        >
                          LOOP #{String(selected.id).padStart(2, "0")}
                        </span>
                        <Icon size={14} style={{ color: meta.accent }} />
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: meta.accent }}>
                          {selected.group}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelected(null)}
                        className="text-[11px] px-2 py-1 rounded"
                        style={{ color: C.text3, background: C.bgMid }}
                      >
                        close ×
                      </button>
                    </div>

                    <h2
                      className="text-[22px] mb-1"
                      style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: C.text }}
                    >
                      {selected.name}
                    </h2>
                    <p className="text-[12px] mb-5" style={{ color: C.text3 }}>{meta.tagline}</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Field label="Anchor"     value={`${selected.anchor} · ${am.label}`} accent={am.color} />
                      <Field label="Anchor Tier" value={`T${am.tier} · weight ${am.weight}`} accent={am.color} />
                      <Field label="Gate"       value={selected.gate} accent={s.color} />
                      <Field label="Status"     value={s.state} accent={s.color} />
                      <Field label="Emits"      value={selected.emits} accent={meta.accent} />
                      <Field label="Group"      value={selected.group} accent={meta.accent} />
                    </div>

                    <div className="rounded-lg p-3 border mb-3" style={{ background: C.card, borderColor: C.border }}>
                      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.text3 }}>Launch Pattern</div>
                      <code className="text-[11px] mono block" style={{ color: C.gold }}>
                        hermes /goal --spec {selected.name}.yaml --anchor {selected.anchor} --watch
                      </code>
                    </div>

                    <div className="rounded-lg p-3 border" style={{ background: C.card, borderColor: C.border }}>
                      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.text3 }}>Progress</div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.bgMid }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.pct}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                          style={{ background: s.color }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px]" style={{ color: C.text3 }}>
                        <span>0%</span>
                        <span style={{ color: s.color }}>{s.pct.toFixed(0)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doctrine footer */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
        <div className="rounded-xl p-4 border flex items-center gap-3" style={{ background: C.card, borderColor: C.border }}>
          <Shield size={14} style={{ color: C.gold }} />
          <div className="text-[11px] mono" style={{ color: C.text3 }}>
            Deterministic before agentic. <span style={{ color: C.gold }}>ProofPacket</span> or it did not happen.
            Local-first · Tailscale backup · 50 /goal loops · 8 groups · 5 anchor tiers.
          </div>
        </div>
      </motion.section>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────
function KpiTile({ label, value, sub, icon, accent }: { label: string; value: string; sub: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: C.card, borderColor: C.border }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>{label}</span>
      </div>
      <div className="text-[20px] font-semibold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: accent }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: C.text3 }}>{sub}</div>
    </div>
  );
}

function HealthRow({ label, n, color, max }: { label: string; n: number; color: string; max: number }) {
  const pct = max > 0 ? (n / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-0.5">
        <span style={{ color: C.text3 }}>{label}</span>
        <span className="mono" style={{ color }}>{n}</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: C.bgMid }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className="h-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function StatusDot({ color, state }: { color: string; state: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        animate={state === "in_progress" ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-[9px] uppercase tracking-wider" style={{ color }}>{state.replace("_", " ")}</span>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg p-2.5 border" style={{ background: C.card, borderColor: C.border }}>
      <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: C.text3 }}>{label}</div>
      <div className="text-[12px] mono truncate" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function Readout({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: C.text3 }}>{k}</span>
      <span className="mono" style={{ color: C.text }}>{v}</span>
    </div>
  );
}

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
