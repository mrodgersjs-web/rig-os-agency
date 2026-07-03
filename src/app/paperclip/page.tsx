"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox, CheckCircle2, Circle, Clock, AlertTriangle,
  Plus, Zap, Activity, X, ChevronRight, Trash2, User,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignee: string;
  due: string;
  tags: string[];
}

interface Activity {
  id: string;
  agent: string;
  action: string;
  time: string;
  color: string;
}

interface PaperclipData {
  inbox: Task[];
  today: Task[];
  activity: Activity[];
}

const priorityColor: Record<string, string> = {
  critical: "#ef4444",
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#60a5fa",
};

const statusIcon = (status: string) => {
  switch (status) {
    case "done": return <CheckCircle2 size={14} className="text-emerald-500" />;
    case "in-progress": return <Clock size={14} className="text-orange-400" />;
    case "draft": return <Circle size={14} className="text-blue-400" />;
    default: return <Circle size={14} className="text-zinc-500" />;
  }
};

export default function PaperclipPage() {
  const [data, setData] = useState<PaperclipData>({ inbox: [], today: [], activity: [] });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    try {
      const r = await fetch("/api/paperclip/tasks");
      const d = await r.json();
      setData(d);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleInbox = async (task: Task) => {
    const newStatus = task.status === "done" ? "pending" : "done";
    await fetch("/api/paperclip/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, section: "inbox", updates: { status: newStatus } }),
    });
    loadData();
  };

  const inboxCount = data.inbox.filter(t => t.status !== "done").length;
  const todayActive = data.today.filter(t => t.status !== "done").length;
  const todayDone = data.today.filter(t => t.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "var(--cream)" }}>
            Paperclip
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--cream-mute)" }}>
            Workspace · {inboxCount} inbox items · {todayActive} active · {todayDone} done
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: "rgba(212,165,116,0.16)", color: "var(--gold)" }}>
            <Plus size={14} /> New Task
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: "rgba(90,184,150,0.16)", color: "#5ab896" }}>
            <Zap size={14} /> Generate Briefing
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Inbox", value: inboxCount, icon: Inbox, color: "#fb923c" },
          { label: "Active", value: todayActive, icon: Clock, color: "#60a5fa" },
          { label: "Done", value: todayDone, icon: CheckCircle2, color: "#22c55e" },
          { label: "Agents", value: data.activity.length, icon: Activity, color: "#a855f7" },
        ].map((s) => (
          <div key={s.label} className="panel p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} style={{ color: s.color }} />
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-mute)" }}>{s.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--cream)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Inbox */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Inbox size={16} style={{ color: "#fb923c" }} />
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>Inbox</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(251,146,60,0.2)", color: "#fb923c" }}>{inboxCount}</span>
          </div>
          {data.inbox.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedTask(task)}
              className="panel p-4 rounded-xl cursor-pointer hover:border-[var(--gold)] transition"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleInbox(task); }}
                  className="mt-0.5"
                >
                  {task.status === "done" ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} style={{ color: "var(--cream-mute)" }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: priorityColor[task.priority] }} />
                    <span className="text-[12px] font-medium truncate" style={{ color: task.status === "done" ? "var(--cream-mute)" : "var(--cream)", textDecoration: task.status === "done" ? "line-through" : "none" }}>
                      {task.title}
                    </span>
                  </div>
                  <p className="text-[11px] truncate" style={{ color: "var(--cream-mute)" }}>{task.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] uppercase tracking-wider" style={{ color: priorityColor[task.priority] }}>{task.priority}</span>
                    {task.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "var(--cream-mute)" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Today Board */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} style={{ color: "#60a5fa" }} />
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>Today</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.2)", color: "#60a5fa" }}>{todayActive}</span>
          </div>
          {data.today.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedTask(task)}
              className="panel p-4 rounded-xl cursor-pointer hover:border-[var(--gold)] transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {statusIcon(task.status)}
                  <span className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{task.title}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: priorityColor[task.priority] }} />
              </div>
              <p className="text-[11px] mb-2" style={{ color: "var(--cream-mute)" }}>{task.description}</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <User size={10} style={{ color: "var(--cream-mute)" }} />
                  <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{task.assignee}</span>
                </div>
                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>·</span>
                <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{task.due}</span>
                {task.tags.slice(0,2).map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "var(--cream-mute)" }}>{tag}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} style={{ color: "#a855f7" }} />
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>Agent Activity</h2>
          </div>
          {data.activity.map((act) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel p-3 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="grid place-items-center w-8 h-8 rounded-lg shrink-0 text-[10px] font-bold" style={{ background: `${act.color}22`, color: act.color }}>
                  {act.agent.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{act.agent}</span>
                    <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>{act.time}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--cream-dim)" }}>{act.action}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.3)" }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[420px] flex flex-col"
              style={{ background: "var(--bg-deep)", borderLeft: "1px solid var(--line-soft)" }}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--line-soft)" }}>
                <span className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>Task Detail</span>
                <button onClick={() => setSelectedTask(null)} className="grid place-items-center w-8 h-8 rounded-lg hover:bg-white/5">
                  <X size={18} style={{ color: "var(--cream-dim)" }} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: priorityColor[selectedTask.priority] }} />
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: priorityColor[selectedTask.priority] }}>{selectedTask.priority}</span>
                    <span className="text-[10px]" style={{ color: "var(--cream-mute)" }}>· {selectedTask.status}</span>
                  </div>
                  <h3 className="text-[16px] font-bold mb-2" style={{ color: "var(--cream)" }}>{selectedTask.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--cream-dim)" }}>{selectedTask.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t" style={{ borderColor: "var(--line-soft)" }}>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Assignee</div>
                    <div className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{selectedTask.assignee}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-mute)" }}>Due</div>
                    <div className="text-[12px] font-medium" style={{ color: "var(--cream)" }}>{selectedTask.due}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedTask.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "var(--cream-dim)" }}>#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t flex gap-2" style={{ borderColor: "var(--line-soft)" }}>
                <button className="flex-1 py-2 rounded-lg text-[12px] font-medium" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>Complete</button>
                <button className="flex-1 py-2 rounded-lg text-[12px] font-medium" style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>Edit</button>
                <button className="py-2 px-3 rounded-lg" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}><Trash2 size={14} /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
