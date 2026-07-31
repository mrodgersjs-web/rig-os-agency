// ── RIG OS Agency — API catch-all (G6) ──────────────────────────────────
//
// THE BUG THIS FIXES
//
// `GET /api/agency/marathon/turn` (a route that does not exist — the real one
// is /api/agency/turn) returned the full Next.js HTML 404 shell: ~86KB of
// markup with `content-type: text/html`. Two things go wrong downstream:
//
//   • A client doing `await res.json()` gets a JSON parse error, which most
//     call sites swallow into a catch that renders 0 or "—".
//   • Any `if (res.ok)` check on an HTML error page can pass, because the
//     shell is sometimes served 200.
//
// That is exactly how a dashboard silently renders zeros forever while every
// individual piece "works". A typo'd fetch path must fail LOUDLY and in the
// content-type the caller asked for.
//
// Next.js matches this optional catch-all only when no more specific route
// under /api matched first, so real routes are unaffected.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function notFound(req: Request): NextResponse {
  const url = new URL(req.url);
  return NextResponse.json(
    {
      error: "no_such_route",
      path: url.pathname,
      method: req.method,
      hint: "This API path does not exist. Check for a typo or a stale client-side fetch URL.",
      // Explicitly NOT a data shape. A caller that treats this as data will
      // see `error` and no fields, rather than a plausible-looking empty body.
      ok: false,
    },
    { status: 404, headers: { "Cache-Control": "no-store" } }
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const HEAD = notFound;
export const OPTIONS = notFound;
