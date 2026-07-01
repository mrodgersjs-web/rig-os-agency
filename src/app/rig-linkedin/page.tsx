"use client";

import Panel from "../../components/Panel";

export default function RigLinkedInPage() {
  return (
    <Panel title="RIG LinkedIn Studio" subtitle="8 verticals · 7-agent panel · BDF30 scoring · 24/7 daemon">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <Card label="Verticals" value="8" accent="#0a66c2" />
          <Card label="Agents" value="7" accent="#a855f7" />
          <Card label="BDF Score" value="30σ" accent="#fbbf24" />
          <Card label="Daemon" value="24/7" accent="#10b981" />
        </div>

        <Section title="Verticals">
          <Tag>construction</Tag>
          <Tag>law</Tag>
          <Tag>healthcare</Tag>
          <Tag>dental</Tag>
          <Tag>cpa</Tag>
          <Tag>services</Tag>
          <Tag>manufacturing</Tag>
          <Tag>pe_cfo</Tag>
        </Section>

        <Section title="Agent Panel">
          <AgentRow name="Marcus Hale" role="Long-form Writer" />
          <AgentRow name="Dr. Iris Mendelson" role="Research Director" />
          <AgentRow name="Yara Okonkwo" role="Short-form Specialist" />
          <AgentRow name="Eleanor Quinn" role="Editor-in-Chief" />
          <AgentRow name="Cyrus Bell" role="Copy Editor" />
          <AgentRow name="Atticus Bell" role="Director" />
          <AgentRow name="Casper Lin" role="Trend Forecaster" />
        </Section>

        <Section title="Repository">
          <div style={{ fontSize: "0.875rem", opacity: 0.7, fontFamily: "monospace" }}>
            ~/Developer/RIGForge/repos/rig-linkedin-studio<br />
            github.com/rodgemd1-lgtm/rig-linkedin-studio (private)
          </div>
        </Section>

        <Section title="Approval Protocol">
          <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
            Weekly Monday approval only. Gate-D: NEVER bulk-approve/publish.
            Mike generates own images. Images: NO TEXT, Mike IN image, 16:9, soul_id 9257aaf0.
          </div>
        </Section>
      </div>
    </Panel>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      padding: "1rem", borderRadius: "0.5rem",
      background: "rgba(15,23,42,0.6)",
      border: `1px solid ${accent}33`, textAlign: "center",
    }}>
      <div style={{ fontSize: "0.625rem", textTransform: "uppercase", opacity: 0.5 }}>{label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 600, color: accent }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", opacity: 0.5, marginBottom: "0.75rem" }}>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>{children}</div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      padding: "0.25rem 0.75rem", borderRadius: "0.375rem",
      background: "rgba(10,102,194,0.15)", border: "1px solid rgba(10,102,194,0.3)",
      fontSize: "0.75rem", fontFamily: "monospace",
    }}>{children}</span>
  );
}

function AgentRow({ name, role }: { name: string; role: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
      fontSize: "0.875rem",
    }}>
      <span>{name}</span>
      <span style={{ opacity: 0.5 }}>{role}</span>
    </div>
  );
}