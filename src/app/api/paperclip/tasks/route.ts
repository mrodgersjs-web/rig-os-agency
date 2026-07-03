import { NextResponse } from "next/server";
import { getSession, getTasks, updateTask, createTask, type Task } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/paperclip/tasks — list tasks for user's workspace
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const session = token ? getSession(token) : null;

  // Determine workspace — default to Mike's workspace for local mode
  let wsId = "default";
  if (session?.workspace_id) {
    wsId = session.workspace_id;
  } else {
    // Local mode — find or create default workspace
    const db = (await import("@/lib/db")).default;
    let ws = db.prepare("SELECT id FROM workspaces WHERE owner_id = (SELECT id FROM users WHERE email = 'mike@rig.local')").get() as { id: string } | undefined;
    if (!ws) {
      // Seed default data
      ws = db.prepare("SELECT id FROM workspaces ORDER BY created_at LIMIT 1").get() as { id: string } | undefined;
    }
    wsId = ws?.id || "seed";
  }

  const url = new URL(req.url);
  const section = url.searchParams.get("section");

  const tasks = getTasks(wsId, section || undefined);

  // Group by section
  const grouped = {
    inbox: tasks.filter(t => t.section === "inbox"),
    today: tasks.filter(t => t.section === "today"),
    activity: [], // From agent_activity table
  };

  return NextResponse.json(grouped);
}

// PATCH /api/paperclip/tasks — update a task
export async function PATCH(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const rl = rateLimit(`tasks:${ip}`, 100);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = await req.json();
  const { id, updates } = body;

  if (!id || !updates) {
    return NextResponse.json({ error: "missing id or updates" }, { status: 400 });
  }

  const updated = updateTask(id, updates);
  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: updated });
}

// POST /api/paperclip/tasks — create a task
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const session = token ? getSession(token) : null;

  const body = await req.json();
  
  let wsId = session?.workspace_id || "default";
  if (wsId === "default") {
    const db = (await import("@/lib/db")).default;
    const ws = db.prepare("SELECT id FROM workspaces ORDER BY created_at LIMIT 1").get() as { id: string } | undefined;
    wsId = ws?.id || "default";
  }

  const task = createTask(wsId, {
    title: body.title,
    description: body.description,
    priority: body.priority,
    status: body.status,
    assignee: body.assignee,
    section: body.section || "today",
    tags: body.tags ? JSON.stringify(body.tags) : "[]",
  });

  return NextResponse.json({ ok: true, item: task });
}

// DELETE /api/paperclip/tasks — delete a task
export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  (await import("@/lib/auth")).deleteTask(id);
  return NextResponse.json({ ok: true });
}
