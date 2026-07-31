// GET /api/agency/jake — Jake's decision journal (~/.rig/gtm/jake/
// decisions.jsonl), current arm weights, and settlement state (Brier is null
// until S11's settler produces outcomes — rendered UNCOMPUTABLE, never 0).
// Reads out/agency/jake-feed.json (generator: outbound.agency_os_feeds).

import { NextResponse } from "next/server";
import { readAgencyFeed } from "@/lib/agency-feeds";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(readAgencyFeed("jake-feed.json"));
}
