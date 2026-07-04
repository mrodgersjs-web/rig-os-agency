"use client";

import { ReactNode } from "react";

const C = {
  card: "var(--rig-card)",
  text: "var(--rig-text)",
  text2: "var(--rig-text-2)",
  text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)",
  border: "var(--rig-border)",
  hover: "var(--rig-hover)",
  gold: "var(--rig-gold)",
  goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)",
  emeraldBg: "var(--rig-emerald-bg)",
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  color?: string;
  bg?: string;
  onClick?: () => void;
  href?: string;
}

export function StatCard({ label, value, subtext, icon, color = C.gold, bg = C.goldBg, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg p-4 border transition hover:shadow-md cursor-pointer w-full"
      style={{ background: C.card, borderColor: C.border, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon && <div className="grid place-items-center w-6 h-6 rounded" style={{ background: bg }}>{icon}</div>}
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>{label}</span>
      </div>
      <div className="text-[22px] font-bold" style={{ color: C.text }}>{value}</div>
      {subtext && <div className="text-[10px] mt-0.5" style={{ color: C.mute }}>{subtext}</div>}
    </button>
  );
}

interface SubsectionCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  href: string;
  count?: number | string;
  color?: string;
  bg?: string;
}

export function SubsectionCard({ title, description, icon, href, count, color = C.gold, bg = C.goldBg }: SubsectionCardProps) {
  return (
    <a
      href={href}
      className="block rounded-lg p-4 border transition hover:shadow-md"
      style={{ background: C.card, borderColor: C.border }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="grid place-items-center w-8 h-8 rounded-lg shrink-0" style={{ background: bg }}>{icon}</div>}
          <div className="text-[14px] font-semibold" style={{ color: C.text }}>{title}</div>
        </div>
        {count !== undefined && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0" style={{ background: bg, color }}>{count}</span>
        )}
      </div>
      <div className="text-[12px]" style={{ color: C.text3 }}>{description}</div>
    </a>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border p-8 text-center" style={{ background: C.card, borderColor: C.border }}>
      <div className="text-[14px] font-semibold mb-1" style={{ color: C.text }}>{title}</div>
      <div className="text-[12px] mb-4" style={{ color: C.text3 }}>{description}</div>
      {action && (
        <button
          onClick={action.onClick}
          className="px-3 py-1.5 rounded-md text-[12px] font-medium"
          style={{ background: C.goldBg, color: C.gold }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg animate-pulse" style={{ background: C.card }}>
          <div className="w-4 h-4 rounded" style={{ background: C.hover }} />
          <div className="flex-1">
            <div className="h-3 rounded w-1/3 mb-1" style={{ background: C.hover }} />
            <div className="h-2 rounded w-1/4" style={{ background: C.hover }} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: C.text }}>{title}</h1>
        {subtitle && <p className="text-[13px] mt-0.5" style={{ color: C.text3 }}>{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
          style={{ background: C.goldBg, color: C.gold }}
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}
