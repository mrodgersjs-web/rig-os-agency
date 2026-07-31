"use client";

// ── RIG OS Agency — Jake Panel (is Jake using the fleet?) ────────────────
// Jake's journalled decisions (~/.rig/gtm/jake/decisions.jsonl), the current
// arm weights feeding _rank_by_arm_weight in the fire loop, and settlement
// state. Brier renders UNCOMPUTABLE until the S11 settler produces outcomes —
// a null is a fact about the loop, not a zero.
//
// Routes:
//   /agency/jake         — this surface
//   /api/agency/jake     — reads out/agency/jake-feed.json
// Generator: outbound.agency_os_feeds (fleet lane: agency-os-feeds).

import { useCallback, useEffect, useState } from "react";
import { Brain, AlertCircle, RefreshCw, Scale } from "lucide-react";

const C = {
  card: "var(--bg-card)", elev: "var(--bg-elev)", text: "var(--cream)",
  text2: "var(--cream-soft)", text3: "var(--cream-dim)", mute: "var(--cream-mute)",
  border: "var(--line-soft)", gold: "var(--gold)", emerald: "var(--emerald)",
  rust: "var(--rust)", plum: "var(--plum)",
};

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, minWidth: 150 }}>
      <div style={{ color: C.text3, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: C.text, fontSize: 24, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ color: C.mute, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function JakePage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    fetch("/api/agency/jake").then((r) => r.json()).then(setData).catch((e) => setErr(String(e)));
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 120_000); return () => clearInterval(t); }, [load]);

  if (err) return <div style={{ padding: 32, color: C.rust }}>fetch failed: {err}</div>;
  if (!data) return <div style={{ padding: 32, color: C.text3 }}>loading…</div>;
  if (!data.feed_available) return <div style={{ padding: 32, color: C.rust, fontSize: 13 }}>UNAVAILABLE — {data._source}</div>;

  const d = data.feed.decisions ?? {};
  const w = data.feed.arm_weights ?? {};
  const s = data.feed.settlement ?? {};
  const items: any[] = d.items ?? [];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1050 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Brain size={20} color={C.plum} />
        <h1 style={{ color: C.text, fontSize: 22, margin: 0 }}>Jake — Fleet Decisions</h1>
        <button onClick={load} style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text3, padding: "4px 10px", cursor: "pointer" }}><RefreshCw size={13} /></button>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
        <Tile label="Decisions journalled" value={d.available ? d.count : "UNAVAILABLE"} sub={d.source} />
        <Tile
          label="Settled / Brier"
          value={s.available ? <>{s.settled} · {s.brier == null ? <span style={{ color: C.rust, fontSize: 15 }}>UNCOMPUTABLE</span> : s.brier}</> : "UNAVAILABLE"}
          sub={s.brier_note ?? (s.available ? undefined : s.reason)}
        />
        <Tile
          label="Arm weights"
          value={w.available ? (w.uniform ? "UNIFORM" : Object.keys(w.weights).length) : "UNAVAILABLE"}
          sub={w.available ? w.note : w.reason}
        />
      </div>

      {d.available && (
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(d.by_family ?? {}).map(([fam, n]) => (
            <span key={fam} style={{ background: C.elev, border: `1px solid ${C.border}`, borderRadius: 999, padding: "4px 12px", color: C.text2, fontSize: 12 }}>
              {fam}: {String(n)}
            </span>
          ))}
        </div>
      )}

      {!w.available ? null : !w.uniform && (
        <div style={{ marginTop: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, color: C.text2, fontSize: 13, fontFamily: "monospace" }}>
          {JSON.stringify(w.weights)}
        </div>
      )}

      <div style={{ marginTop: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", color: C.text3, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, alignItems: "center" }}>
          <Scale size={13} /> Recent decisions (newest first)
        </div>
        {!d.available ? (
          <div style={{ padding: 16, color: C.rust, fontSize: 13 }}><AlertCircle size={13} /> {d.reason}</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 16, color: C.text3, fontSize: 13 }}>journal is empty (honest zero)</div>
        ) : (
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {items.slice(0, 60).map((r: any, i: number) => (
              <div key={i} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                  <span style={{ color: C.gold, fontFamily: "monospace", fontSize: 12 }}>{String(r.at || "").slice(0, 16)}</span>
                  <b style={{ color: C.text }}>{r.decision_id}</b>
                  <span style={{ color: C.text2 }}>{r.subject}</span>
                  <span style={{ color: r.chosen === "no-change" ? C.text3 : C.emerald }}>→ {r.chosen}</span>
                  <span style={{ color: C.mute, fontSize: 12 }}>conf {r.confidence} · {r.tier}{r.metric ? ` · metric ${r.metric}` : ""}</span>
                </div>
                {r.rationale && <div style={{ color: C.text3, fontSize: 12, marginTop: 3 }}>{r.rationale}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ color: C.mute, fontSize: 11, marginTop: 18, fontFamily: "monospace" }}>{data._source}</div>
    </div>
  );
}
