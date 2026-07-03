import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.env.HOME || "/Users/rig128gb", "Developer/rig-os-agency/data/paperclip-tasks.json");

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ inbox: [], today: [], activity: [] });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, section, updates } = body;

    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    const list = data[section] || [];
    const idx = list.findIndex((item: { id: string }) => item.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    list[idx] = { ...list[idx], ...updates };
    data[section] = list;

    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));

    return NextResponse.json({ ok: true, item: list[idx] });
  } catch (e) {
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
