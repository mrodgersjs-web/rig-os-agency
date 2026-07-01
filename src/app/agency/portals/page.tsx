"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  KeyRound,
  ExternalLink,
  Lock,
  Unlock,
  Copy,
  Check,
  Loader2,
  Shield,
  Users,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
interface PortalClient {
  id: string;
  name: string;
  vertical: string;
  status: string;
  health: string;
  serviceTier: string;
  monthlyFee: number;
  portalEnabled: boolean;
  portalToken: string | null;
  portalUrl: string | null;
}

const tierColors: Record<string, string> = {
  starter: "#999",
  growth: "#4a9eff",
  scale: "#c084fc",
  enterprise: "#fbbf24",
};

const healthColors: Record<string, string> = {
  green: "#5ab896",
  yellow: "#fbbf24",
  red: "#ef4444",
};

export default function PortalsPage() {
  const [clients, setClients] = useState<PortalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const res = await fetch("/api/agency/clients");
      const data = await res.json();
      setClients(data.clients || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function togglePortal(clientId: string) {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const enabling = !c.portalEnabled;
        return {
          ...c,
          portalEnabled: enabling,
          portalToken: enabling ? generateToken() : null,
          portalUrl: enabling
            ? `${window.location.origin}/portal/${generateToken()}`
            : null,
        };
      })
    );
  }

  function generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10)
    );
  }

  function copyToken(token: string, clientId: string) {
    navigator.clipboard.writeText(token);
    setCopiedId(clientId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const enabledCount = clients.filter((c) => c.portalEnabled).length;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: "#5ab896" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 48px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Client Portals
        </h1>
        <p style={{ color: "var(--cream-dim)", marginTop: 4 }}>
          Phase 8 — Multi-tenant client portal management. Each client gets a
          secure, token-based portal URL to view their contracts, invoices, and
          project status.
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <PortalStatCard
          icon={<Users size={20} />}
          label="Total Clients"
          value={clients.length}
          color="#4a9eff"
        />
        <PortalStatCard
          icon={<Unlock size={20} />}
          label="Portals Enabled"
          value={enabledCount}
          color="#5ab896"
        />
        <PortalStatCard
          icon={<Lock size={20} />}
          label="Portals Locked"
          value={clients.length - enabledCount}
          color="#999"
        />
        <PortalStatCard
          icon={<Shield size={20} />}
          label="Token Auth"
          value={100}
          suffix="%"
          color="#c084fc"
        />
      </div>

      {/* Portal Table */}
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-dim)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2fr 1fr 1fr 1fr 2fr 80px",
            padding: "12px 20px",
            borderBottom: "1px solid var(--border-dim)",
            fontSize: 11,
            textTransform: "uppercase",
            color: "var(--cream-dim)",
            letterSpacing: 0.5,
          }}
        >
          <span>Client</span>
          <span>Vertical</span>
          <span>Tier</span>
          <span>Health</span>
          <span>Portal URL</span>
          <span>Action</span>
        </div>

        {/* Rows */}
        {clients.map((client) => (
          <div
            key={client.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr 80px",
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-dim)",
              alignItems: "center",
              fontSize: 13,
            }}
          >
            {/* Client */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Building2 size={16} style={{ color: "var(--cream-dim)" }} />
              <div>
                <div style={{ fontWeight: 600 }}>{client.name}</div>
                <div style={{ fontSize: 11, color: "var(--cream-dim)" }}>
                  ${client.monthlyFee.toLocaleString()}/mo
                </div>
              </div>
            </div>

            {/* Vertical */}
            <span style={{ color: "var(--cream-dim)" }}>
              {client.vertical}
            </span>

            {/* Tier */}
            <span
              style={{
                color: tierColors[client.serviceTier] || "#999",
                textTransform: "capitalize",
                fontWeight: 600,
              }}
            >
              {client.serviceTier}
            </span>

            {/* Health */}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: healthColors[client.health] || "#999",
              }}
            >
              ● {client.health}
            </span>

            {/* Portal URL */}
            {client.portalEnabled ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                <code
                  style={{
                    background: "rgba(90,184,150,0.08)",
                    padding: "3px 8px",
                    borderRadius: 4,
                    color: "#5ab896",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {client.portalUrl}
                </code>
                <button
                  onClick={() =>
                    copyToken(client.portalToken!, client.id)
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--cream-dim)",
                    padding: 2,
                  }}
                >
                  {copiedId === client.id ? (
                    <Check size={14} style={{ color: "#5ab896" }} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            ) : (
              <span style={{ color: "#666", fontSize: 12 }}>— Disabled —</span>
            )}

            {/* Toggle */}
            <button
              onClick={() => togglePortal(client.id)}
              style={{
                background: client.portalEnabled
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(90,184,150,0.1)",
                border: `1px solid ${
                  client.portalEnabled ? "#ef4444" : "#5ab896"
                }`,
                color: client.portalEnabled ? "#ef4444" : "#5ab896",
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {client.portalEnabled ? "LOCK" : "OPEN"}
            </button>
          </div>
        ))}

        {clients.length === 0 && (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--cream-dim)",
            }}
          >
            No clients loaded. Add clients in the Clients page first.
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: "rgba(74,158,255,0.05)",
          border: "1px solid rgba(74,158,255,0.2)",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--cream-dim)",
          display: "flex",
          gap: 12,
        }}
      >
        <KeyRound size={20} style={{ color: "#4a9eff", flexShrink: 0 }} />
        <div>
          <strong style={{ color: "#4a9eff" }}>How portals work:</strong> Each
          enabled client gets a unique token-based URL. Anyone with the URL can
          view that client&apos;s dashboard, contracts, invoices, and project
          status — read-only, scoped to their data. Tokens can be regenerated at
          any time to revoke access.
        </div>
      </div>
    </div>
  );
}

function PortalStatCard({
  icon,
  label,
  value,
  color,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-dim)",
        borderRadius: 10,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 12, color: "var(--cream-dim)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700 }}>
        {value}
        {suffix}
      </div>
    </div>
  );
}
