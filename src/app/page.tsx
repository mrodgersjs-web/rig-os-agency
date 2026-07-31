// ── RIG OS Agency — TODAY ───────────────────────────────────────────────
//
// The front door. Mike judges this surface in ten seconds, so it answers ten
// seconds' worth of question and nothing more:
//
//   1. Are we getting calls?           (the north star — CALLS HELD)
//   2. What is sitting there unworked? (the movable lever — REPLIES UNWORKED)
//   3. What did the machine do?        (volume — deliberately subordinate)
//   4. Is anything lying to me?        (data-integrity banner)
//
// TWO DESIGN DECISIONS WORTH KEEPING
//
// • SERVER COMPONENT. The ground truth is read from the signed ledger during
//   render, so the page paints with real numbers on the first byte. The old
//   home page was a client component that fetched ~8 endpoints after mount,
//   which is why it showed skeletons and "checking…" on every load. Nothing
//   here can spin forever, because there is nothing to wait for.
//
// • DARK, LIKE THE REST OF THE APP. The previous version was a LIGHT
//   "PRECISION CONSOLE" (canvas #F7F8FA, white cards) while all 63 other
//   styled pages use Midnight Aubergine (--bg-deep #15101a, --gold #d4a574).
//   The front door did not match the house: the first click was theme
//   whiplash. This uses the shared tokens only — no second palette is
//   defined here.

import { getGroundTruth, getHeadline, type Metric } from "@/lib/truth";
import TodayHero from "@/components/TodayHero";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Today · RIG OS Agency",
};

// ── Subordinate volume strip ────────────────────────────────────────────
// These are activity counters. They are rendered small, grey, and BELOW the
// hero on purpose. They describe effort, not outcome, and the moment they are
// allowed to dominate the page the surface starts congratulating itself.

function VolumeStat({ label, m, unit }: { label: string; m: Metric; unit: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 700,
          fontSize: "0.6rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--cream-mute)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "1.15rem",
          color: m.ok ? "var(--cream-soft)" : "var(--cream-mute)",
          marginTop: "0.25rem",
          fontVariantNumeric: "tabular-nums",
        }}
        title={m.ok ? m.source : m.reason}
      >
        {/* UNAVAILABLE, never a fabricated 0. */}
        {m.ok ? `${m.value}${unit ? ` ${unit}` : ""}` : "UNAVAILABLE"}
      </div>
    </div>
  );
}

export default function TodayPage() {
  // Read once, server-side. Every number below traces to this one call, so no
  // two blocks on this page can disagree with each other.
  const truth = getGroundTruth();
  const headline = getHeadline(truth);

  return (
    <main
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "clamp(1.25rem, 3vw, 2.5rem)",
        display: "flex",
        flexDirection: "column",
        gap: "clamp(1.25rem, 2.5vw, 2rem)",
      }}
    >
      {/* Masthead */}
      <header>
        <div
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 700,
            fontSize: "0.65rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--gold-deep)",
          }}
        >
          RIG OS Agency
        </div>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            margin: "0.35rem 0 0",
          }}
        >
          Today
        </h1>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.68rem",
            color: "var(--cream-mute)",
            marginTop: "0.45rem",
          }}
        >
          ledger as_of {truth.as_of} · press ⌘K for actions
        </div>
      </header>

      {/* ── DATA-INTEGRITY BANNER ──────────────────────────────────────
          Fires when the local store holds rows that contradict verified
          company state (seeded demo customers while ARR is $0). RIG has been
          burned by a scoreboard disagreeing with its own ledger; if that ever
          happens again it says so here, loudly, instead of quietly rendering
          two different truths on two different tabs. */}
      {truth.demo_store_detected && (
        <div
          role="alert"
          style={{
            border: "1px solid rgba(196,96,126,0.45)",
            background: "rgba(196,96,126,0.08)",
            borderRadius: 10,
            padding: "0.85rem 1rem",
            fontFamily: "'Manrope', sans-serif",
            fontSize: "0.82rem",
            color: "var(--cream-soft)",
          }}
        >
          <strong style={{ color: "var(--plum)" }}>DEMO DATA DETECTED — </strong>
          {truth.demo_store_detail}
        </div>
      )}

      {/* THE HEADLINE — exactly two numbers plus the verdict. */}
      <TodayHero headline={headline} />

      {/* ── II · What the machine did ──────────────────────────────────── */}
      <section
        style={{
          border: "1px solid var(--line-soft)",
          borderRadius: 12,
          background: "rgba(37,29,44,0.4)",
          padding: "clamp(1rem, 2vw, 1.4rem)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.7rem" }}>
          <span
            style={{ fontFamily: "'Caveat', cursive", fontSize: "1.25rem", color: "var(--gold)" }}
          >
            II
          </span>
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "0.9rem",
              fontWeight: 500,
              margin: 0,
              color: "var(--cream-soft)",
            }}
          >
            Activity — effort, not outcome
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1.25rem",
            marginTop: "1rem",
          }}
        >
          <VolumeStat label="Emails sent" m={truth.emails_sent} unit="" />
          <VolumeStat label="LinkedIn comments" m={truth.linkedin_comments} unit="" />
          <VolumeStat label="Ledger events" m={truth.ledger_events} unit="" />
          <VolumeStat label="Replies logged" m={truth.replies_total} unit="" />
        </div>

        <p
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "0.74rem",
            color: "var(--cream-mute)",
            marginTop: "1rem",
            marginBottom: 0,
            maxWidth: "76ch",
          }}
        >
          At this volume these counts are not yet statistically meaningful — they describe
          activity, not conversion. Do not read a rate off them.
        </p>
      </section>

      {/* ── III · Commercial state ─────────────────────────────────────── */}
      <section
        style={{
          border: "1px solid var(--line-soft)",
          borderRadius: 12,
          background: "rgba(37,29,44,0.4)",
          padding: "clamp(1rem, 2vw, 1.4rem)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.7rem" }}>
          <span
            style={{ fontFamily: "'Caveat', cursive", fontSize: "1.25rem", color: "var(--gold)" }}
          >
            III
          </span>
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "0.9rem",
              fontWeight: 500,
              margin: 0,
              color: "var(--cream-soft)",
            }}
          >
            Commercial state
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1.25rem",
            marginTop: "1rem",
          }}
        >
          <VolumeStat label="Clients" m={truth.clients} unit="" />
          <VolumeStat label="Signed contracts" m={truth.contracts} unit="" />
          <VolumeStat label="ARR" m={truth.arr} unit="USD" />
        </div>

        {/* An honest empty state. Zeros here are CORRECT, and saying so is
            better than seeding fake customers to make the page look busy. */}
        <p
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "0.74rem",
            color: "var(--cream-mute)",
            marginTop: "1rem",
            marginBottom: 0,
            maxWidth: "76ch",
          }}
        >
          Pre-revenue. These zeros are correct and verified — not missing data. RIG sells and
          delivers with one operator; the constraint is calls held, not capacity.
        </p>
      </section>
    </main>
  );
}
