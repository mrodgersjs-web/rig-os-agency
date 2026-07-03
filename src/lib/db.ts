// ── RIG OS Agency — SQLite Persistence Layer ────────────────────────
// Phase 1: Replace in-memory data with real SQLite database.
// Uses node:sqlite (built into Node 22+) — no external deps needed.

import { DatabaseSync as Database } from "node:sqlite";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ── DB Path ────────────────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "rigos.db");

let _db: Database | null = null;

function getDB(): Database {
  if (_db) return _db;

  // Ensure data directory exists
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Directory might already exist
  }

  _db = new Database(DB_PATH);
  _db.exec("PRAGMA journal_mode = WAL;");
  _db.exec("PRAGMA foreign_keys = ON;");

  return _db;
}

// ── Schema ──────────────────────────────────────────────────────────
export function initDB(): void {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vertical TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'prospect',
      health TEXT NOT NULL DEFAULT 'green',
      contact_name TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      website TEXT DEFAULT '',
      service_tier TEXT NOT NULL DEFAULT 'starter',
      monthly_fee REAL NOT NULL DEFAULT 2500,
      annual_fee REAL NOT NULL DEFAULT 30000,
      start_date TEXT,
      end_date TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      services TEXT DEFAULT '[]',
      assigned_agents TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      vertical TEXT NOT NULL,
      scope TEXT NOT NULL,
      monthly_fee REAL NOT NULL,
      annual_value REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      sent_date TEXT,
      accepted_date TEXT,
      valid_until TEXT,
      proof_packet_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      type TEXT NOT NULL,
      monthly_fee REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      terms TEXT DEFAULT '',
      sla_hours INTEGER NOT NULL DEFAULT 48,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      sent_date TEXT,
      paid_date TEXT,
      due_date TEXT,
      line_items TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS pipeline_deals (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      vertical TEXT NOT NULL,
      deal_size REAL NOT NULL,
      probability INTEGER NOT NULL DEFAULT 20,
      next_action TEXT DEFAULT '',
      next_action_date TEXT,
      stage TEXT NOT NULL DEFAULT 'prospect'
    );
  `);
}

// ── Seed Data ──────────────────────────────────────────────────────
import { SEED_CLIENTS, SEED_PROPOSALS, SEED_CONTRACTS, SEED_INVOICES, SEED_PIPELINE } from "./agency-data";

export function seedDB(): void {
  initDB();
  const db = getDB();

  // Check if already seeded
  const count = db.prepare("SELECT COUNT(*) as c FROM clients").get() as { c: number };
  if (count.c > 0) return;

  // Seed clients
  for (const c of SEED_CLIENTS) {
    db.prepare(`
      INSERT INTO clients (id, name, vertical, status, health, contact_name, contact_email, contact_phone,
        website, service_tier, monthly_fee, annual_fee, start_date, end_date, auto_renew,
        services, assigned_agents, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      c.id, c.name, c.vertical, c.status, c.health, c.contactName, c.contactEmail, c.contactPhone,
      c.website, c.serviceTier, c.monthlyFee, c.annualFee, c.startDate, c.endDate, c.autoRenew ? 1 : 0,
      JSON.stringify(c.services), JSON.stringify(c.assignedAgents), c.notes, c.createdAt, c.updatedAt
    );
  }

  // Seed proposals
  for (const p of SEED_PROPOSALS) {
    db.prepare(`
      INSERT INTO proposals (id, client_id, client_name, vertical, scope, monthly_fee, annual_value,
        status, sent_date, accepted_date, valid_until, proof_packet_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.id, p.clientId, p.clientName, p.vertical, p.scope, p.monthlyFee, p.annualValue,
      p.status, p.sentDate, p.acceptedDate, p.validUntil, p.proofPacketId, p.createdAt);
  }

  // Seed contracts
  for (const c of SEED_CONTRACTS) {
    db.prepare(`
      INSERT INTO contracts (id, client_id, client_name, type, monthly_fee, start_date, end_date,
        auto_renew, status, terms, sla_hours, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, c.clientId, c.clientName, c.type, c.monthlyFee, c.startDate, c.endDate,
      c.autoRenew ? 1 : 0, c.status, c.terms, c.slaHours, c.createdAt);
  }

  // Seed invoices
  for (const inv of SEED_INVOICES) {
    db.prepare(`
      INSERT INTO invoices (id, client_id, client_name, amount, status, sent_date, paid_date,
        due_date, line_items, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(inv.id, inv.clientId, inv.clientName, inv.amount, inv.status, inv.sentDate,
      inv.paidDate, inv.dueDate, JSON.stringify(inv.lineItems), inv.createdAt);
  }

  // Seed pipeline deals
  for (const d of SEED_PIPELINE) {
    db.prepare(`
      INSERT INTO pipeline_deals (id, client_name, vertical, deal_size, probability, next_action,
        next_action_date, stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(d.id, d.clientName, d.vertical, d.dealSize, d.probability, d.nextAction,
      d.nextActionDate, d.stage);
  }
}

// ── Query Functions ────────────────────────────────────────────────
import type { Client, Proposal, Contract, Invoice, PipelineDeal, DashboardKPI } from "./agency-types";

export function dbGetClients(): Client[] {
  seedDB();
  const db = getDB();
  const rows = db.prepare("SELECT * FROM clients ORDER BY created_at").all() as Record<string, unknown>[];
  return rows.map(rowToClient);
}

export function dbGetClient(id: string): Client | null {
  seedDB();
  const db = getDB();
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToClient(row) : null;
}

export function dbCreateClient(client: Client): void {
  const db = getDB();
  db.prepare(`
    INSERT INTO clients (id, name, vertical, status, health, contact_name, contact_email, contact_phone,
      website, service_tier, monthly_fee, annual_fee, start_date, end_date, auto_renew,
      services, assigned_agents, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    client.id, client.name, client.vertical, client.status, client.health,
    client.contactName, client.contactEmail, client.contactPhone, client.website,
    client.serviceTier, client.monthlyFee, client.annualFee, client.startDate,
    client.endDate, client.autoRenew ? 1 : 0, JSON.stringify(client.services),
    JSON.stringify(client.assignedAgents), client.notes, client.createdAt, client.updatedAt
  );
}

export function dbUpdateClient(id: string, updates: Partial<Client>): void {
  const db = getDB();
  const existing = dbGetClient(id);
  if (!existing) throw new Error(`Client ${id} not found`);
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  db.prepare(`
    UPDATE clients SET name=?, vertical=?, status=?, health=?, contact_name=?, contact_email=?,
      contact_phone=?, website=?, service_tier=?, monthly_fee=?, annual_fee=?, start_date=?,
      end_date=?, auto_renew=?, services=?, assigned_agents=?, notes=?, updated_at=?
    WHERE id=?
  `).run(
    merged.name, merged.vertical, merged.status, merged.health, merged.contactName,
    merged.contactEmail, merged.contactPhone, merged.website, merged.serviceTier,
    merged.monthlyFee, merged.annualFee, merged.startDate, merged.endDate,
    merged.autoRenew ? 1 : 0, JSON.stringify(merged.services),
    JSON.stringify(merged.assignedAgents), merged.notes, merged.updatedAt, id
  );
}

export function dbDeleteClient(id: string): void {
  const db = getDB();
  db.prepare("DELETE FROM clients WHERE id = ?").run(id);
}

export function dbGetProposals(): Proposal[] {
  seedDB();
  const db = getDB();
  const rows = db.prepare("SELECT * FROM proposals ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToProposal);
}

export function dbCreateProposal(p: Proposal): void {
  const db = getDB();
  db.prepare(`
    INSERT INTO proposals (id, client_id, client_name, vertical, scope, monthly_fee, annual_value,
      status, sent_date, accepted_date, valid_until, proof_packet_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(p.id, p.clientId, p.clientName, p.vertical, p.scope, p.monthlyFee, p.annualValue,
    p.status, p.sentDate, p.acceptedDate, p.validUntil, p.proofPacketId, p.createdAt);
}

export function dbUpdateProposalStatus(id: string, status: string, acceptedDate: string | null): void {
  const db = getDB();
  db.prepare("UPDATE proposals SET status = ?, accepted_date = ? WHERE id = ?").run(status, acceptedDate, id);
}

export function dbGetContracts(): Contract[] {
  seedDB();
  const db = getDB();
  const rows = db.prepare("SELECT * FROM contracts ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToContract);
}

export function dbCreateContract(c: Contract): void {
  const db = getDB();
  db.prepare(`
    INSERT INTO contracts (id, client_id, client_name, type, monthly_fee, start_date, end_date,
      auto_renew, status, terms, sla_hours, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(c.id, c.clientId, c.clientName, c.type, c.monthlyFee, c.startDate, c.endDate,
    c.autoRenew ? 1 : 0, c.status, c.terms, c.slaHours, c.createdAt);
}

export function dbUpdateContractStatus(id: string, status: string): void {
  const db = getDB();
  db.prepare("UPDATE contracts SET status = ? WHERE id = ?").run(status, id);
}

export function dbGetInvoices(): Invoice[] {
  seedDB();
  const db = getDB();
  const rows = db.prepare("SELECT * FROM invoices ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToInvoice);
}

export function dbCreateInvoice(inv: Invoice): void {
  const db = getDB();
  db.prepare(`
    INSERT INTO invoices (id, client_id, client_name, amount, status, sent_date, paid_date,
      due_date, line_items, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(inv.id, inv.clientId, inv.clientName, inv.amount, inv.status, inv.sentDate,
    inv.paidDate, inv.dueDate, JSON.stringify(inv.lineItems || []), inv.createdAt);
}

export function dbUpdateInvoiceStatus(id: string, status: string, paidDate: string | null): void {
  const db = getDB();
  db.prepare("UPDATE invoices SET status = ?, paid_date = ? WHERE id = ?").run(status, paidDate, id);
}

export function dbGetClientContracts(clientId: string): Contract[] {
  const db = getDB();
  const rows = db.prepare("SELECT * FROM contracts WHERE client_id = ? ORDER BY created_at DESC").all(clientId) as Record<string, unknown>[];
  return rows.map(rowToContract);
}

export function dbGenerateInvoicesFromContracts(): Invoice[] {
  const contracts = dbGetContracts().filter(c => c.status === "active");
  const now = new Date().toISOString();
  const dueDate = new Date(Date.now() + 30 * 86400000).toISOString();
  const generated: Invoice[] = [];
  for (const c of contracts) {
    const invId = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${c.clientId.slice(-4)}`;
    const existing = dbGetInvoices().find(i => i.id === invId);
    if (existing) continue;
    const inv: Invoice = {
      id: invId,
      clientId: c.clientId,
      clientName: c.clientName,
      amount: c.monthlyFee,
      status: "sent",
      sentDate: now,
      paidDate: null,
      dueDate,
      lineItems: [{ description: `${c.type} retainer — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, amount: c.monthlyFee }],
      createdAt: now,
    };
    dbCreateInvoice(inv);
    generated.push(inv);
  }
  return generated;
}

export function dbGetPipelineDeals(): PipelineDeal[] {
  seedDB();
  const db = getDB();
  const rows = db.prepare("SELECT * FROM pipeline_deals ORDER BY deal_size DESC").all() as Record<string, unknown>[];
  return rows.map(rowToDeal);
}

export function dbGetDashboardKPIs(): DashboardKPI {
  const clients = dbGetClients();
  const active = clients.filter((c) => c.status === "active");
  const currentMRR = active.reduce((sum, c) => sum + c.monthlyFee, 0);
  const currentARR = currentMRR * 12;
  const targetARR = 10_000_000;
  const pipeline = dbGetPipelineDeals();
  const pipelineValue = pipeline.reduce((sum, d) => sum + d.dealSize * (d.probability / 100), 0);
  const avgClientValue = active.length > 0 ? currentARR / active.length : 0;

  return {
    currentARR,
    targetARR,
    arrGap: targetARR - currentARR,
    currentMRR,
    targetMRR: 833_333,
    activeClients: active.length,
    pipelineValue,
    pipelineCount: pipeline.length,
    avgClientValue,
    churnRate: 0.05,
    growthRate: 0,
  };
}

// ── Row Mappers ─────────────────────────────────────────────────────
function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    vertical: row.vertical as Client["vertical"],
    status: row.status as Client["status"],
    health: row.health as Client["health"],
    contactName: row.contact_name as string,
    contactEmail: row.contact_email as string,
    contactPhone: row.contact_phone as string,
    website: row.website as string,
    serviceTier: row.service_tier as Client["serviceTier"],
    monthlyFee: row.monthly_fee as number,
    annualFee: row.annual_fee as number,
    startDate: row.start_date as string,
    endDate: row.end_date as string | null,
    autoRenew: Boolean(row.auto_renew),
    services: JSON.parse(row.services as string || "[]"),
    assignedAgents: JSON.parse(row.assigned_agents as string || "[]"),
    notes: row.notes as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToProposal(row: Record<string, unknown>): Proposal {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    vertical: row.vertical as Proposal["vertical"],
    scope: row.scope as string,
    monthlyFee: row.monthly_fee as number,
    annualValue: row.annual_value as number,
    status: row.status as Proposal["status"],
    sentDate: row.sent_date as string | null,
    acceptedDate: row.accepted_date as string | null,
    validUntil: row.valid_until as string,
    proofPacketId: row.proof_packet_id as string | null,
    createdAt: row.created_at as string,
  };
}

function rowToContract(row: Record<string, unknown>): Contract {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    type: row.type as string,
    monthlyFee: row.monthly_fee as number,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    autoRenew: Boolean(row.auto_renew),
    status: row.status as Contract["status"],
    terms: row.terms as string,
    slaHours: row.sla_hours as number,
    createdAt: row.created_at as string,
  };
}

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    amount: row.amount as number,
    status: row.status as Invoice["status"],
    sentDate: row.sent_date as string,
    paidDate: row.paid_date as string | null,
    dueDate: row.due_date as string,
    lineItems: JSON.parse(row.line_items as string || "[]"),
    createdAt: row.created_at as string,
  };
}

function rowToDeal(row: Record<string, unknown>): PipelineDeal {
  return {
    id: row.id as string,
    clientName: row.client_name as string,
    vertical: row.vertical as PipelineDeal["vertical"],
    dealSize: row.deal_size as number,
    probability: row.probability as number,
    nextAction: row.next_action as string,
    nextActionDate: row.next_action_date as string,
    stage: row.stage as string,
  };
}