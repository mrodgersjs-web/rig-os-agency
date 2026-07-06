// src/app/api/agency/pipeline/deals/route.ts
// LEGACY ALIAS for /api/agency/pipeline-deals.
// Kept so external links, bookmarks, and stale code paths still resolve
// with HTTP 200 instead of HTTP 404. Forwards to the shared store.
//
// Canonical route: /api/agency/pipeline-deals (see ../pipeline-deals/route.ts)

import { handleGet, handlePost } from "@/lib/pipeline-deals-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleGet(request);
}

export async function POST(request: Request) {
  return handlePost(request);
}
