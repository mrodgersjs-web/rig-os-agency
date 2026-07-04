"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { FileText, Mail, Calendar, Paperclip, RefreshCw } from "lucide-react";

const ACTIONS = [
  { id: "proposal", label: "Create Proposal", description: "Generate a new proposal", icon: FileText, scope: "client", action: "proposal" },
  { id: "email", label: "Send Email", description: "Email primary contact", icon: Mail, scope: "client", action: "email" },
  { id: "meeting", label: "Schedule Meeting", description: "Book a calendar slot", icon: Calendar, scope: "client", action: "meeting" },
  { id: "note", label: "Add Note", description: "Log a client note", icon: Paperclip, scope: "client", action: "note", prompt: "Note:" },
  { id: "renew", label: "Renew Contract", description: "Renew or upgrade service tier", icon: RefreshCw, scope: "client", action: "renew" },
];

export default function ClientActionsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [input, setInput] = useState("");
  const [activeAction, setActiveAction] = useState<typeof ACTIONS[0] | null>(null);

  const runAction = useCallback(async (act: typeof ACTIONS[0]) => {
    if (act.prompt && !input) {
      setActiveAction(act);
      return;
    }
    setRunning(act.id);
    setResult(null);
    try {
      const payload: any = {};
      if (act.prompt && act.action === "note") payload.note = input;
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: act.scope, action: act.action, id, payload }),
      });
      const data = await r.json();
      setResult(data);

      if (data.action === "open-copilot" && data.prompt) {
        window.dispatchEvent(new CustomEvent("open-copilot", { detail: data.prompt }));
      } else if (data.action === "open-mailto" && data.url) {
        window.open(data.url, "_blank");
      } else if (data.action === "open-calendar" && data.url) {
        window.open(data.url, "_blank");
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
      <PageBreadcrumbs items={[{ label: "Clients", href: "/agency/clients" }, { label: "Actions" }]} />
      <PageHeader title="Client Actions" subtitle={`Execute actions on client ${id}`} />

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
              <act.icon size={14} style={{ color: "var(--rig-gold)" }} />
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
