"use client";

// ── RIG OS Agency — KPI Scorecard ────────────────────────────────────────
// The daily scorecard from gtmfleet.standard.scorecard's real queries:
// calls_held / replies_unworked headline, the Aug-5 kill rule, the leading
// indicators, and the single most-important action. A KPI whose source could
// not be measured renders UNAVAILABLE — never 0.
//
// Routes:
//   /agency/scorecard        — this surface
//   /api/agency/scorecard    — reads out/agency/scorecard-feed.json
// Generator: outbound.agency_os_feeds (fleet lane: agency-os-feeds).

import { useCallback, useEffect, useState } from "react";
import { Gauge, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";

const C = {
  card: "var(--bg-card)", elev: "var(--bg-elev)", text: "var(--cream)",
  text2: "var(--cream-soft)", text3: "var(--cream-dim)", mute: "var(--cream-mute)",
  border: "var(--line-soft)", gold: "var(--gold)", emerald: "var(--emerald)",
  rust: "var(--rust)",
};

const STATUS_COLOR: Record<string, string> = {
  GREEN: C.emerald, AMBER: C.gold, RED: C.rust, UNKNOWN: C.mute,
};

function KpiTile({ k, big }: { k: any; big?: boolean }) {
  const color = STATUS_COLOR[k?.status] ?? C.mute;
  return (
    <div style={{ background: C.card, border: `1px solid ${big ? color : C.border}`, borderRadius: 12, padding: 16, minWidth: big ? 220 : 170, flex: big ? 1 : undefined }}>
      <div style={{ color: C.text3, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>{k?.name ?? k?.key}</div>
      <div style={{ color, fontSize: big ? 34 : 22, marginTop: 4, fontWeight: 600 }}>
        {k?.available === false ? "UNAVAILABLE" : k?.render ?? "—"}
        <span style={{ color: C.mute, fontSize: 12, fontWeight: 400, marginLeft: 8 }}>
          target {k?.target} · {k?.status}
        </span>
      </div>
      {big && <div style={{ color: C.mute, fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>{k?.definition}</div>}
      {k?.available === false && <div style={{ color: C.rust, fontSize: 11, marginTop: 4 }}>{k?.reason}</div>}
    </div>
  );
}

export default function ScorecardPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    fetch("/api/agency/scorecard").then((r) => r.json()).then(setData).catch((e) => setErr(String(e)));
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 300_000); return () => clearInterval(t); }, [load]);

  if (err) return <div style={{ padding: 32, color: C.rust }}>fetch failed: {err}</div>;
  if (!data) return <div style={{ padding: 32, color: C.text3 }}>loading…</div>;
  if (!data.feed_available) return <div style={{ padding: 32, color: C.rust, fontSize: 13 }}>UNAVAILABLE — {data._source}</div>;

  const f = data.feed;
  if (f.available === false) {
    return <div style={{ padding: 32, color: C.rust, fontSize: 13 }}>scorecard build UNAVAILABLE — {f.reason}</div>;
  }
  const kpis = f.kpis ?? {};
  const order: string[] = f.headline_order ?? Object.keys(kpis);
  const headline = order.slice(0, 2).map((k) => kpis[k]).filter(Boolean);
  const rest = order.slice(2).map((k) => kpis[k]).filter(Boolean);
  const kill = f.kill ?? {};
  const action = f.action ?? {};

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1050 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Gauge size={20} color={C.gold} />
        <h1 style={{ color: C.text, fontSize: 22, margin: 0 }}>KPI Scorecard — {f.day}</h1>
        <button onClick={load} style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text3, padding: "4px 10px", cursor: "pointer" }}><RefreshCw size={13} /></button>
      </div>

      {kill?.kill_date && (
        <div style={{ marginTop: 14, background: "rgba(201,124,94,0.10)", border: `1px solid ${C.rust}`, borderRadius: 12, padding: "12px 16px", color: C.text2, fontSize: 14, display: "flex", gap: 10, alignItems: "center" }}>
          <AlertTriangle size={16} color={C.rust} />
          <span>
            <b style={{ color: C.rust }}>Kill rule: {kill.kill_date} ({kill.days_remaining} days)</b>
            {" — "}{kill.worked_replies}/{kill.worked_replies_needed} worked replies · {kill.calls_held} calls held · {kill.fired ? "FIRED" : "not fired"}
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
        {headline.map((k: any) => <KpiTile key={k.key} k={k} big />)}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {rest.map((k: any) => <KpiTile key={k.key} k={k} />)}
      </div>

      {action?.action && (
        <div style={{ marginTop: 18, background: C.card, border: `1px solid ${C.gold}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: C.text3, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Most important action</div>
          <div style={{ color: C.text, fontSize: 15, display: "flex", gap: 8, alignItems: "center" }}>
            <ArrowRight size={15} color={C.gold} /> {action.action}
          </div>
          <div style={{ color: C.text3, fontSize: 13, marginTop: 4 }}>{action.why}</div>
          {action.how && <div style={{ color: C.mute, fontSize: 12, marginTop: 6, fontFamily: "monospace" }}>{action.how}</div>}
        </div>
      )}

      {f.counts && (
        <div style={{ color: C.text3, fontSize: 12, marginTop: 14 }}>
          deliverables {f.counts.deliverables_met}/{f.counts.deliverables_total} met · {f.counts.kpi_red} KPIs red · lanes GREAT {f.counts.lanes_great} / weak {f.counts.lanes_weak}
        </div>
      )}

      <div style={{ color: C.mute, fontSize: 11, marginTop: 18, fontFamily: "monospace" }}>{data._source}</div>
    </div>
  );
}
