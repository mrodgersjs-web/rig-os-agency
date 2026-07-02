/**
 * Spend Reduction Dashboard Data Layer
 * Tracks service costs, optimization opportunities, and realized savings.
 */

export interface ServiceSpend {
  service: string;
  category: "AI/LLM" | "Cloud" | "SaaS" | "Network" | "Tools";
  monthlyCost: number;
  projectedCost: number; // post-optimization
  utilization: number; // 0-1
  status: "optimized" | "review" | "waste";
  lastAudit: string;
  notes: string;
}

export interface OptimizationOpportunity {
  id: string;
  title: string;
  description: string;
  category: "API Consolidation" | "Model Routing" | "Cache Strategy" | "Resource Scaling" | "Vendor Negotiation";
  currentSpend: number;
  projectedSpend: number;
  monthlySavings: number;
  annualSavings: number;
  effort: "Low" | "Medium" | "High";
  risk: "Low" | "Medium" | "High";
  status: "identified" | "in_progress" | "implemented" | "verified";
}

export interface SpendCategory {
  category: string;
  thisMonth: number;
  lastMonth: number;
  budget: number;
  trend: number; // percentage change
}

export const getServiceSpends = (): ServiceSpend[] => [
  {
    service: "OpenAI GPT-4o",
    category: "AI/LLM",
    monthlyCost: 840,
    projectedCost: 320,
    utilization: 0.78,
    status: "review",
    lastAudit: "2026-06-20",
    notes: "Route routine tasks to GLM-5.2 on local B200s — 62% usage is classification",
  },
  {
    service: "Modal GPU (B200 ×8)",
    category: "Cloud",
    monthlyCost: 0,
    projectedCost: 0,
    utilization: 0.92,
    status: "optimized",
    lastAudit: "2026-06-22",
    notes: "Pending auth — local hardware covers inference needs",
  },
  {
    service: "Vercel Pro",
    category: "SaaS",
    monthlyCost: 20,
    projectedCost: 20,
    utilization: 0.95,
    status: "optimized",
    lastAudit: "2026-06-15",
    notes: "TransformFit + agency app deployed, bandwidth within limits",
  },
  {
    service: "Supabase",
    category: "Cloud",
    monthlyCost: 25,
    projectedCost: 25,
    utilization: 0.60,
    status: "optimized",
    lastAudit: "2026-06-18",
    notes: "Pro tier, KV + DB usage well under limits",
  },
  {
    service: "Cloudflare Workers",
    category: "Cloud",
    monthlyCost: 5,
    projectedCost: 5,
    utilization: 0.40,
    status: "optimized",
    lastAudit: "2026-06-22",
    notes: "Free tier, request volume modest",
  },
  {
    service: "Tailscale",
    category: "Network",
    monthlyCost: 0,
    projectedCost: 0,
    utilization: 0.85,
    status: "optimized",
    lastAudit: "2026-06-19",
    notes: "Personal plan, LAN-first covers most traffic",
  },
  {
    service: "FAL (Image/Video Gen)",
    category: "AI/LLM",
    monthlyCost: 45,
    projectedCost: 30,
    utilization: 0.55,
    status: "review",
    lastAudit: "2026-06-21",
    notes: "Batch image gen during off-peak to cut API calls",
  },
  {
    service: "Firecrawl",
    category: "Tools",
    monthlyCost: 16,
    projectedCost: 0,
    utilization: 0.30,
    status: "waste",
    lastAudit: "2026-06-20",
    notes: "Exa + direct HTTP covers 90% of scraping — cancel",
  },
  {
    service: "Exa Search",
    category: "Tools",
    monthlyCost: 50,
    projectedCost: 50,
    utilization: 0.70,
    status: "optimized",
    lastAudit: "2026-06-22",
    notes: "Core research pipeline depends on it",
  },
  {
    service: "GitHub Copilot",
    category: "Tools",
    monthlyCost: 10,
    projectedCost: 10,
    utilization: 0.88,
    status: "optimized",
    lastAudit: "2026-06-15",
    notes: "Used across repos, solid ROI",
  },
  {
    service: "Notion",
    category: "SaaS",
    monthlyCost: 0,
    projectedCost: 0,
    utilization: 0.15,
    status: "waste",
    lastAudit: "2026-06-10",
    notes: "Migrated to Obsidian vault — no active usage",
  },
  {
    service: "Linear",
    category: "SaaS",
    monthlyCost: 0,
    projectedCost: 0,
    utilization: 0.05,
    status: "waste",
    lastAudit: "2026-06-10",
    notes: "Kanban replaced by RIG OS internal — cancel",
  },
];

export const getOptimizationOpportunities = (): OptimizationOpportunity[] => [
  {
    id: "OPT-001",
    title: "Route classification tasks to local GLM-5.2",
    description: "62% of OpenAI calls are simple classification/extraction. Route these to local B200 cluster via SGLang.",
    category: "Model Routing",
    currentSpend: 520,
    projectedSpend: 0,
    monthlySavings: 520,
    annualSavings: 6240,
    effort: "Medium",
    risk: "Low",
    status: "in_progress",
  },
  {
    id: "OPT-002",
    title: "Cancel Firecrawl subscription",
    description: "Exa + direct HTTP scraping covers 90% of needs. Firecrawl adds redundant API calls.",
    category: "Vendor Negotiation",
    currentSpend: 16,
    projectedSpend: 0,
    monthlySavings: 16,
    annualSavings: 192,
    effort: "Low",
    risk: "Low",
    status: "identified",
  },
  {
    id: "OPT-003",
    title: "Cancel Notion and Linear subscriptions",
    description: "Fully migrated to Obsidian vault and RIG OS kanban. No active usage on either platform.",
    category: "Vendor Negotiation",
    currentSpend: 0,
    projectedSpend: 0,
    monthlySavings: 0,
    annualSavings: 0,
    effort: "Low",
    risk: "Low",
    status: "implemented",
  },
  {
    id: "OPT-004",
    title: "Implement request caching for Exa search",
    description: "40% of Exa queries are duplicate searches. Add Redis/edge cache layer to cut API volume.",
    category: "Cache Strategy",
    currentSpend: 50,
    projectedSpend: 30,
    monthlySavings: 20,
    annualSavings: 240,
    effort: "Medium",
    risk: "Low",
    status: "identified",
  },
  {
    id: "OPT-005",
    title: "Batch FAL image generation",
    description: "Batch studio image gen to off-peak hours reduces per-request pricing by ~33%.",
    category: "API Consolidation",
    currentSpend: 45,
    projectedSpend: 30,
    monthlySavings: 15,
    annualSavings: 180,
    effort: "Low",
    risk: "Low",
    status: "identified",
  },
  {
    id: "OPT-006",
    title: "Consolidate embedding model providers",
    description: "Using 3 different embedding endpoints. Consolidate to single local model on B200.",
    category: "Resource Scaling",
    currentSpend: 120,
    projectedSpend: 0,
    monthlySavings: 120,
    annualSavings: 1440,
    effort: "High",
    risk: "Medium",
    status: "identified",
  },
  {
    id: "OPT-007",
    title: "LAN-first model routing for TTS",
    description: "Edge TTS is free and local. Remove remaining OpenAI TTS calls for non-premium voice output.",
    category: "Model Routing",
    currentSpend: 35,
    projectedSpend: 0,
    monthlySavings: 35,
    annualSavings: 420,
    effort: "Low",
    risk: "Low",
    status: "implemented",
  },
];

export const getSpendByCategory = (): SpendCategory[] => {
  const services = getServiceSpends();
  const categories = ["AI/LLM", "Cloud", "SaaS", "Network", "Tools"];
  return categories.map((cat) => {
    const items = services.filter((s) => s.category === cat);
    const thisMonth = items.reduce((sum, s) => sum + s.monthlyCost, 0);
    const lastMonth = Math.round(thisMonth * 1.12);
    const budget = cat === "AI/LLM" ? 1200 : cat === "Cloud" ? 200 : cat === "SaaS" ? 150 : cat === "Network" ? 50 : 200;
    return {
      category: cat,
      thisMonth,
      lastMonth,
      budget,
      trend: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0,
    };
  });
};

export function getSpendKPIs() {
  const services = getServiceSpends();
  const opportunities = getOptimizationOpportunities();

  const totalMonthlySpend = services.reduce((sum, s) => sum + s.monthlyCost, 0);
  const projectedMonthlySpend = services.reduce((sum, s) => sum + s.projectedCost, 0);
  const monthlySavings = opportunities
    .filter((o) => o.status !== "identified")
    .reduce((sum, o) => sum + o.monthlySavings, 0);
  const identifiedSavings = opportunities
    .filter((o) => o.status === "identified")
    .reduce((sum, o) => sum + o.monthlySavings, 0);
  const totalAnnualSavings = opportunities.reduce((sum, o) => sum + o.annualSavings, 0);
  const wasteServices = services.filter((s) => s.status === "waste");
  const wasteCost = wasteServices.reduce((sum, s) => sum + s.monthlyCost, 0);

  return {
    totalMonthlySpend,
    projectedMonthlySpend,
    monthlySavings,
    identifiedSavings,
    totalAnnualSavings,
    wasteCost,
    wasteCount: wasteServices.length,
    optimizationRate: totalMonthlySpend > 0 ? monthlySavings / totalMonthlySpend : 0,
    projectedReduction: totalMonthlySpend > 0 ? (totalMonthlySpend - projectedMonthlySpend) / totalMonthlySpend : 0,
  };
}
