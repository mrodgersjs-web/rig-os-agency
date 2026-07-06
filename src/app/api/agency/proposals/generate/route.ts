import { NextResponse } from "next/server";
import type {
  ServiceTierId,
  VerticalId,
} from "@/lib/agency-types";
import { dbGetClients, dbGetPipelineDeals } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProposalInput {
  clientName?: string;
  clientId?: string;
  vertical?: VerticalId;
  monthlyBudget?: number;
  dealSize?: number;
  tier?: ServiceTierId;
  problem?: string;
  desiredOutcomes?: string[];
  timelineWeeks?: number;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}

interface ProposalOutput {
  proposalId: string;
  generatedAt: string;
  clientName: string;
  vertical: VerticalId;
  tier: ServiceTierId;
  monthlyFee: number;
  annualFee: number;
  timelineWeeks: number;
  confidenceScore: number;
  rationale: string;
  sections: {
    executiveSummary: string;
    scope: string;
    deliverables: string[];
    timeline: { week: number; milestone: string }[];
    investment: string;
    nextSteps: string[];
  };
  markdown: string;
}

const VERTICAL_PLAYBOOKS: Record<VerticalId, { pains: string[]; outcomes: string[]; channels: string[]; }> = {
  construction: {
    pains: [
      "Bid pipeline visibility drops 35% between estimate and contract.",
      "Project managers lose 8-12 hours/week on manual RFP triage.",
      "Local SEO under-indexes against regional GCs with deeper review velocity.",
    ],
    outcomes: [
      "30-45 more qualified bids per quarter via targeted intent campaigns.",
      "Pipeline dashboard with auto-scoring of estimate-to-contract conversions.",
      "Rank 1-3 in 5 high-intent service geographies within 90 days.",
    ],
    channels: ["Google Business Profile", "Google Ads (LSAs)", "Construction trade directories", "LinkedIn for project owners"],
  },
  dental: {
    pains: [
      "Patient acquisition cost rose 22% YoY while insurance reimbursements fell.",
      "Recall hygiene reactivation rate stalled at 38%.",
      "Front-desk call-conversion drops 11% after 4 PM.",
    ],
    outcomes: [
      "Reduce blended CAC by 18-28% within 6 months.",
      "Lift hygiene reactivation rate to 62%+.",
      "Add 25-40 new patient starts/month per location.",
    ],
    channels: ["Google Ads", "Facebook + Instagram", "Patient review velocity", "Local SEO + LSA"],
  },
  legal: {
    pains: [
      "Lead-to-intake conversion hovers at 9-12%.",
      "Intake team answers the same 6 FAQs 40+ times/week.",
      "High-value practice areas (M&A, IP) under-resourced on the intake form.",
    ],
    outcomes: [
      "Reach 18-22% lead-to-intake conversion within 90 days.",
      "Auto-triage FAQ volume with 24/7 conversational intake.",
      "Identify and replicate the top 20% of cases that drive 80% of revenue.",
    ],
    channels: ["LinkedIn thought leadership", "Authoritative legal SEO", "Intake automation", "Referral partner programs"],
  },
  manufacturing: {
    pains: [
      "Trade-show ROI is unmeasurable; pipeline attribution stops at the show floor.",
      "Distributor enablement content lives in 7 different portals.",
      "Sales cycle is 9-14 months with no nurture between stages.",
    ],
    outcomes: [
      "Cut sales cycle by 22% with sequenced nurture across stages.",
      "Unified distributor portal with auto-personalized decks.",
      "Forecast accuracy within ±8% across 4 quarter window.",
    ],
    channels: ["LinkedIn Ads to plant managers", "Industrial SEO", "Distributor portal automation", "Email + direct mail sequences"],
  },
  healthcare: {
    pains: [
      "Patient leakage to competitors via Google Maps is 18-26% per market.",
      "Provider directory listings drift across 14+ aggregator sites.",
      "Review velocity slows after the first 6 months post-launch.",
    ],
    outcomes: [
      "Recover 12-20% of leaky appointment demand to owned channels.",
      "Single source of truth for provider data with weekly drift audits.",
      "Compound 25+ new verified reviews per location per quarter.",
    ],
    channels: ["Provider directory sync", "Local SEO", "Reputation automation", "Patient reactivation"],
  },
  realestate: {
    pains: [
      "Lead-to-tour conversion stalls at 8% across web forms.",
      "Agents spend 14 hours/week on marketing instead of closing.",
      "Sphere-of-influence (SOI) nurture is one-size-fits-all emails.",
    ],
    outcomes: [
      "Lift conversion to 16-22% with AI-scored tours.",
      "Reclaim 12+ hours/week per agent with templated listing kits.",
      "Double SOI referral activity within 6 months.",
    ],
    channels: ["Facebook + IG ads", "Hyperlocal SEO", "Listing kit automation", "SOI personalized drips"],
  },
  ecommerce: {
    pains: [
      "Blended CAC is climbing while AOV is flat.",
      "Email/ SMS revenue share dropped from 38% to 24%.",
      "Subscriptions leak at month-3 due to weak lifecycle hooks.",
    ],
    outcomes: [
      "Blended CAC -22% and AOV +12% within 2 quarters.",
      "Owned-channel revenue share back to 36%+.",
      "Subscription retention to 84%+ at month-6.",
    ],
    channels: ["Paid social retargeting", "Lifecycle email + SMS", "Subscription engagement loops", "UGC + creator collabs"],
  },
  saas: {
    pains: [
      "Free-to-paid conversion hovers at 2-4% — well below category median 6-8%.",
      "Activation milestone (first 'aha') takes 11+ days for new accounts.",
      "Product-led loop isn't yet self-sustaining — sales still closes the largest deals.",
    ],
    outcomes: [
      "Move free-to-paid to 7-10% with activation redesign.",
      "Compress activation to <4 days for top persona.",
      "Build PQL handoff so sales only engages 30%+ intent signals.",
    ],
    channels: ["SEO for ICP use cases", "Lifecycle email", "Developer community", "Partner ecosystem"],
  },
  services: {
    pains: [
      "Referral pipeline is opaque — can't forecast 90 days out.",
      "Proposal turnaround loses 28% of warm leads.",
      "NPS is fine but expansion revenue is flat.",
    ],
    outcomes: [
      "Forecast within ±10% accuracy for next 2 quarters.",
      "Proposal turnaround <48 hours with 70%+ close rate on warm leads.",
      "Net revenue retention >115% via defined expansion plays.",
    ],
    channels: ["Outbound sequencing", "Authority content + SEO", "Partner referrals", "Customer expansion plays"],
  },
  nonprofit: {
    pains: [
      "Donor retention slips to 38% (category median 45%).",
      "Major-gift pipeline is thin and aging.",
      "Year-end giving plateaued despite growing list size.",
    ],
    outcomes: [
      "Donor retention to 48%+ within 12 months.",
      "Build a 50+ major-gift prospect pipeline refreshed quarterly.",
      "Year-end revenue +22-32% YoY.",
    ],
    channels: ["Donor stewardship automation", "Major-gift modeling", "Year-end giving sequences", "Storytelling content"],
  },
};

function pickTier(monthlyBudget?: number): { tier: ServiceTierId; monthly: number; annual: number; } {
  const mb = monthlyBudget ?? 5000;
  if (mb < 3500) return { tier: "starter", monthly: 2500, annual: 30000 };
  if (mb < 8500) return { tier: "growth", monthly: 6000, annual: 72000 };
  if (mb < 18000) return { tier: "scale", monthly: 12000, annual: 144000 };
  return { tier: "enterprise", monthly: 25000, annual: 300000 };
}

function generate(input: ProposalInput): ProposalOutput {
  const vertical = (input.vertical || "services") as VerticalId;
  const chosen = input.tier
    ? pickTierByTier(input.tier)
    : pickTier(input.monthlyBudget);
  const tier = chosen.tier;
  const monthlyFee = chosen.monthly;
  const annualFee = chosen.annual;
  const timelineWeeks = Math.max(
    4, Math.min(26, input.timelineWeeks || defaultTimelineFor(tier))
  );
  const playbook = VERTICAL_PLAYBOOKS[vertical] || VERTICAL_PLAYBOOKS.services;

  const proposalId = `prop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const clientName = (input.clientName || "Prospective Client").trim();
  const contactName = (input.contactName || "Decision Maker").trim();

  const pains = input.problem
    ? [input.problem.trim(), ...playbook.pains.slice(0, 2)]
    : playbook.pains.slice(0, 3);

  const outcomes = (input.desiredOutcomes && input.desiredOutcomes.length)
    ? [...input.desiredOutcomes.slice(0, 4), ...playbook.outcomes.slice(0, 2)]
    : playbook.outcomes.slice(0, 4);

  const channels = playbook.channels.slice(0, 4);

  const deliverables = deliverablesByTier(tier, vertical);

  const timeline = buildTimeline(timelineWeeks, deliverables.length);

  const executiveSummary = [
    `## Executive Summary`,
    ``,
    `${clientName} is positioned to capture outsized share in the ${vertical} market by combining ${channels.join(", ")} into a unified operating system.`,
    `This proposal scopes a ${timelineWeeks}-week engagement at the **${tier.charAt(0).toUpperCase() + tier.slice(1)}** tier ($${monthlyFee.toLocaleString()}/mo, $${annualFee.toLocaleString()}/yr).`,
    `Expected outcome: ${outcomes[0]}`,
  ].join("\n");

  const scope = [
    `## Scope of Work`,
    ``,
    `### Diagnosed pain points`,
    ...pains.map((p, i) => `${i + 1}. ${p}`),
    ``,
    `### Channels in scope`,
    ...channels.map((c, i) => `- ${c}`),
    ``,
    `### Out of scope (available on addendum)`,
    `- Print advertising`,
    `- TV / OOH`,
    `- Hardware / on-prem equipment`,
    `- Compliance filings (handled by client counsel)`,
  ].join("\n");

  const investment = [
    `## Investment`,
    ``,
    `| Line | Amount |`,
    `|---|---|`,
    `| Monthly retainer | $${monthlyFee.toLocaleString()} |`,
    `| Annual contract value | $${annualFee.toLocaleString()} |`,
    `| One-time onboarding | $${Math.round(monthlyFee * 0.5).toLocaleString()} |`,
    `| **Total Year-1** | **$${(annualFee + monthlyFee * 0.5).toLocaleString()}** |`,
    ``,
    `Invoiced monthly. Net-15. Auto-renewal at end of 12 months with 60-day cancellation window.`,
  ].join("\n");

  const nextSteps = [
    "Counter-sign this proposal (e-sign link below).",
    "Schedule kickoff call within 5 business days.",
    "Provide access: CRM, ad accounts, brand assets, analytics.",
    "First deliverable: diagnostic report within 14 days.",
  ];

  const markdown = [
    `# Proposal — ${clientName}`,
    ``,
    `**Prepared for:** ${contactName} <${input.contactEmail || "[on file]"}>`,
    `**Prepared by:** RIG OS Agency`,
    `**Date:** ${new Date().toISOString().slice(0, 10)}`,
    `**Proposal ID:** ${proposalId}`,
    `**Tier:** ${tier} | **Term:** ${timelineWeeks} weeks | **Investment:** $${annualFee.toLocaleString()}/yr`,
    ``,
    `---`,
    ``,
    executiveSummary,
    ``,
    scope,
    ``,
    `## Deliverables`,
    ``,
    ...deliverables.map((d, i) => `${i + 1}. ${d}`),
    ``,
    `## Timeline`,
    ``,
    `| Week | Milestone |`,
    `|---|---|`,
    ...timeline.map((t) => `| ${t.week} | ${t.milestone} |`),
    ``,
    investment,
    ``,
    `## Next Steps`,
    ``,
    ...nextSteps.map((n, i) => `${i + 1}. ${n}`),
    ``,
    `---`,
    ``,
    `*This proposal is valid for 14 days from generation. Pricing locked at signature date.*`,
  ].join("\n");

  // Confidence: higher when problem/timeline/contact supplied
  let confidence = 0.55;
  if (input.problem && input.problem.length > 24) confidence += 0.1;
  if (input.timelineWeeks) confidence += 0.05;
  if (input.contactEmail) confidence += 0.05;
  if (input.desiredOutcomes && input.desiredOutcomes.length >= 2) confidence += 0.1;
  if (input.dealSize && input.dealSize >= 30000) confidence += 0.05;
  if (input.clientId) confidence += 0.05;
  confidence = Math.min(0.92, Math.max(0.4, confidence));

  return {
    proposalId,
    generatedAt: new Date().toISOString(),
    clientName,
    vertical,
    tier,
    monthlyFee,
    annualFee,
    timelineWeeks,
    confidenceScore: Number(confidence.toFixed(2)),
    rationale: `Auto-tiered to **${tier}** based on monthly budget of $${(input.monthlyBudget || 0).toLocaleString()} and deal size $${(input.dealSize || 0).toLocaleString()}. ${timelineWeeks}-week timeline fits the ${vertical} sales cycle.`,
    sections: {
      executiveSummary,
      scope,
      deliverables,
      timeline,
      investment,
      nextSteps,
    },
    markdown,
  };
}

function pickTierByTier(tier: ServiceTierId) {
  switch (tier) {
    case "starter": return { tier: "starter" as const, monthly: 2500, annual: 30000 };
    case "growth": return { tier: "growth" as const, monthly: 6000, annual: 72000 };
    case "scale": return { tier: "scale" as const, monthly: 12000, annual: 144000 };
    case "enterprise": return { tier: "enterprise" as const, monthly: 25000, annual: 300000 };
  }
}

function defaultTimelineFor(tier: ServiceTierId): number {
  if (tier === "starter") return 8;
  if (tier === "growth") return 12;
  if (tier === "scale") return 16;
  return 22;
}

function deliverablesByTier(tier: ServiceTierId, vertical: VerticalId): string[] {
  const base = [
    `Diagnostic deep-dive on ${vertical} pipeline + competitor scan`,
    `Channel-by-channel strategy with 30/60/90 priorities`,
    `Weekly ops review + monthly executive readout`,
  ];
  const growth = [
    `2 channel tests/month with KPI lift targets`,
    `Lead scoring model + CRM hygiene audit`,
    `Content engine: 4 long-form + 8 short-form pieces / month`,
  ];
  const scale = [
    `Conversion-rate optimization sprint (4 cycles / quarter)`,
    `Lifecycle automation across email + SMS + retargeting`,
    `Quarterly business review with attribution model`,
  ];
  const ent = [
    `Dedicated pod: strategist + ops + analyst`,
    `Custom attribution + data warehouse layer`,
    `Exec-level forecast with ±8% accuracy target`,
  ];
  const tierSet = (
    tier === "starter" ? base :
    tier === "growth" ? [...base, ...growth] :
    tier === "scale" ? [...base, ...growth, ...scale] :
    [...base, ...growth, ...scale, ...ent]
  );
  return Array.from(new Set(tierSet));
}

function buildTimeline(weeks: number, deliverableCount: number): { week: number; milestone: string }[] {
  const ticks: { week: number; milestone: string }[] = [];
  const total = Math.max(weeks, 8);
  const phase1 = Math.max(2, Math.round(total * 0.2));
  const phase2 = Math.max(phase1 + 2, Math.round(total * 0.55));
  const phase3 = Math.max(phase2 + 2, total - 1);
  ticks.push({ week: 1, milestone: "Kickoff + access provisioning" });
  ticks.push({ week: phase1, milestone: "Diagnostic report + strategy doc v1" });
  ticks.push({ week: phase2, milestone: `${deliverableCount} deliverables in flight; first tests live` });
  ticks.push({ week: phase3, milestone: "Mid-engagement QBR + ROI snapshot" });
  ticks.push({ week: total, milestone: "Final readout + renewal proposal" });
  return ticks;
}

export async function POST(request: Request) {
  let body: ProposalInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // If clientId supplied, hydrate from client record
  if (body.clientId && !body.clientName) {
    try {
      const clients = dbGetClients();
      const found = clients.find((c: any) => c.id === body.clientId);
      if (found) {
        body.clientName = found.name;
        body.vertical = body.vertical || found.vertical;
        body.tier = body.tier || found.serviceTier;
        body.monthlyBudget = body.monthlyBudget || found.monthlyFee;
        body.dealSize = body.dealSize || found.annualFee;
        body.contactName = body.contactName || found.contactName;
        body.contactEmail = body.contactEmail || found.contactEmail;
      }
    } catch {/* in-memory fallback */}
  }

  // Hydrate from pipeline deal if deal id looks like a deal
  if (body.clientId && body.clientId.startsWith("dl_") && !body.clientName) {
    try {
      const deals = dbGetPipelineDeals() || [];
      const found = deals.find((d: any) => d.id === body.clientId);
      if (found) {
        body.clientName = found.clientName;
        body.vertical = body.vertical || found.vertical;
        body.dealSize = body.dealSize || found.dealValue;
      }
    } catch {/* */}
  }

  if (!body.clientName && !body.vertical) {
    return NextResponse.json(
      { error: "Need at minimum a clientName or vertical to generate a proposal." },
      { status: 400 }
    );
  }

  const output = generate(body);
  return NextResponse.json(output);
}

export async function GET() {
  return NextResponse.json({
    info: "POST a JSON body to generate a proposal.",
    example: {
      clientName: "Acme Construction",
      vertical: "construction",
      monthlyBudget: 6000,
      timelineWeeks: 12,
      problem: "Bid pipeline dropping between estimate and contract.",
      desiredOutcomes: ["30 more qualified bids / quarter", "Pipeline dashboard in 60 days"],
      contactName: "Sarah Chen",
      contactEmail: "sarah@acme.co",
    },
  });
}
