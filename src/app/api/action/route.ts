// src/app/api/action/route.ts
// Generic action executor for deep-navigation action pages.
// Runs AgentForge workflow gates before any side effect.

import { promises as fs } from "fs";
import path from "path";
import { evaluateAgentForgeGate } from "@/lib/agentforge";

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
  const { scope, action, id, payload = {}, meta = {} } = body;

  // AgentForge gate check
  const forge = evaluateAgentForgeGate({
    scope: scope || "unknown",
    action: action || "unknown",
    id,
    payload,
    bmsMode: meta.bmsMode || "A1",
    intent: meta.intent || `${scope}.${action}`,
    sourceUris: meta.sourceUris || [],
    proofPacket: meta.proofPacket,
    approved: meta.approved === true,
    antiGenericScore: typeof meta.antiGenericScore === "number" ? meta.antiGenericScore : 85,
  });

  if (!forge.go) {
    return Response.json({
      error: "AgentForge gate blocked action",
      blockReason: forge.blockReason,
      gates: forge.gates,
      antiGenericScore: forge.antiGenericScore,
      physicsBreaches: forge.physicsBreaches,
    }, { status: 403 });
  }

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
        return Response.json({ ok: true, task, agentForge: forge });
      }

      case "deal": {
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
            agentForge: forge,
          });
        } else if (action === "meeting") {
          return Response.json({
            ok: true,
            action: "open-calendar",
            url: "https://calendar.google.com/calendar/u/0/r",
            agentForge: forge,
          });
        } else if (action === "proposal") {
          return Response.json({
            ok: true,
            action: "open-copilot",
            prompt: `Generate a proposal for ${client.name} (${client.serviceTier} tier, $${client.monthlyFee}/mo). Contact: ${client.contactName} \u003c${client.contactEmail}\u003e. Services: ${(client.services || []).join(", ")}. Notes: ${client.notes}`,
            agentForge: forge,
          });
        }

        await writeJson(path.join(DATA_DIR, "clients.json"), clients);
        return Response.json({ ok: true, client, agentForge: forge });
      }

      case "agent": {
        if (action === "run") {
          return Response.json({
            ok: true,
            action: "open-copilot",
            prompt: `Run agent ${id} with the following task: ${payload.task || "Review current priorities and suggest next actions."}`,
            agentForge: forge,
          });
        } else if (action === "assign") {
          return Response.json({
            ok: true,
            action: "open-copilot",
            prompt: `Assign a task to agent ${id}: ${payload.task || "Review pending work"}`,
            agentForge: forge,
          });
        } else if (action === "configure") {
          return Response.json({ ok: true, message: `Configuration for ${id} saved (mock)`, agentForge: forge });
        } else if (action === "logs") {
          return Response.json({ ok: true, logs: [`${new Date().toISOString()} Agent ${id} loaded`, `${new Date().toISOString()} Agent ${id} idle`], agentForge: forge });
        }
        return Response.json({ error: "unknown agent action" }, { status: 400 });
      }

      case "invoice": {
        return Response.json({
          ok: true,
          honest: true,
          message: `Invoice ${id}: action '${action}' requires Stripe connection. Add STRIPE_SECRET_KEY to ~/.hermes/.env to execute for real.`,
          agentForge: forge,
        });
      }

      default:
        return Response.json({ error: "unknown scope" }, { status: 400 });
    }
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
