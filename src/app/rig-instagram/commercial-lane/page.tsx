"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, Camera, CheckCircle2, AlertCircle, Clock,
  Shield, Zap, FileText, Bot, Gauge,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

interface StageData {
  id: number;
  name: string;
  description: string;
  status: string;
}

interface ApiResponse {
  foundry: { exists: boolean; path: string };
  manifest: { maturity: string | null; desiredState: string | null; productionAdmissible: boolean | null };
  evaluator: { testFiles: string[]; testCount: number; lastVerdict: string | null; lastArtifact: string | null; liveFalseTest: boolean };
  stages: StageData[];
  gates: string[];
  pipeline: { producer: { exists: boolean }; consumer: { exists: boolean }; m2Admission: { exists: boolean }; writeSafetyLaw: { exists: boolean } };
  evidence: { fileCount: number; mvpCardExists: boolean };
  docker: { composeExists: boolean; containerHealth: string };
  prefect: { dashboardUrl: string; health: string };
  grid: { reachabilityTest: boolean };
}

function stageStatusColor(status: string): string {
  switch (status) {
    case "DONE": return "var(--emerald)";
    case "BUILT": return "var(--emerald)";
    case "MISSING": return "var(--rust)";
    default: return "var(--gold)";
  }
}

function stageStatusIcon(status: string) {
  switch (status) {
    case "DONE":
    case "BUILT": return <CheckCircle2 size={16} style={{ color: "var(--emerald)" }} />;
    case "MISSING": return <AlertCircle size={16} style={{ color: "var(--rust)" }} />;
    default: return <Clock size={16} style={{ color: "var(--gold)" }} />;
  }
}

function verdictColor(verdict: string | null): string {
  if (!verdict) return "var(--gold)";
  switch (verdict) {
    case "READY": return "var(--emerald)";
    case "HOLD": return "var(--rust)";
    default: return "var(--gold)";
  }
}

export default function CommercialLanePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agency/instagram-commercial-lane")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "48px 32px", color: "var(--cream)" }}>
        <p style={{ opacity: 0.5 }}>Loading Instagram Commercial Lane status…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "48px 32px", color: "var(--cream)" }}>
        <AlertCircle size={24} style={{ color: "var(--rust)" }} />
        <p style={{ marginTop: 12 }}>Unable to load: {error || "No data"}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Camera size={28} style={{ color: "var(--gold)" }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--cream)", margin: 0 }}>
            Instagram Commercial Lane
          </h1>
        </div>
        <p style={{ color: "var(--cream)", opacity: 0.6, fontSize: 14 }}>
          M1 Readiness Evaluator — Pipeline Status · {data.manifest.maturity || "unknown"} · {data.manifest.desiredState || "unknown"}
        </p>
      </motion.section>

      {/* Evaluator Card */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }} style={{ marginTop: 24 }}>
        <div style={{
          background: "var(--bg-deep)",
          borderRadius: 12,
          padding: 24,
          border: "1px solid color-mix(in srgb, var(--cream) 8%, transparent)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--cream)", margin: 0 }}>
              Evaluator Status
            </h2>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {data.evaluator.lastVerdict && (
                <span style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: `color-mix(in srgb, ${verdictColor(data.evaluator.lastVerdict)} 15%, transparent)`,
                  color: verdictColor(data.evaluator.lastVerdict),
                  border: `1px solid color-mix(in srgb, ${verdictColor(data.evaluator.lastVerdict)} 30%, transparent)`,
                }}>
                  Last: {data.evaluator.lastVerdict}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <StatCard label="Test Files" value={String(data.evaluator.testCount)} icon={<FileText size={16} />} />
            <StatCard label="Evidence Files" value={String(data.evidence.fileCount)} icon={<FileText size={16} />} />
            <StatCard label="Maturity" value={data.manifest.maturity || "—"} icon={<Gauge size={16} />} />
            <StatCard label="Live-False Test" value={data.evaluator.liveFalseTest ? "EXISTS" : "MISSING"} icon={<Activity size={16} />} />
          </div>
          {data.evaluator.lastArtifact && (
            <p style={{ marginTop: 12, fontSize: 12, color: "var(--cream)", opacity: 0.5 }}>
              Last artifact: <code>{data.evaluator.lastArtifact}</code>
            </p>
          )}
        </div>
      </motion.section>

      {/* Stage Map */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--cream)", marginBottom: 12 }}>
          Pipeline Stages
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {data.stages.map((stage) => (
            <div key={stage.id} style={{
              background: "var(--bg-deep)",
              borderRadius: 10,
              padding: 16,
              border: `1px solid color-mix(in srgb, ${stageStatusColor(stage.status)} 20%, transparent)`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "var(--cream)", opacity: 0.5 }}>Stage {stage.id}</span>
                {stageStatusIcon(stage.status)}
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--cream)", margin: "0 0 4px" }}>
                {stage.name}
              </h3>
              <p style={{ fontSize: 11, color: "var(--cream)", opacity: 0.5, margin: 0, lineHeight: 1.4 }}>
                {stage.description}
              </p>
              <div style={{ marginTop: 8 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: `color-mix(in srgb, ${stageStatusColor(stage.status)} 15%, transparent)`,
                  color: stageStatusColor(stage.status),
                }}>
                  {stage.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Pipeline Flow */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }} style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--cream)", marginBottom: 12 }}>
          Pipeline Flow
        </h2>
        <div style={{
          background: "var(--bg-deep)",
          borderRadius: 12,
          padding: 24,
          border: "1px solid color-mix(in srgb, var(--cream) 8%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}>
          {[
            { label: "Producer", exists: data.pipeline.producer.exists, icon: <Bot size={20} /> },
            { label: "Evaluator", exists: true, icon: <Gauge size={20} /> },
            { label: "Consumer", exists: data.pipeline.consumer.exists, icon: <Camera size={20} /> },
            { label: "M2 Admission", exists: data.pipeline.m2Admission.exists, icon: <Shield size={20} /> },
            { label: "Publish", exists: data.pipeline.writeSafetyLaw.exists, icon: <Zap size={20} /> },
          ].map((node, i, arr) => (
            <div key={node.label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                opacity: node.exists ? 1 : 0.35,
              }}>
                <div style={{
                  width: 48, height: 48,
                  borderRadius: 10,
                  background: node.exists
                    ? "color-mix(in srgb, var(--emerald) 12%, transparent)"
                    : "color-mix(in srgb, var(--rust) 8%, transparent)",
                  border: `1px solid ${node.exists
                    ? "color-mix(in srgb, var(--emerald) 25%, transparent)"
                    : "color-mix(in srgb, var(--rust) 15%, transparent)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: node.exists ? "var(--emerald)" : "var(--rust)",
                }}>
                  {node.icon}
                </div>
                <span style={{ fontSize: 10, color: "var(--cream)", opacity: 0.7 }}>{node.label}</span>
                {node.exists ? (
                  <CheckCircle2 size={12} style={{ color: "var(--emerald)" }} />
                ) : (
                  <AlertCircle size={12} style={{ color: "var(--rust)" }} />
                )}
              </div>
              {i < arr.length - 1 && (
                <div style={{
                  width: 24,
                  height: 2,
                  background: "color-mix(in srgb, var(--cream) 15%, transparent)",
                  margin: "0 4px",
                  marginBottom: 28,
                }} />
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* Gate Grid */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }} style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--cream)", marginBottom: 12 }}>
          Evaluator Gates (11)
        </h2>
        <div style={{
          background: "var(--bg-deep)",
          borderRadius: 12,
          padding: 20,
          border: "1px solid color-mix(in srgb, var(--cream) 8%, transparent)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 8,
        }}>
          {data.gates.map((gate) => (
            <div key={gate} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 6,
              background: "color-mix(in srgb, var(--cream) 4%, transparent)",
            }}>
              <Shield size={14} style={{ color: "var(--gold)", opacity: 0.7 }} />
              <code style={{ fontSize: 11, color: "var(--cream)", opacity: 0.8 }}>{gate}</code>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 8, fontSize: 11, color: "var(--cream)", opacity: 0.4 }}>
          Gate status requires a live evaluation to display pass/fail per gate.
        </p>
      </motion.section>

      {/* Docker + Prefect */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }} style={{ marginTop: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <StatusCard
            title="Docker / Prefect Engine"
            icon={<Activity size={18} />}
            rows={[
              { label: "Compose file", value: data.docker.composeExists ? "EXISTS" : "MISSING" },
              { label: "Container health", value: data.docker.containerHealth || "unknown" },
              { label: "Prefect dashboard", value: data.prefect.health === "ok" ? "HEALTHY" : data.prefect.health || "unreachable" },
              { label: "Dashboard URL", value: data.prefect.dashboardUrl },
            ]}
          />
          <StatusCard
            title="Foundry Status"
            icon={<Shield size={18} />}
            rows={[
              { label: "Foundry path", value: data.foundry.exists ? "EXISTS" : "MISSING" },
              { label: "Grid reachability test", value: data.grid.reachabilityTest ? "EXISTS" : "MISSING" },
              { label: "MVP card on disk", value: data.evidence.mvpCardExists ? "YES" : "NO" },
              { label: "Production admissible", value: data.manifest.productionAdmissible === false ? "NO (M1)" : String(data.manifest.productionAdmissible) },
            ]}
          />
        </div>
      </motion.section>

      {/* Prime Directive */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }} style={{ marginTop: 24 }}>
        <div style={{
          background: "color-mix(in srgb, var(--rust) 8%, transparent)",
          borderRadius: 12,
          padding: 20,
          border: "1px solid color-mix(in srgb, var(--rust) 20%, transparent)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Shield size={18} style={{ color: "var(--rust)" }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)", margin: 0 }}>
              Gate-D: Zero Outward Action Without Human Approval
            </h3>
          </div>
          <p style={{ fontSize: 12, color: "var(--cream)", opacity: 0.6, margin: 0, lineHeight: 1.6 }}>
            The Instagram Commercial Lane is M1: effect-free by construction. No publish path, no provider adapter, no network import.
            Human approval is mandatory before any outward action. The old auto-publish engine failed 7/7 days — it is not resurrected.
          </p>
        </div>
      </motion.section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderRadius: 8,
      background: "color-mix(in srgb, var(--cream) 4%, transparent)",
    }}>
      <div style={{ color: "var(--gold)", opacity: 0.7 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 10, color: "var(--cream)", opacity: 0.5, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)" }}>{value}</div>
      </div>
    </div>
  );
}

function StatusCard({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: { label: string; value: string }[] }) {
  return (
    <div style={{
      background: "var(--bg-deep)",
      borderRadius: 12,
      padding: 20,
      border: "1px solid color-mix(in srgb, var(--cream) 8%, transparent)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ color: "var(--gold)" }}>{icon}</div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)", margin: 0 }}>{title}</h3>
      </div>
      {rows.map((row) => (
        <div key={row.label} style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "6px 0",
          borderBottom: "1px solid color-mix(in srgb, var(--cream) 4%, transparent)",
        }}>
          <span style={{ fontSize: 12, color: "var(--cream)", opacity: 0.5 }}>{row.label}</span>
          <span style={{ fontSize: 12, color: "var(--cream)", fontWeight: 500 }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}