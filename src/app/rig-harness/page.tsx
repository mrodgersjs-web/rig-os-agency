"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Command, Target, Brain, TrendingUp, Rocket, Activity,
  DollarSign, Wrench, Palette, Boxes, Gauge, Zap, Play,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// ── 50 Goal Loop Taxonomy ──────────────────────────────────────────
interface GoalLoop {
  num: number;
  id: string;
  name: string;
  group: string;
  anchor: string;
  gate: string;
  emits: string;
  icon: string;
}

const LOOPS: GoalLoop[] = [
  // Reasoning (1-6)
  { num: 1, id: "reason-hard", name: "Reason Hard", group: "Reasoning", anchor: "48gb", gate: "RIG-L", emits: "ProofPacket", icon: "brain" },
  { num: 2, id: "tot-search", name: "ToT Search", group: "Reasoning", anchor: "48gb", gate: "E_tot≤θ", emits: "ReasoningTreePacket", icon: "brain" },
  { num: 3, id: "got-synthesize", name: "GoT Synthesize", group: "Reasoning", anchor: "96gb", gate: "E_total min", emits: "ReasoningGraphPacket", icon: "brain" },
  { num: 4, id: "gear-train", name: "Gear Train", group: "Reasoning", anchor: "blackwell", gate: "Brier", emits: "RouterAdapter", icon: "brain" },
  { num: 5, id: "reason-evolve", name: "Reason Evolve", group: "Reasoning", anchor: "48gb", gate: "A1-crystallize", emits: "LearningPacket", icon: "brain" },
  { num: 6, id: "consensus-vote", name: "Consensus Vote", group: "Reasoning", anchor: "blackwell", gate: "consensus≥0.65", emits: "DecisionPacket", icon: "brain" },
  // Deviation (7-12)
  { num: 7, id: "score-artifact", name: "Score Artifact", group: "Deviation", anchor: "256gb", gate: "Physics→Cog→Nature", emits: "DeviationReport", icon: "gauge" },
  { num: 8, id: "repair-rescore", name: "Repair & Rescore", group: "Deviation", anchor: "96gb", gate: "≥3σ lift", emits: "RepairPacket", icon: "gauge" },
  { num: 9, id: "physics-audit", name: "Physics Audit", group: "Deviation", anchor: "256gb", gate: "±30σ", emits: "StateGateVerdict", icon: "gauge" },
  { num: 10, id: "baseline-recalibrate", name: "Baseline Recalibrate", group: "Deviation", anchor: "256gb", gate: "drift<5%", emits: "BaselineUpdate", icon: "gauge" },
  { num: 11, id: "gate-promote", name: "Gate Promote", group: "Deviation", anchor: "48gb", gate: "3+ repeats", emits: "SkillCard", icon: "gauge" },
  { num: 12, id: "engine-verify", name: "Engine Verify", group: "Deviation", anchor: "256gb", gate: "RIG-L±0.1", emits: "FINAL_REPORT", icon: "gauge" },
  // GTM (13-20)
  { num: 13, id: "lead-score", name: "Lead Score", group: "GTM", anchor: "36gb", gate: "AntiGeneric≥80", emits: "LeadPacket", icon: "rocket" },
  { num: 14, id: "operator-dossier", name: "Operator Dossier", group: "GTM", anchor: "96gb", gate: "12-gate", emits: "DossierPacket", icon: "rocket" },
  { num: 15, id: "cold-email", name: "Cold Email", group: "GTM", anchor: "48gb", gate: "PredictedEmailSuccess≥0.82", emits: "EmailPacket", icon: "rocket" },
  { num: 16, id: "followup-cascade", name: "Follow-Up Cascade", group: "GTM", anchor: "48gb", gate: "reply-gate", emits: "CadencePacket", icon: "rocket" },
  { num: 17, id: "proposal-factory", name: "Proposal Factory", group: "GTM", anchor: "96gb", gate: "score≥8/10", emits: "ProposalPacket", icon: "rocket" },
  { num: 18, id: "competitor-audit", name: "Competitor Audit", group: "GTM", anchor: "96gb", gate: "−30→+30σ", emits: "AuditPacket", icon: "rocket" },
  { num: 19, id: "gtm-forecast", name: "GTM Forecast", group: "GTM", anchor: "256gb", gate: "calibration", emits: "ForecastPacket", icon: "rocket" },
  { num: 20, id: "gtm-distill", name: "GTM Distill", group: "GTM", anchor: "blackwell", gate: "schema", emits: "TrainingSet", icon: "rocket" },
  // Strategy (21-26)
  { num: 21, id: "strategy-7powers", name: "Strategy 7 Powers", group: "Strategy", anchor: "96gb", gate: "premortem", emits: "StrategyPacket", icon: "trending" },
  { num: 22, id: "orthodoxy-map", name: "Orthodoxy Map", group: "Strategy", anchor: "96gb", gate: "≥20 named", emits: "OrthodoxyPacket", icon: "trending" },
  { num: 23, id: "scenario-tree", name: "Scenario Tree", group: "Strategy", anchor: "256gb", gate: "regret-min", emits: "ScenarioPacket", icon: "trending" },
  { num: 24, id: "mechanism-map", name: "Mechanism Map", group: "Strategy", anchor: "48gb", gate: "mechanism-gate", emits: "MechanismPacket", icon: "trending" },
  { num: 25, id: "decision-memo", name: "Decision Memo", group: "Strategy", anchor: "48gb", gate: "RIG-L≥5", emits: "DecisionMemo", icon: "trending" },
  { num: 26, id: "strategy-evolve", name: "Strategy Evolve", group: "Strategy", anchor: "256gb", gate: "Brier", emits: "LearningPacket", icon: "trending" },
  // Operations (27-32)
  { num: 27, id: "ops-cadence", name: "Ops Cadence", group: "Operations", anchor: "36gb", gate: "Simplicity Gate", emits: "OpsPacket", icon: "activity" },
  { num: 28, id: "exception-route", name: "Exception Route", group: "Operations", anchor: "48gb", gate: "exception-gate", emits: "ExceptionPacket", icon: "activity" },
  { num: 29, id: "bottleneck-find", name: "Bottleneck Find", group: "Operations", anchor: "96gb", gate: "constraint", emits: "ConstraintPacket", icon: "activity" },
  { num: 30, id: "sop-compile", name: "SOP Compile", group: "Operations", anchor: "48gb", gate: "3+ repeats", emits: "SOPCard", icon: "activity" },
  { num: 31, id: "incident-triage", name: "Incident Triage", group: "Operations", anchor: "48gb", gate: "classify", emits: "IncidentPacket", icon: "activity" },
  { num: 32, id: "ops-healthcheck", name: "Ops Healthcheck", group: "Operations", anchor: "256gb", gate: "green/halt", emits: "HealthReport", icon: "activity" },
  // Finance (33-38)
  { num: 33, id: "unit-economics", name: "Unit Economics", group: "Finance", anchor: "96gb", gate: "cost-ceiling", emits: "FinancePacket", icon: "dollar" },
  { num: 34, id: "three-statement", name: "Three Statement", group: "Finance", anchor: "96gb", gate: "schema-integrity", emits: "ModelPacket", icon: "dollar" },
  { num: 35, id: "valuation", name: "Valuation", group: "Finance", anchor: "256gb", gate: "source-per-claim", emits: "ValuationPacket", icon: "dollar" },
  { num: 36, id: "finops-meter", name: "FinOps Meter", group: "Finance", anchor: "48gb", gate: "Cost Ceiling Enforcer", emits: "CostLedger", icon: "dollar" },
  { num: 37, id: "risk-sim", name: "Risk Sim", group: "Finance", anchor: "blackwell", gate: "tail-risk", emits: "RiskPacket", icon: "dollar" },
  { num: 38, id: "finance-forecast", name: "Finance Forecast", group: "Finance", anchor: "256gb", gate: "calibration", emits: "ForecastPacket", icon: "dollar" },
  // Product (39-44)
  { num: 39, id: "spec-synthesize", name: "Spec Synthesize", group: "Product", anchor: "96gb", gate: "forced-guess=0", emits: "SpecPacket", icon: "wrench" },
  { num: 40, id: "plan-chunk", name: "Plan Chunk", group: "Product", anchor: "48gb", gate: "no-big-bang", emits: "PlanPacket", icon: "wrench" },
  { num: 41, id: "build-evolve", name: "Build Evolve", group: "Product", anchor: "96gb", gate: "no-self-verify", emits: "CandidatePacket", icon: "wrench" },
  { num: 42, id: "digital-twin-test", name: "Digital Twin Test", group: "Product", anchor: "96gb", gate: "sim-pass", emits: "TwinReport", icon: "wrench" },
  { num: 43, id: "build-vs-buy", name: "Build vs Buy", group: "Product", anchor: "48gb", gate: "EV", emits: "DecisionPacket", icon: "wrench" },
  { num: 44, id: "retrofit-studio", name: "Retrofit Studio", group: "Product", anchor: "48gb", gate: "12-phase", emits: "RetrofitProof", icon: "wrench" },
  // Studios (45-50)
  { num: 45, id: "design-studio", name: "Design Studio", group: "Studios", anchor: "96gb", gate: "+5σ signature", emits: "SitePacket", icon: "palette" },
  { num: 46, id: "linkedin-studio", name: "LinkedIn Studio", group: "Studios", anchor: "48gb", gate: "±30σ", emits: "PostPacket", icon: "palette" },
  { num: 47, id: "research-studio", name: "Research Studio", group: "Studios", anchor: "96gb", gate: "source-per-claim", emits: "ResearchPacket", icon: "palette" },
  { num: 48, id: "website-goal", name: "Website Goal", group: "Studios", anchor: "96gb", gate: "12-gate", emits: "SitePacket", icon: "palette" },
  { num: 49, id: "mission-control", name: "Mission Control", group: "Studios", anchor: "256gb", gate: "7-day-clean", emits: "StatusReport", icon: "palette" },
  { num: 50, id: "rig-fullbuild", name: "RIG Full Build", group: "Studios", anchor: "48gb", gate: "lattice-pass", emits: "FINAL_REPORT", icon: "palette" },
];

const GROUPS = ["Reasoning", "Deviation", "GTM", "Strategy", "Operations", "Finance", "Product", "Studios"];

const GROUP_COLORS: Record<string, string> = {
  Reasoning: "#60a5fa",
  Deviation: "#a855f7",
  GTM: "#10b981",
  Strategy: "#ef4444",
  Operations: "#5ab896",
  Finance: "#d4a574",
  Product: "#f472b6",
  Studios: "#ec4899",
};

const ICONS: Record<string, React.ReactNode> = {
  brain: <Brain size={14} />,
  gauge: <Gauge size={14} />,
  rocket: <Rocket size={14} />,
  trending: <TrendingUp size={14} />,
  activity: <Activity size={14} />,
  dollar: <DollarSign size={14} />,
  wrench: <Wrench size={14} />,
  palette: <Palette size={14} />,
};

export default function HarnessPage() {
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<GoalLoop | null>(null);

  const filtered = useMemo(() => {
    if (filter === "All") return LOOPS;
    return LOOPS.filter((l) => l.group === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="grid place-items-center w-10 h-10 rounded-lg" style={{ color: "#a855f7", border: "1px solid #a855f755", background: "#a855f712" }}>
            <Command size={20} />
          </div>
          <div>
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Harnesses & Goal Loops
            </h1>
            <p className="text-[13px]" style={{ color: "var(--cream-dim)" }}>
              50 /goal loops · Run <span style={{ color: "#fbbf24", fontWeight: 600 }}>mission-control (#49)</span> first · IQRSQPI inside every cell
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Loops", value: "50", accent: "#a855f7" },
            { label: "Groups", value: "8", accent: "#60a5fa" },
            { label: "Reasoning", value: "6", accent: "#60a5fa" },
            { label: "GTM", value: "8", accent: "#10b981" },
            { label: "Studios", value: "6", accent: "#ec4899" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="text-2xl" style={{ color: s.accent, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500 }}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "var(--cream-dim)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* IQRSQPI Pipeline */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <h2 className="text-[15px] font-semibold mb-3" style={{ color: "var(--cream)" }}>IQRSQPI Loop (inside every coordinate)</h2>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { code: "I1", name: "Intent", color: "#60a5fa" },
              { code: "Q1", name: "Question", color: "#22d3ee" },
              { code: "R", name: "Research", color: "#a3e635" },
              { code: "S", name: "Solution", color: "#fbbf24" },
              { code: "Q2", name: "Quality", color: "#f97316" },
              { code: "P", name: "Proof", color: "#ef4444" },
              { code: "I2", name: "Integrate", color: "#10b981" },
            ].map((step, i) => (
              <div key={step.code} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: `${step.color}12`, border: `1px solid ${step.color}44` }}>
                  <span className="text-[11px] font-mono font-bold" style={{ color: step.color }}>{step.code}</span>
                  <span className="text-[11px]" style={{ color: "var(--cream)" }}>{step.name}</span>
                </div>
                {i < 6 && <span style={{ color: "var(--cream-dim)" }}>→</span>}
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: "var(--cream-dim)" }}>
            No Quality → no Proof. No Proof → no Integrate. Research claims cite sources.
          </p>
        </div>
      </motion.div>

      {/* BMS Mode Routing */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.12 }}>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <h2 className="text-[15px] font-semibold mb-3" style={{ color: "var(--cream)" }}>BMS A1/A2/A3/A4 Build-Mode Routing</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { mode: "A1", name: "Python Only", threshold: "≥0.75", desc: "Typed schemas, fixed rules, golden tests", color: "#10b981" },
              { mode: "A2", name: "Hybrid", threshold: "0.45-0.74", desc: "Temp 0, forced JSON, Pydantic validation", color: "#fbbf24" },
              { mode: "A3", name: "Agent Bounded", threshold: "0.25-0.44", desc: "Tool allowlists, approval nodes, retry limits", color: "#f97316" },
              { mode: "A4", name: "LLM Agent Free", threshold: "<0.25", desc: "Kill switch, budget switch, Brier eval, human approval", color: "#ef4444" },
            ].map((b) => (
              <div key={b.mode} className="rounded-lg p-3 border" style={{ background: `${b.color}08`, borderColor: `${b.color}33` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-mono font-bold" style={{ color: b.color }}>{b.mode}</span>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--cream)" }}>{b.name}</span>
                </div>
                <div className="text-[10px] font-mono mb-1" style={{ color: "var(--cream-dim)" }}>{b.threshold}</div>
                <div className="text-[10px]" style={{ color: "var(--cream-dim)" }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Launch Pattern */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.14 }}>
        <div className="rounded-xl p-4 border flex items-center gap-3" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div className="grid place-items-center w-9 h-9 rounded-lg" style={{ color: "#a855f7", border: "1px solid #a855f755", background: "#a855f712" }}>
            <Play size={16} />
          </div>
          <div>
            <div className="text-[13px] font-mono" style={{ color: "var(--cream)" }}>
              hermes /goal --spec {"<id>"}.yaml --anchor {"<node>"} --watch
            </div>
            <div className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
              Run <span style={{ color: "#fbbf24" }}>mission-control</span> first in the 50-loop fleet.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.16 }}>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("All")}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{
              background: filter === "All" ? "var(--gold)" : "var(--bg-card)",
              color: filter === "All" ? "#1a1a1a" : "var(--cream-dim)",
              border: `1px solid ${filter === "All" ? "var(--gold)" : "var(--line-soft)"}`,
            }}
          >
            All 50
          </button>
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: filter === g ? GROUP_COLORS[g] : "var(--bg-card)",
                color: filter === g ? "#1a1a1a" : "var(--cream-dim)",
                border: `1px solid ${filter === g ? GROUP_COLORS[g] : "var(--line-soft)"}`,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Goal Loop Grid */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.18 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((loop) => {
            const color = GROUP_COLORS[loop.group];
            return (
              <div
                key={loop.id}
                onClick={() => setSelected(selected?.id === loop.id ? null : loop)}
                className="rounded-xl p-4 border cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  background: "var(--bg-card)",
                  borderColor: selected?.id === loop.id ? color : "var(--line-soft)",
                  boxShadow: selected?.id === loop.id ? `0 0 0 1px ${color}44` : "none",
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ color, border: `1px solid ${color}44`, background: `${color}12` }}>
                      {ICONS[loop.icon]}
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: "var(--cream-dim)" }}>#{loop.num}</span>
                  </div>
                  {loop.num === 49 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "#fbbf2422", color: "#fbbf24", border: "1px solid #fbbf2444" }}>
                      RUN FIRST
                    </span>
                  )}
                </div>
                <h3 className="text-[13px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{loop.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${color}11`, color }}>{loop.group}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--bg-elevated)", color: "var(--cream-dim)" }}>{loop.anchor}</span>
                </div>
                {selected?.id === loop.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 space-y-1">
                    <div className="text-[10px]" style={{ color: "var(--cream-dim)" }}>
                      <span style={{ color }}>Gate:</span> {loop.gate}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--cream-dim)" }}>
                      <span style={{ color }}>Emits:</span> {loop.emits}
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: "var(--cream-dim)" }}>
                      hermes /goal --spec {loop.id}.yaml
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 3D Lattice Reference */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <h2 className="text-[15px] font-semibold mb-3" style={{ color: "var(--cream)" }}>RIG 3D Lattice</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg p-3 border" style={{ background: "rgba(96,165,250,0.08)", borderColor: "rgba(96,165,250,0.2)" }}>
              <div className="text-[12px] font-bold mb-1" style={{ color: "#60a5fa" }}>X-axis: Levels</div>
              <div className="text-[11px]" style={{ color: "var(--cream-dim)" }}>L1 → L7 (7 levels)</div>
            </div>
            <div className="rounded-lg p-3 border" style={{ background: "rgba(90,184,150,0.08)", borderColor: "rgba(90,184,150,0.2)" }}>
              <div className="text-[12px] font-bold mb-1" style={{ color: "#5ab896" }}>Y-axis: Diamonds</div>
              <div className="text-[11px]" style={{ color: "var(--cream-dim)" }}>D1 Physical, D2 Cognitive, D3 Nature</div>
            </div>
            <div className="rounded-lg p-3 border" style={{ background: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.2)" }}>
              <div className="text-[12px] font-bold mb-1" style={{ color: "#a855f7" }}>Z-axis: BMS Mode</div>
              <div className="text-[11px]" style={{ color: "var(--cream-dim)" }}>A1-A4 (4 modes)</div>
            </div>
          </div>
          <div className="text-[12px] mt-3 text-center font-mono" style={{ color: "var(--cream-dim)" }}>
            7 × 3 × 4 = 84 primary coordinates · 84 × 7 IQRSQPI steps = 588 execution cells
          </div>
          <div className="text-[10px] mt-1 text-center" style={{ color: "var(--cream-dim)" }}>
            Cell ID format: L{`{level}`}-D{`{diamond}`}-A{`{mode}`}-{`{step}`} (e.g., L4-D1-A3-S)
          </div>
        </div>
      </motion.div>
    </div>
  );
}