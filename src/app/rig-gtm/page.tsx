"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Target, Mail, Users, DollarSign, Activity,
  Zap, AlertCircle, CheckCircle2, Clock, ArrowRight,
} from "lucide-react";
import { GTM_COMPONENTS, GTM_PIPELINE_CONFIG, calculatePipelineMetrics, getGTMFunnelStages, getGTMHealthScore, type Lead } from "@/lib/gtm-pipeline";

const STAGE_COLORS: Record<string, string> = {
  prospect: "#4a9eff",
  enriched: "#5ab896",
  contacted: "#fbbf24",
  engaged: "#c084fc",
  meeting_booked: "#f97316",
  proposal_sent: "#ec4899",
  negotiation: "#8b5cf6",
  closed_won: "#10b981",
  closed_lost: "#ef4444",
  nurture: "#6b7280",
};

const SAMPLE_LEADS: Lead[] = [
  { id: "L001", name: "Sarah Chen", title: "VP Engineering", company: "TechFlow SaaS", industry: "SaaS", painPoints: ["scaling infra", "cost optimization"], score: 87, stage: "proposal_sent", source: "LinkedIn", emailsSent: 3, emailsOpened: 3, emailsReplied: 2, meetingsBooked: 1, proposalsSent: 1, contractsSigned: 0, value: 48000 },
  { id: "L002", name: "Marcus Webb", title: "CTO", company: "FinEdge", industry: "FinTech", painPoints: ["compliance automation", "data pipeline"], score: 92, stage: "meeting_booked", source: "Referral", emailsSent: 2, emailsOpened: 2, emailsReplied: 2, meetingsBooked: 1, proposalsSent: 0, contractsSigned: 0, value: 78000 },
  { id: "L003", name: "Dr. Emily Rodriguez", title: "Chief Medical Officer", company: "HealthBridge", industry: "HealthTech", painPoints: ["patient data sync", "AI diagnostics"], score: 81, stage: "engaged", source: "Cold Email", emailsSent: 4, emailsOpened: 3, emailsReplied: 1, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 96000 },
  { id: "L004", name: "James Park", title: "Head of Operations", company: "ShipRight Logistics", industry: "Logistics", painPoints: ["route optimization", "real-time tracking"], score: 76, stage: "contacted", source: "Apify Scrape", emailsSent: 2, emailsOpened: 1, emailsReplied: 0, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 62000 },
  { id: "L005", name: "Lisa Tran", title: "CEO", company: "EduScale", industry: "EdTech", painPoints: ["content generation", "student analytics"], score: 89, stage: "negotiation", source: "LinkedIn", emailsSent: 5, emailsOpened: 5, emailsReplied: 4, meetingsBooked: 2, proposalsSent: 1, contractsSigned: 0, value: 84000 },
  { id: "L006", name: "David Okafor", title: "VP Product", company: "ShopWave", industry: "E-commerce", painPoints: ["personalization engine", "cart abandonment"], score: 84, stage: "enriched", source: "Exa Search", emailsSent: 0, emailsOpened: 0, emailsReplied: 0, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 55000 },
  { id: "L007", name: "Rachel Kim", title: "Founder", company: "PropTech AI", industry: "Real Estate", painPoints: ["property valuation AI", "lead routing"], score: 79, stage: "prospect", source: "Apify Scrape", emailsSent: 0, emailsOpened: 0, emailsReplied: 0, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 42000 },
  { id: "L008", name: "Tom Anderson", title: "Director of Manufacturing", company: "ForgeWorks", industry: "Manufacturing", painPoints: ["predictive maintenance", "IoT data pipeline"], score: 85, stage: "closed_won", source: "Referral", emailsSent: 6, emailsOpened: 6, emailsReplied: 5, meetingsBooked: 3, proposalsSent: 2, contractsSigned: 1, value: 120000 },
  { id: "L009", name: "Aisha Patel", title: "CISO", company: "SecureNet", industry: "Cybersecurity", painPoints: ["threat detection", "automated response"], score: 91, stage: "meeting_booked", source: "Cold Email", emailsSent: 3, emailsOpened: 3, emailsReplied: 2, meetingsBooked: 1, proposalsSent: 0, contractsSigned: 0, value: 95000 },
  { id: "L010", name: "Michael Chang", title: "CTO", company: "NeuralScale", industry: "AI/ML", painPoints: ["model deployment", "MLOps pipeline"], score: 88, stage: "engaged", source: "LinkedIn", emailsSent: 4, emailsOpened: 4, emailsReplied: 2, meetingsBooked: 0, proposalsSent: 0, contractsSigned: 0, value: 88000 },
];

export default function GTMPipelinePage() {
  const [leads] = useState<Lead[]>(SAMPLE_LEADS);
  const [activeTab, setActiveTab] = useState<"funnel" | "components" | "leads" | "health">("funnel");

  const metrics = calculatePipelineMetrics(leads);
  const funnel = getGTMFunnelStages(leads);
  const health = getGTMHealthScore(metrics);

  const arrProgress = (GTM_PIPELINE_CONFIG.currentARR / GTM_PIPELINE_CONFIG.targetARR) * 100;
  const pipelineProgress = (metrics.pipelineValue / GTM_PIPELINE_CONFIG.pipelineTarget) * 100;

  return (
    <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="eyebrow mb-4">
          <span className="num">XIII.</span>
          <span className="line" />
          <span className="label">GTM Pipeline</span>
        </div>
        <h1 className="page-title">Production GTM Pipeline</h1>
        <p className="page-subtitle">8-component system targeting $10M ARR — lead scoring, cold email, follow-up cascade, proposals, competitor audit, forecasting.</p>
      </header>

      {/* ARR Progress */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-widest opacity-50 mb-2">Current ARR</div>
          <div className="text-2xl font-bold" style={{ color: "var(--gold)" }}>
            ${GTM_PIPELINE_CONFIG.currentARR.toLocaleString()}
          </div>
          <div className="text-xs opacity-60 mt-1">of $10M target ({arrProgress.toFixed(1)}%)</div>
          <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${arrProgress}%`, background: "linear-gradient(90deg, #d4a574, #5ab896)" }} />
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-widest opacity-50 mb-2">Pipeline Value</div>
          <div className="text-2xl font-bold" style={{ color: "var(--emerald)" }}>
            ${metrics.pipelineValue.toLocaleString()}
          </div>
          <div className="text-xs opacity-60 mt-1">{pipelineProgress.toFixed(1)}% of $2M target</div>
          <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(pipelineProgress, 100)}%`, background: "linear-gradient(90deg, #5ab896, #4a9eff)" }} />
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-widest opacity-50 mb-2">Health Score</div>
          <div className="text-2xl font-bold" style={{ color: health.score >= 80 ? "#10b981" : health.score >= 50 ? "#fbbf24" : "#ef4444" }}>
            {health.score}/100
          </div>
          <div className="text-xs opacity-60 mt-1">{health.status}</div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full" style={{
                background: i < health.score / 10 ? (health.score >= 80 ? "#10b981" : health.score >= 50 ? "#fbbf24" : "#ef4444") : "rgba(255,255,255,0.05)",
              }} />
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-widest opacity-50 mb-2">Active Components</div>
          <div className="text-2xl font-bold" style={{ color: "var(--cream)" }}>
            {GTM_COMPONENTS.filter(c => c.status === "active").length}/{GTM_COMPONENTS.length}
          </div>
          <div className="text-xs opacity-60 mt-1">8 GTM loops running</div>
          <div className="flex gap-1 mt-2">
            {GTM_COMPONENTS.map(c => (
              <div key={c.id} className="w-2 h-2 rounded-full" style={{
                background: c.status === "active" ? "#10b981" : "#6b7280",
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/5">
        {[
          { id: "funnel", label: "Funnel", icon: Activity },
          { id: "components", label: "Components", icon: Zap },
          { id: "leads", label: "Leads", icon: Users },
          { id: "health", label: "Health", icon: CheckCircle2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              activeTab === tab.id ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent opacity-50 hover:opacity-80"
            }`}
          >
            <tab.icon className="w-4 h-4 inline mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Funnel Tab */}
      {activeTab === "funnel" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Chart */}
            <div className="panel p-6">
              <h3 className="text-sm uppercase tracking-widest opacity-50 mb-4">Conversion Funnel</h3>
              <div className="space-y-3">
                {funnel.map((stage, i) => {
                  const maxCount = funnel[0].count || 1;
                  const width = (stage.count / maxCount) * 100;
                  const conversion = i > 0 && funnel[i - 1].count > 0
                    ? ((stage.count / funnel[i - 1].count) * 100).toFixed(0)
                    : "100";
                  return (
                    <div key={stage.stage}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{stage.stage}</span>
                        <span className="opacity-60">{stage.count} ({conversion}%)</span>
                      </div>
                      <div className="h-7 rounded-md flex items-center px-3 text-xs font-medium" style={{
                        width: `${Math.max(width, 15)}%`,
                        background: `${stage.color}22`,
                        border: `1px solid ${stage.color}44`,
                        color: stage.color,
                      }}>
                        {stage.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="panel p-6">
              <h3 className="text-sm uppercase tracking-widest opacity-50 mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Leads", value: metrics.totalLeads, icon: Users, color: "#4a9eff" },
                  { label: "Reply Rate", value: `${metrics.replyRate.toFixed(1)}%`, icon: Mail, color: "#fbbf24" },
                  { label: "Conversion", value: `${metrics.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "#10b981" },
                  { label: "Avg Deal Size", value: `$${metrics.avgDealSize.toLocaleString()}`, icon: DollarSign, color: "#d4a574" },
                  { label: "AntiGeneric", value: metrics.antiGenericScore, icon: Target, color: "#c084fc" },
                  { label: "Email Open Rate", value: `${metrics.emailSuccessRate.toFixed(1)}%`, icon: Activity, color: "#5ab896" },
                ].map(metric => (
                  <div key={metric.label} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <metric.icon className="w-4 h-4 mb-1" style={{ color: metric.color }} />
                    <div className="text-xs opacity-50">{metric.label}</div>
                    <div className="text-lg font-semibold" style={{ color: "var(--cream)" }}>{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vertical Breakdown */}
          <div className="panel p-6 mt-6">
            <h3 className="text-sm uppercase tracking-widest opacity-50 mb-4">By Vertical</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {GTM_PIPELINE_CONFIG.verticals.map(vertical => {
                const vLeads = leads.filter(l => l.industry === vertical);
                const vValue = vLeads.reduce((s, l) => s + l.value, 0);
                return (
                  <div key={vertical} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="text-xs opacity-50">{vertical}</div>
                    <div className="text-lg font-semibold" style={{ color: "var(--cream)" }}>{vLeads.length}</div>
                    <div className="text-xs opacity-40">${(vValue / 1000).toFixed(0)}K</div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Components Tab */}
      {activeTab === "components" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GTM_COMPONENTS.map(comp => (
              <div key={comp.id} className="panel p-5 hover:border-[var(--panel-border-hot)] transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono opacity-40">#{comp.loopNumber}</span>
                      <h3 className="font-semibold" style={{ color: "var(--cream)" }}>{comp.name}</h3>
                    </div>
                    <div className="text-xs opacity-50 mt-1">{comp.group} · {comp.anchor}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{
                      background: comp.status === "active" ? "#10b981" : "#6b7280",
                    }} />
                    <span className="text-xs opacity-50">{comp.status}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-50">Gate</span>
                    <span className="font-mono" style={{ color: "var(--gold)" }}>{comp.gate}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-50">Emits</span>
                    <span className="font-mono" style={{ color: "var(--emerald)" }}>{comp.emits}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Leads Tab */}
      {activeTab === "leads" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider opacity-50">
                  <th className="text-left py-3 px-4">Lead</th>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Industry</th>
                  <th className="text-left py-3 px-4">Score</th>
                  <th className="text-left py-3 px-4">Stage</th>
                  <th className="text-right py-3 px-4">Value</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4">
                      <div className="font-medium" style={{ color: "var(--cream)" }}>{lead.name}</div>
                      <div className="text-xs opacity-50">{lead.title}</div>
                    </td>
                    <td className="py-3 px-4 opacity-70">{lead.company}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded" style={{
                        background: "rgba(255,255,255,0.05)",
                      }}>{lead.industry}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono" style={{
                        color: lead.score >= 85 ? "#10b981" : lead.score >= 75 ? "#fbbf24" : "#ef4444",
                      }}>{lead.score}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded" style={{
                        background: `${STAGE_COLORS[lead.stage] || "#6b7280"}22`,
                        color: STAGE_COLORS[lead.stage] || "#6b7280",
                      }}>{lead.stage.replace(/_/g, " ")}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono" style={{ color: "var(--gold)" }}>
                      ${lead.value.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Health Tab */}
      {activeTab === "health" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="panel p-6">
            <div className="flex items-center gap-3 mb-6">
              {health.score >= 80 ? (
                <CheckCircle2 className="w-8 h-8" style={{ color: "#10b981" }} />
              ) : health.score >= 50 ? (
                <AlertCircle className="w-8 h-8" style={{ color: "#fbbf24" }} />
              ) : (
                <AlertCircle className="w-8 h-8" style={{ color: "#ef4444" }} />
              )}
              <div>
                <h3 className="text-xl font-bold" style={{ color: "var(--cream)" }}>
                  GTM Health: {health.status}
                </h3>
                <p className="text-sm opacity-50">Score: {health.score}/100</p>
              </div>
            </div>

            {health.issues.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm uppercase tracking-widest opacity-50">Issues</h4>
                {health.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.1)",
                  }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                    <span className="text-sm opacity-80">{issue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg flex items-center gap-3" style={{
                background: "rgba(16,185,129,0.05)",
                border: "1px solid rgba(16,185,129,0.1)",
              }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: "#10b981" }} />
                <span className="text-sm">All GTM components healthy — no issues detected.</span>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <h4 className="text-sm uppercase tracking-widest opacity-50">Pipeline Config</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-2 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="opacity-50">Target ARR</span>
                  <span className="font-mono" style={{ color: "var(--gold)" }}>${GTM_PIPELINE_CONFIG.targetARR.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="opacity-50">Profiles/Night</span>
                  <span className="font-mono">{GTM_PIPELINE_CONFIG.profilesPerNight}</span>
                </div>
                <div className="flex justify-between p-2 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="opacity-50">AntiGeneric ≥</span>
                  <span className="font-mono" style={{ color: "var(--emerald)" }}>{GTM_PIPELINE_CONFIG.antiGenericThreshold}</span>
                </div>
                <div className="flex justify-between p-2 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="opacity-50">Email Success ≥</span>
                  <span className="font-mono" style={{ color: "var(--emerald)" }}>{GTM_PIPELINE_CONFIG.emailSuccessThreshold}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}