"use client";

import Panel from "../../components/Panel";

export default function RigGTMPage() {
  return (
    <Panel title="RIG GTM Studio" subtitle="Offers · Campaigns · Market Maps · Proof-backed Sales">
      <div style={{ padding: "2rem", maxWidth: 900 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          <Card label="Apollo Campaign" value="6a397e9" accent="#10b981" />
          <Card label="Contacts" value="11" accent="#60a5fa" />
          <Card label="Domain" value="rodgersintelligence.com" accent="#fbbf24" />
        </div>

        <Section title="GTM Capabilities">
          <Tag>lead-scoring</Tag>
          <Tag>cold-email</Tag>
          <Tag>followup-cascade</Tag>
          <Tag>proposal-factory</Tag>
          <Tag>competitor-audit</Tag>
          <Tag>gtm-forecast</Tag>
          <Tag>strategy-7powers</Tag>
          <Tag>scenario-tree</Tag>
          <Tag>mechanism-map</Tag>
          <Tag>decision-memo</Tag>
        </Section>

        <Section title="Repository">
          <div style={{ fontSize: "0.875rem", opacity: 0.7, fontFamily: "monospace" }}>
            ~/Developer/RIGForge/repos/gtm-capabilities<br />
            ~/Developer/RIGForge/repos/rig-gtm-studio<br />
            github.com/rodgemd1-lgtm/rig-gtm-studio (private)
          </div>
        </Section>

        <Section title="Email Infrastructure">
          <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
            Google-only mail · SPF+DMARC live · DKIM not published<br />
            Apollo API: /v1/ search, /api/v1/ enroll<br />
            Campaign 6a397e9aa34af60020b5739c staged
          </div>
        </Section>

        <Section title="50 Goal Loops">
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
            GL-FS (7) Foundation & Spec · GL-BI (8) Build & Implementation<br />
            GL-VQ (7) Verification & Quality · GL-RI (7) Research & Intelligence<br />
            GL-GG (7) GTM & Growth · GL-CB (6) Content & Brand<br />
            GL-OF (7) Operations & Fleet · GL-SI (6) Scraping & Ingestion
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
      <div style={{ fontSize: "1rem", fontWeight: 600, color: accent }}>{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", opacity: 0.5, marginBottom: "0.75rem" }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-block", padding: "0.25rem 0.75rem", marginRight: "0.5rem", marginBottom: "0.5rem",
      borderRadius: "0.375rem", background: "rgba(16,185,129,0.15)",
      border: "1px solid rgba(16,185,129,0.3)", fontSize: "0.75rem", fontFamily: "monospace",
    }}>{children}</span>
  );
}