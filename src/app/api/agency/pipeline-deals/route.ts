// src/app/api/agency/pipeline-deals/route.ts
// Canonical pipeline deals API. Delegates handlers to the shared store.
// Re-export Deal for downstream consumers.
import { handleGet, handlePost } from "@/lib/pipeline-deals-store";
export type { Deal } from "@/lib/pipeline-deals-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleGet(request);
}

export async function POST(request: Request) {
  return handlePost(request);
}
