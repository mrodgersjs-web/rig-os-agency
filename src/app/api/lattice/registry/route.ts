// src/app/api/lattice/registry/route.ts
// List registered lattice handlers and available coordinates

import { NextResponse } from "next/server";
import "@/lib/lattice-init";
import { listRegistry, modeName, diamondName } from "@/lib/lattice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    registry: listRegistry(),
    coordinates: [
      { coord: "L1-D1-A1-I1", name: "Health Check", mode: modeName(1), diamond: diamondName(1) },
      { coord: "L2-D1-A1-I1", name: "Deal Weighted Value", mode: modeName(1), diamond: diamondName(1) },
      { coord: "L3-D2-A2-R", name: "Score Deal", mode: modeName(2), diamond: diamondName(2) },
      { coord: "L4-D2-A2-R", name: "Summarize Text", mode: modeName(2), diamond: diamondName(2) },
      { coord: "L5-D1-A3-S", name: "Research Agent", mode: modeName(3), diamond: diamondName(1) },
      { coord: "L6-D1-A3-S", name: "Pipeline Agent", mode: modeName(3), diamond: diamondName(1) },
      { coord: "L7-D3-A4-I2", name: "Strategic Decision", mode: modeName(4), diamond: diamondName(3) },
    ],
  });
}
