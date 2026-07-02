import { NextResponse } from "next/server";
import { getModalModelPlaneStatus, smokeModal1 } from "@/lib/modalModelPlane";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getModalModelPlaneStatus());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "smoke";
  if (action !== "smoke") {
    return NextResponse.json({ ok: false, error: "unsupported action" }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt : "reply OK";
  const lane = typeof body.lane === "string" ? body.lane : "modal1";
  return NextResponse.json(await smokeModal1(prompt, lane));
}
