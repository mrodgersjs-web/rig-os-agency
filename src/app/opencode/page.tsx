"use client";

import { useEffect, useState } from "react";
import Panel from "../../components/Panel";

export default function OpenCodePage() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [version, setVersion] = useState("");

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: "opencode --version 2>/dev/null || echo OFFLINE" }),
        });
        const data = await res.json();
        const out = data.stdout || "";
        if (out.includes("OFFLINE") || !out.trim()) {
          setStatus("offline");
        } else {
          setStatus("online");
          setVersion(out.trim());
        }
      } catch {
        setStatus("offline");
      }
    }
    check();
  }, []);

  return (
    <Panel title="OpenCode" subtitle="Free coding agent · OpenRouter · Groq · Ollama Cloud · RIG Swarm" accent="openclaw">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <Card label="Status" value={status === "checking" ? "…" : status.toUpperCase()} accent={status === "online" ? "#10b981" : "#ef4444"} />
          <Card label="Version" value={version || "N/A"} accent="#f472b6" />
          <Card label="Default Model" value="fugu-ultra" accent="#60a5fa" />
        </div>

        <Section title="Configured Providers">
          <Tag>RIG Swarm OS (local :4141)</Tag>
          <Tag>Ollama Cloud</Tag>
          <Tag>OpenRouter Free</Tag>
          <Tag>Groq Free Tier</Tag>
        </Section>

        <Section title="Subagents">
          <div style={{ marginTop: "1rem" }}>
            <SubagentRow name="explorer" model="ollama-cloud/gpt-oss:20b" desc="Fast explorer" />
            <SubagentRow name="free-code" model="openrouter/north-mini-code" desc="Free coding lane" />
            <SubagentRow name="free-heavy" model="openrouter/nemotron-3-ultra" desc="Free large-context" />
            <SubagentRow name="free-groq" model="groq/gpt-oss-120b" desc="Groq fast lane" />
          </div>
        </Section>

        <Section title="MCP Integrations">
          <Tag>pencil (windsurf)</Tag>
          <Tag>chrome-devtools</Tag>
          <Tag>codegraph</Tag>
          <Tag>hermes-rig</Tag>
        </Section>

        <Section title="Config">
          <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "0.75rem", background: "rgba(28,33,45,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ color: "rgba(203,198,192,0.6)", fontSize: "0.85rem" }}>
              Config at <code style={{ color: "var(--gold)" }}>~/.config/opencode/opencode.json</code>
            </p>
            <p style={{ color: "rgba(203,198,192,0.5)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
              Binary: <code style={{ color: "var(--accent-cyan)" }}>~/.hermes/node/bin/opencode</code>
            </p>
          </div>
        </Section>
      </div>
    </Panel>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(28,33,45,0.35)", border: `1px solid ${accent}33` }}>
      <div style={{ fontSize: "0.7rem", color: "rgba(203,198,192,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 600, color: accent }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h3 style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(203,198,192,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>{title}</h3>
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span style={{ padding: "0.25rem 0.6rem", borderRadius: "0.4rem", background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.2)", fontSize: "0.75rem", color: "#f9a8d4" }}>{children}</span>;
}

function SubagentRow({ name, model, desc }: { name: string; model: string; desc: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <span style={{ fontSize: "0.85rem", color: "rgba(203,198,192,0.8)" }}>{name}</span>
        <span style={{ fontSize: "0.7rem", color: "rgba(203,198,192,0.4)", marginLeft: "0.5rem" }}>{desc}</span>
      </div>
      <code style={{ fontSize: "0.7rem", color: "var(--accent-cyan)" }}>{model}</code>
    </div>
  );
}