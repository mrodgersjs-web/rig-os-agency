"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Terminal as TerminalIcon, MessageCircle, Plus,
  ChevronRight,
} from "lucide-react";

const TITLES: Record<string, string> = {
  "/": "Home",
  "/paperclip": "Paperclip",
  "/agency": "Dashboard",
  "/agency/revenue": "Revenue",
  "/agency/pipeline": "Pipeline",
  "/agency/clients": "Clients",
  "/agency/proposals": "Proposals",
  "/agency/contracts": "Contracts",
  "/agency/invoices": "Invoices",
  "/agency/agents": "Agents",
  "/agency/briefing": "Daily Briefing",
  "/rig-gtm": "GTM Studio",
  "/rig-linkedin": "LinkedIn Studio",
  "/rig-instagram": "Instagram Studio",
  "/rig-strategy": "Strategy Studio",
  "/rig-app": "Engineering",
  "/rig-design": "Design Studio",
  "/rig-doctrine": "Doctrine",
  "/memory": "Memory",
  "/obsidian": "Vault",
  "/orchestration": "Orchestration",
};

export default function TopBar({
  onOpenCopilot,
  onToggleTerminal,
  terminalOpen,
}: {
  onOpenCopilot: () => void;
  onToggleTerminal: () => void;
  terminalOpen: boolean;
}) {
  const pathname = usePathname();
  const title = TITLES[pathname] || TITLES[pathname.split("/").slice(0, 3).join("/")] || "RIG OS";

  return (
    <header
      className="flex items-center justify-between px-5 h-12 border-b shrink-0"
      style={{ background: "var(--rig-card)", borderColor: "var(--rig-border)" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--rig-text-3)" }}>
        <span>RIG OS</span>
        <ChevronRight size={12} style={{ color: "var(--rig-text-mute)" }} />
        <motion.span
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-medium"
          style={{ color: "var(--rig-text)" }}
        >
          {title}
        </motion.span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Terminal Toggle */}
        <button
          onClick={onToggleTerminal}
          className="grid place-items-center w-8 h-8 rounded-md transition"
          style={{
            background: terminalOpen ? "var(--rig-emerald-bg)" : "transparent",
            color: terminalOpen ? "var(--rig-emerald)" : "var(--rig-text-mute)",
          }}
          title="Terminal"
        >
          <TerminalIcon size={15} />
        </button>

        {/* Jake / Copilot */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium"
          style={{ background: "var(--rig-emerald-bg)", color: "var(--rig-emerald)" }}
        >
          <div className="grid place-items-center w-5 h-5 rounded text-[8px] font-bold"
            style={{ background: "var(--rig-emerald)", color: "white" }}>
            JK
          </div>
          <span className="hidden sm:inline">Jake</span>
        </button>
      </div>
    </header>
  );
}
