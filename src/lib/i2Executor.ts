// src/lib/i2Executor.ts
// Replaces the I2 no-op at harness-runtime.ts (was `result = { integrated: true }`).
//
// I2 is the integration step — the only place an outward money event can fire.
// Gate-D (agentforge approval-gate) decides WHETHER this step runs; this executor
// decides WHAT the step does when it runs:
//   1. run the decision engine (ProofPacket + prospect → DecisionEvent)
//   2. if decision.gateDRequired && !approved → harness stays blocked (handled by caller)
//   3. if approved → stage the send (write queue file, DO NOT fire) + record the ledger row
//   4. return the real I2 result (the decision + the staged send + the ledger row)
//
// This executor NEVER sends. The real send is a separate Gate-D-armed adapter
// (apollo/alfred). Here we only stage + record — the honest, reversible path.

import { decide, stageSend, loadProspect } from "./decisions/engine";
import { recordDecision } from "./outcome-ledger";
import { DecisionEvent } from "./decisions/types";

export interface I2Input {
  prospectSlug: string | undefined;
  /** The S-step final_hash — the ProofPacket this decision is made from. */
  sourceArtifactHash: string;
  sourceDept: string;
  artifactIsSpecific: boolean;
  approved: boolean;
  /** True only when the harness.intent is outward (deploy/publish/send/...).
   *  Internal intents record the decision but never stage a send. */
  isOutward: boolean;
}

export interface I2Result {
  integrated: boolean;
  decision: DecisionEvent;
  ledgerRecorded: boolean;
  /** True only when a send was actually staged (approved + gateDRequired). */
  sendStaged: boolean;
  /** Honest note on what would have happened if this had been a real adapter. */
  note: string;
}

export async function runI2(input: I2Input): Promise<I2Result> {
  const slug = input.prospectSlug || "UNKNOWN";

  // Run the decision engine.
  const decision = await decide({
    prospectSlug: slug,
    sourceArtifactHash: input.sourceArtifactHash,
    sourceDept: input.sourceDept,
    artifactIsSpecific: input.artifactIsSpecific,
  });

  // INTERNAL intent → record the decision (prospect analyzed) but never stage a send.
  // This keeps the internal run completing (T1 non-vacuity) while still logging the
  // decision for the outcome ledger.
  if (!input.isOutward) {
    await recordDecision(decision, false);
    return {
      integrated: true,
      decision,
      ledgerRecorded: true,
      sendStaged: false,
      note: `internal intent — ${decision.prospectSlug} decision recorded to ledger; no send staged (not outward)`,
    };
  }

  // OUTWARD intent. If the decision does not require Gate-D, nothing to stage.
  if (!decision.gateDRequired) {
    await recordDecision(decision, input.approved);
    return {
      integrated: true,
      decision,
      ledgerRecorded: true,
      sendStaged: false,
      note: decision.pursue
        ? "outward intent but no feasible channel or margin.ship=false → nothing to send"
        : `prospect not pursued: ${decision.rationale}`,
    };
  }

  // Outward + gateDRequired. Defensive: refuse to stage if somehow unapproved
  // (the forge gate should already have blocked this run before reaching here).
  if (!input.approved) {
    return {
      integrated: false,
      decision,
      ledgerRecorded: false,
      sendStaged: false,
      note: "outward Gate-D required and NOT approved — refusing to stage. Caller keeps harness blocked.",
    };
  }

  // Approved + gateDRequired → stage the send + record the ledger row.
  const prospect = await loadProspect(slug);
  if (!prospect) {
    return {
      integrated: false,
      decision,
      ledgerRecorded: false,
      sendStaged: false,
      note: `prospect '${slug}' not found — cannot stage send`,
    };
  }
  const staged = await stageSend(decision, prospect);
  decision.stagedSend = staged;
  await recordDecision(decision, true);

  return {
    integrated: true,
    decision,
    ledgerRecorded: true,
    sendStaged: true,
    note: `STAGED ${staged.provider} send to ${staged.to} in ${staged.queueFile}. NOT SENT — a Gate-D-armed adapter must fire it.`,
  };
}
