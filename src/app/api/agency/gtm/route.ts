import { NextResponse } from "next/server";
import { GTM_COMPONENTS, GTM_PIPELINE_CONFIG, calculatePipelineMetrics, getGTMFunnelStages, getGTMHealthScore } from "@/lib/gtm-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/gtm — full GTM pipeline status
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "overview";

  if (action === "components") {
    return NextResponse.json({ components: GTM_COMPONENTS, total: GTM_COMPONENTS.length });
  }

  if (action === "config") {
    return NextResponse.json(GTM_PIPELINE_CONFIG);
  }

  // Default: overview with all metrics
  const sampleLeads = [
    { id: "L001", name: "Sarah Chen", title: "VP Engineering", company: "TechFlow SaaS", industry: "SaaS", painPoints: ["scaling infra", "cost optimization"], score: 87, stage: "proposal_sent", source: "LinkedIn", emailsSent: 3, emailsOpened: 3, emailsReplied: 2, meetingsBooked: 1, proposalsSent: 1, contractsSigned: 0, value: 48000 },
    { id: "L002", name: "Marcus Webb", title: "CTO", company: "FinEdge", industry: "FinTech", painPoints: ["compliance automation", "data pipeline"], score: 92, stage: "meeting_booked", source: "Referral", emailsSent: 2, emailsOpened: 2, emailsReplied: 2, meetingsBooked: 1, proposalsSent: 0, contractsSigned: 0, value: 78000 },
    { id: "L003", name: "Dr. Emily Rodriguez", title: "CMO", company: "HealthBridge", industry: "HealthTech", painPoints: ["patient data sync", "AI diagnostics"], score: 81, stage: "engaged", source: "Cold Email", emailsSent: 4, emailsOpened: 3, emailsReplied: 1, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 96000 },
    { id: "L004", name: "James Park", title: "Head Ops", company: "ShipRight", industry: "Logistics", painPoints: ["route optimization", "real-time tracking"], score: 76, stage: "contacted", source: "Apify", emailsSent: 2, emailsOpened: 1, emailsReplied: 0, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 62000 },
    { id: "L005", name: "Lisa Tran", title: "CEO", company: "EduScale", industry: "EdTech", painPoints: ["content generation", "student analytics"], score: 89, stage: "negotiation", source: "LinkedIn", emailsSent: 5, emailsOpened: 5, emailsReplied: 4, meetingsBooked: 2, proposalsSent: 1, contractsSigned: 0, value: 84000 },
    { id: "L006", name: "David Okafor", title: "VP Product", company: "ShopWave", industry: "E-commerce", painPoints: ["personalization engine", "cart abandonment"], score: 84, stage: "enriched", source: "Exa", emailsSent: 0, emailsOpened: 0, emailsReplied: 0, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 55000 },
    { id: "L007", name: "Rachel Kim", title: "Founder", company: "PropTech AI", industry: "Real Estate", painPoints: ["property valuation AI", "lead routing"], score: 79, stage: "prospect", source: "Apify", emailsSent: 0, emailsOpened: 0, emailsReplied: 0, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 42000 },
    { id: "L008", name: "Tom Anderson", title: "Dir Mfg", company: "ForgeWorks", industry: "Manufacturing", painPoints: ["predictive maintenance", "IoT data pipeline"], score: 85, stage: "closed_won", source: "Referral", emailsSent: 6, emailsOpened: 6, emailsReplied: 5, meetingsBooked: 3, proposalsSent: 2, contractsSigned: 1, value: 120000 },
    { id: "L009", name: "Aisha Patel", title: "CISO", company: "SecureNet", industry: "Cybersecurity", painPoints: ["threat detection", "automated response"], score: 91, stage: "meeting_booked", source: "Cold Email", emailsSent: 3, emailsOpened: 3, emailsReplied: 2, meetingsBooked: 1, proposalsSent: 0, contractsSigned: 0, value: 95000 },
    { id: "L010", name: "Michael Chang", title: "CTO", company: "NeuralScale", industry: "AI/ML", painPoints: ["model deployment", "MLOps pipeline"], score: 88, stage: "engaged", source: "LinkedIn", emailsSent: 4, emailsOpened: 4, emailsReplied: 2, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 88000 },
  ];

  const metrics = calculatePipelineMetrics(sampleLeads as any);
  const funnel = getGTMFunnelStages(sampleLeads as any);
  const health = getGTMHealthScore(metrics);

  return NextResponse.json({
    config: GTM_PIPELINE_CONFIG,
    metrics,
    funnel,
    health,
    components: GTM_COMPONENTS,
    leads: sampleLeads,
    totalLeads: sampleLeads.length,
    pipelineValue: metrics.pipelineValue,
    arrProgress: (GTM_PIPELINE_CONFIG.currentARR / GTM_PIPELINE_CONFIG.targetARR) * 100,
    pipelineProgress: (metrics.pipelineValue / GTM_PIPELINE_CONFIG.pipelineTarget) * 100,
  });
}