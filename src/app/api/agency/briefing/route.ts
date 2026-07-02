import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/briefing — comprehensive daily briefing
export async function GET() {
  const briefing: any = {
    date: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    timestamp: new Date().toISOString(),
    sections: {},
  };

  const HOME = os.homedir();

  // 1. Overnight work — Obsidian recent
  try {
    const result = execSync(
      `${HOME}/.rig/bin/obsidian-memory-bridge recent --limit 12 2>/dev/null || true`,
      { timeout: 5000, encoding: "utf-8" }
    );
    briefing.sections.overnightWork = {
      title: "What Jake Worked On",
      icon: "moon",
      items: result.trim().split("\n").filter((l) => l.trim()).slice(0, 12),
    };
  } catch {
    briefing.sections.overnightWork = { title: "What Jake Worked On", icon: "moon", items: ["No vault activity recorded"] };
  }

  // 2. Dashboard KPIs — fetch from our own API
  try {
    const dashRes = await fetch(`http://127.0.0.1:3737/api/agency/dashboard`);
    const dash = await dashRes.json();
    const k = dash.kpis || {};
    briefing.sections.revenue = {
      title: "Revenue & ARR Goal",
      icon: "dollar",
      items: [
        `Current ARR: $${(k.currentARR || 0).toLocaleString()}`,
        `Target ARR: $${(k.targetARR || 0).toLocaleString()}`,
        `Gap to $10M: $${(k.arrGap || 0).toLocaleString()}`,
        `Current MRR: $${(k.currentMRR || 0).toLocaleString()}`,
        `Active Clients: ${k.activeClients || 0}`,
        `Pipeline Value: $${(k.pipelineValue || 0).toLocaleString()}`,
        `Pipeline Deals: ${k.pipelineCount || 0}`,
        `Avg Client Value: $${(k.avgClientValue || 0).toLocaleString()}`,
      ],
      kpis: k,
    };
  } catch {
    briefing.sections.revenue = { title: "Revenue & ARR Goal", icon: "dollar", items: ["Dashboard unavailable"] };
  }

  // 3. Clients
  try {
    const res = await fetch(`http://127.0.0.1:3737/api/agency/clients`);
    const data = await res.json();
    const clients = data.clients || [];
    briefing.sections.clients = {
      title: "Clients & Outreach",
      icon: "users",
      total: clients.length,
      items: clients.map((c: any) => ({
        name: c.name,
        vertical: c.vertical,
        status: c.status,
        health: c.health,
        tier: c.serviceTier,
        fee: c.monthlyFee,
      })),
    };
  } catch {
    briefing.sections.clients = { title: "Clients & Outreach", icon: "users", items: [] };
  }

  // 4. Contracts — July signing progress
  try {
    const res = await fetch(`http://127.0.0.1:3737/api/agency/contracts`);
    const data = await res.json();
    const contracts = data.contracts || [];
    const active = contracts.filter((c: any) => c.status === "active");
    const draft = contracts.filter((c: any) => c.status === "draft");
    briefing.sections.contracts = {
      title: "3 Signed Contracts for July",
      icon: "shield",
      items: [
        `Active: ${active.length} | Draft: ${draft.length} | Total: ${contracts.length}`,
        ...active.map((c: any) => `✅ ${c.clientName}: $${c.monthlyFee}/mo (${c.type})`),
        ...draft.map((c: any) => `⏳ ${c.clientName}: $${c.monthlyFee}/mo (draft — needs signature)`),
      ],
      progress: `${active.length} / 3 signed`,
    };
  } catch {
    briefing.sections.contracts = { title: "Contracts", icon: "shield", items: ["Unavailable"] };
  }

  // 5. Proposals
  try {
    const res = await fetch(`http://127.0.0.1:3737/api/agency/proposals`);
    const data = await res.json();
    const proposals = data.proposals || [];
    briefing.sections.proposals = {
      title: "Proposals Sent",
      icon: "file",
      items: proposals.map((p: any) => ({
        client: p.clientName,
        scope: p.scope,
        fee: p.monthlyFee,
        status: p.status,
      })),
    };
  } catch {
    briefing.sections.proposals = { title: "Proposals", icon: "file", items: [] };
  }

  // 6. Pipeline deals
  try {
    const res = await fetch(`http://127.0.0.1:3737/api/agency/pipeline`);
    const data = await res.json();
    const deals = data.deals || data.pipeline || [];
    briefing.sections.pipeline = {
      title: "Pipeline & Jobs Applied",
      icon: "trending",
      items: deals.map((d: any) => ({
        client: d.clientName || d.client_name,
        vertical: d.vertical,
        size: d.dealSize || d.deal_size,
        probability: d.probability,
        stage: d.stage,
      })),
    };
  } catch {
    briefing.sections.pipeline = { title: "Pipeline", icon: "trending", items: [] };
  }

  // 7. Fleet
  try {
    const res = await fetch(`http://127.0.0.1:3737/api/agency/fleet`);
    const data = await res.json();
    briefing.sections.fleet = {
      title: "Agent Fleet",
      icon: "cpu",
      total: data.stats?.total || 0,
      active: data.stats?.byStatus?.active || 0,
      byCategory: data.stats?.byCategory || {},
    };
  } catch {
    briefing.sections.fleet = { title: "Agent Fleet", icon: "cpu", total: 0 };
  }

  // 8. MCP health
  try {
    const res = await fetch(`http://127.0.0.1:3737/api/agency/mcp`);
    const data = await res.json();
    briefing.sections.mcp = {
      title: "MCP Server Health",
      icon: "zap",
      total: data.stats?.total || 0,
      connected: data.stats?.connected || 0,
      tools: data.stats?.totalTools || 0,
    };
  } catch {
    briefing.sections.mcp = { title: "MCP Health", icon: "zap", total: 0, connected: 0, tools: 0 };
  }

  // 9. Cron jobs
  try {
    const cronList = execSync(`crontab -l 2>/dev/null || echo ""`, { timeout: 3000, encoding: "utf-8" });
    const cronLines = cronList.trim().split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    briefing.sections.cron = {
      title: "Cron Jobs Running",
      icon: "clock",
      count: cronLines.length,
      items: cronLines.slice(0, 10),
    };
  } catch {
    briefing.sections.cron = { title: "Cron Jobs", icon: "clock", count: 0, items: [] };
  }

  // 10. Git builds — last 24h
  try {
    const gitLog = execSync(
      `cd ${HOME}/Developer/rig-os-agency && git log --oneline --since="1 day ago" 2>/dev/null || echo ""`,
      { timeout: 5000, encoding: "utf-8" }
    );
    briefing.sections.builds = {
      title: "Builds Completed (24h)",
      icon: "hammer",
      items: gitLog.trim().split("\n").filter((l) => l.trim()).slice(0, 10),
    };
  } catch {
    briefing.sections.builds = { title: "Builds", icon: "hammer", items: ["No builds in last 24h"] };
  }

  // 11. Obsidian vault stats
  try {
    const vaultPath = path.join(HOME, "Documents", "JakeStudio");
    const files = await fs.readdir(vaultPath);
    const mdFiles = files.filter((f) => f.endsWith(".md"));
    briefing.sections.vault = {
      title: "Obsidian Vault Activity",
      icon: "book",
      totalNotes: mdFiles.length,
      topFiles: mdFiles.slice(0, 5),
    };
  } catch {
    briefing.sections.vault = { title: "Vault", icon: "book", totalNotes: 0 };
  }

  // 12. Top 10 priorities (static — would be AI-generated in production)
  briefing.sections.priorities = {
    title: "Top 10 High-Impact Items Today",
    icon: "target",
    items: [
      "Follow up on 3 July contract signings — call each client",
      "Review and approve next 20 LinkedIn posts in queue",
      "Check TransformFit app build progress and push improvements",
      "Review 50 strategy teasers — optimize for conversion",
      "Audit GTM spend — identify 3 areas to reduce cost",
      "Scrape 200 new prospect profiles with strategy teasers",
      "Post Instagram content to drive follower engagement",
      "Review RodgersIntelligence SEO ranking — target page 1",
      "Send James the love test items for today",
      "Review overnight cron jobs and fix any failures",
    ],
  };

  // 13. Spend reduction
  briefing.sections.spend = {
    title: "Spend Reduction Opportunities",
    icon: "scissors",
    items: [
      "Cancel unused Firecrawl subscription (was cancelled Jun 16)",
      "Switch Gemini to free API tier (avoid Vertex billing)",
      "Consolidate Ollama models — remove duplicates (saves 18GB RAM)",
      "Audit API usage — identify APIs with zero calls this month",
    ],
  };

  // 14. Love test for James
  briefing.sections.loveTest = {
    title: "Love Test Items for James",
    icon: "heart",
    items: [
      "Send morning affirmation message",
      "Share daily progress photo from gym/TransformFit",
      "Schedule quality time reminder for evening",
      "Share one thing you're grateful for today",
    ],
  };

  // 15. LinkedIn / Instagram / SEO / TransformFit placeholders (pull from real data when available)
  briefing.sections.socialMedia = {
    title: "Social Media & Content",
    icon: "camera",
    items: [
      "LinkedIn: Next 20 posts queued in Postiz (Jul 7 → Jul 30)",
      "Instagram: Post TransformFit transformation content today",
      "SEO: Check RodgersIntelligence ranking for target keywords",
    ],
  };

  // 16. Data scraping
  briefing.sections.scraping = {
    title: "Data Scraping & Enrichment",
    icon: "database",
    items: [
      "Target: 200 new prospect profiles tonight",
      "5GB data budget on 36GB node",
      "Use Apify + Firecrawl for LinkedIn scraping",
      "Build strategy teasers for each new prospect",
    ],
  };

  // 17. Meta-harness capabilities
  briefing.sections.metaHarness = {
    title: "Meta-Harness Capabilities",
    icon: "layers",
    items: [
      "40 Deviation Engines loaded (Physics → Cognitive → Nature → RIG-L → Detonation)",
      "50 /goal loops available in Hermes",
      "84 primary coordinates in 3D lattice",
      "588 execution cells with IQRSQPI",
    ],
  };

  // 18. Voice greeting text
  briefing.voiceGreeting = `Good morning Mike. It's ${briefing.date}. I'm Jake, your RIG Agent. ` +
    `Current ARR is $${(briefing.sections.revenue?.kpis?.currentARR || 0).toLocaleString()}, ` +
    `with ${briefing.sections.clients?.total || 0} clients and ${briefing.sections.contracts?.progress || "0/3"} contracts signed. ` +
    `I've prepared your top 10 priorities for today. Let's make it a great day.`;

  return NextResponse.json(briefing);
}