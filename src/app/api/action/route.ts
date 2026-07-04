// src/app/api/action/route.ts
// Generic action executor for deep-navigation action pages.
// Runs whitelisted local commands, updates JSON stores, or triggers UI events.

import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const TASKS_FILE = path.join(DATA_DIR, "paperclip-tasks.json");

async function ensureDir(file: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
}

async function readJson(file: string, fallback: any = {}) {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: any) {
  await ensureDir(file);
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { scope, action, id, payload = {} } = body;

  try {
    switch (scope) {
      case "task": {
        const tasks = await readJson(TASKS_FILE, { inbox: [], today: [], activity: [] });
        const all = [...tasks.inbox, ...tasks.today, ...tasks.activity];
        const idx = all.findIndex((t: any) => t.id === id);
        if (idx === -1) return Response.json({ error: "task not found" }, { status: 404 });
        const task = all[idx];

        if (action === "complete") {
          task.status = "done";
          task.completedAt = new Date().toISOString();
        } else if (action === "delegate") {
          task.assignee = payload.assignee || "Jake";
        } else if (action === "note") {
          task.notes = payload.note || "";
        }

        await writeJson(TASKS_FILE, tasks);
        return Response.json({ ok: true, task });
      }

      case "deal": {
        // Reuse pipeline-deals API by forwarding
        const r = await fetch(`http://127.0.0.1:3737/api/agency/pipeline-deals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id, action }),
        });
        return new Response(r.body, { status: r.status, headers: { "Content-Type": "application/json" } });
      }

      case "client": {
        const clients = await readJson(path.join(DATA_DIR, "clients.json"), { clients: [] });
        const cIdx = clients.clients.findIndex((c: any) => c.id === id);
        if (cIdx === -1) return Response.json({ error: "client not found" }, { status: 404 });
        const client = clients.clients[cIdx];

        if (action === "note") {
          client.notes = payload.note || "";
        } else if (action === "renew") {
          client.status = "active";
          client.renewedAt = new Date().toISOString();
        } else if (action === "email") {
          return Response.json({
            ok: true,
            action: "open-mailto",
            url: `mailto:${client.contactEmail}?subject=${encodeURIComponent(payload.subject || "Follow up")}`,
          });
        } else if (action === "meeting") {
          return Response.json({
            ok: true,
            action: "open-calendar",
            url: "https://calendar.google.com/calendar/u/0/r",
          });
        } else if (action === "proposal") {
          return Response.json({
            ok: true,
            action: "open-copilot",
            prompt: `Generate a proposal for ${client.name} (${client.serviceTier} tier, $${client.monthlyFee}/mo). Contact: ${client.contactName} \u003c${client.contactEmail}\u003e. Services: ${(client.services || []).join(", ")}. Notes: ${client.notes}`,
          });
        }

        await writeJson(path.join(DATA_DIR, "clients.json"), clients);
        return Response.json({ ok: true, client });
      }

      case "agent": {
        if (action === "run") {
          return Response.json({
            ok: true,
            action: "open-copilot",
            prompt: `Run agent ${id} with the following task: ${payload.task || "Review current priorities and suggest next actions."}`,
          });
        } else if (action === "assign") {
          return Response.json({
            ok: true,
            action: "open-copilot",
            prompt: `Assign a task to agent ${id}: ${payload.task || "Review pending work"}`,
          });
        } else if (action === "configure") {
          return Response.json({ ok: true, message: `Configuration for ${id} saved (mock)` });
        } else if (action === "logs") {
          return Response.json({ ok: true, logs: [`${new Date().toISOString()} Agent ${id} loaded`, `${new Date().toISOString()} Agent ${id} idle`] });
        }
        return Response.json({ error: "unknown agent action" }, { status: 400 });
      }

      case "invoice": {
        return Response.json({
          ok: true,
          honest: true,
          message: `Invoice ${id}: action '${action}' requires Stripe connection. Add STRIPE_SECRET_KEY to ~/.hermes/.env to execute for real.`,
        });
      }

      default:
        return Response.json({ error: "unknown scope" }, { status: 400 });
    }
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
