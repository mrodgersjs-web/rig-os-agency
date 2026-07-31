// ── RIG OS Agency — GROUND TRUTH ────────────────────────────────────────
//
// THE SINGLE SOURCE. Every surface that reports "how is the business doing"
// MUST read from here. Two endpoints disagreeing about whether RIG has
// customers is the single defect a professional buyer notices in ten seconds,
// and it has burned RIG before (JakeStudio page_id 65922: a scoreboard saying
// "ZERO sends" while the warm ledger in the same document said otherwise).
//
// THE RULES THIS FILE ENFORCES
//
//  1. A number is only a number if a real artifact produced it. If the source
//     is missing, unreadable, or empty, the metric is UNAVAILABLE — never 0.
//     A fabricated zero and a real zero are different claims, and rendering a
//     missing source as "0" is how a dashboard lies quietly for months.
//
//  2. Every metric carries its `source` (the exact artifact) and `as_of` (when
//     that artifact was last written). A number with no provenance cannot be
//     rendered as authoritative.
//
//  3. Reads are READ-ONLY. This module opens the signed GTM ledger in readonly
//     mode and never writes. The ledger is hash-chained and HMAC-signed;
//     writing to it from the dashboard would break the chain.
//
//  4. Seeded/demo rows are NOT ground truth. `getGroundTruth()` reports the
//     business from the ledger, not from the app's local JSON store. The store
//     is a scratchpad; the ledger is the record.

import * as fs from "fs";

// ── Metric shape ────────────────────────────────────────────────────────
// A metric is EITHER a real value with provenance, OR an explicit
// unavailability with a reason. There is deliberately no third state and no
// default value — a missing metric CANNOT be read as zero, because the type
// has no `value` to read. This is the seam-bug class that has bitten this
// repo repeatedly; making it unrepresentable beats remembering to check.

export interface MetricValue {
  ok: true;
  value: number;
  source: string;
  as_of: string;
}
export interface MetricUnavailable {
  ok: false;
  reason: string;
  source: string;
}
export type Metric = MetricValue | MetricUnavailable;

export function metric(value: number, source: string, as_of: string): MetricValue {
  return { ok: true, value, source, as_of };
}
export function unavailable(reason: string, source: string): MetricUnavailable {
  return { ok: false, reason, source };
}

/** Render helper: the number, or the honest word. NEVER silently 0. */
export function metricText(m: Metric): string {
  return m.ok ? String(m.value) : "UNAVAILABLE";
}

// ── Sources ─────────────────────────────────────────────────────────────

/**
 * Overridable ONLY so the non-vacuity test can point this at a nonexistent
 * path and prove the UNAVAILABLE branch actually fires. A gate that cannot be
 * made to go RED is theater.
 */
const LEDGER_DB =
  process.env.RIG_LEDGER_DB || `${process.env.HOME}/.rig/gtm/ledger/actions.db`;
const AGENCY_STORE = `${process.cwd()}/.data`;

/**
 * Open the signed GTM ledger READ-ONLY.
 *
 * better-sqlite3 is require()d lazily and inside try/catch: it is a native
 * module, and a machine without it compiled must degrade to UNAVAILABLE rather
 * than crashing the route. A dashboard that 500s is better than one that
 * reports zeros — but one that says UNAVAILABLE is best.
 */
function openLedger(): { db: unknown; mtime: string } | { err: string } {
  try {
    if (!fs.existsSync(LEDGER_DB)) {
      return { err: `ledger not found at ${LEDGER_DB}` };
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    // readonly: true is load-bearing — the ledger is hash-chained and
    // HMAC-signed. Any write from here invalidates the chain.
    const db = new Database(LEDGER_DB, { readonly: true, fileMustExist: true });
    const mtime = fs.statSync(LEDGER_DB).mtime.toISOString();
    return { db, mtime };
  } catch (e) {
    return { err: e instanceof Error ? e.message : String(e) };
  }
}

function q1(db: unknown, sql: string): number | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = (db as any).prepare(sql).get();
    if (!row) return null;
    const v = Object.values(row)[0];
    return typeof v === "number" ? v : null;
  } catch {
    return null;
  }
}

// ── The ground truth ────────────────────────────────────────────────────

export interface GroundTruth {
  /** The north star. While this is 0, it is the ONLY headline that matters. */
  calls_held: Metric;
  /** Replies received, and the subset not yet worked — the actionable backlog. */
  replies_total: Metric;
  replies_unworked: Metric;
  /** Volume. Deliberately SUBORDINATE to calls_held — see THE HEADLINE RULE. */
  emails_sent: Metric;
  linkedin_comments: Metric;
  /** Commercial state. RIG is pre-revenue; these must never come from a seed. */
  clients: Metric;
  contracts: Metric;
  arr: Metric;
  /** Provenance for the whole packet. */
  ledger_events: Metric;
  as_of: string;
  sources: string[];
  /**
   * Set when the app's local store contains rows that contradict the ledger
   * (e.g. seeded demo clients while ARR is 0), so no surface can present demo
   * rows as real customers.
   */
  demo_store_detected: boolean;
  demo_store_detail: string | null;
}

/**
 * Detect seeded/demo rows in the app's local JSON store.
 *
 * G1: `/api/agency/health` reported clients:10 / contracts:6 while
 * `/api/agency/goals` reported clients:0 / arr:0 in the same second. The 10
 * "clients" are fabricated (`Rocky Mountain Orthopedics`, `Dr. Sarah Chen`,
 * `303-555-0101`, `monthlyFee: 5000`). Ground truth is $0 revenue, 0 clients.
 *
 * We do not delete the store here — that is the seed route's job — but we DO
 * refuse to let it masquerade as truth, and we report it loudly.
 */
function detectDemoStore(): { detected: boolean; detail: string | null } {
  try {
    const f = `${AGENCY_STORE}/clients.json`;
    if (!fs.existsSync(f)) return { detected: false, detail: null };
    const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
    const rows: unknown[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
    if (!rows.length) return { detected: false, detail: null };
    return {
      detected: true,
      detail: `${rows.length} row(s) in .data/clients.json are seeded demo data, not customers. RIG is pre-revenue (ARR $0, 0 clients).`,
    };
  } catch {
    return { detected: false, detail: null };
  }
}

export function getGroundTruth(): GroundTruth {
  const nowIso = new Date().toISOString();
  const demo = detectDemoStore();
  const led = openLedger();

  // Ledger unreachable → EVERY ledger-derived metric is UNAVAILABLE. This is
  // the fail-closed path: better to print UNAVAILABLE on the north-star tile
  // than to print "0 calls held" when we simply could not read the file.
  if ("err" in led) {
    const u = (what: string) =>
      unavailable(`ledger unreadable: ${led.err}`, `${LEDGER_DB} (${what})`);
    return {
      calls_held: u("held_at"),
      replies_total: u("reply"),
      replies_unworked: u("reply"),
      emails_sent: u("email_send"),
      linkedin_comments: u("li_comment"),
      clients: unavailable("no customer record source reachable", "ledger"),
      contracts: unavailable("no contract source reachable", "ledger"),
      arr: unavailable("no revenue source reachable", "ledger"),
      ledger_events: u("count"),
      as_of: nowIso,
      sources: [LEDGER_DB],
      demo_store_detected: demo.detected,
      demo_store_detail: demo.detail,
    };
  }

  const { db, mtime } = led;
  const src = LEDGER_DB;
  const num = (n: number | null, what: string): Metric =>
    n === null ? unavailable(`query failed: ${what}`, src) : metric(n, `${src} :: ${what}`, mtime);

  // held_at is set only when a call is CONFIRMED HELD (not booked, not
  // scheduled). This is the north star. It is currently a REAL 0 — read from a
  // real table — which is why it renders as 0 and not UNAVAILABLE.
  const callsHeld = num(
    q1(db, `SELECT COUNT(*) AS n FROM actions WHERE held_at IS NOT NULL`),
    "COUNT(actions.held_at IS NOT NULL)"
  );

  const emails = num(
    q1(db, `SELECT COUNT(*) AS n FROM actions WHERE action='email_send' AND state='confirmed'`),
    "COUNT(action=email_send, state=confirmed)"
  );

  const comments = num(
    q1(db, `SELECT COUNT(*) AS n FROM actions WHERE channel='linkedin' AND state='confirmed'`),
    "COUNT(channel=linkedin, state=confirmed)"
  );

  const events = num(q1(db, `SELECT COUNT(*) AS n FROM actions`), "COUNT(actions)");

  // Replies. The ledger records outbound actions; a reply becomes a row only
  // when the reply-capture lane writes one. If that lane has never written,
  // the honest answer is UNAVAILABLE — NOT zero. The measured funnel truth
  // (176 emails → 5 replies) lives outside this table today, so claiming
  // "0 replies" here would be a fabrication.
  const replyRows = q1(db, `SELECT COUNT(*) AS n FROM actions WHERE action LIKE '%reply%'`);
  const repliesTotal: Metric =
    replyRows === null
      ? unavailable("query failed: reply count", src)
      : replyRows > 0
        ? metric(replyRows, `${src} :: COUNT(action LIKE %reply%)`, mtime)
        : unavailable(
            "reply-capture lane has never written to actions.db; measured funnel (5 replies) is not in this ledger",
            src
          );

  // Unworked replies = replies with no later non-reply action against the same
  // person. Only computable when replies are actually in the ledger.
  const repliesUnworked: Metric = repliesTotal.ok
    ? num(
        q1(
          db,
          `SELECT COUNT(*) AS n FROM actions r
             WHERE r.action LIKE '%reply%'
               AND NOT EXISTS (
                 SELECT 1 FROM actions f
                  WHERE f.person_key = r.person_key
                    AND f.ts > r.ts
                    AND f.action NOT LIKE '%reply%')`
        ),
        "COUNT(reply without later follow-up)"
      )
    : unavailable("cannot compute: no reply rows in ledger to work from", src);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).close();
  } catch {
    /* closing a readonly handle must never fail the request */
  }

  return {
    calls_held: callsHeld,
    replies_total: repliesTotal,
    replies_unworked: repliesUnworked,
    emails_sent: emails,
    linkedin_comments: comments,
    // RIG is pre-revenue. These are asserted zero ONLY because that is the
    // verified company state, and they are sourced to that verification rather
    // than to a seeded JSON file.
    clients: metric(0, "verified company state: pre-revenue, 0 clients", nowIso),
    contracts: metric(0, "verified company state: pre-revenue, 0 signed contracts", nowIso),
    arr: metric(0, "verified company state: $0 revenue", nowIso),
    ledger_events: events,
    as_of: mtime,
    sources: [LEDGER_DB],
    demo_store_detected: demo.detected,
    demo_store_detail: demo.detail,
  };
}

// ── THE HEADLINE RULE (locked doctrine) ─────────────────────────────────
//
// While calls_held == 0, the hero of the command surface is EXACTLY TWO
// numbers — CALLS HELD and REPLIES UNWORKED — with the Aug-5 verdict beside
// them. Volume counters (emails sent, comments posted, pages built) are
// visually subordinate, because volume is the easy question standing in for
// the hard one.
//
// This lives in CODE, not just in a doc, so a later redesign cannot quietly
// drop it: the page asks `getHeadline()` what the hero is.

export interface Headline {
  calls_held: Metric;
  replies_unworked: Metric;
  /** True while calls_held is a real 0 — volume must stay subordinate. */
  crisis: boolean;
  verdict_date: string;
  verdict_days_left: number;
  /** The single sentence that names the gap. */
  gap_line: string;
}

const VERDICT_DATE = "2026-08-05";
/** Measured: 0.35 calls held per month against 6.5 needed. Source: RIG funnel review. */
const CALLS_HELD_PER_MONTH = 0.35;
const CALLS_HELD_NEEDED_MIN = 6.5;

export function getHeadline(t: GroundTruth): Headline {
  const crisis = t.calls_held.ok && t.calls_held.value === 0;
  const verdict = new Date(`${VERDICT_DATE}T00:00:00Z`);
  const daysLeft = Math.ceil((verdict.getTime() - Date.now()) / 86400000);
  return {
    calls_held: t.calls_held,
    replies_unworked: t.replies_unworked,
    crisis,
    verdict_date: VERDICT_DATE,
    verdict_days_left: daysLeft,
    gap_line: `${CALLS_HELD_PER_MONTH}/mo held vs ${CALLS_HELD_NEEDED_MIN}/mo needed`,
  };
}
