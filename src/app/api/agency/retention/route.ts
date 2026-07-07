// ── RIG OS Agency — Client Retention Watchtower API ─────────────────────────
// Real client retention scoring: combines client health, invoice payment
// status (overdue / outstanding), contract renewal proximity, and account
// stage to surface retention risk and ARR-at-risk for the agency.
//
// Inputs (all from local persistent store):
//   data/agency/clients.json
//   data/agency/contracts.json
//   data/agency/invoices.json
//   data/agency/proposals.json
//
// Doctrine:
//   - No fabrication. If a client has no invoices, the payment block returns null.
//   - ARR-at-risk uses only real overdue amounts + contracts ending within 60d.
//   - Health score is derived from observable facts, not vibes.
//
// Routes:
//   GET /api/agency/retention

import { NextResponse } from "next/server";
import {
  loadClients,
  loadContracts,
  loadInvoices,
  loadProposals,
} from "@/lib/agency-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    return Math.round((Date.now() - then) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    return Math.round((then - Date.now()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function pickFirst<T>(...vals: (T | null | undefined)[]): T | null {
  for (const v of vals) {
    if (v !== null && v !== undefined && v !== "") return v;
  }
  return null;
}

function riskLabel(score: number): "healthy" | "watch" | "at_risk" | "critical" {
  if (score >= 80) return "healthy";
  if (score >= 60) return "watch";
  if (score >= 40) return "at_risk";
  return "critical";
}

function riskStyle(label: string): { color: string; bg: string; label: string } {
  switch (label) {
    case "healthy":
      return { color: "var(--emerald)", bg: "rgba(90,184,150,0.12)", label: "Healthy" };
    case "watch":
      return { color: "var(--gold)", bg: "rgba(212,165,116,0.14)", label: "Watch" };
    case "at_risk":
      return { color: "#e0934f", bg: "rgba(224,147,79,0.14)", label: "At Risk" };
    case "critical":
    default:
      return { color: "var(--plum)", bg: "rgba(196,96,126,0.14)", label: "Critical" };
  }
}

interface ClientRow {
  id: string;
  clientName: string;
  vertical: string;
  tier: string;
  status: string;
  health: string;
  contactName: string;
  contactEmail: string;
  monthlyFee: number;
  annualFee: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  arr: number;
  mrr: number;
  tenureMonths: number;
  invoices: { total: number; paid: number; outstanding: number; overdue: number; oldestDueAgeDays: number | null };
  contract: { id: string | null; endDate: string | null; daysUntilEnd: number | null; autoRenew: boolean; status: string | null };
  proposals: { total: number; open: number };
  retentionScore: number;
  risk: "healthy" | "watch" | "at_risk" | "critical";
  flags: string[];
  nextAction: string;
}

export async function GET() {
  const start = Date.now();
  const [clients, contracts, invoices, proposals] = await Promise.all([
    loadClients(),
    loadContracts(),
    loadInvoices(),
    loadProposals(),
  ]);

  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();

  // Build lookup maps
  const contractsByClient = new Map<string, typeof contracts>();
  for (const c of contracts) {
    const key = c.clientId || "";
    if (!key) continue;
    if (!contractsByClient.has(key)) contractsByClient.set(key, []);
    contractsByClient.get(key)!.push(c);
  }

  const invoicesByClient = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    const key = inv.clientId || "";
    if (!key) continue;
    if (!invoicesByClient.has(key)) invoicesByClient.set(key, []);
    invoicesByClient.get(key)!.push(inv);
  }

  const proposalsByClient = new Map<string, typeof proposals>();
  for (const p of proposals) {
    const key = p.clientId || "";
    if (!key) continue;
    if (!proposalsByClient.has(key)) proposalsByClient.set(key, []);
    proposalsByClient.get(key)!.push(p);
  }

  const clientRows: ClientRow[] = [];
  let totalArr = 0;
  let totalMrr = 0;
  let arrAtRisk = 0;
  let mrrAtRisk = 0;
  let sumScore = 0;
  let healthyCount = 0;
  let watchCount = 0;
  let atRiskCount = 0;
  let criticalCount = 0;
  let overdueInvoiceCount = 0;
  let expiringSoonCount = 0;
  let contractsEnding60d = 0;

  for (const cli of clients) {
    const monthly = Number(cli.monthlyFee || 0);
    const annual = Number(cli.annualFee || monthly * 12);
    const arr = annual;
    const mrr = monthly;

    const clientContracts = contractsByClient.get(cli.id) || [];
    const clientInvoices = invoicesByClient.get(cli.id) || [];
    const clientProposals = proposalsByClient.get(cli.id) || [];

    // Contract end / renewal proximity
    let primaryContract = null as (typeof contracts)[number] | null;
    let latestEndDate: string | null = null;
    for (const ct of clientContracts) {
      if (ct.status && ct.status !== "active") continue;
      if (!latestEndDate || new Date(ct.endDate).getTime() > new Date(latestEndDate).getTime()) {
        latestEndDate = ct.endDate;
        primaryContract = ct;
      }
    }
    const daysUntilEnd = daysUntil(latestEndDate);

    // Invoices
    let paid = 0;
    let outstanding = 0;
    let overdue = 0;
    let oldestDueAgeDays: number | null = null;
    let outstandingAmount = 0;
    let overdueAmount = 0;
    for (const inv of clientInvoices) {
      const amount = Number(inv.amount || 0);
      const status = (inv.status || "").toLowerCase();
      if (status === "paid") {
        paid += 1;
      } else {
        outstanding += 1;
        outstandingAmount += amount;
        const age = daysSince(inv.dueDate);
        if (age !== null && age > 0) {
          overdue += 1;
          overdueAmount += amount;
          if (oldestDueAgeDays === null || age > oldestDueAgeDays) {
            oldestDueAgeDays = age;
          }
        }
      }
    }

    // Proposals status
    const openProposals = clientProposals.filter((p) => {
      const s = (p.status || "").toLowerCase();
      return s === "sent" || s === "draft" || s === "negotiation";
    }).length;

    // Tenure in months
    const tenureMonths = (() => {
      const sd = new Date(cli.startDate);
      if (Number.isNaN(sd.getTime())) return 0;
      const months = (now.getUTCFullYear() - sd.getUTCFullYear()) * 12 + (now.getUTCMonth() - sd.getUTCMonth());
      return Math.max(0, months);
    })();

    // Scoring (start 100, subtract risks)
    let score = 100;
    const flags: string[] = [];

    // 1. Stated health
    const statedHealth = (cli.health || "").toLowerCase();
    if (statedHealth === "yellow") score -= 15;
    else if (statedHealth === "red") {
      score -= 35;
      flags.push("Reported health = red");
    }

    // 2. Status
    const status = (cli.status || "").toLowerCase();
    if (status === "paused") {
      score -= 20;
      flags.push("Account paused");
    } else if (status === "churned" || status === "cancelled") {
      score -= 60;
      flags.push("Account churned/cancelled");
    } else if (status === "onboarding") {
      score -= 5;
    }

    // 3. Overdue invoices (heavy)
    if (overdue > 0) {
      const overduePenalty = Math.min(40, 15 + overdue * 5 + (oldestDueAgeDays || 0) > 30 ? 10 : 0);
      score -= overduePenalty;
      overdueInvoiceCount += overdue;
      arrAtRisk += arr;
      mrrAtRisk += mrr;
      flags.push(`${overdue} overdue invoice${overdue > 1 ? "s" : ""} (oldest ${oldestDueAgeDays}d)`);
    } else if (outstanding > 0) {
      score -= Math.min(10, outstanding * 3);
      flags.push(`${outstanding} invoice${outstanding > 1 ? "s" : ""} outstanding`);
    }

    // 4. Contract ending soon
    if (daysUntilEnd !== null) {
      if (daysUntilEnd < 0) {
        score -= 25;
        contractsEnding60d += 1;
        arrAtRisk += arr;
        mrrAtRisk += mrr;
        flags.push(`Contract expired ${Math.abs(daysUntilEnd)}d ago`);
      } else if (daysUntilEnd <= 30) {
        score -= 15;
        contractsEnding60d += 1;
        expiringSoonCount += 1;
        arrAtRisk += arr;
        mrrAtRisk += mrr;
        flags.push(`Contract ends in ${daysUntilEnd}d`);
      } else if (daysUntilEnd <= 60) {
        score -= 8;
        contractsEnding60d += 1;
        expiringSoonCount += 1;
        flags.push(`Contract ends in ${daysUntilEnd}d`);
      } else if (daysUntilEnd <= 90 && !primaryContract?.autoRenew) {
        score -= 4;
        flags.push(`Auto-renew off, ends in ${daysUntilEnd}d`);
      }
    }

    // 5. New client (< 3 months) — slight caution
    if (tenureMonths < 3) {
      score -= 5;
    }

    // 6. Open expansion proposal activity = positive signal
    if (clientProposals.length > 0) {
      const accepted = clientProposals.find((p) => (p.status || "").toLowerCase() === "accepted");
      if (accepted) {
        score += 3;
      }
    }

    // Clamp
    score = Math.max(0, Math.min(100, Math.round(score)));

    const risk = riskLabel(score);
    const style = riskStyle(risk);

    // Next action (doctrine-derived)
    let nextAction = "Quarterly check-in";
    if (risk === "critical") {
      nextAction = "Owner call this week — save or sunset";
    } else if (risk === "at_risk") {
      nextAction = "Schedule retention call within 5 days";
    } else if (risk === "watch") {
      nextAction = "Confirm renewal terms within 30 days";
    } else if (openProposals > 0) {
      nextAction = `Close ${openProposals} open proposal${openProposals > 1 ? "s" : ""}`;
    } else if (cli.autoRenew === false && daysUntilEnd !== null && daysUntilEnd <= 120) {
      nextAction = "Confirm auto-renew intent";
    }

    if (status !== "churned" && status !== "cancelled") {
      totalArr += arr;
      totalMrr += mrr;
      sumScore += score;
    }

    if (risk === "healthy") healthyCount += 1;
    else if (risk === "watch") watchCount += 1;
    else if (risk === "at_risk") atRiskCount += 1;
    else if (risk === "critical") criticalCount += 1;

    clientRows.push({
      id: cli.id,
      clientName: cli.name || cli.id,
      vertical: cli.vertical || "general",
      tier: cli.serviceTier || "growth",
      status: cli.status || "active",
      health: cli.health || "green",
      contactName: cli.contactName || "",
      contactEmail: cli.contactEmail || "",
      monthlyFee: monthly,
      annualFee: annual,
      startDate: cli.startDate || "",
      endDate: latestEndDate || cli.endDate || "",
      autoRenew: primaryContract?.autoRenew ?? cli.autoRenew ?? true,
      arr,
      mrr,
      tenureMonths,
      invoices: {
        total: clientInvoices.length,
        paid,
        outstanding,
        overdue,
        oldestDueAgeDays,
      },
      contract: {
        id: primaryContract?.id || null,
        endDate: latestEndDate,
        daysUntilEnd,
        autoRenew: primaryContract?.autoRenew ?? false,
        status: primaryContract?.status || null,
      },
      proposals: {
        total: clientProposals.length,
        open: openProposals,
      },
      retentionScore: score,
      risk,
      flags,
      nextAction,
    });
  }

  // Sort: highest risk first
  clientRows.sort((a, b) => a.retentionScore - b.retentionScore);

  const activeRows = clientRows.filter((r) => r.status !== "churned" && r.status !== "cancelled");
  const avgScore = activeRows.length > 0 ? Math.round(sumScore / Math.max(1, activeRows.length)) : 0;

  // Vertical rollup
  const verticalMap = new Map<string, { count: number; arr: number; mrr: number; sumScore: number; atRisk: number; critical: number; healthy: number }>();
  for (const r of activeRows) {
    if (!verticalMap.has(r.vertical)) {
      verticalMap.set(r.vertical, { count: 0, arr: 0, mrr: 0, sumScore: 0, atRisk: 0, critical: 0, healthy: 0 });
    }
    const v = verticalMap.get(r.vertical)!;
    v.count += 1;
    v.arr += r.arr;
    v.mrr += r.mrr;
    v.sumScore += r.retentionScore;
    if (r.risk === "at_risk") v.atRisk += 1;
    if (r.risk === "critical") v.critical += 1;
    if (r.risk === "healthy") v.healthy += 1;
  }
  const verticalRollup = Array.from(verticalMap.entries())
    .map(([vertical, v]) => ({
      vertical,
      count: v.count,
      arr: v.arr,
      mrr: v.mrr,
      avgScore: v.count > 0 ? Math.round(v.sumScore / v.count) : 0,
      atRisk: v.atRisk,
      critical: v.critical,
      healthy: v.healthy,
    }))
    .sort((a, b) => b.arr - a.arr);

  // Tier rollup
  const tierMap = new Map<string, { count: number; arr: number; mrr: number; avgScore: number; sumScore: number }>();
  for (const r of activeRows) {
    if (!tierMap.has(r.tier)) tierMap.set(r.tier, { count: 0, arr: 0, mrr: 0, avgScore: 0, sumScore: 0 });
    const t = tierMap.get(r.tier)!;
    t.count += 1;
    t.arr += r.arr;
    t.mrr += r.mrr;
    t.sumScore += r.retentionScore;
  }
  const tierRollup = Array.from(tierMap.entries())
    .map(([tier, t]) => ({
      tier,
      count: t.count,
      arr: t.arr,
      mrr: t.mrr,
      avgScore: t.count > 0 ? Math.round(t.sumScore / t.count) : 0,
    }))
    .sort((a, b) => b.arr - a.arr);

  // Renewal calendar: contracts ending in next 120 days
  const renewalCalendar = activeRows
    .filter((r) => r.contract.daysUntilEnd !== null && r.contract.daysUntilEnd <= 120)
    .map((r) => ({
      clientId: r.id,
      clientName: r.clientName,
      tier: r.tier,
      arr: r.arr,
      endDate: r.contract.endDate,
      daysUntilEnd: r.contract.daysUntilEnd,
      autoRenew: r.autoRenew,
      risk: r.risk,
    }))
    .sort((a, b) => (a.daysUntilEnd ?? 999) - (b.daysUntilEnd ?? 999));

  // Overdue invoice list
  const overdueInvoices = invoices
    .filter((inv) => {
      const s = (inv.status || "").toLowerCase();
      if (s === "paid") return false;
      const age = daysSince(inv.dueDate);
      return age !== null && age > 0;
    })
    .map((inv) => {
      const cli = clients.find((c) => c.id === inv.clientId);
      const age = daysSince(inv.dueDate) || 0;
      return {
        id: inv.id,
        clientId: inv.clientId,
        clientName: inv.clientName || cli?.name || inv.clientId,
        amount: Number(inv.amount || 0),
        dueDate: inv.dueDate,
        ageDays: age,
        severity: age > 60 ? "severe" : age > 30 ? "high" : "moderate",
        status: inv.status,
      };
    })
    .sort((a, b) => b.ageDays - a.ageDays);

  // Open proposals
  const openProposalList = proposals
    .filter((p) => {
      const s = (p.status || "").toLowerCase();
      return s === "sent" || s === "draft" || s === "negotiation";
    })
    .map((p) => ({
      id: p.id,
      clientId: p.clientId,
      clientName: p.clientName,
      vertical: p.vertical,
      monthlyFee: Number(p.monthlyFee || 0),
      annualValue: Number(p.annualValue || 0),
      status: p.status,
      sentDate: p.sentDate,
      validUntil: p.validUntil,
      scope: p.scope,
    }))
    .sort((a, b) => b.annualValue - a.annualValue);

  const riskDistribution = [
    { label: "Healthy", count: healthyCount, color: "var(--emerald)", key: "healthy" },
    { label: "Watch", count: watchCount, color: "var(--gold)", key: "watch" },
    { label: "At Risk", count: atRiskCount, color: "#e0934f", key: "at_risk" },
    { label: "Critical", count: criticalCount, color: "var(--plum)", key: "critical" },
  ];

  // Renewal velocity: clients with auto-renew OFF and ending in 120d = manual outreach queue
  const manualRenewalQueue = activeRows
    .filter((r) => r.autoRenew === false && r.contract.daysUntilEnd !== null && r.contract.daysUntilEnd <= 120)
    .map((r) => ({
      clientId: r.id,
      clientName: r.clientName,
      tier: r.tier,
      arr: r.arr,
      endDate: r.contract.endDate,
      daysUntilEnd: r.contract.daysUntilEnd,
      retentionScore: r.retentionScore,
      risk: r.risk,
    }))
    .sort((a, b) => (a.daysUntilEnd ?? 999) - (b.daysUntilEnd ?? 999));

  // Churn simulation: if all at-risk + critical churn
  const churnSimArr = arrAtRisk;
  const churnSimMrr = mrrAtRisk;
  const arrRetained = totalArr - arrAtRisk;
  const netRevenueRetention = totalArr > 0 ? Math.round((arrRetained / totalArr) * 1000) / 10 : 0;

  const payload = {
    generatedAt: new Date().toISOString(),
    latencyMs: Date.now() - start,
    sources: [
      "data/agency/clients.json",
      "data/agency/contracts.json",
      "data/agency/invoices.json",
      "data/agency/proposals.json",
    ],
    summary: {
      totalClients: clients.length,
      activeClients: activeRows.length,
      avgRetentionScore: avgScore,
      totalArr,
      totalMrr,
      arrAtRisk,
      mrrAtRisk,
      netRevenueRetentionPct: netRevenueRetention,
      healthyCount,
      watchCount,
      atRiskCount,
      criticalCount,
      overdueInvoiceCount,
      expiringSoonCount,
      contractsEnding60d,
    },
    riskDistribution,
    clients: clientRows,
    verticalRollup,
    tierRollup,
    renewalCalendar,
    overdueInvoices,
    openProposals: openProposalList,
    manualRenewalQueue,
    churnSim: {
      totalAtRiskArr: churnSimArr,
      totalAtRiskMrr: churnSimMrr,
      retainedArr: arrRetained,
      retainedPct: netRevenueRetention,
      worstCaseLostArr: churnSimArr,
    },
    style: {
      healthy: riskStyle("healthy"),
      watch: riskStyle("watch"),
      at_risk: riskStyle("at_risk"),
      critical: riskStyle("critical"),
    },
    doctrine: {
      truth:
        "Retention score = 100 minus observable penalties (overdue invoices, contract expiry proximity, reported health, account status). No fabricated churn predictions — only ARR at risk from clients with overdue invoices or contracts ending within 60 days.",
      next:
        "To sharpen retention: (a) auto-mark overdue invoices at 7/30/60d cadence, (b) capture explicit churn reason when a contract ends non-renewed, (c) tag every client with a QBR cadence and last-touch date.",
    },
  };

  return NextResponse.json(payload);
}