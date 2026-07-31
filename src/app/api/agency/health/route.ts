// ── RIG OS Agency — Health API ──────────────────────────────────────
// Comprehensive health check: server status, database connectivity,
// agency counts (clients, deals, proposals, contracts, invoices),
// GTM prospect counts, and page inventory.
// Surfaced for monitoring scripts, cron turns, and dashboards.

import { NextResponse } from "next/server";
import { dbGetClients, dbGetPipelineDeals, dbGetProposals, dbGetContracts, dbGetInvoices } from "@/lib/db";
import { getGroundTruth } from "@/lib/truth";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

const GTM_STUDIO_V2_ROOT = "/Users/rig128gb/Developer/rig-gtm-studio-v2";
const APP_ROOT = "/Users/rig128gb/Developer/rig-os-agency";

function safeCount<T>(arr: T[] | undefined): number {
  try {
    return arr ? arr.length : 0;
  } catch {
    return 0;
  }
}

function countPages(): number {
  try {
    const walk = (dir: string): number => {
      let count = 0;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          count += walk(full);
        } else if (entry.name === "page.tsx") {
          count += 1;
        }
      }
      return count;
    };
    return walk(path.join(APP_ROOT, "src", "app"));
  } catch {
    return 0;
  }
}

/**
 * Count GTM PROSPECT directories.
 *
 * SEAM-BUG GUARD (G11). The directory on disk is named `clients/` but it
 * contains PROSPECTS — 401 generated teaser-page targets, not customers. RIG
 * has zero customers. The variable and the reported key are both named
 * `gtmProspect*` so that a future rename of the directory cannot silently turn
 * 401 teaser pages into "401 clients" on a dashboard. Do not rename this to
 * anything containing "client".
 */
function countGtmProspectDirs(): number {
  try {
    const prospectDir = path.join(GTM_STUDIO_V2_ROOT, "clients");
    const entries = fs.readdirSync(prospectDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !e.name.startsWith("_")).length;
  } catch {
    return 0;
  }
}

export async function GET() {
  const startMs = Date.now();

  let dbStatus = "ok";
  let clientCount = 0;
  let dealCount = 0;
  let proposalCount = 0;
  let contractCount = 0;
  let invoiceCount = 0;

  try {
    clientCount = safeCount(dbGetClients());
    dealCount = safeCount(dbGetPipelineDeals());
    proposalCount = safeCount(dbGetProposals());
    contractCount = safeCount(dbGetContracts());
    invoiceCount = safeCount(dbGetInvoices());
  } catch {
    dbStatus = "error";
  }

  const gtmProspects = countGtmProspectDirs();
  const pageCount = countPages();

  // ── G11: CONSISTENCY ASSERTION ──────────────────────────────────────
  // The defect this guards: this endpoint reported `clients:10, contracts:6`
  // while /api/agency/goals reported `clients:0, arr:0` in the same second.
  // Those rows are seeded demo data; RIG is pre-revenue.
  //
  // Ground truth is now read from ONE place (src/lib/truth.ts, sourced from
  // the signed ledger). If the local store disagrees with it, that is a
  // DEFECT — report `database: "inconsistent"` rather than "ok", so the
  // contradiction can never again be presented as two confident numbers.
  const truth = getGroundTruth();
  const truthArr = truth.arr.ok ? truth.arr.value : null;
  const truthClients = truth.clients.ok ? truth.clients.value : null;

  const inconsistencies: string[] = [];
  if (truthArr === 0 && clientCount > 0) {
    inconsistencies.push(
      `store reports ${clientCount} client(s) but verified ARR is $0 — these are seeded demo rows, not customers`
    );
  }
  if (truthClients === 0 && contractCount > 0) {
    inconsistencies.push(
      `store reports ${contractCount} contract(s) but verified client count is 0 — seeded demo rows`
    );
  }
  if (truth.demo_store_detected && truth.demo_store_detail) {
    inconsistencies.push(truth.demo_store_detail);
  }

  if (inconsistencies.length > 0 && dbStatus === "ok") dbStatus = "inconsistent";

  const latencyMs = Date.now() - startMs;

  const buildStatus = pageCount > 0 ? "ok" : "degraded";
  const overallOk = dbStatus === "ok" && buildStatus === "ok";
  const body = {
    status: overallOk ? "ok" : "degraded",
    app: "RIG OS Agency",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3737,
    latency_ms: latencyMs,
    checks: {
      database: dbStatus,
      server: "ok",
      build_artifacts: buildStatus,
    },
    // Anything non-empty here means two surfaces would otherwise disagree.
    inconsistencies,
    // VERIFIED business state — the authoritative numbers, from the signed
    // ledger via src/lib/truth.ts. Read THESE, not `counts`, to answer
    // "does RIG have customers / revenue / calls held".
    verified: {
      calls_held: truth.calls_held,
      clients: truth.clients,
      contracts: truth.contracts,
      arr: truth.arr,
      emails_sent: truth.emails_sent,
      linkedin_comments: truth.linkedin_comments,
      as_of: truth.as_of,
    },
    // LOCAL STORE row counts. NOT customers, NOT revenue — this is the app's
    // scratchpad and may contain seeded demo rows. Kept for debugging only;
    // `verified` above is the business truth.
    counts: {
      store_clients: clientCount,
      store_pipeline_deals: dealCount,
      store_proposals: proposalCount,
      store_contracts: contractCount,
      store_invoices: invoiceCount,
      gtm_prospect_dirs: gtmProspects,
      app_pages: pageCount,
    },
    counts_note:
      "`counts` are LOCAL STORE rows (may be seeded demo data). `verified` is the business truth from the signed ledger.",
    design_system: "Midnight Aubergine",
    doctrine: "ProofPacket or it didn't happen",
  };

  // Cron-friendly: return non-200 when degraded so monitoring scripts
  // can `curl -f` and catch outages instead of silently archiving HTML.
  return NextResponse.json(body, { status: overallOk ? 200 : 503 });
}
