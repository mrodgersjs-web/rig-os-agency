export type PipelineStage = "prospecting" | "discovery" | "proposal" | "negotiation" | "closed_won";

export interface Deal {
  id: string;
  clientRef: string;
  title: string;
  company?: string;
  stage: PipelineStage;
  amount_usd?: number;
  source_channel?: string;
  confidence_pcts: Record<string, number>;
  next_action?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const STAGES: { stage: PipelineStage; label: string; color: string }[] = [
  { stage: "prospecting", label: "Prospecting", color: "#38bdf8" },
  { stage: "discovery", label: "Discovery", color: "#a78bfa" },
  { stage: "proposal", label: "Proposal", color: "#f472b6" },
  { stage: "negotiation", label: "Negotiation", color: "#fb923c" },
  { stage: "closed_won", label: "Closed Won", color: "#5ab896" },
];

export const SEED_DEALS: Deal[] = [
  {
    id: "d1", clientRef: "C001", title: "Agency OS Redesign — 90 Day Sprint", company: "Horizon Creative Co.", stage: "closed_won", amount_usd: 67_000, source_channel: "linkedin", confidence_pcts: { pipeline: 15, email: 45, web: 32, referral: 8 }, notes: "Final delivery wrapped Q2.", created_at: "2026-06-10T09:00:00Z", updated_at: "2026-07-04T15:10:00Z"
  },
  {
    id: "d2", clientRef: "C003", title: "Research Ops — Daily Scrape + Auto-Route", company: "Veritas Analytics Ltd.", stage: "proposal", amount_usd: 44_500, source_channel: "referral", confidence_pcts: { pipeline: 20, email: 38, web: 25, referral: 17 }, next_action: "Drafting SOW for Phase 1.", created_at: "2026-06-14T10:00:00Z", updated_at: "2026-07-03T11:30:00Z"
  },
  {
    id: "d3", clientRef: "C005", title: "LinkedIn — Brand Lift & Thought Leadership Campaign", company: "Slate Capital Group.", stage: "discovery", amount_usd: 28_000, source_channel: "web", confidence_pcts: { pipeline: 10, email: 30, web: 40, referral: 20 }, next_action: "Discovery call scheduled Fri 14:00.", created_at: "2026-06-28T08:30:00Z", updated_at: "2026-07-05T09:45:00Z"
  },
  {
    id: "d4", clientRef: "C011", title: "Voicebox — Custom Model RAG Overhaul", company: "Lexicon Data Labs.", stage: "proposal", amount_usd: 82_000, source_channel: "linkedin", confidence_pcts: { pipeline: 35, email: 40, web: 15, referral: 10 }, next_action: "Send proposal v2 by Mon EOD.", created_at: "2026-07-01T11:15:00Z", updated_at: "2026-07-04T13:00:00Z"
  }
];