"use client";

import Panel from "../../components/Panel";

export default function RigStrategyPage() {
  return (
    <Panel title="RIG Strategy Studio" subtitle="7 Powers · Orthodoxy Map · Scenario Tree · Mechanism Map · Decision Memo" accent="claude">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <Card label="7 Powers" value="Active" accent="#ef4444" />
          <Card label="Scenario Tree" value="regret-min" accent="#60a5fa" />
          <Card label="Brier Gate" value="≤0.15" accent="#fbbf24" />
          <Card label="RIG-L Target" value="≥5" accent="#10b981" />
        </div>

        <Section title="Strategy Loops">
          <Tag>strategy-7powers</Tag>
          <Tag>orthodoxy-map</Tag>
          <Tag>scenario-tree</Tag>
          <Tag>mechanism-map</Tag>
          <Tag>decision-memo</Tag>
          <Tag>strategy-evolve</Tag>
        </Section>

        <Section title="7 Powers Analysis">
          <div style={{ marginTop: "1rem" }}>
            <PowerRow power="Scale economies" status="building" />
            <PowerRow power="Network effects" status="active" />
            <PowerRow power="Counter-positioning" status="active" />
            <PowerRow power="Switching costs" status="planning" />
            <PowerRow power="Branding" status="active" />
            <PowerRow power="Cornered resource" status="building" />
            <PowerRow power="Process power" status="active" />
          </div>
        </Section>

        <Section title="Active Strategy Memos">
          <div style={{ marginTop: "1rem" }}>
            <MemoRow title="RIG GTM: Fractional CAIO positioning" coord="L4-D2-A3-S" date="2026-07-01" />
            <MemoRow title="RIG LinkedIn: 8-vertical content engine" coord="L3-D2-A2-S" date="2026-07-01" />
            <MemoRow title="RIG App: Agent OS as control plane" coord="L5-D1-A3-S" date="2026-07-01" />
          </div>
        </Section>

        <Section title="Orthodoxy Map">
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: "rgba(203,198,192,0.6)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              20+ named orthodoxies mapped, each with anti-thesis and RIG mechanism.
            </p>
            <Tag>consulting = expensive</Tag>
            <Tag>AI = threat</Tag>
            <Tag>SMB = underserved</Tag>
            <Tag>fractional = niche</Tag>
            <Tag>content = marketing</Tag>
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
  return <span style={{ padding: "0.25rem 0.6rem", borderRadius: "0.4rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.75rem", color: "#fca5a5" }}>{children}</span>;
}

function PowerRow({ power, status }: { power: string; status: string }) {
  const colors: Record<string, string> = { active: "#10b981", building: "#fbbf24", planning: "#60a5fa" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "0.85rem", color: "rgba(203,198,192,0.8)" }}>{power}</span>
      <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "0.3rem", background: `${colors[status]}20`, color: colors[status], border: `1px solid ${colors[status]}40` }}>{status}</span>
    </div>
  );
}

function MemoRow({ title, coord, date }: { title: string; coord: string; date: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <span style={{ fontSize: "0.85rem", color: "rgba(203,198,192,0.8)" }}>{title}</span>
        <span style={{ fontSize: "0.7rem", color: "rgba(203,198,192,0.4)", marginLeft: "0.5rem" }}>{coord}</span>
      </div>
      <span style={{ fontSize: "0.7rem", color: "rgba(203,198,192,0.5)" }}>{date}</span>
    </div>
  );
}