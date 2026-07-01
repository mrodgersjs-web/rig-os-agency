// Fast Jarvis voice pipeline.
//
// The old path spawned `hermes -z` per turn — a full agent COLD BOOT (~28s).
// This routes Jarvis two ways instead:
//   - "fast"  : a DIRECT chat completion to the same model Hermes uses
//               (OpenRouter claude-3.5-haiku) — no agent overhead (~1.7s).
//   - "agent" : the WARM Hermes API server on :8642 (~8s) — keeps tools so it
//               can actually open apps / run commands on the Mac.
//
// Keys/model are read SERVER-SIDE from the active Hermes profile, never returned
// to the browser.

import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { run } from "@/lib/runner";

const HOME = os.homedir();

function activeProfile(): string {
  try {
    const p = readFileSync(path.join(HOME, ".hermes", "active_profile"), "utf8").trim();
    if (p) return p;
  } catch { /* fall through */ }
  return process.env.HERMES_PROFILE || "main";
}

function profileDir(): string {
  return path.join(HOME, ".hermes", "profiles", activeProfile());
}

function readEnv(name: string): string | null {
  const f = path.join(profileDir(), ".env");
  if (!existsSync(f)) return process.env[name]?.trim() || null;
  try {
    const line = readFileSync(f, "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).replace(/^["']|["']$/g, "").trim() || null;
  } catch { /* ignore */ }
  return process.env[name]?.trim() || null;
}

// The model Hermes is configured to use (so Jarvis tracks the same one).
export function hermesModel(): string {
  try {
    const cfg = readFileSync(path.join(profileDir(), "config.yaml"), "utf8");
    const m = cfg.match(/^\s*default:\s*([^\s#]+)/m);
    if (m) return m[1].trim();
  } catch { /* ignore */ }
  return "anthropic/claude-3.5-haiku";
}

const FAST_PERSONA =
  "You are JARVIS — Tony Stark's AI from Iron Man — speaking live to me through my Mac. " +
  "Persona: a refined, composed British AI butler. Address me as \"sir\". Be unflappable, precise, " +
  "and lightly dry-witted; never break character. Answer in ONE short, in-character sentence. " +
  "You are in fast conversational mode — you advise and answer, you do not run commands.";

// AUTO: the fast model can OPEN apps/sites itself (executed directly by the
// server — fast + safe), and escalate genuinely complex tasks to the full agent.
const AUTO_PERSONA =
  "You are JARVIS — Tony Stark's refined British AI butler — live on my Mac. Address me as \"sir\"; " +
  "never break character.\n" +
  "Decide what I want and respond in ONE of these exact forms:\n" +
  "1. To OPEN an app or website: first line `OPEN: <target>` where <target> is a full https:// URL " +
  "for a website (e.g. OPEN: https://google.com) or the macOS app name (e.g. OPEN: Notes); second line: " +
  "one short in-character confirmation (e.g. \"Opening Google now, sir.\").\n" +
  "2. For a genuinely multi-step task or real file/shell/computer work beyond just opening something: " +
  "respond with EXACTLY `AGENT: <the task restated in one line>` and nothing else.\n" +
  "3. Otherwise (questions, chat): just answer in ONE short, in-character sentence — no prefix.";

const AGENT_PERSONA =
  "[You are JARVIS — Tony Stark's AI from Iron Man — running live on my Mac. Persona: a refined, " +
  "composed British AI butler. Address me as \"sir\". Be unflappable, precise, lightly dry-witted; " +
  "never break character. BE FAST. To OPEN a website or app, run the shell `open` command " +
  "(e.g. `open -a \"Google Chrome\" https://google.com`). Only use computer-use when you must click/" +
  "type/read something already on screen. Keep your final spoken reply to ONE short, in-character " +
  "sentence (e.g. \"Right away, sir.\").]";

export interface JarvisMsg { role: "user" | "assistant"; content: string; }

export interface JarvisResult { ok: boolean; text: string; ms: number; mode: "auto" | "fast" | "agent"; error?: string; }

// Low-level: one direct OpenRouter completion (no Hermes agent). ~1.7s.
async function complete(persona: string, prompt: string, history: JarvisMsg[]): Promise<{ text: string; error?: string }> {
  const key = readEnv("OPENROUTER_API_KEY");
  if (!key) return { text: "", error: "No OPENROUTER_API_KEY in the active Hermes profile." };
  const messages = [{ role: "system", content: persona }, ...history.slice(-6), { role: "user", content: prompt }];
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: hermesModel(), messages, max_tokens: 96, temperature: 0.45 }),
      signal: ctrl.signal,
    });
    const j = await r.json();
    const text = String(j?.choices?.[0]?.message?.content ?? "").trim();
    return text ? { text } : { text: "", error: j?.error?.message || "empty reply" };
  } catch (e) {
    return { text: "", error: String(e) };
  } finally { clearTimeout(to); }
}

// Execute `open` directly (NO shell → no injection). Only the macOS `open`
// command, with a validated URL or app name. Fast (~0.3s).
function runOpen(target: string): Promise<boolean> {
  return new Promise((resolve) => {
    const t = target.trim();
    let args: string[];
    const looksUrl = /^https?:\/\//i.test(t) || /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(t);
    if (looksUrl) {
      const url = /^https?:\/\//i.test(t) ? t : `https://${t}`;
      if (!/^https?:\/\/[\w.\-/?=&%#~+:@]+$/i.test(url)) return resolve(false);
      args = [url];
    } else {
      if (!/^[\w .'&\-]{1,40}$/.test(t)) return resolve(false); // app name only
      args = ["-a", t];
    }
    try {
      const c = spawn("open", args, { stdio: "ignore" });
      c.on("close", (code) => resolve(code === 0));
      c.on("error", () => resolve(false));
    } catch { resolve(false); }
  });
}

// FAST: pure conversational, no actions. ~2s.
async function fast(prompt: string, history: JarvisMsg[]): Promise<JarvisResult> {
  const started = Date.now();
  const { text, error } = await complete(FAST_PERSONA, prompt, history);
  return { ok: !!text, text, ms: Date.now() - started, mode: "fast", error };
}

// AGENT: the reliable full Hermes CLI (executes tools — verified). ~28s.
async function agent(prompt: string, history: JarvisMsg[]): Promise<JarvisResult> {
  const started = Date.now();
  const ctx = history.slice(-4).map((m) => `${m.role === "user" ? "Me" : "You"}: ${m.content}`).join("\n");
  const full = `${AGENT_PERSONA}\n\n${ctx ? ctx + "\n\n" : ""}Command: ${prompt}`;
  const out = await run("hermes", ["-z", full, "--yolo", "--accept-hooks"], { timeoutMs: 6 * 60 * 1000 });
  const text = out.stdout.replace(/\x1b\[[0-9;?]*[a-zA-Z]|\x1b\]\d+;[^\x07\x1b]*(\x07|\x1b\\)/g, "").trim();
  return { ok: out.ok && !!text, text: text || "(no reply — check `hermes status`)", ms: Date.now() - started, mode: "agent", error: text ? undefined : out.stderr.slice(-300) };
}

// AUTO: fast model decides — answer (fast), OPEN an app/site (fast direct exec),
// or escalate a complex task to the full agent. Best default for a voice butler.
async function auto(prompt: string, history: JarvisMsg[]): Promise<JarvisResult> {
  const started = Date.now();
  const { text, error } = await complete(AUTO_PERSONA, prompt, history);
  if (!text) return { ok: false, text: "", ms: Date.now() - started, mode: "auto", error };

  const openM = text.match(/^OPEN:\s*(.+?)\s*$/im);
  if (openM) {
    const target = openM[1];
    const ok = await runOpen(target);
    const confirm = text.split("\n").map((l) => l.trim()).find((l) => l && !/^OPEN:/i.test(l));
    return {
      ok: true, mode: "auto", ms: Date.now() - started,
      text: ok ? (confirm || `Opening ${target} now, sir.`) : `I couldn't open ${target}, sir — try Agent mode.`,
    };
  }

  const agentM = text.match(/^AGENT:\s*(.+)$/im);
  if (agentM) {
    const r = await agent(agentM[1], history); // escalate to the real agent
    return { ...r, mode: "auto" };
  }

  return { ok: true, text, ms: Date.now() - started, mode: "auto" };
}

export async function jarvisReply(prompt: string, mode: "auto" | "fast" | "agent", history: JarvisMsg[] = []): Promise<JarvisResult> {
  if (mode === "agent") return agent(prompt, history);
  if (mode === "fast") return fast(prompt, history);
  return auto(prompt, history);
}
