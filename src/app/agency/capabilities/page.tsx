"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Brain, GitBranch, Target, Zap, Server, Activity,
  RefreshCw, ChevronRight, Cpu, Boxes, Shield, TrendingUp,
  CheckCircle2, FileText, Sparkles, Wrench,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

interface SkillInfo {
  name: string;
  description: string;
  category: string;
  hasReferences: boolean;
  hasTemplates: boolean;
  hasScripts: boolean;
  size: number;
}

interface AgentInfo {
  name: string;
  type: string;
  path: string;
  description: string;
}

interface RepoInfo {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  updatedAt: string;
}

interface GoalHarness {
  id: string;
  name: string;
  chain: string;
  description: string;
}

interface DeviationEngine {
  id: number;
  name: string;
  category: string;
  principle: string;
  signal: string;
}

interface MCPServer {
  name: string;
  status: string;
  tools: number;
  category: string;
}

interface Improvement {
  date: string;
  type: string;
  description: string;
}

interface CapabilitiesData {
  skills: { count: number; top: SkillInfo[]; categories: { name: string; count: number }[] };
  agents: { count: number; types: { type: string; count: number }[]; top: AgentInfo[] };
  repos: { count: number; list: RepoInfo[] };
  goalHarnesses: { count: number; loops: GoalHarness[] };
  deviationEngines: { count: number; engines: DeviationEngine[] };
  mcpServers: { count: number; servers: MCPServer[] };
  metaHarness: { status: string; manifest: Record<string, unknown> | null; version: string };
  latticeCells: number;
  recentImprovements: Improvement[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const categoryColors: Record<string, string> = {
  Cognitive: "var(--gold)",
  Nature: "var(--emerald)",
  Physics: "var(--plum)",
  Strategic: "var(--rust)",
  "Cross-domain": "var(--gold-soft)",
};

const typeIcons: Record<string, React.ReactNode> = {
  skill: <Sparkles size={12} />,
  agent: <Brain size={12} />,
  repo: <GitBranch size={12} />,
  harness: <Target size={12} />,
  engine: <Zap size={12} />,
  mcp: <Server size={12} />,
};

// ── Animations ────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// ── Main Component ───────────────────────────────────────────────────

export default function CapabilitiesPage() {
  const [data, setData] = useState<CapabilitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "agents" | "repos" | "loops" | "engines" | "mcp" | "improvements">("overview");

  useEffect(() => {
    loadCapabilities();
  }, []);

  const loadCapabilities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/capabilities?action=overview").then((r) => r.json());
      setData(res);
    } catch (err) {
      console.error("Failed to load capabilities:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── KPI Cards ──────────────────────────────────────────────────────
  const kpis = data ? [
    { label: "Skills", value: data.skills.count, icon: <Sparkles size={16} />, accent: "var(--gold)", sub: `${data.skills.categories.length} categories` },
    { label: "Agents", value: data.agents.count, icon: <Brain size={16} />, accent: "var(--emerald)", sub: `${data.agents.types.length} types` },
    { label: "GitHub Repos", value: data.repos.count, icon: <GitBranch size={16} />, accent: "var(--plum)", sub: "RIGIntelligence" },
    { label: "Goal Loops", value: data.goalHarnesses.count, icon: <Target size={16} />, accent: "var(--gold)", sub: "8 chains" },
    { label: "Deviation Engines", value: data.deviationEngines.count, icon: <Zap size={16} />, accent: "var(--rust)", sub: "5 categories" },
    { label: "Lattice Cells", value: data.latticeCells, icon: <Boxes size={16} />, accent: "var(--emerald)", sub: "3D deviation" },
    { label: "MCP Servers", value: data.mcpServers.count, icon: <Server size={16} />, accent: "var(--gold-soft)", sub: `${data.mcpServers.servers.reduce((s, m) => s + m.tools, 0)} tools` },
    { label: "Meta-Harness", value: data.metaHarness.status === "active" ? "Active" : "Present", icon: <Cpu size={16} />, accent: "var(--plum)", sub: `v${data.metaHarness.version}` },
  ] : [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--gold)", fontWeight: 600 }}>
            Meta-Harness · Full Stack
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
              Agency <span className="hand text-[1.2em]" style={{ color: "var(--gold)" }}>Capabilities</span>
            </h1>
            <p className="text-[13px] mt-1.5" style={{ color: "var(--cream-dim)" }}>
              The full RIG capability stack — skills, agents, repos, goal loops, deviation engines, MCP servers, and meta-harness status.
            </p>
          </div>
          <button
            onClick={loadCapabilities}
            className="px-3 py-2 rounded-lg text-[12px] font-medium border flex items-center gap-2 transition"
            style={{ borderColor: "var(--line)", color: "var(--cream)" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </motion.section>

      {/* KPI Grid */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cream-dim)" }}>
                  {kpi.label}
                </span>
              </div>
              <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--cream)" }}>
                {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--cream-dim)" }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Tabs */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.08 }}>
        <div className="flex flex-wrap gap-1">
          {[
            { id: "overview" as const, label: "Overview", icon: <Layers size={13} /> },
            { id: "skills" as const, label: "Skills", icon: <Sparkles size={13} /> },
            { id: "agents" as const, label: "Agents", icon: <Brain size={13} /> },
            { id: "repos" as const, label: "Repos", icon: <GitBranch size={13} /> },
            { id: "loops" as const, label: "Goal Loops", icon: <Target size={13} /> },
            { id: "engines" as const, label: "Deviation Engines", icon: <Zap size={13} /> },
            { id: "mcp" as const, label: "MCP Servers", icon: <Server size={13} /> },
            { id: "improvements" as const, label: "Recent Improvements", icon: <TrendingUp size={13} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition"
              style={{
                background: activeTab === tab.id ? "var(--gold)" : "transparent",
                color: activeTab === tab.id ? "var(--bg-deep)" : "var(--cream-dim)",
                border: `1px solid ${activeTab === tab.id ? "var(--gold)" : "var(--line-soft)"}`,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Content */}
      <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin" style={{ color: "var(--cream-dim)" }} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── Overview Tab ── */}
            {activeTab === "overview" && data && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Meta-harness status */}
                <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--line)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu size={20} style={{ color: "var(--gold)" }} />
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold" style={{ color: "var(--cream)" }}>
                        RIG Meta-Harness
                      </div>
                      <div className="text-[11px] mono" style={{ color: "var(--cream-dim)" }}>
                        Version {data.metaHarness.version} · Status: {data.metaHarness.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: "var(--bg-mid)" }}>
                      <CheckCircle2 size={14} style={{ color: data.metaHarness.status === "active" ? "var(--emerald)" : "var(--gold)" }} />
                      <span className="text-[12px] font-semibold" style={{ color: data.metaHarness.status === "active" ? "var(--emerald)" : "var(--gold)" }}>
                        {data.metaHarness.status === "active" ? "ONLINE" : "AVAILABLE"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Startup Agents", value: "5 (codex, claude, hermes, jake, omnigent)" },
                      { label: "Router", value: "Jake front-door" },
                      { label: "Live Policy", value: "always_on" },
                      { label: "Temporal Server", value: "127.0.0.1:7233" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border p-3" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--cream-dim)" }}>
                          {item.label}
                        </div>
                        <div className="text-[11px] mono" style={{ color: "var(--cream-soft)" }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill categories */}
                <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} style={{ color: "var(--gold)" }} />
                    <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: "var(--cream)" }}>
                      Skill Categories
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {data.skills.categories.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--bg-mid)" }}>
                        <span className="text-[12px] truncate" style={{ color: "var(--cream-soft)" }}>
                          {cat.name}
                        </span>
                        <span className="text-[10px] mono px-1.5 rounded" style={{ background: "var(--bg-elev)", color: "var(--gold)" }}>
                          {cat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent types */}
                <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={16} style={{ color: "var(--emerald)" }} />
                    <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: "var(--cream)" }}>
                      Agent Types
                    </span>
                  </div>
                  <div className="space-y-2">
                    {data.agents.types.map((t) => {
                      const pct = data.agents.count > 0 ? (t.count / data.agents.count) * 100 : 0;
                      return (
                        <div key={t.type} className="flex items-center gap-3">
                          <span className="text-[12px] w-24 truncate" style={{ color: "var(--cream-soft)" }}>
                            {t.type}
                          </span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-mid)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: "var(--emerald)", transition: "width 0.5s" }}
                            />
                          </div>
                          <span className="text-[10px] mono w-10 text-right" style={{ color: "var(--cream-dim)" }}>
                            {t.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deviation engine categories summary */}
                <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={16} style={{ color: "var(--rust)" }} />
                    <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: "var(--cream)" }}>
                      Deviation Engine Categories
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {["Cognitive", "Nature", "Physics", "Strategic", "Cross-domain"].map((cat) => {
                      const count = data.deviationEngines.engines.filter((e) => e.category === cat).length;
                      return (
                        <div key={cat} className="rounded-lg border p-3 text-center" style={{ background: "var(--bg-mid)", borderColor: "var(--line-soft)" }}>
                          <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: categoryColors[cat] ?? "var(--cream)" }}>
                            {count}
                          </div>
                          <div className="text-[10px] mt-1" style={{ color: "var(--cream-dim)" }}>
                            {cat}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Skills Tab ── */}
            {activeTab === "skills" && data && (
              <motion.div key="skills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.skills.top.map((skill, idx) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className="rounded-xl border p-4 transition hover:border-[var(--line)]"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles size={14} style={{ color: "var(--gold)", marginTop: 2 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate" style={{ color: "var(--cream)" }}>
                          {skill.name}
                        </div>
                        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--cream-dim)" }}>
                          {skill.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded mono" style={{ background: "var(--bg-mid)", color: "var(--emerald)" }}>
                            {skill.category}
                          </span>
                          {skill.hasReferences && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded mono" style={{ background: "var(--bg-mid)", color: "var(--gold)" }}>
                              refs
                            </span>
                          )}
                          {skill.hasTemplates && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded mono" style={{ background: "var(--bg-mid)", color: "var(--plum)" }}>
                              templates
                            </span>
                          )}
                          {skill.hasScripts && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded mono" style={{ background: "var(--bg-mid)", color: "var(--rust)" }}>
                              scripts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── Agents Tab ── */}
            {activeTab === "agents" && data && (
              <motion.div key="agents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.agents.types.map((t) => (
                    <div key={t.type} className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                      <div className="text-2xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--emerald)" }}>
                        {t.count}
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: "var(--cream-dim)" }}>
                        {t.type} agents
                      </div>
                    </div>
                  ))}
                </div>
                {data.agents.top.length > 0 && (
                  <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
                    <div className="text-[12px] uppercase tracking-wider mb-3" style={{ color: "var(--cream-dim)" }}>
                      Registered Agents
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {data.agents.top.map((agent, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--bg-mid)" }}>
                          <Brain size={13} style={{ color: "var(--emerald)" }} />
                          <span className="text-[12px] font-medium truncate" style={{ color: "var(--cream)" }}>
                            {agent.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded mono ml-auto" style={{ background: "var(--bg-elev)", color: "var(--gold)" }}>
                            {agent.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Repos Tab ── */}
            {activeTab === "repos" && data && (
              <motion.div key="repos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.repos.list.map((repo, idx) => (
                  <motion.div
                    key={repo.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="rounded-xl border p-4 transition hover:border-[var(--line)]"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <GitBranch size={14} style={{ color: "var(--plum)", marginTop: 2 }} />
                      <a href={repo.url} target="_blank" rel="noopener" className="text-[13px] font-semibold truncate flex-1 hover:underline" style={{ color: "var(--cream)" }}>
                        {repo.name}
                      </a>
                    </div>
                    <p className="text-[11px] line-clamp-2" style={{ color: "var(--cream-dim)" }}>
                      {repo.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                      <span style={{ color: "var(--gold)" }}>★ {repo.stars}</span>
                      <span>{repo.language}</span>
                      {repo.updatedAt && <span>{formatDate(repo.updatedAt)}</span>}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── Goal Loops Tab ── */}
            {activeTab === "loops" && data && (
              <motion.div key="loops" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.goalHarnesses.loops.map((loop, idx) => (
                  <motion.div
                    key={loop.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className="flex items-center gap-3 rounded-lg border p-3 transition hover:border-[var(--line)]"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <Target size={14} style={{ color: "var(--gold)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold" style={{ color: "var(--cream)" }}>
                        {loop.name}
                      </div>
                      <div className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                        {loop.id} · {loop.chain}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── Deviation Engines Tab ── */}
            {activeTab === "engines" && data && (
              <motion.div key="engines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.deviationEngines.engines.map((engine, idx) => (
                  <motion.div
                    key={engine.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className="rounded-xl border p-4"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="grid place-items-center w-7 h-7 rounded-lg text-[10px] font-bold mono"
                        style={{ background: "var(--bg-mid)", color: categoryColors[engine.category] ?? "var(--cream)" }}
                      >
                        {String(engine.id).padStart(2, "0")}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold" style={{ color: "var(--cream)" }}>
                          {engine.name}
                        </div>
                        <div className="text-[9px] mono" style={{ color: categoryColors[engine.category] ?? "var(--cream-dim)" }}>
                          {engine.category}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--cream-soft)" }}>
                      {engine.principle}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Activity size={10} style={{ color: "var(--cream-dim)" }} />
                      <span className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                        {engine.signal}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── MCP Servers Tab ── */}
            {activeTab === "mcp" && data && (
              <motion.div key="mcp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.mcpServers.servers.map((server, idx) => (
                  <motion.div
                    key={server.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="rounded-xl border p-4"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Server size={14} style={{ color: "var(--gold-soft)" }} />
                      <span className="text-[13px] font-semibold flex-1" style={{ color: "var(--cream)" }}>
                        {server.name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--bg-mid)", color: "var(--emerald)" }}>
                        <CheckCircle2 size={10} />
                        {server.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                      <span>{server.tools} tools</span>
                      <span>·</span>
                      <span style={{ color: "var(--gold)" }}>{server.category}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── Improvements Tab ── */}
            {activeTab === "improvements" && data && (
              <motion.div key="improvements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {data.recentImprovements.map((imp, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-start gap-3 rounded-lg border p-3"
                    style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="grid place-items-center w-8 h-8 rounded-lg shrink-0" style={{ background: "var(--bg-mid)" }}>
                      {typeIcons[imp.type] ?? <Wrench size={12} />}
                      <span className="sr-only">{imp.type}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] mono px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elev)", color: "var(--gold)" }}>
                          {imp.type}
                        </span>
                        <span className="text-[10px] mono" style={{ color: "var(--cream-dim)" }}>
                          {imp.date}
                        </span>
                      </div>
                      <p className="text-[12px]" style={{ color: "var(--cream-soft)" }}>
                        {imp.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.section>
    </div>
  );
}