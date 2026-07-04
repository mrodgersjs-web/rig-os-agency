"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Play, StepForward, CheckCircle2, XCircle, Pause, RotateCcw, Lock } from "lucide-react";

interface Harness {
  id: string;
  loopId: string;
  loopName: string;
  group: string;
  intent: string;
  status: string;
  currentStepIndex: number;
  steps: {
    index: number;
    coordinate: { level: number; diamond: number; mode: number; step: string };
    stepName: string;
    intent: string;
    status: string;
    missionId?: string;
    result?: any;
    error?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

const GROUP_COLORS: Record<string, string> = {
  Reasoning: "#60a5fa",
  Deviation: "#a855f7",
  GTM: "#10b981",
  Strategy: "#ef4444",
  Operations: "#5ab896",
  Finance: "#d4a574",
  Product: "#f472b6",
  Studios: "#ec4899",
  reasoning: "#60a5fa",
  deviation: "#a855f7",
  gtm: "#10b981",
  strategy: "#ef4444",
  operations: "#5ab896",
  finance: "#d4a574",
  product: "#f472b6",
  studios: "#ec4899",
};

export default function HarnessRunPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [harness, setHarness] = useState<Harness | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/harness?id=${id}`);
    const d = await r.json();
    if (d.harness) setHarness(d.harness);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const action = async (actionName: string, extra?: any) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/harness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName, id, ...extra }),
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setHarness(d.harness);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  if (!harness) {
    return (
      <div className="px-6 py-8">
        <Link href="/rig-harness" className="text-[12px] flex items-center gap-1 mb-4" style={{ color: "var(--rig-text-2)" }}>
          <ArrowLeft size={14} /> Back to harnesses
        </Link>
        <div className="text-[14px]">Loading harness...</div>
      </div>
    );
  }

  const color = GROUP_COLORS[harness.group] || "#a855f7";
  const currentStep = harness.steps[harness.currentStepIndex];
  const isBlocked = harness.status === "blocked";

  return (
    <div className="px-6 py-5 pb-20">
      <Link href="/rig-harness" className="text-[12px] flex items-center gap-1 mb-4" style={{ color: "var(--rig-text-2)" }}>
        <ArrowLeft size={14} /> Back to harnesses
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: `${color}22`, color }}>{harness.group}</span>
            <span className="text-[10px] font-mono" style={{ color: "var(--rig-text-3)" }}>{harness.id}</span>
          </div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--rig-text)" }}>{harness.loopName}</h1>
          <p className="text-[13px]" style={{ color: "var(--rig-text-2)" }}>{harness.intent}</p>
        </div>
        <div className="flex items-center gap-2">
          {harness.status !== "done" && (
            <button
              onClick={() => action("run")}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-[12px] font-medium"
              style={{ background: "var(--rig-gold-bg)", color: "var(--rig-gold)" }}
            >
              <Play size={14} /> Run All
            </button>
          )}
          {isBlocked && (
            <button
              onClick={() => action("approve")}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-[12px] font-medium"
              style={{ background: "var(--rig-emerald-bg)", color: "var(--rig-emerald)" }}
            >
              <Lock size={14} /> Approve
            </button>
          )}
          <button
            onClick={() => action("run-step")}
            disabled={loading || harness.status === "done" || isBlocked}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-[12px] font-medium border"
            style={{ background: "var(--rig-card)", color: "var(--rig-text)", borderColor: "var(--rig-border)" }}
          >
            <StepForward size={14} /> Step
          </button>
          <button
            onClick={() => action("reset")}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-[12px] font-medium border"
            style={{ background: "var(--rig-card)", color: "var(--rig-text-2)", borderColor: "var(--rig-border)" }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border p-3 mb-4" style={{ background: "var(--rig-red-bg)", borderColor: "var(--rig-red)" }}>
          <div className="text-[12px] font-medium" style={{ color: "var(--rig-red)" }}>{error}</div>
        </div>
      )}

      <div className="rounded-lg border p-4 mb-6" style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)" }}>
        <div className="text-[12px] font-medium mb-3" style={{ color: "var(--rig-text)" }}>IQRSQPI Pipeline</div>
        <div className="flex flex-col gap-2">
          {harness.steps.map((step, i) => {
            const isCurrent = i === harness.currentStepIndex;
            const stepColor = step.status === "done" ? "var(--rig-emerald)" : step.status === "blocked" ? "var(--rig-red)" : step.status === "running" ? "var(--rig-gold)" : "var(--rig-text-3)";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-md border"
                style={{
                  background: isCurrent ? "var(--rig-bg)" : "transparent",
                  borderColor: isCurrent ? color : "var(--rig-border)",
                }}
              >
                <div className="mt-0.5">
                  {step.status === "done" ? <CheckCircle2 size={16} style={{ color: "var(--rig-emerald)" }} /> :
                   step.status === "blocked" ? <XCircle size={16} style={{ color: "var(--rig-red)" }} /> :
                   step.status === "running" ? <Play size={16} style={{ color: "var(--rig-gold)" }} /> :
                   <div className="w-4 h-4 rounded-full border" style={{ borderColor: "var(--rig-border)" }} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${stepColor}22`, color: stepColor }}>
                      L{step.coordinate.level}-D{step.coordinate.diamond}-A{step.coordinate.mode}-{step.coordinate.step}
                    </span>
                    <span className="text-[11px] font-medium capitalize" style={{ color: stepColor }}>{step.status}</span>
                  </div>
                  <div className="text-[12px] mb-1" style={{ color: "var(--rig-text)" }}>{step.intent}</div>
                  {step.error && <div className="text-[11px]" style={{ color: "var(--rig-red)" }}>{step.error}</div>}
                  {step.result && <pre className="text-[10px] mt-1 overflow-auto" style={{ color: "var(--rig-text-2)" }}>{JSON.stringify(step.result, null, 2)}</pre>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="text-[11px]" style={{ color: "var(--rig-text-3)" }}>
        Created {new Date(harness.createdAt).toLocaleString()} · Updated {new Date(harness.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
