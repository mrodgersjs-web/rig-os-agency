// ── RIG OS Agency Database Layer ───────────────────────────────────────
// Client management, pipeline deals, proposals, contracts, invoices.
// Uses Next.js server runtime — no external DB required.

import * as fs from "fs";
import * as path from "path";

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// Types -----------------------------------------------------------------

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  company?: string;
  status: "lead" | "prospect" | "client" | "inactive";
  source: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineDeal {
  id: string;
  clientId: string;
  title: string;
  stage: "discovery" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
  amount?: number;
  probability: number;
  sourceCampaign?: string;
  priority: "low" | "medium" | "high" | "critical";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  clientId: string;
  title: string;
  status: "draft" | "sent" | "pending" | "won" | "lost";
  amount?: number;
  scope?: string[];
  timeline?: string;
  notes?: string;
  sentAt?: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  clientId: string;
  proposalId?: string;
  title: string;
  status: "draft" | "active" | "completed" | "terminated";
  startDate: string;
  endDate: string;
  amount: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  contractId: string;
  clientId: string;
  title: string;
  status: "draft" | "sent" | "paid" | "overdue";
  amount: number;
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
}

// Storage Helper -------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), ".data");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface T<T> { data: T[]; updatedAt: string }

function readAll(filename: string): any[] | undefined {
  ensureDataDir();
  const f = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(f)) return undefined;
    const parsed = JSON.parse(fs.readFileSync(f, "utf-8"));
    return Array.isArray(parsed) ? (parsed as T<any>).data : (Array.isArray(parsed.data) ? parsed.data : parseJsonToArray(parsed));
  } catch { return undefined; }
}

function parseJsonToArray(obj: any): any[] {
  for (const key of Object.keys(obj)) { if (Array.isArray(obj[key])) { obj._migrated = true; return [obj]; } }
  return [];
}

function readRaw(filename: string): any | undefined {
  ensureDataDir();
  const f = path.join(DATA_DIR, filename);
  try { if (!fs.existsSync(f)) return undefined; return JSON.parse(fs.readFileSync(f, "utf-8")); } catch { return undefined; }
}

interface T2<T> { clients?: T[]; deals?: PipelineDeal[]; proposals?: Proposal[] | any[]; contracts?: Contract[]; invoices?: Invoice[]; [k: string]: any; updatedAt: string }

function getArray(data: T2<any>, key: "clients"|"deals"|"contracts"|"invoices"|string): any[] {
  const d = data[key]; if (d) return Array.isArray(d) ? d : (typeof d === "object" && "data" in d ? d.data : [d]);
  return [];
}

function getAll<T extends keyof T2<any>>(key: T): any[] | undefined {
  const raw = readRaw(key + ".json"); if (!raw) return undefined;
  if (Array.isArray(raw)) return raw as any[];
  return getArray(raw, key);
}

function writeArray<T>(filename: string, items: T[]): void {
  ensureDataDir();
  const wrapped = { data: items, updatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(wrapped));
}
// Client Ops --------------------------------------------------------
export function dbGetClients(): Client[] | undefined { const r = getAll("clients"); return (r as Client[]) || []; }
export function dbGetClient(id: string): Client | null { for (const c of dbGetClients()) if (c.id===id) return(c); return(null);}
// Contract Ops --------------------------------------------------------
export function dbGetContracts(): Contract[] | undefined { const r = getAll("contracts"); return (r as Contract[]) || []; }
export function dbGetContract(id: string): Contract | null { for (const c of dbGetContracts()) if (c.id===id) return(c); return(null);}
// Invoice Ops --------------------------------------------------------
export function dbGetInvoices(): Invoice[] | undefined { const r = getAll("invoices"); return (r as Invoice[]) || []; }
export function dbGetInvoice(id: string): Invoice | null { for (const i of dbGetInvoices()) if (i.id===id) return(i); return(null);}

// Pipeline / Proposal Ops ------------------------------------------
export function dbGetPipelineDeals(): PipelineDeal[] | undefined { const r = getAll("deals"); return (r as PipelineDeal[]) || []; }
export function dbGetPipelineDeal(id: string): PipelineDeal | null { for (const d of dbGetPipelineDeals()) if (d.id===id) return(d); return(null); }
export function dbGetProposals(): Proposal[] | undefined { const r = getAll("proposals"); return (r as Proposal[]) || []; }
export function dbGetProposal(id: string): Proposal | null { for (const p of dbGetProposals()) if (p.id===id) return(p); return(null); }

// Generic helpers used by the agency dashboard ---------------------
export function dbPath(filename?: string): string { return filename ? path.join(DATA_DIR, filename) : DATA_DIR; }
export function dbStatus(): { ok: boolean; dir: string } { return { ok: true, dir: DATA_DIR }; }
export function dbQuery(collection: string): any[] | undefined { return getAll(collection as any); }

// Create Ops --------------------------------------------------------
export function dbCreateClient(input: Partial<Client>): Client {
  const list = dbGetClients() || [];
  const now = new Date().toISOString();
  const c: Client = {
    id: input.id || uuidv4(), name: input.name || "Untitled", email: input.email || "",
    phone: input.phone, website: input.website, company: input.company,
    status: input.status || "lead", source: input.source || "manual", notes: input.notes,
    createdAt: now, updatedAt: now,
  };
  list.push(c); writeArray("clients.json", list); return c;
}
export function dbCreatePipelineDeal(input: Partial<PipelineDeal>): PipelineDeal {
  const list = dbGetPipelineDeals() || [];
  const now = new Date().toISOString();
  const d: PipelineDeal = {
    id: input.id || uuidv4(), clientId: input.clientId || "", title: input.title || "Untitled",
    stage: input.stage || "discovery", amount: input.amount, probability: input.probability ?? 0.2,
    sourceCampaign: input.sourceCampaign, priority: input.priority || "medium", notes: input.notes,
    createdAt: now, updatedAt: now,
  };
  list.push(d); writeArray("deals.json", list); return d;
}
export function dbCreateProposal(input: Partial<Proposal>): Proposal {
  const list = dbGetProposals() || [];
  const p: Proposal = {
    id: input.id || uuidv4(), clientId: input.clientId || "", title: input.title || "Untitled",
    status: input.status || "draft", amount: input.amount, scope: input.scope, timeline: input.timeline,
    notes: input.notes, sentAt: input.sentAt, createdAt: new Date().toISOString(),
  };
  list.push(p); writeArray("proposals.json", list); return p;
}
export function dbCreateContract(input: Partial<Contract>): Contract {
  const list = dbGetContracts() || [];
  const c: Contract = {
    id: input.id || uuidv4(), clientId: input.clientId || "", proposalId: input.proposalId,
    title: input.title || "Untitled", status: input.status || "draft",
    startDate: input.startDate || new Date().toISOString(), endDate: input.endDate || "",
    amount: input.amount ?? 0, notes: input.notes,
  };
  list.push(c); writeArray("contracts.json", list); return c;
}
export function dbCreateInvoice(input: Partial<Invoice>): Invoice {
  const list = dbGetInvoices() || [];
  const now = new Date().toISOString();
  const i: Invoice = {
    id: input.id || uuidv4(), contractId: input.contractId || "", clientId: input.clientId || "",
    title: input.title || "Untitled", status: input.status || "draft", amount: input.amount ?? 0,
    issuedAt: input.issuedAt || now, dueDate: input.dueDate || now, paidAt: input.paidAt,
  };
  list.push(i); writeArray("invoices.json", list); return i;
}

// Update Ops --------------------------------------------------------
export function dbUpdateClient(id: string, patch: Partial<Client>): Client | null {
  const list = dbGetClients() || [];
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeArray("clients.json", list); return list[idx];
}
export function dbUpdatePipelineDeal(id: string, patch: Partial<PipelineDeal>): PipelineDeal | null {
  const list = dbGetPipelineDeals() || [];
  const idx = list.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeArray("deals.json", list); return list[idx];
}
export function dbUpdateContractStatus(id: string, status: Contract["status"]): Contract | null {
  return dbUpdateContract(id, { status });
}
export function dbUpdateInvoiceStatus(id: string, status: Invoice["status"]): Invoice | null {
  const patch: Partial<Invoice> = { status };
  if (status === "paid") patch.paidAt = new Date().toISOString();
  return dbUpdateInvoice(id, patch);
}
// internal updaters (full record) used by the status helpers above
function dbUpdateContract(id: string, patch: Partial<Contract>): Contract | null {
  const list = dbGetContracts() || [];
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, id }; writeArray("contracts.json", list); return list[idx];
}
function dbUpdateInvoice(id: string, patch: Partial<Invoice>): Invoice | null {
  const list = dbGetInvoices() || [];
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, id }; writeArray("invoices.json", list); return list[idx];
}

// Delete Ops --------------------------------------------------------
export function dbDeleteClient(id: string): boolean {
  const list = dbGetClients() || []; const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false; writeArray("clients.json", next); return true;
}
export function dbDeletePipelineDeal(id: string): boolean {
  const list = dbGetPipelineDeals() || []; const next = list.filter((d) => d.id !== id);
  if (next.length === list.length) return false; writeArray("deals.json", next); return true;
}

// Aggregate Ops -----------------------------------------------------
export function dbGenerateInvoicesFromContracts(): Invoice[] {
  const contracts = (dbGetContracts() || []).filter((c) => c.status === "active");
  const created: Invoice[] = [];
  for (const c of contracts) {
    created.push(dbCreateInvoice({ contractId: c.id, clientId: c.clientId, title: c.title, amount: c.amount }));
  }
  return created;
}
export function dbGetDashboardKPIs(): {
  clients: number; activeClients: number; pipelineCount: number; pipelineValue: number;
  contracts: number; activeContracts: number; invoices: number; outstanding: number;
} {
  const clients = dbGetClients() || [];
  const deals = dbGetPipelineDeals() || [];
  const contracts = dbGetContracts() || [];
  const invoices = dbGetInvoices() || [];
  return {
    clients: clients.length,
    activeClients: clients.filter((c) => c.status === "client").length,
    pipelineCount: deals.length,
    pipelineValue: deals.reduce((s, d) => s + (d.amount || 0) * (d.probability || 0), 0),
    contracts: contracts.length,
    activeContracts: contracts.filter((c) => c.status === "active").length,
    invoices: invoices.length,
    outstanding: invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount || 0), 0),
  };
}

