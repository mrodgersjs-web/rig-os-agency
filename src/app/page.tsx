"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, Rocket, Wallet, TrendingUp, Code,
  Users, Bot, Newspaper, ChevronRight, Clock,
  CheckCircle2, AlertCircle, Sparkles,
} from "lucide-react";
import { LatticeHUD } from "@/components/LatticeHUD";
import { useDetail } from "@/components/DetailContext";

const C = {
  bg: "var(--rig-bg)",
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
  blue: "var(--rig-blue)",
  blueBg: "var(--rig-blue-bg)",
};

interface InboxItem { id: string; title: string; priority: string; status: string; assignee?: string; description?: string; }
interface TodayItem { id: string; title: string; priority: string; status: string; assignee?: string; description?: string; }
interface HealthCheck { status: string; detail?: string; }

export default function HomePage() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [today, setToday] = useState<TodayItem[]>([]);
  const [checks, setChecks] = useState<Record<string, HealthCheck>>({});
  const { openDetail } = useDetail();

  const load = useCallback(async () => {
    try {
      const [tasksR, healthR] = await Promise.all([
        fetch("/api/paperclip/tasks").then(r => r.json()).catch(() => ({})),
        fetch("/api/health").then(r => r.json()).catch(() => ({ checks: {} })),
      ]);
      setInbox(tasksR.inbox || []);
      setToday(tasksR.today || []);
      setChecks(healthR.checks || {});
    } catch {}
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  const inboxPending = inbox.filter(t => t.status !== "done").length;
  const todayActive = today.filter(t => t.status !== "done").length;

  const departments = [
    { name: "Operations", icon: Briefcase, href: "/paperclip", count: inboxPending, color: C.emerald, bg: C.emeraldBg, desc: `${inboxPending} in inbox` },
    { name: "Revenue", icon: Wallet, href: "/agency/revenue", count: 0, color: C.gold, bg: C.goldBg, desc: "MRR & Stripe" },
    { name: "Pipeline", icon: Rocket, href: "/agency/pipeline", count: 0, color: C.emerald, bg: C.emeraldBg, desc: "Deals & prospects" },
    { name: "Go-To-Market", icon: TrendingUp, href: "/rig-gtm", count: 0, color: C.emerald, bg: C.emeraldBg, desc: "Outreach & leads" },
    { name: "LinkedIn", icon: Users, href: "/rig-linkedin", count: 0, color: C.blue, bg: C.blueBg, desc: "Content & posting" },
    { name: "Instagram", icon: Users, href: "/rig-instagram", count: 0, color: "var(--rig-plum)", bg: "var(--rig-plum-bg)", desc: "Reels & stories" },
    { name: "Strategy", icon: TrendingUp, href: "/rig-strategy", count: 0, color: "var(--rig-red)", bg: "var(--rig-red-bg)", desc: "Competitive intel" },
    { name: "Agents", icon: Bot, href: "/agency/agents", count: 410, color: "var(--rig-purple)", bg: "var(--rig-purple-bg)", desc: "410 ready" },
    { name: "Engineering", icon: Code, href: "/rig-app", count: 0, color: "var(--rig-plum)", bg: "var(--rig-plum-bg)", desc: "RIG OS build" },
    { name: "Daily Briefing", icon: Newspaper, href: "/agency/briefing", count: 0, color: C.emerald, bg: C.emeraldBg, desc: "Jake's 10 items" },
  ];

  const openTask = (task: InboxItem | TodayItem) => {
    openDetail({
      id: task.id,
      type: "task",
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      source: "Paperclip",
      data: task,
    });
  };

  const openStat = (label: string, value: string | number, desc: string) => {
    openDetail({
      id: `stat-${label.toLowerCase()}`,
      type: "system",
      title: `${label}: ${value}`,
      description: desc,
      source: "Health API",
      data: { label, value, description: desc },
    });
  };

  const openSystemCheck = (key: string, val: HealthCheck) => {
    openDetail({
      id: `sys-${key}`,
      type: "system",
      title: `${key}: ${val.status}`,
      description: val.detail,
      status: val.status === "ok" ? "done" : val.status === "down" ? "blocked" : "pending",
      source: "Health API",
      data: { key, ...val },
    });
  };

  const openDepartment = (dept: typeof departments[0]) => {
    openDetail({
      id: `dept-${dept.name.toLowerCase()}`,
      type: "department",
      title: dept.name,
      description: dept.desc,
      source: "Navigate to department",
      data: { href: dept.href, count: dept.count },
    });
  };

  return (
    <div className="px-6 py-5 pb-20">
      <LatticeHUD />

      {/* Greeting */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-bold tracking-tight"
          style={{ color: C.text }}
        >
          {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}, Mike
        </motion.h1>
        <p className="text-[14px] mt-1" style={{ color: C.text3 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          {inboxPending > 0 ? ` · ${inboxPending} items need attention` : " · All clear"}
        </p>
      </div>

      {/* Quick Stats Row — clickable */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: "Inbox", value: inboxPending, icon: AlertCircle, color: "var(--rig-orange)", bg: "var(--rig-orange-bg)", desc: "Items pending in Paperclip inbox" },
          { label: "Active", value: todayActive, icon: Clock, color: C.blue, bg: C.blueBg, desc: "Tasks scheduled for today" },
          { label: "Agents", value: 410, icon: Bot, color: "var(--rig-purple)", bg: "var(--rig-purple-bg)", desc: "Agency + VoltAgent + RIG core agents" },
          { label: "System", value: "OK", icon: CheckCircle2, color: C.emerald, bg: C.emeraldBg, desc: "All systems operational" },
        ].map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => openStat(s.label, s.value, s.desc)}
            className="text-left rounded-lg p-4 border transition hover:shadow-md cursor-pointer"
            style={{ background: C.card, borderColor: C.border, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="grid place-items-center w-6 h-6 rounded" style={{ background: s.bg }}>
                <s.icon size={12} style={{ color: s.color }} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>{s.label}</span>
            </div>
            <div className="text-[22px] font-bold" style={{ color: C.text }}>{s.value}</div>
          </motion.button>
        ))}
      </div>

      {/* Departments Grid — clickable opens detail, with link arrow */}
      <div className="mb-8">
        <h2 className="text-[14px] font-semibold mb-3" style={{ color: C.text }}>Departments</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {departments.map((dept, i) => (
            <motion.div key={dept.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
              <div
                onClick={() => openDepartment(dept)}
                className="block rounded-lg p-3 border transition group hover:shadow-md cursor-pointer relative"
                style={{ background: C.card, borderColor: C.border }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ background: dept.bg }}>
                    <dept.icon size={14} style={{ color: dept.color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    {dept.count > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: dept.bg, color: dept.color }}>
                        {dept.count}
                      </span>
                    )}
                    <ChevronRight size={12} style={{ color: C.mute, opacity: 0, transition: "opacity 150ms" }} className="group-hover:opacity-100" />
                  </div>
                </div>
                <div className="text-[12px] font-medium mb-0.5" style={{ color: C.text }}>{dept.name}</div>
                <div className="text-[10px]" style={{ color: C.mute }}>{dept.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Priority Items + System Status (two columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Priority Items — each task is clickable */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>Priority Items</h2>
            <button onClick={() => openDetail({ id: "all-tasks", type: "task", title: "All Tasks", description: "View all tasks in Paperclip", source: "Paperclip" })} className="text-[11px] flex items-center gap-0.5" style={{ color: C.gold }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.border, background: C.card }}>
            {[...inbox.slice(0, 3), ...today.slice(0, 4)].map((task, i) => (
              <div
                key={task.id || i}
                onClick={() => openTask(task)}
                className="flex items-center gap-2.5 px-3 py-2.5 transition cursor-pointer hover:bg-black/[0.02]"
                style={{ borderBottom: i < 6 ? `1px solid var(--rig-border-soft)` : "none" }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: task.priority === "critical" ? "var(--rig-red)" :
                      task.priority === "high" ? "var(--rig-orange)" :
                      task.priority === "medium" ? C.gold : C.emerald
                  }}
                />
                <span className="text-[13px] flex-1 truncate" style={{ color: C.text }}>{task.title}</span>
                {task.assignee && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: C.hover, color: C.text3 }}>
                    {task.assignee}
                  </span>
                )}
                <ChevronRight size={12} style={{ color: C.mute }} />
              </div>
            ))}
            {inbox.length === 0 && today.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 size={20} className="mx-auto mb-1.5" style={{ color: C.emerald }} />
                <p className="text-[12px]" style={{ color: C.mute }}>No items</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status — each check is clickable */}
        <div>
          <h2 className="text-[14px] font-semibold mb-3" style={{ color: C.text }}>System Status</h2>
          <div className="rounded-lg border p-4 space-y-2.5" style={{ borderColor: C.border, background: C.card }}>
            {Object.entries(checks).map(([key, val]) => (
              <div
                key={key}
                onClick={() => openSystemCheck(key, val)}
                className="flex items-center justify-between cursor-pointer transition hover:bg-black/[0.02] -mx-2 px-2 py-0.5 rounded"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: val.status === "ok" ? C.emerald : val.status === "down" ? "var(--rig-red)" : C.gold }}
                  />
                  <span className="text-[12px] capitalize" style={{ color: C.text2 }}>{key}</span>
                </div>
                <span className="text-[10px] truncate max-w-[120px]" style={{ color: C.mute }}>
                  {val.detail?.split("(")[0]?.trim().slice(0, 30) || val.status}
                </span>
              </div>
            ))}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-1.5 pt-3 mt-2 border-t" style={{ borderColor: "var(--rig-border-soft)" }}>
              <button onClick={() => openDetail({ id: "briefing", type: "briefing", title: "Daily Briefing", description: "Jake's 10 prioritized items", source: "Jake PAI" })} className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium" style={{ background: C.emeraldBg, color: C.emerald }}>
                <Sparkles size={11} /> Briefing
              </button>
              <button onClick={() => openDetail({ id: "agents", type: "department", title: "Agent Fleet", description: "410 agents across 8 departments", source: "Agency", data: { href: "/agency/agents" } })} className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium" style={{ background: "var(--rig-purple-bg)", color: "var(--rig-purple)" }}>
                <Bot size={11} /> Agents
              </button>
              <button onClick={() => openDetail({ id: "doctrine", type: "system", title: "RIG Doctrine", description: "Operating procedures and gates", source: "RIG" })} className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium" style={{ background: "var(--rig-red-bg)", color: "var(--rig-red)" }}>
                Doctrine
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
