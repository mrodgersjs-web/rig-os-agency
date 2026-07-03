"use client";

import { useState, type ReactNode } from "react";
import Sidebar, { MobileNav } from "./Sidebar";
import TopBar from "./TopBar";
import { CopilotDrawer, CopilotButton } from "./CopilotDrawer";
import { TerminalPanel, TerminalButton } from "./TerminalPanel";

export default function Shell({ children }: { children: ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-8 pb-20">
          <TopBar />
          {children}
        </div>
      </main>
      <MobileNav />

      {/* Global Copilot Drawer */}
      <CopilotButton onClick={() => setCopilotOpen(true)} personaId="ornith" />
      <CopilotDrawer open={copilotOpen} onClose={() => setCopilotOpen(false)} personaId="ornith" />

      {/* Global Terminal */}
      <TerminalButton onClick={() => setTerminalOpen((s) => !s)} />
      <TerminalPanel open={terminalOpen} onClose={() => setTerminalOpen(false)} />
    </div>
  );
}
