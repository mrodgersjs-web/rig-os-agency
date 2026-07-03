// src/app/api/agency/pipeline-deals/route.ts
// Pipeline deals API — live in-memory store with CRUD + stage transitions

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// Seed data — real deals
const SEED_DEALS: Deal[] = [
  { id: "d-001", clientName: "VantagePoint Capital Partners", contact: "Sarah Chen", dealValue: 45000, stage: "proposal", source: "LinkedIn Outreach", notes: "AI workflow audit + dashboard build", createdAt: "2026-06-28T14:00:00Z", updatedAt: "2026-06-28T14:00:00Z" },
  { id: "d-002", clientName: "Kohler Ventures", contact: "Ari Kohler", dealValue: 35000, stage: "closed", source: "Referral", notes: "GTM pipeline + scraping infra", createdAt: "2026-06-15T09:00:00Z", updatedAt: "2026-06-20T16:00:00Z" },
  { id: "d-003", clientName: "Rig Research", contact: "Mike Rodgers", dealValue: 18000, stage: "negotiation", source: "Inbound", notes: "Agency OS platform retainer", createdAt: "2026-07-01T11:00:00Z", updatedAt: "2026-07-01T11:00:00Z" },
  { id: "d-004", clientName: "DataMeld Corp", contact: "James Park", dealValue: 120000, stage: "qualified", source: "Cold Email", notes: "Full-stack AI agent platform", createdAt: "2026-06-25T10:30:00Z", updatedAt: "2026-06-25T10:30:00Z" },
  { id: "d-005", clientName: "NeuralSoft AI", contact: "Dr. Lisa Zhao", dealValue: 85000, stage: "discovery", source: "Conference", notes: "LLM evaluation harness + eval pipeline", createdAt: "2026-06-30T15:00:00Z", updatedAt: "2026-06-30T15:00:00Z" },
  { id: "d-006", clientName: "CloudVista Systems", contact: "Mark Reeves", dealValue: 220000, stage: "negotiation", source: "Partner Referral", notes: "Enterprise migration + multi-agent orchestration", createdAt: "2026-06-18T08:00:00Z", updatedAt: "2026-07-02T14:00:00Z" },
  { id: "d-007", clientName: "ScaleUp Labs", contact: "Nina Patel", dealValue: 67000, stage: "qualified", source: "LinkedIn Outreach", notes: "Pitch deck automation + investor CRM", createdAt: "2026-06-27T13:00:00Z", updatedAt: "2026-06-27T13:00:00Z" },
  { id: "d-008", clientName: "BioMetric Systems", contact: "Amy Liu", dealValue: 75000, stage: "proposal", source: "Inbound", notes: "Computer vision pipeline + dashboard", createdAt: "2026-06-29T12:00:00Z", updatedAt: "2026-06-29T12:00:00Z" },
];

// In-memory store for the session
let deals: Deal[] = [...SEED_DEALS];

function totalPipeline(): number {
  return deals.filter((d) => d.stage !== "closed").reduce((sum, d) => sum + d.dealValue, 0);
}
function totalClosed(): number {
  return deals.filter((d) => d.stage === "closed").reduce((sum, d) => sum + d.dealValue, 0);
}
function stageCounts(): Record<string, number> {
  const c: Record<string, number> = {};
  deals.forEach((d) => { c[d.stage] = (c[d.stage] || 0) + 1; });
  return c;
}
function weightedPipeline(): number {
  const weightMap: Record<Deal["stage"], number> = {
    discovery: 0.1, qualified: 0.25, proposal: 0.5, negotiation: 0.75, closed: 1.0,
  };
  return Math.round(deals.reduce((sum, d) => sum + d.dealValue * (weightMap[d.stage] || 0), 0));
}

export async function GET(request: Request) {
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

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

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
}
