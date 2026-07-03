// ── RIG OS Agency — Health API ──────────────────────────────────────
// Comprehensive health check: server status, database connectivity,
// agency counts (clients, deals, proposals, contracts, invoices),
// GTM prospect counts, and page inventory.
// Surfaced for monitoring scripts, cron turns, and dashboards.

import { NextResponse } from "next/server";
import { dbGetClients, dbGetPipelineDeals, dbGetProposals, dbGetContracts, dbGetInvoices } from "@/lib/db";
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

function countGtmProspects(): number {
  try {
    const clientsDir = path.join(GTM_STUDIO_V2_ROOT, "clients");
    const entries = fs.readdirSync(clientsDir, { withFileTypes: true });
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

  const gtmProspects = countGtmProspects();
  const pageCount = countPages();
  const latencyMs = Date.now() - startMs;

  return NextResponse.json({
    status: "ok",
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
      build_artifacts: pageCount > 0 ? "ok" : "degraded",
    },
    counts: {
      clients: clientCount,
      pipeline_deals: dealCount,
      proposals: proposalCount,
      contracts: contractCount,
      invoices: invoiceCount,
      gtm_prospects: gtmProspects,
      app_pages: pageCount,
    },
    design_system: "Midnight Aubergine",
    doctrine: "ProofPacket or it didn't happen",
  });
}
