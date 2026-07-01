"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Clipboard,
  Columns3,
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
  Play,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import AgentAvatar from "./AgentAvatar";

type TemplateKey = "seo" | "video" | "onboarding" | "research" | "build";

const templates: Record<TemplateKey, { label: string; mission: string; output: string }> = {
  seo: {
    label: "SEO content sprint",
    mission: "Build a full SEO content sprint for an AI Profit Boardroom topic: keyword map, article outline, AI Overview answer blocks, internal links, social hooks, video script, QA checklist, and memory log.",
    output: "keyword map, article draft, video script, QA notes, vault memory",
  },
  video: {
    label: "Video engine",
    mission: "Turn one training topic into a video package: hook, script, b-roll prompts, HyperFrames concept, avatar segment, thumbnail prompt, caption set, and post-production checklist.",
    output: "script, video plan, media prompts, caption bundle",
  },
  onboarding: {
    label: "AIPB onboarding",
    mission: "Design a first-24-hours onboarding flow for a new AI Profit Boardroom member with welcome sequence, resource map, quick win workflow, support prompts, and follow-up checklist.",
    output: "journey map, emails, quick-start tasks, support SOP",
  },
  research: {
    label: "Deep research",
    mission: "Research a market or competitor set, extract named evidence, create a thesis, score opportunities, draft a briefing, and file the source-backed takeaways to memory.",
    output: "briefing, source list, opportunity map, memory note",
  },
  build: {
    label: "Product build",
    mission: "Build a small production-ready workflow or app feature: define scope, create implementation tasks, assign agents, build, review, write docs, and produce a ProofPacket.",
    output: "scope, tasks, implementation, review, proof",
  },
};

const roles = [
  {
    name: "Claude",
    title: "CEO / Strategist",
    agent: <AgentAvatar agent="claude" size={26} />,
    accent: "#d97757",
    job: "Defines strategy, sequencing, judgment calls, and acceptance criteria.",
    task: "Draft mission strategy and success criteria.",
  },
  {
    name: "OpenClaw",
    title: "COO / Router",
    agent: <AgentAvatar agent="openclaw" size={26} />,
    accent: "#f472b6",
    job: "Organizes sessions, routes work, tracks handoffs, and keeps the team from duplicating effort.",
    task: "Route work to the right agent rooms and keep handoffs clear.",
  },
  {
    name: "Hermes",
    title: "Operator / Tool Runner",
    agent: <AgentAvatar agent="hermes" size={26} />,
    accent: "#60a5fa",
    job: "Runs tools, research, skills, media generation, scheduled loops, and Kanban execution.",
    task: "Execute the tool-heavy research and production steps.",
  },
  {
    name: "Codex",
    title: "Engineer / Verifier",
    agent: <AgentAvatar agent="codex" size={26} />,
    accent: "#22c55e",
    job: "Edits code, packages the Mac app, runs builds, verifies behavior, and writes proof.",
    task: "Implement or verify the build artifacts and document proof.",
  },
  {
    name: "SEO",
    title: "Growth / Content",
    agent: <FileText size={24} />,
    accent: "#a3e635",
    job: "Turns missions into keywords, articles, snippets, links, titles, and deployment-ready pages.",
    task: "Produce the SEO/content asset plan and QA checklist.",
  },
  {
    name: "Memory",
    title: "Archivist / Loop",
    agent: <Brain size={24} />,
    accent: "#22d3ee",
    job: "Files decisions, outputs, source notes, logs, and learnings back into JakeStudio.",
    task: "Write the memory note and next-run context.",
  },
];

export default function PaperclipView() {
  const [template, setTemplate] = useState<TemplateKey>("seo");
  const [mission, setMission] = useState(templates.seo.mission);
  const [busy, setBusy] = useState<"pipeline" | "kanban" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = templates[template];
  const missionPacket = useMemo(() => {
    const roleLines = roles.map((r) => `- ${r.name} (${r.title}): ${r.task}`).join("\n");
    return [
      `Mission: ${mission.trim()}`,
      "",
      `Expected output: ${selected.output}`,
      "",
      "Agent company roles:",
      roleLines,
      "",
      "Gate: Mike approval is required before public publishing, pushing, credential changes, paid jobs, or destructive actions.",
      "Loop: file decisions and outputs back into JakeStudio memory.",
    ].join("\n");
  }, [mission, selected.output]);

  function chooseTemplate(key: TemplateKey) {
    setTemplate(key);
    setMission(templates[key].mission);
    setNotice(null);
  }

  async function sendToPipeline() {
    if (!mission.trim() || busy) return;
    setBusy("pipeline");
    setNotice(null);
    try {
      const r = await fetch("/api/pipeline/capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea: missionPacket }),
      });
      const j = await r.json();
      setNotice(j.ok ? `Pipeline item created: ${j.slug}` : `Pipeline failed: ${j.error ?? r.statusText}`);
    } catch (e) {
      setNotice(`Pipeline failed: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function createKanbanCards() {
    if (!mission.trim() || busy) return;
    setBusy("kanban");
    setNotice(null);
    try {
      let ok = 0;
      const failures: string[] = [];
      for (const role of roles) {
        const r = await fetch("/api/hermes/kanban/action", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "create",
            board: "default",
            title: `${role.name}: ${role.task}`,
            body: `${missionPacket}\n\nRole brief:\n${role.job}`,
            assignee: "julian",
            triage: true,
          }),
        });
        const j = await r.json().catch(() => ({}));
        if (j.ok) ok += 1;
        else failures.push(role.name);
      }
      setNotice(failures.length ? `Created ${ok} Kanban cards; failed: ${failures.join(", ")}` : `Created ${ok} Kanban cards`);
    } catch (e) {
      setNotice(`Kanban failed: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function copyPacket() {
    try {
      await navigator.clipboard.writeText(missionPacket);
      setNotice("Mission packet copied");
    } catch {
      setNotice("Copy failed");
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="panel p-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="grid place-items-center w-11 h-11 rounded-lg border border-[rgba(212,165,116,0.45)] bg-[rgba(212,165,116,0.12)] text-[var(--gold)]">
            <Paperclip size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-[var(--gold)] mb-1">Paperclip</div>
            <h1 className="text-2xl font-medium tracking-tight">Agent company control room.</h1>
            <p className="text-[13px] text-[var(--fg-dim)] mt-2 max-w-[820px] leading-relaxed">
              A local Paperclip-style org chart for missions that need multiple agents.
              Set one mission, turn it into Pipeline or Kanban work, then let each room execute its part.
            </p>
          </div>
          <a
            href="http://localhost:3100/GOLA/org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--panel-border)] px-3 py-2 text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] hover:border-[var(--panel-border-hot)]"
          >
            External Paperclip <ExternalLink size={14} />
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[390px_minmax(0,1fr)] gap-5">
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} className="text-[var(--gold)]" />
            <h2 className="text-lg">Mission Builder</h2>
          </div>

          <div className="space-y-2 mb-4">
            {(Object.keys(templates) as TemplateKey[]).map((key) => {
              const active = key === template;
              return (
                <button
                  key={key}
                  onClick={() => chooseTemplate(key)}
                  className="w-full text-left rounded-lg border p-3 transition"
                  style={{
                    borderColor: active ? "var(--gold)" : "var(--panel-border)",
                    background: active ? "rgba(212,165,116,0.09)" : "rgba(255,255,255,0.015)",
                  }}
                >
                  <div className="text-[13px] font-semibold text-[var(--fg)]">{templates[key].label}</div>
                  <div className="text-[11.5px] text-[var(--fg-dim)] mt-1">{templates[key].output}</div>
                </button>
              );
            })}
          </div>

          <label className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)]">Mission</label>
          <textarea
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            rows={8}
            className="mt-2 w-full resize-none rounded-lg border border-[var(--panel-border)] bg-[rgba(0,0,0,0.25)] px-3 py-2 text-[13px] leading-relaxed text-[var(--fg)] outline-none focus:border-[var(--panel-border-hot)]"
          />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={sendToPipeline}
              disabled={!mission.trim() || busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold disabled:opacity-45"
              style={{ background: "rgba(52,211,153,0.16)", border: "1px solid rgba(52,211,153,0.45)", color: "#34d399" }}
            >
              {busy === "pipeline" ? <Loader2 size={14} className="animate-spin" /> : <Workflow size={14} />}
              Send Pipeline
            </button>
            <button
              onClick={createKanbanCards}
              disabled={!mission.trim() || busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold disabled:opacity-45"
              style={{ background: "rgba(20,184,166,0.14)", border: "1px solid rgba(20,184,166,0.45)", color: "#14b8a6" }}
            >
              {busy === "kanban" ? <Loader2 size={14} className="animate-spin" /> : <Columns3 size={14} />}
              Make Kanban
            </button>
            <button
              onClick={copyPacket}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--panel-border)] px-3 py-2 text-[12.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] hover:border-[var(--panel-border-hot)]"
            >
              <Clipboard size={14} /> Copy packet
            </button>
            <Link
              href="/kanban"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--panel-border)] px-3 py-2 text-[12.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] hover:border-[var(--panel-border-hot)]"
            >
              Open board <ArrowUpRight size={14} />
            </Link>
          </div>
          {notice && (
            <div className="mt-3 rounded-lg border border-[var(--panel-border)] bg-[rgba(255,255,255,0.025)] px-3 py-2 text-[12px] text-[var(--fg-dim)]">
              {notice}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {roles.map((role) => (
              <div key={role.name} className="panel p-4">
                <div className="flex items-start gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-md border" style={{ color: role.accent, borderColor: `${role.accent}55`, background: `${role.accent}12` }}>
                    {role.agent}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[16px] leading-tight">{role.name}</h3>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--fg-dimmer)] mt-1">{role.title}</div>
                  </div>
                </div>
                <p className="text-[12px] text-[var(--fg-dim)] leading-relaxed mt-3">{role.job}</p>
                <div className="mt-3 rounded-lg border border-[var(--panel-border)] bg-[rgba(255,255,255,0.02)] p-2 text-[11.5px] text-[var(--fg-dim)]">
                  {role.task}
                </div>
              </div>
            ))}
          </div>

          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <Play size={15} className="text-[var(--gold)]" />
              <h2 className="text-lg">Mission Packet</h2>
            </div>
            <pre className="max-h-[360px] overflow-auto rounded-lg border border-[var(--panel-border)] bg-[rgba(0,0,0,0.32)] p-4 text-[12px] leading-relaxed text-[var(--fg-dim)] whitespace-pre-wrap">{missionPacket}</pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/pipeline" className="surface-card p-4">
              <Workflow size={18} className="text-[#34d399]" />
              <h3 className="action-title mt-3">Pipeline</h3>
              <p className="action-desc mt-1">Shape the mission and approve the plan once.</p>
            </Link>
            <Link href="/memory" className="surface-card p-4">
              <Brain size={18} className="text-[#22d3ee]" />
              <h3 className="action-title mt-3">Memory</h3>
              <p className="action-desc mt-1">Check that outputs feed JakeStudio context.</p>
            </Link>
            <Link href="/guide" className="surface-card p-4">
              <ShieldCheck size={18} className="text-[var(--gold)]" />
              <h3 className="action-title mt-3">Guide</h3>
              <p className="action-desc mt-1">Extend the stack without breaking the loop.</p>
            </Link>
          </div>

          <div className="panel p-4 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-[var(--emerald)] mt-0.5" />
            <div className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">
              Paperclip here is mission control, not a public action. It can create local Pipeline and Hermes Kanban records.
              Publishing, pushing, paid jobs, destructive changes, credential changes, and third-party writes still stay behind Mike approval.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
