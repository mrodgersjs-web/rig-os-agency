// src/app/api/agency/decisions/route.ts
// Surfaces the append-only decision ledger (decision-ledger.jsonl).
// Each row is a DecisionEvent + (optionally) an actual outcome.
// Used by /agency/forecast to compute Brier / posterior; used here for
// raw inspection.
//
// GET /api/agency/decisions            — list all rows
// GET /api/agency/decisions?limit=20   — last N rows
// GET /api/agency/decisions?outcome=1  — only rows with outcomes
// GET /api/agency/decisions?channel=linkedin — filter by channel

import { NextResponse } from "next/server";
import { readLedger } from "@/lib/outcome-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 200;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10);
    const wantOutcomes = url.searchParams.get("outcome") === "1";
    const channel = url.searchParams.get("channel");
    const kind = url.searchParams.get("kind");

    const rows = await readLedger();
    let filtered = rows;

    if (wantOutcomes) {
      filtered = filtered.filter((r) => r.actualOutcome != null);
    }
    if (channel) {
      filtered = filtered.filter((r) => (r.channel || "").toLowerCase() === channel.toLowerCase());
    }
    if (kind) {
      filtered = filtered.filter((r) => (r.kind || "").toLowerCase() === kind.toLowerCase());
    }

    // newest first
    const ordered = [...filtered].reverse().slice(0, limit);

    const counts = {
      total: rows.length,
      withOutcomes: rows.filter((r) => r.actualOutcome != null).length,
      filtered: filtered.length,
      returned: ordered.length,
      channels: countBy(rows.map((r) => r.channel || "(none)")),
      kinds: countBy(rows.map((r) => r.kind || "(none)")),
    };

    return NextResponse.json({
      ok: true,
      rows: ordered,
      counts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

function countBy(xs: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of xs) out[x] = (out[x] ?? 0) + 1;
  return out;
}
