// src/lib/forecast-eval.ts
// Phase 2: the learning loop. Reads observed outcomes from the decision ledger,
// computes per-channel calibration, and writes calibrated priors that the decision
// engine reads instead of the placeholder defaults.
//
// Two stats, honestly separated (the model-risk agent flagged "Brier calibration
// ≠ resolution"):
//   - BRIER (calibration): does P(reply)=0.15 fire ~15% of the time? Mean squared
//     error of the predicted P(reply) vs the binary outcome, per decision.
//   - RESOLUTION (distinguishability): can the model tell GOOD sends from BAD?
//     Requires segment-level outcomes (firm-size, vertical, etc.) — NOT available
//     yet. The field is explicitly null until that data exists. Do not fake it.
//
// Beta-Binomial posterior per channel:
//   prior Beta(α0, β0) where α0 = p_default · k, β0 = (1−p_default) · k, k = PRIOR_STRENGTH
//   posterior Beta(α0 + replies, β0 + non_replies)
//   posterior mean = (α0 + replies) / (α0 + β0 + n)
// The default-prior base means sparse data shrinks toward the default (Bayesian
// honesty) rather than toward a noisy sample mean.

import { promises as fs } from "fs";
import path from "path";
import { readLedger, recordOutcome } from "./outcome-ledger";

const DATA_DIR = path.join(process.cwd(), "data");
const PRIORS_FILE = path.join(DATA_DIR, "calibrated-priors.json");

/** Prior "strength" k — pseudo-count backing the default. Higher = slower to update. */
const PRIOR_STRENGTH = 10;
/** Below this N, refuse to calibrate (keep defaults). */
const N_INSUFFICIENT = 5;
/** Between N_INSUFFICIENT and this, use posterior but flag "calibrating" (not "calibrated"). */
const N_CALIBRATED = 30;

export interface ChannelCalibration {
  channel: string;
  /** Default P(reply) used as the Beta prior base. */
  priorDefault: number;
  /** Decisions with an observed reply outcome on this channel. */
  n: number;
  replies: number;
  observedReplyRate: number;
  /** Mean predicted P(reply) across the observed decisions (from the ledger). */
  meanPredictedP: number;
  /** Brier = mean((predicted_p − outcome)^2). Lower is better; 0 = perfect. */
  brier: number;
  /** Beta posterior parameters (prior + observed). */
  posterior: { alpha: number; beta: number; mean: number };
  status: "insufficient" | "calibrating" | "calibrated";
  /** Resolution is explicitly null until segment-level outcomes exist. */
  resolution: { available: boolean; note: string };
  updatedAt: string;
}

export interface CalibrationReport {
  channels: ChannelCalibration[];
  totalObserved: number;
  /** Honest top-line: is any channel actually calibrated yet? */
  anyCalibrated: boolean;
  writtenTo: string;
}

/** Default priors MUST match decisions/engine.ts priorsForChannel (the Beta base). */
const DEFAULT_PRIORS: Record<string, number> = {
  "outbound-email": 0.15,
  "linkedin-dm": 0.22,
  referral: 0.45,
};

function defaultForChannel(channelType: string | null): number {
  if (!channelType) return 0.15;
  return DEFAULT_PRIORS[channelType] ?? 0.15;
}

export async function evaluate(): Promise<CalibrationReport> {
  const rows = await readLedger();
  // Only rows with an observed binary reply outcome contribute to calibration.
  const observed = rows.filter((r) => r.actualOutcome && r.actualOutcome.metric === "replied");

  // Group by channel type. The ledger stores the channel ID (e.g. "cold-email-apollo");
  // we map to the channel TYPE via the engine's known types. For calibration we keep
  // it simple: group by channel id and also by type. Here: by channel id.
  const byChannel = new Map<string, typeof rows>();
  for (const r of observed) {
    const key = r.channel || "unknown";
    if (!byChannel.has(key)) byChannel.set(key, []);
    byChannel.get(key)!.push(r);
  }

  const channels: ChannelCalibration[] = [];
  for (const [channel, decs] of byChannel.entries()) {
    const n = decs.length;
    // Resolve the channel TYPE for the default prior base.
    const channelType = decs[0].channel?.includes("linkedin") ? "linkedin-dm" :
                        decs[0].channel?.includes("apollo") || decs[0].channel?.includes("email") ? "outbound-email" :
                        decs[0].channel?.includes("intro") || decs[0].channel?.includes("referral") ? "referral" :
                        "outbound-email";
    const priorDefault = defaultForChannel(channelType);
    const replies = decs.filter((d) => d.actualOutcome!.value === 1).length;
    const observedReplyRate = n > 0 ? replies / n : 0;
    const meanPredictedP = n > 0 ? decs.reduce((s, d) => s + (d.predictedPReply ?? priorDefault), 0) / n : priorDefault;
    const brier = n > 0 ? decs.reduce((s, d) => s + Math.pow((d.predictedPReply ?? priorDefault) - d.actualOutcome!.value, 2), 0) / n : 0;

    const alpha0 = priorDefault * PRIOR_STRENGTH;
    const beta0 = (1 - priorDefault) * PRIOR_STRENGTH;
    const alpha = alpha0 + replies;
    const beta = beta0 + (n - replies);
    const posteriorMean = alpha / (alpha + beta);

    const status: ChannelCalibration["status"] =
      n < N_INSUFFICIENT ? "insufficient" : n < N_CALIBRATED ? "calibrating" : "calibrated";

    channels.push({
      channel,
      priorDefault,
      n,
      replies,
      observedReplyRate,
      meanPredictedP,
      brier,
      posterior: { alpha, beta, mean: posteriorMean },
      status,
      resolution: {
        available: false,
        note: "Brier measures calibration only; resolution (good-vs-bad send distinguishability) needs segment-level outcomes — not yet captured",
      },
      updatedAt: new Date().toISOString(),
    });
  }

  const anyCalibrated = channels.some((c) => c.status === "calibrated");
  const report: CalibrationReport = {
    channels,
    totalObserved: observed.length,
    anyCalibrated,
    writtenTo: PRIORS_FILE,
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PRIORS_FILE, JSON.stringify(report, null, 2));
  return report;
}

/** Read calibrated priors; the decision engine calls this to override defaults. */
export async function readCalibratedPriors(): Promise<CalibrationReport | null> {
  try {
    const raw = await fs.readFile(PRIORS_FILE, "utf-8");
    return JSON.parse(raw) as CalibrationReport;
  } catch {
    return null;
  }
}

/**
 * Plant a reply outcome on a decision (metric "replied", value 1 or 0).
 * For Phase 2 PROOF we plant synthetic outcomes; in production this is called by
 * the reply-ingestion path (Apollo/Alfred webhook → recordOutcome) — never by hand.
 */
export async function plantReplyOutcome(decisionId: string, replied: boolean): Promise<void> {
  await recordOutcome(decisionId, "replied", replied ? 1 : 0);
}
