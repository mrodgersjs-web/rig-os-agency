"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader, StatCard } from "@/components/DepartmentUI";
import { Bot, Play, Settings, ScrollText, CheckCircle2, ArrowRight } from "lucide-react";

const C = {
  card: "var(--rig-card)", text: "var(--rig-text)", text2: "var(--rig-text-2)", text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)", border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)", purple: "var(--rig-purple)", purpleBg: "var(--rig-purple-bg)",
};

interface Agent {
  id: string;
  name: string;
  category: string;
  role: string;
  capabilities: string[];
  status: string;
  invocationPath?: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/agents");
      const d = await r.json();
      const found = (d.agents || []).find((a: Agent) => a.id === id);
      setAgent(found || null);
    } catch {
      setAgent(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="px-6 py-5">Loading agent...</div>;
  if (!agent) return <div className="px-6 py-5">Agent not found</div>;

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Agents", href: "/agency/agents" }, { label: agent.name }]} />
      <PageHeader title={agent.name} subtitle={`${agent.role} · ${agent.category} · ${agent.status}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Category" value={agent.category} icon={<span style={{ color: C.purple }}>C</span>} color={C.purple} bg={C.purpleBg} />
        <StatCard label="Status" value={agent.status} icon={<span style={{ color: C.emerald }}>●</span>} color={C.emerald} bg={C.emeraldBg} />
        <StatCard label="Capabilities" value={agent.capabilities.length} subtext="capabilities" icon={<span style={{ color: C.gold }}>K</span>} color={C.gold} bg={C.goldBg} />
        <StatCard label="Invoke" value={agent.invocationPath || agent.id} subtext="command path" icon={<span style={{ color: "var(--rig-blue)" }}>λ</span>} color="var(--rig-blue)" bg="var(--rig-blue-bg)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-[12px] uppercase tracking-wider font-semibold mb-3" style={{ color: C.mute }}>Capabilities</div>
            <div className="flex flex-wrap gap-1.5">
              {agent.capabilities.map((cap, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded border" style={{ borderColor: C.border, color: C.text2 }}>{cap}</span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.mute }}>Role Description</div>
            <p className="text-[13px]" style={{ color: C.text2 }}>{agent.role}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>Actions</div>
          {[
            { icon: CheckCircle2, label: "Assign Task", desc: "Give this agent a task", color: C.purple },
            { icon: Play, label: "Run Now", desc: "Execute agent on demand", color: C.emerald },
            { icon: Settings, label: "Configure", desc: "Edit agent settings", color: C.gold },
            { icon: ScrollText, label: "View Logs", desc: "See recent agent runs", color: C.gold },
          ].map(a => (
            <Link
              key={a.label}
              href={`/agency/agents/${id}/actions`}
              className="flex items-center gap-3 rounded-lg p-3 border transition hover:shadow-md"
              style={{ background: C.card, borderColor: C.border }}
            >
              <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ background: a.color + "15", color: a.color }}>
                <a.icon size={14} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium" style={{ color: C.text }}>{a.label}</div>
                <div className="text-[11px]" style={{ color: C.text3 }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
