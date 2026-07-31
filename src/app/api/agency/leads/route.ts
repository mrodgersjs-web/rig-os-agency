import { NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GTM_STUDIO_ROOT = "/Users/rig128gb/Developer/rig-gtm-studio-v2";
const CLIENTS_DIR = join(GTM_STUDIO_ROOT, "clients");

// ── Real lead data (12 fully-scored leads across 8 verticals) ─────────────
const LEADS_DATABASE = [
  {
    id: "L001", name: "Sarah Chen", title: "VP Engineering", company: "TechFlow SaaS",
    industry: "SaaS", employees: 240, arr: 12_000_000, geography: "Austin, TX",
    linkedinUrl: "https://linkedin.com/in/sarah-chen-techflow",
    painPoints: ["scaling infra", "cost optimization", "DevOps maturity"],
    score: 87, tier: "hot", stage: "proposal_sent", source: "LinkedIn",
    enrichedAt: "2026-06-18", lastContactAt: "2026-07-04",
    emailsSent: 3, emailsOpened: 3, emailsReplied: 2, meetingsBooked: 1,
    proposalsSent: 1, contractsSigned: 0, value: 48_000,
    scoreBreakdown: { fit: 90, intent: 85, engagement: 88, timing: 85, authority: 88 },
    nextAction: "Send proposal follow-up", nextActionDate: "2026-07-08",
  },
  {
    id: "L002", name: "Marcus Webb", title: "CTO", company: "FinEdge",
    industry: "FinTech", employees: 85, arr: 4_500_000, geography: "New York, NY",
    linkedinUrl: "https://linkedin.com/in/marcus-webb-finedge",
    painPoints: ["compliance automation", "data pipeline", "SOC 2 prep"],
    score: 92, tier: "hot", stage: "meeting_booked", source: "Referral",
    enrichedAt: "2026-06-12", lastContactAt: "2026-07-03",
    emailsSent: 2, emailsOpened: 2, emailsReplied: 2, meetingsBooked: 1,
    proposalsSent: 0, contractsSigned: 0, value: 78_000,
    scoreBreakdown: { fit: 95, intent: 92, engagement: 90, timing: 92, authority: 92 },
    nextAction: "Prep for Thursday meeting", nextActionDate: "2026-07-10",
  },
  {
    id: "L003", name: "Dr. Emily Rodriguez", title: "CMO", company: "HealthBridge",
    industry: "HealthTech", employees: 410, arr: 22_000_000, geography: "Boston, MA",
    linkedinUrl: "https://linkedin.com/in/emily-rodriguez-cmo",
    painPoints: ["patient data sync", "AI diagnostics", "HIPAA marketing"],
    score: 81, tier: "hot", stage: "engaged", source: "Cold Email",
    enrichedAt: "2026-06-08", lastContactAt: "2026-07-02",
    emailsSent: 4, emailsOpened: 3, emailsReplied: 1, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 96_000,
    scoreBreakdown: { fit: 84, intent: 78, engagement: 80, timing: 82, authority: 82 },
    nextAction: "Schedule discovery call", nextActionDate: "2026-07-07",
  },
  {
    id: "L004", name: "James Park", title: "Head Ops", company: "ShipRight",
    industry: "Logistics", employees: 320, arr: 18_000_000, geography: "Seattle, WA",
    linkedinUrl: "https://linkedin.com/in/james-park-shipright",
    painPoints: ["route optimization", "real-time tracking", "warehouse automation"],
    score: 76, tier: "warm", stage: "contacted", source: "Apify",
    enrichedAt: "2026-06-22", lastContactAt: "2026-06-29",
    emailsSent: 2, emailsOpened: 1, emailsReplied: 0, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 62_000,
    scoreBreakdown: { fit: 78, intent: 74, engagement: 70, timing: 76, authority: 82 },
    nextAction: "Send follow-up #2", nextActionDate: "2026-07-06",
  },
  {
    id: "L005", name: "Lisa Tran", title: "CEO", company: "EduScale",
    industry: "EdTech", employees: 55, arr: 3_200_000, geography: "San Francisco, CA",
    linkedinUrl: "https://linkedin.com/in/lisa-tran-eduscale",
    painPoints: ["content generation", "student analytics", "AI tutoring"],
    score: 89, tier: "hot", stage: "negotiation", source: "LinkedIn",
    enrichedAt: "2026-05-28", lastContactAt: "2026-07-05",
    emailsSent: 5, emailsOpened: 5, emailsReplied: 4, meetingsBooked: 2,
    proposalsSent: 1, contractsSigned: 0, value: 84_000,
    scoreBreakdown: { fit: 90, intent: 92, engagement: 92, timing: 84, authority: 88 },
    nextAction: "Close contract terms", nextActionDate: "2026-07-08",
  },
  {
    id: "L006", name: "David Okafor", title: "VP Product", company: "ShopWave",
    industry: "E-commerce", employees: 180, arr: 9_500_000, geography: "London, UK",
    linkedinUrl: "https://linkedin.com/in/david-okafor-shopwave",
    painPoints: ["personalization engine", "cart abandonment", "mobile checkout"],
    score: 84, tier: "hot", stage: "enriched", source: "Exa",
    enrichedAt: "2026-07-01", lastContactAt: null,
    emailsSent: 0, emailsOpened: 0, emailsReplied: 0, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 55_000,
    scoreBreakdown: { fit: 86, intent: 82, engagement: 80, timing: 84, authority: 88 },
    nextAction: "Send first-touch email", nextActionDate: "2026-07-07",
  },
  {
    id: "L007", name: "Rachel Kim", title: "Founder", company: "PropTech AI",
    industry: "Real Estate", employees: 18, arr: 950_000, geography: "Miami, FL",
    linkedinUrl: "https://linkedin.com/in/rachel-kim-proptech",
    painPoints: ["property valuation AI", "lead routing", "CRM integration"],
    score: 79, tier: "warm", stage: "prospect", source: "Apify",
    enrichedAt: "2026-07-02", lastContactAt: null,
    emailsSent: 0, emailsOpened: 0, emailsReplied: 0, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 42_000,
    scoreBreakdown: { fit: 82, intent: 76, engagement: 78, timing: 80, authority: 80 },
    nextAction: "Research + sequence", nextActionDate: "2026-07-08",
  },
  {
    id: "L008", name: "Tom Anderson", title: "Dir Mfg", company: "ForgeWorks",
    industry: "Manufacturing", employees: 540, arr: 38_000_000, geography: "Detroit, MI",
    linkedinUrl: "https://linkedin.com/in/tom-anderson-forgeworks",
    painPoints: ["predictive maintenance", "IoT data pipeline", "ERP integration"],
    score: 85, tier: "hot", stage: "closed_won", source: "Referral",
    enrichedAt: "2026-05-15", lastContactAt: "2026-07-04",
    emailsSent: 6, emailsOpened: 6, emailsReplied: 5, meetingsBooked: 3,
    proposalsSent: 2, contractsSigned: 1, value: 120_000,
    scoreBreakdown: { fit: 88, intent: 86, engagement: 92, timing: 80, authority: 80 },
    nextAction: "Kickoff call", nextActionDate: "2026-07-12",
  },
  {
    id: "L009", name: "Aisha Patel", title: "CISO", company: "SecureNet",
    industry: "Cybersecurity", employees: 95, arr: 6_800_000, geography: "Washington, DC",
    linkedinUrl: "https://linkedin.com/in/aisha-patel-securenet",
    painPoints: ["threat detection", "automated response", "zero-trust"],
    score: 91, tier: "hot", stage: "meeting_booked", source: "Cold Email",
    enrichedAt: "2026-06-15", lastContactAt: "2026-07-05",
    emailsSent: 3, emailsOpened: 3, emailsReplied: 2, meetingsBooked: 1,
    proposalsSent: 0, contractsSigned: 0, value: 95_000,
    scoreBreakdown: { fit: 92, intent: 90, engagement: 92, timing: 88, authority: 92 },
    nextAction: "Send agenda + deck", nextActionDate: "2026-07-06",
  },
  {
    id: "L010", name: "Michael Chang", title: "CTO", company: "NeuralScale",
    industry: "AI/ML", employees: 42, arr: 2_400_000, geography: "Palo Alto, CA",
    linkedinUrl: "https://linkedin.com/in/michael-chang-neuralscale",
    painPoints: ["model deployment", "MLOps pipeline", "GPU cost"],
    score: 88, tier: "hot", stage: "engaged", source: "LinkedIn",
    enrichedAt: "2026-06-19", lastContactAt: "2026-07-03",
    emailsSent: 4, emailsOpened: 4, emailsReplied: 2, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 88_000,
    scoreBreakdown: { fit: 90, intent: 88, engagement: 86, timing: 88, authority: 88 },
    nextAction: "Schedule technical demo", nextActionDate: "2026-07-09",
  },
  {
    id: "L011", name: "Olivia Martinez", title: "Head Growth", company: "MealKit Pro",
    industry: "E-commerce", employees: 230, arr: 14_500_000, geography: "Los Angeles, CA",
    linkedinUrl: "https://linkedin.com/in/olivia-martinez-mealkit",
    painPoints: ["subscriber retention", "LTV optimization", "referral loops"],
    score: 72, tier: "warm", stage: "contacted", source: "LinkedIn",
    enrichedAt: "2026-06-25", lastContactAt: "2026-07-01",
    emailsSent: 2, emailsOpened: 1, emailsReplied: 0, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 48_000,
    scoreBreakdown: { fit: 74, intent: 70, engagement: 68, timing: 74, authority: 74 },
    nextAction: "Send value-prop email", nextActionDate: "2026-07-07",
  },
  {
    id: "L012", name: "Henrik Larsen", title: "VP Sales", company: "CloudStack",
    industry: "SaaS", employees: 410, arr: 24_000_000, geography: "Copenhagen, DK",
    linkedinUrl: "https://linkedin.com/in/henrik-larsen-cloudstack",
    painPoints: ["outbound automation", "SDR productivity", "CRM hygiene"],
    score: 67, tier: "cold", stage: "prospect", source: "Apify",
    enrichedAt: "2026-06-30", lastContactAt: null,
    emailsSent: 0, emailsOpened: 0, emailsReplied: 0, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 72_000,
    scoreBreakdown: { fit: 70, intent: 64, engagement: 64, timing: 68, authority: 70 },
    nextAction: "Wait for trigger event", nextActionDate: "2026-07-15",
  },
  {
    id: "L013", name: "Priya Subramanian", title: "Director Ops", company: "TalentForge",
    industry: "EdTech", employees: 130, arr: 7_200_000, geography: "Toronto, ON",
    linkedinUrl: "https://linkedin.com/in/priya-talentforge",
    painPoints: ["candidate matching AI", "ATS integration", "diversity hiring"],
    score: 74, tier: "warm", stage: "enriched", source: "Cold Email",
    enrichedAt: "2026-07-02", lastContactAt: null,
    emailsSent: 0, emailsOpened: 0, emailsReplied: 0, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 54_000,
    scoreBreakdown: { fit: 76, intent: 72, engagement: 72, timing: 74, authority: 76 },
    nextAction: "Send first-touch", nextActionDate: "2026-07-08",
  },
  {
    id: "L014", name: "Carlos Mendoza", title: "CMO", company: "VerdeEnergy",
    industry: "Manufacturing", employees: 285, arr: 16_500_000, geography: "Mexico City, MX",
    linkedinUrl: "https://linkedin.com/in/carlos-mendoza-verde",
    painPoints: ["B2B brand", "lead generation", "ABM programs"],
    score: 82, tier: "hot", stage: "engaged", source: "Referral",
    enrichedAt: "2026-06-10", lastContactAt: "2026-07-04",
    emailsSent: 3, emailsOpened: 3, emailsReplied: 2, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 78_000,
    scoreBreakdown: { fit: 84, intent: 82, engagement: 82, timing: 80, authority: 82 },
    nextAction: "Book discovery", nextActionDate: "2026-07-08",
  },
  {
    id: "L015", name: "Sophie Chen", title: "Head Product", company: "CryptoVault",
    industry: "FinTech", employees: 68, arr: 4_100_000, geography: "Singapore",
    linkedinUrl: "https://linkedin.com/in/sophie-chen-cryptovault",
    painPoints: ["custody UX", "compliance dashboards", "regulatory reporting"],
    score: 71, tier: "warm", stage: "contacted", source: "LinkedIn",
    enrichedAt: "2026-06-20", lastContactAt: "2026-06-30",
    emailsSent: 1, emailsOpened: 1, emailsReplied: 0, meetingsBooked: 0,
    proposalsSent: 0, contractsSigned: 0, value: 58_000,
    scoreBreakdown: { fit: 72, intent: 70, engagement: 68, timing: 72, authority: 72 },
    nextAction: "Send follow-up #1", nextActionDate: "2026-07-06",
  },
];

function tierFromScore(score: number): "hot" | "warm" | "cold" {
  if (score >= 80) return "hot";
  if (score >= 70) return "warm";
  return "cold";
}

// Augment leads with tier
const enrichedLeads = LEADS_DATABASE.map((l) => ({ ...l, tier: tierFromScore(l.score) }));

function safeRead(path: string): string | null {
  try {
    if (!existsSync(path)) return null;
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

export async function GET() {
  // ── Aggregate metrics ─────────────────────────────────────────────────
  const total = enrichedLeads.length;
  const hot = enrichedLeads.filter((l) => l.tier === "hot");
  const warm = enrichedLeads.filter((l) => l.tier === "warm");
  const cold = enrichedLeads.filter((l) => l.tier === "cold");

  const totalPipelineValue = enrichedLeads
    .filter((l) => l.stage !== "closed_won" && l.stage !== "closed_lost")
    .reduce((s, l) => s + l.value, 0);

  const hotPipelineValue = hot
    .filter((l) => l.stage !== "closed_won" && l.stage !== "closed_lost")
    .reduce((s, l) => s + l.value, 0);

  const weightedPipelineValue = enrichedLeads.reduce((s, l) => {
    const stageWeights: Record<string, number> = {
      prospect: 0.05, enriched: 0.1, contacted: 0.15, engaged: 0.3,
      meeting_booked: 0.5, proposal_sent: 0.65, negotiation: 0.8,
      closed_won: 1.0, closed_lost: 0, nurture: 0.05,
    };
    return s + l.value * (stageWeights[l.stage] || 0);
  }, 0);

  const closedWon = enrichedLeads.filter((l) => l.stage === "closed_won");
  const wonValue = closedWon.reduce((s, l) => s + l.value, 0);

  // ── Industry rollup ───────────────────────────────────────────────────
  const byIndustry = new Map<string, { industry: string; count: number; hot: number; warm: number; cold: number; value: number; avgScore: number }>();
  for (const l of enrichedLeads) {
    const ex = byIndustry.get(l.industry) || {
      industry: l.industry, count: 0, hot: 0, warm: 0, cold: 0, value: 0, avgScore: 0,
    };
    ex.count++;
    ex[l.tier as "hot" | "warm" | "cold"]++;
    ex.value += l.value;
    ex.avgScore += l.score;
    byIndustry.set(l.industry, ex);
  }
  const industryRollup = Array.from(byIndustry.values())
    .map((x) => ({ ...x, avgScore: Math.round(x.avgScore / x.count) }))
    .sort((a, b) => b.value - a.value);

  // ── Stage funnel ──────────────────────────────────────────────────────
  const stages = ["prospect", "enriched", "contacted", "engaged", "meeting_booked", "proposal_sent", "negotiation", "closed_won"];
  const funnel = stages.map((stage) => {
    const items = enrichedLeads.filter((l) => l.stage === stage);
    const value = items.reduce((s, l) => s + l.value, 0);
    const stageWeights: Record<string, number> = {
      prospect: 0.05, enriched: 0.1, contacted: 0.15, engaged: 0.3,
      meeting_booked: 0.5, proposal_sent: 0.65, negotiation: 0.8, closed_won: 1.0,
    };
    return {
      stage,
      count: items.length,
      value,
      weightedValue: Math.round(value * (stageWeights[stage] || 0)),
    };
  });

  // ── Source rollup ─────────────────────────────────────────────────────
  const bySource = new Map<string, { source: string; count: number; hot: number; warm: number; cold: number; replied: number; booked: number; value: number }>();
  for (const l of enrichedLeads) {
    const ex = bySource.get(l.source) || {
      source: l.source, count: 0, hot: 0, warm: 0, cold: 0, replied: 0, booked: 0, value: 0,
    };
    ex.count++;
    ex[l.tier as "hot" | "warm" | "cold"]++;
    if (l.emailsReplied > 0) ex.replied++;
    if (l.meetingsBooked > 0) ex.booked++;
    ex.value += l.value;
    bySource.set(l.source, ex);
  }
  const sourceRollup = Array.from(bySource.values()).sort((a, b) => b.value - a.value);

  // ── Engagement metrics ────────────────────────────────────────────────
  const totalEmailsSent = enrichedLeads.reduce((s, l) => s + l.emailsSent, 0);
  const totalEmailsOpened = enrichedLeads.reduce((s, l) => s + l.emailsOpened, 0);
  const totalReplies = enrichedLeads.reduce((s, l) => s + l.emailsReplied, 0);
  const totalMeetings = enrichedLeads.reduce((s, l) => s + l.meetingsBooked, 0);

  const openRate = totalEmailsSent > 0 ? Math.round((totalEmailsOpened / totalEmailsSent) * 100) : 0;
  const replyRate = totalEmailsSent > 0 ? Math.round((totalReplies / totalEmailsSent) * 100) : 0;
  const meetingRate = totalEmailsSent > 0 ? Math.round((totalMeetings / totalEmailsSent) * 100) : 0;

  // ── Action queue (next 7 days) ────────────────────────────────────────
  const today = new Date("2026-07-06").getTime();
  const week = today + 7 * 24 * 60 * 60 * 1000;
  const actionQueue = enrichedLeads
    .filter((l) => {
      if (!l.nextActionDate) return false;
      const t = new Date(l.nextActionDate).getTime();
      return t <= week;
    })
    .sort((a, b) => new Date(a.nextActionDate!).getTime() - new Date(b.nextActionDate!).getTime());

  // ── Score distribution ────────────────────────────────────────────────
  const scoreBuckets = [
    { range: "90-100", count: 0, label: "Champions" },
    { range: "80-89", count: 0, label: "Hot" },
    { range: "70-79", count: 0, label: "Warm" },
    { range: "60-69", count: 0, label: "Cold" },
    { range: "<60", count: 0, label: "Dead" },
  ];
  for (const l of enrichedLeads) {
    if (l.score >= 90) scoreBuckets[0].count++;
    else if (l.score >= 80) scoreBuckets[1].count++;
    else if (l.score >= 70) scoreBuckets[2].count++;
    else if (l.score >= 60) scoreBuckets[3].count++;
    else scoreBuckets[4].count++;
  }

  return NextResponse.json({
    // Was `_real: true` + "internal lead scoring database". There is no such
    // database: LEADS_DATABASE at the top of this file is a hardcoded array of
    // invented people (Sarah Chen / TechFlow SaaS, etc). The pipeline value it
    // summed to ($958,000) was fiction reported as fact.
    _real: false,
    _mock: true,
    _source: "HARDCODED FIXTURE (LEADS_DATABASE in this file) — invented leads, not scored prospects.",
    generated_at: new Date().toISOString(),
    summary: {
      total,
      hot: hot.length,
      warm: warm.length,
      cold: cold.length,
      totalPipelineValue,
      hotPipelineValue,
      weightedPipelineValue: Math.round(weightedPipelineValue),
      wonValue,
      closedWonCount: closedWon.length,
      avgScore: Math.round(enrichedLeads.reduce((s, l) => s + l.score, 0) / total),
    },
    engagement: {
      totalEmailsSent,
      totalEmailsOpened,
      totalReplies,
      totalMeetings,
      openRate,
      replyRate,
      meetingRate,
    },
    scoreBuckets,
    industryRollup,
    sourceRollup,
    funnel,
    actionQueue,
    leads: enrichedLeads.sort((a, b) => b.score - a.score),
  });
}