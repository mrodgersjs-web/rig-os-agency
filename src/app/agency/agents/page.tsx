"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Cpu, Target, Book, Zap, Search, ChevronDown, RefreshCw,
  Loader2, Activity, Layers, GitBranch, ArrowRight,
} from "lucide-react";

interface AgentEntry {
  id: string;
  name: string;
  category: string;
  role: string;
  capabilities: string[];
  invocationPath: string;
  status: string;
  source: string;
}

interface GoalLoop {
  id: number;
  name: string;
  group: string;
  anchor: string;
  gate: string;
  emits: string;
}

interface RIGSkill {
  id: string;
  name: string;
  description: string;
  path: string;
}

interface AgentStats {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

const categoryColors: Record<string, string> = {
  rig_core: "#5ab896",
  agency: "#4a9eff",
  rig_expert: "#c084fc",
  voltagent: "#fbbf24",
};

const groupColors: Record<string, string> = {
  Reasoning: "#4a9eff",
  Deviation: "#ef4444",
  GTM: "#5ab896",
  Strategy: "#c084fc",
  Operations: "#fbbf24",
  Finance: "#06b6d4",
  Product: "#f97316",
  Studios: "#ec4899",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentEntry[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [goalLoops, setGoalLoops] = useState<GoalLoop[]>([]);
  const [skills, setSkills] = useState<RIGSkill[]>([]);
  const [skillCount, setSkillCount] = useState(0);
  const [repoCount, setRepoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [activeTab, setActiveTab] = useState<"agents" | "goals" | "skills">("agents");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [agentsRes, goalsRes, skillsRes] = await Promise.all([
        fetch("/api/agency/agents"),
        fetch("/api/agency/agents?action=goal-loops"),
        fetch("/api/agency/agents?action=skills&limit=50"),
      ]);
      const aData = await agentsRes.json();
      const gData = await goalsRes.json();
      const sData = await skillsRes.json();
      
      setAgents(aData.agents || []);
      setStats(aData.stats || null);
      setGoalLoops(gData.loops || []);
      setSkills(sData.skills || []);
      setSkillCount(sData.total || 0);
      setRepoCount(aData.repos || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function toggleAgent(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const filtered = agents.filter(a => {
    if (activeCat !== "all" && a.category !== activeCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#5ab896" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 48px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Agent Registry & Goal Harnesses</h1>
        <p style={{ color: "var(--cream-dim)", marginTop: 4 }}>
          408 agents · 50 goal loops · 896 skills · {repoCount}+ GitHub repos
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon={<Users size={18} />} label="Total Agents" value={stats?.total ?? 0} color="#4a9eff" />
        <StatCard icon={<Target size={18} />} label="Goal Loops" value={goalLoops.length} color="#c084fc" />
        <StatCard icon={<Book size={18} />} label="RIG Skills" value={skillCount} color="#fbbf24" />
        <StatCard icon={<GitBranch size={18} />} label="GitHub Repos" value={repoCount} color="#5ab896" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <TabButton active={activeTab === "agents"} onClick={() => setActiveTab("agents")} icon={<Users size={16} />} label="Agents" />
        <TabButton active={activeTab === "goals"} onClick={() => setActiveTab("goals")} icon={<Target size={16} />} label="Goal Harnesses" />
        <TabButton active={activeTab === "skills"} onClick={() => setActiveTab("skills")} icon={<Book size={16} />} label="Skills" />
      </div>

      {/* Agents Tab */}
      {activeTab === "agents" && (
        <>
          {/* Category filter */}
          {stats && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <CatChip label="All" count={stats.total} active={activeCat === "all"} onClick={() => setActiveCat("all")} />
              {Object.entries(stats.byCategory).map(([cat, count]) => (
                <CatChip key={cat} label={cat.replace(/_/g, " ")} count={count} color={categoryColors[cat]} active={activeCat === cat} onClick={() => setActiveCat(cat)} />
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--cream-dim)" }} />
            <input type="text" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 40px", background: "var(--bg-elevated)", border: "1px solid var(--border-dim)", borderRadius: 8, color: "var(--cream)", fontSize: 14 }} />
          </div>

          {/* Agent list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.slice(0, 100).map(agent => (
              <div key={agent.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-dim)", borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => toggleAgent(agent.id)} style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", color: "var(--cream)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: categoryColors[agent.category] || "#666", flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{agent.name}</span>
                    <span style={{ fontSize: 10, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, background: categoryColors[agent.category] || "#666", color: "#000", fontWeight: 700 }}>{agent.category.replace(/_/g, " ")}</span>
                  </div>
                  <ChevronDown size={14} style={{ color: "var(--cream-dim)", transform: expanded[agent.id] ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
                </button>
                <AnimatePresence initial={false}>
                  {expanded[agent.id] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ padding: "0 16px 12px 16px" }}>
                        <p style={{ fontSize: 12, color: "var(--cream-dim)", margin: "0 0 8px 0", lineHeight: 1.4 }}>{agent.role}</p>
                        <div style={{ fontSize: 10, color: "var(--cream-dim)", fontFamily: "monospace" }}>{agent.invocationPath}</div>
                        {agent.capabilities.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                            {agent.capabilities.map(cap => <span key={cap} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "var(--cream-dim)" }}>{cap}</span>)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Goal Harnesses Tab */}
      {activeTab === "goals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {goalLoops.map(loop => (
            <div key={loop.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-dim)", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: groupColors[loop.group] || "#666", width: 32, textAlign: "center" }}>{loop.id}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{loop.name}</div>
                <div style={{ fontSize: 11, color: "var(--cream-dim)", marginTop: 2 }}>
                  <span style={{ textTransform: "capitalize" }}>{loop.group}</span> · {loop.anchor} · Gate: {loop.gate}
                </div>
              </div>
              <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: groupColors[loop.group] || "#666", color: "#000", fontWeight: 700, textTransform: "uppercase" }}>{loop.emits}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === "skills" && (
        <div>
          <p style={{ color: "var(--cream-dim)", marginBottom: 16, fontSize: 13 }}>Showing 50 of {skillCount} skills</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
            {skills.map(skill => (
              <div key={skill.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-dim)", borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{skill.name}</div>
                <div style={{ fontSize: 11, color: "var(--cream-dim)", marginTop: 4, lineHeight: 1.4 }}>{skill.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-dim)", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 11, color: "var(--cream-dim)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value.toLocaleString()}</div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{ background: active ? "rgba(90,184,150,0.1)" : "var(--bg-elevated)", border: active ? "1px solid #5ab896" : "1px solid var(--border-dim)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: active ? "#5ab896" : "var(--cream)" }}>
      {icon} {label}
    </button>
  );
}

function CatChip({ label, count, color, active, onClick }: { label: string; count: number; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: active ? "rgba(90,184,150,0.1)" : "var(--bg-elevated)", border: active ? "1px solid #5ab896" : "1px solid var(--border-dim)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--cream)" }}>
      {color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />}
      <span style={{ textTransform: "capitalize" }}>{label}</span>
      <span style={{ color: "var(--cream-dim)", fontSize: 10 }}>{count}</span>
    </button>
  );
}