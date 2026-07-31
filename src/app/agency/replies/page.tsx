"use client";

// ── RIG OS Agency — Reply Firecards (sales execution) ────────────────────
// The 4 gate-passed reply drafts that have been waiting 350+ hours, with the
// EXACT fire + record commands, and the Aug-5 kill countdown they feed.
// PREP != FIRE: nothing here sends. Mike pastes the draft into the thread by
// hand, then runs the card's record_command.
//
// Routes:
//   /agency/replies        — this surface
//   /api/agency/replies    — reads out/agency/reply-firecards-feed.json
// Generator: outbound.agency_os_feeds (fleet lane: agency-os-feeds), which
// calls outbound.nurture_escalation.fire_card + scorecard.kill_verdict.

import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare, ExternalLink, Copy, AlertTriangle, AlertCircle,
  Clock, RefreshCw, CheckCircle2,
} from "lucide-react";

const C = {
  card: "var(--bg-card)", elev: "var(--bg-elev)", text: "var(--cream)",
  text2: "var(--cream-soft)", text3: "var(--cream-dim)", mute: "var(--cream-mute)",
  border: "var(--line-soft)", gold: "var(--gold)", emerald: "var(--emerald)",
  rust: "var(--rust)",
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      style={{ display: "inline-flex", gap: 6, alignItems: "center", background: C.elev, border: `1px solid ${C.border}`, borderRadius: 8, color: done ? C.emerald : C.text2, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>
      {done ? <CheckCircle2 size={13} /> : <Copy size={13} />} {done ? "copied" : label}
    </button>
  );
}

export default function RepliesPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    fetch("/api/agency/replies").then((r) => r.json()).then(setData).catch((e) => setErr(String(e)));
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 120_000); return () => clearInterval(t); }, [load]);

  if (err) return <div style={{ padding: 32, color: C.rust }}>fetch failed: {err}</div>;
  if (!data) return <div style={{ padding: 32, color: C.text3 }}>loading…</div>;
  if (!data.feed_available) {
    return <div style={{ padding: 32, color: C.rust, fontSize: 13 }}>UNAVAILABLE — {data._source}</div>;
  }

  const fc = data.feed.firecard ?? {};
  const kill = data.feed.kill ?? {};
  const cards: any[] = fc.cards ?? [];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 980 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <MessageSquare size={20} color={C.gold} />
        <h1 style={{ color: C.text, fontSize: 22, margin: 0 }}>Reply Firecards</h1>
        <button onClick={load} style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text3, padding: "4px 10px", cursor: "pointer" }}><RefreshCw size={13} /></button>
      </div>

      {/* the kill countdown these replies feed */}
      {kill.available !== false && kill.kill_date ? (
        <div style={{ marginTop: 14, background: "rgba(201,124,94,0.10)", border: `1px solid ${C.rust}`, borderRadius: 12, padding: "12px 16px", color: C.text2, fontSize: 14, display: "flex", gap: 10, alignItems: "center" }}>
          <AlertTriangle size={16} color={C.rust} />
          <span>
            <b style={{ color: C.rust }}>{kill.days_remaining} days to the {kill.kill_date} kill</b>
            {" — needs "}{kill.worked_replies_needed} worked replies (have {kill.worked_replies}) OR 1 held call (have {kill.calls_held}).
            {" "}The {fc.counts_toward_metric ?? 0} counting cards below are {fc.counts_toward_metric ?? 0} of the {kill.worked_replies_needed}.
          </span>
        </div>
      ) : (
        <div style={{ marginTop: 14, color: C.rust, fontSize: 13 }}><AlertCircle size={13} /> kill verdict UNAVAILABLE — {kill.reason}</div>
      )}

      {fc.available === false ? (
        <div style={{ marginTop: 20, color: C.rust, fontSize: 13 }}>firecards UNAVAILABLE — {fc.reason}</div>
      ) : (
        <>
          <div style={{ color: C.text3, fontSize: 13, margin: "16px 0 12px" }}>
            {fc.waiting} waiting · {fc.draft_ready} drafts ready · {fc.counts_toward_metric} count toward the metric.
            {" "}{fc.prep_not_fire}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {cards.map((c: any) => (
              <div key={c.person_key} style={{ background: C.card, border: `1px solid ${c.counts_toward_metric ? C.gold : C.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <b style={{ color: C.text, fontSize: 15 }}>{c.who || c.person_key}</b>
                  <span style={{ color: C.text3, fontSize: 12 }}>[{c.channel}]</span>
                  <span style={{ color: C.rust, fontSize: 13, display: "flex", gap: 4, alignItems: "center" }}>
                    <Clock size={13} /> waiting {Math.round(c.age_hours)}h
                  </span>
                  {!c.counts_toward_metric && <span style={{ color: C.mute, fontSize: 12 }}>does not count toward metric</span>}
                  <a href={c.thread} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", color: C.gold, fontSize: 12, display: "flex", gap: 4, alignItems: "center", textDecoration: "none" }}>
                    open thread <ExternalLink size={12} />
                  </a>
                </div>
                <div style={{ color: C.mute, fontSize: 12, marginTop: 6 }}>they said: “{c.excerpt}”</div>
                {c.verify_before_firing && (
                  <div style={{ color: C.rust, fontSize: 12, marginTop: 6, display: "flex", gap: 5, alignItems: "center" }}>
                    <AlertTriangle size={13} /> {c.thread_state}
                  </div>
                )}
                <div style={{ background: C.elev, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginTop: 10, color: C.text2, fontSize: 13, lineHeight: 1.6 }}>
                  {c.draft || <span style={{ color: C.rust }}>no draft — {c.draft_blocker || "blocked"}</span>}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {c.draft && <CopyBtn text={c.draft} label="1 · copy draft (paste in thread by hand)" />}
                  <CopyBtn text={c.record_command} label="2 · copy record command (run after firing)" />
                </div>
              </div>
            ))}
          </div>
          <div style={{ color: C.mute, fontSize: 12, marginTop: 16 }}>{fc.verify_after_firing}</div>
        </>
      )}

      <div style={{ color: C.mute, fontSize: 11, marginTop: 18, fontFamily: "monospace" }}>{data._source}</div>
    </div>
  );
}
