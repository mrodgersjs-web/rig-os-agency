"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  Columns3,
  Film,
  FolderKanban,
  Image,
  Network,
  Paperclip,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import ActivityStream from "./ActivityStream";
import ModelRoutingMap from "./ModelRoutingMap";
import Vitals from "./Vitals";

const modules = [
  {
    href: "/pipeline",
    title: "Pipeline",
    body: "Capture raw ideas, classify them, pass one human gate, then build and file the output.",
    icon: <Workflow size={18} />,
    accent: "#34d399",
    meta: "Inbox -> Gate -> Build",
  },
  {
    href: "/goals",
    title: "Goals",
    body: "Personal and business targets saved into the local vault with progress and category views.",
    icon: <Target size={18} />,
    accent: "#fbbf24",
    meta: "Vault-backed",
  },
  {
    href: "/seo",
    title: "SEO",
    body: "Transcript-to-article generation, site history, deploy controls, and SEO research workflows.",
    icon: <Search size={18} />,
    accent: "#a3e635",
    meta: "Content engine",
  },
  {
    href: "/video",
    title: "Video",
    body: "HyperFrames projects, avatar video workflows, and a local video workspace.",
    icon: <Film size={18} />,
    accent: "#ef4444",
    meta: "Scripts + renders",
  },
  {
    href: "/studio",
    title: "Studio",
    body: "Generate images, videos, and speech through Hermes tools, then keep a reusable media library.",
    icon: <Image size={18} />,
    accent: "#ec4899",
    meta: "Media factory",
  },
  {
    href: "/network",
    title: "Network",
    body: "One screen for local tools, model routing, agent health, and the LAN-first operating layer.",
    icon: <Network size={18} />,
    accent: "#60a5fa",
    meta: "Routes + vitals",
  },
  {
    href: "/kanban",
    title: "Kanban",
    body: "Hermes task board with assignees, triage, dispatch, comments, and task drawers.",
    icon: <Columns3 size={18} />,
    accent: "#14b8a6",
    meta: "Hermes board",
  },
  {
    href: "/ruflo",
    title: "Workflow Swarm",
    body: "Launch specialized agent swarms and watch coordination, status, and roles live.",
    icon: <Route size={18} />,
    accent: "#d4a574",
    meta: "Multi-agent",
  },
  {
    href: "/paperclip",
    title: "Paperclip",
    body: "Mission-driven org chart for Claude, Hermes, OpenClaw, Codex, QA, and memory.",
    icon: <Paperclip size={18} />,
    accent: "#d4a574",
    meta: "Agent company",
  },
  {
    href: "/journal",
    title: "Journal",
    body: "Daily notes, voice capture, and date navigation written directly to the vault.",
    icon: <BookOpen size={18} />,
    accent: "#f59e0b",
    meta: "Daily loop",
  },
  {
    href: "/memory",
    title: "Memory",
    body: "Obsidian search, Omi feed, recent notes, and a visual vault graph.",
    icon: <Brain size={18} />,
    accent: "#22d3ee",
    meta: "Context layer",
  },
  {
    href: "/guide",
    title: "Build Guide",
    body: "The local install, 7-layer blueprint, module map, and first workflows to run.",
    icon: <Sparkles size={18} />,
    accent: "#c4b5fd",
    meta: "Operating manual",
  },
];

const layers = [
  ["01", "Hardware", "Local Mac app, private loopback runtime, terminal launchers, CuaDriver."],
  ["02", "Memory", "JakeStudio vault, journal, goals, Omi memories, SOUL.md, GitHub/Jake PAI context."],
  ["03", "Models", "Hermes model aliases, OpenRouter, Ollama Cloud, Groq, NVIDIA, Z.ai, local routes."],
  ["04", "Agents", "Claude plans, OpenClaw routes, Hermes executes, Codex verifies, Gemini assists."],
  ["05", "Dashboard", "One sidebar for every room instead of scattered tabs and terminals."],
  ["06", "Production", "SEO, video, studio, media, websites, scripts, and deployable artifacts."],
  ["07", "Loop", "Outputs get filed back into memory so the next run starts with context."],
];

const missionStack = [
  {
    name: "Claude",
    role: "Intelligence layer",
    body: "Planning, strategy, architecture, judgment calls, and final reasoning.",
    icon: <AgentAvatar agent="claude" size={24} />,
    accent: "#d97757",
  },
  {
    name: "OpenClaw",
    role: "Execution router",
    body: "Routes sessions, keeps agent work organized, and reduces handoff friction.",
    icon: <AgentAvatar agent="openclaw" size={24} />,
    accent: "#f472b6",
  },
  {
    name: "Hermes",
    role: "Research and tools",
    body: "Runs tools, scheduled workflows, Kanban, skills, media, and deeper task loops.",
    icon: <AgentAvatar agent="hermes" size={24} />,
    accent: "#60a5fa",
  },
  {
    name: "Self",
    role: "Memory and direction",
    body: "Obsidian, SOUL.md, goals, journal, GitHub state, and Mike approval gates.",
    icon: <Brain size={22} />,
    accent: "#22d3ee",
  },
];

export default function AgentOSHome() {
  return (
    <div className="space-y-8 pb-8">
      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-stretch">
        <div className="panel p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="eyebrow mb-5">
              <span className="num">I.</span>
              <span className="line" />
              <span className="label">Agent OS · local mission control</span>
            </div>
            <h1 className="page-title max-w-[820px]">
              One Mac app for the pipeline, memory, agents, media, and output loop.
            </h1>
            <p className="page-subtitle">
              Built around the Julian Goldie pattern: memory first, models behind routing,
              agents with clear jobs, a visible dashboard, production rooms, and a loop that
              writes useful work back into the vault.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Rooms", "12"],
              ["Agent layers", "4"],
              ["Blueprint", "7"],
              ["Runtime", "Mac app"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[var(--panel-border)] bg-[rgba(255,255,255,0.025)] p-3">
                <div className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)]">{label}</div>
                <div className="metric text-2xl mt-1 text-[var(--gold)]">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-[var(--gold)]" />
            <h2 className="text-lg">Operating Law</h2>
          </div>
          <div className="space-y-3 text-[13px] leading-relaxed text-[var(--fg-dim)]">
            <p>Local-first. Memory-backed. Human gate before external action.</p>
            <p>Claude decides direction. Hermes runs tools. OpenClaw coordinates. Codex verifies. GitHub preserves the work.</p>
            <p>Every room below either creates output, routes work, or writes context back into JakeStudio.</p>
          </div>
          <Link href="/guide" className="mt-5 inline-flex items-center gap-2 text-[12.5px] font-semibold text-[var(--gold)]">
            Open build guide <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      <Vitals />

      <section>
        <div className="eyebrow mb-5">
          <span className="num">II.</span>
          <span className="line" />
          <span className="label">Rooms · everything you asked to have built out</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((m) => (
            <Link key={m.href} href={m.href} className="block group">
              <div className="surface-card h-full p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-md border" style={{ color: m.accent, borderColor: `${m.accent}55`, background: `${m.accent}12` }}>
                    {m.icon}
                  </div>
                  <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100 transition text-[var(--fg-dim)]" />
                </div>
                <h3 className="action-title mt-4">{m.title}</h3>
                <p className="action-desc mt-1.5">{m.body}</p>
                <div className="action-tag mt-4" style={{ color: m.accent }}>{m.meta}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
        <div>
          <div className="eyebrow mb-5">
            <span className="num">III.</span>
            <span className="line" />
            <span className="label">Goldie 7-layer blueprint</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {layers.map(([n, title, body]) => (
              <div key={n} className="panel p-4">
                <div className="flex items-start gap-3">
                  <div className="hand text-3xl leading-none w-9">{n}</div>
                  <div>
                    <h3 className="text-[17px]">{title}</h3>
                    <p className="text-[12.5px] leading-relaxed text-[var(--fg-dim)] mt-1">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-5">
            <span className="num">IV.</span>
            <span className="line" />
            <span className="label">Mission stack</span>
          </div>
          <div className="space-y-3">
            {missionStack.map((a) => (
              <div key={a.name} className="panel p-4">
                <div className="flex items-start gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-md border" style={{ color: a.accent, borderColor: `${a.accent}55`, background: `${a.accent}12` }}>
                    {a.icon}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-[17px]">{a.name}</h3>
                      <span className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)]">{a.role}</span>
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-[var(--fg-dim)] mt-1">{a.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div>
          <div className="eyebrow mb-5">
            <span className="num">V.</span>
            <span className="line" />
            <span className="label">Model and route topology</span>
          </div>
          <div className="panel p-4 min-h-[520px]">
            <ModelRoutingMap />
          </div>
        </div>
        <div>
          <div className="eyebrow mb-5">
            <span className="num">VI.</span>
            <span className="line" />
            <span className="label">Live activity</span>
          </div>
          <ActivityStream />
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <FolderKanban size={16} className="text-[var(--gold)]" />
          <h2 className="text-lg">First Workflows To Run</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ["/paperclip", "Start with Paperclip", "Give the agent company one mission and create pipeline/Kanban work from it."],
            ["/seo", "Run an SEO content batch", "Turn a transcript or keyword into article drafts and deployable site work."],
            ["/memory", "Check the loop", "Confirm the output landed back in the vault before starting the next workflow."],
          ].map(([href, title, body]) => (
            <Link key={href} href={href} className="rounded-lg border border-[var(--panel-border)] p-4 hover:border-[var(--panel-border-hot)] transition">
              <div className="text-[13px] font-semibold text-[var(--fg)]">{title}</div>
              <div className="text-[12px] text-[var(--fg-dim)] mt-1 leading-relaxed">{body}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
