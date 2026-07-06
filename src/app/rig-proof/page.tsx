"use client";

import { useEffect, useMemo, useState } from "react";
import Panel from "../../components/Panel";

interface GateSummary {
  pass: number;
  fail: number;
  other: number;
}

interface ProofPacket {
  source: string;
  filename: string;
  run_id: string;
  agent: string;
  coordinate: string;
  intent: string;
  verdict: string;
  status: string;
  proof_hash: string;
  timestamp: string;
  signer: string;
  chain_link_self_hash: string;
  hops_count: number;
  blocks: number;
  gate_summary: GateSummary;
  file_bytes: number;
}

interface ProofResponse {
  schema_version: number;
  timestamp: string;
  roots: string[];
  totals: {
    packets: number;
    gates_pass: number;
    gates_fail: number;
    verdict_go: number;
    verdict_no_go: number;
    verdict_other: number;
  };
  count: number;
  packets: ProofPacket[];
  errors: string[];
}

function shortHash(h: string): string {
  if (!h) return "—";
  if (h.length <= 16) return h;
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}

function verdictClass(v: string): { bg: string; fg: string } {
  const up = v.toUpperCase();
  if (up === "PASS" || up === "GO" || up === "COMPLETED") {
    return { bg: "rgba(16,185,129,0.18)", fg: "#10b981" };
  }
  if (up === "FAIL" || up === "NO-GO" || up === "BLOCKED") {
    return { bg: "rgba(239,68,68,0.18)", fg: "#ef4444" };
  }
  return { bg: "rgba(251,191,36,0.18)", fg: "#fbbf24" };
}

export default function RigProofPage() {
  const [data, setData] = useState<ProofResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "go" | "no-go">("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proof/packets", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ProofResponse;
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.packets.filter((p) => {
      const v = p.verdict.toUpperCase();
      if (filter === "go" && !(v === "PASS" || v === "GO" || v === "COMPLETED"))
        return false;
      if (
        filter === "no-go" &&
        !(v === "FAIL" || v === "NO-GO" || v === "BLOCKED")
      )
        return false;
      if (!q) return true;
      return (
        p.intent.toLowerCase().includes(q) ||
        p.agent.toLowerCase().includes(q) ||
        p.run_id.toLowerCase().includes(q) ||
        p.coordinate.toLowerCase().includes(q)
      );
    });
  }, [data, filter, search]);

  return (
    <Panel
      title="Proof Packets"
      subtitle="Real signed execution evidence from operator logs and JakeStudio"
    >
      <div style={{ padding: "2rem", maxWidth: 1100 }}>
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "0.75rem",
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.2)",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            ProofPacket or it did not happen.
          </h3>
          <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
            Real ProofPackets parsed from <code>ai-company/logs/proofpackets/operator</code>,{" "}
            <code>JakeStudio/ProofPackets</code>, <code>JakeStudio/Artifacts</code>, and{" "}
            <code>rig-os-agency/proof</code>. Each shows intent, gates, verdict, signer, and
            chain hash. Auto-refresh every 30s.
          </div>
        </div>

        {loading && !data && (
          <div style={{ opacity: 0.6 }}>Loading proof packets…</div>
        )}
        {error && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.5rem",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              marginBottom: "1rem",
            }}
          >
            Failed to load: {error}
          </div>
        )}

        {data && (
          <>
            {/* Totals */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              {[
                { label: "Packets", value: data.totals.packets, color: "#fbbf24" },
                { label: "GO / PASS", value: data.totals.verdict_go, color: "#10b981" },
                { label: "NO-GO / FAIL", value: data.totals.verdict_no_go, color: "#ef4444" },
                { label: "Other", value: data.totals.verdict_other, color: "#94a3b8" },
                { label: "Gates PASS", value: data.totals.gates_pass, color: "#10b981" },
                { label: "Gates FAIL", value: data.totals.gates_fail, color: "#ef4444" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "0.875rem 1rem",
                    borderRadius: "0.5rem",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>{s.label}</div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: s.color,
                      fontFamily: "monospace",
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                placeholder="search intent / agent / run_id / coordinate"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: "1 1 280px",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(15,23,42,0.6)",
                  color: "inherit",
                  fontSize: "0.8rem",
                  fontFamily: "monospace",
                }}
              />
              {(["all", "go", "no-go"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "0.375rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background:
                      filter === f ? "rgba(251,191,36,0.2)" : "rgba(15,23,42,0.6)",
                    color: "inherit",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: "monospace",
                  }}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={load}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "0.375rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(15,23,42,0.6)",
                  color: "inherit",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                refresh
              </button>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <div style={{ opacity: 0.55, padding: "1rem 0" }}>
                No matching packets. Run a RIG mission to generate evidence.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filtered.map((p) => {
                  const vc = verdictClass(p.verdict);
                  return (
                    <div
                      key={p.source}
                      style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "0.5rem",
                        background: "rgba(15,23,42,0.6)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            {p.run_id}
                          </span>
                          <span
                            style={{
                              padding: "0.125rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.625rem",
                              fontWeight: 600,
                              background: vc.bg,
                              color: vc.fg,
                            }}
                          >
                            {p.verdict}
                          </span>
                          {p.coordinate && (
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: "0.7rem",
                                opacity: 0.6,
                              }}
                            >
                              {p.coordinate}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.7rem", opacity: 0.5, fontFamily: "monospace" }}>
                          {p.timestamp || "—"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>
                        {p.intent}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                          gap: "0.5rem",
                          marginTop: "0.6rem",
                          fontFamily: "monospace",
                          fontSize: "0.7rem",
                          opacity: 0.75,
                        }}
                      >
                        <div>
                          <span style={{ opacity: 0.5 }}>agent:</span> {p.agent || "—"}
                        </div>
                        <div>
                          <span style={{ opacity: 0.5 }}>signer:</span> {p.signer || "—"}
                        </div>
                        <div>
                          <span style={{ opacity: 0.5 }}>hops:</span> {p.hops_count}
                          <span style={{ opacity: 0.5 }}> · blocks:</span> {p.blocks}
                        </div>
                        <div>
                          <span style={{ opacity: 0.5 }}>gates:</span>{" "}
                          <span style={{ color: "#10b981" }}>{p.gate_summary.pass}P</span>
                          {" / "}
                          <span style={{ color: "#ef4444" }}>{p.gate_summary.fail}F</span>
                          {p.gate_summary.other > 0 && (
                            <>
                              {" / "}
                              <span>{p.gate_summary.other}O</span>
                            </>
                          )}
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <span style={{ opacity: 0.5 }}>hash:</span>{" "}
                          {shortHash(p.proof_hash)}
                          <span style={{ opacity: 0.4 }}> · {p.filename}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Roots + errors */}
            <div
              style={{
                marginTop: "2rem",
                padding: "1.25rem",
                borderRadius: "0.5rem",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.05)",
                fontSize: "0.7rem",
                fontFamily: "monospace",
                opacity: 0.7,
              }}
            >
              <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>SCAN ROOTS</div>
              {data.roots.map((r) => (
                <div key={r}>{r}</div>
              ))}
              {data.errors.length > 0 && (
                <div style={{ marginTop: "0.5rem", color: "#fca5a5" }}>
                  errors: {data.errors.length} (truncated)
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}