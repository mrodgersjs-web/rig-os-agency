// ── THE HEADLINE (locked doctrine) ──────────────────────────────────────
//
// While calls_held == 0, the hero of this command surface is EXACTLY TWO
// numbers — CALLS HELD and REPLIES UNWORKED — with the Aug-5 verdict beside
// them. Everything else on the page is visually subordinate.
//
// WHY THIS IS A RULE AND NOT A PREFERENCE
//
// Volume is the easy question standing in for the hard one. RIG can post 141
// LinkedIn comments and send 176 emails and still be at 0 calls held — and a
// dashboard that leads with 141 and 176 tells you the machine is busy while
// the business is stalled. Dan Martell's rule for his teams: one screen, the
// most important metric readable in under three seconds, and every metric that
// goes red triggers a specific action. Alex Hormozi's corollary: track the
// movable lever separately from the outcome.
//
// A padded count is a vanity metric. 0 booked = the week MISSED, no matter how
// full the means-row below it.
//
// This component is a SERVER component: the numbers are read from the signed
// ledger during render, so the hero paints with real values on first byte —
// no spinner, no fetch waterfall, nothing to go stale between paint and hydrate.

import type { Metric, Headline } from "@/lib/truth";

/**
 * Render one hero number.
 *
 * A metric that could not be read prints the word UNAVAILABLE with its reason,
 * NEVER a zero. A fabricated 0 and a measured 0 look identical on a screen and
 * mean opposite things; this is the whole defect class we are guarding.
 */
function HeroNumber({
  label,
  m,
  note,
  tone,
}: {
  label: string;
  m: Metric;
  note: string;
  tone: "crisis" | "warn";
}) {
  const color = tone === "crisis" ? "var(--plum)" : "var(--gold)";
  const value = m.ok ? String(m.value) : "N/A";

  return (
    <div style={{ flex: "1 1 240px", minWidth: 0 }}>
      <div
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 700,
          fontSize: "0.7rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--cream-dim)",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          // Fluid so it stays commanding at 2560x1440 and still fits 1440x900.
          fontSize: "clamp(3.5rem, 9vw, 8rem)",
          lineHeight: 0.9,
          fontWeight: 500,
          letterSpacing: "-0.04em",
          color: m.ok ? color : "var(--cream-mute)",
          marginTop: "0.35rem",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "0.8rem",
          color: "var(--cream-dim)",
          marginTop: "0.6rem",
          maxWidth: "34ch",
        }}
      >
        {m.ok ? note : `UNAVAILABLE — ${m.reason}`}
      </div>

      {/* Provenance. A number with no source is not a number. */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.6rem",
          color: "var(--cream-mute)",
          marginTop: "0.4rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "40ch",
        }}
        title={m.source}
      >
        {m.ok ? m.source.replace(/^.*\/\.rig/, "~/.rig") : m.source}
      </div>
    </div>
  );
}

export default function TodayHero({ headline }: { headline: Headline }) {
  const { calls_held, replies_unworked, crisis, verdict_date, verdict_days_left, gap_line } = headline;

  return (
    <section
      style={{
        border: `1px solid ${crisis ? "rgba(196,96,126,0.35)" : "var(--line)"}`,
        borderRadius: 14,
        background:
          "linear-gradient(180deg, rgba(46,36,54,0.55) 0%, rgba(37,29,44,0.35) 100%)",
        padding: "clamp(1.25rem, 3vw, 2.25rem)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      {/* Roman-numeral section marker — the house style. */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "1.5rem",
            color: "var(--gold)",
            lineHeight: 1,
          }}
        >
          I
        </span>
        <h2
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: "1.05rem",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          The only two numbers that decide this week
        </h2>

        {crisis && (
          <span
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--plum)",
              border: "1px solid rgba(196,96,126,0.4)",
              borderRadius: 999,
              padding: "0.2rem 0.6rem",
            }}
          >
            Missed
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(1.5rem, 5vw, 4rem)",
          marginTop: "1.75rem",
          alignItems: "flex-start",
        }}
      >
        <HeroNumber
          label="Calls held"
          m={calls_held}
          note={`${gap_line}. Nothing else counts until this moves.`}
          tone="crisis"
        />
        <HeroNumber
          label="Replies unworked"
          m={replies_unworked}
          note="Replies with no follow-up recorded against that person."
          tone="warn"
        />

        {/* The verdict, beside the numbers — never below the fold. */}
        <div
          style={{
            flex: "0 1 260px",
            borderLeft: "1px solid var(--line-soft)",
            paddingLeft: "clamp(1rem, 2vw, 1.75rem)",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--cream-dim)",
            }}
          >
            Verdict
          </div>
          <div
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "1.75rem",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--gold)",
              marginTop: "0.35rem",
            }}
          >
            {verdict_date}
          </div>
          <div
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "0.8rem",
              color: "var(--cream-dim)",
              marginTop: "0.5rem",
            }}
          >
            {verdict_days_left >= 0
              ? `${verdict_days_left} day${verdict_days_left === 1 ? "" : "s"} to the kill checkpoint.`
              : `${Math.abs(verdict_days_left)} day(s) past the kill checkpoint.`}
          </div>
        </div>
      </div>
    </section>
  );
}
