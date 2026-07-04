// src/app/api/lattice/route.ts
// RIG 3D Lattice runtime API — create missions, advance coordinates, seal proof packets

import { NextResponse } from "next/server";
import "@/lib/lattice-init";
import {
  parseCoordinate, formatCoordinate, createMission, getMission, getMissions,
  advanceMission, blockMission, sealPacket, listRegistry,
  type LatticeCoordinate, type ProofPacket,
} from "@/lib/lattice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const mission = getMission(id);
    if (!mission) return NextResponse.json({ error: "mission not found" }, { status: 404 });
    return NextResponse.json({ mission });
  }
  return NextResponse.json({ missions: getMissions(), registry: listRegistry() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { action } = body;

  switch (action) {
    case "create": {
      const { intent, coordinate, context } = body;
      if (!intent || !coordinate) {
        return NextResponse.json({ error: "intent and coordinate required" }, { status: 400 });
      }
      const coord = parseCoordinate(coordinate);
      if (!coord) {
        return NextResponse.json({ error: "invalid coordinate format, expected L#-D#-A#-STEP" }, { status: 400 });
      }
      const mission = createMission(intent, coord, context);
      return NextResponse.json({ mission });
    }

    case "advance": {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      try {
        const mission = advanceMission(id);
        return NextResponse.json({ mission });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 404 });
      }
    }

    case "seal": {
      const { id, packet } = body;
      if (!id || !packet) return NextResponse.json({ error: "id and packet required" }, { status: 400 });
      try {
        const sealed = sealPacket(id, packet);
        return NextResponse.json({ packet: sealed });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 404 });
      }
    }

    case "block": {
      const { id, reason } = body;
      if (!id || !reason) return NextResponse.json({ error: "id and reason required" }, { status: 400 });
      try {
        const mission = blockMission(id, reason);
        return NextResponse.json({ mission });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 404 });
      }
    }

    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
