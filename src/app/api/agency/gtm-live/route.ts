// GET /api/agency/gtm-live — today's comment-lane fires, cap, cadence verdict,
// and the harvested->acted funnel. Reads out/agency/gtm-live-feed.json
// (generator: outbound.agency_os_feeds, fleet lane: agency-os-feeds).
// Fail-honest: missing feed => feed_available:false, never fabricated zeros.

import { NextResponse } from "next/server";
import { readAgencyFeed } from "@/lib/agency-feeds";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(readAgencyFeed("gtm-live-feed.json"));
}
