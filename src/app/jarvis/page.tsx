"use client";

import { useEffect, useState } from "react";
import Panel from "../../components/Panel";

export default function JarvisPage() {
  const [jarvisStatus, setJarvisStatus] = useState<"checking" | "online" | "offline">("checking");
  const [jarvisVersion, setJarvisVersion] = useState("");

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: "which jarvis 2>/dev/null && jarvis --version 2>/dev/null || echo OFFLINE" }),
        });
        const data = await res.json();
        const out = data.stdout || "";
        if (out.includes("OFFLINE") || !out.trim()) {
          setJarvisStatus("offline");
        } else {
          setJarvisStatus("online");
          setJarvisVersion(out.trim().split("\n")[0]);
        }
      } catch {
        setJarvisStatus("offline");
      }
    }
    check();
  }, []);

  return (
    <Panel title="Jarvis" subtitle="Personal AI · Voice Assistant · Local-First" accent="hermes">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <Card label="Status" value={jarvisStatus === "checking" ? "…" : jarvisStatus.toUpperCase()} accent={jarvisStatus === "online" ? "#10b981" : "#ef4444"} />
          <Card label="Version" value={jarvisVersion || "N/A"} accent="#60a5fa" />
          <Card label="Mode" value="Local-First" accent="#fbbf24" />
        </div>

        <Section title="Capabilities">
          <Tag>voice-input</Tag>
          <Tag>voice-output</Tag>
          <Tag>local-models</Tag>
          <Tag>cloud-fallback</Tag>
          <Tag>energy-aware</Tag>
          <Tag>flop-aware</Tag>
          <Tag>learning-loop</Tag>
          <Tag>eval-harness</Tag>
        </Section>

        <Section title="Installation">
          <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "0.75rem", background: "rgba(28,33,45,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ color: "rgba(203,198,192,0.7)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              OpenJarvis is cloned at <code style={{ color: "var(--gold)" }}>~/OpenJarvis</code>
            </p>
            <p style={{ color: "rgba(203,198,192,0.5)", fontSize: "0.8rem" }}>
              Install: <code style={{ color: "var(--accent-cyan)" }}>curl -fsSL https://open-jarvis.github.io/OpenJarvis/install.sh | bash</code>
            </p>
            <p style={{ color: "rgba(203,198,192,0.5)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
              Start: <code style={{ color: "var(--accent-cyan)" }}>jarvis</code>
            </p>
          </div>
        </Section>

        <Section title="RIG Integration">
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: "rgba(203,198,192,0.6)", fontSize: "0.85rem" }}>
              Jarvis provides the voice interface layer for RIG Agent OS. Voice commands route through
              Hermes conductor → RIG goal loops → ProofPacket generation.
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
  return <span style={{ padding: "0.25rem 0.6rem", borderRadius: "0.4rem", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", fontSize: "0.75rem", color: "#93c5fd" }}>{children}</span>;
}