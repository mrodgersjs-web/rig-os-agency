import { NextResponse } from "next/server";
import { getClients, getVerticals } from "@/lib/agency-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    clients: getClients(),
    verticals: getVerticals(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In v1, we just return the would-be-created client
    // In v2, this will write to SQLite/Postgres
    const newClient = {
      id: `c${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}