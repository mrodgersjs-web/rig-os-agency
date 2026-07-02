// ── Jarvis Morning Briefing — Core Types ──────────────────────────────
// Structured morning briefing for Mike Rodgers, assembled by Jarvis
// from ALL data sources: agency, fleet, CRM, git, Obsidian, cron, Stripe.

export interface JarvisSection {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color?: string;       // accent colour for the card header
  items: JarvisItem[];
  summary?: string;     // one-line executive summary for voice synthesis
  meta?: Record<string, unknown>;  // raw counts, KPIs, etc.
}

export interface JarvisItem {
  text: string;
  value?: string | number;  // numeric/metric value
  status?: "ok" | "warn" | "alert" | "info";  // visual status dot
  link?: string;            // deep-link into RIG OS Agency
  detail?: string;          // secondary line / context
}

export interface JarvisBriefing {
  // Metadata
  briefingId: string;       // "jarvis-2026-07-02"
  date: string;             // "Thursday, July 2, 2026"
  timestamp: string;        // ISO 8601
  version: string;          // "1.0.0"

  // Personal greeting
  greeting: {
    text: string;           // full spoken greeting (Web Speech API)
    short: string;          // header-only greeting ("Good morning, Mike.")
    personalNote?: string;  // personalised note from Jake's voice
  };

  // All sections in display order
  sections: JarvisSection[];

  // Voice synthesis — the full briefing as one continuous string
  voiceScript: string;

  // Quick stats for the top bar
  quickStats: {
    arrProgress: string;    // "$XXXK / $10M (X%)"
    activeClients: number;
    contractsSigned: number;
    overnightBuilds: number;
    agentsActive: number;
    adsActive: number;
  };
}