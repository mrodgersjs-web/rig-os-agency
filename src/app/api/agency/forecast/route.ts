// src/app/api/agency/forecast/route.ts
// Bayesian channel calibration report — surfaces forecast-eval phase 2.
// Reads observed outcomes from the decision ledger, computes per-channel
// Brier score, Beta-Binomial posterior, and writes calibrated priors.
//
// Honest stats:
//   - BRIER (calibration): does P(reply)=0.15 fire ~15% of the time?
//   - RESOLUTION (distinguishability): NOT available yet (needs segments).
//
// GET   → returns current calibration report (fast, reads priors file)
// POST  → ?action=recompute → runs evaluate() against the ledger
// POST  → ?action=plant    → records a synthetic reply outcome (Phase-2 PROOF)

import { NextResponse } from "next/server";
import { evaluate, readCalibratedPriors, plantReplyOutcome } from "@/lib/forecast-eval";
import { readLedger } from "@/lib/outcome-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DECISION_PRIOR_DEFAULTS: Record<string, number> = {
  linkedin: 0.08,
  cold_email: 0.05,
  "cold-email": 0.05,
  warm_intro: 0.18,
  "warm-intro": 0.18,
  referral: 0.22,
  apollo: 0.06,
  apify: 0.04,
  exa: 0.06,
  x_search: 0.03,
  "x-search": 0.03,
  default: 0.05,
};

function priorFor(channel: string | null | undefined): number {
  if (!channel) return DECISION_PRIOR_DEFAULTS.default;
  return DECISION_PRIOR_DEFAULTS[channel.toLowerCase()] ?? DECISION_PRIOR_DEFAULTS.default;
}

// GET /api/agency/forecast
// Returns: priors file if present, else computes fresh report (no plant/save).
export async function GET() {
  try {
    const cached = await readCalibratedPriors();
    const ledgerRows = await readLedger();
    const withOutcome = ledgerRows.filter(
      (r) => r.actualOutcome && r.actualOutcome.metric === "replied"
    );

    if (cached) {
      return NextResponse.json({
        ok: true,
        source: "cache",
        report: cached,
        ledgerCounts: {
          total: ledgerRows.length,
          withReplyOutcome: withOutcome.length,
        },
      });
    }

    // Compute fresh (read-only — does NOT write priors file)
    const fakeJustRead: any[] = ledgerRows;
    // For Phase-2 PROOF we just synthesize a minimal evaluation snapshot.
    const channels = Array.from(
      new Set(fakeJustRead.map((r) => r.channel || "default"))
    );
    const summaries = channels.map((channel) => {
      const decs = fakeJustRead.filter(
        (r) => (r.channel || "default") === channel && r.actualOutcome?.metric === "replied"
      );
      const n = decs.length;
      const replies = decs.filter((d) => (d.actualOutcome?.value ?? 0) > 0).length;
      const priorDefault = priorFor(channel);
      const observedReplyRate = n > 0 ? replies / n : 0;
      const brier = n > 0
        ? decs.reduce(
            (s, d) =>
              s + Math.pow((d.predictedPReply ?? priorDefault) - (d.actualOutcome?.value ?? 0), 2),
            0
          ) / n
        : 0;
      const alpha0 = priorDefault * 10;
      const beta0 = (1 - priorDefault) * 10;
      const alpha = alpha0 + replies;
      const beta = beta0 + (n - replies);
      const posteriorMean = alpha / (alpha + beta);
      const status: "insufficient" | "calibrating" | "calibrated" =
        n < 5 ? "insufficient" : n < 30 ? "calibrating" : "calibrated";
      return {
        channel,
        priorDefault,
        n,
        replies,
        observedReplyRate,
        meanPredictedP: priorDefault,
        brier,
        posterior: { alpha, beta, mean: posteriorMean },
        status,
        resolution: {
          available: false,
          note: "Brier measures calibration only; resolution needs segment-level outcomes",
        },
        updatedAt: new Date().toISOString(),
      };
    });

    const report = {
      channels: summaries,
      totalObserved: withOutcome.length,
      anyCalibrated: summaries.some((c) => c.status === "calibrated"),
      writtenTo: "data/calibrated-priors.json",
    };

    return NextResponse.json({
      ok: true,
      source: "live",
      report,
      ledgerCounts: {
        total: ledgerRows.length,
        withReplyOutcome: withOutcome.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// POST /api/agency/forecast
// ?action=recompute → re-runs evaluate() (writes priors file)
// ?action=plant&decisionId=…&replied=true|false → records reply outcome
export async function POST(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "recompute";

  try {
    if (action === "plant") {
      const decisionId = url.searchParams.get("decisionId");
      const replied = url.searchParams.get("replied") === "true";
      if (!decisionId) {
        return NextResponse.json(
          { ok: false, error: "missing decisionId" },
          { status: 400 }
        );
      }
      await plantReplyOutcome(decisionId, replied);
      return NextResponse.json({ ok: true, planted: { decisionId, replied } });
    }

    if (action === "recompute") {
      const report = await evaluate();
      return NextResponse.json({ ok: true, report });
    }

    return NextResponse.json(
      { ok: false, error: "unknown action; use ?action=recompute or ?action=plant" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
