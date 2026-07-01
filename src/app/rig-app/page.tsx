"use client";

import Panel from "../../components/Panel";

export default function RigAppPage() {
  return (
    <Panel title="RIG App Studio" subtitle="Spec · Plan · Build · Twin Test · Build-vs-Buy · Retrofit" accent="openclaw">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <Card label="Active Builds" value="3" accent="#f472b6" />
          <Card label="Spec Synth" value="forced-guess=0" accent="#60a5fa" />
          <Card label="Build Mode" value="no-big-bang" accent="#fbbf24" />
          <Card label="Self-Verify" value="BLOCKED" accent="#ef4444" />
        </div>

        <Section title="App Studio Loops">
          <Tag>spec-synthesize</Tag>
          <Tag>plan-chunk</Tag>
          <Tag>build-evolve</Tag>
          <Tag>digital-twin-test</Tag>
          <Tag>build-vs-buy</Tag>
          <Tag>retrofit-studio</Tag>
        </Section>

        <Section title="Active Projects">
          <div style={{ marginTop: "1rem" }}>
            <ProjectRow name="RIG Agent OS Dashboard" status="building" coord="L5-D1-A3-S" progress={45} />
            <ProjectRow name="Paperclip Integration" status="building" coord="L4-D1-A3-S" progress={30} />
            <ProjectRow name="LinkedIn Studio Cockpit v2" status="active" coord="L3-D2-A2-S" progress={80} />
          </div>
        </Section>

        <Section title="Build-vs-Buy Decisions">
          <div style={{ marginTop: "1rem" }}>
            <DecisionRow item="Dashboard UI" decision="build" ev="+12" />
            <DecisionRow item="Agent orchestration" decision="paperclip" ev="+8" />
            <DecisionRow item="Voice/Jarvis" decision="build" ev="+5" />
            <DecisionRow item="SEO pipeline" decision="build" ev="+9" />
          </div>
        </Section>

        <Section title="Digital Twin Tests">
          <div style={{ marginTop: "1rem" }}>
            <TwinRow name="Agent OS launch flow" status="pass" />
            <TwinRow name="Paperclip onboarding" status="pending" />
            <TwinRow name="Goal loop execution" status="pass" />
          </div>
        </Section>

        <Section title="Build Constraints">
          <div style={{ marginTop: "1rem" }}>
            <Tag>no-self-verify</Tag>
            <Tag>no-big-bang</Tag>
            <Tag>chunked-delivery</Tag>
            <Tag>ProofPacket per transition</Tag>
            <Tag>gate before ship</Tag>
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

function ProjectRow({ name, status, coord, progress }: { name: string; status: string; coord: string; progress: number }) {
  const colors: Record<string, string> = { building: "#fbbf24", active: "#10b981" };
  return (
    <div style={{ padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
        <div>
          <span style={{ fontSize: "0.85rem", color: "rgba(203,198,192,0.8)" }}>{name}</span>
          <span style={{ fontSize: "0.7rem", color: "rgba(203,198,192,0.4)", marginLeft: "0.5rem" }}>{coord}</span>
        </div>
        <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "0.3rem", background: `${colors[status]}20`, color: colors[status], border: `1px solid ${colors[status]}40` }}>{status}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: colors[status], borderRadius: 2 }} />
      </div>
    </div>
  );
}

function DecisionRow({ item, decision, ev }: { item: string; decision: string; ev: string }) {
  const colors: Record<string, string> = { build: "#10b981", paperclip: "#60a5fa", buy: "#fbbf24" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "0.85rem", color: "rgba(203,198,192,0.8)" }}>{item}</span>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "0.3rem", background: `${colors[decision]}20`, color: colors[decision], border: `1px solid ${colors[decision]}40` }}>{decision}</span>
        <span style={{ fontSize: "0.7rem", color: "rgba(203,198,192,0.5)" }}>EV: {ev}</span>
      </div>
    </div>
  );
}

function TwinRow({ name, status }: { name: string; status: string }) {
  const colors: Record<string, string> = { pass: "#10b981", pending: "#fbbf24", fail: "#ef4444" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "0.85rem", color: "rgba(203,198,192,0.8)" }}>{name}</span>
      <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "0.3rem", background: `${colors[status]}20`, color: colors[status], border: `1px solid ${colors[status]}40` }}>{status}</span>
    </div>
  );
}