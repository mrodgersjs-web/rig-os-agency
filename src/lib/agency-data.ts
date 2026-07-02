// ── RIG OS Agency — Seed Data & In-Memory Store ───────────────────
// All data is in-memory for v1. Replace with SQLite/Postgres in v2.

import type {
  Vertical, ServiceTier, Client, Proposal, Contract, Invoice,
  RevenueMetric, PipelineDeal, DashboardKPI, VerticalId, ServiceTierId,
  JobApplication,
} from "./agency-types";

// ── Seed Job Applications ──────────────────────────────────────────
export const SEED_JOBS: JobApplication[] = [
  {
    id: "job_001",
    company: "BuildRight Construction Group",
    role: "Fractional CMO (Construction Division)",
    location: "Austin, TX",
    remote: true,
    salaryMin: 120000,
    salaryMax: 180000,
    salaryNote: "Equity available",
    jobUrl: "https://linkedin.com/jobs/view/buildright-cmo",
    status: "interview",
    priority: "high",
    appliedDate: "2026-06-15T00:00:00.000Z",
    deadline: "2026-07-10T00:00:00.000Z",
    contactName: "Sarah Chen",
    contactEmail: "sarah.chen@buildright.co",
    source: "LinkedIn",
    notes: "2nd round with VP Ops. They need full-funnel marketing for $40M GC. Proposed 15h/week retainer at $12K/mo as alternative.",
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-28T14:30:00.000Z",
  },
  {
    id: "job_002",
    company: "Coastal Dental Partners",
    role: "Growth Marketing Consultant",
    location: "Remote (US)",
    remote: true,
    salaryMin: 8000,
    salaryMax: 12000,
    salaryNote: "$8-12K/mo retainer scope",
    jobUrl: "https://linkedin.com/jobs/view/coastal-dental-growth",
    status: "phone_screen",
    priority: "urgent",
    appliedDate: "2026-06-22T00:00:00.000Z",
    deadline: "2026-07-05T00:00:00.000Z",
    contactName: "Dr. Marcus Webb",
    contactEmail: "mwebb@coastaldental.com",
    source: "Referral (Jake)",
    notes: "22-location DSO. Needs patient acquisition system + retention. Urgent — they're evaluating 3 agencies by July 5.",
    createdAt: "2026-06-22T09:00:00.000Z",
    updatedAt: "2026-06-29T11:00:00.000Z",
  },
  {
    id: "job_003",
    company: "Ironclad Manufacturing",
    role: "Digital Transformation Lead",
    location: "Pittsburgh, PA",
    remote: false,
    salaryMin: 140000,
    salaryMax: 200000,
    salaryNote: "Full-time with bonus structure",
    jobUrl: "https://indeed.com/viewjob?jk=ironclad-mfg",
    status: "applied",
    priority: "medium",
    appliedDate: "2026-06-25T00:00:00.000Z",
    deadline: null,
    contactName: "",
    contactEmail: "careers@ironclad-mfg.com",
    source: "Indeed",
    notes: "Mid-size manufacturer ($80M rev) needing marketing automation + CRM overhaul. Applied with tailored proposal.",
    createdAt: "2026-06-25T13:00:00.000Z",
    updatedAt: "2026-06-25T13:00:00.000Z",
  },
  {
    id: "job_004",
    company: "Summit Law LLP",
    role: "Business Development Strategist",
    location: "New York, NY",
    remote: true,
    salaryMin: null,
    salaryMax: null,
    salaryNote: "Project-based, TBD",
    jobUrl: "https://linkedin.com/jobs/view/summit-law-bd",
    status: "saved",
    priority: "low",
    appliedDate: null,
    deadline: "2026-07-15T00:00:00.000Z",
    contactName: "Jennifer Park",
    contactEmail: "jpark@summitlaw.com",
    source: "LinkedIn",
    notes: "AmLaw 200 firm. Interesting — they want BD + digital. Save for now, apply if pipeline thins.",
    createdAt: "2026-06-20T16:00:00.000Z",
    updatedAt: "2026-06-20T16:00:00.000Z",
  },
  {
    id: "job_005",
    company: "Peak Health Orthopedics",
    role: "Patient Acquisition Director",
    location: "Denver, CO",
    remote: true,
    salaryMin: 130000,
    salaryMax: 170000,
    salaryNote: "+ performance bonus",
    jobUrl: "https://linkedin.com/jobs/view/peak-health-patient-acq",
    status: "final_round",
    priority: "urgent",
    appliedDate: "2026-06-10T00:00:00.000Z",
    deadline: "2026-07-03T00:00:00.000Z",
    contactName: "Dr. Emily Torres",
    contactEmail: "etorres@peakhealthortho.com",
    source: "Cold Outreach",
    notes: "Final round July 2. They want surgical-volume growth via SEO + paid. Strong fit. Pitching RIG retainer as alt to FT.",
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-06-30T10:00:00.000Z",
  },
  {
    id: "job_006",
    company: "Vertex Capital Partners",
    role: "Portfolio Company Growth Advisor",
    location: "Remote (Global)",
    remote: true,
    salaryMin: 15000,
    salaryMax: 25000,
    salaryNote: "$15-25K/mo per portco engagement",
    jobUrl: "https://linkedin.com/jobs/view/vertex-growth-advisor",
    status: "offer",
    priority: "high",
    appliedDate: "2026-06-05T00:00:00.000Z",
    deadline: "2026-07-08T00:00:00.000Z",
    contactName: "Robert Kessler",
    contactEmail: "rkessler@vertexcap.com",
    source: "Referral (Mike)",
    notes: "OFFER RECEIVED: $18K/mo for 3 portfolio companies. Negotiating scope. Deadline to respond July 8.",
    createdAt: "2026-06-05T11:00:00.000Z",
    updatedAt: "2026-06-29T15:00:00.000Z",
  },
  {
    id: "job_007",
    company: "Apex CPA Group",
    role: "Marketing Director",
    location: "Remote (US)",
    remote: true,
    salaryMin: 100000,
    salaryMax: 140000,
    salaryNote: "",
    jobUrl: "https://linkedin.com/jobs/view/apex-cpa-marketing",
    status: "rejected",
    priority: "low",
    appliedDate: "2026-05-28T00:00:00.000Z",
    deadline: null,
    contactName: "David Liu",
    contactEmail: "dliu@apexcpa.com",
    source: "LinkedIn",
    notes: "Rejected June 20. They went with an in-house hire. Good learning: smaller CPA firms want W2 over retainer.",
    createdAt: "2026-05-28T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
  },
  {
    id: "job_008",
    company: "Greenfield Professional Services",
    role: "Growth Partner",
    location: "Remote",
    remote: true,
    salaryMin: 9000,
    salaryMax: 14000,
    salaryNote: "$9-14K/mo retainer",
    jobUrl: "https://linkedin.com/jobs/view/greenfield-growth",
    status: "applied",
    priority: "medium",
    appliedDate: "2026-06-27T00:00:00.000Z",
    deadline: "2026-07-20T00:00:00.000Z",
    contactName: "Tom Bradley",
    contactEmail: "tbradley@greenfieldpro.com",
    source: "LinkedIn",
    notes: "B2B services firm, $25M rev. Looking for content + outbound + CRM. Applied with case study.",
    createdAt: "2026-06-27T14:00:00.000Z",
    updatedAt: "2026-06-27T14:00:00.000Z",
  },
];

// ── 8 Verticals ────────────────────────────────────────────────────
export const VERTICALS: Vertical[] = [
  { id: "construction", name: "Construction", icon: "building", targetARR: 1_500_000, clientCount: 15, avgDealSize: 8_000, salesCycleDays: 45, color: "#d4a574" },
  { id: "law", name: "Law Firms", icon: "scale", targetARR: 1_500_000, clientCount: 15, avgDealSize: 7_000, salesCycleDays: 30, color: "#5ab896" },
  { id: "healthcare", name: "Healthcare / Orthopedics", icon: "heart", targetARR: 1_500_000, clientCount: 12, avgDealSize: 9_000, salesCycleDays: 60, color: "#ef4444" },
  { id: "dental", name: "Dental", icon: "smile", targetARR: 1_000_000, clientCount: 12, avgDealSize: 6_000, salesCycleDays: 30, color: "#22d3ee" },
  { id: "cpa", name: "CPA / Accounting", icon: "calculator", targetARR: 1_000_000, clientCount: 12, avgDealSize: 5_000, salesCycleDays: 25, color: "#fbbf24" },
  { id: "services", name: "Professional Services", icon: "briefcase", targetARR: 1_000_000, clientCount: 18, avgDealSize: 4_500, salesCycleDays: 20, color: "#a855f7" },
  { id: "manufacturing", name: "Manufacturing", icon: "factory", targetARR: 1_000_000, clientCount: 10, avgDealSize: 8_500, salesCycleDays: 50, color: "#c97c5e" },
  { id: "pe_cfo", name: "PE / Fractional CFO", icon: "trending", targetARR: 1_500_000, clientCount: 8, avgDealSize: 12_000, salesCycleDays: 40, color: "#c4607e" },
];

// ── Service Tiers ──────────────────────────────────────────────────
export const SERVICE_TIERS: ServiceTier[] = [
  {
    id: "starter", name: "Starter", monthlyFee: 2_500, annualFee: 30_000,
    features: ["AI agent deployment", "Monthly strategy review", "Email support"],
    deliverables: ["1 AI agent in production", "Monthly ProofPacket", "Quarterly business review"],
    slaHours: 48, color: "#5ab896",
  },
  {
    id: "growth", name: "Growth", monthlyFee: 5_000, annualFee: 60_000,
    features: ["3 AI agents", "Weekly strategy review", "Priority support", "Custom workflows"],
    deliverables: ["3 AI agents in production", "Weekly ProofPackets", "Monthly business review", "Custom integrations"],
    slaHours: 24, color: "#d4a574",
  },
  {
    id: "scale", name: "Scale", monthlyFee: 8_000, annualFee: 96_000,
    features: ["5 AI agents", "Daily monitoring", "Dedicated success manager", "Custom dashboards"],
    deliverables: ["5 AI agents in production", "Daily ProofPackets", "Weekly business reviews", "Custom dashboards", "API integrations"],
    slaHours: 12, color: "#c4607e",
  },
  {
    id: "enterprise", name: "Enterprise", monthlyFee: 18_000, annualFee: 216_000,
    features: ["Unlimited agents", "24/7 monitoring", "Dedicated team", "White-label", "On-premise option"],
    deliverables: ["Unlimited agents", "Real-time ProofPackets", "Daily reviews", "White-label dashboards", "On-premise deployment", "SLA guarantees"],
    slaHours: 4, color: "#ef4444",
  },
];

// ── Seed Clients ───────────────────────────────────────────────────
const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

export const SEED_CLIENTS: Client[] = [
  { id: "c001", name: "Rocky Mountain Orthopedics", vertical: "healthcare", status: "active", health: "green", contactName: "Dr. Sarah Chen", contactEmail: "sarah@rmortho.com", contactPhone: "303-555-0101", website: "rmortho.com", serviceTier: "growth", monthlyFee: 5000, annualFee: 60000, startDate: daysAgo(90), endDate: daysAhead(275), autoRenew: true, services: ["Claims processing AI", "OR utilization optimizer", "Denials management"], assignedAgents: ["rig-healthcare-01", "rig-claims-02"], notes: "OR utilization went from 63% to 89% in pilot.", createdAt: daysAgo(95), updatedAt: daysAgo(2) },
  { id: "c002", name: "Henderson Construction Group", vertical: "construction", status: "active", health: "green", contactName: "Mike Henderson", contactEmail: "mike@hendersonconst.com", contactPhone: "303-555-0102", website: "hendersonconst.com", serviceTier: "scale", monthlyFee: 8000, annualFee: 96000, startDate: daysAgo(60), endDate: daysAhead(305), autoRenew: true, services: ["Project risk AI", "Bid estimation engine", "Safety compliance monitor"], assignedAgents: ["rig-construction-01"], notes: "Bid win rate up 23% since AI estimation deployed.", createdAt: daysAgo(65), updatedAt: daysAgo(1) },
  { id: "c003", name: "Denver Dental Partners", vertical: "dental", status: "active", health: "yellow", contactName: "Dr. James Park", contactEmail: "james@denverdental.com", contactPhone: "303-555-0103", website: "denverdental.com", serviceTier: "starter", monthlyFee: 2500, annualFee: 30000, startDate: daysAgo(45), endDate: daysAhead(320), autoRenew: false, services: ["Patient scheduling AI"], assignedAgents: ["rig-dental-01"], notes: "Renewal discussion needed — contract expires in 320 days.", createdAt: daysAgo(50), updatedAt: daysAgo(7) },
  { id: "c004", name: "Summit CPA Group", vertical: "cpa", status: "active", health: "green", contactName: "Lisa Tran", contactEmail: "lisa@summitcpa.com", contactPhone: "303-555-0104", website: "summitcpa.com", serviceTier: "growth", monthlyFee: 5000, annualFee: 60000, startDate: daysAgo(30), endDate: daysAhead(335), autoRenew: true, services: ["Tax document AI", "Audit prep engine", "Client communication bot"], assignedAgents: ["rig-cpa-01", "rig-cpa-02"], notes: "Audit prep time reduced 60%.", createdAt: daysAgo(35), updatedAt: daysAgo(3) },
  { id: "c005", name: "Front Range Manufacturing", vertical: "manufacturing", status: "qualified", health: "green", contactName: "Bob Stevens", contactEmail: "bob@frmanufacturing.com", contactPhone: "303-555-0105", website: "frmanufacturing.com", serviceTier: "scale", monthlyFee: 8000, annualFee: 96000, startDate: daysAgo(10), endDate: null, autoRenew: false, services: [], assignedAgents: [], notes: "Qualified lead from LinkedIn DM. Proposal sent.", createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  { id: "c006", name: "Milestone Partners PE", vertical: "pe_cfo", status: "proposal_sent", health: "green", contactName: "Jennifer Walsh", contactEmail: "jennifer@milestonepe.com", contactPhone: "303-555-0106", website: "milestonepe.com", serviceTier: "enterprise", monthlyFee: 18000, annualFee: 216000, startDate: daysAgo(5), endDate: null, autoRenew: false, services: [], assignedAgents: [], notes: "Enterprise proposal sent. Awaiting board approval.", createdAt: daysAgo(5), updatedAt: daysAgo(1) },
  { id: "c007", name: "Apex Legal Group", vertical: "law", status: "active", health: "green", contactName: "Robert Kim", contactEmail: "robert@apexlegal.com", contactPhone: "303-555-0107", website: "apexlegal.com", serviceTier: "growth", monthlyFee: 5000, annualFee: 60000, startDate: daysAgo(75), endDate: daysAhead(290), autoRenew: true, services: ["Contract review AI", "Case research engine", "Client intake bot"], assignedAgents: ["rig-law-01"], notes: "Contract review time down 70%.", createdAt: daysAgo(80), updatedAt: daysAgo(4) },
  { id: "c008", name: "Colorado Services Co", vertical: "services", status: "prospect", health: "green", contactName: "Amanda Foster", contactEmail: "amanda@coservices.com", contactPhone: "303-555-0108", website: "coservices.com", serviceTier: "starter", monthlyFee: 2500, annualFee: 30000, startDate: daysAgo(2), endDate: null, autoRenew: false, services: [], assignedAgents: [], notes: "Initial contact from LinkedIn post engagement.", createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: "c009", name: "Pioneer Dental Group", vertical: "dental", status: "qualified", health: "green", contactName: "Dr. Emily Rodriguez", contactEmail: "emily@pioneerdental.com", contactPhone: "303-555-0109", website: "pioneerdental.com", serviceTier: "growth", monthlyFee: 5000, annualFee: 60000, startDate: daysAgo(7), endDate: null, autoRenew: false, services: [], assignedAgents: [], notes: "Qualified from cold email sequence. Interested in scheduling AI.", createdAt: daysAgo(7), updatedAt: daysAgo(1) },
  { id: "c010", name: "Granite Peak Construction", vertical: "construction", status: "negotiation", health: "yellow", contactName: "Tom Bradley", contactEmail: "tom@granitepeak.com", contactPhone: "303-555-0110", website: "granitepeak.com", serviceTier: "enterprise", monthlyFee: 18000, annualFee: 216000, startDate: daysAgo(15), endDate: null, autoRenew: false, services: [], assignedAgents: [], notes: "Negotiating enterprise contract. Price discussion ongoing.", createdAt: daysAgo(15), updatedAt: daysAgo(1) },
];

// ── Seed Proposals ────────────────────────────────────────────────
export const SEED_PROPOSALS: Proposal[] = [
  { id: "p001", clientId: "c005", clientName: "Front Range Manufacturing", vertical: "manufacturing", scope: "5 AI agents: quality control, supply chain, predictive maintenance, safety, scheduling", monthlyFee: 8000, annualValue: 96000, status: "sent", sentDate: daysAgo(5), acceptedDate: null, validUntil: daysAhead(25), proofPacketId: null, createdAt: daysAgo(5) },
  { id: "p002", clientId: "c006", clientName: "Milestone Partners PE", vertical: "pe_cfo", scope: "Enterprise: unlimited agents, white-label, on-premise, 24/7 monitoring", monthlyFee: 18000, annualValue: 216000, status: "sent", sentDate: daysAgo(5), acceptedDate: null, validUntil: daysAhead(25), proofPacketId: null, createdAt: daysAgo(5) },
  { id: "p003", clientId: "c010", clientName: "Granite Peak Construction", vertical: "construction", scope: "Enterprise: 10+ agents, custom dashboards, dedicated team, SLA", monthlyFee: 18000, annualValue: 216000, status: "sent", sentDate: daysAgo(10), acceptedDate: null, validUntil: daysAhead(20), proofPacketId: null, createdAt: daysAgo(10) },
];

// ── Seed Contracts ─────────────────────────────────────────────────
export const SEED_CONTRACTS: Contract[] = SEED_CLIENTS
  .filter((c) => c.status === "active")
  .map((c, i) => ({
    id: `ct${String(i + 1).padStart(3, "0")}`,
    clientId: c.id,
    clientName: c.name,
    type: c.serviceTier,
    monthlyFee: c.monthlyFee,
    startDate: c.startDate,
    endDate: c.endDate || daysAhead(365),
    autoRenew: c.autoRenew,
    status: "active" as const,
    terms: `${c.serviceTier} tier, ${c.services.length} services, SLA ${SERVICE_TIERS.find((t) => t.id === c.serviceTier)?.slaHours || 48}h`,
    slaHours: SERVICE_TIERS.find((t) => t.id === c.serviceTier)?.slaHours || 48,
    createdAt: c.createdAt,
  }));

// ── Seed Invoices ──────────────────────────────────────────────────
export const SEED_INVOICES: Invoice[] = SEED_CLIENTS
  .filter((c) => c.status === "active")
  .map((c, i) => ({
    id: `inv${String(i + 1).padStart(3, "0")}`,
    clientId: c.id,
    clientName: c.name,
    amount: c.monthlyFee,
    status: "paid" as const,
    sentDate: daysAgo(15),
    paidDate: daysAgo(10),
    dueDate: daysAgo(5),
    lineItems: [{ description: `${c.serviceTier} tier — monthly`, amount: c.monthlyFee }],
    createdAt: daysAgo(15),
  }));

// ── Revenue Projections ($10M ARR Path) ───────────────────────────
export const REVENUE_PROJECTIONS: RevenueMetric[] = [
  { month: "2026-Q3", arr: 250_000, mrr: 20_833, newClients: 5, churnedClients: 0, avgClientValue: 5_000, pipelineValue: 500_000 },
  { month: "2026-Q4", arr: 500_000, mrr: 41_667, newClients: 10, churnedClients: 1, avgClientValue: 5_000, pipelineValue: 800_000 },
  { month: "2027-Q1", arr: 1_000_000, mrr: 83_333, newClients: 20, churnedClients: 2, avgClientValue: 5_500, pipelineValue: 1_200_000 },
  { month: "2027-Q2", arr: 2_500_000, mrr: 208_333, newClients: 30, churnedClients: 3, avgClientValue: 6_500, pipelineValue: 2_000_000 },
  { month: "2027-Q3", arr: 5_000_000, mrr: 416_667, newClients: 40, churnedClients: 5, avgClientValue: 7_500, pipelineValue: 3_000_000 },
  { month: "2027-Q4", arr: 10_000_000, mrr: 833_333, newClients: 50, churnedClients: 5, avgClientValue: 8_333, pipelineValue: 4_000_000 },
];

// ── Pipeline Deals ─────────────────────────────────────────────────
export const SEED_PIPELINE: PipelineDeal[] = [
  { id: "d001", clientName: "Colorado Services Co", vertical: "services", dealSize: 30_000, probability: 20, nextAction: "Discovery call", nextActionDate: daysAhead(3), stage: "prospect" },
  { id: "d002", clientName: "Pioneer Dental Group", vertical: "dental", dealSize: 60_000, probability: 40, nextAction: "Send proposal", nextActionDate: daysAhead(2), stage: "qualified" },
  { id: "d003", clientName: "Front Range Manufacturing", vertical: "manufacturing", dealSize: 96_000, probability: 60, nextAction: "Follow up on proposal", nextActionDate: daysAhead(5), stage: "proposal_sent" },
  { id: "d004", clientName: "Milestone Partners PE", vertical: "pe_cfo", dealSize: 216_000, probability: 50, nextAction: "Board presentation", nextActionDate: daysAhead(7), stage: "proposal_sent" },
  { id: "d005", clientName: "Granite Peak Construction", vertical: "construction", dealSize: 216_000, probability: 70, nextAction: "Price negotiation call", nextActionDate: daysAhead(1), stage: "negotiation" },
];

// ── Helper Functions ──────────────────────────────────────────────
export function getClients(): Client[] {
  return SEED_CLIENTS;
}

export function getActiveClients(): Client[] {
  return SEED_CLIENTS.filter((c) => c.status === "active");
}

export function getVerticals(): Vertical[] {
  return VERTICALS;
}

export function getServiceTiers(): ServiceTier[] {
  return SERVICE_TIERS;
}

export function getProposals(): Proposal[] {
  return SEED_PROPOSALS;
}

export function getContracts(): Contract[] {
  return SEED_CONTRACTS;
}

export function getInvoices(): Invoice[] {
  return SEED_INVOICES;
}

export function getRevenueProjections(): RevenueMetric[] {
  return REVENUE_PROJECTIONS;
}

export function getPipelineDeals(): PipelineDeal[] {
  return SEED_PIPELINE;
}

export function getDashboardKPIs(): DashboardKPI {
  const active = getActiveClients();
  const currentMRR = active.reduce((sum, c) => sum + c.monthlyFee, 0);
  const currentARR = currentMRR * 12;
  const targetARR = 10_000_000;
  const pipelineValue = SEED_PIPELINE.reduce((sum, d) => sum + d.dealSize * (d.probability / 100), 0);
  const avgClientValue = active.length > 0 ? currentARR / active.length : 0;

  return {
    currentARR,
    targetARR,
    arrGap: targetARR - currentARR,
    currentMRR,
    targetMRR: 833_333,
    activeClients: active.length,
    pipelineValue,
    pipelineCount: SEED_PIPELINE.length,
    avgClientValue,
    churnRate: 0.05,
    growthRate: 0,
  };
}

export function getRevenueByVertical(): { vertical: VerticalId; name: string; arr: number; clientCount: number; color: string }[] {
  return VERTICALS.map((v) => {
    const clients = SEED_CLIENTS.filter((c) => c.vertical === v.id && c.status === "active");
    const arr = clients.reduce((sum, c) => sum + c.annualFee, 0);
    return { vertical: v.id, name: v.name, arr, clientCount: clients.length, color: v.color };
  });
}

export function getRevenueByTier(): { tier: ServiceTierId; name: string; arr: number; clientCount: number; color: string }[] {
  return SERVICE_TIERS.map((t) => {
    const clients = SEED_CLIENTS.filter((c) => c.serviceTier === t.id && c.status === "active");
    const arr = clients.reduce((sum, c) => sum + c.annualFee, 0);
    return { tier: t.id, name: t.name, arr, clientCount: clients.length, color: t.color };
  });
}