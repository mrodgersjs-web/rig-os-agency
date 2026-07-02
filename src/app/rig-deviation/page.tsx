"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Layers, Brain, Leaf, Atom, Zap, Shield, Activity, Gauge,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// ── 40 Deviation Engines ──────────────────────────────────────────
interface Engine {
  num: number;
  name: string;
  group: "Cognitive" | "Nature" | "Physics";
  axis: "OUTPUT" | "PROCESS" | "STATE";
  sigma: string;
  desc: string;
}

const ENGINES: Engine[] = [
  // Cognitive 01-20 (OUTPUT, ±20σ)
  { num: 1, name: "Gravity Escape", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Break free from conventional thinking gravity wells. Identifies when reasoning is trapped in a local optimum." },
  { num: 2, name: "Reality Anchor", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Grounds abstract claims in observable, verifiable reality. Prevents ungrounded speculation." },
  { num: 3, name: "Feynman X-Ray", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Explains complex ideas so simply that a beginner understands. Surfaces hidden complexity." },
  { num: 4, name: "Mechanism Furnace", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Burns away claims without mechanism. No mechanism, no claim." },
  { num: 5, name: "Rupture Engine", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Deliberately ruptures assumptions to test robustness. Stress-tests mental models." },
  { num: 6, name: "Collision Collider", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Collides opposing ideas to generate synthesis. Dialectical reasoning at scale." },
  { num: 7, name: "Voltage Reactor", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Amplifies weak signals into actionable insights. Signal-to-noise optimization." },
  { num: 8, name: "Evolutionary Memory Flywheel", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Compounds learning across sessions. No memory update, no compounding." },
  { num: 9, name: "Memory Residue", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Extracts durable facts from transient context. Separates signal from noise in memory." },
  { num: 10, name: "Temporal Horizon Integrity", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Checks claims against temporal validity. Prevents stale-fact reasoning." },
  { num: 11, name: "Autonomy Calibration", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Calibrates decision autonomy level. Matches A1-A4 mode to task complexity." },
  { num: 12, name: "Predictive Error Calibration", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Tracks prediction accuracy over time. Brier score feedback loop." },
  { num: 13, name: "Anti-Slop Auditor", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Detects and penalizes generic, lazy output. AntiGenericForce ≥ 80 internal / ≥ 85 public." },
  { num: 14, name: "Specificity Gate", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Forces specific, concrete language. Rejects vague, hedging language." },
  { num: 15, name: "Source-Per-Claim", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Every claim must cite a source. No source, no number." },
  { num: 16, name: "Falsification Pre-Register", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Pre-registers hypotheses before testing. Prevents retroactive rationalization." },
  { num: 17, name: "Dissent Recorder", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Records minority opinions and dissents. Prevents groupthink collapse." },
  { num: 18, name: "Brier Calibrator", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Scores probabilistic predictions against outcomes. Continuous calibration." },
  { num: 19, name: "Cognitive Sovereignty", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Maintains independent reasoning against social proof pressure." },
  { num: 20, name: "Compounding Edge", group: "Cognitive", axis: "OUTPUT", sigma: "±20σ", desc: "Identifies and amplifies small compounding advantages over time." },
  // Nature 21-30 (PROCESS, ±20σ)
  { num: 21, name: "Ant Colony Pheromone", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Stigmergic coordination. Agents leave trails that guide subsequent agents." },
  { num: 22, name: "Bee Foraging Allocator", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Allocates exploration vs exploitation based on nectar quality. Optimal search budget." },
  { num: 23, name: "Slime Mold Network", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Discovers optimal network paths through gradient following. Biological routing." },
  { num: 24, name: "Genetic Diversity Pump", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Injects diversity to prevent premature convergence. Maintains solution variety." },
  { num: 25, name: "Particle Swarm Cohesion", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Swarm intelligence with individual and social components. Balances personal best vs global best." },
  { num: 26, name: "Firefly Synchronization", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Achieves decentralized synchronization across agents. Flash-based coupling." },
  { num: 27, name: "Resource Allocator (need×trust)", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Allocates resources proportional to need × trust score. Ecosystem-style distribution." },
  { num: 28, name: "Whale Spiral (WOA)", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Whale Optimization Algorithm. Bubble-net feeding spiral for local search." },
  { num: 29, name: "Cuckoo Parasite", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Cuckoo Search. Lévy flight random walk + nest abandonment for global exploration." },
  { num: 30, name: "Coral Reef Evolver (CRO-SL)", group: "Nature", axis: "PROCESS", sigma: "±20σ", desc: "Coral Reef Optimization with Slime and Lévy. Multi-symbiotic evolution." },
  // Physics 31-40 (STATE, ±30σ HARD)
  { num: 31, name: "Quantum Tunneling", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "Allows solutions to tunnel through energy barriers. Non-classical path discovery." },
  { num: 32, name: "Pauli Exclusion", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "No two agents can occupy the same state simultaneously. Prevents redundant work." },
  { num: 33, name: "Casimir Pressure", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "Vacuum fluctuations create measurable force. Detects emergent effects from empty space." },
  { num: 34, name: "Fine-Tuning", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "Checks if parameters are within life-permitting ranges. Sensitivity analysis." },
  { num: 35, name: "Hawking Radiation", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "Information escapes from seemingly sealed systems. Prevents information loss in black-box processes." },
  { num: 36, name: "Speed of Light", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "Universal speed limit. No information propagates faster than c. Causality enforcement." },
  { num: 37, name: "Absolute Zero", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "Minimum energy state. Defines the floor of system activity." },
  { num: 38, name: "Phase Transition", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "Detects sudden state changes. Critical point identification." },
  { num: 39, name: "Bell Entanglement", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "Non-local correlations between separated agents. Spooky action at distance." },
  { num: 40, name: "Vacuum Fluctuation", group: "Physics", axis: "STATE", sigma: "±30σ HARD", desc: "Spontaneous creation from nothing. Generates novel solutions from empty state." },
];

const GROUP_CONFIG = {
  Cognitive: { color: "#d4a574", icon: <Brain size={16} />, axis: "OUTPUT", sigma: "±20σ", order: 2 },
  Nature: { color: "#5ab896", icon: <Leaf size={16} />, axis: "PROCESS", sigma: "±20σ", order: 3 },
  Physics: { color: "#ef4444", icon: <Atom size={16} />, axis: "STATE", sigma: "±30σ HARD", order: 1 },
};

export default function DeviationPage() {
  const [filter, setFilter] = useState<"All" | "Cognitive" | "Nature" | "Physics">("All");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (filter === "All") return ENGINES;
    return ENGINES.filter((e) => e.group === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="grid place-items-center w-10 h-10 rounded-lg" style={{ color: "#7c3aed", border: "1px solid #7c3aed55", background: "#7c3aed12" }}>
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Deviation Engines
            </h1>
            <p className="text-[13px]" style={{ color: "var(--cream-dim)" }}>
              40 engines · Run in fixed order: <span style={{ color: "#ef4444", fontWeight: 600 }}>Physics</span> →{" "}
              <span style={{ color: "#d4a574", fontWeight: 600 }}>Cognitive</span> →{" "}
              <span style={{ color: "#5ab896", fontWeight: 600 }}>Nature</span> → RIG-L → Detonation
            </p>
          </div>
        </div>
      </motion.div>

      {/* Group Cards */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["Physics", "Cognitive", "Nature"] as const).map((g) => {
            const cfg = GROUP_CONFIG[g];
            const count = ENGINES.filter((e) => e.group === g).length;
            const range = g === "Physics" ? "31-40" : g === "Cognitive" ? "01-20" : "21-30";
            return (
              <div
                key={g}
                onClick={() => setFilter(filter === g ? "All" : g)}
                className="rounded-xl p-5 border cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  background: "var(--bg-card)",
                  borderColor: filter === g ? cfg.color : "var(--line-soft)",
                  boxShadow: filter === g ? `0 0 0 1px ${cfg.color}44` : "none",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="grid place-items-center w-10 h-10 rounded-lg" style={{ color: cfg.color, border: `1px solid ${cfg.color}55`, background: `${cfg.color}12` }}>
                    {cfg.icon}
                  </div>
                  <span className="text-3xl" style={{ color: cfg.color, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500 }}>{count}</span>
                </div>
                <h3 className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>
                  {g} {range}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${cfg.color}11`, color: cfg.color }}>
                    {cfg.axis}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${cfg.color}11`, color: cfg.color }}>
                    {cfg.sigma}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Pipeline Order */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.08 }}>
        <div className="rounded-xl p-5 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <h2 className="text-[15px] font-semibold mb-3" style={{ color: "var(--cream)" }}>Deviation Pipeline Execution Order</h2>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { name: "Physics", desc: "31-40 STATE", color: "#ef4444" },
              { name: "Cognitive", desc: "01-20 OUTPUT", color: "#d4a574" },
              { name: "Nature", desc: "21-30 PROCESS", color: "#5ab896" },
              { name: "RIG-L", desc: "score gate", color: "#a855f7" },
              { name: "Detonation", desc: "final blast", color: "#fbbf24" },
            ].map((step, i) => (
              <div key={step.name} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: `${step.color}12`, border: `1px solid ${step.color}44` }}>
                  <span className="text-[12px] font-semibold" style={{ color: step.color }}>{step.name}</span>
                  <span className="text-[10px]" style={{ color: "var(--cream-dim)" }}>{step.desc}</span>
                </div>
                {i < 4 && <span style={{ color: "var(--cream-dim)" }}>→</span>}
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: "var(--cream-dim)" }}>
            A <span style={{ color: "#ef4444", fontWeight: 600 }}>Physics breach</span> short-circuits the pipeline.
          </p>
        </div>
      </motion.div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(["All", "Cognitive", "Nature", "Physics"] as const).map((f) => {
          const color = f === "All" ? "#a855f7" : GROUP_CONFIG[f].color;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: filter === f ? color : "var(--bg-card)",
                color: filter === f ? "#1a1a1a" : "var(--cream-dim)",
                border: `1px solid ${filter === f ? color : "var(--line-soft)"}`,
              }}
            >
              {f === "All" ? `All 40` : `${f} (${ENGINES.filter((e) => e.group === f).length})`}
            </button>
          );
        })}
      </div>

      {/* Engine Grid */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((eng) => {
            const cfg = GROUP_CONFIG[eng.group];
            const isSelected = selected === eng.num;
            return (
              <div
                key={eng.num}
                onClick={() => setSelected(isSelected ? null : eng.num)}
                className="rounded-xl p-4 border cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  background: "var(--bg-card)",
                  borderColor: isSelected ? cfg.color : "var(--line-soft)",
                  boxShadow: isSelected ? `0 0 0 1px ${cfg.color}44` : "none",
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ color: cfg.color, border: `1px solid ${cfg.color}44`, background: `${cfg.color}12` }}>
                      <span className="text-[11px] font-mono font-bold">{String(eng.num).padStart(2, "0")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {eng.group === "Physics" && <Shield size={12} style={{ color: "#ef4444" }} />}
                    {eng.group === "Cognitive" && <Brain size={12} style={{ color: "#d4a574" }} />}
                    {eng.group === "Nature" && <Leaf size={12} style={{ color: "#5ab896" }} />}
                  </div>
                </div>
                <h3 className="text-[13px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{eng.name}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${cfg.color}11`, color: cfg.color }}>
                    {eng.axis}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${cfg.color}11`, color: cfg.color }}>
                    {eng.sigma}
                  </span>
                </div>
                {isSelected && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-[11px] mt-2 leading-relaxed"
                    style={{ color: "var(--cream-dim)" }}
                  >
                    {eng.desc}
                  </motion.p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.14 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Engines", value: "40", color: "#a855f7" },
            { label: "Physics (HARD)", value: "10", color: "#ef4444" },
            { label: "Cognitive", value: "20", color: "#d4a574" },
            { label: "Nature", value: "10", color: "#5ab896" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="text-2xl" style={{ color: s.color, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500 }}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "var(--cream-dim)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}