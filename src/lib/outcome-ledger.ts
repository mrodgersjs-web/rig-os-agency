// src/lib/outcome-ledger.ts
// Append-only ledger of DecisionEvents + their actual outcomes.
//
// This is the Phase-0 foundation the architect agent insisted on FIRST
// (inverting the usual "decision layer first" instinct). Without it, no learning
// loop is possible: forecast-eval (Phase 2) reads this ledger to compute Brier
// scores and update priors. Build it before the decision layer needs it.

import { promises as fs } from "fs";
import path from "path";
import { DecisionEvent } from "./decisions/types";

const LEDGER_DIR = path.join(process.cwd(), "data");
const LEDGER_FILE = path.join(LEDGER_DIR, "decision-ledger.jsonl");

export interface LedgerRow {
  decisionId: string;
  prospectSlug: string;
  kind: string;
  sourceArtifactHash: string;
  pursue: boolean;
  channel: string | null;
  price: number | null;
  evExpectedValue: number | null;
  marginShip: boolean | null;
  gateDApproved: boolean;
  stagedSendStatus: string | null;
  predictedPReply: number | null;
  actualOutcome: { metric: string; value: number; observedAt: string } | null;
  forecastError: number | null;
  createdAt: string;
  recordedAt: string;
}

function toRow(d: DecisionEvent, gateDApproved: boolean): LedgerRow {
  return {
    decisionId: d.id,
    prospectSlug: d.prospectSlug,
    kind: d.kind,
    sourceArtifactHash: d.sourceArtifactHash,
    pursue: d.pursue,
    channel: d.channel,
    price: d.price,
    evExpectedValue: d.margin ? d.margin.ev.expectedValue : null,
    marginShip: d.margin ? d.margin.ship : null,
    gateDApproved,
    stagedSendStatus: d.stagedSend ? d.stagedSend.status : null,
    predictedPReply: d.predictedOutcome && d.predictedOutcome.metric === "P(reply)" ? d.predictedOutcome.value : null,
    actualOutcome: d.actualOutcome,
    forecastError: d.forecastError,
    createdAt: d.createdAt,
    recordedAt: new Date().toISOString(),
  };
}

export async function recordDecision(d: DecisionEvent, gateDApproved: boolean): Promise<LedgerRow> {
  await fs.mkdir(LEDGER_DIR, { recursive: true });
  const row = toRow(d, gateDApproved);
  await fs.appendFile(LEDGER_FILE, JSON.stringify(row) + "\n", "utf-8");
  return row;
}

export async function readLedger(): Promise<LedgerRow[]> {
  try {
    const raw = await fs.readFile(LEDGER_FILE, "utf-8");
    return raw.split("\n").filter(Boolean).map((l) => JSON.parse(l) as LedgerRow);
  } catch {
    return [];
  }
}

/**
 * Record an actual outcome against an earlier decision and compute forecast error.
 * This is the write side of the learning loop (Phase 2 wires the read side).
 */
export async function recordOutcome(decisionId: string, metric: string, value: number): Promise<LedgerRow | null> {
  const rows = await readLedger();
  const target = rows.find((r) => r.decisionId === decisionId);
  if (!target) return null;
  const observedAt = new Date().toISOString();
  const updated: LedgerRow = {
    ...target,
    actualOutcome: { metric, value, observedAt },
    forecastError: target.predictedPReply != null ? value - target.predictedPReply : null,
  };
  // Rewrite the ledger with the updated row (append-only in spirit; outcome-join in practice).
  const rewritten = rows.map((r) => (r.decisionId === decisionId ? updated : r));
  await fs.writeFile(LEDGER_FILE, rewritten.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf-8");
  return updated;
}
