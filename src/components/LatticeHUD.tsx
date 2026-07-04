"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const C = {
  card: "var(--rig-card)",
  text: "var(--rig-text)",
  text2: "var(--rig-text-2)",
  text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)",
  border: "var(--rig-border)",
  gold: "var(--rig-gold)",
  goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)",
  emeraldBg: "var(--rig-emerald-bg)",
  red: "var(--rig-red)",
  redBg: "var(--rig-red-bg)",
  blue: "var(--rig-blue)",
  blueBg: "var(--rig-blue-bg)",
  purple: "var(--rig-purple)",
  purpleBg: "var(--rig-purple-bg)",
};

interface Mission {
  id: string;
  intent: string;
  coordinate: { level: number; diamond: number; mode: number; step: string };
  status: string;
  packets: any[];
}

const PRESETS = ["L1-D1-A1-I1", "L2-D2-A2-R", "L3-D1-A3-S", "L4-D3-A4-I2", "L5-D1-A1-Q2"];

export function LatticeHUD() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [coord, setCoord] = useState("L1-D1-A1-I1");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [approvalPrompt, setApprovalPrompt] = useState<{ missionId: string; coordinate: string; intent: string } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/lattice");
    const d = await r.json();
    setMissions(d.missions || []);
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load]);

  const handlerForCoord = (c: string) => {
    const parsed = parseCoord(c);
    if (parsed.mode === 1) return "deal-weighted-value";
    if (parsed.mode === 2) return "score-deal";
    if (parsed.mode === 3) return "research-agent";
    return "strategic-decision";
  };

  const run = async (approved = false, missionId?: string) => {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/lattice/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordinate: coord,
          intent: "Demo lattice execution",
          context: { a: 5, b: 7, stage: "proposal", value: 50000, topic: "AI agency OS", tools: ["web", "terminal"], option: "Expand to enterprise" },
          handler: handlerForCoord(coord),
          approved,
          missionId,
        }),
      });
      const d = await r.json();
      if (d.requiresApproval && d.mission?.id) {
        setApprovalPrompt({
          missionId: d.mission.id,
          coordinate: coord,
          intent: d.mission.intent,
        });
      } else {
        setApprovalPrompt(null);
      }
      setResult(d);
      load();
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const approve = () => {
    if (!approvalPrompt) return;
    run(true, approvalPrompt.missionId);
  };

  const deny = () => {
    setApprovalPrompt(null);
  };

  const modeColor = (mode: number) => {
    if (mode === 1) return { bg: C.blueBg, color: C.blue };
    if (mode === 2) return { bg: C.emeraldBg, color: C.emerald };
    if (mode === 3) return { bg: C.purpleBg, color: C.purple };
    return { bg: C.redBg, color: C.red };
  };

  return (
    <div className="rounded-lg border p-4 mb-6" style={{ background: C.card, borderColor: C.border }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold" style={{ color: C.text }}>RIG 3D Lattice</span>
          <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: C.goldBg, color: C.gold }}>Runtime Active</span>
          <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: C.blueBg, color: C.blue }}>Persistence On</span>
        </div>
        <div className="text-[11px]" style={{ color: C.mute }}>{missions.length} missions tracked</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {PRESETS.map(c => {
          const parsed = parseCoord(c);
          const mc = modeColor(parsed.mode);
          return (
            <button
              key={c}
              onClick={() => setCoord(c)}
              className="text-[10px] px-2 py-1 rounded border font-medium"
              style={{
                background: coord === c ? mc.bg : "transparent",
                borderColor: coord === c ? mc.color : C.border,
                color: coord === c ? mc.color : C.text3,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          value={coord}
          onChange={(e) => setCoord(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded border text-[12px] font-mono"
          style={{ background: "var(--rig-bg)", borderColor: C.border, color: C.text }}
        />
        <button
          onClick={() => run(false)}
          disabled={loading}
          className="px-3 py-1.5 rounded text-[12px] font-medium"
          style={{ background: C.goldBg, color: C.gold }}
        >
          {loading ? "Running..." : "Execute Cell"}
        </button>
      </div>

      {approvalPrompt && (
        <div className="rounded-lg border p-3 mb-3" style={{ background: C.redBg, borderColor: C.red }}>
          <div className="text-[12px] font-medium mb-2" style={{ color: C.red }}>A4 Approval Required</div>
          <div className="text-[11px] mb-2" style={{ color: C.text }}>
            Coordinate {approvalPrompt.coordinate} — {approvalPrompt.intent}
          </div>
          <div className="flex gap-2">
            <button onClick={approve} disabled={loading} className="px-3 py-1 rounded text-[11px] font-medium" style={{ background: C.emeraldBg, color: C.emerald }}>Approve</button>
            <button onClick={deny} disabled={loading} className="px-3 py-1 rounded text-[11px] font-medium" style={{ background: "transparent", color: C.text2, border: `1px solid ${C.border}` }}>Deny</button>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-lg border p-3 mb-3" style={{ background: "var(--rig-bg)", borderColor: C.border }}>
          <pre className="text-[10px] overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {missions.slice(-5).reverse().map((m) => {
          const mc = modeColor(m.coordinate.mode);
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between px-3 py-2 rounded-md text-[11px] border"
              style={{ background: "var(--rig-bg)", borderColor: C.border }}
            >
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: mc.bg, color: mc.color }}>
                  L{m.coordinate.level}-D{m.coordinate.diamond}-A{m.coordinate.mode}-{m.coordinate.step}
                </span>
                <span style={{ color: C.text2 }}>{m.intent}</span>
              </div>
              <span className="capitalize" style={{ color: m.status === "done" ? C.emerald : m.status === "blocked" ? C.red : C.gold }}>{m.status}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function parseCoord(c: string) {
  const m = c.match(/^L(\d)-D(\d)-A(\d)-(I1|Q1|R|S|Q2|P|I2)$/);
  return m ? { level: Number(m[1]), diamond: Number(m[2]), mode: Number(m[3]), step: m[4] } : { level: 1, diamond: 1, mode: 1, step: "I1" };
}
