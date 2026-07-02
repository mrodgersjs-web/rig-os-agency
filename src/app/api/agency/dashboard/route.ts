// ── RIG OS Agency — Dashboard API ────────────────────────────────────
// Merges REAL GTM Studio V2 outbound metrics with SAMPLE SQLite seed data.
// Real metrics: prospect count from clients/ dirs, email sends from proof/outbound/ manifests.
// Seed data: 10 sample clients in SQLite (clearly labelled SAMPLE).

import { NextResponse } from "next/server";
import { dbGetClients, dbGetDashboardKPIs, dbGetPipelineDeals } from "@/lib/db";
import { VERTICALS, SERVICE_TIERS, getRevenueByVertical, getRevenueByTier } from "@/lib/agency-data";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

// ── GTM Studio V2 repo path ────────────────────────────────────────
const GTM_STUDIO_V2_ROOT = "/Users/rig128gb/Developer/rig-gtm-studio-v2";
const GTM_CLIENTS_DIR = path.join(GTM_STUDIO_V2_ROOT, "clients");
const GTM_OUTBOUND_DIR = path.join(GTM_STUDIO_V2_ROOT, "proof", "outbound");

// ── Real metrics from GTM Studio V2 ────────────────────────────────

/**
 * Count real prospect directories in GTM Studio V2 clients/.
 * Excludes hidden/system dirs starting with `_` (templates, blueprints, etc.).
 */
function countRealProspects(): number {
  try {
    const entries = fs.readdirSync(GTM_CLIENTS_DIR, { withFileTypes: true });
    return entries.filter(
      (e) => e.isDirectory() && !e.name.startsWith("_")
    ).length;
  } catch {
    return 0;
  }
}

/**
 * Count real emails sent by scanning all send manifest JSONs in proof/outbound/.
 * Counts entries with `status: "sent"` in the `results` array, or `ok: true`
 * for list-style manifests (warmup-day1-sent.json).
 */
interface SendResult {
  slug?: string;
  status?: string;
  ok?: boolean;
  resend_id?: string;
}

interface SendManifest {
  sent_count?: number;
  results?: SendResult[];
  dry_run_preview?: boolean;
}

function countRealEmailsSent(): number {
  try {
    const files = fs.readdirSync(GTM_OUTBOUND_DIR).filter((f) => f.endsWith(".json"));
    let total = 0;

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(GTM_OUTBOUND_DIR, file), "utf-8");
        const data = JSON.parse(raw) as SendManifest | SendResult[];

        // List-style manifest (e.g. warmup-day1-sent.json)
        if (Array.isArray(data)) {
          total += data.filter(
            (r) => typeof r === "object" && r !== null && (r.ok === true || r.status === "sent")
          ).length;
          continue;
        }

        // Dict-style manifest with results array
        // Skip dry-run previews (dry_run_preview === true means nothing actually sent)
        if (data.dry_run_preview === true) continue;

        if (data.results && Array.isArray(data.results)) {
          total += data.results.filter((r) => r.status === "sent").length;
        } else if (typeof data.sent_count === "number" && data.sent_count > 0) {
          // Fallback to sent_count field if results not present
          total += data.sent_count;
        }
      } catch {
        // Skip malformed JSON
      }
    }

    return total;
  } catch {
    return 0;
  }
}

// ── API Route ──────────────────────────────────────────────────────

export async function GET() {
  try {
    // ── Real GTM Studio V2 metrics ────────────────────────────────
    const realProspects = countRealProspects();
    const realEmailsSent = countRealEmailsSent();
    const realRevenue = 0; // Stripe not enabled yet

    // ── SAMPLE seed data from SQLite (10 fake clients) ────────────
    const sampleKpis = dbGetDashboardKPIs();
    const sampleClients = dbGetClients();

    return NextResponse.json({
      // ── REAL metrics from GTM Studio V2 ────────────────────────
      realMetrics: {
        prospects: realProspects,
        emailsSent: realEmailsSent,
        revenue: realRevenue,
        revenueLabel: "Stripe not enabled — $0 real revenue",
        source: "GTM Studio V2 repo (clients/ + proof/outbound/)",
        clientsPath: GTM_CLIENTS_DIR,
        outboundPath: GTM_OUTBOUND_DIR,
        stripeEnabled: false,
      },

      // ── SAMPLE seed data (10 fake clients in SQLite) ────────────
      sampleData: {
        label: "SAMPLE — 10 seed clients in SQLite (not real)",
        kpis: sampleKpis,
        clients: sampleClients,
        pipeline: dbGetPipelineDeals(),
      },

      // ── Reference data (verticals/tiers are config, not data) ──
      verticals: VERTICALS,
      serviceTiers: SERVICE_TIERS,
      revenueByVertical: getRevenueByVertical(),
      revenueByTier: getRevenueByTier(),

      // ── Convenience KPIs that use real metrics ──────────────────
      kpis: {
        ...sampleKpis,
        // Override with real values where available
        realProspects,
        realEmailsSent,
        realRevenue,
        stripeEnabled: false,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}