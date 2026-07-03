"use client";

import { X, Edit2, Trash2, CheckCircle2, Circle, MoreHorizontal, Calendar, User, Tag, Clock, ArrowRight, Send, Bot, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  red: "var(--rig-red)",
  redBg: "var(--rig-red-bg)",
  orange: "var(--rig-orange)",
  orangeBg: "var(--rig-orange-bg)",
  blue: "var(--rig-blue)",
  blueBg: "var(--rig-blue-bg)",
};

export interface DetailItem {
  id: string;
  type: "task" | "email" | "deal" | "agent" | "client" | "revenue" | "system" | "department" | "briefing";
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  assignee?: string;
  due?: string;
  tags?: string[];
  source?: string;
  data?: Record<string, any>;
}

export function DetailPanel({
  item,
  open,
  onClose,
  onUpdate,
  onDelete,
  onRunCommand,
  onOpenCopilot,
}: {
  item: DetailItem | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<DetailItem>) => void;
  onDelete?: (id: string) => void;
  onRunCommand?: (cmd: string) => void;
  onOpenCopilot?: (prompt: string) => void;
}) {
  if (!item) return null;

  const priorityConfig: Record<string, { color: string; bg: string }> = {
    critical: { color: C.red, bg: C.redBg },
    high: { color: C.orange, bg: C.orangeBg },
    medium: { color: C.gold, bg: C.goldBg },
    low: { color: C.emerald, bg: C.emeraldBg },
  };
  const pc = priorityConfig[item.priority || "medium"] || priorityConfig.medium;

  const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    done: { label: "Done", icon: CheckCircle2, color: C.emerald },
    "in progress": { label: "In Progress", icon: Clock, color: C.gold },
    pending: { label: "Pending", icon: Circle, color: C.text3 },
    blocked: { label: "Blocked", icon: X, color: C.red },
  };
  const sc = statusConfig[item.status || "pending"] || statusConfig.pending;
  const StatusIcon = sc.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.25)" }}
          />
          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="fixed right-0 top-0 h-screen w-[420px] z-50 border-l flex flex-col"
            style={{ background: C.card, borderColor: C.border }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: C.hover, color: C.mute }}
                >
                  {item.type}
                </span>
                <span className="text-[11px] truncate max-w-[200px]" style={{ color: C.text3 }}>ID: {item.id}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDelete?.(item.id)}
                  className="grid place-items-center w-7 h-7 rounded-md transition hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 size={13} style={{ color: C.red }} />
                </button>
                <button
                  onClick={onClose}
                  className="grid place-items-center w-7 h-7 rounded-md transition"
                  style={{ background: C.hover }}
                  title="Close"
                >
                  <X size={14} style={{ color: C.text2 }} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Title */}
              <div className="mb-5">
                {item.type === "task" && (
                  <button
                    onClick={() => onUpdate?.(item.id, { status: item.status === "done" ? "pending" : "done" })}
                    className="flex items-center gap-2 mb-2"
                  >
                    {item.status === "done" ? (
                      <CheckCircle2 size={20} style={{ color: C.emerald }} />
                    ) : (
                      <Circle size={20} style={{ color: C.text3 }} />
                    )}
                    <span className="text-[11px]" style={{ color: C.text3 }}>
                      {item.status === "done" ? "Mark incomplete" : "Mark done"}
                    </span>
                  </button>
                )}
                <h2 className="text-[18px] font-semibold leading-tight" style={{ color: C.text }}>{item.title}</h2>
                {item.description && (
                  <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: C.text2 }}>{item.description}</p>
                )}
              </div>

              {/* Properties */}
              <div className="rounded-lg border overflow-hidden mb-5" style={{ borderColor: C.border }}>
                <div className="px-3 py-2 border-b" style={{ borderColor: "var(--rig-border-soft)", background: "var(--rig-sidebar)" }}>
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>Properties</span>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--rig-border-soft)" }}>
                  {item.priority && (
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[12px]" style={{ color: C.text2 }}>Priority</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium uppercase" style={{ background: pc.bg, color: pc.color }}>{item.priority}</span>
                    </div>
                  )}
                  {item.status && (
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[12px]" style={{ color: C.text2 }}>Status</span>
                      <span className="text-[11px] flex items-center gap-1 font-medium" style={{ color: sc.color }}>
                        <StatusIcon size={11} /> {sc.label}
                      </span>
                    </div>
                  )}
                  {item.assignee && (
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[12px] flex items-center gap-1" style={{ color: C.text2 }}><User size={12} /> Assignee</span>
                      <span className="text-[11px]" style={{ color: C.text }}>{item.assignee}</span>
                    </div>
                  )}
                  {item.due && (
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[12px] flex items-center gap-1" style={{ color: C.text2 }}><Calendar size={12} /> Due date</span>
                      <span className="text-[11px]" style={{ color: C.text }}>{item.due}</span>
                    </div>
                  )}
                  {item.source && (
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[12px]" style={{ color: C.text2 }}>Source</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: C.hover, color: C.text3 }}>{item.source}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded border"
                      style={{ borderColor: C.border, color: C.text2 }}
                    >
                      <Tag size={9} className="inline mr-1" /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Type-specific content */}
              {item.type === "task" && (
                <div className="space-y-2">
                  <button
                    onClick={() => onOpenCopilot?.(`Help me with this task: ${item.title}. ${item.description || ""}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium"
                    style={{ background: C.emeraldBg, color: C.emerald }}
                  >
                    <Bot size={13} /> Ask Jake about this task
                  </button>
                  <button
                    onClick={() => onRunCommand?.(`cd ~/Developer/rig-os-agency && echo "Task: ${item.title}"`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium border"
                    style={{ borderColor: C.border, color: C.text2 }}
                  >
                    <Terminal size={13} /> Run in terminal
                  </button>
                </div>
              )}

              {item.type === "email" && (
                <div className="space-y-2">
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium"
                    style={{ background: C.blueBg, color: C.blue }}
                  >
                    <Send size={13} /> Reply
                  </button>
                  <button
                    onClick={() => onOpenCopilot?.(`Draft a reply to this email: ${item.title}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium border"
                    style={{ borderColor: C.border, color: C.text2 }}
                  >
                    <Bot size={13} /> Draft reply with Jake
                  </button>
                </div>
              )}

              {item.type === "deal" && (
                <div className="space-y-2">
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium"
                    style={{ background: C.goldBg, color: C.gold }}
                  >
                    <ArrowRight size={13} /> Move to next stage
                  </button>
                  <button
                    onClick={() => onOpenCopilot?.(`Generate a proposal for this deal: ${item.title}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium border"
                    style={{ borderColor: C.border, color: C.text2 }}
                  >
                    Generate proposal
                  </button>
                </div>
              )}

              {item.type === "agent" && (
                <div className="space-y-2">
                  <button
                    onClick={() => onOpenCopilot?.(`Route this task to ${item.title}: ${item.description || ""}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium"
                    style={{ background: "var(--rig-purple-bg)", color: "var(--rig-purple)" }}
                  >
                    <Bot size={13} /> Assign work to this agent
                  </button>
                </div>
              )}

              {/* Raw Data Inspector */}
              {item.data && Object.keys(item.data).length > 0 && (
                <div className="mt-5 rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
                  <div className="px-3 py-2 border-b" style={{ borderColor: "var(--rig-border-soft)", background: "var(--rig-sidebar)" }}>
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>Raw Data</span>
                  </div>
                  <pre className="p-3 text-[10px] overflow-auto" style={{ color: C.text3 }}>
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
