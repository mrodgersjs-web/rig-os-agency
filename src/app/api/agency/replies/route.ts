// GET /api/agency/replies — the staged reply firecards (nurture_escalation)
// plus the Aug-5 kill countdown. Reads out/agency/reply-firecards-feed.json
// (generator: outbound.agency_os_feeds, fleet lane: agency-os-feeds).
// PREP != FIRE: these are drafts; Mike pastes each into the thread by hand,
// then runs the card's record_command. This route can send nothing.

import { NextResponse } from "next/server";
import { readAgencyFeed } from "@/lib/agency-feeds";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(readAgencyFeed("reply-firecards-feed.json"));
}
