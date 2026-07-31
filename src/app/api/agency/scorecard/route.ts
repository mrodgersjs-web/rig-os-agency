// GET /api/agency/scorecard — the daily KPI scorecard from
// gtmfleet.standard.scorecard's real queries (calls_held, replies_unworked,
// the Aug-5 kill rule, most-important action). A KPI whose source could not
// be measured arrives with available:false and must render UNAVAILABLE.
// Reads out/agency/scorecard-feed.json (generator: outbound.agency_os_feeds).

import { NextResponse } from "next/server";
import { readAgencyFeed } from "@/lib/agency-feeds";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(readAgencyFeed("scorecard-feed.json"));
}
