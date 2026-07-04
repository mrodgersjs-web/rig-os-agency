"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 text-[12px] mb-4" style={{ color: "var(--rig-text-mute)" }}>
      <Link href="/" className="hover:underline" style={{ color: "var(--rig-text-3)" }}>RIG OS</Link>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <ChevronRight size={12} />
          {item.href ? (
            <Link href={item.href} className="hover:underline" style={{ color: "var(--rig-text-3)" }}>{item.label}</Link>
          ) : (
            <span style={{ color: "var(--rig-text)" }}>{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
