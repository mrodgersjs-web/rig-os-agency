// ── RIG OS Agency — Ground Truth API ────────────────────────────────────
//
// The one endpoint that answers "what is actually true about this business".
// Every other surface should agree with this one; if it doesn't, this one is
// right and the other is the bug.
//
// Numbers here are read from the signed, hash-chained GTM ledger. Anything the
// ledger cannot answer comes back as `ok:false` with a reason — never as 0.

import { NextResponse } from "next/server";
import { getGroundTruth, getHeadline } from "@/lib/truth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startMs = Date.now();
  const truth = getGroundTruth();
  const headline = getHeadline(truth);

  return NextResponse.json(
    {
      // The hero. While crisis === true, a surface that leads with volume
      // instead of these two numbers is violating THE HEADLINE RULE.
      headline,
      truth,
      latency_ms: Date.now() - startMs,
      doctrine: "A number is only a number if a real artifact produced it.",
    },
    {
      // Never cache truth — a stale honest number is a dishonest number.
      headers: { "Cache-Control": "no-store" },
    }
  );
}
