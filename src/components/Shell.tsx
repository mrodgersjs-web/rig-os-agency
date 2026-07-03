"use client";

import { useState, useEffect, type ReactNode } from "react";
import Sidebar, { MobileNav } from "./Sidebar";
import TopBar from "./TopBar";
import { CopilotDrawer } from "./CopilotDrawer";
import { TerminalPanel } from "./TerminalPanel";
import { DetailProvider } from "./DetailContext";

export default function Shell({ children }: { children: ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  useEffect(() => {
    const onOpenCopilot = () => setCopilotOpen(true);
    const onRunTerminal = () => setTerminalOpen(true);
    window.addEventListener("open-copilot", onOpenCopilot);
    window.addEventListener("run-terminal", onRunTerminal);
    return () => {
      window.removeEventListener("open-copilot", onOpenCopilot);
      window.removeEventListener("run-terminal", onRunTerminal);
    };
  }, []);

  return (
    <DetailProvider>
      <div className="h-screen flex overflow-hidden" style={{ background: "var(--rig-bg)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            onOpenCopilot={() => setCopilotOpen(true)}
            onToggleTerminal={() => setTerminalOpen(s => !s)}
            terminalOpen={terminalOpen}
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <MobileNav />

        <CopilotDrawer
          open={copilotOpen}
          onClose={() => setCopilotOpen(false)}
          personaId="jake"
        />
        <TerminalPanel
          open={terminalOpen}
          onClose={() => setTerminalOpen(false)}
        />
      </div>
    </DetailProvider>
  );
}
