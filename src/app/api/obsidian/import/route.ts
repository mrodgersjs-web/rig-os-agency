// ── Obsidian Import API ──────────────────────────────────────────────
// POST /api/obsidian/import
// Body: { paths?: string[], folder?: string, all?: boolean, maxNotes?: number }
// Imports vault notes into the app's knowledge base (stored as JSON in the
// .rig/knowledge-base directory or returned as structured data for the UI).

import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import os from "os";
import { getNote, listNotes, getRecentNotes, getVaultStats } from "@/lib/obsidian";

export const dynamic = "force-dynamic";

interface ImportBody {
  paths?: string[];
  folder?: string;
  all?: boolean;
  maxNotes?: number;
  recent?: boolean;
}

export async function POST(req: NextRequest) {
  let body: ImportBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const importedNotes: { path: string; title: string; status: "imported" | "skipped" | "error" }[] = [];
    const knowledgeBaseDir = join(os.homedir(), ".rig", "knowledge-base");
    await mkdir(knowledgeBaseDir, { recursive: true }).catch(() => {});

    // Determine which notes to import
    let notePaths: string[] = [];

    if (body.paths && body.paths.length > 0) {
      notePaths = body.paths;
    } else if (body.recent) {
      const recent = await getRecentNotes(body.maxNotes ?? 20);
      notePaths = recent.map((n) => n.path);
    } else if (body.all || body.folder) {
      const all = await listNotes({ maxNotes: body.maxNotes ?? 500 });
      notePaths = body.folder
        ? all.filter((n) => n.folder === body.folder).map((n) => n.path)
        : all.map((n) => n.path);
    } else {
      // Default: import recent 12
      const recent = await getRecentNotes(12);
      notePaths = recent.map((n) => n.path);
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const notePath of notePaths) {
      try {
        const note = await getNote(notePath);
        if (!note || !note.content) {
          importedNotes.push({ path: notePath, title: note?.title ?? notePath, status: "error" });
          errors++;
          continue;
        }

        // Write to knowledge base as JSON
        const safeName = notePath.replace(/\//g, "__").replace(/\.md$/, "");
        const outPath = join(knowledgeBaseDir, `${safeName}.json`);
        const entry = {
          source: "obsidian",
          vaultPath: note.path,
          title: note.title,
          folder: note.folder,
          content: note.content,
          excerpt: note.excerpt,
          importedAt: new Date().toISOString(),
          size: note.size,
          mtime: note.mtime,
        };
        await writeFile(outPath, JSON.stringify(entry, null, 2));
        importedNotes.push({ path: notePath, title: note.title, status: "imported" });
        imported++;
      } catch {
        importedNotes.push({ path: notePath, title: notePath, status: "error" });
        errors++;
      }
    }

    // Write import manifest
    const manifest = {
      importedAt: new Date().toISOString(),
      totalRequested: notePaths.length,
      imported,
      skipped,
      errors,
      notes: importedNotes,
    };
    await writeFile(join(knowledgeBaseDir, "last-import.json"), JSON.stringify(manifest, null, 2));

    return NextResponse.json({
      success: true,
      ...manifest,
      knowledgeBaseDir,
    });
  } catch (err) {
    console.error("[obsidian-import] error:", err);
    return NextResponse.json(
      { error: "Import failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}