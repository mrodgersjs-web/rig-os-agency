"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader } from "@/components/DepartmentUI";
import { Send, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

const ACTIONS = [
  { id: "send", label: "Send Invoice", description: "Email invoice to customer", icon: Send, scope: "invoice", action: "send" },
  { id: "mark-paid", label: "Mark Paid", description: "Record payment manually", icon: CheckCircle2, scope: "invoice", action: "paid" },
  { id: "void", label: "Void Invoice", description: "Cancel open invoice", icon: XCircle, scope: "invoice", action: "void" },
  { id: "refund", label: "Refund", description: "Issue a refund", icon: RotateCcw, scope: "invoice", action: "refund" },
];

export default function InvoiceActionsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const runAction = useCallback(async (act: typeof ACTIONS[0]) => {
    setRunning(act.id);
    setResult(null);
    try {
      const r = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: act.scope, action: act.action, id }),
      });
      const data = await r.json();
      setResult(data);
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setRunning(null);
  }, [id]);

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Revenue", href: "/agency/revenue" }, { label: "Invoices", href: "/agency/revenue/invoices/list" }, { label: "Actions" }]} />
      <PageHeader title="Invoice Actions" subtitle={`Execute actions on invoice ${id}`} />

      <div className="rounded-lg border p-3 mb-5 text-[12px]"
        style={{ background: "var(--rig-gold-bg)", borderColor: "var(--rig-gold)", color: "var(--rig-gold)" }}
      >
        These actions require a live Stripe connection. Results below show the honest state.
      </div>

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
