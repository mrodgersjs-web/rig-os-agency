"use client";

import { useState, useCallback, type ReactNode } from "react";
import Sidebar, { MobileNav } from "./Sidebar";
import TopBar from "./TopBar";
import { CopilotDrawer } from "./CopilotDrawer";
import { TerminalPanel } from "./TerminalPanel";
import { DetailProvider } from "./DetailContext";

export default function Shell({ children }: { children: ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalCommand, setTerminalCommand] = useState("");

  const openCopilot = useCallback((prompt = "") => {
    setCopilotPrompt(prompt);
    setCopilotOpen(true);
  }, []);

  const closeCopilot = useCallback(() => {
    setCopilotOpen(false);
    setTimeout(() => setCopilotPrompt(""), 300);
  }, []);

  const openTerminal = useCallback((command = "") => {
    setTerminalCommand(command);
    setTerminalOpen(true);
  }, []);

  const closeTerminal = useCallback(() => {
    setTerminalOpen(false);
    setTimeout(() => setTerminalCommand(""), 300);
  }, []);

  return (
    <DetailProvider openCopilot={openCopilot} openTerminal={openTerminal}>
      <div className="h-screen flex overflow-hidden" style={{ background: "var(--rig-bg)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            onOpenCopilot={() => openCopilot("")}
            onToggleTerminal={() => {
              if (terminalOpen) closeTerminal();
              else openTerminal("");
            }}
            terminalOpen={terminalOpen}
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <MobileNav />

        <CopilotDrawer
          open={copilotOpen}
          onClose={closeCopilot}
          personaId="jake"
          initialPrompt={copilotPrompt}
        />
        <TerminalPanel
          open={terminalOpen}
          onClose={closeTerminal}
          initialCommand={terminalCommand}
        />
      </div>
    </DetailProvider>
  );
}
