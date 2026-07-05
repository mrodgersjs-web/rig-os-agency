// src/lib/decisions/types.ts
// Decision-event semantics that EXTEND the ProofPacket (not replace it).
// A ProofPacket says "this artifact passed quality gates." A DecisionEvent says
// "given this artifact + this prospect, here is the highest-EV outward action,
// its predicted outcome, and (later) its actual outcome."

export type DecisionKind = "D1_PURSUE" | "D2_ROUTE" | "D3_SEND" | "D4_PRICE";

export interface MarginGate {
  name: string;
  passed: boolean;
  detail: string;
  required: boolean;
}

export interface MarginVerdict {
  /** ALL required gates passed. False = do not send. */
  ship: boolean;
  /** The 5 enumerated gates with their inputs — not decorative. */
  gates: MarginGate[];
  /**
   * Expected value WITH A COST SIDE (the reality-checker caught that the prior
   * spec had revenue-only "margin"). EV = P(reply|ch) · P(win|reply) · dealSize − costToServe.
   */
  ev: {
    pReply: number;
    pWinGivenReply: number;
    dealSize: number;
    costToServe: number;
    expectedRevenue: number;
    expectedValue: number; // expectedRevenue − costToServe
  };
}

export interface StagedSend {
  to: string;
  from: "ops@rodgersintelligence.com";
  provider: "apollo" | "alfred-linkedin" | "dry-run";
  subject: string;
  bodyPreview: string;
  /** Where the staged payload was written (NOT sent). */
  queueFile: string;
  /** "staged" until a Gate-D-armed executor actually fires it. */
  status: "staged" | "sent" | "held";
  stagedAt: string;
}

export interface DecisionEvent {
  id: string;
  prospectSlug: string;
  kind: DecisionKind;
  /** The S-step ProofPacket hash this decision was made from. */
  sourceArtifactHash: string;
  sourceDept: string;
  // The decision
  pursue: boolean;
  channel: string | null;
  price: number | null;
  margin: MarginVerdict | null;
  rationale: string;
  // Gate-D / authorization
  gateDRequired: boolean;
  /** Outward send payload, populated only when D3_SEND and Gate-D approved. */
  stagedSend: StagedSend | null;
  // Outcome loop (filled later by the outcome ledger; null until observed)
  predictedOutcome: { metric: string; value: number } | null;
  actualOutcome: { metric: string; value: number; observedAt: string } | null;
  forecastError: number | null;
  createdAt: string;
}

export interface Prospect {
  slug: string;
  name: string;
  website?: string;
  revenueEstimate: { value: number; verifyTag: string };
  icp: { fitsV22: boolean; fitRationale: string };
  primaryContact?: { name: string; title: string; posture: string; credibilityRule: string };
  ask: { assessmentPrice: number; recurringRetainerFloor: number; priceAsPctOfRevenue: number };
  roiLever?: { annualCostOutLow: number; annualCostOutHigh: number };
  channels: Array<{ id: string; type: string; feasible: boolean; provider?: string; blocker?: string }>;
  stage: string;
}
