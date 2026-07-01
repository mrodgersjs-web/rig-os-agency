// "From Inbox to Shipped" pipeline — turns a raw idea into a reviewed, buildable
// project. Everything lives as Markdown in the Obsidian vault under
// `Agentic OS/Pipeline/items/` so it's visible + editable in Obsidian, isolated
// from the real PARA notes. One human checkpoint (review); agents do the rest.

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import yaml from "js-yaml";
import { AGENTIC_DIR, VAULT_AVAILABLE } from "@/lib/vaultWriter";
import { FCC_SCRATCH_ROOT, ensureProject } from "@/lib/freeClaudeWorkspace";

export const BUILD_PROJECT = "free-claude-code"; // shared with the Agent Factory gallery

export const PIPELINE_DIR = AGENTIC_DIR ? path.join(AGENTIC_DIR, "Pipeline") : "";
export const ITEMS_DIR = PIPELINE_DIR ? path.join(PIPELINE_DIR, "items") : "";
export const PIPELINE_AVAILABLE = VAULT_AVAILABLE;

export type Stage = "inbox" | "shaping" | "review" | "building" | "shipped" | "rejected";
export type RouteKind = "project" | "action" | "idea" | "reference" | "escalate";

export const STAGES: { key: Stage; label: string; blurb: string }[] = [
  { key: "inbox",    label: "Capture",   blurb: "Raw input — no structure required" },
  { key: "shaping",  label: "Classify & Route", blurb: "Agents decide what it is" },
  { key: "review",   label: "Human Gate", blurb: "The one checkpoint — approve or reject" },
  { key: "building", label: "Execute",   blurb: "PM + subagents build it" },
  { key: "shipped",  label: "Shipped",   blurb: "Done" },
];

export interface PipelineItem {
  slug: string;
  title: string;
  stage: Stage;
  route?: RouteKind;
  confidence?: number;
  tags?: string[];
  created: string;
  updated?: string;
  idea: string;
  classification?: string;
  plan?: string;
  tasks?: string;
  buildFile?: string;     // the artifact the agents built (HTML in the Agent Factory project)
  vaultPath?: string;     // relative path for the "in Obsidian" hint
}

// ── tiny frontmatter codec (yaml head + ## sections in the body) ───────────────
const SECTION_MAP: Record<string, keyof PipelineItem> = {
  "Idea": "idea", "Classification": "classification", "Proposed Plan": "plan", "Tasks": "tasks",
};

function parseItem(raw: string, slug: string): PipelineItem {
  let fm: Record<string, unknown> = {}; let body = raw;
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) { try { fm = (yaml.load(m[1]) as Record<string, unknown>) || {}; } catch {} body = m[2]; }
  const item: PipelineItem = {
    slug: (fm.slug as string) || slug,
    title: (fm.title as string) || slug,
    stage: (fm.stage as Stage) || "inbox",
    route: fm.route as RouteKind | undefined,
    confidence: typeof fm.confidence === "number" ? fm.confidence : undefined,
    tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : undefined,
    created: (fm.created as string) || new Date(0).toISOString(),
    updated: fm.updated as string | undefined,
    buildFile: fm.buildFile as string | undefined,
    idea: "",
  };
  // split body into ## sections
  const parts = body.split(/\n##\s+/);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const head = (nl === -1 ? part : part.slice(0, nl)).trim().replace(/^##\s+/, "");
    const content = (nl === -1 ? "" : part.slice(nl + 1)).trim();
    const key = SECTION_MAP[head];
    if (key) (item as unknown as Record<string, unknown>)[key] = content;
  }
  return item;
}

function serializeItem(it: PipelineItem): string {
  const fm = yaml.dump({
    slug: it.slug, title: it.title, stage: it.stage,
    ...(it.route ? { route: it.route } : {}),
    ...(it.confidence != null ? { confidence: it.confidence } : {}),
    ...(it.tags ? { tags: it.tags } : {}),
    ...(it.buildFile ? { buildFile: it.buildFile } : {}),
    created: it.created, updated: it.updated || new Date().toISOString(),
  }).trim();
  const sec = (h: string, v?: string) => (v && v.trim() ? `\n## ${h}\n\n${v.trim()}\n` : "");
  return `---\n${fm}\n---\n${sec("Idea", it.idea)}${sec("Classification", it.classification)}${sec("Proposed Plan", it.plan)}${sec("Tasks", it.tasks)}`;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
export async function ensureDirs(): Promise<void> {
  if (!ITEMS_DIR) return;
  if (!existsSync(ITEMS_DIR)) await mkdir(ITEMS_DIR, { recursive: true });
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "idea";
}

export async function uniqueSlug(base: string): Promise<string> {
  await ensureDirs();
  let names: string[] = [];
  try { names = await readdir(ITEMS_DIR); } catch {}
  const taken = new Set(names.filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3)));
  let slug = slugify(base); let n = 2;
  while (taken.has(slug)) { slug = `${slugify(base)}-${n}`; n++; }
  return slug;
}

export async function listItems(): Promise<PipelineItem[]> {
  await ensureDirs();
  let names: string[] = [];
  try { names = await readdir(ITEMS_DIR); } catch { return []; }
  const out: PipelineItem[] = [];
  for (const n of names) {
    if (!n.endsWith(".md")) continue;
    try {
      const raw = await readFile(path.join(ITEMS_DIR, n), "utf8");
      const it = parseItem(raw, n.slice(0, -3));
      it.vaultPath = `Agentic OS/Pipeline/items/${n}`;
      out.push(it);
    } catch {}
  }
  out.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
  return out;
}

export async function readItem(slug: string): Promise<PipelineItem | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const f = path.join(ITEMS_DIR, `${slug}.md`);
  if (!existsSync(f)) return null;
  try { const raw = await readFile(f, "utf8"); const it = parseItem(raw, slug); it.vaultPath = `Agentic OS/Pipeline/items/${slug}.md`; return it; } catch { return null; }
}

export async function writeItem(it: PipelineItem): Promise<void> {
  await ensureDirs();
  it.updated = new Date().toISOString();
  await writeFile(path.join(ITEMS_DIR, `${it.slug}.md`), serializeItem(it), "utf8");
}

// ── local agent (Ollama) — classify, plan, tasks. All on-device, $0 ───────────
const OLLAMA = process.env.OLLAMA_HOST || "http://localhost:11434";
function localModel(): string {
  try {
    const env = readFileSync(path.join(os.homedir(), ".fcc", ".env"), "utf8");
    const line = env.split("\n").find((l) => l.startsWith("MODEL="));
    if (line) { const v = line.slice(6).replace(/^["']|["']$/g, "").trim(); if (v.startsWith("ollama/")) return v.slice(7); }
  } catch {}
  return "gemma4:latest";
}

async function chatOnce(system: string, user: string, maxTokens: number, signal?: AbortSignal): Promise<string> {
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST", headers: { "content-type": "application/json" }, signal,
    body: JSON.stringify({ model: localModel(), stream: false, keep_alive: "10m",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      options: { num_predict: maxTokens, temperature: 0.4 } }),
  });
  if (!r.ok) throw new Error(`local model unreachable (${r.status}) — is Ollama running?`);
  const j = await r.json();
  return String(j?.message?.content ?? "").trim();
}

// Local models occasionally return an empty completion — retry once before giving up.
async function chat(system: string, user: string, maxTokens = 700, signal?: AbortSignal): Promise<string> {
  let out = await chatOnce(system, user, maxTokens, signal);
  if (!out && !signal?.aborted) out = await chatOnce(system, user, maxTokens, signal);
  return out;
}

export async function classifyIdea(idea: string, signal?: AbortSignal): Promise<{ route: RouteKind; title: string; confidence: number; tags: string[] }> {
  const sys = `You are an inbox classifier for a personal knowledge + project system. Given a raw idea, decide what it is and output ONLY minified JSON (no prose, no code fences). Schema: {"route":"project|action|idea|reference|escalate","title":"max 8 word title","confidence":0.0-1.0,"tags":["lowercase","short"]}. Meanings — project: a multi-step thing to build/ship (app, website, content series, system); action: a single concrete task; idea: a thought to park for later; reference: information to retain; escalate: too unclear, a human should decide.`;
  const raw = await chat(sys, idea.slice(0, 1500), 200, signal);
  let parsed: { route?: string; title?: string; confidence?: number; tags?: string[] } = {};
  try { const j = raw.match(/\{[\s\S]*\}/); parsed = j ? JSON.parse(j[0]) : {}; } catch {}
  const route = (["project", "action", "idea", "reference", "escalate"].includes(parsed.route || "") ? parsed.route : "escalate") as RouteKind;
  return {
    route,
    title: (parsed.title || idea.split("\n")[0]).slice(0, 80),
    confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6).map((t) => String(t)) : [],
  };
}

export async function draftPlan(idea: string, title: string, tags: string[], signal?: AbortSignal): Promise<string> {
  const sys = `You are a senior project planner. Given an idea, write a tight PROPOSED PLAN in markdown with EXACTLY these sections:\n**What it is** — 1–2 sentences.\n**Approach** — 3–5 bullets.\n**First milestones** — 3–5 markdown checkboxes (- [ ] ...).\n**Who builds it** — the subagents/roles needed (e.g. researcher, designer, coder, copywriter, deployer).\nBe concrete and concise. Output markdown only — no preamble.`;
  const out = await chat(sys, `Idea: ${idea.slice(0, 1500)}\nWorking title: ${title}\nTags: ${tags.join(", ")}`, 700, signal);
  if (out) return out;
  // fallback template if the local model returned nothing
  return `**What it is** — ${title}.\n\n**Approach**\n- Clarify the goal and success criteria\n- Research what already exists\n- Build the smallest shippable version first\n- Review, then expand\n\n**First milestones**\n- [ ] Define scope\n- [ ] Produce a first draft / prototype\n- [ ] Review and ship v1\n\n**Who builds it** — researcher, builder, reviewer (coordinated by a project manager).\n\n_(Auto-drafted fallback — the local model was busy. Re-run "Shape it" for a richer plan.)_`;
}

function fallbackTasks(title: string, plan: string): string {
  const milestones = (plan.match(/- \[ \].+/g) || []).slice(0, 6);
  const roleLine = plan.match(/who builds it[^\n]*[:—-]\s*(.+)/i)?.[1] || "researcher, builder, reviewer";
  const roles = roleLine.split(/[,/]| and /).map((r) => r.replace(/[^a-zA-Z ]/g, "").trim().toLowerCase()).filter(Boolean).slice(0, 4);
  const r = (i: number) => roles[i % (roles.length || 1)] || "builder";
  const base = milestones.length
    ? milestones.map((m, i) => `- [ ] [${r(i)}] ${m.replace(/- \[ \]\s*/, "")}`)
    : [
        `- [ ] [${r(0)}] research references + define scope for ${title}`,
        `- [ ] [${r(1)}] draft the first version`,
        `- [ ] [${r(2)}] review against the goal`,
        `- [ ] [${r(0)}] revise and finalize`,
        `- [ ] [${r(1)}] ship v1`,
      ];
  return `${base.join("\n")}\n\n_Project manager: coordinates the above._`;
}

export async function breakIntoTasks(title: string, plan: string, signal?: AbortSignal): Promise<string> {
  const out = await chat(
    `You are a project manager. Break the project plan into an execution checklist of 6–10 tasks. Format each as a markdown checkbox tagged with the responsible subagent, e.g. "- [ ] [researcher] gather competitor examples". End with "Project manager: coordinates the above."`,
    `Project: ${title}\n\nPlan:\n${plan.slice(0, 2000)}\n\nOutput the checklist now:`, 600, signal,
  );
  return out || fallbackTasks(title, plan);
}

// ── Execute: subagents actually BUILD a visual artifact (single-page HTML) ─────
function extractHtml(text: string): string {
  const fence = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  let h = fence ? fence[1] : text;
  const start = h.search(/<!DOCTYPE html|<html/i);
  if (start > 0) h = h.slice(start);
  const end = h.toLowerCase().lastIndexOf("</html>");
  if (end !== -1) h = h.slice(0, end + 7);
  return h.trim();
}
async function uniqueFile(dir: string, slug: string): Promise<string> {
  let names: string[] = [];
  try { names = await readdir(dir); } catch {}
  let name = `${slug}.html`; let n = 2;
  while (names.includes(name)) { name = `${slug}-${n}.html`; n++; }
  return name;
}

// ── Build backends — a real coder model, not the general chat model ───────────
type Msg = { role: "system" | "user" | "assistant"; content: string };

function openrouterKey(): string | null {
  const files = [path.join(os.homedir(), ".fcc", ".env"), path.join(os.homedir(), ".hermes", "profiles", "julian", ".env")];
  for (const f of files) {
    try {
      const line = readFileSync(f, "utf8").split("\n").find((l) => l.startsWith("OPENROUTER_API_KEY="));
      if (line) { const v = line.slice("OPENROUTER_API_KEY=".length).replace(/^["']|["']$/g, "").trim(); if (v.startsWith("sk-or")) return v; }
    } catch { /* */ }
  }
  return null;
}

// Cloud free coder (qwen3-coder:free) — proven to produce complete, high-quality builds.
async function orChat(messages: Msg[], maxTokens: number, signal?: AbortSignal): Promise<string> {
  const key = openrouterKey(); if (!key) return "";
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, signal,
      body: JSON.stringify({ model: "qwen/qwen3-coder:free", messages, max_tokens: maxTokens, temperature: 0.6 }),
    });
    if (!r.ok) return "";
    const j = await r.json();
    return String(j?.choices?.[0]?.message?.content ?? "");
  } catch { return ""; }
}

// Best LOCAL coder available (qwen2.5-coder if pulled, else the general model).
async function ollamaBuildModel(): Promise<string> {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`);
    const names = ((await r.json())?.models ?? []).map((m: { name: string }) => m.name);
    for (const p of ["qwen2.5-coder:14b", "qwen2.5-coder:32b", "qwen2.5-coder:7b", "qwen2.5-coder:latest"]) if (names.includes(p)) return p;
  } catch { /* */ }
  return localModel();
}
async function olChat(messages: Msg[], maxTokens: number, signal?: AbortSignal): Promise<string> {
  try {
    const r = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST", headers: { "content-type": "application/json" }, signal,
      body: JSON.stringify({ model: await ollamaBuildModel(), stream: false, keep_alive: "10m", messages, options: { num_predict: maxTokens, temperature: 0.5 } }),
    });
    if (!r.ok) return "";
    return String((await r.json())?.message?.content ?? "");
  } catch { return ""; }
}

// Generate a COMPLETE html doc — continue until </html> appears (no more truncation).
async function generateComplete(call: (m: Msg[], t: number, s?: AbortSignal) => Promise<string>, sys: string, user: string, maxTokens: number, signal?: AbortSignal): Promise<string> {
  const base: Msg[] = [{ role: "system", content: sys }, { role: "user", content: user }];
  let full = "";
  for (let pass = 0; pass < 3; pass++) {
    if (signal?.aborted) break;
    const msgs = pass === 0 ? base : [...base, { role: "assistant" as const, content: full }, { role: "user" as const, content: "Continue the HTML file from exactly where you stopped. Output ONLY the remaining code — no repetition, no commentary. Finish with </html>." }];
    const out = await call(msgs, maxTokens, signal);
    if (!out) break;
    full += out;
    if (/<\/html>/i.test(full)) break;
  }
  return full;
}

const BUILD_BRIEF =
  "You are an award-winning front-end engineer and designer — the bar is Stripe, Linear, Vercel, and Awwwards winners. Build ONE complete, self-contained HTML file.\n\n" +
  "HARD RULES:\n" +
  "- Vanilla HTML/CSS/JS only. You MAY load Google Fonts via a <link>. NO JS libraries, NO frameworks, NO code CDNs, no build step. Inline all CSS and JS.\n" +
  "- The file MUST be COMPLETE and fully WORKING. Every section finished, every interaction functional. No placeholders, no TODO, no '...', no cut-off code. Do NOT stop until you output </html>.\n" +
  "- World-class visual design: a cohesive color system, beautiful modern type, generous spacing, depth (soft shadows, gradients, subtle glow), tasteful motion (hover states, transitions, entrance/scroll animations), and polish on every element.\n" +
  "- Fully responsive. Premium dark aesthetic by default.\n" +
  "- If a GAME: genuinely playable — controls, scoring, win/lose, restart. If a SITE/landing/app: real nav, a strong hero, several real content sections, and a footer. If a VISUALIZATION: smooth 60fps interactive canvas.\n\n" +
  "Output ONLY the HTML, starting with <!DOCTYPE html> and ending with </html>. No markdown fences, no commentary.";

// Build the project's deliverable — a genuinely impressive, complete single-page build.
export async function buildArtifact(item: PipelineItem, signal?: AbortSignal): Promise<string | null> {
  const dir = (await ensureProject(BUILD_PROJECT)) ?? path.join(FCC_SCRATCH_ROOT, BUILD_PROJECT);
  const user = `Build this deliverable and make it look incredible.\n\nProject: ${item.title}\nThe idea: ${item.idea.slice(0, 900)}\n\nFollow this plan as the spec:\n${(item.plan || "").slice(0, 1600)}`;

  // Try the cloud free coder first (best quality + big budget), fall back to local coder.
  let raw = await generateComplete(orChat, BUILD_BRIEF, user, 7000, signal);
  if (!signal?.aborted && (!raw || !/<\/html>/i.test(raw))) {
    const local = await generateComplete(olChat, BUILD_BRIEF, user, 8192, signal);
    if (extractHtml(local).length > extractHtml(raw).length) raw = local;
  }

  let html = extractHtml(raw);
  if (!html || html.length < 200) return null;
  if (!/<\/html>/i.test(html)) html += "\n</body>\n</html>"; // safety close
  const file = await uniqueFile(dir, slugify(item.title));
  await writeFile(path.join(dir, file), html, "utf8");
  return file;
}
