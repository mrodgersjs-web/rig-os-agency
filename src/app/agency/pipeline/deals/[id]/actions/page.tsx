"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { ArrowRight, FileText, Mail, Trophy, XCircle, RotateCcw } from "lucide-react";

const STAGES = ["discovery", "qualified", "proposal", "negotiation", "closed"];

const ACTIONS = [
  { id: "advance", label: "Advance Stage", description: "Move deal to next pipeline stage", icon: ArrowRight, scope: "deal", action: "move", payload: { stage: "next" } },
  { id: "proposal", label: "Generate Proposal", description: "Draft a proposal for this deal", icon: FileText, scope: "deal", action: "proposal" },
  { id: "email", label: "Send Follow-up", description: "Email the prospect", icon: Mail, scope: "deal", action: "email" },
  { id: "close-won", label: "Mark Closed Won", description: "Close deal as won", icon: Trophy, scope: "deal", action: "move", payload: { stage: "closed" } },
  { id: "close-lost", label: "Mark Closed Lost", description: "Close deal as lost", icon: XCircle, scope: "deal", action: "move", payload: { stage: "closed" } },
];

export default function DealActionsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const runAction = useCallback(async (act: typeof ACTIONS[0]) => {
    setRunning(act.id);
    setResult(null);
    try {
      let payload = { ...act.payload };
      if (act.id === "advance") {
        // Need current stage to know next. Fetch deal first.
        const listR = await fetch("/api/agency/pipeline-deals?action=list");
        const listD = await listR.json();
        const deal = listD.deals.find((d: any) => d.id === id);
        if (deal) {
          const idx = STAGES.indexOf(deal.stage);
          payload = { stage: idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : deal.stage };
        }
      }
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: act.scope, action: act.action, id, payload }),
      });
      const data = await r.json();
      setResult(data);

      if (data.action === "open-copilot" && data.prompt) {
        window.dispatchEvent(new CustomEvent("open-copilot", { detail: data.prompt }));
      }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setRunning(null);
  }, [id]);

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Pipeline", href: "/agency/pipeline" }, { label: "Deals", href: "/agency/pipeline/deals/list" }, { label: "Actions" }]} />
      <PageHeader title="Deal Actions" subtitle={`Execute actions on deal ${id}`} />

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
              <act.icon size={14} style={{ color: act.id === "close-lost" ? "var(--rig-red)" : "var(--rig-gold)" }} />
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
