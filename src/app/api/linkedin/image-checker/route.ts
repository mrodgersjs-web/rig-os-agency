// LinkedIn Post Manager — Image Enforcement API
// Ensures every POST to /api/linkedin/check requires image presence

export async function GET() {
  return Response.json({
    rule: "image-required",
    max_posts_per_day: 3,
    supported_formats: ["jpg", "png", "webp"],
    required_aspect_ratio: "~1.91:1 or 1:1",
    min_width_px: 800,
    
    // When this returns true → the post is valid for LinkedIn
    checkEndpoint: "/api/linkedin/check"
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  
  const hasImage = Boolean(body.hasMedia || body.image || body.media?.length > 0);
  
  if (!hasImage) {
    return Response.json({ 
      valid: false, 
      reason: "POST-MANAGER-IMAGE-ENFORCEMENT: Posts WITHOUT media are rejected to prevent zero-engagement posts. Add a relevant image per RIG doctrine." ,
      tip: "Use your brand image for consistency",
      status_code: 422
    }, { status: 422 });
  }

  return Response.json({ 
    valid: true, 
    message: "✓ Image enforcement passed — post can proceed to publish or review",
    media_type: body.image?.type || body.hasMedia ? 'image' : 'text_only',
    image_url_set: Boolean(body.imageUrl || false)
  });
}
