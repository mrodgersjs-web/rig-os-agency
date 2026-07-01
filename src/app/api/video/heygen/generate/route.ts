import { NextResponse } from "next/server";
import { generateAvatarVideo } from "@/lib/heygen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/video/heygen/generate
// Body: { avatarId, voiceId, text, dimension?: {width, height} }
// Kicks off a HeyGen avatar render — async. Returns video_id, then poll
// /api/video/heygen/status?id=<video_id> until status === completed.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const avatarId = String(body.avatarId ?? "").trim();
  const voiceId = String(body.voiceId ?? "").trim();
  const text = String(body.text ?? "").trim();
  if (!avatarId) return NextResponse.json({ error: "avatarId required" }, { status: 400 });
  if (!voiceId) return NextResponse.json({ error: "voiceId required" }, { status: 400 });
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (text.length > 8000) return NextResponse.json({ error: "text too long (max 8000 chars)" }, { status: 413 });

  const dim = body.dimension && typeof body.dimension.width === "number" && typeof body.dimension.height === "number"
    ? { width: body.dimension.width, height: body.dimension.height }
    : undefined;

  try {
    const { video_id } = await generateAvatarVideo({ avatarId, voiceId, text, dimension: dim });
    return NextResponse.json({
      ok: true,
      videoId: video_id,
      pollUrl: `/api/video/heygen/status?id=${encodeURIComponent(video_id)}`,
      message: "Video queued. Poll status URL — typically ready in 30–120s.",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
