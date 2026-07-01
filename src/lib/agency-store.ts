// ── RIG OS Agency — File-Based Persistence Layer ────────────────────
// JSON file persistence for agency data. Survives restarts.
// Data directory: <project_root>/data/agency/

import { promises as fs } from "fs";
import path from "path";
import type {
  Client, Proposal, Contract, Invoice, PipelineDeal,
} from "./agency-types";
import {
  SEED_CLIENTS, SEED_PROPOSALS, SEED_CONTRACTS, SEED_INVOICES, SEED_PIPELINE,
} from "./agency-data";

// ── Data directory (absolute, safe for Next.js) ────────────────────
const DATA_DIR = path.join(process.cwd(), "data", "agency");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");
const PROPOSALS_FILE = path.join(DATA_DIR, "proposals.json");
const CONTRACTS_FILE = path.join(DATA_DIR, "contracts.json");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");
const PIPELINE_FILE = path.join(DATA_DIR, "pipeline.json");

// ── Internal mutable in-memory store (synced from disk) ────────────
let _clients: Client[] | null = null;
let _proposals: Proposal[] | null = null;
let _contracts: Contract[] | null = null;
let _invoices: Invoice[] | null = null;
let _pipeline: PipelineDeal[] | null = null;

// ── File helpers ──────────────────────────────────────────────────
async function ensureDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // dir may already exist
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ── Clients ────────────────────────────────────────────────────────
export async function loadClients(): Promise<Client[]> {
  if (_clients) return _clients;
  const data = await readJson<Client[]>(CLIENTS_FILE, []);
  if (data.length === 0) {
    _clients = [...SEED_CLIENTS];
    await writeJson(CLIENTS_FILE, _clients);
  } else {
    _clients = data;
  }
  return _clients;
}

export async function saveClients(clients: Client[]): Promise<void> {
  _clients = clients;
  await writeJson(CLIENTS_FILE, clients);
}

export async function getClient(id: string): Promise<Client | null> {
  const clients = await loadClients();
  return clients.find((c) => c.id === id) || null;
}

export async function createClient(client: Omit<Client, "id" | "createdAt" | "updatedAt">): Promise<Client> {
  const clients = await loadClients();
  const id = `c${String(clients.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const newClient: Client = { ...client, id, createdAt: now, updatedAt: now };
  const updated = [...clients, newClient];
  await saveClients(updated);
  return newClient;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  const clients = await loadClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updatedClient = { ...clients[idx], ...updates, id, updatedAt: new Date().toISOString() };
  clients[idx] = updatedClient;
  await saveClients(clients);
  return updatedClient;
}

export async function deleteClient(id: string): Promise<boolean> {
  const clients = await loadClients();
  const filtered = clients.filter((c) => c.id !== id);
  if (filtered.length === clients.length) return false;
  await saveClients(filtered);
  return true;
}

// ── Proposals ──────────────────────────────────────────────────────
export async function loadProposals(): Promise<Proposal[]> {
  if (_proposals) return _proposals;
  const data = await readJson<Proposal[]>(PROPOSALS_FILE, []);
  if (data.length === 0) {
    _proposals = [...SEED_PROPOSALS];
    await writeJson(PROPOSALS_FILE, _proposals);
  } else {
    _proposals = data;
  }
  return _proposals;
}

export async function saveProposals(proposals: Proposal[]): Promise<void> {
  _proposals = proposals;
  await writeJson(PROPOSALS_FILE, proposals);
}

export async function createProposal(proposal: Omit<Proposal, "id" | "createdAt">): Promise<Proposal> {
  const proposals = await loadProposals();
  const id = `p${String(proposals.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`;
  const newProposal: Proposal = { ...proposal, id, createdAt: new Date().toISOString() };
  const updated = [...proposals, newProposal];
  await saveProposals(updated);
  return newProposal;
}

export async function updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal | null> {
  const proposals = await loadProposals();
  const idx = proposals.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  proposals[idx] = { ...proposals[idx], ...updates, id };
  await saveProposals(proposals);
  return proposals[idx];
}

export async function deleteProposal(id: string): Promise<boolean> {
  const proposals = await loadProposals();
  const filtered = proposals.filter((p) => p.id !== id);
  if (filtered.length === proposals.length) return false;
  await saveProposals(filtered);
  return true;
}

// ── Contracts ──────────────────────────────────────────────────────
export async function loadContracts(): Promise<Contract[]> {
  if (_contracts) return _contracts;
  const data = await readJson<Contract[]>(CONTRACTS_FILE, []);
  if (data.length === 0) {
    _contracts = [...SEED_CONTRACTS];
    await writeJson(CONTRACTS_FILE, _contracts);
  } else {
    _contracts = data;
  }
  return _contracts;
}

export async function saveContracts(contracts: Contract[]): Promise<void> {
  _contracts = contracts;
  await writeJson(CONTRACTS_FILE, contracts);
}

// ── Invoices ───────────────────────────────────────────────────────
export async function loadInvoices(): Promise<Invoice[]> {
  if (_invoices) return _invoices;
  const data = await readJson<Invoice[]>(INVOICES_FILE, []);
  if (data.length === 0) {
    _invoices = [...SEED_INVOICES];
    await writeJson(INVOICES_FILE, _invoices);
  } else {
    _invoices = data;
  }
  return _invoices;
}

export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  _invoices = invoices;
  await writeJson(INVOICES_FILE, invoices);
}

// ── Pipeline ───────────────────────────────────────────────────────
export async function loadPipeline(): Promise<PipelineDeal[]> {
  if (_pipeline) return _pipeline;
  const data = await readJson<PipelineDeal[]>(PIPELINE_FILE, []);
  if (data.length === 0) {
    _pipeline = [...SEED_PIPELINE];
    await writeJson(PIPELINE_FILE, _pipeline);
  } else {
    _pipeline = data;
  }
  return _pipeline;
}

export async function savePipeline(pipeline: PipelineDeal[]): Promise<void> {
  _pipeline = pipeline;
  await writeJson(PIPELINE_FILE, pipeline);
}

// ── Pipeline CRUD ──────────────────────────────────────────────────

export async function updatePipelineDeal(id: string, updates: Partial<PipelineDeal>): Promise<PipelineDeal | null> {
  const pipeline = await loadPipeline();
  const idx = pipeline.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  pipeline[idx] = { ...pipeline[idx], ...updates, id };
  await savePipeline(pipeline);
  return pipeline[idx];
}

export async function createPipelineDeal(deal: Omit<PipelineDeal, "id">): Promise<PipelineDeal> {
  const pipeline = await loadPipeline();
  const id = `d${String(pipeline.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`;
  const newDeal: PipelineDeal = { ...deal, id };
  const updated = [...pipeline, newDeal];
  await savePipeline(updated);
  return newDeal;
}

export async function deletePipelineDeal(id: string): Promise<boolean> {
  const pipeline = await loadPipeline();
  const filtered = pipeline.filter((d) => d.id !== id);
  if (filtered.length === pipeline.length) return false;
  await savePipeline(filtered);
  return true;
}

// ── Invoice CRUD ───────────────────────────────────────────────────

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  const invoices = await loadInvoices();
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  invoices[idx] = { ...invoices[idx], ...updates, id };
  await saveInvoices(invoices);
  return invoices[idx];
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const invoices = await loadInvoices();
  const filtered = invoices.filter((i) => i.id !== id);
  if (filtered.length === invoices.length) return false;
  await saveInvoices(filtered);
  return true;
}

// ── Contract CRUD ──────────────────────────────────────────────────

export async function createContract(contract: Omit<Contract, "id" | "createdAt">): Promise<Contract> {
  const contracts = await loadContracts();
  const id = `ct${String(contracts.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`;
  const newContract: Contract = { ...contract, id, createdAt: new Date().toISOString() };
  const updated = [...contracts, newContract];
  await saveContracts(updated);
  return newContract;
}

export async function updateContract(id: string, updates: Partial<Contract>): Promise<Contract | null> {
  const contracts = await loadContracts();
  const idx = contracts.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  contracts[idx] = { ...contracts[idx], ...updates, id };
  await saveContracts(contracts);
  return contracts[idx];
}

export async function deleteContract(id: string): Promise<boolean> {
  const contracts = await loadContracts();
  const filtered = contracts.filter((c) => c.id !== id);
  if (filtered.length === contracts.length) return false;
  await saveContracts(filtered);
  return true;
}

// ── db-prefixed aliases (used by CRUD API routes) ────────────────────

export const dbGetClients = loadClients;
export const dbCreateClient = createClient;
export const dbUpdateClient = updateClient;
export const dbDeleteClient = deleteClient;
export const dbGetPipeline = loadPipeline;
export const dbUpdatePipelineDeal = updatePipelineDeal;
export const dbCreatePipelineDeal = createPipelineDeal;
export const dbDeletePipelineDeal = deletePipelineDeal;

// ── Computed KPIs (from persisted data) ────────────────────────────
export async function getDashboardKPIsFromStore() {
  const clients = await loadClients();
  const pipeline = await loadPipeline();
  const active = clients.filter((c) => c.status === "active");
  const currentMRR = active.reduce((sum, c) => sum + c.monthlyFee, 0);
  const currentARR = currentMRR * 12;
  const targetARR = 10_000_000;
  const pipelineValue = pipeline.reduce((sum, d) => sum + d.dealSize * (d.probability / 100), 0);
  const avgClientValue = active.length > 0 ? currentARR / active.length : 0;

  return {
    currentARR,
    targetARR,
    arrGap: targetARR - currentARR,
    currentMRR,
    targetMRR: 833_333,
    activeClients: active.length,
    totalClients: clients.length,
    pipelineValue,
    pipelineCount: pipeline.length,
    avgClientValue,
    churnRate: 0.05,
    growthRate: active.length > 0 ? 0 : 0,
  };
}

// ── Reset to seed data ─────────────────────────────────────────────
export async function resetToSeed(): Promise<void> {
  _clients = null;
  _proposals = null;
  _contracts = null;
  _invoices = null;
  _pipeline = null;
  await fs.rm(DATA_DIR, { recursive: true, force: true }).catch(() => {});
}

// ── Aliases used by the crud/ API routes ────────────────────────────
// storeGetClients is the legacy alias used by older routes.
export const storeGetClients = loadClients;