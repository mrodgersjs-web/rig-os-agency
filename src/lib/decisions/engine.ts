// src/lib/decisions/engine.ts
// The decision layer. Consumes an S-step artifact + a prospect and produces a
// DecisionEvent (D1 pursue → D2 route → D4 price → D3 send-staged-behind-Gate-D).
//
// This is the layer the harness was missing: ProofPacket → DecisionEvent. A
// ProofPacket says "quality gates passed"; a DecisionEvent says "here is the
// highest-EV outward action for THIS prospect, and what must be true to fire it."

import { promises as fs } from "fs";
import path from "path";
import { DecisionEvent, Prospect, StagedSend } from "./types";
import { evaluateMargin, MarginInput } from "./margin";
import { readCalibratedPriors } from "../forecast-eval";

const PROSPECTS_DIR = path.join(process.cwd(), "data", "prospects");

export async function loadProspect(slug: string): Promise<Prospect | null> {
  try {
    const raw = await fs.readFile(path.join(PROSPECTS_DIR, `${slug}.json`), "utf-8");
    return JSON.parse(raw) as Prospect;
  } catch {
    return null;
  }
}

/**
 * Default UNCALIBRATED priors by channel — the Beta-prior BASE. Phase 2 forecast-eval
 * updates these from observed outcomes (calibrated-priors.json). Until a channel has
 * enough observed data (status "calibrating"/"calibrated"), we use these defaults and
 * flag them. Auto-approve (Phase 4) must wait for "calibrated".
 */
const DEFAULT_PRIORS: Record<string, { pReply: number; pWinGivenReply: number; costToServe: number }> = {
  referral: { pReply: 0.45, pWinGivenReply: 0.4, costToServe: 300 },
  "linkedin-dm": { pReply: 0.22, pWinGivenReply: 0.3, costToServe: 150 },
  "outbound-email": { pReply: 0.15, pWinGivenReply: 0.3, costToServe: 200 },
};

export interface ChannelPrior {
  pReply: number;
  pWinGivenReply: number;
  costToServe: number;
  /** Where this prior came from — honest labeling for the ledger. */
  calibrationStatus: "default" | "insufficient" | "calibrating" | "calibrated";
}

/** Resolve a channel id (e.g. "cold-email-apollo") to its TYPE. */
function channelTypeOf(channelId: string): string {
  if (channelId.includes("linkedin")) return "linkedin-dm";
  if (channelId.includes("apollo") || channelId.includes("email")) return "outbound-email";
  if (channelId.includes("intro") || channelId.includes("referral")) return "referral";
  return "outbound-email";
}

async function priorsForChannel(channelId: string): Promise<ChannelPrior> {
  const type = channelTypeOf(channelId);
  const base = DEFAULT_PRIORS[type] ?? DEFAULT_PRIORS["outbound-email"];
  const report = await readCalibratedPriors();
  if (!report) return { ...base, calibrationStatus: "default" };
  // Match by channel id (calibration is per-channel-id in the ledger).
  const match = report.channels.find((c) => c.channel === channelId);
  if (!match || match.status === "insufficient") {
    return { ...base, calibrationStatus: match?.status ?? "insufficient" };
  }
  // Calibrating or calibrated → use the Beta posterior mean for pReply (pWin stays default;
  // we don't yet observe win outcomes, only reply outcomes).
  return {
    pReply: match.posterior.mean,
    pWinGivenReply: base.pWinGivenReply,
    costToServe: base.costToServe,
    calibrationStatus: match.status,
  };
}

export interface DecisionContext {
  prospectSlug: string;
  sourceArtifactHash: string;
  sourceDept: string;
  /** False until GAP 4 (intent→dept params) is closed; honest flag. */
  artifactIsSpecific: boolean;
}

export async function decide(ctx: DecisionContext): Promise<DecisionEvent> {
  const prospect = await loadProspect(ctx.prospectSlug);
  const createdAt = new Date().toISOString();

  // No prospect loaded → no pursue. Honest, not a fake artifact.
  if (!prospect) {
    return {
      id: `dec-${Date.now()}`,
      prospectSlug: ctx.prospectSlug,
      kind: "D1_PURSUE",
      sourceArtifactHash: ctx.sourceArtifactHash,
      sourceDept: ctx.sourceDept,
      pursue: false,
      channel: null,
      price: null,
      margin: null,
      rationale: `no prospect data for slug '${ctx.prospectSlug}' — create data/prospects/${ctx.prospectSlug}.json`,
      gateDRequired: false,
      stagedSend: null,
      predictedOutcome: null,
      actualOutcome: null,
      forecastError: null,
      createdAt,
    };
  }

  // D1 PURSUE — ICP fit (margin gate enforces the detail)
  const pursue = prospect.icp.fitsV22;

  // D2 ROUTE — first feasible channel
  const channel = prospect.channels.find((c) => c.feasible) || null;

  // D4 PRICE — the assessment ask
  const price = prospect.ask.assessmentPrice;

  // Margin gate (5 enumerated gates, EV with cost side). Priors now flow from
  // forecast-eval when calibrated data exists (Phase 2), else flagged defaults.
  const prior = channel ? await priorsForChannel(channel.id) : { pReply: 0, pWinGivenReply: 0, costToServe: 0, calibrationStatus: "default" as const };
  const marginInput: MarginInput = {
    prospect,
    dealSize: price,
    pReply: prior.pReply,
    pWinGivenReply: prior.pWinGivenReply,
    costToServe: prior.costToServe,
    artifactIsSpecific: ctx.artifactIsSpecific,
    sourcesGrounded: true, // we tag every HED dollar [verify in the assessment]
  };
  const margin = channel ? evaluateMargin(marginInput) : null;

  const rationale =
    `D1 pursue=${pursue} (ICP v2.2 fitsV22=${prospect.icp.fitsV22}); ` +
    `D2 channel=${channel ? channel.id : "none-feasible"} (${channel ? channel.type : "n/a"}); ` +
    `D4 price=$${price} (${prospect.ask.priceAsPctOfRevenue * 100}% of est. revenue); ` +
    `D3 send=${margin && margin.ship ? "staged-behind-Gate-D" : "held"} ` +
    `(margin.ship=${margin ? margin.ship : false}, EV=$${margin ? margin.ev.expectedValue.toFixed(0) : "0"}, ` +
    `pReply=${prior.pReply.toFixed(3)} [${prior.calibrationStatus}], ` +
    `artifactIsSpecific=${ctx.artifactIsSpecific} — generic until GAP 4 closed).`;

  return {
    id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    prospectSlug: ctx.prospectSlug,
    kind: "D3_SEND",
    sourceArtifactHash: ctx.sourceArtifactHash,
    sourceDept: ctx.sourceDept,
    pursue,
    channel: channel ? channel.id : null,
    price,
    margin,
    rationale,
    // Any outward send requires Gate-D. The I2 executor will not fire without approval.
    gateDRequired: !!(channel && margin && margin.ship),
    stagedSend: null, // populated by the I2 executor ONLY when approved
    predictedOutcome: margin
      ? { metric: "P(reply)", value: margin.ev.pReply }
      : null,
    actualOutcome: null,
    forecastError: null,
    createdAt,
  };
}

/**
 * Build (but do NOT send) the outbound payload for an approved decision.
 * Writes to data/outbound/<id>.json — a queue file, not a live send.
 * The real send is a separate Gate-D-armed executor (apollo/alfred adapter).
 */
export async function stageSend(decision: DecisionEvent, prospect: Prospect): Promise<StagedSend> {
  const stagedAt = new Date().toISOString();
  const queueFile = path.join(process.cwd(), "data", "outbound", `${decision.id}.json`);
  const channel = prospect.channels.find((c) => c.id === decision.channel);
  const provider: StagedSend["provider"] =
    channel && channel.provider === "apollo" ? "apollo" :
    channel && channel.provider === "alfred-agent" ? "alfred-linkedin" :
    "dry-run";
  const to = prospect.primaryContact ? `${prospect.primaryContact.name} <contact@${prospect.website || "example.com"}>` : `contact@${prospect.website || "example.com"}`;
  const subject = `${prospect.name} — ${prospect.ask.priceAsPctOfRevenue * 100}% of revenue, ${prospect.roiLever ? `$${prospect.roiLever.annualCostOutLow / 1000}K–$${prospect.roiLever.annualCostOutHigh / 1000}K/yr cost-out [verify in assessment]` : "ROI assessment"}`;
  const bodyPreview =
    `${prospect.primaryContact ? prospect.primaryContact.name + " — " : ""}sharing a $${decision.price} assessment ` +
    `(${prospect.ask.priceAsPctOfRevenue * 100}% of est. revenue). Every HED figure tagged [verify in the assessment]. ` +
    `Staged ${stagedAt}. Provider=${provider}. NOT SENT — staged behind Gate-D.`;

  const staged: StagedSend = {
    to, from: "ops@rodgersintelligence.com", provider, subject, bodyPreview,
    queueFile, status: "staged", stagedAt,
  };
  await fs.mkdir(path.dirname(queueFile), { recursive: true });
  await fs.writeFile(queueFile, JSON.stringify({ decision: decision.id, staged, payload: { to, from: staged.from, subject, bodyPreview } }, null, 2));
  return staged;
}
