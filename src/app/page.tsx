"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, Users, DollarSign, Shield, Boxes, Target, Server,
  Command, Layers, Activity, Zap, TrendingUp, Rocket, Briefcase,
  ArrowUpRight, Cpu, GitBranch, Gauge, TrendingDown, BarChart3,
  CreditCard,
} from "lucide-react";
import LiveCommandBar from "@/components/LiveCommandBar";
import BriefingCard from "@/components/BriefingCard";
import QuickActions from "@/components/QuickActions";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function CommandCenter() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--gold)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            Rodgers Intelligence Group
          </span>
        </div>
        <h1
          className="text-4xl md:text-5xl tracking-tight mb-3"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}
        >
          RIG OS <span className="hand text-[1.2em]" style={{ color: "var(--gold)" }}>Agency</span>
        </h1>
        <p className="text-[15px] leading-relaxed max-w-2xl" style={{ color: "var(--cream-dim)" }}>
          Operator-grade strategic intelligence platform. 232 agency agents, 40 deviation engines,
          50 goal loops, 15 MCPs. Deterministic-before-agentic. ProofPacket or it didn&apos;t happen.
          Target: <span style={{ color: "var(--gold)", fontWeight: 600 }}>$10M ARR</span>.
        </p>
      </motion.section>

      {/* Live Command Bar — real-time system data */}
      <LiveCommandBar />

      {/* Daily Briefing Card — priorities, revenue, overnight work */}
      <BriefingCard />

      {/* Quick Actions — one-click navigation */}
      <QuickActions />

      {/* KPI Row */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Target ARR", value: "$10M", sub: "by Q4 2027", icon: <DollarSign size={18} />, accent: "var(--gold)" },
            { label: "Agency Agents", value: "232", sub: "across 8 verticals", icon: <Boxes size={18} />, accent: "var(--plum)" },
            { label: "Deviation Engines", value: "40", sub: "±30σ scoring", icon: <Layers size={18} />, accent: "var(--emerald)" },
            { label: "MCP Servers", value: "15", sub: "wired & ready", icon: <Server size={18} />, accent: "#22d3ee" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-4 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
                  {kpi.label}
                </span>
              </div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
                {kpi.value}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--cream-mute)" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Agency Operations */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>I.</span> Agency Operations
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: "/agency", title: "Agency Dashboard", desc: "Revenue, clients, pipeline, and ARR tracker.", icon: <Building2 size={18} />, accent: "#d4a574" },
            { href: "/agency/offerings", title: "Offerings & Engagement", desc: "Three doors, ten ways to engage, eight verticals. RIG offerings from rodgersintelligence.com.", icon: <Rocket size={18} />, accent: "#d4a574" },
            { href: "/agency/clients", title: "Client Management", desc: "8 verticals, service tiers, health scores, contracts.", icon: <Users size={18} />, accent: "#5ab896" },
            { href: "/agency/pipeline", title: "Sales Pipeline", desc: "Kanban: prospect → qualified → proposal → closed.", icon: <TrendingUp size={18} />, accent: "#5ab896" },
            { href: "/agency/revenue", title: "Revenue Dashboard", desc: "ARR trajectory, MRR growth, churn, cash flow.", icon: <DollarSign size={18} />, accent: "#d4a574" },
            { href: "/agency/proposals", title: "Proposals", desc: "Generate, track, and approve client proposals.", icon: <Briefcase size={18} />, accent: "#c4607e" },
            { href: "/agency/contracts", title: "Contracts & Invoices", desc: "Manage engagements, billing, and renewals.", icon: <Shield size={18} />, accent: "#c4607e" },
            { href: "/agency/spend", title: "Spend Reduction", desc: "Service costs, optimization opportunities, $8.7K annual savings.", icon: <TrendingDown size={18} />, accent: "#5ab896" },
            { href: "/agency/ads", title: "Ads Performance", desc: "8 campaigns, 3 platforms, 8.6x blended ROAS, creative breakdowns.", icon: <BarChart3 size={18} />, accent: "#22d3ee" },
            { href: "/stripe", title: "Stripe Revenue", desc: "Live MRR, ARR, customers, and recent charges from Stripe. Zero if not connected.", icon: <CreditCard size={18} />, accent: "#d4a574" },
          ].map((card) => (
            <Link key={card.href} href={card.href} className="block group">
              <div
                className="rounded-xl p-5 border h-full transition"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className="grid place-items-center w-11 h-11 rounded-lg border"
                    style={{ color: card.accent, borderColor: `${card.accent}55`, background: `${card.accent}12` }}
                  >
                    {card.icon}
                  </div>
                  <ArrowUpRight size={14} className="opacity-40 group-hover:opacity-100 transition" style={{ color: "var(--cream-dim)" }} />
                </div>
                <h3 className="text-[15px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{card.title}</h3>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* RIG Doctrine */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
            <span style={{ color: "var(--gold)" }}>II.</span> RIG Doctrine
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { href: "/rig-doctrine", title: "Doctrine Engine", desc: "IQRSQPI loop, A1–A4 routing, Gate-D.", icon: <Shield size={18} />, accent: "#ef4444" },
            { href: "/rig-fleet", title: "Agent Fleet", desc: "232 agency + 86 RIG experts + VoltAgent.", icon: <Boxes size={18} />, accent: "#7c3aed" },
            { href: "/rig-goals", title: "Goals & OKRs", desc: "$10M ARR path, quarterly milestones.", icon: <Target size={18} />, accent: "#fbbf24" },
            { href: "/rig-mcp", title: "MCP Registry", desc: "15 MCP servers, health, capabilities.", icon: <Server size={18} />, accent: "#22d3ee" },
            { href: "/rig-harness", title: "Harnesses", desc: "50 goal loops, agent harness resolver.", icon: <Command size={18} />, accent: "#a855f7" },
            { href: "/rig-deviation", title: "Deviation Engines", desc: "40 engines: Physics, Cognitive, Nature.", icon: <Layers size={18} />, accent: "#7c3aed" },
            { href: "/rig-proof", title: "Proof Packets", desc: "Signed evidence for every action.", icon: <Activity size={18} />, accent: "#fbbf24" },
            { href: "/rig-1000x", title: "1000x Loop", desc: "Continuous improvement engine.", icon: <Zap size={18} />, accent: "#fbbf24" },
          ].map((card) => (
            <Link key={card.href} href={card.href} className="block group">
              <div
                className="rounded-xl p-4 border h-full transition"
                style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="grid place-items-center w-10 h-10 rounded-lg border"
                    style={{ color: card.accent, borderColor: `${card.accent}55`, background: `${card.accent}12` }}
                  >
                    {card.icon}
                  </div>
                  <ArrowUpRight size={12} className="opacity-40 group-hover:opacity-100 transition" style={{ color: "var(--cream-dim)" }} />
                </div>
                <h3 className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>{card.title}</h3>
                <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Studios & Fleet */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Agent Stack */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>III.</span> Agent Stack
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="space-y-3">
              {[
                { name: "Claude", role: "Intelligence layer", desc: "Planning, strategy, architecture, judgment.", color: "#d97757" },
                { name: "Hermes", role: "Research and tools", desc: "Runs tools, workflows, skills, media loops.", color: "#60a5fa" },
                { name: "OpenClaw / Jake", role: "Execution router", desc: "Routes sessions, reduces handoff friction.", color: "#f472b6" },
                { name: "Codex", role: "Verifier", desc: "Compiles, verifies, packages, says GO/NO-GO.", color: "#22c55e" },
              ].map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-xl p-4 border flex items-start gap-3"
                  style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                >
                  <div
                    className="grid place-items-center w-10 h-10 rounded-lg shrink-0"
                    style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}55` }}
                  >
                    <Cpu size={18} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>{agent.name}</h3>
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>{agent.role}</span>
                    </div>
                    <p className="text-[12px] mt-1" style={{ color: "var(--cream-dim)" }}>{agent.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Studios */}
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--cream-mute)" }}>
                <span style={{ color: "var(--gold)" }}>IV.</span> Studios
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--line-soft)" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "LinkedIn Studio", href: "/rig-linkedin", icon: <Briefcase size={16} />, accent: "#0a66c2" },
                { name: "GTM Studio", href: "/rig-gtm", icon: <Rocket size={16} />, accent: "#10b981" },
                { name: "Design Studio", href: "/rig-design", icon: <Zap size={16} />, accent: "#ec4899" },
                { name: "Strategy Studio", href: "/rig-strategy", icon: <TrendingUp size={16} />, accent: "#ef4444" },
                { name: "App Studio", href: "/rig-app", icon: <Briefcase size={16} />, accent: "#f472b6" },
                { name: "Deviation Lattice", href: "/rig-lattice", icon: <Layers size={16} />, accent: "#7c3aed" },
              ].map((studio) => (
                <Link key={studio.href} href={studio.href}>
                  <div
                    className="rounded-xl p-4 border h-full transition cursor-pointer"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div
                      className="grid place-items-center w-9 h-9 rounded-lg mb-2"
                      style={{ background: `${studio.accent}15`, color: studio.accent, border: `1px solid ${studio.accent}55` }}
                    >
                      {studio.icon}
                    </div>
                    <div className="text-[13px] font-medium" style={{ color: "var(--cream)" }}>{studio.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
        <div
          className="rounded-xl p-5 border flex items-center justify-between flex-wrap gap-4"
          style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
        >
          <div>
            <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>
              Prime Directive
            </div>
            <div className="text-[12px] mono" style={{ color: "var(--cream-dim)" }}>
              Code owns decisions. LLMs assist. Gates decide. ProofPacket or it didn&apos;t happen.
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/agency" className="px-4 py-2 rounded-lg text-[12px] font-medium transition"
              style={{ background: "var(--gold)", color: "var(--bg-deep)" }}>
              Launch Agency →
            </Link>
            <Link href="/rig-doctrine" className="px-4 py-2 rounded-lg text-[12px] font-medium border transition"
              style={{ borderColor: "var(--line)", color: "var(--cream)" }}>
              View Doctrine
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}