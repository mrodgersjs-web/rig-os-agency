"use client";

import { useEffect, useState } from "react";
import Panel from "../../components/Panel";

interface ProofPacket {
  schema_version: number;
  run_id: string;
  agent: string;
  coordinate: string;
  intent: string;
  verdict: string;
  proof_hash: string;
  timestamp: string;
}

export default function RigProofPage() {
  const [packets, setPackets] = useState<ProofPacket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ProofPackets are stored in the vault and/or local proof dirs
    async function loadPackets() {
      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: "find ~/Documents/JakeStudio ~/Developer/RIGForge -name '*proof*' -o -name '*ProofPacket*' 2>/dev/null | head -20" }),
        });
        const data = await res.json();
        // Parse output for proof packet files
        const lines = (data.stdout || "").split("\n").filter(Boolean);
        const found: ProofPacket[] = lines.map((line: string, i: number) => ({
          schema_version: 1,
          run_id: `proof-${i}`,
          agent: "unknown",
          coordinate: "L4-D1-A3-P",
          intent: line.split("/").pop() || line,
          verdict: "FOUND",
          proof_hash: "",
          timestamp: "",
        }));
        setPackets(found);
      } catch {
        setPackets([]);
      }
      setLoading(false);
    }
    loadPackets();
  }, []);

  return (
    <Panel title="Proof Packets" subtitle="Cryptographically signed execution evidence">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        <div style={{
          padding: "1.5rem",
          borderRadius: "0.75rem",
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.2)",
          marginBottom: "2rem",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            ProofPacket or it did not happen.
          </h3>
          <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
            Every meaningful RIG action produces a ProofPacket with:
            run_id, agent, coordinate, intent, artifact hash, sources,
            gate results, deviation scores, approval, verdict, and proof_hash.
          </div>
        </div>

        {loading ? (
          <div style={{ opacity: 0.5 }}>Scanning vault and RIGForge for proof packets...</div>
        ) : packets.length === 0 ? (
          <div style={{ opacity: 0.5 }}>No proof packets found yet. Run a RIG mission to generate one.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {packets.map((p) => (
              <div key={p.run_id} style={{
                padding: "1rem 1.5rem",
                borderRadius: "0.5rem",
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                    {p.run_id}
                  </span>
                  <span style={{
                    padding: "0.125rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    background: p.verdict === "GO" ? "rgba(16,185,129,0.2)" : "rgba(251,191,36,0.2)",
                    color: p.verdict === "GO" ? "#10b981" : "#fbbf24",
                  }}>
                    {p.verdict}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem" }}>
                  {p.intent}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ProofPacket Schema */}
        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          borderRadius: "0.75rem",
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem", opacity: 0.7 }}>
            PROOFPACKET SCHEMA
          </h3>
          <pre style={{ fontSize: "0.75rem", fontFamily: "monospace", overflow: "auto", opacity: 0.6 }}>
{`{
  "schema_version": 1,
  "run_id": "<uuid>",
  "agent": "<name>",
  "coordinate": "L{level}-D{diamond}-A{mode}-{step}",
  "intent": "<one-sentence goal>",
  "artifact": { "path": "...", "hash": "sha256:..." },
  "sources": [{ "uri": "...", "hash": "sha256:..." }],
  "gates": [{ "name": "...", "status": "PASS|FAIL|SKIPPED" }],
  "deviation": { "engine_subset": [], "rig_l": 0, "anti_generic": 0 },
  "approval": { "required": false, "approved_by": "" },
  "verdict": "GO|NO-GO|BLOCKED",
  "proof_hash": "sha256:..."
}`}
          </pre>
        </div>
      </div>
    </Panel>
  );
}