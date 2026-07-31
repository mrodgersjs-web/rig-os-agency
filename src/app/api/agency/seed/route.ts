// ── RIG OS Agency — Seed / Reset API ────────────────────────────────
//
// Writes the canonical SEED_* data from src/lib/agency-data.ts into the
// JSON store consumed by src/lib/db.ts so the agency surfaces (clients,
// pipeline, proposals, contracts, invoices) light up with realistic data.
//
// POST /api/agency/seed           → writes all seed collections
// DELETE /api/agency/seed         → wipes all collections
//
// ⚠️  READ THIS BEFORE RE-ENABLING SEED-BY-DEFAULT ⚠️
//
// The original comment here read: "This is the single biggest demoability
// improvement: with seed data the dashboard ... all populate. Without it the
// health endpoint reports zeros and every list view is empty."
//
// That instinct is precisely the 20%-vs-100% gap. The app was made to LOOK
// populated rather than to REPORT TRUTH, and the result was two endpoints
// disagreeing in the same second about whether RIG has customers:
//   /api/agency/health → clients:10, contracts:6
//   /api/agency/goals  → clients:0,  arr:0, "_honest":"Pre-revenue."
// The 10 "clients" are fabricated companies with fabricated humans
// (Rocky Mountain Orthopedics / Dr. Sarah Chen / 303-555-0101 / $5,000-mo).
// RIG is pre-revenue: $0 revenue, 0 clients, 0 calls held.
//
// An empty list is HONEST. Fake customers are not. RIG has already been
// burned by a scoreboard contradicting its own ledger.
//
// Therefore this route now:
//   • stamps `_seeded: true` + `_demo: true` into every collection it writes,
//     so every read path can surface a DEMO DATA banner; and
//   • is opt-in only — it is never called at boot, and the shipped state of
//     the app is an empty store.
// Do not remove those flags, and do not call this on startup.

import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import {
  SEED_CLIENTS,
  SEED_PROPOSALS,
  SEED_CONTRACTS,
  SEED_INVOICES,
  SEED_PIPELINE,
} from "@/lib/agency-data";
import type { Client, PipelineDeal, Proposal, Contract, Invoice } from "@/lib/db";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), ".data");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function writeCollection<T>(filename: string, items: T[]): void {
  ensureDataDir();
  // `_seeded` / `_demo` are load-bearing, not decoration. They are how a read
  // path knows these rows are demo data and must be rendered behind a DEMO
  // banner rather than as customers. Removing them re-creates the G1 defect.
  const wrapped = {
    data: items,
    updatedAt: new Date().toISOString(),
    _seeded: true,
    _demo: true,
    _warning:
      "SEEDED DEMO DATA — not real customers. RIG is pre-revenue ($0 ARR, 0 clients, 0 calls held). Do not present these rows as business results.",
  };
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(wrapped, null, 2));
}

function clearCollection(filename: string): void {
  ensureDataDir();
  const f = path.join(DATA_DIR, filename);
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

// Map agency-data types → db.ts types so every consumer reads clean rows.

function mapClients(): Client[] {
  return SEED_CLIENTS.map((c) => {
    const statusMap: Record<string, Client["status"]> = {
      active: "client",
      qualified: "prospect",
      proposal_sent: "prospect",
      negotiation: "prospect",
      prospect: "lead",
    };
    const now = new Date().toISOString();
    return {
      id: c.id,
      name: c.name,
      email: c.contactEmail,
      phone: c.contactPhone,
      website: c.website,
      company: c.name,
      status: statusMap[c.status] || "prospect",
      source: c.assignedAgents.length ? "Outbound" : "Inbound",
      notes: [
        `Tier: ${c.serviceTier} | Monthly: $${c.monthlyFee.toLocaleString()}`,
        `Vertical: ${c.vertical}`,
        `Health: ${c.health}`,
        c.notes,
      ]
        .filter(Boolean)
        .join(" • "),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt || now,
    };
  });
}

function mapProposals(): Proposal[] {
  const stageMap: Record<string, Proposal["status"]> = {
    sent: "sent",
    accepted: "won",
    rejected: "lost",
    draft: "draft",
    expired: "lost",
  };
  return SEED_PROPOSALS.map((p) => ({
    id: p.id,
    clientId: p.clientId,
    title: `${p.clientName} — ${p.vertical} engagement`,
    status: stageMap[p.status] || "draft",
    amount: p.annualValue,
    scope: [p.scope],
    timeline: `Monthly: $${p.monthlyFee.toLocaleString()} • Annual: $${p.annualValue.toLocaleString()}`,
    notes: p.status === "sent" ? `Valid until ${new Date(p.validUntil).toLocaleDateString()}` : "",
    sentAt: p.sentDate || undefined,
    createdAt: p.createdAt,
  }));
}

function mapContracts(): Contract[] {
  return SEED_CONTRACTS.map((c) => ({
    id: c.id,
    clientId: c.clientId,
    title: `${c.clientName} — ${c.type} contract`,
    status: "active" as const,
    startDate: c.startDate,
    endDate: c.endDate,
    amount: c.monthlyFee * 12,
    notes: [
      c.terms,
      c.autoRenew ? "Auto-renew: enabled" : "Auto-renew: disabled",
    ]
      .filter(Boolean)
      .join(" • "),
  }));
}

function mapInvoices(): Invoice[] {
  return SEED_INVOICES.map((inv) => ({
    id: inv.id,
    contractId: `ct${inv.id.replace("inv", "")}`,
    clientId: inv.clientId,
    title: `${inv.clientName} — ${new Date(inv.sentDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })} retainer`,
    status: inv.status as Invoice["status"],
    amount: inv.amount,
    issuedAt: inv.sentDate,
    dueDate: inv.dueDate,
    paidAt: inv.paidDate,
  }));
}

function mapDeals(): PipelineDeal[] {
  const stageMap: Record<string, PipelineDeal["stage"]> = {
    prospect: "discovery",
    qualified: "qualification",
    proposal_sent: "proposal",
    negotiation: "negotiation",
  };
  return SEED_PIPELINE.map((d) => ({
    id: d.id,
    clientId: "",
    title: `${d.clientName} — ${d.vertical}`,
    stage: stageMap[d.stage] || "discovery",
    amount: d.dealSize,
    probability: d.probability,
    sourceCampaign: "Organic",
    priority: d.dealSize > 100000 ? "high" : d.dealSize > 50000 ? "medium" : "low",
    notes: `${d.nextAction} • ${new Date(d.nextActionDate).toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export async function POST() {
  try {
    const clients = mapClients();
    const proposals = mapProposals();
    const contracts = mapContracts();
    const invoices = mapInvoices();
    const deals = mapDeals();

    writeCollection("clients.json", clients);
    writeCollection("proposals.json", proposals);
    writeCollection("contracts.json", contracts);
    writeCollection("invoices.json", invoices);
    writeCollection("deals.json", deals);

    return NextResponse.json({
      success: true,
      seeded: {
        clients: clients.length,
        proposals: proposals.length,
        contracts: contracts.length,
        invoices: invoices.length,
        pipeline_deals: deals.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed data", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    for (const f of [
      "clients.json",
      "proposals.json",
      "contracts.json",
      "invoices.json",
      "deals.json",
    ]) {
      clearCollection(f);
    }
    return NextResponse.json({ success: true, cleared: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to clear data", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    ensureDataDir();
    const collections = ["clients", "proposals", "contracts", "invoices", "deals"];
    const counts: Record<string, number> = {};
    for (const c of collections) {
      const f = path.join(DATA_DIR, `${c}.json`);
      if (!fs.existsSync(f)) {
        counts[c] = 0;
        continue;
      }
      try {
        const raw = JSON.parse(fs.readFileSync(f, "utf-8"));
        counts[c] = Array.isArray(raw?.data) ? raw.data.length : 0;
      } catch {
        counts[c] = 0;
      }
    }
    return NextResponse.json({
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      dataDir: DATA_DIR,
      ready: Object.values(counts).every((n) => n > 0),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}