"use client";

import { createContext, useContext, useState, type ReactNode, useCallback } from "react";
import { DetailPanel, type DetailItem } from "./DetailPanel";

type DetailContextType = {
  selected: DetailItem | null;
  open: boolean;
  openDetail: (item: DetailItem, options?: { runCommand?: (cmd: string) => void; openCopilot?: (prompt: string) => void }) => void;
  closeDetail: () => void;
};

const DetailContext = createContext<DetailContextType | null>(null);

export function useDetail() {
  const ctx = useContext(DetailContext);
  if (!ctx) throw new Error("useDetail must be used inside DetailProvider");
  return ctx;
}

export function DetailProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<DetailItem | null>(null);
  const [open, setOpen] = useState(false);

  const openDetail = useCallback((item: DetailItem) => {
    setSelected(item);
    setOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setOpen(false);
    setTimeout(() => setSelected(null), 220);
  }, []);

  return (
    <DetailContext.Provider value={{ selected, open, openDetail, closeDetail }}>
      {children}
      <DetailPanel
        item={selected}
        open={open}
        onClose={closeDetail}
        onOpenCopilot={(prompt) => {
          // Handled via event dispatch to Shell-level Copilot
          window.dispatchEvent(new CustomEvent("open-copilot", { detail: prompt }));
          closeDetail();
        }}
        onRunCommand={(cmd) => {
          window.dispatchEvent(new CustomEvent("run-terminal", { detail: cmd }));
          closeDetail();
        }}
      />
    </DetailContext.Provider>
  );
}
