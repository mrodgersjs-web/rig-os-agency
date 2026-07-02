import { writeFile, readdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { FCC_SCRATCH_ROOT, ensureProject } from "@/lib/freeClaudeWorkspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fast "speak → build" generation. We do NOT route through the Claude agentic
// CLI (its tool-use loop hangs local general models). Instead we ask the local
// Ollama model for the HTML in ONE shot, stream the tokens to the UI, then write
// the file ourselves. ~30s on an M4 Max vs minutes through the agent loop.

const OLLAMA = process.env.OLLAMA_HOST || "http://localhost:11434";

function localModel(): string {
  try {
    const env = readFileSync(path.join(os.homedir(), ".fcc", ".env"), "utf8");
    const line = env.split("\n").find((l) => l.startsWith("MODEL="));
    if (line) {
      const v = line.slice(6).replace(/^["']|["']$/g, "").trim();
      if (v.startsWith("ollama/")) return v.slice("ollama/".length);
    }
  } catch { /* ignore */ }
  return "gemma4:latest";
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "build";
}

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
  try { names = await readdir(dir); } catch { /* */ }
  let name = `${slug}.html`;
  let n = 2;
  while (names.includes(name)) { name = `${slug}-${n}.html`; n++; }
  return name;
}

export async function POST(req: Request) {
  let body: { prompt?: string; project?: string };
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const prompt = (body.prompt ?? "").toString().trim().slice(0, 2000);
  if (!prompt) return new Response("empty prompt", { status: 400 });

  const projectName = typeof body.project === "string" && /^[A-Za-z0-9_.-]+$/.test(body.project)
    ? body.project : "free-claude-code";
  const dir = (await ensureProject(projectName)) ?? path.join(FCC_SCRATCH_ROOT, projectName);
  const model = localModel();

  const system = "You are a world-class creative front-end developer. Output ONLY a single, complete, self-contained HTML file — vanilla JS + HTML5 canvas where useful, NO external libraries, no build step. It must be visually stunning, full-window, dark background, smooth 60fps. Start your output with <!DOCTYPE html> and output NOTHING else: no markdown fences, no explanation, no preamble.";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (o: unknown) => { try { controller.enqueue(enc.encode(JSON.stringify(o) + "\n")); } catch { /* */ } };
      let full = "";
      try {
        const r = await fetch(`${OLLAMA}/api/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model, stream: true,
            messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
            options: { num_predict: 4096, temperature: 0.7 },
          }),
        });
        if (!r.ok || !r.body) {
          send({ t: "error", m: `local model not reachable (ollama ${r.status}). Is Ollama running?` });
          controller.close(); return;
        }
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const j = JSON.parse(line);
              const tok = j?.message?.content;
              if (tok) { full += tok; send({ t: "d", c: tok }); }
            } catch { /* */ }
          }
        }
      } catch (e) {
        send({ t: "error", m: String(e).slice(0, 200) });
        controller.close(); return;
      }

      const html = extractHtml(full);
      if (!html || html.length < 40) {
        send({ t: "error", m: "model did not return usable HTML — try rephrasing." });
        controller.close(); return;
      }
      try {
        const file = await uniqueFile(dir, slugify(prompt));
        await writeFile(path.join(dir, file), html, "utf8");
        send({ t: "done", file, bytes: html.length });
      } catch (e) {
        send({ t: "error", m: `could not save file: ${String(e).slice(0, 120)}` });
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}

// avoid unused import lint
void existsSync;
