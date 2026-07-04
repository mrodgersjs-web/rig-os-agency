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
};

interface Column {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "right" | "center";
  render?: (row: any) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  rows: any[];
  onRowClick?: (row: any) => void;
  keyField?: string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable({
  columns,
  rows,
  onRowClick,
  keyField = "id",
  loading,
  emptyTitle = "No items",
  emptyDescription = "Nothing to show yet",
}: DataTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.border, background: C.card }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse"
            style={{ borderBottom: i < 4 ? `1px solid var(--rig-border-soft)` : "none" }}
          >
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

  if (!rows?.length) {
    return (
      <div className="rounded-lg border p-8 text-center" style={{ borderColor: C.border, background: C.card }}>
        <div className="text-[14px] font-semibold mb-1" style={{ color: C.text }}>{emptyTitle}</div>
        <div className="text-[12px]" style={{ color: C.text3 }}>{emptyDescription}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.border, background: C.card }}>
      <div className="flex items-center px-4 py-2 text-[10px] font-semibold uppercase tracking-wider border-b"
        style={{ background: "var(--rig-sidebar)", color: C.mute, borderColor: C.border }}
      >
        {columns.map(col => (
          <div key={col.key} className={col.width ? "" : "flex-1"}
            style={{ width: col.width, textAlign: col.align || "left" }}
          >{col.label}</div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={row[keyField] || i}
          onClick={() => onRowClick?.(row)}
          className={`flex items-center px-4 py-2.5 text-[12px] ${onRowClick ? "cursor-pointer hover:bg-black/[0.02]" : ""}`}
          style={{ borderBottom: i < rows.length - 1 ? `1px solid var(--rig-border-soft)` : "none" }}
        >
          {columns.map(col => (
            <div key={col.key} className={col.width ? "" : "flex-1"}
              style={{ width: col.width, textAlign: col.align || "left", color: C.text2 }}
            >
              {col.render ? col.render(row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

interface TabsProps {
  tabs: { label: string; href: string; active?: boolean }[];
}

export function Tabs({ tabs }: TabsProps) {
  return (
    <div className="flex items-center gap-1 border-b mb-5" style={{ borderColor: C.border }}>
      {tabs.map(tab => (
        <a
          key={tab.href}
          href={tab.href}
          className="px-3 py-2 text-[12px] font-medium transition"
          style={{
            color: tab.active ? C.text : C.text3,
            borderBottom: tab.active ? `2px solid ${C.gold}` : "2px solid transparent",
          }}
        >
          {tab.label}
        </a>
      ))}
    </div>
  );
}
