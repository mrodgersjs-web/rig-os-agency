"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { useDetail } from "@/components/DetailContext";
import { Bot, Play, Settings, ScrollText, CheckCircle2 } from "lucide-react";

const ACTIONS = [
  { id: "assign", label: "Assign Task", description: "Give this agent a task", icon: CheckCircle2, scope: "agent", action: "assign", prompt: "Task description:" },
  { id: "run", label: "Run Now", description: "Execute agent on demand", icon: Play, scope: "agent", action: "run", prompt: "Task to run:" },
  { id: "configure", label: "Configure", description: "Edit agent settings", icon: Settings, scope: "agent", action: "configure" },
  { id: "logs", label: "View Logs", description: "See recent agent runs", icon: ScrollText, scope: "agent", action: "logs" },
];

export default function AgentActionsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [input, setInput] = useState("");
  const [activeAction, setActiveAction] = useState<typeof ACTIONS[0] | null>(null);
  const { openCopilot } = useDetail();

  const runAction = useCallback(async (act: typeof ACTIONS[0]) => {
    if (act.prompt && !input) {
      setActiveAction(act);
      return;
    }
    setRunning(act.id);
    setResult(null);
    try {
      const payload: any = {};
      if (act.prompt) payload.task = input;
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: act.scope, action: act.action, id, payload }),
      });
      const data = await r.json();
      setResult(data);

      if (data.action === "open-copilot" && data.prompt) {
        openCopilot(data.prompt);
      }

      setInput("");
      setActiveAction(null);
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setRunning(null);
  }, [id, input]);

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Agents", href: "/agency/agents" }, { label: "Catalog", href: "/agency/agents/catalog/list" }, { label: "Actions" }]} />
      <PageHeader title="Agent Actions" subtitle={`Execute actions on agent ${id}`} />

      {activeAction?.prompt && (
        <div className="mb-4 rounded-lg border p-3" style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)" }}>
          <label className="block text-[12px] mb-1.5" style={{ color: "var(--rig-text-2)" }}>{activeAction.prompt}</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-2 py-1.5 rounded border text-[12px] mb-2"
            style={{ background: "var(--rig-bg)", borderColor: "var(--rig-border)", color: "var(--rig-text)" }}
            onKeyDown={(e) => { if (e.key === "Enter") runAction(activeAction); }}
          />
          <div className="flex gap-2">
            <button onClick={() => runAction(activeAction)} className="px-3 py-1 rounded text-[11px] font-medium" style={{ background: "var(--rig-gold-bg)", color: "var(--rig-gold)" }}>Confirm</button>
            <button onClick={() => { setActiveAction(null); setInput(""); }} className="px-3 py-1 rounded text-[11px]" style={{ color: "var(--rig-text-mute)" }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {ACTIONS.map((act) => (
          <button
            key={act.id}
            onClick={() => runAction(act)}
            disabled={running === act.id}
            className="text-left rounded-lg p-4 border transition hover:shadow-md disabled:opacity-50"
            style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <act.icon size={14} style={{ color: act.id === "run" ? "var(--rig-emerald)" : "var(--rig-purple)" }} />
              <span className="text-[14px] font-semibold" style={{ color: "var(--rig-text)" }}>{act.label}</span>
            </div>
            <div className="text-[12px]" style={{ color: "var(--rig-text-3)" }}>{act.description}</div>
          </button>
        ))}
      </div>

      {running && <div className="text-[12px]" style={{ color: "var(--rig-text-mute)" }}>Running {running}...</div>}
      {result && (
        <div className="rounded-lg border p-4" style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)" }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--rig-text-mute)" }}>Result</div>
          <pre className="text-[10px] overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
