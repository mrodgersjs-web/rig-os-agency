"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Clock, Plus, X, Search,
  Filter, MoreHorizontal, Calendar, User, Tag,
  Zap, Inbox, ChevronDown, Briefcase,
} from "lucide-react";

// ─── Types ───
interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in-progress" | "done" | "draft";
  assignee: string | null;
  due_date: string | null;
  tags: string;
  section: string;
  created_at: string;
}

interface AgentActivity {
  id: string;
  agent_name: string;
  action: string;
  created_at: string;
  metadata: string;
}

// ─── RIG Design Studio Color Tokens (Light Theme) ───
const colors = {
  bg: "#FAFAF8",
  card: "#FFFFFF",
  sidebar: "#F4F2EE",
  border: "#E8E5DF",
  borderSoft: "#F0EEE9",
  text: "#2D2438",
  text2: "#4A4356",
  text3: "#6B6478",
  mute: "#9B94A8",
  hover: "#ECE9E4",
  active: "#E3DFD8",
  gold: "#C4904A",
  goldBg: "#F5EDE0",
  emerald: "#4A9D7E",
  emeraldBg: "#E8F3EE",
  plum: "#B85675",
  plumBg: "#F8E8EE",
  blue: "#2563EB",
  blueBg: "#EFF4FE",
  red: "#D14545",
  redBg: "#FCEAEA",
  orange: "#DB7633",
  orangeBg: "#FCF0E6",
  yellowBg: "#F5EDE0",
  yellow: "#C4904A",
};

const priorityConfig = {
  critical: { color: colors.red, bg: colors.redBg },
  high: { color: colors.orange, bg: colors.orangeBg },
  medium: { color: colors.yellow, bg: colors.yellowBg },
  low: { color: colors.emerald, bg: colors.emeraldBg },
};

const statusConfig = {
  done: { color: colors.emerald, bg: colors.emeraldBg, icon: CheckCircle2, label: "Done" },
  "in-progress": { color: colors.blue, bg: colors.blueBg, icon: Clock, label: "In Progress" },
  draft: { color: colors.mute, bg: colors.hover, icon: Circle, label: "Draft" },
  pending: { color: colors.text3, bg: colors.borderSoft, icon: Circle, label: "Pending" },
};

const agentColors: Record<string, { color: string; bg: string }> = {
  "Jake PAI": { color: colors.emerald, bg: colors.emeraldBg },
  Hermes: { color: colors.blue, bg: colors.blueBg },
  "Improvement Engine": { color: colors.gold, bg: colors.goldBg },
  "Marcus Vale": { color: colors.emerald, bg: colors.emeraldBg },
  "Sarah Chen": { color: colors.blue, bg: colors.blueBg },
};

// ─── Component ───
export default function PaperclipPage() {
  const [inbox, setInbox] = useState<Task[]>([]);
  const [today, setToday] = useState<Task[]>([]);
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      const r = await fetch("/api/paperclip/tasks");
      const d = await r.json();
      setInbox(d.inbox || []);
      setToday(d.today || []);
      setActivity(d.activity || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "done" ? "pending" : "done";
    await fetch("/api/paperclip/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, updates: { status: newStatus } }),
    });
    loadData();
  };

  const filteredToday = today.filter(t => {
    if (filter !== "all" && t.priority !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const inboxPending = inbox.filter(t => t.status !== "done");
  const todayPending = today.filter(t => t.status !== "done");
  const todayDone = today.filter(t => t.status === "done");

  // ─── Notion-style layout ───
  return (
    <div className="flex h-[calc(100vh-60px)]">
      {/* ─── Left Panel: Inbox (Notion-style sidebar) ─── */}
      <div
        className="w-[280px] shrink-0 border-r flex flex-col overflow-hidden"
        style={{ background: colors.card, borderColor: colors.border }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Inbox size={16} style={{ color: colors.gold }} />
              <span className="text-[13px] font-semibold" style={{ color: colors.text }}>Inbox</span>
              {inboxPending.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: colors.goldBg, color: colors.gold }}
                >
                  {inboxPending.length}
                </span>
              )}
            </div>
            <button className="grid place-items-center w-6 h-6 rounded hover:bg-black/5">
              <Plus size={14} style={{ color: colors.text3 }} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: colors.mute }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter inbox..."
              className="w-full pl-7 pr-2 py-1.5 text-[12px] rounded-md border-none outline-none"
              style={{ background: colors.sidebar, color: colors.text }}
            />
          </div>
        </div>

        {/* Inbox Items */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {inboxPending.map((task) => {
            const pc = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            return (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="w-full flex items-start gap-2.5 px-2 py-2 rounded-md text-left transition hover:bg-black/3"
                style={{ borderBottom: `1px solid ${colors.borderSoft}` }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTask(task); }}
                  className="mt-0.5 shrink-0"
                >
                  <Circle size={15} style={{ color: colors.mute }} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pc.color }} />
                    <span className="text-[12px] font-medium truncate" style={{ color: colors.text }}>
                      {task.title}
                    </span>
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar size={10} style={{ color: colors.mute }} />
                      <span className="text-[10px]" style={{ color: colors.mute }}>{task.due_date}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {inboxPending.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: colors.emerald }} />
              <p className="text-[12px]" style={{ color: colors.mute }}>Inbox zero</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Center: Today Board ─── */}
      <div className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 px-6 py-3 border-b flex items-center gap-3"
          style={{ background: colors.bg, borderColor: colors.border }}
        >
          {/* View Toggle */}
          <div className="flex items-center rounded-md overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
            <button
              onClick={() => setView("board")}
              className="px-3 py-1 text-[11px] font-medium"
              style={{ background: view === "board" ? colors.active : "transparent", color: view === "board" ? colors.text : colors.text3 }}
            >Board</button>
            <button
              onClick={() => setView("list")}
              className="px-3 py-1 text-[11px] font-medium"
              style={{ background: view === "list" ? colors.active : "transparent", color: view === "list" ? colors.text : colors.text3 }}
            >List</button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5">
            {["all", "critical", "high", "medium"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-[11px] px-2.5 py-1 rounded-md font-medium capitalize transition"
                style={{
                  background: filter === f
                    ? (f === "critical" ? colors.redBg : f === "high" ? colors.orangeBg : f === "medium" ? colors.yellowBg : colors.active)
                    : "transparent",
                  color: filter === f
                    ? (f === "critical" ? colors.red : f === "high" ? colors.orange : f === "medium" ? colors.yellow : colors.text)
                    : colors.text3,
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Count */}
          <span className="text-[11px]" style={{ color: colors.mute }}>
            {todayPending.length} active · {todayDone.length} done
          </span>

          <button
            className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-medium"
            style={{ background: colors.goldBg, color: colors.gold }}
          >
            <Plus size={12} /> New Task
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 pb-20">
          {view === "list" ? (
            // ─── List View (Notion database table) ───
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
              {/* Header */}
              <div
                className="flex items-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ background: colors.sidebar, color: colors.mute, borderBottom: `1px solid ${colors.border}` }}
              >
                <div className="w-6" />
                <div className="flex-1">Task</div>
                <div className="w-24">Priority</div>
                <div className="w-32">Assignee</div>
                <div className="w-24">Status</div>
                <div className="w-24">Due</div>
              </div>
              {/* Rows */}
              {filteredToday.map((task) => {
                const pc = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                const sc = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="w-full flex items-center px-3 py-2 text-left text-[12px] transition hover:bg-black/2"
                    style={{ borderBottom: `1px solid ${colors.borderSoft}` }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleTask(task); }}
                      className="w-6 shrink-0"
                    >
                      {task.status === "done"
                        ? <CheckCircle2 size={15} style={{ color: colors.emerald }} />
                        : <Circle size={15} style={{ color: colors.mute }} />}
                    </button>
                    <span
                      className="flex-1 truncate"
                      style={{
                        color: task.status === "done" ? colors.mute : colors.text,
                        textDecoration: task.status === "done" ? "line-through" : "none",
                      }}
                    >
                      {task.title}
                    </span>
                    <div className="w-24">
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: pc.bg, color: pc.color }}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="w-32 truncate" style={{ color: colors.text3 }}>{task.assignee || "—"}</div>
                    <div className="w-24">
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="w-24 text-[11px]" style={{ color: colors.mute }}>{task.due_date || "—"}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            // ─── Board View (Kanban) ───
            <div className="flex gap-4 overflow-x-auto pb-4">
              {["pending", "in-progress", "done"].map((stage) => {
                const stageTasks = filteredToday.filter(t => {
                  if (stage === "done") return t.status === "done";
                  if (stage === "in-progress") return t.status === "in-progress";
                  return t.status === "pending" || t.status === "draft";
                });
                const sc = statusConfig[stage as keyof typeof statusConfig] || statusConfig.pending;

                return (
                  <div key={stage} className="w-[300px] shrink-0">
                    {/* Column Header */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: sc.color }} />
                      <span className="text-[12px] font-semibold" style={{ color: colors.text }}>{sc.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: colors.hover, color: colors.text3 }}>
                        {stageTasks.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {stageTasks.map((task) => {
                        const pc = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                        const tags = (() => { try { return JSON.parse(task.tags || "[]"); } catch { return []; } })();
                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSelectedTask(task)}
                            className="rounded-lg p-3 cursor-pointer transition hover:shadow-md"
                            style={{ background: colors.card, border: `1px solid ${colors.border}`, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                          >
                            {/* Priority bar */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                                style={{ background: pc.bg, color: pc.color }}
                              >
                                {task.priority}
                              </span>
                              <button onClick={(e) => { e.stopPropagation(); toggleTask(task); }}>
                                {task.status === "done"
                                  ? <CheckCircle2 size={14} style={{ color: colors.emerald }} />
                                  : <Circle size={14} style={{ color: colors.mute }} />}
                              </button>
                            </div>

                            {/* Title */}
                            <div
                              className="text-[13px] font-medium mb-2 leading-snug"
                              style={{
                                color: task.status === "done" ? colors.mute : colors.text,
                                textDecoration: task.status === "done" ? "line-through" : "none",
                              }}
                            >
                              {task.title}
                            </div>

                            {/* Description */}
                            {task.description && (
                              <p className="text-[11px] mb-2.5 leading-relaxed" style={{ color: colors.text3 }}>
                                {task.description.length > 80 ? task.description.slice(0, 80) + "..." : task.description}
                              </p>
                            )}

                            {/* Tags */}
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {tags.slice(0, 3).map((tag: string) => (
                                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: colors.hover, color: colors.text3 }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: colors.borderSoft }}>
                              {task.assignee && (
                                <div className="flex items-center gap-1.5">
                                  <div className="grid place-items-center w-5 h-5 rounded-full text-[8px] font-bold"
                                    style={{ background: colors.blueBg, color: colors.blue }}
                                  >
                                    {task.assignee.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                  </div>
                                  <span className="text-[10px]" style={{ color: colors.text3 }}>{task.assignee}</span>
                                </div>
                              )}
                              {task.due_date && (
                                <span className="text-[10px]" style={{ color: colors.mute }}>{task.due_date}</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}

                      {stageTasks.length === 0 && (
                        <div className="text-center py-8 rounded-lg" style={{ background: colors.sidebar, border: `1px dashed ${colors.border}` }}>
                          <p className="text-[11px]" style={{ color: colors.mute }}>No tasks</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Panel: Agent Activity ─── */}
      <div
        className="w-[260px] shrink-0 border-l hidden lg:flex flex-col overflow-hidden"
        style={{ background: colors.card, borderColor: colors.border }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: colors.gold }} />
            <span className="text-[13px] font-semibold" style={{ color: colors.text }}>Agent Activity</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {activity.map((act) => {
            const ac = agentColors[act.agent_name] || { color: colors.gold, bg: colors.goldBg };
            return (
              <div key={act.id} className="flex items-start gap-2.5 px-2 py-2.5 rounded-md hover:bg-black/2">
                <div className="grid place-items-center w-7 h-7 rounded-lg shrink-0 text-[9px] font-bold"
                  style={{ background: ac.bg, color: ac.color }}
                >
                  {act.agent_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold truncate" style={{ color: colors.text }}>{act.agent_name}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: colors.text3 }}>{act.action}</p>
                  <span className="text-[9px]" style={{ color: colors.mute }}>
                    {new Date(act.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}

          {activity.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[11px]" style={{ color: colors.mute }}>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Detail Panel (slides in from right) ─── */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(45,36,56,0.15)" }}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[400px] flex flex-col"
              style={{ background: colors.card, borderLeft: `1px solid ${colors.border}`, boxShadow: "-8px 0 32px rgba(0,0,0,0.06)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-2">
                  {(() => {
                    const sc = statusConfig[selectedTask.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = sc.icon;
                    return (
                      <>
                        <StatusIcon size={14} style={{ color: sc.color }} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: sc.color }}>
                          {sc.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
                <button onClick={() => setSelectedTask(null)} className="grid place-items-center w-7 h-7 rounded hover:bg-black/5">
                  <X size={16} style={{ color: colors.text3 }} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                {/* Priority + Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const pc = priorityConfig[selectedTask.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                    return (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                        style={{ background: pc.bg, color: pc.color }}
                      >
                        {selectedTask.priority}
                      </span>
                    );
                  })()}
                  {(() => {
                    try { return JSON.parse(selectedTask.tags || "[]"); } catch { return []; }
                  })().map((tag: string) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded" style={{ background: colors.hover, color: colors.text3 }}>
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-[20px] font-bold leading-tight" style={{ color: colors.text }}>
                  {selectedTask.title}
                </h2>

                {/* Description */}
                {selectedTask.description && (
                  <p className="text-[14px] leading-relaxed" style={{ color: colors.text2 }}>
                    {selectedTask.description}
                  </p>
                )}

                {/* Properties */}
                <div className="space-y-2.5 pt-4 border-t" style={{ borderColor: colors.borderSoft }}>
                  {[
                    { label: "Assignee", value: selectedTask.assignee, icon: User },
                    { label: "Due Date", value: selectedTask.due_date, icon: Calendar },
                    { label: "Section", value: selectedTask.section, icon: Briefcase },
                    { label: "Created", value: new Date(selectedTask.created_at).toLocaleDateString(), icon: Clock },
                  ].filter(p => p.value).map(prop => (
                    <div key={prop.label} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-24 shrink-0">
                        <prop.icon size={12} style={{ color: colors.mute }} />
                        <span className="text-[11px]" style={{ color: colors.mute }}>{prop.label}</span>
                      </div>
                      <span className="text-[12px] font-medium" style={{ color: colors.text }}>{prop.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t flex gap-2" style={{ borderColor: colors.border }}>
                <button
                  onClick={() => { toggleTask(selectedTask); setSelectedTask(null); }}
                  className="flex-1 py-2 rounded-md text-[12px] font-medium"
                  style={{ background: colors.emeraldBg, color: colors.emerald }}
                >
                  {selectedTask.status === "done" ? "Reopen" : "Mark Done"}
                </button>
                <button
                  className="flex-1 py-2 rounded-md text-[12px] font-medium"
                  style={{ background: colors.hover, color: colors.text2 }}
                >Edit</button>
                <button className="py-2 px-3 rounded-md" style={{ background: colors.redBg, color: colors.red }}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
