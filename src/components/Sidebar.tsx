"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search, ChevronDown, Plus,
  LayoutGrid, Briefcase, Rocket, Wallet,
  Users, TrendingUp, Code, Bot, Newspaper,
  FileText, Mail, BarChart3, Brain, Shield,
  Zap, BookOpen, Camera, Settings,
  Receipt, CreditCard, AlertCircle, ArrowRightLeft,
  CheckCircle2, Clock, Inbox, Calendar,
  Target, FolderOpen, Activity, Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
  children?: NavItem[];
}

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Home", icon: LayoutGrid },
      { href: "/paperclip", label: "Paperclip", icon: Briefcase, badge: 5, children: [
        { href: "/paperclip/inbox/list", label: "Inbox", icon: Inbox },
        { href: "/paperclip/today/list", label: "Today", icon: CheckCircle2 },
        { href: "/paperclip/upcoming/list", label: "Upcoming", icon: Calendar },
        { href: "/paperclip/projects/list", label: "Projects", icon: FolderOpen },
      ]},
      { href: "/agency/briefing", label: "Briefing", icon: Newspaper },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/agency", label: "Dashboard", icon: BarChart3 },
      { href: "/agency/revenue", label: "Revenue", icon: Wallet, children: [
        { href: "/agency/revenue/invoices/list", label: "Invoices", icon: Receipt },
        { href: "/agency/revenue/charges/list", label: "Charges", icon: CreditCard },
        { href: "/agency/revenue/customers/list", label: "Customers", icon: Users },
        { href: "/agency/revenue/subscriptions/list", label: "Subscriptions", icon: ArrowRightLeft },
        { href: "/agency/revenue/failed-payments/list", label: "Failed Payments", icon: AlertCircle },
        { href: "/agency/revenue-command", label: "Revenue Command", icon: Zap },
      ]},
      { href: "/agency/pipeline", label: "Pipeline", icon: Rocket, children: [
        { href: "/agency/pipeline/deals/list", label: "Deals", icon: Target },
        { href: "/agency/pipeline/forecast/list", label: "Forecast", icon: TrendingUp },
        { href: "/agency/pipeline/proposals/list", label: "Proposals", icon: FileText },
        { href: "/agency/pipeline/activities/list", label: "Activities", icon: Activity },
      ]},
      { href: "/agency/clients", label: "Clients", icon: Users, children: [
        { href: "/agency/clients/active/list", label: "Active", icon: CheckCircle2 },
        { href: "/agency/clients/prospects/list", label: "Prospects", icon: Clock },
      ]},
      { href: "/agency/proposals", label: "Proposals", icon: FileText },
      { href: "/agency/contracts", label: "Contracts", icon: FileText },
      { href: "/agency/invoices", label: "Invoices", icon: Receipt },
      { href: "/agency/transformfit", label: "TransformFit", icon: Smartphone },
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
      { href: "/agency/agents", label: "Agents", icon: Bot, badge: 410, children: [
        { href: "/agency/agents/catalog/list", label: "Catalog", icon: BookOpen },
        { href: "/agency/agents/departments/list", label: "Departments", icon: Users },
        { href: "/agency/agents/assignments/list", label: "Assignments", icon: CheckCircle2 },
      ]},
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const toggleItem = (href: string) => {
    setCollapsedItems(prev => {
      const next = new Set(prev);
      next.has(href) ? next.delete(href) : next.add(href);
      return next;
    });
  };

  return (
    <aside
      className="hidden md:flex flex-col w-[220px] shrink-0 h-screen overflow-y-auto border-r"
      style={{ background: "var(--rig-sidebar)", borderColor: "var(--rig-border)" }}
    >
      {/* Workspace Switcher */}
      <button className="flex items-center gap-2 mx-3 mt-3 mb-2 px-2 py-2 rounded-md hover:bg-black/5">
        <div className="grid place-items-center w-7 h-7 rounded-md text-[11px] font-bold shrink-0"
          style={{ background: "var(--rig-gold)", color: "white" }}
        >
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
          style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)" }}
        >
          <Search size={12} style={{ color: "var(--rig-text-mute)" }} />
          <input placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-[12px]"
            style={{ color: "var(--rig-text)" }} />
          <kbd className="text-[8px] px-1 py-0.5 rounded font-mono"
            style={{ background: "var(--rig-hover)", color: "var(--rig-text-mute)" }}
          >⌘K</kbd>
        </div>
      </div>

      {/* MRR Card */}
      <div className="mx-3 mb-2 p-2.5 rounded-md"
        style={{ background: "var(--rig-card)", border: "1px solid var(--rig-border)" }}
      >
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
          const isGroupCollapsed = collapsedGroups.has(group.label);
          return (
            <div key={group.label} className="mb-0.5">
              <button onClick={() => toggleGroup(group.label)} className="w-full flex items-center gap-1 px-2 py-1 group">
                <ChevronDown size={10}
                  style={{
                    color: "var(--rig-text-mute)",
                    transform: isGroupCollapsed ? "rotate(-90deg)" : "rotate(0)",
                    transition: "transform 100ms",
                  }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--rig-text-mute)" }}>
                  {group.label}
                </span>
              </button>
              {!isGroupCollapsed && group.items.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const hasChildren = !!item.children?.length;
                const isItemCollapsed = collapsedItems.has(item.href);
                return (
                  <div key={item.href}>
                    <div className="flex items-center">
                      <Link href={item.href}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition flex-1"
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
                            style={{ background: "var(--rig-hover)", color: "var(--rig-text-mute)" }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                      {hasChildren && (
                        <button
                          onClick={() => toggleItem(item.href)}
                          className="grid place-items-center w-5 h-5 rounded"
                          style={{ color: "var(--rig-text-mute)" }}
                        >
                          <ChevronDown size={10} style={{ transform: isItemCollapsed ? "rotate(-90deg)" : "rotate(0)", transition: "transform 100ms" }} />
                        </button>
                      )}
                    </div>
                    {hasChildren && !isItemCollapsed && (
                      <div className="ml-5 pl-2 border-l mt-0.5"
                        style={{ borderColor: "var(--rig-border-soft)" }}
                      >
                        {item.children.map(child => {
                          const isChildActive = pathname.startsWith(child.href);
                          return (
                            <Link key={child.href} href={child.href}
                              className="flex items-center gap-2 px-2 py-1 rounded-md text-[11px] transition"
                              style={{
                                color: isChildActive ? "var(--rig-text)" : "var(--rig-text-3)",
                                background: isChildActive ? "var(--rig-active)" : "transparent",
                              }}
                            >
                              <child.icon size={12} style={{ color: isChildActive ? "var(--rig-text)" : "var(--rig-text-mute)" }} className="shrink-0" />
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom status */}
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
      style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)", boxShadow: "var(--rig-shadow)" }}
    >
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}
            className="grid place-items-center w-9 h-9 rounded-lg"
            style={{ background: isActive ? "var(--rig-active)" : "transparent" }}
          >
            <item.icon size={16} style={{ color: isActive ? "var(--rig-text)" : "var(--rig-text-mute)" }} />
          </Link>
        );
      })}
    </nav>
  );
}
