// src/app/agency/forecast/page.tsx
// Bayesian channel calibration dashboard — surfaces /api/agency/forecast.
// Midnight Aubergine design. Real data from outcome-ledger → forecast-eval
// → calibrated priors. No fabricated numbers.

"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Activity, ChevronDown, ChevronRight, Sigma, Target, Zap,
} from "lucide-react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader, StatCard } from "@/components/DepartmentUI";

const C = {
  bg: "var(--bg-deep)", bgMid: "var(--bg-mid)", card: "var(--bg-card)",
  text: "var(--cream)", text2: "var(--cream-soft)", text3: "var(--cream-dim)",
  border: "var(--line-soft)", borderHot: "var(--line)",
  gold: "var(--gold)", emerald: "var(--emerald)", red: "var(--rust)",
  plum: "var(--plum)", blue: "#60a5fa",
};

interface ChannelRow {
  channel: string;
  priorDefault: number;
  n: number;
  replies: number;
  observedReplyRate: number;
  meanPredictedP: number;
  brier: number;
  posterior: { alpha: number; beta: number; mean: number };
  status: "insufficient" | "calibrating" | "calibrated";
  resolution: { available: boolean; note: string };
  updatedAt: string;
}

interface ForecastReport {
  channels: ChannelRow[];
  totalObserved: number;
  anyCalibrated: boolean;
  writtenTo: string;
}

interface ForecastResponse {
  ok: boolean;
  source?: string;
  report: ForecastReport;
  ledgerCounts: { total: number; withReplyOutcome: number };
  error?: string;
}

const STATUS_STYLE = {
  insufficient: { color: C.text3, bg: "rgba(255,255,255,0.04)", label: "Insufficient Data" },
  calibrating:  { color: C.gold,  bg: "rgba(212,165,116,0.12)", label: "Calibrating" },
  calibrated:   { color: C.emerald, bg: "rgba(90,184,150,0.12)", label: "Calibrated" },
} as const;

function fmtPct(p: number): string {
  if (p == null || isNaN(p)) return "—";
  return `${(p * 100).toFixed(2)}%`;
}

function fmtNumber(n: number, digits = 3): string {
  if (n == null || isNaN(n)) return "—";
  return n.toFixed(digits);
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/agency/forecast", { cache: "no-store" });
      const j = (await r.json()) as ForecastResponse;
      if (!j.ok) throw new Error(j.error || "forecast fetch failed");
      setData(j);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
    setLoading(false);
  }, []);

  const recompute = useCallback(async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/agency/forecast?action=recompute", { method: "POST" });
      const j = await r.json();
      if (j?.report) setData({ ok: true, source: "recomputed", report: j.report, ledgerCounts: data?.ledgerCounts || { total: 0, withReplyOutcome: 0 } });
    } catch {}
    setBusy(false);
    load();
  }, [load, data]);

  useEffect(() => { load(); }, [load]);

  const channels = data?.report?.channels ?? [];
  const totalObs = data?.report?.totalObserved ?? 0;
  const anyCalibrated = data?.report?.anyCalibrated ?? false;
  const ledgerCounts = data?.ledgerCounts || { total: 0, withReplyOutcome: 0 };

  return (
    <div className="px-6 py-5 pb-20" style={{ color: C.text }}>
      <PageBreadcrumbs items={[{ label: "Forecast & Calibration" }]} />
      <PageHeader
        title="Forecast & Calibration"
        subtitle="Bayesian channel calibration — does P(reply) match reality?"
        action={{ label: busy ? "Running…" : "Recompute", onClick: recompute, icon: <RefreshCw size={12} className={busy ? "animate-spin" : ""} /> }}
      />

      {error && (
        <div className="rounded-lg p-3 mb-5 flex items-center gap-2 text-[12px]" style={{ background: "rgba(196,96,126,0.12)", border: `1px solid ${C.red}33`, color: C.red }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Channels Tracked"
          value={String(channels.length)}
          sub={data?.source ? `source: ${data.source}` : "—"}
          icon={<Activity size={14} />}
        />
        <StatCard
          label="Observed Outcomes"
          value={String(totalObs)}
          sub={`ledger has ${ledgerCounts.total} decisions`}
          icon={<Target size={14} />}
        />
        <StatCard
          label="Reply Outcomes"
          value={String(ledgerCounts.withReplyOutcome)}
          sub="used to compute Brier"
          icon={<Sigma size={14} />}
        />
        <StatCard
          label="Calibration Status"
          value={anyCalibrated ? "Ready" : "Learning"}
          sub={anyCalibrated ? "≥30 obs on ≥1 channel" : "needs ≥5 obs per channel"}
          icon={anyCalibrated ? <CheckCircle2 size={14} /> : <Clock size={14} />}
        />
      </div>

      {/* Channel table */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: C.text2 }}>
            <TrendingUp size={14} color={C.gold} />
            <span style={{ fontWeight: 600 }}>Channel Calibration</span>
            <span style={{ color: C.text3 }}>·</span>
            <span style={{ color: C.text3 }}>Brier score = mean(predicted − actual)²</span>
          </div>
          {data?.report?.writtenTo && (
            <code className="text-[11px]" style={{ color: C.text3, fontFamily: "'JetBrains Mono', monospace" }}>
              {data.report.writtenTo}
            </code>
          )}
        </div>

        {loading && channels.length === 0 ? (
          <div className="p-8 text-center text-[13px]" style={{ color: C.text3 }}>
            Loading calibration…
          </div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center text-[13px]" style={{ color: C.text3 }}>
            <Zap size={18} color={C.gold} className="inline-block mr-2" />
            No channel calibration data yet. Record some reply outcomes via the decision ledger to populate this view.
            <div className="mt-2 text-[11px]" style={{ color: C.text3, fontFamily: "'JetBrains Mono', monospace" }}>
              POST /api/agency/forecast?action=plant&decisionId=…&replied=true
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: C.border }}>
            {channels.map((c) => {
              const st = STATUS_STYLE[c.status];
              const lift = c.observedReplyRate - c.priorDefault;
              const isOpen = expanded === c.channel;
              const detail = c.resolution?.note;
              return (
                <div key={c.channel} style={{ borderColor: C.border }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : c.channel)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    {isOpen ? <ChevronDown size={14} color={C.text3} /> : <ChevronRight size={14} color={C.text3} />}
                    <div className="font-mono text-[12px] flex-1" style={{ color: C.text2 }}>
                      {c.channel}
                    </div>
                    <div className="text-[11px] tabular-nums w-16 text-right" style={{ color: C.text3 }}>n={c.n}</div>
                    <div className="text-[11px] tabular-nums w-16 text-right" style={{ color: C.text3 }}>{c.replies}r</div>
                    <div className="text-[11px] tabular-nums w-20 text-right" style={{ color: C.text }}>{fmtPct(c.priorDefault)}</div>
                    <div className="text-[11px] tabular-nums w-20 text-right" style={{ color: C.text }}>{fmtPct(c.observedReplyRate)}</div>
                    <div className="text-[11px] tabular-nums w-20 text-right" style={{ color: Math.abs(lift) < 0.02 ? C.text : lift > 0 ? C.emerald : C.red }}>
                      {lift >= 0 ? "+" : ""}{(lift * 100).toFixed(2)}%
                    </div>
                    <div className="text-[11px] tabular-nums w-20 text-right" style={{ color: c.brier < 0.15 ? C.emerald : c.brier < 0.25 ? C.gold : C.red }}>
                      {fmtNumber(c.brier)}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-10 py-3 text-[11px]"
                      style={{ background: "rgba(255,255,255,0.02)", color: C.text3 }}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <div style={{ color: C.text3 }}>Posterior Mean</div>
                          <div className="font-mono" style={{ color: C.text }}>{fmtPct(c.posterior.mean)}</div>
                        </div>
                        <div>
                          <div style={{ color: C.text3 }}>Beta(α, β)</div>
                          <div className="font-mono" style={{ color: C.text }}>{fmtNumber(c.posterior.alpha, 1)}, {fmtNumber(c.posterior.beta, 1)}</div>
                        </div>
                        <div>
                          <div style={{ color: C.text3 }}>Resolution</div>
                          <div style={{ color: c.resolution.available ? C.emerald : C.text3 }}>
                            {c.resolution.available ? "available" : "not yet"}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: C.text3 }}>Updated</div>
                          <div className="font-mono" style={{ color: C.text }}>{new Date(c.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                      {detail && (
                        <div className="mt-3 italic" style={{ color: C.text3 }}>{detail}</div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / source */}
      <div className="mt-4 text-[11px]" style={{ color: C.text3 }}>
        Source: <code style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace" }}>src/lib/forecast-eval.ts</code>
        {" "}— Beta-Binomial posterior per channel. Honest two-stat split: Brier (calibration) reported, resolution explicitly null until segment-level outcomes exist.
        {" "}Recompute writes <code style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace" }}>data/calibrated-priors.json</code>.
      </div>
    </div>
  );
}
