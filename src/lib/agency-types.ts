// ── RIG OS Agency — Core Types ──────────────────────────────────────

export type VerticalId =
  | "construction"
  | "law"
  | "healthcare"
  | "dental"
  | "cpa"
  | "services"
  | "manufacturing"
  | "pe_cfo";

export type ClientStatus =
  | "prospect"
  | "qualified"
  | "proposal_sent"
  | "negotiation"
  | "active"
  | "churned"
  | "lost";

export type ClientHealth = "green" | "yellow" | "red";

export type ServiceTierId = "starter" | "growth" | "scale" | "enterprise";

export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export type ContractStatus = "draft" | "active" | "expiring" | "expired" | "terminated";

export interface Vertical {
  id: VerticalId;
  name: string;
  icon: string;
  targetARR: number;
  clientCount: number;
  avgDealSize: number;
  salesCycleDays: number;
  color: string;
}

export interface ServiceTier {
  id: ServiceTierId;
  name: string;
  monthlyFee: number;
  annualFee: number;
  features: string[];
  deliverables: string[];
  slaHours: number;
  color: string;
}

export interface Client {
  id: string;
  name: string;
  vertical: VerticalId;
  status: ClientStatus;
  health: ClientHealth;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  serviceTier: ServiceTierId;
  monthlyFee: number;
  annualFee: number;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  services: string[];
  assignedAgents: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  clientId: string;
  clientName: string;
  vertical: VerticalId;
  scope: string;
  monthlyFee: number;
  annualValue: number;
  status: ProposalStatus;
  sentDate: string | null;
  acceptedDate: string | null;
  validUntil: string;
  proofPacketId: string | null;
  createdAt: string;
}

export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  type: string;
  monthlyFee: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  status: ContractStatus;
  terms: string;
  slaHours: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: InvoiceStatus;
  sentDate: string;
  paidDate: string | null;
  dueDate: string;
  lineItems: { description: string; amount: number }[];
  createdAt: string;
}

export interface RevenueMetric {
  month: string;
  arr: number;
  mrr: number;
  newClients: number;
  churnedClients: number;
  avgClientValue: number;
  pipelineValue: number;
}

export interface AgentAssignment {
  agentId: string;
  agentName: string;
  clientId: string;
  clientName: string;
  role: string;
  hoursPerWeek: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  deals: PipelineDeal[];
}

export interface PipelineDeal {
  id: string;
  clientName: string;
  vertical: VerticalId;
  dealSize: number;
  probability: number;
  nextAction: string;
  nextActionDate: string;
  stage: string;
}

export interface DashboardKPI {
  currentARR: number;
  targetARR: number;
  arrGap: number;
  currentMRR: number;
  targetMRR: number;
  activeClients: number;
  pipelineValue: number;
  pipelineCount: number;
  avgClientValue: number;
  churnRate: number;
  growthRate: number;
}