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
