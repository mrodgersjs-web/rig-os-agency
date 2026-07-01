// ── RIG OS Agency — Vertical Proposal Templates ─────────────────────
// 8 templates, one per vertical, with unique scope, deliverables, and pricing.

export type VerticalId = "construction" | "law" | "healthcare" | "dental" | "cpa" | "services" | "manufacturing" | "pe_cfo";

export interface ProposalTemplate {
  vertical: VerticalId;
  name: string;
  scope: string;
  deliverables: string[];
  pricing: {
    starter: { monthly: number; annual: number; scope: string };
    growth: { monthly: number; annual: number; scope: string };
    scale: { monthly: number; annual: number; scope: string };
    enterprise: { monthly: number; annual: number; scope: string };
  };
  timeline: string;
  proofPacketRequired: boolean;
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    vertical: "construction",
    name: "Construction AI Suite",
    scope: "AI-powered project risk analysis, bid estimation, safety compliance monitoring, and automated reporting for construction firms.",
    deliverables: ["Project risk AI engine", "Bid estimation model", "Safety compliance monitor", "Automated daily reports", "ProofPacket per project"],
    pricing: {
      starter: { monthly: 2500, annual: 30000, scope: "1 AI agent, monthly review" },
      growth: { monthly: 5000, annual: 60000, scope: "3 AI agents, weekly review, custom workflows" },
      scale: { monthly: 8000, annual: 96000, scope: "5 AI agents, daily monitoring, custom dashboards" },
      enterprise: { monthly: 18000, annual: 216000, scope: "Unlimited agents, white-label, 24/7" },
    },
    timeline: "4-6 weeks to deployment",
    proofPacketRequired: true,
  },
  {
    vertical: "law",
    name: "Legal Intelligence Suite",
    scope: "Contract review automation, case research engine, client intake bot, and compliance monitoring for law firms.",
    deliverables: ["Contract review AI", "Case research engine", "Client intake bot", "Compliance monitor", "ProofPacket per matter"],
    pricing: {
      starter: { monthly: 2500, annual: 30000, scope: "1 AI agent, monthly review" },
      growth: { monthly: 5000, annual: 60000, scope: "3 AI agents, weekly review" },
      scale: { monthly: 8000, annual: 96000, scope: "5 AI agents, daily monitoring" },
      enterprise: { monthly: 18000, annual: 216000, scope: "Unlimited, white-label, on-premise" },
    },
    timeline: "3-5 weeks to deployment",
    proofPacketRequired: true,
  },
  {
    vertical: "healthcare",
    name: "Healthcare Operations AI",
    scope: "Claims processing AI, OR utilization optimizer, denials management, and patient scheduling for healthcare systems.",
    deliverables: ["Claims processing AI", "OR utilization optimizer", "Denials management engine", "Patient scheduling AI", "ProofPacket per cycle"],
    pricing: {
      starter: { monthly: 2500, annual: 30000, scope: "1 AI agent, monthly review" },
      growth: { monthly: 5000, annual: 60000, scope: "3 AI agents, weekly review" },
      scale: { monthly: 8000, annual: 96000, scope: "5 AI agents, daily monitoring" },
      enterprise: { monthly: 18000, annual: 216000, scope: "Unlimited, white-label, 24/7, on-premise" },
    },
    timeline: "6-8 weeks to deployment",
    proofPacketRequired: true,
  },
  {
    vertical: "dental",
    name: "Dental Practice AI",
    scope: "Patient scheduling AI, insurance verification, treatment planning assist, and automated recall system for dental practices.",
    deliverables: ["Patient scheduling AI", "Insurance verification bot", "Treatment planning assist", "Automated recall system", "ProofPacket per quarter"],
    pricing: {
      starter: { monthly: 2500, annual: 30000, scope: "1 AI agent, monthly review" },
      growth: { monthly: 5000, annual: 60000, scope: "3 AI agents, weekly review" },
      scale: { monthly: 8000, annual: 96000, scope: "5 AI agents, daily monitoring" },
      enterprise: { monthly: 18000, annual: 216000, scope: "Unlimited, multi-location" },
    },
    timeline: "3-4 weeks to deployment",
    proofPacketRequired: true,
  },
  {
    vertical: "cpa",
    name: "Accounting Intelligence Suite",
    scope: "Tax document processing AI, audit prep engine, client communication bot, and financial statement review for CPA firms.",
    deliverables: ["Tax document AI", "Audit prep engine", "Client communication bot", "Financial review AI", "ProofPacket per engagement"],
    pricing: {
      starter: { monthly: 2500, annual: 30000, scope: "1 AI agent, monthly review" },
      growth: { monthly: 5000, annual: 60000, scope: "3 AI agents, weekly review" },
      scale: { monthly: 8000, annual: 96000, scope: "5 AI agents, daily monitoring" },
      enterprise: { monthly: 18000, annual: 216000, scope: "Unlimited, white-label" },
    },
    timeline: "3-4 weeks to deployment",
    proofPacketRequired: true,
  },
  {
    vertical: "services",
    name: "Professional Services AI",
    scope: "Client onboarding automation, project tracking, invoice processing, and automated reporting for professional services firms.",
    deliverables: ["Client onboarding AI", "Project tracking engine", "Invoice processing bot", "Automated reporting", "ProofPacket per project"],
    pricing: {
      starter: { monthly: 2500, annual: 30000, scope: "1 AI agent, monthly review" },
      growth: { monthly: 5000, annual: 60000, scope: "3 AI agents, weekly review" },
      scale: { monthly: 8000, annual: 96000, scope: "5 AI agents, daily monitoring" },
      enterprise: { monthly: 18000, annual: 216000, scope: "Unlimited, white-label" },
    },
    timeline: "2-3 weeks to deployment",
    proofPacketRequired: true,
  },
  {
    vertical: "manufacturing",
    name: "Manufacturing Intelligence Suite",
    scope: "Quality control AI, supply chain optimization, predictive maintenance, safety monitoring, and production scheduling.",
    deliverables: ["Quality control AI", "Supply chain optimizer", "Predictive maintenance", "Safety monitor", "Production scheduler", "ProofPacket per cycle"],
    pricing: {
      starter: { monthly: 2500, annual: 30000, scope: "1 AI agent, monthly review" },
      growth: { monthly: 5000, annual: 60000, scope: "3 AI agents, weekly review" },
      scale: { monthly: 8000, annual: 96000, scope: "5 AI agents, daily monitoring" },
      enterprise: { monthly: 18000, annual: 216000, scope: "Unlimited, on-premise, 24/7" },
    },
    timeline: "5-7 weeks to deployment",
    proofPacketRequired: true,
  },
  {
    vertical: "pe_cfo",
    name: "PE / Fractional CFO Intelligence",
    scope: "Portfolio company analysis, financial modeling automation, due diligence AI, and board reporting for PE firms and fractional CFOs.",
    deliverables: ["Portfolio analysis AI", "Financial modeling automation", "Due diligence engine", "Board reporting AI", "ProofPacket per quarter"],
    pricing: {
      starter: { monthly: 2500, annual: 30000, scope: "1 AI agent, monthly review" },
      growth: { monthly: 5000, annual: 60000, scope: "3 AI agents, weekly review" },
      scale: { monthly: 8000, annual: 96000, scope: "5 AI agents, daily monitoring" },
      enterprise: { monthly: 18000, annual: 216000, scope: "Unlimited, white-label, on-premise, SLA" },
    },
    timeline: "4-6 weeks to deployment",
    proofPacketRequired: true,
  },
];

export function getTemplate(vertical: VerticalId): ProposalTemplate | undefined {
  return PROPOSAL_TEMPLATES.find((t) => t.vertical === vertical);
}

export function getTemplates(): ProposalTemplate[] {
  return PROPOSAL_TEMPLATES;
}