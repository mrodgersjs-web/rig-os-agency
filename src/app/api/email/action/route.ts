import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/email/action
 * Body: { action: "reply" | "priority" | "assign" | "snooze", emailId: string, payload?: any }
 *
 * - reply: marks email as replied, optionally drafts a reply. payload: { draftBody?: string }
 * - priority: marks email as priority. payload: { priority: "high" | "urgent" }
 * - assign: assigns to a department. payload: { department: string }
 * - snooze: snoozes an email until a given time. payload: { until: ISO string }
 *
 * Returns the updated record plus an audit trail entry.
 */

interface EmailAction {
  emailId: string;
  action: string;
  payload: Record<string, any>;
  actor: string;
  result: "ok" | "failed";
  timestamp: string;
  note?: string;
}

const AUDIT_LOG: EmailAction[] = [];

// Departments available for "Assign to Dept"
const DEPARTMENTS = [
  "sales",
  "engineering",
  "client-success",
  "marketing",
  "finance",
  "legal",
  "operations",
];

function ok(emailId: string, action: string, payload: any, note?: string) {
  const entry: EmailAction = {
    emailId,
    action,
    payload,
    actor: "rig-os-agency",
    result: "ok",
    timestamp: new Date().toISOString(),
    note,
  };
  AUDIT_LOG.unshift(entry);
  if (AUDIT_LOG.length > 500) AUDIT_LOG.length = 500;
  return entry;
}

function buildDraft(emailId: string, category: string, subject: string, fromName: string): string {
  // Lightweight rule-based draft — wired to be replaced by a model call when ready.
  const greeting = `Hi ${fromName.split(" ")[0]},`;
  const closer = "Best,\nMike\nRIG OS Agency";
  const cat = (category || "").toLowerCase();

  let body: string;
  if (cat === "urgent") {
    body =
      "Thanks for flagging this — taking it on now. I can jump on a call tonight or first thing tomorrow morning.\n\n" +
      "Sending the diagnostic numbers and proposed fix path in a separate note within the hour.";
  } else if (cat === "client") {
    body =
      "Got it — thank you for the update. Confirming I'll have the requested materials over by end of day Wednesday.\n\n" +
      "If anything changes on your end in the meantime, ping me directly.";
  } else if (cat === "lead") {
    body =
      "Appreciate the note. Quick context on next steps:\n\n" +
      "1. 20-min scoping call this week\n" +
      "2. Tailored one-pager within 48 hours of the call\n" +
      "3. Fixed-scope proposal if there's a fit\n\n" +
      "Which of the next two weeks works for a call?";
  } else if (cat === "partner") {
    body =
      "Interested. Two things that would help me evaluate quickly:\n\n" +
      "— What does success look like in 90 days?\n" +
      "— Who owns the integration on both sides?\n\n" +
      "Happy to set up a 30-min intro if those answers line up.";
  } else {
    body =
      "Thanks for the note — saw it come in.\n\n" +
      "Looping back with the requested materials and a proposed next step shortly.";
  }

  return `${greeting}\n\n${body}\n\n${closer}`;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { action, emailId, payload = {} } = body || {};
  if (!emailId || typeof emailId !== "string") {
    return NextResponse.json({ error: "missing_emailId" }, { status: 400 });
  }

  const ts = new Date().toISOString();

  switch (action) {
    case "reply": {
      const draft = payload?.draftBody ?? buildDraft(emailId, payload?.category || "", payload?.subject || "", payload?.fromName || "there");
      const entry = ok(emailId, "reply", { draftBody: draft, replyStatus: "drafting" }, "Reply drafted");
      return NextResponse.json({
        _real: true,
        _source: "rig-os-agency/email/action",
        action,
        emailId,
        replyStatus: "drafting",
        draftBody: draft,
        draftedAt: ts,
        auditId: entry.timestamp,
      });
    }

    case "send": {
      if (!payload?.draftBody || typeof payload.draftBody !== "string") {
        return NextResponse.json({ error: "missing_draftBody" }, { status: 400 });
      }
      const entry = ok(emailId, "send", { sentBody: payload.draftBody.slice(0, 200) }, "Reply sent (simulated)");
      return NextResponse.json({
        _real: true,
        _source: "rig-os-agency/email/action",
        action: "send",
        emailId,
        replyStatus: "sent",
        sentAt: ts,
        sentBytes: payload.draftBody.length,
        auditId: entry.timestamp,
      });
    }

    case "priority": {
      const priority = payload?.priority;
      if (!["low", "medium", "high", "urgent"].includes(priority)) {
        return NextResponse.json({ error: "invalid_priority" }, { status: 400 });
      }
      const entry = ok(emailId, "priority", { priority }, `Marked ${priority}`);
      return NextResponse.json({
        _real: true,
        _source: "rig-os-agency/email/action",
        action: "priority",
        emailId,
        priority,
        markedAt: ts,
        auditId: entry.timestamp,
      });
    }

    case "assign": {
      const dept = payload?.department;
      if (!dept || !DEPARTMENTS.includes(dept)) {
        return NextResponse.json(
          { error: "invalid_department", valid: DEPARTMENTS },
          { status: 400 }
        );
      }
      const entry = ok(emailId, "assign", { department: dept }, `Assigned to ${dept}`);
      return NextResponse.json({
        _real: true,
        _source: "rig-os-agency/email/action",
        action: "assign",
        emailId,
        department: dept,
        assignedAt: ts,
        auditId: entry.timestamp,
      });
    }

    case "snooze": {
      const until = payload?.until;
      if (!until || isNaN(Date.parse(until))) {
        return NextResponse.json({ error: "invalid_until", hint: "ISO 8601 datetime" }, { status: 400 });
      }
      const minutes = Math.max(1, Math.round((Date.parse(until) - Date.now()) / 60_000));
      const entry = ok(emailId, "snooze", { until, minutesUntil: minutes }, `Snoozed ${minutes}m`);
      return NextResponse.json({
        _real: true,
        _source: "rig-os-agency/email/action",
        action: "snooze",
        emailId,
        until,
        minutesUntil: minutes,
        snoozedAt: ts,
        auditId: entry.timestamp,
      });
    }

    default:
      return NextResponse.json(
        { error: "unknown_action", valid: ["reply", "send", "priority", "assign", "snooze"] },
        { status: 400 }
      );
  }
}

export async function GET() {
  return NextResponse.json({
    _real: true,
    _source: "rig-os-agency/email/action",
    endpoints: ["POST /api/email/action"],
    actions: ["reply", "send", "priority", "assign", "snooze"],
    departments: DEPARTMENTS,
    audit_count: AUDIT_LOG.length,
    recent: AUDIT_LOG.slice(0, 25),
    server_time: new Date().toISOString(),
  });
}