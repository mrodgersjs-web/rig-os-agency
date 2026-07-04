"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { PageHeader, StatCard } from "@/components/DepartmentUI";
import { CheckCircle2, Users, Paperclip, Bot, Terminal, ArrowRight, Clock } from "lucide-react";

const C = {
  card: "var(--rig-card)", text: "var(--rig-text)", text2: "var(--rig-text-2)", text3: "var(--rig-text-3)",
  mute: "var(--rig-text-mute)", border: "var(--rig-border)", gold: "var(--rig-gold)", goldBg: "var(--rig-gold-bg)",
  emerald: "var(--rig-emerald)", emeraldBg: "var(--rig-emerald-bg)", red: "var(--rig-red)", redBg: "var(--rig-red-bg)",
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assignee: string | null;
  due_date: string | null;
  section: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/paperclip/tasks");
      const d = await r.json();
      const all = [...(d.inbox || []), ...(d.today || []), ...(d.activity || [])];
      const found = all.find((t: Task) => t.id === id);
      setTask(found || null);
    } catch {
      setTask(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="px-6 py-5">Loading task...</div>;
  if (!task) return <div className="px-6 py-5">Task not found</div>;

  const priorityColor = (p: string) => {
    if (p === "critical") return { bg: C.redBg, color: C.red };
    if (p === "high") return { bg: "var(--rig-orange-bg)", color: "var(--rig-orange)" };
    if (p === "medium") return { bg: C.goldBg, color: C.gold };
    return { bg: C.emeraldBg, color: C.emerald };
  };
  const pc = priorityColor(task.priority);

  const statusColor = (s: string) => {
    if (s === "done") return { bg: C.emeraldBg, color: C.emerald };
    if (s === "in progress") return { bg: C.goldBg, color: C.gold };
    return { bg: "var(--rig-hover)", color: C.mute };
  };
  const sc = statusColor(task.status);

  return (
    <div className="px-6 py-5 pb-20">
      <PageBreadcrumbs items={[{ label: "Paperclip", href: "/paperclip" }, { label: task.title }]} />
      <PageHeader title={task.title} subtitle={`${task.section} · ${task.status}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Priority" value={task.priority} icon={<span style={{ color: pc.color }}>!</span>} color={pc.color} bg={pc.bg} />
        <StatCard label="Status" value={task.status} icon={<span style={{ color: sc.color }}>●</span>} color={sc.color} bg={sc.bg} />
        <StatCard label="Assignee" value={task.assignee || "Unassigned"} icon={<Users size={12} style={{ color: "var(--rig-blue)" }} />} color="var(--rig-blue)" bg="var(--rig-blue-bg)" />
        <StatCard label="Due" value={task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"} icon={<Clock size={12} style={{ color: C.gold }} />} color={C.gold} bg={C.goldBg} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {task.description && (
            <div className="rounded-lg border p-4" style={{ background: C.card, borderColor: C.border }}>
              <div className="text-[12px] uppercase tracking-wider font-semibold mb-2" style={{ color: C.mute }}>Description</div>
              <p className="text-[13px]" style={{ color: C.text2 }}>{task.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.mute }}>Actions</div>
          {[
            { icon: CheckCircle2, label: "Mark Complete", desc: "Finish the task", color: C.emerald },
            { icon: Users, label: "Delegate", desc: "Reassign to another agent", color: C.gold },
            { icon: Bot, label: "Ask Jake", desc: "Get Jake's help", color: C.purple },
            { icon: Terminal, label: "Run Terminal", desc: "Execute related command", color: C.gold },
            { icon: Paperclip, label: "Attach Note", desc: "Add a note or file", color: C.gold },
          ].map(a => (
            <Link
              key={a.label}
              href={`/paperclip/tasks/${id}/actions`}
              className="flex items-center gap-3 rounded-lg p-3 border transition hover:shadow-md"
              style={{ background: C.card, borderColor: C.border }}
            >
              <div className="grid place-items-center w-8 h-8 rounded-lg" style={{ background: a.color + "15", color: a.color }}>
                <a.icon size={14} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium" style={{ color: C.text }}>{a.label}</div>
                <div className="text-[11px]" style={{ color: C.text3 }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
