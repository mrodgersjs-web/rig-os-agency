"use client";

// ── RIG OS Agency — Agent Operations Center ───────────────────────────────────
// Per-agent command surface. Wires /api/agency/agents to show the canonical
// profile, capabilities, runtime metadata, peers in the same category, and a
// quick action panel that hits /api/action for assign/run/configure/logs.
//
// Routes:
//   /agency/agents/[id]                 — this surface
//   /api/agency/agents                  — supplies registry (423 agents)
//   /api/action                         — issues scope=agent actions
//
// Midnight Aubergine · auto-refresh · doctrine footer.

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Play, Settings, ScrollText, CheckCircle2, ArrowRight,
  Zap, Hash, Clock, RefreshCw, Terminal, ChevronRight,
  Shield, Sparkles, BookOpen, Copy, Database, Code2, Users, Activity,
} from "lucide-react";

const C = {
  bg: "var(--bg-deep)", bgMid: "var(--bg-mid)", card: "var(--bg-card)",
  elev: "var(--bg-elev)", text: "var(--cream)", text2: "var(--cream-soft)",
  text3: "var(--cream-dim)", textMute: "var(--cream-mute)",
  border: "var(--line-soft)", borderHot: "var(--line)",
  gold: "var(--gold)", goldSoft: "var(--gold-soft)", goldDeep: "var(--gold-deep)",
  emerald: "var(--emerald)", emeraldDim: "var(--emerald-dim)",
  plum: "var(--plum)", rust: "var(--rust)",
  blue: "#60a5fa", cyan: "#22d3ee", purple: "#c084fc",
};

interface Agent {
  id: string;
  name: string;
  category: string;
  role: string;
  capabilities: string[];
  invocationPath?: string;
  status: string;
}

interface AgentsPayload {
  agents?: Agent[];
  total?: number;
  stats?: {
    total: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  };
  goalLoops?: { total: number; groups: Record<string, number> };
  skills?: number;
  repos?: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

const STATUS_META: Record<string, { color: string; label: string }> = {
  active:   { color: "var(--emerald)", label: "Active" },
  idle:     { color: "var(--gold)",    label: "Idle" },
  unloaded: { color: "var(--cream-dim)", label: "Unloaded" },
};

const CATEGORY_META: Record<string, { color: string; label: string; accent: string }> = {
  rig_core:   { color: "var(--gold)",    accent: "var(--gold)",    label: "RIG Core" },
  agency:     { color: "var(--emerald)", accent: "var(--emerald)", label: "Agency" },
  voltagent:  { color: "#c084fc",        accent: "#c084fc",        label: "VoltAgent" },
  rig_expert: { color: "#60a5fa",        accent: "#60a5fa",        label: "RIG Expert" },
};

function fmtNumber(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

function inferTier(capabilities: string[]): { tier: string; color: string } {
  if (!capabilities || capabilities.length === 0) return { tier: "Empty", color: "var(--cream-mute)" };
  if (capabilities.length >= 6) return { tier: "S", color: "var(--gold)" };
  if (capabilities.length >= 4) return { tier: "A", color: "var(--emerald)" };
  if (capabilities.length >= 2) return { tier: "B", color: "#60a5fa" };
  return { tier: "C", color: "var(--cream-dim)" };
}

export default function AgentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [payload, setPayload] = useState<AgentsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [actionInput, setActionInput] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await fetch("/api/agency/agents", { cache: "no-store" });
      const d = (await r.json()) as AgentsPayload;
      setPayload(d);
      const list = d.agents || [];
      setAllAgents(list);
      const found = list.find((a) => a.id === id) || null;
      setAgent(found);
      setLastFetch(new Date());
    } catch {
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const i = setInterval(() => load(true), 60_000);
    return () => clearInterval(i);
  }, [load]);

  const peers = useMemo(() => {
    if (!agent || !allAgents.length) return [];
    return allAgents
      .filter((a) => a.id !== agent.id && a.category === agent.category)
      .slice(0, 8);
  }, [agent, allAgents]);

  const siblingByStatus = useMemo(() => {
    if (!payload?.stats?.byCategory) return 0;
    return payload.stats.byCategory[agent?.category || ""] || 0;
  }, [payload, agent]);

  const tier = useMemo(() => inferTier(agent?.capabilities || []), [agent]);

  const meta = agent ? (CATEGORY_META[agent.category] || { color: "var(--cream-dim)", accent: "var(--cream-dim)", label: agent.category }) : null;
  const statusMeta = agent ? (STATUS_META[agent.status] || { color: "var(--cream-dim)", label: agent.status }) : null;

  const runAction = useCallback(
    async (actionId: string, requiresInput: boolean) => {
      if (requiresInput && !actionInput) {
        setPendingAction(actionId);
        return;
      }
      setRunning(actionId);
      setResult(null);
      try {
        const payload: any = {};
        if (requiresInput) payload.task = actionInput;
        const r = await fetch("/api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "agent", action: actionId, id, payload }),
        });
        const data = await r.json();
        setResult(data);
        setActionInput("");
        setPendingAction(null);
      } catch (e: any) {
        setResult({ error: e.message || "Action failed" });
      }
      setRunning(null);
    },
    [id, actionInput],
  );

  const copyInvocation = useCallback(() => {
    if (!agent?.invocationPath) return;
    navigator.clipboard.writeText(agent.invocationPath).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [agent]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading && !agent) {
    return (
      <div className="px-6 py-10">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: C.textMute }}>
          <RefreshCw size={14} className="animate-spin" style={{ color: C.gold }} />
          Loading agent {id} from /api/agency/agents…
        </div>
      </div>
    );
  }

  // ── Not Found ──────────────────────────────────────────────────────────
  if (!agent) {
    return (
      <div className="px-6 py-10 max-w-[800px]">
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.textMute, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
          Agency Operations · Agents
        </div>
        <h1 className="text-2xl mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: C.text }}>
          Agent not found
        </h1>
        <p className="text-[13px] mb-4" style={{ color: C.text3 }}>
          No agent with id <code style={{ color: C.gold }}>{id}</code> exists in the registry. The registry
          ships {payload?.total ?? 423} agents across {Object.keys(payload?.stats?.byCategory || {}).length || 4} categories.
        </p>
        <Link
          href="/agency/agents"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px]"
          style={{ background: "var(--bg-card)", color: C.gold, border: `1px solid ${C.border}` }}
        >
          <ArrowRight size={12} /> Back to agent catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-8 space-y-6">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <motion.header
        initial={fadeUp.initial}
        animate={fadeUp.animate}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/agency/agents"
            className="text-[10px] uppercase tracking-[0.3em] hover:underline"
            style={{ color: C.textMute, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
          >
            Agents
          </Link>
          <ChevronRight size={10} style={{ color: C.textMute }} />
          <span
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: C.textMute, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
          >
            Agent Operations Center
          </span>
        </div>

        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div
              className="grid place-items-center w-14 h-14 rounded-2xl shrink-0"
              style={{
                background: `${meta?.accent}22`,
                color: meta?.accent,
                boxShadow: `0 0 30px -10px ${meta?.accent}`,
              }}
            >
              <Bot size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="text-[10px] uppercase tracking-[0.25em] px-2 py-0.5 rounded-full"
                  style={{
                    background: `${meta?.accent}22`,
                    color: meta?.accent,
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {meta?.label}
                </span>
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5"
                  style={{
                    background: `${statusMeta?.color}22`,
                    color: statusMeta?.color,
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: statusMeta?.color }}>●</span>
                  {statusMeta?.label}
                </span>
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: `${tier.color}22`,
                    color: tier.color,
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  Tier {tier.tier}
                </span>
              </div>
              <h1
                className="text-3xl tracking-tight"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: C.text }}
              >
                {agent.name}
              </h1>
              <p className="text-[13px] mt-1.5 line-clamp-2" style={{ color: C.text3 }}>
                {agent.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] shrink-0" style={{ color: C.textMute }}>
            {lastFetch && (
              <>
                <Clock size={11} />
                <span>Updated {lastFetch.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              </>
            )}
            <button
              onClick={() => load()}
              disabled={loading}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] disabled:opacity-50"
              style={{
                background: "var(--bg-card)",
                color: C.text2,
                border: `1px solid ${C.border}`,
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
              }}
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── KPI Strip ────────────────────────────────────────────────── */}
      <motion.section
        initial={fadeUp.initial}
        animate={fadeUp.animate}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Capabilities", value: (agent.capabilities?.length || 0).toString(), sub: "registered skills", icon: <Zap size={14} />, color: C.gold },
            { label: "Category Peers", value: fmtNumber(Math.max(0, siblingByStatus - 1)), sub: "same category", icon: <Users size={14} />, color: meta?.accent || C.emerald },
            { label: "Total Agents", value: fmtNumber(payload?.stats?.total), sub: "in registry", icon: <Database size={14} />, color: C.cyan },
            { label: "Goal Loops", value: fmtNumber(payload?.goalLoops?.total), sub: "across 8 groups", icon: <Activity size={14} />, color: C.purple },
            { label: "Skills Loaded", value: fmtNumber(payload?.skills), sub: "global surface", icon: <BookOpen size={14} />, color: C.blue },
            { label: "Repos Mapped", value: fmtNumber(payload?.repos), sub: "source trees", icon: <Code2 size={14} />, color: C.emerald },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-3 border"
              style={{ background: "var(--bg-card)", borderColor: C.border }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: C.text3 }}>
                  {kpi.label}
                </span>
              </div>
              <div
                className="text-xl"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: kpi.color }}
              >
                {kpi.value}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: C.textMute }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Body: 2-col grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left col: profile + capabilities + invocation ────────── */}
        <motion.section
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Profile */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} style={{ color: C.gold }} />
              <h2 className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>
                Role Profile
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>
              {agent.role}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.textMute }}>
                  Agent ID
                </div>
                <code
                  className="inline-block px-2 py-1 rounded font-mono text-[11px]"
                  style={{ background: "var(--bg-deep)", color: C.gold }}
                >
                  {agent.id}
                </code>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.textMute }}>
                  Category
                </div>
                <span
                  className="inline-block px-2 py-1 rounded text-[11px]"
                  style={{ background: `${meta?.accent}22`, color: meta?.accent, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
                >
                  {meta?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: C.border }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: C.gold }} />
                <h2 className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>
                  Capabilities
                </h2>
              </div>
              <span className="text-[10px]" style={{ color: C.textMute }}>
                {agent.capabilities?.length || 0} registered
              </span>
            </div>
            {agent.capabilities && agent.capabilities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-1 rounded-md border font-mono"
                    style={{
                      background: `${C.gold}10`,
                      borderColor: `${C.gold}33`,
                      color: C.gold,
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            ) : (
              <div
                className="text-[12px] rounded-lg p-3 text-center"
                style={{ background: "var(--bg-deep)", color: C.textMute, border: `1px dashed ${C.border}` }}
              >
                No capabilities registered for this agent.
              </div>
            )}
          </div>

          {/* Invocation */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-3">
              <Terminal size={14} style={{ color: C.cyan }} />
              <h2 className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>
                Invocation Path
              </h2>
            </div>
            <div
              className="rounded-lg p-3 flex items-center gap-2 font-mono text-[12px]"
              style={{ background: "var(--bg-deep)", color: C.gold, border: `1px solid ${C.border}` }}
            >
              <Terminal size={12} style={{ color: C.gold }} />
              <code className="flex-1 break-all">{agent.invocationPath || agent.id}</code>
              <button
                onClick={copyInvocation}
                className="grid place-items-center w-7 h-7 rounded transition shrink-0"
                style={{
                  background: copied ? `${C.emerald}22` : "transparent",
                  color: copied ? C.emerald : C.text3,
                  border: `1px solid ${C.border}`,
                }}
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              </button>
            </div>
            <p className="text-[11px] mt-2" style={{ color: C.textMute }}>
              Run this command in a RIG conductor (Hermes, Claude Code, Codex) to engage the agent directly.
              Local-first; LAN endpoints preferred over cloud.
            </p>
          </div>

          {/* Peers in same category */}
          {peers.length > 0 && (
            <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: C.border }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={14} style={{ color: meta?.accent }} />
                  <h2 className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>
                    Peers · {meta?.label}
                  </h2>
                </div>
                <Link
                  href="/agency/agents"
                  className="text-[10px] flex items-center gap-1 hover:underline"
                  style={{ color: C.gold }}
                >
                  View all <ArrowRight size={10} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {peers.map((p) => {
                  const pStatus = STATUS_META[p.status] || { color: "var(--cream-dim)", label: p.status };
                  return (
                    <Link
                      key={p.id}
                      href={`/agency/agents/${p.id}`}
                      className="block rounded-lg p-3 border transition hover:scale-[1.01]"
                      style={{ background: "var(--bg-deep)", borderColor: C.border }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[12px] font-semibold truncate" style={{ color: C.text }}>
                          {p.name}
                        </span>
                        <span
                          className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: `${pStatus.color}22`, color: pStatus.color }}
                        >
                          {pStatus.label}
                        </span>
                      </div>
                      <div className="text-[10px] line-clamp-2" style={{ color: C.textMute }}>
                        {p.role}
                      </div>
                      <div className="mt-1.5 text-[10px] font-mono" style={{ color: C.goldDeep }}>
                        {p.id}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </motion.section>

        {/* ── Right col: action panel + registry metadata ──────────── */}
        <motion.section
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-4"
        >
          {/* Actions */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} style={{ color: C.gold }} />
              <h2 className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>
                Quick Actions
              </h2>
            </div>

            <AnimatePresence>
              {pendingAction && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 rounded-lg p-3 border"
                  style={{ background: "var(--bg-deep)", borderColor: `${C.gold}55` }}
                >
                  <label className="block text-[11px] mb-1.5" style={{ color: C.text3 }}>
                    Task description for <strong style={{ color: C.gold }}>{pendingAction}</strong>:
                  </label>
                  <textarea
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    placeholder="Describe what this agent should do…"
                    className="w-full px-2 py-1.5 rounded text-[12px] outline-none resize-none"
                    rows={3}
                    style={{ background: "var(--bg-card)", border: `1px solid ${C.border}`, color: C.text }}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => runAction(pendingAction, true)}
                      disabled={running !== null || !actionInput.trim()}
                      className="px-3 py-1 rounded text-[11px] font-semibold disabled:opacity-50"
                      style={{ background: C.gold, color: "var(--bg-deep)" }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => { setPendingAction(null); setActionInput(""); }}
                      className="px-3 py-1 rounded text-[11px]"
                      style={{ color: C.textMute }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {[
                { id: "assign",    label: "Assign Task",     desc: "Queue a task for this agent",   icon: CheckCircle2, color: C.purple, needsInput: true },
                { id: "run",       label: "Run Now",         desc: "Execute agent on demand",       icon: Play,         color: C.emerald, needsInput: true },
                { id: "configure", label: "Configure",       desc: "Edit agent settings",           icon: Settings,     color: C.gold,    needsInput: false },
                { id: "logs",      label: "View Logs",       desc: "See recent runs",               icon: ScrollText,   color: C.cyan,    needsInput: false },
              ].map((a) => {
                const Icon = a.icon;
                const isRunning = running === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => runAction(a.id, a.needsInput)}
                    disabled={running !== null}
                    className="w-full text-left rounded-lg p-3 border transition disabled:opacity-50 hover:scale-[1.005]"
                    style={{ background: "var(--bg-deep)", borderColor: C.border }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="grid place-items-center w-8 h-8 rounded-lg shrink-0"
                        style={{ background: `${a.color}22`, color: a.color }}
                      >
                        {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <Icon size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold" style={{ color: C.text }}>
                          {a.label}
                        </div>
                        <div className="text-[11px]" style={{ color: C.textMute }}>
                          {a.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {result && (
              <div
                className="mt-3 rounded-lg p-3 border"
                style={{ background: "var(--bg-deep)", borderColor: result.error ? `${C.plum}55` : `${C.emerald}55` }}
              >
                <div
                  className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
                  style={{ color: result.error ? C.plum : C.emerald }}
                >
                  {result.error ? "Error" : "Result"}
                </div>
                <pre
                  className="text-[10px] overflow-auto max-h-40 font-mono whitespace-pre-wrap break-all"
                  style={{ color: C.text2 }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Registry metadata */}
          <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} style={{ color: C.cyan }} />
              <h2 className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.text2 }}>
                Registry
              </h2>
            </div>
            <div className="space-y-2 text-[12px]">
              {payload?.stats?.byCategory && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.textMute }}>
                    Category Distribution
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(payload.stats.byCategory).map(([cat, count]) => {
                      const total = payload.stats?.total || 1;
                      const pct = (count / total) * 100;
                      const m = CATEGORY_META[cat] || { color: "var(--cream-dim)", accent: "var(--cream-dim)", label: cat };
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span style={{ color: m.color }}>{m.label}</span>
                            <span style={{ color: C.textMute }}>{count} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: "var(--bg-deep)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: m.accent }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {payload?.goalLoops?.groups && (
                <div className="pt-2 mt-2 border-t" style={{ borderColor: C.border }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: C.textMute }}>
                    Goal Loops Available
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(payload.goalLoops.groups).map(([group, count]) => (
                      <div
                        key={group}
                        className="rounded-md px-2 py-1 text-[10px]"
                        style={{ background: "var(--bg-deep)", color: C.text2 }}
                      >
                        <span style={{ color: C.gold }}>{count}</span> · {group}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Doctype tag */}
          <div
            className="rounded-xl p-4 text-[11px]"
            style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}33`, color: C.text2 }}
          >
            <div className="flex items-start gap-2">
              <Sparkles size={12} style={{ color: C.gold, marginTop: 2 }} />
              <div>
                <div className="font-semibold mb-1" style={{ color: C.gold }}>
                  RIG Doctrine
                </div>
                <p style={{ color: C.text3 }}>
                  Agent registry is read-only from this surface. All execution routes through Gate-D
                  approval. ProofPacket or it didn't happen.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="text-[10px] pt-4 border-t flex items-center justify-between gap-4"
        style={{ color: C.textMute, borderColor: C.border }}
      >
        <div className="flex items-center gap-2">
          <Database size={11} />
          <span>Source: /api/agency/agents</span>
          <span>·</span>
          <span>{payload?.total ?? 423} agents across {Object.keys(payload?.stats?.byCategory || {}).length || 4} categories</span>
        </div>
        <div className="flex items-center gap-2">
          <Hash size={11} />
          <span>turn 55 · midnight aubergine</span>
        </div>
      </motion.footer>
    </div>
  );
}

// (Icons imported at top of file)