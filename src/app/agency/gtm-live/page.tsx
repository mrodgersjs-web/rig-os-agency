"use client";

// ── RIG OS Agency — GTM Live (is commenting working?) ────────────────────
// Answers Mike's exact complaint "I don't see auto commenting working" at a
// glance: today's ACTUAL fires (time, target, the comment text, verified),
// the cap spend, the cadence gate's live verdict, and the harvested->acted
// funnel with the skip reasons.
//
// Routes:
//   /agency/gtm-live         — this surface
//   /api/agency/gtm-live     — reads out/agency/gtm-live-feed.json
// Generator: outbound.agency_os_feeds (fleet lane: agency-os-feeds).
// Every number here traces to a named artifact; UNAVAILABLE renders as
// UNAVAILABLE, never as 0.

import { useCallback, useEffect, useState } from "react";
import {
  Radio, ExternalLink, CheckCircle2, AlertCircle, Clock,
  Filter, RefreshCw, ShieldCheck,
} from "lucide-react";

const C = {
  card: "var(--bg-card)", text: "var(--cream)", text2: "var(--cream-soft)",
  text3: "var(--cream-dim)", mute: "var(--cream-mute)",
  border: "var(--line-soft)", gold: "var(--gold)",
  emerald: "var(--emerald)", plum: "var(--plum)", rust: "var(--rust)",
};

function Unavailable({ reason }: { reason?: string }) {
  return (
    <div style={{ color: C.rust, fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      <AlertCircle size={14} /> UNAVAILABLE{reason ? ` — ${reason}` : ""}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ color: C.text3, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function GtmLivePage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/agency/gtm-live")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (err) return <div style={{ padding: 32, color: C.rust }}>fetch failed: {err}</div>;
  if (!data) return <div style={{ padding: 32, color: C.text3 }}>loading…</div>;
  if (!data.feed_available) {
    return (
      <div style={{ padding: 32 }}>
        <Unavailable reason={data.error} />
        <div style={{ color: C.mute, fontSize: 12, marginTop: 8, fontFamily: "monospace" }}>{data._source}</div>
      </div>
    );
  }

  const f = data.feed;
  const fires = f.fires ?? {};
  const cap = f.cap ?? {};
  const cadence = f.cadence ?? {};
  const funnel = f.funnel ?? {};
  const fu = funnel.funnel ?? {};

  const gateLabel = !cadence.available
    ? "GATE UNAVAILABLE"
    : cadence.ok
      ? "GATE: CLEAR TO FIRE"
      : `GATE HOLDING — ${String(cadence.reason || "").split(":")[0]}`;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      {/* headline — the 5-second answer */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <Radio size={20} color={C.emerald} />
        <h1 style={{ color: C.text, fontSize: 22, margin: 0 }}>GTM Live — Comment Lane</h1>
        <button onClick={load} style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text3, padding: "4px 10px", cursor: "pointer" }}>
          <RefreshCw size={13} />
        </button>
      </div>
      <div style={{ color: C.text2, fontSize: 15, marginBottom: 20 }}>
        {fires.available === false
          ? "fire log UNAVAILABLE"
          : <>COMMENTING IS {fires.count > 0 ? "LIVE" : "ARMED"} — <b style={{ color: C.gold }}>{fires.count} comment{fires.count === 1 ? "" : "s"} posted today</b>
            {cap.available ? <> · cap {cap.spent}/{cap.daily_cap} spent, {cap.remaining} remaining</> : <> · cap UNAVAILABLE</>}
            {" · "}<span style={{ color: cadence.ok ? C.emerald : C.gold }}>{gateLabel}</span>
            {cadence.next_ok_at_local && !cadence.ok ? ` (next legal fire ${new Date(cadence.next_ok_at_local).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}
          </>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="Cadence gate (live verdict)">
          {!cadence.available ? <Unavailable reason={cadence.reason} /> : (
            <div style={{ color: C.text2, fontSize: 13, lineHeight: 1.7 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", color: cadence.ok ? C.emerald : C.gold }}>
                {cadence.ok ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                <b>{cadence.ok ? "would allow a fire right now" : cadence.reason}</b>
              </div>
              <div style={{ color: C.text3 }}>window {cadence.window}</div>
              <div style={{ color: C.mute, fontSize: 12 }}>
                min gap {Math.round((cadence.rules?.min_gap_seconds ?? 0) / 60)}min + jitter · max {cadence.rules?.per_hour_cap}/rolling hour
              </div>
            </div>
          )}
        </Card>
        <Card title={`Funnel — ${funnel.day ?? "today"} (verdict: ${funnel.verdict ?? "?"})`}>
          {!funnel.available ? <Unavailable reason={funnel.reason} /> : (
            <div style={{ color: C.text2, fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ fontFamily: "monospace", fontSize: 13 }}>
                harvested {fu.harvested} → fresh {fu.fresh} → icp {fu.icp_ok} → gates {Math.min(fu.surface_ok ?? 0, fu.draft_ok ?? 0)} → <b style={{ color: C.gold }}>acted {fu.acted}</b>
              </div>
              <div style={{ color: C.text3, display: "flex", gap: 6, alignItems: "center" }}>
                <Filter size={13} /> skips: {fu.dedup_collisions} dedup · {fu.icp_refusals} non-ICP · {fu.gate_refusals} draft/surface gate · {fu.post_gate_refusals} cap/cadence
              </div>
              <div style={{ color: C.mute, fontSize: 12 }}>{fu.quiet_day_explanation}</div>
              <div style={{ color: C.mute, fontSize: 11 }}>
                includes {fu.disarmed_runs} disarmed (shadow) + {fu.armed_runs} armed runs — "acted" in a disarmed run posted nothing; the fires list below is what actually posted.
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title={`Today's fires (${fires.available ? fires.count : "?"}) — browser-verified comments`}>
        {fires.available === false ? <Unavailable reason={fires.reason} /> :
          fires.count === 0 ? (
            <div style={{ color: C.text3, fontSize: 13 }}>0 fires so far today (an honest zero — the log exists and is empty for today).</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {fires.items.map((it: any, i: number) => (
                <div key={i} style={{ borderLeft: `3px solid ${it.verified ? C.emerald : C.gold}`, paddingLeft: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                    <span style={{ color: C.gold, fontFamily: "monospace" }}>{it.ts_local}</span>
                    <a href={it.post_url} target="_blank" rel="noreferrer" style={{ color: C.text, textDecoration: "none", display: "flex", gap: 4, alignItems: "center" }}>
                      {it.target || "(unknown target)"} <ExternalLink size={12} />
                    </a>
                    <span style={{ color: it.verified ? C.emerald : C.rust, fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
                      <ShieldCheck size={12} /> {it.state}{it.verified ? " · verified" : " · NOT verified"}
                    </span>
                  </div>
                  <div style={{ color: C.text2, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{it.comment}</div>
                </div>
              ))}
            </div>
          )}
      </Card>

      <div style={{ color: C.mute, fontSize: 11, marginTop: 18, fontFamily: "monospace" }}>
        {data._source}
      </div>
      <div style={{ color: C.mute, fontSize: 11, marginTop: 4 }}>{f.prep_not_fire}</div>
    </div>
  );
}
