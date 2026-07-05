// src/lib/decisions/margin.ts
// The 5-gate EV calculator — ENUMERATED, not decorative.
//
// The reality-checker (wf_92d8c160-802) caught that the prior spec named "5 gates"
// without enumerating them and that the EV formula had a revenue side but NO cost
// side, so "expected_margin" was actually expected-revenue. This module fixes both:
// every gate is concrete with its inputs shown, and EV subtracts cost-to-serve.

import { MarginGate, MarginVerdict, Prospect } from "./types";

export interface MarginInput {
  prospect: Prospect;
  dealSize: number;
  /** P(reply | channel) — UNCALIBRATED prior, flagged in the gate detail. */
  pReply: number;
  /** P(win | reply) — UNCALIBRATED prior, flagged in the gate detail. */
  pWinGivenReply: number;
  /** Mike-hours cost to pursue (hrs × rate). Mike owes the real ceiling. */
  costToServe: number;
  /** True when the S-step artifact is intent-specific (GAP 4 closed). False = generic. */
  artifactIsSpecific: boolean;
  /** True when no prospect-specific financial is asserted as fact (HED rule). */
  sourcesGrounded: boolean;
}

const PRICING_FLOOR_ASSESSMENT = 40000;
const PRICING_FLOOR_RETAINER_MO = 10000;

export function evaluateMargin(input: MarginInput): MarginVerdict {
  const gates: MarginGate[] = [];

  // GATE 1 — ICP v2.2 fit
  gates.push({
    name: "icp-fit",
    required: true,
    passed: input.prospect.icp.fitsV22,
    detail: `fitsV22=${input.prospect.icp.fitsV22} (${input.prospect.icp.fitRationale})`,
  });

  // GATE 2 — Pricing floor (assessment OR retainer)
  const meetsFloor =
    input.dealSize >= PRICING_FLOOR_ASSESSMENT ||
    input.dealSize >= PRICING_FLOOR_RETAINER_MO;
  gates.push({
    name: "pricing-floor",
    required: true,
    passed: meetsFloor,
    detail: `dealSize=$${input.dealSize} vs floor assessment=$${PRICING_FLOOR_ASSESSMENT} / retainer-mo=$${PRICING_FLOOR_RETAINER_MO}`,
  });

  // GATE 3 — EV with a COST SIDE (the fix)
  const expectedRevenue = input.pReply * input.pWinGivenReply * input.dealSize;
  const expectedValue = expectedRevenue - input.costToServe;
  gates.push({
    name: "ev-positive",
    required: true,
    passed: expectedValue > 0,
    detail:
      `EV = P(reply)=${input.pReply} · P(win|reply)=${input.pWinGivenReply} · deal=$${input.dealSize} − costToServe=$${input.costToServe} ` +
      `= $${expectedRevenue.toFixed(0)} − $${input.costToServe} = $${expectedValue.toFixed(0)} ` +
      `(priors UNCALIBRATED — do not ship auto-approve on this; Phase 4 only after Brier calibration)`,
  });

  // GATE 4 — Source/grounding (HED credibility rule: no prospect dollars as fact)
  gates.push({
    name: "sources-grounded",
    required: true,
    passed: input.sourcesGrounded,
    detail: input.sourcesGrounded
      ? "no prospect-specific financial asserted as fact (tagged [verify in the assessment])"
      : "prospect-specific dollar asserted as fact — violates credibility rule",
  });

  // GATE 5 — Artifact specificity (GAP 4: depts run on golden params today)
  gates.push({
    name: "artifact-specific",
    required: false, // advisory until Python-side parametrization lands
    passed: input.artifactIsSpecific,
    detail: input.artifactIsSpecific
      ? "S-step artifact is intent-specific"
      : "S-step artifact is GENERIC (depts run on golden params) — honest flag, not a hard block",
  });

  const blocking = gates.filter((g) => g.required && !g.passed);
  return {
    ship: blocking.length === 0,
    gates,
    ev: {
      pReply: input.pReply,
      pWinGivenReply: input.pWinGivenReply,
      dealSize: input.dealSize,
      costToServe: input.costToServe,
      expectedRevenue,
      expectedValue,
    },
  };
}
