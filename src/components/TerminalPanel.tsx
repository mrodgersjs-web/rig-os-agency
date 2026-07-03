"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon, X, ChevronRight, Trash2 } from "lucide-react";

interface Line {
  type: "input" | "output" | "error" | "info";
  text: string;
}

export function TerminalPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([
    { type: "info", text: "RIG OS Terminal — Connected to Mac Studio" },
    { type: "info", text: "Type commands below. 15s timeout per command." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [lines]);

  const run = useCallback(async (cmd: string) => {
    if (!cmd.trim() || busy) return;

    setLines((l) => [...l, { type: "input", text: cmd }]);
    setHistory((h) => [...h, cmd]);
    setHistoryIdx(-1);
    setInput("");
    setBusy(true);

    try {
      const r = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await r.json();

      if (data.stdout) {
        data.stdout.split("\n").forEach((line: string) => {
          if (line.trim()) setLines((l) => [...l, { type: "output", text: line }]);
        });
      }
      if (data.stderr) {
        data.stderr.split("\n").forEach((line: string) => {
          if (line.trim()) setLines((l) => [...l, { type: "error", text: line }]);
        });
      }
      if (data.exitCode !== 0 && !data.stdout && !data.stderr) {
        setLines((l) => [...l, { type: "error", text: `Exit code: ${data.exitCode}` }]);
      }
    } catch (e) {
      const error = e as Error;
      setLines((l) => [...l, { type: "error", text: error.message }]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [busy]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      run(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx !== -1 && historyIdx < history.length - 1) {
        const newIdx = historyIdx + 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput("");
      }
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "min(340px, 40vh)", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="fixed bottom-0 left-0 right-0 z-30 flex flex-col"
          style={{
            background: "rgba(10, 10, 15, 0.95)",
            borderTop: "1px solid var(--line-soft)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Terminal Header */}
          <div
            className="flex items-center gap-2 px-4 py-2 border-b"
            style={{ borderColor: "var(--line-soft)" }}
          >
            <TerminalIcon size={14} style={{ color: "#22c55e" }} />
            <span
              className="text-[11px] font-mono"
              style={{ color: "var(--cream-dim)" }}
            >
              RIG OS Terminal
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setLines([])}
              className="grid place-items-center w-7 h-7 rounded transition hover:bg-white/5"
              style={{ color: "var(--cream-mute)" }}
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={onClose}
              className="grid place-items-center w-7 h-7 rounded transition hover:bg-white/5"
              style={{ color: "var(--cream-mute)" }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Terminal Output */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[12px] leading-relaxed"
          >
            {lines.map((line, i) => {
              let color = "var(--cream)";
              if (line.type === "input") color = "#d4a574";
              else if (line.type === "error") color = "#ef4444";
              else if (line.type === "info") color = "#60a5fa";

              return (
                <div key={i} className="flex gap-2" style={{ color }}>
                  {line.type === "input" && <ChevronRight size={14} className="shrink-0 mt-0.5" />}
                  <span className="whitespace-pre-wrap break-all">{line.text}</span>
                </div>
              );
            })}
            {busy && (
              <div className="flex gap-2 items-center" style={{ color: "#22c55e" }}>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 rounded-full bg-current"
                />
                <span>running...</span>
              </div>
            )}
          </div>

          {/* Terminal Input */}
          <div
            className="flex items-center gap-2 px-4 py-2 border-t"
            style={{ borderColor: "var(--line-soft)" }}
          >
            <ChevronRight size={14} style={{ color: "#d4a574" }} />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Enter command... (↑↓ for history, Ctrl+L to clear)"
              className="flex-1 bg-transparent border-none outline-none font-mono text-[12px]"
              style={{ color: "var(--cream)" }}
              disabled={busy}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TerminalButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-5 left-5 z-30 grid place-items-center w-12 h-12 rounded-full shadow-2xl"
      style={{
        background: "rgba(34,197,94,0.2)",
        border: "1px solid rgba(34,197,94,0.4)",
        backdropFilter: "blur(20px)",
        color: "#22c55e",
      }}
    >
      <TerminalIcon size={20} />
    </motion.button>
  );
}
