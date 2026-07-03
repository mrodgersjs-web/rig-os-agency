"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search, ChevronDown, Plus,
  LayoutGrid, Briefcase, Rocket, Wallet,
  Users, TrendingUp, Code, Bot, Newspaper,
  FileText, Mail, BarChart3, Brain, Shield,
  Zap, BookOpen, Camera, Settings,
  Terminal as TerminalIcon, MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: LucideIcon; badge?: number }[];
}

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Home", icon: LayoutGrid },
      { href: "/paperclip", label: "Paperclip", icon: Briefcase, badge: 5 },
      { href: "/agency/briefing", label: "Briefing", icon: Newspaper },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/agency", label: "Dashboard", icon: BarChart3 },
      { href: "/agency/revenue", label: "Revenue", icon: Wallet },
      { href: "/agency/pipeline", label: "Pipeline", icon: Rocket },
      { href: "/agency/clients", label: "Clients", icon: Users },
      { href: "/agency/proposals", label: "Proposals", icon: FileText },
      { href: "/agency/contracts", label: "Contracts", icon: FileText },
      { href: "/agency/invoices", label: "Invoices", icon: Wallet },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/rig-gtm", label: "GTM Studio", icon: Rocket },
      { href: "/rig-linkedin", label: "LinkedIn", icon: Users },
      { href: "/rig-instagram", label: "Instagram", icon: Camera },
      { href: "/agency/outreach", label: "Outreach", icon: Mail },
      { href: "/agency/seo", label: "SEO", icon: TrendingUp },
      { href: "/agency/social", label: "Social", icon: Users },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/agency/agents", label: "Agents", icon: Bot, badge: 410 },
      { href: "/rig-strategy", label: "Strategy", icon: TrendingUp },
      { href: "/agency/fleet", label: "Fleet Ops", icon: Bot },
      { href: "/agency-agents", label: "Agency Catalog", icon: Users },
      { href: "/voltagents", label: "VoltAgent", icon: Zap },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/rig-app", label: "Engineering", icon: Code },
      { href: "/rig-design", label: "Design", icon: Code },
      { href: "/rig-doctrine", label: "Doctrine", icon: Shield },
      { href: "/memory", label: "Memory", icon: Brain },
      { href: "/obsidian", label: "Vault", icon: BookOpen },
      { href: "/orchestration", label: "Orchestration", icon: Zap },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (label: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <aside
      className="hidden md:flex flex-col w-[220px] shrink-0 h-screen overflow-y-auto border-r"
      style={{ background: "var(--rig-sidebar)", borderColor: "var(--rig-border)" }}
    >
      {/* Workspace Switcher (Airwallex pattern) */}
      <button className="flex items-center gap-2 mx-3 mt-3 mb-2 px-2 py-2 rounded-md hover:bg-black/5">
        <div className="grid place-items-center w-7 h-7 rounded-md text-[11px] font-bold shrink-0"
          style={{ background: "var(--rig-gold)", color: "white" }}>
          R
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-[12px] font-semibold truncate" style={{ color: "var(--rig-text)" }}>RIG OS Agency</div>
          <div className="text-[9px] truncate" style={{ color: "var(--rig-text-mute)" }}>Enterprise</div>
        </div>
        <ChevronDown size={12} style={{ color: "var(--rig-text-mute)" }} />
      </button>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border"
          style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)" }}>
          <Search size={12} style={{ color: "var(--rig-text-mute)" }} />
          <input placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-[12px]"
            style={{ color: "var(--rig-text)" }} />
          <kbd className="text-[8px] px-1 py-0.5 rounded font-mono"
            style={{ background: "var(--rig-hover)", color: "var(--rig-text-mute)" }}>⌘K</kbd>
        </div>
      </div>

      {/* Revenue Card (Airwallex balance pattern) */}
      <div className="mx-3 mb-2 p-2.5 rounded-md" style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)" }}>
        <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--rig-text-mute)" }}>MRR</div>
        <div className="text-[16px] font-bold" style={{ color: "var(--rig-text)" }}>
          $0<span className="text-[10px] ml-1" style={{ color: "var(--rig-text-mute)" }}>USD</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--rig-emerald)" }} />
          <span className="text-[9px]" style={{ color: "var(--rig-text-mute)" }}>Stripe: not connected</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-2 flex-1 pb-3">
        {NAV.map((group) => {
          const isCollapsed = collapsed.has(group.label);
          return (
            <div key={group.label} className="mb-0.5">
              <button onClick={() => toggle(group.label)} className="w-full flex items-center gap-1 px-2 py-1 group">
                <ChevronDown size={10}
                  style={{ color: "var(--rig-text-mute)", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0)", transition: "transform 100ms" }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--rig-text-mute)" }}>
                  {group.label}
                </span>
              </button>
              {!isCollapsed && group.items.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition"
                    style={{
                      background: isActive ? "var(--rig-active)" : "transparent",
                      color: isActive ? "var(--rig-text)" : "var(--rig-text-2)",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    <item.icon size={14} style={{ color: isActive ? "var(--rig-text)" : "var(--rig-text-mute)" }} className="shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: "var(--rig-hover)", color: "var(--rig-text-mute)" }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom: System Status */}
      <div className="px-3 py-2 border-t" style={{ borderColor: "var(--rig-border)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--rig-emerald)" }} />
          <span className="text-[10px]" style={{ color: "var(--rig-text-mute)" }}>Ornith:35B online</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = NAV[0].items;
  return (
    <nav className="md:hidden fixed bottom-2 left-1/2 -translate-x-1/2 z-40 flex gap-1 px-2 py-1.5 rounded-xl border"
      style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)", boxShadow: "var(--rig-shadow)" }}>
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}
            className="grid place-items-center w-9 h-9 rounded-lg"
            style={{ background: isActive ? "var(--rig-active)" : "transparent" }}>
            <item.icon size={16} style={{ color: isActive ? "var(--rig-text)" : "var(--rig-text-mute)" }} />
          </Link>
        );
      })}
    </nav>
  );
}
