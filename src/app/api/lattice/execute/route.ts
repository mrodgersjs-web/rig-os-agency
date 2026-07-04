// src/app/api/lattice/execute/route.ts
// Execute a cell by coordinate using A1/A2/A3/A4 handlers

import { NextResponse } from "next/server";
import "@/lib/lattice-init";
import {
  parseCoordinate, initLattice, createMission, getMission, advanceMission, sealPacket, blockMission,
  approveMission, getA1, getA2, getA3, getA4, modeName, diamondName,
} from "@/lib/lattice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await initLattice();
  const body = await request.json().catch(() => ({}));
  const { coordinate, intent, context, handler, approved, missionId } = body;

  // Resume a blocked mission if missionId is provided
  let mission;
  if (missionId) {
    mission = getMission(missionId);
    if (!mission) return NextResponse.json({ error: "mission not found" }, { status: 404 });
    if (mission.status === "blocked" && approved) {
      approveMission(missionId);
    }
  }

  const coord = parseCoordinate(coordinate);
  if (!coord) {
    return NextResponse.json({ error: "invalid coordinate" }, { status: 400 });
  }

  mission = mission || createMission(intent || "lattice execution", coord, context);

  // A4 requires explicit approval
  if (coord.mode === 4 && !approved) {
    blockMission(mission.id, "A4 strategic cell requires human approval");
    return NextResponse.json({
      mission: getMission(mission.id),
      message: "A4 execution requires APPROVE flag",
      requiresApproval: true,
    });
  }

  // A3 requires tool allowlist
  if (coord.mode === 3 && !context?.tools?.length) {
    blockMission(mission.id, "A3 agent cell requires explicit tool allowlist");
    return NextResponse.json({ mission: getMission(mission.id) });
  }

  // Validate coordinate step exists
  const validSteps = ["I1", "Q1", "R", "S", "Q2", "P", "I2"];
  if (!validSteps.includes(coord.step)) {
    blockMission(mission.id, "invalid lattice step");
    return NextResponse.json({ mission: getMission(mission.id), error: "invalid step" }, { status: 400 });
  }

  try {
    let result: any;
    const mode = modeName(coord.mode);
    const diamond = diamondName(coord.diamond);

    if (coord.mode === 1) {
      const fn = getA1(handler || "default");
      if (!fn) throw new Error(`A1 handler '${handler}' not registered`);
      result = await fn(context);
    } else if (coord.mode === 2) {
      const fn = getA2(handler || "default");
      if (!fn) throw new Error(`A2 handler '${handler}' not registered`);
      result = await fn(context);
    } else if (coord.mode === 3) {
      const fn = getA3(handler || "default");
      if (!fn) throw new Error(`A3 handler '${handler}' not registered`);
      result = await fn(context, context?.tools || []);
    } else if (coord.mode === 4) {
      const fn = getA4(handler || "default");
      if (!fn) throw new Error(`A4 handler '${handler}' not registered`);
      result = await fn(context);
    }

    // Simulate stepping through IQRSQPI to done
    while (advanceMission(mission.id).status !== "done") {}

    sealPacket(mission.id, {
      coordinate: coord,
      intent: intent || "lattice execution",
      sources: [{ uri: `/api/lattice/execute`, range: `${mode}/${diamond}` }],
      gates: [
        { name: "coordinate", status: "PASS", headline: `Coordinate ${formatCoordinate(coord)} valid` },
        { name: "approval", status: coord.mode === 4 ? "PASS" : "SKIPPED", headline: coord.mode === 4 ? "Human approval received" : "A1/A2/A3 do not require approval" },
        { name: "tools", status: coord.mode === 3 ? "PASS" : "SKIPPED", headline: coord.mode === 3 ? `Tool allowlist: ${(context?.tools || []).join(", ")}` : "No tool allowlist needed" },
        { name: "execute", status: "PASS", headline: `${mode} executed successfully` },
      ],
      verdict: "GO",
    });

    return NextResponse.json({ mission: getMission(mission.id), result });
  } catch (e: any) {
    blockMission(mission.id, e.message);
    return NextResponse.json({ mission: getMission(mission.id), error: e.message }, { status: 500 });
  }
}

function formatCoordinate(c: ReturnType<typeof parseCoordinate>) {
  return c ? `L${c.level}-D${c.diamond}-A${c.mode}-${c.step}` : "unknown";
}
