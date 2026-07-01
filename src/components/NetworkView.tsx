"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  GitBranch,
  KeyRound,
  Network,
  Paperclip,
  PlugZap,
  Route,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import ModelRoutingMap from "./ModelRoutingMap";
import RufloView from "./RufloView";
import Vitals from "./Vitals";

const rails = [
  {
    name: "Claude",
    role: "strategy and architecture",
    path: "/claude",
    accent: "#d97757",
  },
  {
    name: "OpenClaw",
    role: "session router and gateway",
    path: "/openclaw",
    accent: "#f472b6",
  },
  {
    name: "Hermes",
    role: "tool runner, research, Kanban, skills",
    path: "/hermes",
    accent: "#60a5fa",
  },
  {
    name: "Codex",
    role: "verification, code edits, packaging",
    path: "/codex",
    accent: "#22c55e",
  },
  {
    name: "Memory",
    role: "JakeStudio, SOUL.md, journal, Omi",
    path: "/memory",
    accent: "#22d3ee",
  },
];

const checks = [
  ["LAN-first", "Prefer local services and local files before tailnet or cloud fallbacks."],
  ["Keychain-aware", "Desktop Hermes now routes through the same launcher as terminal Hermes."],
  ["Gate-D", "External writes, pushes, publishing, paid jobs, and credential changes require Mike approval."],
  ["Proof loop", "Major actions write a local proof artifact and log back into JakeStudio."],
];

export default function NetworkView() {
  return (
    <div className="space-y-6 pb-8">
      <section className="panel p-5">
        <div className="flex items-start gap-4">
          <div className="grid place-items-center w-11 h-11 rounded-lg border border-[rgba(96,165,250,0.45)] bg-[rgba(96,165,250,0.12)] text-[#60a5fa]">
            <Network size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-[#60a5fa] mb-1">Network</div>
            <h1 className="text-2xl font-medium tracking-tight">Agent routes, model topology, and workflow swarm.</h1>
            <p className="text-[13px] text-[var(--fg-dim)] mt-2 max-w-[760px] leading-relaxed">
              This room is the wiring diagram: which agent owns which layer, which routes are live,
              and where work should move next before it becomes output.
            </p>
          </div>
          <Link href="/ruflo" className="hidden md:inline-flex items-center gap-2 rounded-lg border border-[var(--panel-border)] px-3 py-2 text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] hover:border-[var(--panel-border-hot)]">
            Open swarm <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      <Vitals />

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Route size={15} className="text-[var(--gold)]" />
            <h2 className="text-lg">Operating Rails</h2>
          </div>
          <div className="space-y-3">
            {rails.map((rail, i) => (
              <Link key={rail.name} href={rail.path} className="flex items-center gap-3 rounded-lg border border-[var(--panel-border)] p-3 hover:border-[var(--panel-border-hot)] transition">
                <div className="hand text-2xl w-8">{String(i + 1).padStart(2, "0")}</div>
                <div className="grid place-items-center w-9 h-9 rounded-md border" style={{ color: rail.accent, borderColor: `${rail.accent}55`, background: `${rail.accent}12` }}>
                  {rail.name === "Memory" ? <BrainCircuit size={16} /> : <Cpu size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-[var(--fg)]">{rail.name}</div>
                  <div className="text-[12px] text-[var(--fg-dim)]">{rail.role}</div>
                </div>
                <ArrowUpRight size={13} className="ml-auto text-[var(--fg-dimmer)]" />
              </Link>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={15} className="text-[var(--gold)]" />
            <h2 className="text-lg">Guardrails</h2>
          </div>
          <div className="space-y-3">
            {checks.map(([name, body]) => (
              <div key={name} className="rounded-lg border border-[var(--panel-border)] p-3 bg-[rgba(255,255,255,0.02)]">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--fg)]">
                  <CheckCircle2 size={13} className="text-[var(--emerald)]" />
                  {name}
                </div>
                <div className="text-[12px] text-[var(--fg-dim)] leading-relaxed mt-1">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="panel p-5 min-h-[560px]">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={15} className="text-[var(--gold)]" />
            <h2 className="text-lg">Model Routing Map</h2>
          </div>
          <ModelRoutingMap />
        </div>
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Workflow size={15} className="text-[var(--gold)]" />
            <h2 className="text-lg">Workflow Swarm</h2>
          </div>
          <RufloView />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/paperclip" className="surface-card p-4">
          <PaperclipIcon />
          <h3 className="action-title mt-3">Paperclip Org</h3>
          <p className="action-desc mt-1">Turn a mission into role-owned work across Claude, Hermes, OpenClaw, Codex, QA, and memory.</p>
        </Link>
        <Link href="/kanban" className="surface-card p-4">
          <PlugZap size={18} className="text-[var(--gold)]" />
          <h3 className="action-title mt-3">Kanban Dispatch</h3>
          <p className="action-desc mt-1">Inspect the board, create tasks, assign owners, and trigger Hermes dispatch manually.</p>
        </Link>
        <Link href="/guide" className="surface-card p-4">
          <KeyRound size={18} className="text-[var(--gold)]" />
          <h3 className="action-title mt-3">Build Guide</h3>
          <p className="action-desc mt-1">Use the blueprint to extend the app without losing memory, routes, or gates.</p>
        </Link>
      </section>
    </div>
  );
}

function PaperclipIcon() {
  return <Paperclip size={18} className="text-[var(--gold)]" />;
}
