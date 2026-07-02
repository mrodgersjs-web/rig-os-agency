"use client";

import Link from "next/link";
import {
  Rocket, Mail, FileText, CreditCard, Search,
  TrendingUp, Newspaper, Activity, Bot, Server,
} from "lucide-react";

const QUICK_ACTIONS = [
  { href: "/agency/briefing", label: "Briefing", icon: <Newspaper size={14} />, accent: "#5ab896" },
  { href: "/agency/pipeline", label: "Pipeline", icon: <TrendingUp size={14} />, accent: "#5ab896" },
  { href: "/agency/outreach", label: "Outreach", icon: <Mail size={14} />, accent: "#d4a574" },
  { href: "/agency/clients", label: "Clients", icon: <Bot size={14} />, accent: "#22d3ee" },
  { href: "/agency/proposals", label: "Proposals", icon: <FileText size={14} />, accent: "#c4607e" },
  { href: "/agency/stripe", label: "Stripe", icon: <CreditCard size={14} />, accent: "#635bff" },
  { href: "/agency/seo", label: "SEO", icon: <Search size={14} />, accent: "#a3e635" },
  { href: "/rig-linkedin", label: "LinkedIn", icon: <Activity size={14} />, accent: "#0a66c2" },
  { href: "/agency/agents", label: "Agents", icon: <Rocket size={14} />, accent: "#7c3aed" },
  { href: "/agency/health", label: "Health", icon: <Server size={14} />, accent: "#22c55e" },
];

export default function QuickActions() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {QUICK_ACTIONS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition hover:bg-[rgba(255,255,255,0.04)]"
          style={{
            borderColor: "var(--line-soft)",
            color: "var(--cream-dim)",
          }}
        >
          <span style={{ color: a.accent }}>{a.icon}</span>
          {a.label}
        </Link>
      ))}
    </div>
  );
}
