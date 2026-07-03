import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JSON_FILE = path.join(process.env.HOME || "/Users/rig128gb", "Developer/rig-os-agency/data/paperclip-tasks.json");

// GET tasks — uses JSON file (reliable, no native module issues)
export async function GET() {
  try {
    const raw = await fs.readFile(JSON_FILE, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ inbox: [], today: [], activity: [] });
  }
}

// PATCH — update a task
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, section, updates } = body;

    const raw = await fs.readFile(JSON_FILE, "utf-8");
    const data = JSON.parse(raw);
    const list = data[section] || data.today || [];
    const idx = list.findIndex((item: { id: string }) => item.id === id);

    if (idx === -1) {
      // Try all sections
      for (const sec of ["inbox", "today"]) {
        const sIdx = (data[sec] || []).findIndex((item: { id: string }) => item.id === id);
        if (sIdx !== -1) {
          data[sec][sIdx] = { ...data[sec][sIdx], ...updates };
          await fs.writeFile(JSON_FILE, JSON.stringify(data, null, 2));
          return NextResponse.json({ ok: true, item: data[sec][sIdx] });
        }
      }
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    list[idx] = { ...list[idx], ...updates };
    data[section] = list;
    await fs.writeFile(JSON_FILE, JSON.stringify(data, null, 2));

    return NextResponse.json({ ok: true, item: list[idx] });
  } catch {
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}

// POST — create a task
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = await fs.readFile(JSON_FILE, "utf-8");
    const data = JSON.parse(raw);

    const newTask = {
      id: `t-${Date.now()}`,
      title: body.title || "Untitled",
      description: body.description || "",
      priority: body.priority || "medium",
      status: body.status || "pending",
      assignee: body.assignee || null,
      due_date: body.due || null,
      tags: JSON.stringify(body.tags || []),
      section: body.section || "today",
    };

    const section = newTask.section;
    if (!data[section]) data[section] = [];
    data[section].push(newTask);

    await fs.writeFile(JSON_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ ok: true, item: newTask });
  } catch {
    return NextResponse.json({ error: "create failed" }, { status: 500 });
  }
}
