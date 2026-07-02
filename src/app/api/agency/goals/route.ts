import { NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OUTBOUND_DIR = "/Users/rig128gb/Developer/rig-gtm-studio-v2/proof/outbound";
const CLIENTS_DIR = "/Users/rig128gb/Developer/rig-gtm-studio-v2/clients";

function getProspectCount(): number {
  try {
    return readdirSync(CLIENTS_DIR).filter(
      (f) => !f.startsWith("_") && !f.startsWith(".")
    ).length;
  } catch {
    return 0;
  }
}

function getEmailCount(): number {
  let total = 0;
  try {
    const files = readdirSync(OUTBOUND_DIR).filter(
      (f) => f.includes("SENT") && f.endsWith(".json")
    );
    for (const f of files) {
      const data = JSON.parse(readFileSync(join(OUTBOUND_DIR, f), "utf-8"));
      total += data.sent_count || 0;
    }
    // Also count warmup-day1
    const warmupFile = join(OUTBOUND_DIR, "warmup-day1-sent.json");
    if (existsSync(warmupFile)) {
      const data = JSON.parse(readFileSync(warmupFile, "utf-8"));
      if (Array.isArray(data)) total += data.length;
    }
  } catch {}
  return total;
}

export async function GET() {
  const prospects = getProspectCount();
  const emailsSent = getEmailCount();

  const milestones = [
    {
      step: 1,
      label: "Prospect Discovery",
      target: "300 qualified prospects scraped",
      current: `${prospects} prospects`,
      progress: Math.round((prospects / 300) * 100),
      status: prospects >= 272 ? "active" : "pending",
      icon: "search",
    },
    {
      step: 2,
      label: "Initial Outreach",
      target: "500 emails sent",
      current: `${emailsSent} emails sent`,
      progress: Math.round((emailsSent / 500) * 100),
      status: "active",
      icon: "mail",
    },
    {
      step: 3,
      label: "First Reply",
      target: "Get first reply",
      current: "0 replies received",
      progress: 0,
      status: "pending",
      icon: "message-circle",
    },
    {
      step: 4,
      label: "Discovery Calls",
      target: "10 discovery calls",
      current: "0 calls held",
      progress: 0,
      status: "pending",
      icon: "phone",
    },
    {
      step: 5,
      label: "First Contract",
      target: "1 signed contract",
      current: "0 contracts signed",
      progress: 0,
      status: "pending",
      icon: "file-text",
    },
    {
      step: 6,
      label: "First Payment",
      target: "First Stripe payment processed",
      current: "$0 processed",
      progress: 0,
      status: "pending",
      icon: "credit-card",
    },
    {
      step: 7,
      label: "$100K ARR",
      target: "$100,000 annual recurring revenue",
      current: "$0 ARR",
      progress: 0,
      status: "pending",
      icon: "trending-up",
    },
    {
      step: 8,
      label: "$1M ARR",
      target: "$1,000,000 annual recurring revenue",
      current: "$0 ARR",
      progress: 0,
      status: "pending",
      icon: "trending-up",
    },
    {
      step: 9,
      label: "$5M ARR",
      target: "$5,000,000 annual recurring revenue",
      current: "$0 ARR",
      progress: 0,
      status: "pending",
      icon: "star",
    },
    {
      step: 10,
      label: "$10M ARR",
      target: "$10,000,000 annual recurring revenue",
      current: "$0 ARR",
      progress: 0,
      status: "pending",
      icon: "trophy",
    },
  ];

  return NextResponse.json({
    _real: true,
    _honest: "Pre-revenue. No mock data. Real prospects and real emails sent.",
    current: {
      arr: 0,
      mrr: 0,
      clients: 0,
      contracts: 0,
      pipeline: 0,
      prospects,
      emailsSent,
      replies: 0,
      meetings: 0,
      payments: 0,
    },
    target: {
      arr: 10_000_000,
      label: "$10M ARR",
    },
    gap: 10_000_000,
    progressPercent: 0,
    milestones,
    path: "Scrape → Email → Reply → Call → Contract → Payment → Scale → $10M ARR",
    nextAction: "Monitor Resend inbox for replies. Move to discovery calls on first reply.",
  });
}