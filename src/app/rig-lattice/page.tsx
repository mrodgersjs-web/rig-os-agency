"use client";

import Panel from "../../components/Panel";

export default function RigLatticePage() {
  return (
    <Panel title="RIG 3D Deviation Lattice" subtitle="7 Levels × 3 Diamonds × 4 BMS Modes = 84 coordinates">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        {/* Lattice Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <Card label="Levels" value="7" accent="#7c3aed" />
          <Card label="Diamonds" value="3" accent="#a855f7" />
          <Card label="BMS Modes" value="4" accent="#60a5fa" />
          <Card label="Cells" value="588" accent="#fbbf24" />
        </div>

        {/* 3D Lattice Structure */}
        <div style={{
          padding: "1.5rem", borderRadius: "0.75rem",
          background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
          marginBottom: "2rem",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            3D Lattice Geometry
          </h3>
          <pre style={{ fontSize: "0.75rem", fontFamily: "monospace", opacity: 0.7, lineHeight: 1.6 }}>
{`X-axis: Level L1 → L7
  L1: Immediate task     L5: Company/system architecture
  L2: File/app surface   L6: Portfolio/fleet operating model
  L3: Project/feature    L7: Doctrine, philosophy, strategy
  L4: Product/studio

Y-axis: Triple Diamond
  D1 Physical: machines, files, networks, devices
  D2 Cognitive: research, memory, planning, strategy
  D3 Nature: health, behavior, environment, biology

Z-axis: BMS Confidence
  A1 Python Only (≥0.75)  →  Deterministic, no model in path
  A2 Hybrid (0.45-0.74)   →  Bounded LLM behind typed schema
  A3 Agent Bounded (0.25-0.44) → Governed agent workflows
  A4 LLM Agent Free (<0.25) → Strategic/adversarial + human override

Inside every coordinate: IQRSQPI
  Intent → Question → Research → Solution → Quality → Proof → Integrate

84 coordinates × 7 IQRSQPI steps = 588 execution cells`}
          </pre>
        </div>

        {/* 40 Deviation Engines */}
        <div style={{
          padding: "1.5rem", borderRadius: "0.75rem",
          background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "2rem",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
            40 Deviation Engines
          </h3>
          <div style={{ fontSize: "0.75rem", opacity: 0.7, lineHeight: 1.8 }}>
            <EngineGroup label="Physics (31-40)" engines="Quantum Tunneling · Pauli Exclusion · Casimir Pressure · Fine-Tuning · Hawking Radiation · Speed of Light · Absolute Zero · Phase Transition · Bell Entanglement · Vacuum Fluctuation" color="#ef4444" />
            <EngineGroup label="Cognitive (01-20)" engines="Gravity Escape · Reality Anchor · Feynman X-Ray · Mechanism Furnace · Rupture Engine · Collision Collider · Voltage Reactor · Evolutionary Memory · Memory Residue · Temporal Horizon · Autonomy Calibration · Predictive Error · Anti-Slop · Specificity Gate · Source-Per-Claim · Falsification · Dissent Recorder · Brier Calibrator · Cognitive Sovereignty · Compounding Edge" color="#60a5fa" />
            <EngineGroup label="Nature (21-30)" engines="Ant Colony · Bee Foraging · Slime Mold · Genetic Diversity · Particle Swarm · Firefly Sync · Resource Allocator · Whale Spiral · Cuckoo Parasite · Coral Reef Evolver" color="#10b981" />
            <EngineGroup label="RIG-L" engines="Gate-Integrity · Proof-Binding · Lattice-Mapping · BMS-Honesty · IQRSQPI-Trace · Memory-Compound · AntiGenericForce · Repetition-to-Skill" color="#fbbf24" />
            <EngineGroup label="Detonation" engines="Blast-Radius · Fragility-Test · Failure-Cascade · Recovery-Time · Escalation-Path · Kill-Switch · Budget-Burn · Collapse-Mode" color="#ef4444" />
          </div>
        </div>

        {/* BMS Routing */}
        <div style={{
          padding: "1.5rem", borderRadius: "0.75rem",
          background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            BMS Routing Thresholds
          </h3>
          <div style={{ fontSize: "0.75rem", opacity: 0.7, fontFamily: "monospace" }}>
            BMS ≥ 0.75 → A1 Python Only (deterministic)<br />
            0.45-0.74 → A2 Hybrid (bounded LLM + Pydantic)<br />
            0.25-0.44 → A3 Agent Bounded (tool allowlists + approval)<br />
            BMS &lt; 0.25 → A4 LLM Agent Free (kill switch + human)<br /><br />
            AntiGenericForce ≥ 80 internal / ≥ 85 public-facing<br />
            ManipulationRisk ≤ 35 for customer-facing
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      padding: "1rem", borderRadius: "0.5rem",
      background: "rgba(15,23,42,0.6)", border: `1px solid ${accent}33`,
      textAlign: "center",
    }}>
      <div style={{ fontSize: "0.625rem", textTransform: "uppercase", opacity: 0.5 }}>{label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 600, color: accent }}>{value}</div>
    </div>
  );
}

function EngineGroup({ label, engines, color }: { label: string; engines: string; color: string }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ color, fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ opacity: 0.6, fontSize: "0.7rem" }}>{engines}</div>
    </div>
  );
}