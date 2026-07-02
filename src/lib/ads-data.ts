// ── RIG OS Agency — Ads Performance Data Layer ────────────────────
// Tracks ad campaign performance across platforms (Google, Meta, LinkedIn)
// with cost, conversions, ROAS, and creative breakdowns.

export interface AdPlatform {
  id: string;
  name: string;
  color: string;
  status: "active" | "paused" | "ended";
  spendMTD: number;
  spendPrev: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: "google" | "meta" | "linkedin";
  status: "active" | "paused" | "ended" | "draft";
  objective: "awareness" | "traffic" | "leads" | "conversions" | "retargeting";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cpl: number;          // cost per lead
  cpa: number;          // cost per acquisition
  roas: number;         // return on ad spend
  ctr: number;          // click-through rate %
  cpc: number;          // cost per click
  startDate: string;
  endDate: string | null;
  budget: number;       // monthly budget
  audience: string;
  creativeCount: number;
  topCreative: string;
}

export interface AdCreative {
  id: string;
  campaignId: string;
  campaignName: string;
  platform: string;
  type: "image" | "video" | "carousel" | "text";
  headline: string;
  body: string;
  cta: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
  status: "active" | "paused" | "underperforming";
  performanceScore: number; // 0-100
}

export interface WeeklyPerformance {
  week: string;
  spend: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
}

export interface AdsKPI {
  totalSpendMTD: number;
  totalSpendPrev: number;
  totalRevenue: number;
  blendedROAS: number;
  totalConversions: number;
  totalClicks: number;
  totalImpressions: number;
  avgCPC: number;
  avgCTR: number;
  avgCPL: number;
  avgCPA: number;
  activeCampaigns: number;
  totalBudget: number;
  budgetUtilization: number; // %
}

// ── Seed Platforms ────────────────────────────────────────────────
export const AD_PLATFORMS: AdPlatform[] = [
  {
    id: "pf_google",
    name: "Google Ads",
    color: "#4285f4",
    status: "active",
    spendMTD: 4200,
    spendPrev: 3800,
    impressions: 184000,
    clicks: 3200,
    conversions: 47,
    revenue: 31200,
  },
  {
    id: "pf_meta",
    name: "Meta Ads (Facebook/IG)",
    color: "#1877f2",
    status: "active",
    spendMTD: 2800,
    spendPrev: 3100,
    impressions: 156000,
    clicks: 2800,
    conversions: 34,
    revenue: 22400,
  },
  {
    id: "pf_linkedin",
    name: "LinkedIn Ads",
    color: "#0a66c2",
    status: "active",
    spendMTD: 3600,
    spendPrev: 2400,
    impressions: 92000,
    clicks: 1100,
    conversions: 22,
    revenue: 48000,
  },
];

// ── Seed Campaigns ────────────────────────────────────────────────
export const AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: "cmp_001",
    name: "RIG OS — Enterprise Search",
    platform: "google",
    status: "active",
    objective: "conversions",
    spend: 2100,
    impressions: 86000,
    clicks: 1800,
    conversions: 28,
    revenue: 21000,
    cpl: 75,
    cpa: 75,
    roas: 10.0,
    ctr: 2.09,
    cpc: 1.17,
    startDate: "2026-05-01",
    endDate: null,
    budget: 3000,
    audience: "CTOs, VPs Engineering — SaaS 200+ employees",
    creativeCount: 6,
    topCreative: "AI Agent Dashboard Screenshot",
  },
  {
    id: "cmp_002",
    name: "TransformFit — Fit Pro Lead Gen",
    platform: "meta",
    status: "active",
    objective: "leads",
    spend: 1600,
    impressions: 92000,
    clicks: 1700,
    conversions: 21,
    revenue: 12600,
    cpl: 76,
    cpa: 76,
    roas: 7.9,
    ctr: 1.85,
    cpc: 0.94,
    startDate: "2026-05-15",
    endDate: null,
    budget: 2000,
    audience: "Personal trainers, gym owners 25-45 US",
    creativeCount: 4,
    topCreative: "Before/After Carousel #3",
  },
  {
    id: "cmp_003",
    name: "RIG Agency — B2B Retargeting",
    platform: "google",
    status: "active",
    objective: "retargeting",
    spend: 2100,
    impressions: 98000,
    clicks: 1400,
    conversions: 19,
    revenue: 10200,
    cpl: 110,
    cpa: 110,
    roas: 4.9,
    ctr: 1.43,
    cpc: 1.50,
    startDate: "2026-04-01",
    endDate: null,
    budget: 2500,
    audience: "Website visitors last 30 days",
    creativeCount: 3,
    topCreative: "Agency ROI Calculator",
  },
  {
    id: "cmp_004",
    name: "LinkedIn — Construction Industry Outreach",
    platform: "linkedin",
    status: "active",
    objective: "leads",
    spend: 2200,
    impressions: 48000,
    clicks: 620,
    conversions: 14,
    revenue: 32000,
    cpl: 157,
    cpa: 157,
    roas: 14.5,
    ctr: 1.29,
    cpc: 3.55,
    startDate: "2026-06-01",
    endDate: null,
    budget: 3000,
    audience: "Construction company owners, GCs — $10M+ rev",
    creativeCount: 3,
    topCreative: "Case Study: BuildRight CMO",
  },
  {
    id: "cmp_005",
    name: "Meta — Healthcare Provider Awareness",
    platform: "meta",
    status: "active",
    objective: "awareness",
    spend: 1200,
    impressions: 64000,
    clicks: 1100,
    conversions: 13,
    revenue: 9800,
    cpl: 92,
    cpa: 92,
    roas: 8.2,
    ctr: 1.72,
    cpc: 1.09,
    startDate: "2026-06-10",
    endDate: null,
    budget: 1500,
    audience: "Dentists, orthopedic surgeons 30-55 US",
    creativeCount: 5,
    topCreative: "Patient Growth Infographic",
  },
  {
    id: "cmp_006",
    name: "LinkedIn — Legal Industry ABM",
    platform: "linkedin",
    status: "active",
    objective: "conversions",
    spend: 1400,
    impressions: 44000,
    clicks: 480,
    conversions: 8,
    revenue: 16000,
    cpl: 175,
    cpa: 175,
    roas: 11.4,
    ctr: 1.09,
    cpc: 2.92,
    startDate: "2026-06-15",
    endDate: null,
    budget: 2000,
    audience: "Law firm partners — AmLaw 200",
    creativeCount: 2,
    topCreative: "Legal BD Whitepaper",
  },
  {
    id: "cmp_007",
    name: "Google — Branded Search Defense",
    platform: "google",
    status: "paused",
    objective: "traffic",
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    cpl: 0,
    cpa: 0,
    roas: 0,
    ctr: 0,
    cpc: 0,
    startDate: "2026-03-01",
    endDate: "2026-06-01",
    budget: 500,
    audience: "Brand search terms",
    creativeCount: 2,
    topCreative: "Brand Homepage",
  },
  {
    id: "cmp_008",
    name: "Meta — Instagram Story Ads (Test)",
    platform: "meta",
    status: "draft",
    objective: "awareness",
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    cpl: 0,
    cpa: 0,
    roas: 0,
    ctr: 0,
    cpc: 0,
    startDate: "2026-07-01",
    endDate: null,
    budget: 800,
    audience: "Fitness enthusiasts 18-35 US",
    creativeCount: 3,
    topCreative: "TBD — awaiting creative",
  },
];

// ── Seed Creatives ────────────────────────────────────────────────
export const AD_CREATIVES: AdCreative[] = [
  {
    id: "crt_001", campaignId: "cmp_001", campaignName: "RIG OS — Enterprise Search", platform: "Google",
    type: "image", headline: "AI Agent Dashboard That Scales", body: "Deploy 400+ agents with one command. Free trial.", cta: "Start Free Trial",
    impressions: 42000, clicks: 920, ctr: 2.19, spend: 1050, conversions: 15, status: "active", performanceScore: 87,
  },
  {
    id: "crt_002", campaignId: "cmp_001", campaignName: "RIG OS — Enterprise Search", platform: "Google",
    type: "image", headline: "Stop Managing Tools. Start Managing Agents.", body: "One dashboard, 400 agents, zero chaos.", cta: "See Demo",
    impressions: 44000, clicks: 880, ctr: 2.0, spend: 1050, conversions: 13, status: "active", performanceScore: 82,
  },
  {
    id: "crt_003", campaignId: "cmp_002", campaignName: "TransformFit — Fit Pro Lead Gen", platform: "Meta",
    type: "carousel", headline: "3 Trainers Who 3x'd Their Client Base", body: "See how TransformFit automates lead gen.", cta: "Watch Story",
    impressions: 38000, clicks: 760, ctr: 2.0, spend: 620, conversions: 11, status: "active", performanceScore: 91,
  },
  {
    id: "crt_004", campaignId: "cmp_004", campaignName: "LinkedIn — Construction Industry", platform: "LinkedIn",
    type: "image", headline: "How BuildRight Grew 40% With a Fractional CMO", body: "Case study: $40M GC scales marketing.", cta: "Read Case Study",
    impressions: 24000, clicks: 320, ctr: 1.33, spend: 1100, conversions: 8, status: "active", performanceScore: 78,
  },
  {
    id: "crt_005", campaignId: "cmp_005", campaignName: "Healthcare Provider Awareness", platform: "Meta",
    type: "image", headline: "Patient Growth Starts Here", body: "Data-driven patient acquisition for practices.", cta: "Learn More",
    impressions: 32000, clicks: 480, ctr: 1.5, spend: 600, conversions: 7, status: "active", performanceScore: 74,
  },
  {
    id: "crt_006", campaignId: "cmp_003", campaignName: "RIG Agency — B2B Retargeting", platform: "Google",
    type: "text", headline: "Calculate Your Agency ROI", body: "See how much RIG could save you.", cta: "Try Calculator",
    impressions: 52000, clicks: 620, ctr: 1.19, spend: 1100, conversions: 8, status: "underperforming", performanceScore: 52,
  },
  {
    id: "crt_007", campaignId: "cmp_006", campaignName: "LinkedIn — Legal Industry ABM", platform: "LinkedIn",
    type: "image", headline: "Modern BD for Modern Law Firms", body: "Whitepaper: Digital transformation for AmLaw 200.", cta: "Download",
    impressions: 22000, clicks: 220, ctr: 1.0, spend: 700, conversions: 4, status: "active", performanceScore: 68,
  },
  {
    id: "crt_008", campaignId: "cmp_002", campaignName: "TransformFit — Fit Pro Lead Gen", platform: "Meta",
    type: "video", headline: "60-Second TransformFit Demo", body: "Watch how trainers automate booking.", cta: "Watch Now",
    impressions: 54000, clicks: 940, ctr: 1.74, spend: 980, conversions: 10, status: "active", performanceScore: 85,
  },
];

// ── Weekly Performance (last 8 weeks) ─────────────────────────────
export const WEEKLY_PERFORMANCE: WeeklyPerformance[] = [
  { week: "W-7", spend: 1800, clicks: 1100, conversions: 12, revenue: 9600, roas: 5.3 },
  { week: "W-6", spend: 2100, clicks: 1300, conversions: 16, revenue: 12800, roas: 6.1 },
  { week: "W-5", spend: 2400, clicks: 1500, conversions: 19, revenue: 15400, roas: 6.4 },
  { week: "W-4", spend: 2200, clicks: 1400, conversions: 15, revenue: 12200, roas: 5.5 },
  { week: "W-3", spend: 2600, clicks: 1700, conversions: 22, revenue: 18900, roas: 7.3 },
  { week: "W-2", spend: 2800, clicks: 1900, conversions: 25, revenue: 21600, roas: 7.7 },
  { week: "W-1", spend: 3000, clicks: 2100, conversions: 28, revenue: 24800, roas: 8.3 },
  { week: "W-0", spend: 3200, clicks: 2300, conversions: 31, revenue: 29200, roas: 9.1 },
];

// ── Computed KPIs ─────────────────────────────────────────────────
export function getAdsKPIs(): AdsKPI {
  const active = AD_CAMPAIGNS.filter(c => c.status === "active");
  const totalSpend = active.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = active.reduce((s, c) => s + c.revenue, 0);
  const totalClicks = active.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = active.reduce((s, c) => s + c.impressions, 0);
  const totalConversions = active.reduce((s, c) => s + c.conversions, 0);
  const totalBudget = active.reduce((s, c) => s + c.budget, 0);
  const totalSpendPrev = AD_PLATFORMS.reduce((s, p) => s + p.spendPrev, 0);

  return {
    totalSpendMTD: totalSpend,
    totalSpendPrev,
    totalRevenue,
    blendedROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    totalConversions,
    totalClicks,
    totalImpressions,
    avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
    avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    avgCPL: totalConversions > 0 ? totalSpend / totalConversions : 0,
    avgCPA: totalConversions > 0 ? totalSpend / totalConversions : 0,
    activeCampaigns: active.length,
    totalBudget,
    budgetUtilization: totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0,
  };
}

export function getTopPerformingCreatives(limit = 5): AdCreative[] {
  return [...AD_CREATIVES]
    .filter(c => c.status !== "underperforming")
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, limit);
}

export function getUnderperformingCreatives(): AdCreative[] {
  return AD_CREATIVES.filter(c => c.performanceScore < 70 || c.status === "underperforming");
}

export function getCampaignByPlatform(): Record<string, AdCampaign[]> {
  const result: Record<string, AdCampaign[]> = { google: [], meta: [], linkedin: [] };
  for (const c of AD_CAMPAIGNS) {
    if (!result[c.platform]) result[c.platform] = [];
    result[c.platform].push(c);
  }
  return result;
}
