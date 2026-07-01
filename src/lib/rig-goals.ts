// ── RIG OS Agency — Goals System ───────────────────────────────────
// $10M ARR path, quarterly milestones, daily ops, OKRs.

export interface Goal {
  id: string;
  title: string;
  category: "revenue" | "clients" | "outreach" | "product" | "ops" | "hiring";
  target: number;
  current: number;
  unit: string;
  deadline: string;
  status: "on_track" | "at_risk" | "behind" | "achieved";
  evidence: string; // Where the number comes from (no ledger = no claim)
}

export interface QuarterlyOKR {
  quarter: string;
  objective: string;
  keyResults: { kr: string; target: number; current: number; unit: string }[];
}

export interface DailyOpsGoal {
  id: string;
  name: string;
  target: number;
  unit: string;
  schedule: string;
  evidence: string;
}

// ── $10M ARR Path ──────────────────────────────────────────────────
export const ARR_PATH: { quarter: string; arr: number; mrr: number; clients: number; avgValue: number }[] = [
  { quarter: "Q3 2026", arr: 250_000, mrr: 20_833, clients: 5, avgValue: 50_000 },
  { quarter: "Q4 2026", arr: 500_000, mrr: 41_667, clients: 10, avgValue: 50_000 },
  { quarter: "Q1 2027", arr: 1_000_000, mrr: 83_333, clients: 20, avgValue: 50_000 },
  { quarter: "Q2 2027", arr: 2_500_000, mrr: 208_333, clients: 40, avgValue: 62_500 },
  { quarter: "Q3 2027", arr: 5_000_000, mrr: 416_667, clients: 70, avgValue: 71_429 },
  { quarter: "Q4 2027", arr: 10_000_000, mrr: 833_333, clients: 120, avgValue: 83_333 },
];

// ── Active Goals ────────────────────────────────────────────────────
export const ACTIVE_GOALS: Goal[] = [
  { id: "arr-10m", title: "$10M Annual Recurring Revenue", category: "revenue", target: 10_000_000, current: 0, unit: "$", deadline: "2027-12-31", status: "on_track", evidence: "data/receipt_ledger.json + agency-data.ts" },
  { id: "clients-120", title: "120 Active Clients", category: "clients", target: 120, current: 0, unit: "clients", deadline: "2027-12-31", status: "on_track", evidence: "CRM contact count" },
  { id: "dms-45", title: "45 DMs per Day", category: "outreach", target: 45, current: 0, unit: "DMs/day", deadline: "2026-07-31", status: "at_risk", evidence: "dm_ledger.json (NOT YET IMPLEMENTED)" },
  { id: "posts-1", title: "1 LinkedIn Post per Day", category: "outreach", target: 30, current: 15, unit: "posts/month", deadline: "2026-07-31", status: "on_track", evidence: "Postiz posts:list" },
  { id: "clients-10mo", title: "10 New Clients per Month", category: "clients", target: 10, current: 0, unit: "clients/month", deadline: "2026-07-31", status: "behind", evidence: "CRM new clients this month" },
  { id: "jobs-10mo", title: "10 Job Offers per Month", category: "hiring", target: 10, current: 0, unit: "offers/month", deadline: "2026-07-31", status: "behind", evidence: "DM responses with hiring intent" },
  { id: "followers-10x", title: "10x LinkedIn Followers", category: "outreach", target: 10_000, current: 0, unit: "followers", deadline: "2026-12-31", status: "on_track", evidence: "LinkedIn analytics export" },
  { id: "app-prod", title: "RIG OS Agency in Production", category: "product", target: 1, current: 1, unit: "deployed", deadline: "2026-07-01", status: "achieved", evidence: "Docker build passes, GitHub push confirmed" },
];

// ── Quarterly OKRs ──────────────────────────────────────────────────
export const QUARTERLY_OKRS: QuarterlyOKR[] = [
  {
    quarter: "Q3 2026",
    objective: "Establish RIG as a credible AI agency with first paying clients",
    keyResults: [
      { kr: "Sign 5 clients across 3 verticals", target: 5, current: 0, unit: "clients" },
      { kr: "Reach $250K ARR", target: 250_000, current: 0, unit: "$" },
      { kr: "Deploy RIG OS Agency to production", target: 1, current: 1, unit: "deployed" },
      { kr: "Send 1,350 DMs (45/day × 30 days)", target: 1_350, current: 0, unit: "DMs" },
    ],
  },
  {
    quarter: "Q4 2026",
    objective: "Scale to $500K ARR with proven playbooks across all 8 verticals",
    keyResults: [
      { kr: "Sign 10 more clients (total 15)", target: 15, current: 0, unit: "clients" },
      { kr: "Reach $500K ARR", target: 500_000, current: 0, unit: "$" },
      { kr: "Launch white-label client portals", target: 1, current: 0, unit: "feature" },
      { kr: "Automated weekly client reporting", target: 8, current: 0, unit: "verticals" },
    ],
  },
  {
    quarter: "Q1 2027",
    objective: "Cross $1M ARR and build the team for scale",
    keyResults: [
      { kr: "20 active clients", target: 20, current: 0, unit: "clients" },
      { kr: "$1M ARR", target: 1_000_000, current: 0, unit: "$" },
      { kr: "Hire 2 delivery engineers", target: 2, current: 0, unit: "hires" },
      { kr: "Multi-tenant architecture live", target: 1, current: 0, unit: "feature" },
    ],
  },
  {
    quarter: "Q4 2027",
    objective: "Reach $10M ARR — the target",
    keyResults: [
      { kr: "120 active clients", target: 120, current: 0, unit: "clients" },
      { kr: "$10M ARR", target: 10_000_000, current: 0, unit: "$" },
      { kr: "$8.3K average client value", target: 8_333, current: 0, unit: "$" },
      { kr: "< 5% monthly churn", target: 5, current: 0, unit: "%" },
    ],
  },
];

// ── Daily Ops Goals ─────────────────────────────────────────────────
export const DAILY_OPS: DailyOpsGoal[] = [
  { id: "dm-morning", name: "Morning DMs", target: 15, unit: "DMs", schedule: "9 AM (15:00 UTC)", evidence: "dm_ledger.json morning batch" },
  { id: "dm-afternoon", name: "Afternoon DMs", target: 15, unit: "DMs", schedule: "1 PM (19:00 UTC)", evidence: "dm_ledger.json afternoon batch" },
  { id: "dm-evening", name: "Evening DMs", target: 15, unit: "DMs", schedule: "5 PM (23:00 UTC)", evidence: "dm_ledger.json evening batch" },
  { id: "post-daily", name: "LinkedIn Post", target: 1, unit: "post", schedule: "Mon-Thu via Postiz", evidence: "Postiz posts:list" },
  { id: "engagement", name: "Engagement Window", target: 90, unit: "minutes", schedule: "Daily, flexible", evidence: "engagement_log.json" },
  { id: "cookie-refresh", name: "Cookie Refresh", target: 1, unit: "refresh", schedule: "Every 8h", evidence: "cookie-refresh.log" },
];

// ── Helper Functions ──────────────────────────────────────────────
export function getGoals(): Goal[] {
  return ACTIVE_GOALS;
}

export function getGoalsByCategory(category: Goal["category"]): Goal[] {
  return ACTIVE_GOALS.filter((g) => g.category === category);
}

export function getGoalProgress(id: string): number {
  const goal = ACTIVE_GOALS.find((g) => g.id === id);
  if (!goal || goal.target === 0) return 0;
  return Math.min((goal.current / goal.target) * 100, 100);
}

export function getOKRs(): QuarterlyOKR[] {
  return QUARTERLY_OKRS;
}

export function getDailyOps(): DailyOpsGoal[] {
  return DAILY_OPS;
}

export function getARRPath() {
  return ARR_PATH;
}

export function getCurrentQuarter(): QuarterlyOKR {
  return QUARTERLY_OKRS[0];
}