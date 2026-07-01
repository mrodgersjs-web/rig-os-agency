import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { SITES } from "@/lib/seoPipeline";
import { startDeploy, finishDeploy } from "@/lib/seoHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Build + deploy a single site to Netlify, streaming each step's output back as NDJSON events.
//   1. npx @11ty/eleventy
//   2. netlify deploy --prod --dir=_site

// Find the most recent .md slug in a posts dir, so we can pin "liveSlug" for the deploy log.
async function mostRecentSlug(dir: string): Promise<string | undefined> {
  try {
    const items = await readdir(dir);
    const mds = items.filter((f) => /\.md$/.test(f));
    const stats = await Promise.all(mds.map(async (f) => {
      try { const s = await stat(path.join(dir, f)); return { f, m: s.mtimeMs }; }
      catch { return { f, m: 0 }; }
    }));
    stats.sort((a, b) => b.m - a.m);
    return stats[0]?.f.replace(/\.md$/, "");
  } catch { return undefined; }
}

// Parse a Netlify CLI "Website URL: https://..." or "Live URL: https://..." or deploy URL line.
function findNetlifyUrl(text: string): string | undefined {
  const patterns = [
    /Website URL:\s*(https?:\/\/[^\s]+)/i,
    /Live URL:\s*(https?:\/\/[^\s]+)/i,
    /Unique deploy URL:\s*(https?:\/\/[^\s]+)/i,
    /Website draft URL:\s*(https?:\/\/[^\s]+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1];
  }
  return undefined;
}

export async function POST(req: Request) {
  const { siteId } = await req.json();
  const site = SITES.find((s) => s.id === siteId);
  if (!site) return new Response("unknown site", { status: 400 });
  if (!existsSync(site.path)) return new Response("site path missing", { status: 500 });

  // Hoist sitePath into a non-nullable local so TS sees it as string inside
  // the nested async runStep() closure (TS 5.9 + Next 16 strict mode don't
  // propagate the existsSync(site.path) narrowing across the closure).
  const sitePath: string = site.path;

  const liveSlug = await mostRecentSlug(site.postsDir);

  // Log deploy start
  const deploy = await startDeploy({
    siteId: site.id,
    siteName: site.name,
    blogBaseUrl: site.url,
    liveSlug,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      let allOutput = "";
      let stderrTail = "";

      async function runStep(label: string, cmd: string, args: string[]) {
        emit({ type: "step", label, cmd: `${cmd} ${args.join(" ")}` });
        return new Promise<number>((resolve) => {
          const p = spawn(cmd, args, { cwd: sitePath, env: { ...process.env, NO_COLOR: "1", CI: "1" } });
          p.stdout.on("data", (b) => {
            const t = b.toString();
            allOutput += t;
            emit({ type: "stdout", label, text: t });
          });
          p.stderr.on("data", (b) => {
            const t = b.toString();
            allOutput += t;
            stderrTail = (stderrTail + t).slice(-2000);
            emit({ type: "stderr", label, text: t });
          });
          p.on("close", (code) => { emit({ type: "step_end", label, code }); resolve(code ?? 0); });
          p.on("error", (e) => { emit({ type: "error", label, text: String(e) }); resolve(1); });
        });
      }

      try {
        emit({
          type: "start",
          site: site.id,
          path: sitePath,
          liveSlug,
          liveUrl: liveSlug ? `${site.url}/blog/${liveSlug}/` : undefined,
          deployId: deploy.id,
        });

        const buildCode = await runStep("build (11ty)", "npx", ["@11ty/eleventy"]);
        if (buildCode !== 0) {
          await finishDeploy(deploy.id, { status: "failed", errorTail: stderrTail });
          emit({ type: "done", code: buildCode, ok: false, reason: "build failed", deployId: deploy.id });
          controller.close();
          return;
        }

        const deployCode = await runStep("deploy (netlify)", "netlify", ["deploy", "--prod", "--dir=_site"]);
        const netlifyUrl = findNetlifyUrl(allOutput);
        await finishDeploy(deploy.id, {
          status: deployCode === 0 ? "ok" : "failed",
          netlifyUrl,
          errorTail: deployCode === 0 ? undefined : stderrTail,
        });

        emit({
          type: "done",
          code: deployCode,
          ok: deployCode === 0,
          netlifyUrl,
          liveUrl: liveSlug ? `${site.url}/blog/${liveSlug}/` : undefined,
          deployId: deploy.id,
        });
      } catch (e) {
        await finishDeploy(deploy.id, { status: "failed", errorTail: String(e) });
        emit({ type: "error", text: String(e), deployId: deploy.id });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
