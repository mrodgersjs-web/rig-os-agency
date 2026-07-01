import { NextResponse } from "next/server";
import { MCP_SERVERS, getMCPStats } from "@/lib/rig-mcp-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/mcp — list all MCP servers with stats
export async function GET() {
  const stats = getMCPStats();
  return NextResponse.json({
    servers: MCP_SERVERS,
    stats,
  });
}