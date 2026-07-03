"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid, Brain, Target, BookOpen, Sparkles as SparklesIcon,
  TrendingUp, Wand2, Columns3, NotebookText, Film, Network, Paperclip,
  Workflow, Route, Shield, Activity, Briefcase, Rocket, Layers,
  Building2, Users, DollarSign, Server, Cpu, GitBranch, Zap, Gauge,
  Command, Boxes, FileText, Scale, Mail,
  CreditCard, Wallet, Megaphone, Share2, Eye, Search, History,
  Newspaper, DoorOpen, Bot, HardDrive, MailCheck, Radio, Anchor,
  Camera, Terminal as TerminalIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import AgentAvatar from "./AgentAvatar";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  accent: string;
  dim: string;
}

// ── RIG OS Agency Navigation ──────────────────────────────────────
const NAV: NavItem[] = [
  // Command
  { href: "/",            label: "Command Center",    icon: <LayoutGrid size={16} />,    accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },

  // Agency Operations (NEW — $10M ARR engine)
  { href: "/agency",      label: "Agency Dashboard",  icon: <Building2 size={16} />,    accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },
  { href: "/agency/offerings", label: "Offerings",    icon: <Rocket size={16} />,       accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },
  { href: "/agency/clients", label: "Clients",        icon: <Users size={16} />,        accent: "#5ab896", dim: "rgba(90,184,150,0.16)" },
  { href: "/agency/pipeline", label: "Pipeline",      icon: <Workflow size={16} />,     accent: "#5ab896", dim: "rgba(90,184,150,0.16)" },
  { href: "/agency/revenue",  label: "Revenue",       icon: <DollarSign size={16} />,   accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },
  { href: "/agency/revenue-command", label: "Revenue Command", icon: <Rocket size={16} />, accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },
  { href: "/agency/proposals", label: "Proposals",    icon: <FileText size={16} />,     accent: "#c4607e", dim: "rgba(196,96,126,0.16)" },
  { href: "/agency/contracts", label: "Contracts",   icon: <Scale size={16} />,       accent: "#c4607e", dim: "rgba(196,96,126,0.16)" },
  { href: "/agency/invoices",  label: "Invoices",    icon: <DollarSign size={16} />,   accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },
  { href: "/agency/jobs",      label: "Jobs Tracker", icon: <Briefcase size={16} />,   accent: "#5ab896", dim: "rgba(90,184,150,0.16)" },
  { href: "/agency/outreach",  label: "Outreach",     icon: <Mail size={16} />,        accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },
  { href: "/agency/email-tracking",  label: "Email Tracking", icon: <MailCheck size={16} />, accent: "#a855f7", dim: "rgba(168,85,247,0.16)" },
  { href: "/agency/social",    label: "Social Hub",    icon: <Share2 size={16} />,      accent: "#0a66c2", dim: "rgba(10,102,194,0.16)" },
  { href: "/agency/stripe",    label: "Stripe Center", icon: <CreditCard size={16} />,  accent: "#635bff", dim: "rgba(99,91,255,0.16)" },
  { href: "/agency/ads",       label: "Ad Campaigns",  icon: <Megaphone size={16} />,   accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },
  { href: "/agency/teasers",   label: "Teasers",       icon: <Eye size={16} />,         accent: "#c4607e", dim: "rgba(196,96,126,0.16)" },
  { href: "/agency/briefing",  label: "Daily Briefing",icon: <Newspaper size={16} />,   accent: "#5ab896", dim: "rgba(90,184,150,0.16)" },
  { href: "/agency/seo",       label: "SEO Command",   icon: <Search size={16} />,      accent: "#a3e635", dim: "rgba(163,230,53,0.16)" },
  { href: "/agency/scraping",  label: "Scraping Ops",  icon: <HardDrive size={16} />,   accent: "#22d3ee", dim: "rgba(34,211,238,0.16)" },
  { href: "/agency/recall",    label: "Recall",        icon: <History size={16} />,     accent: "#a855f7", dim: "rgba(168,85,247,0.16)" },
  { href: "/agency/portals",   label: "Client Portals",icon: <DoorOpen size={16} />,    accent: "#5ab896", dim: "rgba(90,184,150,0.16)" },
  { href: "/agency/agents",    label: "Agent Roster",  icon: <Bot size={16} />,         accent: "#7c3aed", dim: "rgba(124,58,237,0.16)" },
  { href: "/agency/fleet",     label: "Fleet Ops",     icon: <Boxes size={16} />,       accent: "#fbbf24", dim: "rgba(251,191,36,0.16)" },
  { href: "/agency/harbor",    label: "Harbor Node",   icon: <Anchor size={16} />,      accent: "#22d3ee", dim: "rgba(34,211,238,0.16)" },
  { href: "/agency/spend",     label: "Spend Tracker", icon: <Wallet size={16} />,      accent: "#f97316", dim: "rgba(249,115,22,0.16)" },
  { href: "/agency/health",    label: "System Health", icon: <Activity size={16} />,    accent: "#5ab896", dim: "rgba(90,184,150,0.16)" },
  { href: "/agency/capabilities", label: "Capabilities", icon: <Cpu size={16} />,      accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },

  // RIG Orchestration (ENTERPRISE)
  { href: "/fleet",         label: "Fleet Command",     icon: <Server size={16} />,       accent: "#22d3ee", dim: "rgba(34,211,238,0.16)" },
  { href: "/orchestration",  label: "20-Agent Team",    icon: <Radio size={16} />,        accent: "#22c55e", dim: "rgba(34,197,94,0.16)" },
  { href: "/agency-agents",  label: "Agency Catalog",   icon: <Users size={16} />,        accent: "#4a9eff", dim: "rgba(74,158,255,0.16)" },
  { href: "/voltagents",     label: "VoltAgent Catalog", icon: <Zap size={16} />,         accent: "#fbbf24", dim: "rgba(251,191,36,0.16)" },
  { href: "/paperclip",      label: "Paperclip 24/7",   icon: <Boxes size={16} />,        accent: "#a855f7", dim: "rgba(168,85,247,0.16)" },

  // RIG Doctrine (NEW)
  { href: "/rig-doctrine",  label: "Doctrine",        icon: <Shield size={16} />,       accent: "#ef4444", dim: "rgba(239,68,68,0.16)" },
  { href: "/rig-fleet",     label: "Agent Fleet",     icon: <Boxes size={16} />,        accent: "#7c3aed", dim: "rgba(124,58,237,0.16)" },
  { href: "/rig-goals",     label: "Goals & OKRs",   icon: <Target size={16} />,       accent: "#fbbf24", dim: "rgba(251,191,36,0.16)" },
  { href: "/rig-mcp",       label: "MCP Registry",   icon: <Server size={16} />,       accent: "#22d3ee", dim: "rgba(34,211,238,0.16)" },
  { href: "/rig-harness",   label: "Harnesses",      icon: <Command size={16} />,      accent: "#a855f7", dim: "rgba(168,85,247,0.16)" },
  { href: "/rig-deviation", label: "Deviation Engines", icon: <Layers size={16} />,   accent: "#7c3aed", dim: "rgba(124,58,237,0.16)" },
  { href: "/rig-proof",     label: "Proof Packets",   icon: <Activity size={16} />,     accent: "#fbbf24", dim: "rgba(251,191,36,0.16)" },
  { href: "/ultraplan",     label: "Ultraplan",       icon: <Rocket size={16} />,      accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },

  // Agents (existing)
  { href: "/claude",   label: "Claude",   icon: <AgentAvatar agent="claude" size={22} />,   accent: "#d97757", dim: "rgba(217,119,87,0.16)" },
  { href: "/openclaw", label: "OpenClaw", icon: <AgentAvatar agent="openclaw" size={22} />, accent: "#f472b6", dim: "rgba(244,114,182,0.16)" },
  { href: "/hermes",   label: "Hermes",   icon: <AgentAvatar agent="hermes" size={22} />,   accent: "#60a5fa", dim: "rgba(96,165,250,0.16)" },
  { href: "/gemini",   label: "Gemini",   icon: <AgentAvatar agent="gemini" size={22} />,   accent: "#4285F4", dim: "rgba(66,133,244,0.16)" },
  { href: "/antigravity", label: "Antigravity", icon: <AgentAvatar agent="antigravity" size={22} />, accent: "#7c3aed", dim: "rgba(124,58,237,0.16)" },
  { href: "/codex",       label: "Codex",       icon: <AgentAvatar agent="codex" size={22} />,       accent: "#22c55e", dim: "rgba(34,197,94,0.16)" },
  { href: "/opencode",    label: "OpenCode",    icon: <AgentAvatar agent="fcc" size={22} />,        accent: "#f472b6", dim: "rgba(244,114,182,0.16)" },
  { href: "/freeclaude",  label: "Free Claude Code", icon: <AgentAvatar agent="fcc" size={22} />,    accent: "#10b981", dim: "rgba(16,185,129,0.16)" },
  { href: "/jarvis",      label: "Jarvis",      icon: <AgentAvatar agent="hermes" size={22} />,    accent: "#60a5fa", dim: "rgba(96,165,250,0.16)" },

  // Studios
  { href: "/rig-linkedin", label: "LinkedIn Studio", icon: <Briefcase size={16} />,  accent: "#0a66c2", dim: "rgba(10,102,194,0.16)" },
  { href: "/rig-instagram", label: "Instagram Studio", icon: <Camera size={16} />, accent: "#E1306C", dim: "rgba(225,48,108,0.16)" },
  { href: "/rig-gtm",      label: "GTM Studio",      icon: <Rocket size={16} />,    accent: "#10b981", dim: "rgba(16,185,129,0.16)" },
  { href: "/rig-design",   label: "Design Studio",   icon: <Wand2 size={16} />,     accent: "#ec4899", dim: "rgba(236,72,153,0.16)" },
  { href: "/rig-strategy", label: "Strategy Studio", icon: <TrendingUp size={16} />, accent: "#ef4444", dim: "rgba(239,68,68,0.16)" },
  { href: "/rig-app",      label: "App Studio",     icon: <Briefcase size={16} />, accent: "#f472b6", dim: "rgba(244,114,182,0.16)" },

  // Self
  { href: "/pipeline", label: "Pipeline", icon: <Workflow size={16} />, accent: "#34d399", dim: "rgba(52,211,153,0.16)" },
  { href: "/goals",    label: "Goals",    icon: <Target size={16} />,    accent: "#fbbf24", dim: "rgba(251,191,36,0.16)" },
  { href: "/seo",      label: "SEO",      icon: <TrendingUp size={16} />, accent: "#a3e635", dim: "rgba(163,230,53,0.16)" },
  { href: "/video",    label: "Video",    icon: <Film size={16} />,      accent: "#ef4444", dim: "rgba(239,68,68,0.16)" },
  { href: "/studio",   label: "Studio",   icon: <Wand2 size={16} />,     accent: "#ec4899", dim: "rgba(236,72,153,0.16)" },
  { href: "/network",  label: "Network",  icon: <Network size={16} />,   accent: "#60a5fa", dim: "rgba(96,165,250,0.16)" },
  { href: "/notebook", label: "Notebook", icon: <NotebookText size={16} />, accent: "#fde047", dim: "rgba(253,224,71,0.16)" },
  { href: "/kanban",   label: "Kanban",   icon: <Columns3 size={16} />,  accent: "#14b8a6", dim: "rgba(20,184,166,0.16)" },
  { href: "/ruflo",    label: "Workflow Swarm", icon: <Route size={16} />, accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },
  { href: "/paperclip", label: "Paperclip", icon: <Paperclip size={16} />, accent: "#d4a574", dim: "rgba(212,165,116,0.16)" },
  { href: "/journal",  label: "Journal",  icon: <BookOpen size={16} />,  accent: "#f59e0b", dim: "rgba(245,158,11,0.16)" },
  { href: "/memory",   label: "Memory",   icon: <Brain size={16} />,     accent: "#22d3ee", dim: "rgba(34,211,238,0.16)" },
  { href: "/obsidian", label: "Obsidian", icon: <BookOpen size={16} />,  accent: "#a855f7", dim: "rgba(168,85,247,0.16)" },

  // System
  { href: "/rig-ops",      label: "RIG Ops",         icon: <Shield size={16} />,    accent: "#ef4444", dim: "rgba(239,68,68,0.16)" },
  { href: "/rig-lattice",  label: "Deviation Lattice", icon: <Layers size={16} />, accent: "#7c3aed", dim: "rgba(124,58,237,0.16)" },
  { href: "/rig-1000x",    label: "1000x Loop",      icon: <Zap size={16} />,       accent: "#fbbf24", dim: "rgba(251,191,36,0.16)" },
  { href: "/guide",    label: "Build Guide", icon: <SparklesIcon size={16} />, accent: "#ec4899", dim: "rgba(236,72,153,0.16)" },
];

// Section groupings for labels
const SECTION_MAP: Record<string, string> = {
  "/agency": "Agency",
  "/agency/offerings": "Agency",
  "/agency/clients": "Agency",
  "/agency/pipeline": "Agency",
  "/agency/revenue": "Agency",
  "/agency/jobs": "Agency",
  "/agency/proposals": "Agency",
  "/agency/contracts": "Agency",
  "/agency/invoices": "Agency",
  "/agency/outreach": "Agency",
  "/agency/email-tracking": "Agency",
  "/agency/social": "Agency",
  "/agency/stripe": "Agency",
  "/agency/ads": "Agency",
  "/agency/teasers": "Agency",
  "/agency/briefing": "Agency",
  "/agency/seo": "Agency",
  "/agency/scraping": "Agency",
  "/agency/recall": "Agency",
  "/agency/portals": "Agency",
  "/agency/agents": "Agency",
  "/agency/fleet": "Agency",
  "/agency/harbor": "Agency",
  "/agency/spend": "Agency",
  "/rig-doctrine": "RIG Doctrine",
  "/rig-fleet": "RIG Doctrine",
  "/rig-goals": "RIG Doctrine",
  "/rig-mcp": "RIG Doctrine",
  "/rig-harness": "RIG Doctrine",
  "/rig-deviation": "RIG Doctrine",
  "/rig-proof": "RIG Doctrine",
  "/ultraplan": "RIG Doctrine",
  "/claude": "Agents",
  "/openclaw": "Agents",
  "/hermes": "Agents",
  "/gemini": "Agents",
  "/antigravity": "Agents",
  "/codex": "Agents",
  "/opencode": "Agents",
  "/freeclaude": "Agents",
  "/jarvis": "Agents",
  "/rig-linkedin": "Studios",
  "/rig-instagram": "Studios",
  "/rig-gtm": "Studios",
  "/agency/health": "Agency",
  "/agency/capabilities": "Agency",
  "/rig-design": "Studios",
  "/rig-strategy": "Studios",
  "/rig-app": "Studios",
  "/pipeline": "Self",
  "/goals": "Self",
  "/seo": "Self",
  "/video": "Self",
  "/studio": "Self",
  "/network": "Self",
  "/notebook": "Self",
  "/kanban": "Self",
  "/ruflo": "Self",
  "/paperclip": "Self",
  "/journal": "Self",
  "/memory": "Self",
  "/obsidian": "Self",
  "/rig-ops": "System",
  "/rig-lattice": "System",
  "/rig-1000x": "System",
  "/guide": "System",
};

export default function Sidebar() {
  const pathname = usePathname();
  let lastSection = "";

  return (
    <aside
      className="hidden md:flex flex-col w-[244px] shrink-0 py-6 border-r border-[var(--line-soft)] overflow-y-auto"
      style={{ background: "var(--bg-mid)", maxHeight: "100vh" }}
    >
      <Link href="/" className="block mb-7 px-5">
        <div
          className="text-[10px] uppercase tracking-[0.25em] mb-1"
          style={{ color: "var(--cream-mute)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
        >
          Rodgers Intelligence
        </div>
        <div
          className="text-xl tracking-tight"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}
        >
          RIG OS <span className="hand text-[1.3em] ml-1">Agency</span>
        </div>
      </Link>

      <nav className="flex flex-col gap-0.5 relative">
        {NAV.map((item) => {
          const section = SECTION_MAP[item.href] || "";
          const showLabel = section !== lastSection && section !== "";
          lastSection = section;

          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              {showLabel && (
                <div className="sidebar-section-label mt-5 mb-1.5 px-5">{section}</div>
              )}
              <Link
                href={item.href}
                className={`sidebar-item relative group flex items-center gap-3 py-2.5 px-5 ${active ? "active" : ""}`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[22px]"
                    style={{ background: "var(--gold)", boxShadow: "0 0 10px var(--gold)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span
                  className="shrink-0 grid place-items-center w-7 h-7 rounded-md transition"
                  style={{ color: active ? "var(--gold)" : "var(--cream-dim)" }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 mx-5 border-t border-[var(--line-soft)]">
        <div className="sidebar-section-label mt-4 mb-2">Wired</div>
        <div className="text-[11px] leading-relaxed mono" style={{ color: "var(--cream-dim)" }}>
          232 agency agents · 6 RIG core<br />
          15 MCPs · 50 goal loops<br />
          40 deviation engines<br />
          <span className="hand text-[1.15em]">ProofPacket</span> or it didn&apos;t happen
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const mobileHrefs = new Set(["/", "/agency", "/agency/pipeline", "/agency/clients", "/rig-doctrine", "/rig-fleet", "/memory"]);
  const items = NAV.filter((item) => mobileHrefs.has(item.href));
  return (
    <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 panel panel-hot px-2 py-1.5 flex gap-1">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="grid place-items-center w-10 h-10 rounded-lg transition"
            style={{
              background: active ? item.dim : "transparent",
              color: active ? item.accent : "var(--fg-dim)",
            }}
          >
            {item.icon}
          </Link>
        );
      })}
    </nav>
  );
}
