// ── RodgersIntelligence.com Offerings & Content ────────────────────
// Sourced from rodgersintelligence.com live site
// This is the canonical offerings data for the RIG OS Agency platform

export interface RIGOffering {
  id: string;
  name: string;
  category: "caio" | "forge" | "compliance" | "audit" | "build" | "fractional" | "advisory";
  price: string;
  priceNote?: string;
  description: string;
  deliverables: string[];
  timeline?: string;
  featured?: boolean;
}

export interface RIGVertical {
  id: string;
  name: string;
  wound: string;
  icon: string;
  color: string;
}

export interface RIGReceipt {
  client: string;
  result: string;
  metric: string;
  source: string;
}

export interface RIGEngagement {
  type: string;
  title: string;
  price: string;
  cadence: string;
  description: string;
}

// ── Three Doors (from rodgersintelligence.com) ────────────────────
export const RIG_DOORS = [
  {
    id: "operator",
    num: "01",
    title: "The Operator",
    subtitle: "Meet Mike",
    tagline: "The operator behind the firm. Not a vendor — the person who installs judgment first, then automates it.",
    stats: [
      { label: "systems shipped", value: "24" },
      { label: "AI agents in production", value: "100+" },
      { label: "patents in preparation", value: "3" },
    ],
    sections: [
      { title: "Iowa to the rack", body: "Iowa State origin to operating engineer. The Midwest discipline never left — he ships systems the way you'd build something meant to outlast the people who ordered it. From the cornfields to the server rack." },
      { title: "DEVIATION — the operator's manual", body: "Part memoir, part field manual. How to deviate from the median when the median is what's killing your company. The hardcover is the artifact; the thinking is the point." },
      { title: "Stages I'd fly to", body: "Three talks, delivered straight, no keynote theater: The median is the enemy, How to hire a CAIO, The HED playbook." },
      { title: "License the apparatus", body: "The Deviate Engine — the methodology and the machine, licensed to your industry." },
    ],
  },
  {
    id: "embed",
    num: "02",
    title: "Embed · Chief AI Officer",
    subtitle: "Hire the operator inside",
    tagline: "If you're hiring a CAIO who hasn't shipped twenty-four systems — you're hiring someone to learn on payroll.",
    stats: [],
    sections: [
      { title: "Day 30", body: "Audit, map the wounds, pick the first engine." },
      { title: "Day 60", body: "First system in production. Org structure drafted." },
      { title: "Day 90", body: "Second engine live. Team hired or contracted." },
      { title: "Day 100", body: "Roadmap, governance, and your CAIO succession plan." },
    ],
  },
  {
    id: "forge",
    num: "03",
    title: "The Forge · Hire RIG",
    subtitle: "Strategy first. AI second. Automation third.",
    tagline: "RIG is a build studio. Strategy, agents, and automation shipped as working systems — engineered to outlast the engagement.",
    stats: [
      { label: "closed-won", value: "15" },
      { label: "bookings", value: "$720k" },
      { label: "deal range", value: "$25–150k" },
    ],
    sections: [],
  },
];

// ── CAIO Engagement Models (from Door 02) ─────────────────────────
export const RIG_CAIO_ENGAGEMENTS: RIGEngagement[] = [
  {
    type: "W-2 · Full-time",
    title: "Chief AI Officer",
    price: "$425k base",
    cadence: "40% target bonus · 0.25–1.0% equity",
    description: "Full-time CAIO role. Sets strategy, stands up the org, ships the first engines.",
  },
  {
    type: "Fractional",
    title: "Fractional CAIO",
    price: "$36k / mo",
    cadence: "20 hrs/mo · async + 2× monthly syncs",
    description: "Embedded fractional CAIO for companies that need senior AI leadership without the full-time commitment.",
  },
  {
    type: "Advisory",
    title: "Board seat",
    price: "Board-level advisory",
    cadence: "Quarterly cadence",
    description: "Strategic AI advisory at the board level. Governance, risk, and opportunity mapping.",
  },
  {
    type: "Interim",
    title: "Interim CAIO",
    price: "Run the function until backfill",
    cadence: "Clean handoff",
    description: "Interim CAIO to run the AI function during leadership transitions, with a clean handoff to the permanent hire.",
  },
];

// ── Forge Offerings (from Door 03) ────────────────────────────────
export const RIG_FORGE_OFFERINGS: RIGOffering[] = [
  {
    id: "deterministic-starter",
    name: "RIG Deterministic Build Starter",
    category: "build",
    price: "Free",
    priceNote: "Clone the repo",
    description: "A Vite + TypeScript template with a sealed ProofPacket. It proves the build is reproducible and regression-green before anyone on your team touches it.",
    deliverables: ["Vite + TypeScript template", "Sealed ProofPacket", "Reproducible build proof", "Regression-green verification"],
    featured: true,
  },
  {
    id: "opportunity-report",
    name: "AI Opportunity Report",
    category: "audit",
    price: "$2,500",
    description: "Deep-dive audit of your organization's AI opportunities. Maps wounds, prioritizes engines, and delivers a build roadmap.",
    deliverables: ["Wound map", "Opportunity scoring", "Build roadmap", "ROI projections"],
    timeline: "2 weeks",
  },
  {
    id: "co-risk-check",
    name: "Colorado AI Law Risk Check",
    category: "compliance",
    price: "$3,500",
    description: "The Colorado AI Law (SB 24-205) takes effect June 30, 2026. Enforced by the Colorado AG, with civil penalties up to $20,000 per violation. We check your systems for compliance.",
    deliverables: ["SB 24-205 compliance audit", "Risk classification", "Remediation roadmap", "Documentation packet"],
    timeline: "1 week",
  },
  {
    id: "process-automation-audit",
    name: "Process Automation Audit",
    category: "audit",
    price: "$5,000",
    description: "Map every manual process in your operation. Score each for automation potential. Deliver a prioritized build queue.",
    deliverables: ["Process inventory", "Automation scoring matrix", "Priority build queue", "Cost-benefit analysis"],
    timeline: "2 weeks",
  },
  {
    id: "one-workflow",
    name: "One Workflow Automated",
    category: "build",
    price: "$8,000",
    description: "Pick one workflow. We automate it end-to-end with AI agents, deterministic code, and a sealed ProofPacket.",
    deliverables: ["1 automated workflow", "AI agent deployment", "ProofPacket", "Team training"],
    timeline: "2-3 weeks",
  },
  {
    id: "agent-build-pack",
    name: "Agent Build Pack",
    category: "build",
    price: "$15,000",
    description: "A pack of 3-5 AI agents deployed into your operations. Each agent ships with deterministic gates, monitoring, and proof.",
    deliverables: ["3-5 AI agents", "Deterministic gates", "Monitoring dashboards", "ProofPackets per agent"],
    timeline: "4-6 weeks",
  },
  {
    id: "fractional-operator",
    name: "Fractional AI Operator",
    category: "fractional",
    price: "$25,000 / mo",
    description: "Embedded fractional AI operator. Runs the engines, ships improvements, and manages the agent fleet.",
    deliverables: ["Dedicated operator", "Agent fleet management", "Weekly ProofPackets", "Monthly business review"],
  },
  {
    id: "intops-program",
    name: "IntOps Program Director",
    category: "fractional",
    price: "$40,000 / mo",
    description: "Full Intelligence Operations program direction. Manages strategy, build, and execution across your entire AI surface.",
    deliverables: ["Program direction", "Multi-team coordination", "Strategic roadmap", "Quarterly reviews"],
  },
  {
    id: "enterprise-build",
    name: "Enterprise AI Build",
    category: "build",
    price: "$150,000+",
    description: "Full-scale enterprise AI transformation. Strategy, build, deployment, and governance for organizations deploying at scale.",
    deliverables: ["Full enterprise audit", "Custom agent fleet", "Governance framework", "SLA guarantees", "On-premise option"],
    timeline: "3-6 months",
  },
  {
    id: "portfolio-partner",
    name: "Portfolio AI Partner",
    category: "advisory",
    price: "Custom",
    description: "For PE firms and holding companies. AI strategy and build capability across your portfolio companies.",
    deliverables: ["Portfolio AI assessment", "Per-company roadmaps", "Shared agent infrastructure", "Board-level reporting"],
  },
  {
    id: "center-of-excellence",
    name: "AI Center of Excellence",
    category: "build",
    price: "Custom",
    description: "Build an internal AI Center of Excellence. We set up the org, the tooling, the doctrine, and train your team to run it.",
    deliverables: ["CoE organizational design", "Tooling stack", "RIG doctrine license", "Team training program", "Governance framework"],
    timeline: "6-12 months",
  },
];

// ── 8 Verticals with Wounds (from rodgersintelligence.com) ────────
export const RIG_SITE_VERTICALS: RIGVertical[] = [
  { id: "manufacturing", name: "Manufacturing", wound: "Downtime, quality, and the data nobody trusts.", icon: "factory", color: "#c97c5e" },
  { id: "medspa", name: "Medspa", wound: "Lead response, rebooking, and front-desk drag.", icon: "sparkles", color: "#c4607e" },
  { id: "construction", name: "Construction", wound: "Bids, RFIs, and the paperwork that eats margin.", icon: "building", color: "#d4a574" },
  { id: "healthcare", name: "Healthcare", wound: "Triage, intake, and documentation burden.", icon: "heart", color: "#ef4444" },
  { id: "law", name: "Law", wound: "Review, intake, and the billable-hour trap.", icon: "scale", color: "#5ab896" },
  { id: "banking", name: "Community Banks", wound: "Compliance load and the legacy core.", icon: "landmark", color: "#fbbf24" },
  { id: "cpa", name: "CPA / Accounting", wound: "Busy-season crush and reconciliation grind.", icon: "calculator", color: "#a855f7" },
  { id: "services", name: "Services", wound: "Quoting, scheduling, and follow-up leakage.", icon: "briefcase", color: "#22d3ee" },
];

// ── Receipts (from rodgersintelligence.com) ───────────────────────
export const RIG_RECEIPTS: RIGReceipt[] = [
  {
    client: "EmOpti — teletriage",
    result: "Cut teletriage from 3 hours to 15 minutes per encounter",
    metric: "3 hrs → 15 min",
    source: "rodgersintelligence.com",
  },
  {
    client: "New revenue line",
    result: "$1M in new revenue · contributed to a $10M Series A",
    metric: "$1M revenue · $10M Series A",
    source: "rodgersintelligence.com",
  },
  {
    client: "AI-CI OS",
    result: "Competitive-intelligence operating system processing 150+ daily signals",
    metric: "150+ signals/day",
    source: "rodgersintelligence.com",
  },
];

// ── Screening Note ────────────────────────────────────────────────
export const RIG_SCREENING_NOTE = {
  title: "Screening Note",
  body: "We engage when there's a real budget to deploy — ≥ $150k annually or $25k / mo. Below that, start with the AI Opportunity Report.",
};

// ── Colorado AI Law (SB 24-205) ───────────────────────────────────
export const RIG_CO_AI_LAW = {
  law: "Colorado AI Law (SB 24-205)",
  effective: "June 30, 2026",
  enforcedBy: "Colorado Attorney General",
  penalty: "Up to $20,000 per violation",
  statute: "Colorado Consumer Protection Act",
  urgency: "If you deploy a high-risk AI system in Colorado, the clock is already running.",
};

// ── Mike's Talks ──────────────────────────────────────────────────
export const RIG_TALKS = [
  { title: "The median is the enemy", description: "Why average outcomes kill companies. How to deviate deliberately." },
  { title: "How to hire a CAIO", description: "What to look for, what to avoid, and why most CAIO hires fail." },
  { title: "The HED playbook", description: "Human-Engineered Deviation — the operator's framework for building systems that outlast the builder." },
];

// ── Field Notes (Substack) ────────────────────────────────────────
export const RIG_FIELD_NOTES = {
  title: "Field Notes",
  cadence: "Two emails a month on Substack",
  description: "What's working, what broke, what the median is getting wrong. No fluff, no funnels.",
};

// ── Helper Functions ──────────────────────────────────────────────
export function getFeaturedOfferings(): RIGOffering[] {
  return RIG_FORGE_OFFERINGS.filter((o) => o.featured);
}

export function getOfferingsByCategory(category: RIGOffering["category"]): RIGOffering[] {
  return RIG_FORGE_OFFERINGS.filter((o) => o.category === category);
}

export function getOfferingsByPriceRange(min: number, max: number): RIGOffering[] {
  return RIG_FORGE_OFFERINGS.filter((o) => {
    const price = parseInt(o.price.replace(/[^0-9]/g, ""));
    return !isNaN(price) && price >= min && price <= max;
  });
}
