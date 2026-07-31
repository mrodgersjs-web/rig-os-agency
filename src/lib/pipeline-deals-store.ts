// src/lib/pipeline-deals-store.ts
// Shared in-memory pipeline deals store + helpers used by both:
//   /api/agency/pipeline-deals (current canonical route)
//   /api/agency/pipeline/deals  (legacy alias kept for backwards compatibility)
//
// Single source of truth — both route handlers delegate here.

export interface Deal {
  id: string;
  clientName: string;
  contact: string;
  dealValue: number;
  stage: "discovery" | "qualified" | "proposal" | "negotiation" | "closed";
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── DEMO DATA — OFF BY DEFAULT ─────────────────────────────────────────
//
// EVERY DEAL BELOW IS FABRICATED. This was the most dangerous fabrication in
// the app, because it did not merely look busy — it reported REVENUE:
//
//   /api/agency/pipeline-deals → totalValue 630000, closedValue 35000
//   /agency/pipeline-kanban    → "8 deals · $630K open · $35K closed"
//   /agency/velocity           → closedWonValue 35000
//
// "Kohler Ventures / Ari Kohler" carries stage:"closed", which renders as
// $35K CLOSED WON. RIG's verified state is $0 revenue and 0 signed contracts.
// A buyer — or Mike — reading that page would see a company that has closed
// business it has never closed.
//
// Worse, these names leaked into the assistant: /api/jake/briefing told the
// operator to "Respond to NeuralSoft proposal — $85K deal on the table". That
// is an AI instructing its user to act on a deal that does not exist.
//
// Gated to [] unless RIG_DEMO_DATA=1, exactly like SEED_* in agency-data.ts.
// An empty pipeline is honest; a fake closed-won is not.

/** Demo data is opt-in. Default OFF. */
const DEMO_ENABLED = process.env.RIG_DEMO_DATA === "1";

const DEMO_DEALS: Deal[] = [
  { id: "d-001", clientName: "VantagePoint Capital Partners", contact: "Sarah Chen", dealValue: 45000, stage: "proposal", source: "LinkedIn Outreach", notes: "AI workflow audit + dashboard build", createdAt: "2026-06-28T14:00:00Z", updatedAt: "2026-06-28T14:00:00Z" },
  { id: "d-002", clientName: "Kohler Ventures", contact: "Ari Kohler", dealValue: 35000, stage: "closed", source: "Referral", notes: "GTM pipeline + scraping infra", createdAt: "2026-06-15T09:00:00Z", updatedAt: "2026-06-20T16:00:00Z" },
  { id: "d-003", clientName: "Rig Research", contact: "Mike Rodgers", dealValue: 18000, stage: "negotiation", source: "Inbound", notes: "Agency OS platform retainer", createdAt: "2026-07-01T11:00:00Z", updatedAt: "2026-07-01T11:00:00Z" },
  { id: "d-004", clientName: "DataMeld Corp", contact: "James Park", dealValue: 120000, stage: "qualified", source: "Cold Email", notes: "Full-stack AI agent platform", createdAt: "2026-06-25T10:30:00Z", updatedAt: "2026-06-25T10:30:00Z" },
  { id: "d-005", clientName: "NeuralSoft AI", contact: "Dr. Lisa Zhao", dealValue: 85000, stage: "discovery", source: "Conference", notes: "LLM evaluation harness + eval pipeline", createdAt: "2026-06-30T15:00:00Z", updatedAt: "2026-06-30T15:00:00Z" },
  { id: "d-006", clientName: "CloudVista Systems", contact: "Mark Reeves", dealValue: 220000, stage: "negotiation", source: "Partner Referral", notes: "Enterprise migration + multi-agent orchestration", createdAt: "2026-06-18T08:00:00Z", updatedAt: "2026-07-02T14:00:00Z" },
  { id: "d-007", clientName: "ScaleUp Labs", contact: "Nina Patel", dealValue: 67000, stage: "qualified", source: "LinkedIn Outreach", notes: "Pitch deck automation + investor CRM", createdAt: "2026-06-27T13:00:00Z", updatedAt: "2026-06-27T13:00:00Z" },
  { id: "d-008", clientName: "BioMetric Systems", contact: "Amy Liu", dealValue: 75000, stage: "proposal", source: "Inbound", notes: "Computer vision pipeline + dashboard", createdAt: "2026-06-29T12:00:00Z", updatedAt: "2026-06-29T12:00:00Z" },
];

/** Gated export. Empty unless RIG_DEMO_DATA=1. */
export const SEED_DEALS: Deal[] = DEMO_ENABLED ? DEMO_DEALS : [];

// Session-scoped mutable store
let deals: Deal[] = [...SEED_DEALS];

export function listDeals(): Deal[] {
  return deals;
}

export function findDeal(id: string): Deal | undefined {
  return deals.find((d) => d.id === id);
}

export function totalPipeline(): number {
  return deals.filter((d) => d.stage !== "closed").reduce((sum, d) => sum + d.dealValue, 0);
}
export function totalClosed(): number {
  return deals.filter((d) => d.stage === "closed").reduce((sum, d) => sum + d.dealValue, 0);
}
export function stageCounts(): Record<string, number> {
  const c: Record<string, number> = {};
  deals.forEach((d) => { c[d.stage] = (c[d.stage] || 0) + 1; });
  return c;
}
export function weightedPipeline(): number {
  const weightMap: Record<Deal["stage"], number> = {
    discovery: 0.1, qualified: 0.25, proposal: 0.5, negotiation: 0.75, closed: 1.0,
  };
  return Math.round(deals.reduce((sum, d) => sum + d.dealValue * (weightMap[d.stage] || 0), 0));
}

export function handleGet(request: Request): Response {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "summary";
  switch (action) {
    case "list":
      return Response.json({ count: deals.length, totalValue: totalPipeline(), closedValue: totalClosed(), weightedValue: weightedPipeline(), deals });
    case "stage-breakdown":
      return Response.json({ stageCounts: stageCounts() });
    case "summary":
    default:
      return Response.json({
        count: deals.length,
        totalValue: totalPipeline(),
        closedValue: totalClosed(),
        weightedValue: weightedPipeline(),
        stageCounts: stageCounts(),
      });
  }
}

export function handlePost(request: Request): Promise<Response> | Response {
  return request.json().then((body: any = {}) => {
    // Stage transition: { id, action: "move", stage }
    if (body.action === "move" && body.id) {
      const idx = deals.findIndex((d) => d.id === body.id);
      if (idx === -1) return Response.json({ error: "deal not found" }, { status: 404 });
      const validStages = ["discovery", "qualified", "proposal", "negotiation", "closed"];
      if (!validStages.includes(body.stage)) return Response.json({ error: "invalid stage" }, { status: 400 });
      deals[idx] = { ...deals[idx], stage: body.stage, updatedAt: new Date().toISOString() };
      return Response.json({ ok: true, deal: deals[idx] });
    }
    // Delete: { action: "delete", id }
    if (body.action === "delete" && body.id) {
      deals = deals.filter((d) => d.id !== body.id);
      return Response.json({ ok: true, count: deals.length });
    }
    // Create new deal
    const newDeal: Deal = {
      id: `d-${Date.now()}`,
      clientName: String(body.clientName ?? "Unnamed Prospect"),
      contact: String(body.contact ?? ""),
      dealValue: Number(body.dealValue ?? 0),
      stage: String(body.stage ?? "discovery") as Deal["stage"],
      source: String(body.source ?? "Manual Entry"),
      notes: String(body.notes ?? ""),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!Number.isFinite(newDeal.dealValue)) {
      return Response.json({ error: "invalid deal data" }, { status: 400 });
    }
    deals = [newDeal, ...deals];
    return Response.json({ ok: true, deal: newDeal, count: deals.length }, { status: 201 });
  }).catch(() => Response.json({ error: "bad json" }, { status: 400 }));
}
