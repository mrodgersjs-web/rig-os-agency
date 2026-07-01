import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createProject } from "@/lib/videoProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/video/hyperframes/init
// Body: { prompt: string, slug?: string }
//
// Creates a new HyperFrames project. We DO NOT spawn `npx hyperframes init` —
// that's interactive + slow + downloads templates. Instead we drop a minimal
// hyperframes.json + index.html with the prompt baked in so Hermes/agents can
// edit it next. The CLI's `render` command works fine on the bare files.

const STARTER_INDEX_HTML = (prompt: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${prompt.slice(0, 60)}</title>
<style>
  body { margin: 0; background: #15101a; color: #f3ebda; font-family: system-ui, sans-serif; }
  #stage {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: linear-gradient(135deg, #15101a, #2e2436);
  }
  .title {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    text-align: center;
    padding: 80px;
  }
  .title h1 {
    font-size: 96px;
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1.05;
    color: #f3ebda;
    margin: 0 0 24px;
    opacity: 0;
    animation: fadeIn 1s ease-out 0.5s forwards;
  }
  .title p {
    font-size: 32px;
    color: #d4a574;
    opacity: 0;
    animation: fadeIn 1s ease-out 1.5s forwards;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body>
<div id="stage" data-composition-id="agent-os-starter" data-start="0" data-width="1920" data-height="1080" data-duration="5" data-fps="30">
  <div class="title">
    <h1>${prompt.replace(/</g, "&lt;").slice(0, 200)}</h1>
    <p>Made with Agent OS · HyperFrames</p>
  </div>
</div>
</body>
</html>
`;

const HYPERFRAMES_JSON = (slug: string) => JSON.stringify({
  name: slug,
  composition: "index.html",
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 5,
}, null, 2);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? "").trim();
  const customSlug = typeof body.slug === "string" ? body.slug : undefined;
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });
  if (prompt.length > 2000) return NextResponse.json({ error: "prompt too long" }, { status: 413 });

  // Create the directory + sidecar
  const { slug, cwd } = await createProject(prompt, customSlug);

  // Write starter files
  await writeFile(path.join(cwd, "index.html"), STARTER_INDEX_HTML(prompt));
  await writeFile(path.join(cwd, "hyperframes.json"), HYPERFRAMES_JSON(slug));
  // Output dir for renders
  await mkdir(path.join(cwd, "out"), { recursive: true });

  return NextResponse.json({
    ok: true,
    slug,
    cwd,
    indexUrl: `/api/video/preview/project/${encodeURIComponent(slug)}/index.html`,
    nextSteps: [
      "Edit index.html — change the animation, add clips, swap text",
      "POST /api/video/hyperframes/render { slug } to render an MP4",
    ],
  });
}
