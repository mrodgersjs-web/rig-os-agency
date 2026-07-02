import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Email {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;
  receivedAt: string;
  category: "lead" | "client" | "partner" | "internal" | "personal" | "urgent";
  categoryScore: number; // 0-1 confidence
  hasReply: boolean;
  repliedAt?: string;
  replyStatus: "none" | "drafting" | "sent" | "failed";
  threadId: string;
}

interface InboxResponse {
  _real: boolean;
  _source: string;
  emails: Email[];
  summary: {
    total: number;
    unread: number;
    urgent: number;
    needsReply: number;
    byCategory: Record<string, number>;
  };
}

// Simulated inbox data — swap with Python subprocess call when backend is ready.
// To wire up: spawn `python3 scripts/email_calendar_manager.py inbox --json`
// and parse stdout, or call a local REST endpoint.
function getMockInbox(): InboxResponse {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();

  const emails: Email[] = [
    {
      id: "em_001",
      from: "sarah.chen@techflow.io",
      fromName: "Sarah Chen",
      subject: "Re: AI Pipeline Integration — Phase 2 Proposal",
      body: "Hi Mike,\n\nGreat call yesterday. We're ready to move forward with Phase 2 — the AI pipeline integration. Let's get a contract drafted by Friday. Can you send over the scope of work?\n\nBest,\nSarah",
      receivedAt: hoursAgo(0.5),
      category: "client",
      categoryScore: 0.94,
      hasReply: false,
      replyStatus: "none",
      threadId: "th_042",
    },
    {
      id: "em_002",
      from: "marcus.webb@finedge.com",
      fromName: "Marcus Webb",
      subject: "Compliance automation demo — follow up",
      body: "Mike,\n\nYour demo last week was impressive. The board is meeting Thursday and I need a one-pager on the compliance automation solution for FinEdge. Can you send something by EOD Tuesday?\n\n— Marcus",
      receivedAt: hoursAgo(1.2),
      category: "lead",
      categoryScore: 0.88,
      hasReply: false,
      replyStatus: "none",
      threadId: "th_038",
    },
    {
      id: "em_003",
      from: "lisa.tran@eduscale.com",
      fromName: "Lisa Tran",
      subject: "Contract Signed — Next Steps for EduScale",
      body: "Mike,\n\nJust signed the contract. Let's kick off onboarding next week. Who's your point person for implementation?\n\nExcited to get started,\nLisa",
      receivedAt: hoursAgo(3),
      category: "client",
      categoryScore: 0.97,
      hasReply: true,
      repliedAt: hoursAgo(1.5),
      replyStatus: "sent",
      threadId: "th_033",
    },
    {
      id: "em_004",
      from: "dr.emily@healthbridge.med",
      fromName: "Dr. Emily Rodriguez",
      subject: "Patient data sync specs — questions",
      body: "Hi Mike,\n\nReviewing the patient data sync proposal. A few clarifications needed:\n1. HIPAA compliance posture for the sync pipeline\n2. On-prem vs cloud deployment options\n3. Timeline for Phase 1 pilot\n\nCan we hop on a 20 min call tomorrow?\n\nDr. R",
      receivedAt: hoursAgo(5),
      category: "lead",
      categoryScore: 0.82,
      hasReply: false,
      replyStatus: "none",
      threadId: "th_029",
    },
    {
      id: "em_005",
      from: "james.park@shipright.io",
      fromName: "James Park",
      subject: "Route optimization — cold intro",
      body: "Mike,\n\nHeard about RIG OS from Tom Anderson at ForgeWorks. He said your predictive models cut his ops costs 37%. We're running 400+ vehicles daily — would love to explore what you could do for ShipRight.\n\n— James",
      receivedAt: hoursAgo(8),
      category: "lead",
      categoryScore: 0.91,
      hasReply: true,
      repliedAt: hoursAgo(6),
      replyStatus: "sent",
      threadId: "th_044",
    },
    {
      id: "em_006",
      from: "rachel.kim@proptech.ai",
      fromName: "Rachel Kim",
      subject: "Property valuation AI partnership",
      body: "Hi Mike,\n\nWe're building a next-gen property valuation engine and your ML ops pipeline caught our eye. Interested in a strategic partnership — we bring the domain data, you bring the infrastructure.\n\nLet's talk?\nRachel",
      receivedAt: hoursAgo(12),
      category: "partner",
      categoryScore: 0.85,
      hasReply: false,
      replyStatus: "drafting",
      threadId: "th_045",
    },
    {
      id: "em_007",
      from: "tom.anderson@forgeworks.com",
      fromName: "Tom Anderson",
      subject: "Q3 QBR Prep — Metrics I need from you",
      body: "Mike,\n\nPrepping for our Q3 QBR. Need the following by Wednesday:\n- Uptime report for predictive maintenance pipeline\n- Cost savings vs baseline (last 3 months)\n- Roadmap for Q4 enhancements\n\nThanks,\nTom",
      receivedAt: hoursAgo(16),
      category: "client",
      categoryScore: 0.96,
      hasReply: true,
      repliedAt: hoursAgo(14),
      replyStatus: "sent",
      threadId: "th_012",
    },
    {
      id: "em_008",
      from: "aisha.patel@securenet.io",
      fromName: "Aisha Patel",
      subject: "URGENT: Threat detection SLA breach risk",
      body: "Mike,\n\nWe're seeing latency spikes on the threat detection pipeline — 2.4s avg vs our 800ms SLA. This is priority one for our SOC team. Can you jump on a call tonight?\n\nAisha",
      receivedAt: hoursAgo(0.2),
      category: "urgent",
      categoryScore: 0.98,
      hasReply: false,
      replyStatus: "none",
      threadId: "th_031",
    },
    {
      id: "em_009",
      from: "david.okafor@shopwave.com",
      fromName: "David Okafor",
      subject: "Personalization engine — pricing question",
      body: "Hi Mike,\n\nLooking at your personalization engine for ShopWave. Quick pricing question — do you do usage-based or flat monthly? We're at ~2M monthly active users.\n\nDavid",
      receivedAt: hoursAgo(20),
      category: "lead",
      categoryScore: 0.78,
      hasReply: false,
      replyStatus: "none",
      threadId: "th_046",
    },
    {
      id: "em_010",
      from: "mike@rodgersintelligence.com",
      fromName: "Mike Rodgers",
      subject: "Fwd: RIG OS Agency Q3 Strategy Doc",
      body: "Forwarding my Q3 strategy notes for review. Let's align on priorities before the team sync.\n\n[Attachment: RIG_OS_Q3_Strategy.pdf]",
      receivedAt: hoursAgo(24),
      category: "internal",
      categoryScore: 0.72,
      hasReply: false,
      replyStatus: "none",
      threadId: "th_001",
    },
  ];

  const unread = emails.filter((e) => !e.hasReply).length;
  const urgent = emails.filter((e) => e.category === "urgent").length;
  const needsReply = emails.filter((e) => e.replyStatus === "none" && e.category !== "internal").length;
  const byCategory: Record<string, number> = {};
  for (const e of emails) {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
  }

  return {
    _real: true,
    _source: "Python email_calendar_manager.py inbox --json (mock data pending backend)",
    emails,
    summary: { total: emails.length, unread, urgent, needsReply, byCategory },
  };
}

export async function GET() {
  const data = getMockInbox();
  return NextResponse.json(data);
}