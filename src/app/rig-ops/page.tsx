"use client";

import { useEffect, useState } from "react";
import Panel from "../../components/Panel";

interface ProofPacket {
  run_id: string;
  agent: string;
  coordinate: string;
  intent: string;
  verdict: string;
  timestamp: string;
}

interface RIGOpsState {
  phase: string;
  gate: string;
  squad: string;
  bms_mode: string;
  proof_packets: ProofPacket[];
  skills_count: number;
  experts_count: number;
}

export default function RIGOpsPage() {
  const [state, setState] = useState<RIGOpsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState<string>("");
  const [command, setCommand] = useState("rig-ops doctor");

  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: "rig-ops doctor 2>&1 | head -40" }),
        });
        const data = await res.json();
        setOutput(data.stdout || data.stderr || "No output");
      } catch {
        setOutput("rig-ops CLI not available in this context");
      }
      setLoading(false);
    }
    fetchState();
  }, []);

  async function runCommand() {
    setOutput("Running...");
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: command + " 2>&1 | head -60" }),
      });
      const data = await res.json();
      setOutput(data.stdout || data.stderr || "No output");
    } catch {
      setOutput("Command failed");
    }
  }

  if (loading) return <Panel title="RIG Ops" subtitle="Loading...">Loading...</Panel>;

  return (
    <Panel title="RIG Ops" subtitle="Mission control for the Rodgers Intelligence Group">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        {/* RIG Status */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <StatCard label="Phase" value="A" accent="#a855f7" />
          <StatCard label="Gate" value="00" accent="#fbbf24" />
          <StatCard label="Squad" value="chief_of_staff" accent="#60a5fa" />
          <StatCard label="BMS" value="A3" accent="#10b981" />
        </div>

        {/* RIG Identity */}
        <div style={{
          padding: "1.5rem",
          borderRadius: "0.75rem",
          background: "rgba(168,85,247,0.08)",
          border: "1px solid rgba(168,85,247,0.2)",
          marginBottom: "2rem",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Jake RIG Agent
          </h3>
          <div style={{ fontSize: "0.875rem", opacity: 0.7, fontFamily: "monospace" }}>
            Mode: execution body. Hermes conducts. V decides. Mike approves external action.<br />
            Coordinate: L4-D1-A3-I1<br />
            Expert roster: 86 Susan agents + 6 RIG core<br />
            Deviation engines: 40 (Physics → Cognitive → Nature → RIG-L → Detonation)
          </div>
        </div>

        {/* RIG CLI Bridge */}
        <div style={{
          padding: "1.5rem",
          borderRadius: "0.75rem",
          background: "rgba(15,23,42,0.6)",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "2rem",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
            RIG-OPS CLI Bridge
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runCommand()}
              style={{
                flex: 1,
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "inherit",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
              placeholder="rig-ops command..."
            />
            <button
              onClick={runCommand}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "rgba(168,85,247,0.2)",
                border: "1px solid rgba(168,85,247,0.3)",
                color: "inherit",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Run
            </button>
          </div>
          <QuickCmd label="doctor" onClick={() => { setCommand("rig-ops doctor"); }} />
          <QuickCmd label="doctrine" onClick={() => { setCommand("rig-ops doctrine"); }} />
          <QuickCmd label="mission" onClick={() => { setCommand("rig-ops mission"); }} />
          <QuickCmd label="energy" onClick={() => { setCommand("rig-ops energy"); }} />
          <QuickCmd label="critical" onClick={() => { setCommand("rig-ops critical"); }} />
          <QuickCmd label="deviate" onClick={() => { setCommand("rig-ops deviate"); }} />
          <pre style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "0.5rem",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.05)",
            fontSize: "0.75rem",
            fontFamily: "monospace",
            overflow: "auto",
            maxHeight: "400px",
            whiteSpace: "pre-wrap",
          }}>
            {output}
          </pre>
        </div>

        {/* GitHub Repos */}
        <div style={{
          padding: "1.5rem",
          borderRadius: "0.75rem",
          background: "rgba(15,23,42,0.6)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            GitHub: rodgemd1-lgtm
          </h3>
          <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
            50+ repos including: rig-linkedin-studio, rig-gtm-studio, jake-pai,
            rig-operating-procedures, rigforge, fair-known, rig-design-studio,
            rig-prediction-studio, strategy-studio, ai-company, hed-brain, and more.
          </div>
        </div>
      </div>
    </Panel>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      padding: "1rem",
      borderRadius: "0.5rem",
      background: "rgba(15,23,42,0.6)",
      border: `1px solid ${accent}33`,
      textAlign: "center",
    }}>
      <div style={{ fontSize: "0.625rem", textTransform: "uppercase", opacity: 0.5, marginBottom: "0.25rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.25rem", fontWeight: 600, color: accent }}>
        {value}
      </div>
    </div>
  );
}

function QuickCmd({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        marginRight: "0.5rem",
        marginBottom: "0.5rem",
        borderRadius: "0.375rem",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "inherit",
        cursor: "pointer",
        fontSize: "0.75rem",
        fontFamily: "monospace",
      }}
    >
      {label}
    </button>
  );
}