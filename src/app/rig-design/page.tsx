"use client";

import Panel from "../../components/Panel";

export default function RigDesignPage() {
  return (
    <Panel title="RIG Design Studio" subtitle="Brand · Sites · Creative Direction · Higgsfield Cinema · Deviation-scored" accent="hermes">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <Card label="Design System" value="Midnight Aubergine" accent="#a855f7" />
          <Card label="Image Engine" value="Higgsfield 3.0" accent="#ec4899" />
          <Card label="Mike Soul ID" value="9257aaf0" accent="#fbbf24" />
          <Card label="BDF Target" value="≥85σ" accent="#10b981" />
        </div>

        <Section title="Design Capabilities">
          <Tag>site-builder</Tag>
          <Tag>brand-assets</Tag>
          <Tag>design-system</Tag>
          <Tag>higgsfield-cinema</Tag>
          <Tag>image-generation</Tag>
          <Tag>reverse-render</Tag>
          <Tag>retrofit-studio</Tag>
          <Tag>website-goal</Tag>
        </Section>

        <Section title="Design System Tokens">
          <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            <TokenSwatch name="--bg-mid" color="#15151a" />
            <TokenSwatch name="--cream" color="#cbc6c0" />
            <TokenSwatch name="--gold" color="#fbbf24" />
            <TokenSwatch name="--claude" color="#d97757" />
            <TokenSwatch name="--hermes" color="#60a5fa" />
            <TokenSwatch name="--openclaw" color="#f472b6" />
            <TokenSwatch name="--accent-cyan" color="#22d3ee" />
            <TokenSwatch name="--line-soft" color="rgba(255,255,255,0.06)" />
            <TokenSwatch name="--panel-border" color="rgba(255,255,255,0.08)" />
          </div>
        </Section>

        <Section title="Higgsfield Cinema Studio">
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: "rgba(203,198,192,0.6)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              Image generation pipeline via Higgsfield.ai Cinema Studio 3.0.
              Soul IDs: <code style={{ color: "var(--gold)" }}>9257aaf0</code> (v3 cultural parody) · <code style={{ color: "var(--gold)" }}>a4c09954</code> (RIG brand)
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Tag>NO TEXT in images</Tag>
              <Tag>Mike IN every image</Tag>
              <Tag>16:9 aspect</Tag>
              <Tag>cultural-parody style</Tag>
            </div>
          </div>
        </Section>

        <Section title="Active Projects">
          <div style={{ marginTop: "1rem" }}>
            <ProjectRow name="rodgersintelligence.com" status="live" />
            <ProjectRow name="RIG LinkedIn Creative" status="daily" />
            <ProjectRow name="RIG App Studio UI" status="in-progress" />
          </div>
        </Section>
      </div>
    </Panel>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      padding: "1rem",
      borderRadius: "0.75rem",
      background: "rgba(28,33,45,0.35)",
      border: `1px solid ${accent}33`,
    }}>
      <div style={{ fontSize: "0.7rem", color: "rgba(203,198,192,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 600, color: accent }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h3 style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(203,198,192,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>{title}</h3>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      padding: "0.25rem 0.6rem",
      borderRadius: "0.4rem",
      background: "rgba(168,85,247,0.1)",
      border: "1px solid rgba(168,85,247,0.2)",
      fontSize: "0.75rem",
      color: "#c4b5fd",
    }}>{children}</span>
  );
}

function TokenSwatch({ name, color }: { name: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(28,33,45,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ width: 24, height: 24, borderRadius: 4, background: color, border: "1px solid rgba(255,255,255,0.1)" }} />
      <code style={{ fontSize: "0.7rem", color: "rgba(203,198,192,0.7)" }}>{name}</code>
    </div>
  );
}

function ProjectRow({ name, status }: { name: string; status: string }) {
  const colors: Record<string, string> = { live: "#10b981", daily: "#fbbf24", "in-progress": "#60a5fa" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "0.85rem", color: "rgba(203,198,192,0.8)" }}>{name}</span>
      <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "0.3rem", background: `${colors[status]}20`, color: colors[status], border: `1px solid ${colors[status]}40` }}>{status}</span>
    </div>
  );
}