"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Boxes, Cpu, Search, Zap, Code, Database, Cloud,
  TestTube, Brain, Shield, Server, Layers, GitBranch,
  Smartphone, Link2, Wrench, Gamepad2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  count: number;
  color: string;
  agents: string[];
}

interface VoltagentData {
  total: number;
  categories: Category[];
  source: string;
}

const ICONS: Record<string, React.ReactNode> = {
  "01-core-development": <Code size={16} />,
  "02-language-experts": <Layers size={16} />,
  "03-frameworks": <Boxes size={16} />,
  "04-database": <Database size={16} />,
  "05-devops": <Cloud size={16} />,
  "06-testing": <TestTube size={16} />,
  "07-ai-ml": <Brain size={16} />,
  "08-security": <Shield size={16} />,
  "09-architecture": <Server size={16} />,
  "10-mobile": <Smartphone size={16} />,
  "11-web3": <GitBranch size={16} />,
  "12-analytics": <Cpu size={16} />,
  "13-integrations": <Link2 size={16} />,
  "14-tooling": <Wrench size={16} />,
  "15-gaming": <Gamepad2 size={16} />,
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function VoltagentsPage() {
  const [data, setData] = useState<VoltagentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/voltagents")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-[var(--cream-mute)]">Loading VoltAgent catalog...</div>
      </div>
    );
  }

  const cats = data?.categories ?? [];
  const totalAgents = cats.reduce((s, c) => s + c.agents.length, 0);

  const filteredCats = search
    ? cats.map((c) => ({
        ...c,
        agents: c.agents.filter((a) => a.toLowerCase().includes(search.toLowerCase())),
      })).filter((c) => c.agents.length > 0)
    : cats;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#fbbf24" }}>
            172 Codex Subagents · 15 Categories
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--cream)" }}>VoltAgent Subagents Catalog</h1>
        <p className="text-[13px]" style={{ color: "var(--cream-dim)" }}>
          awesome-codex-subagents — specialized development subagents for every domain.
          Source: <code className="text-[11px]" style={{ color: "#fbbf24" }}>awesome-codex-subagents</code>
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Subagents", value: data?.total ?? 172, icon: <Boxes size={16} />, accent: "#fbbf24" },
            { label: "Categories", value: cats.length, icon: <Layers size={16} />, accent: "#5ab896" },
            { label: "Codex TOMLs", value: 172, icon: <Cpu size={16} />, accent: "#4a9eff" },
            { label: "Claude Wrappers", value: 172, icon: <GitBranch size={16} />, accent: "#a855f7" },
            { label: "Listed Names", value: totalAgents, icon: <Code size={16} />, accent: "#ec4899" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: s.accent }}>{s.icon}</span>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cream-mute)" }}>{s.label}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: "var(--cream)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
        <Search size={16} style={{ color: "var(--cream-mute)" }} />
        <input
          type="text"
          placeholder="Search subagents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-[13px]"
          style={{ color: "var(--cream)" }}
        />
        <span className="text-[11px]" style={{ color: "var(--cream-dim)" }}>
          {filteredCats.reduce((s, c) => s + c.agents.length, 0)} matches
        </span>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCats.map((cat, i) => (
          <motion.div key={cat.id} {...fadeUp} transition={{ delay: Math.min(i * 0.02, 0.5) }}>
            <div
              className="rounded-xl border p-5 h-full"
              style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg grid place-items-center"
                    style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}40` }}
                  >
                    <span style={{ color: cat.color }}>{ICONS[cat.id] ?? <Code size={16} />}</span>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--cream)" }}>{cat.name}</h3>
                    <span className="text-[10px]" style={{ color: "var(--cream-dim)" }}>{cat.agents.length} agents</span>
                  </div>
                </div>
                <span className="text-[16px] font-bold mono" style={{ color: cat.color }}>
                  {String(cat.agents.length).padStart(2, "0")}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {cat.agents.map((agent) => (
                  <span
                    key={agent}
                    className="text-[10px] px-2 py-1 rounded-md transition cursor-default hover:scale-105"
                    style={{
                      background: `${cat.color}08`,
                      color: "var(--cream-dim)",
                      border: `1px solid ${cat.color}20`,
                    }}
                  >
                    {agent}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div {...fadeUp}>
        <div className="rounded-xl p-5 border flex items-center justify-between flex-wrap gap-4" style={{ background: "var(--bg-card)", borderColor: "var(--line-soft)" }}>
          <div>
            <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--cream)" }}>VoltAgent Dispatch Model</div>
            <div className="text-[12px] mono" style={{ color: "var(--cream-dim)" }}>
              Task → narrowest matching voltagent-* role → read TOML → apply bounded guidance
            </div>
          </div>
          <a href="/agency-agents" className="px-4 py-2 rounded-lg text-[12px] font-medium border transition" style={{ borderColor: "var(--line)", color: "var(--cream)" }}>
            ← Agency Agents
          </a>
        </div>
      </motion.div>
    </div>
  );
}
