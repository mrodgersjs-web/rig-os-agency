// ── RIG OS Agency — Obsidian Enrichment API ────────────────────────────
// GET /api/agency/obsidian
// Returns enriched vault data: recent sessions, research, artifacts,
// goal-loop progress, work log, vault stats, and search capability.
//
// GET /api/agency/obsidian?action=search&q=<query>
// Search across the entire vault.
//
// GET /api/agency/obsidian?action=note&path=<relative-path>
// Read a single note with full content.

import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir, stat } from "fs/promises";
import { join, relative, basename, dirname, extname } from "path";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VAULT_PATH = join(os.homedir(), "Documents", "JakeStudio");
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const EXCLUDE_DIRS = [".obsidian", ".git", ".trash", "node_modules"];

// ── Types ────────────────────────────────────────────────────────────

interface VaultNote {
  path: string;
  title: string;
  folder: string;
  size: number;
  mtime: string;
  ctime: string;
  preview?: string;
  content?: string;
  tags?: string[];
}

interface SessionLog {
  date: string;
  title: string;
  path: string;
  entries: SessionEntry[];
  size: number;
  mtime: string;
}

interface SessionEntry {
  time: string;
  agent: string;
  type: string;
  summary: string;
}

interface ResearchEntry {
  path: string;
  title: string;
  subfolder: string;
  size: number;
  mtime: string;
  preview: string;
}

interface ArtifactEntry {
  path: string;
  title: string;
  size: number;
  mtime: string;
  preview: string;
}

interface GoalLoopProgress {
  proofPacketPath: string;
  proofPacketContent: string;
  auditPath: string | null;
  auditContent: string | null;
  processOutlinePath: string;
  processOutlineContent: string;
  runId: string;
  verdict: string;
  timestamp: string;
}

interface WorkLogEntry {
  date: string;
  title: string;
  content: string;
}

interface VaultStats {
  vaultPath: string;
  totalFiles: number;
  totalWords: number;
  totalSize: number;
  totalFolders: number;
  lastModified: string;
  folders: { name: string; count: number; size: number }[];
  topByWords: { title: string; path: string; words: number; mtime: string }[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function titleFromPath(filePath: string): string {
  const base = basename(filePath, ".md");
  const cleaned = base.replace(/^\d{4}-\d{2}-\d{2}\s*[—–-]\s*/, "");
  return cleaned || base;
}

function folderFromPath(filePath: string): string {
  const dir = dirname(filePath);
  return dir === "." ? "Root" : dir.split("/")[0];
}

function stripYaml(md: string): string {
  const lines = md.split("\n");
  if (lines[0]?.trim() === "---") {
    const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (endIdx > 0) {
      return lines.slice(endIdx + 1).join("\n").trim();
    }
  }
  return md;
}

function countWords(md: string): number {
  const text = stripYaml(md);
  return text.split(/\s+/).filter(Boolean).length;
}

function extractPreview(md: string, length = 300): string {
  const text = stripYaml(md);
  return text.slice(0, length).replace(/[#*`\[\]]/g, "").trim();
}

function extractTags(md: string): string[] {
  const yamlMatch = md.match(/^---\n([\s\S]*?)\n---/);
  if (!yamlMatch) return [];
  const tagLine = yamlMatch[1].match(/tags:\n([\s\S]*?)(?=\n[a-z]|\n---|$)/i);
  if (!tagLine) return [];
  return tagLine[1]
    .split("\n")
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

/** Recursively find all .md files in a directory. */
async function findMdFiles(
  dir: string,
  baseDir: string = dir,
  exclude: string[] = EXCLUDE_DIRS
): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (exclude.includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        const sub = await findMdFiles(full, baseDir, exclude);
        results.push(...sub);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(relative(baseDir, full));
      }
    }
  } catch {
    // Permission errors — skip silently
  }
  return results;
}

/** Read a markdown file safely. */
async function safeRead(fullPath: string): Promise<string | null> {
  try {
    return await readFile(fullPath, "utf-8");
  } catch {
    return null;
  }
}

/** Stat a file safely. */
async function safeStat(fullPath: string) {
  try {
    return await stat(fullPath);
  } catch {
    return null;
  }
}

// ── Data gatherers ───────────────────────────────────────────────────

/** Recent session logs from Memory/Agent Sessions/ (last 7 days). */
async function getRecentSessions(): Promise<SessionLog[]> {
  const sessionsDir = join(VAULT_PATH, "Memory", "Agent Sessions");
  const files = await findMdFiles(sessionsDir, sessionsDir);
  const now = Date.now();
  const recent: SessionLog[] = [];

  for (const file of files) {
    const fullPath = join(sessionsDir, file);
    const st = await safeStat(fullPath);
    if (!st) continue;
    const mtimeMs = st.mtimeMs;
    if (now - mtimeMs > SEVEN_DAYS_MS) continue;

    const raw = await safeRead(fullPath);
    if (!raw) continue;

    // Parse session entries (## HH:MM - agent - type format)
    const entryRegex = /## (\d{2}:\d{2})\s*-\s*(\w+)\s*-\s*(.+?)\n([\s\S]*?)(?=\n## |\n$|$)/g;
    const entries: SessionEntry[] = [];
    let match: RegExpExecArray | null;
    while ((match = entryRegex.exec(raw)) !== null) {
      const summary = match[4]
        .replace(/###.*\n/g, "")
        .replace(/-\s/g, "")
        .split("\n")
        .filter((l) => l.trim() && !l.startsWith("#"))
        .join(" ")
        .trim()
        .slice(0, 200);
      entries.push({
        time: match[1],
        agent: match[2],
        type: match[3],
        summary,
      });
    }

    recent.push({
      date: file.replace(".md", ""),
      title: titleFromPath(file),
      path: `Memory/Agent Sessions/${file}`,
      entries,
      size: st.size,
      mtime: st.mtime.toISOString(),
    });
  }

  return recent.sort((a, b) => b.date.localeCompare(a.date));
}

/** Research entries from Research/ directory. */
async function getResearchEntries(): Promise<ResearchEntry[]> {
  const researchDir = join(VAULT_PATH, "Research");
  const files = await findMdFiles(researchDir, researchDir);
  const results: ResearchEntry[] = [];

  for (const file of files.slice(0, 50)) {
    const fullPath = join(researchDir, file);
    const st = await safeStat(fullPath);
    if (!st) continue;
    const raw = await safeRead(fullPath);
    if (!raw) continue;

    results.push({
      path: `Research/${file}`,
      title: titleFromPath(file),
      subfolder: dirname(file) === "." ? "Root" : dirname(file),
      size: st.size,
      mtime: st.mtime.toISOString(),
      preview: extractPreview(raw),
    });
  }

  return results.sort((a, b) => b.mtime.localeCompare(a.mtime));
}

/** Artifacts from Artifacts/ directory. */
async function getArtifacts(): Promise<ArtifactEntry[]> {
  const artifactsDir = join(VAULT_PATH, "Artifacts");
  const files = await findMdFiles(artifactsDir, artifactsDir);
  const results: ArtifactEntry[] = [];

  for (const file of files.slice(0, 50)) {
    const fullPath = join(artifactsDir, file);
    const st = await safeStat(fullPath);
    if (!st) continue;
    const raw = await safeRead(fullPath);
    if (!raw) continue;

    results.push({
      path: `Artifacts/${file}`,
      title: titleFromPath(file),
      size: st.size,
      mtime: st.mtime.toISOString(),
      preview: extractPreview(raw),
    });
  }

  return results.sort((a, b) => b.mtime.localeCompare(a.mtime));
}

/** Goal loop progress from goal-loop-global-capability/. */
async function getGoalLoopProgress(): Promise<GoalLoopProgress | null> {
  const glDir = join(VAULT_PATH, "goal-loop-global-capability");
  const proofPacketPath = join(glDir, "PROOF-PACKET.md");
  const processOutlinePath = join(glDir, "PROCESS-OUTLINE.md");
  const auditPath = join(glDir, "GOAL-LOOP-AUDIT-2026-06-29.md");

  const [ppContent, poContent, auditContent] = await Promise.all([
    safeRead(proofPacketPath),
    safeRead(processOutlinePath),
    safeRead(auditPath),
  ]);

  if (!ppContent) return null;

  // Parse proof packet metadata
  const runIdMatch = ppContent.match(/\*\*Run ID:\*\*\s*`(.+?)`/);
  const verdictMatch = ppContent.match(/\*\*Verdict:\*\*\s*(.+?)$/m);
  const timestampMatch = ppContent.match(/\*\*Timestamp:\*\*\s*(.+?)$/m);

  return {
    proofPacketPath: "goal-loop-global-capability/PROOF-PACKET.md",
    proofPacketContent: ppContent,
    auditPath: auditContent ? "goal-loop-global-capability/GOAL-LOOP-AUDIT-2026-06-29.md" : null,
    auditContent: auditContent,
    processOutlinePath: "goal-loop-global-capability/PROCESS-OUTLINE.md",
    processOutlineContent: poContent ?? "",
    runId: runIdMatch?.[1] ?? "unknown",
    verdict: verdictMatch?.[1]?.trim() ?? "UNKNOWN",
    timestamp: timestampMatch?.[1]?.trim() ?? "",
  };
}

/** Work log from Memory/work-log.md. */
async function getWorkLog(): Promise<{ path: string; content: string; entries: WorkLogEntry[] } | null> {
  const workLogPath = join(VAULT_PATH, "Memory", "work-log.md");
  const raw = await safeRead(workLogPath);
  if (!raw) return null;

  // Parse entries by ## heading
  const entryRegex = /## (.+?)\n([\s\S]*?)(?=\n## |\n$|$)/g;
  const entries: WorkLogEntry[] = [];
  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(raw)) !== null) {
    entries.push({
      date: match[1].split("—")[0].trim(),
      title: match[1],
      content: match[2].trim().slice(0, 500),
    });
  }

  return {
    path: "Memory/work-log.md",
    content: raw,
    entries: entries.slice(-10), // Last 10 entries
  };
}

/** Total vault statistics. */
async function getVaultStats(): Promise<VaultStats> {
  const allFiles = await findMdFiles(VAULT_PATH);
  const folderMap = new Map<string, { count: number; size: number }>();
  let totalSize = 0;
  let totalWords = 0;
  let lastModified = new Date(0).toISOString();
  const wordCounts: { title: string; path: string; words: number; mtime: string }[] = [];

  // Process in batches to avoid memory issues
  const batchSize = 200;
  for (let i = 0; i < allFiles.length; i += batchSize) {
    const batch = allFiles.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (p) => {
        const full = join(VAULT_PATH, p);
        const st = await safeStat(full);
        if (!st) return;
        const folder = folderFromPath(p);
        const existing = folderMap.get(folder) ?? { count: 0, size: 0 };
        existing.count++;
        existing.size += st.size;
        folderMap.set(folder, existing);
        totalSize += st.size;
        if (st.mtime.toISOString() > lastModified) {
          lastModified = st.mtime.toISOString();
        }

        // Sample word count (first 1000 files for performance)
        if (wordCounts.length < 1000) {
          const raw = await safeRead(full);
          if (raw) {
            const wc = countWords(raw);
            totalWords += wc;
            wordCounts.push({
              title: titleFromPath(p),
              path: p,
              words: wc,
              mtime: st.mtime.toISOString(),
            });
          }
        }
      })
    );
  }

  // Estimate total words from sample
  if (allFiles.length > 1000 && wordCounts.length === 1000) {
    const avgWords = totalWords / 1000;
    totalWords = Math.round(avgWords * allFiles.length);
  }

  const folders = Array.from(folderMap.entries())
    .map(([name, { count, size }]) => ({ name, count, size }))
    .sort((a, b) => b.count - a.count);

  const topByWords = wordCounts
    .sort((a, b) => b.words - a.words)
    .slice(0, 10);

  return {
    vaultPath: VAULT_PATH,
    totalFiles: allFiles.length,
    totalWords,
    totalSize,
    totalFolders: folderMap.size,
    lastModified,
    folders: folders.slice(0, 20),
    topByWords,
  };
}

/** Search across vault. */
async function searchVault(
  query: string,
  maxResults: number = 30
): Promise<VaultNote[]> {
  const lower = query.toLowerCase();
  const allFiles = await findMdFiles(VAULT_PATH);
  const matches: VaultNote[] = [];

  for (const p of allFiles) {
    const title = titleFromPath(p).toLowerCase();
    const pathLower = p.toLowerCase();
    if (title.includes(lower) || pathLower.includes(lower)) {
      const fullPath = join(VAULT_PATH, p);
      const st = await safeStat(fullPath);
      if (!st) continue;
      const raw = await safeRead(fullPath);
      if (!raw) continue;
      matches.push({
        path: p,
        title: titleFromPath(p),
        folder: folderFromPath(p),
        size: st.size,
        mtime: st.mtime.toISOString(),
        ctime: st.birthtime.toISOString(),
        preview: extractPreview(raw, 200),
        tags: extractTags(raw),
      });
    } else {
      // Content search
      const fullPath = join(VAULT_PATH, p);
      const raw = await safeRead(fullPath);
      if (!raw) continue;
      const stripped = stripYaml(raw).toLowerCase();
      if (stripped.includes(lower)) {
        const st = await safeStat(fullPath);
        if (!st) continue;
        matches.push({
          path: p,
          title: titleFromPath(p),
          folder: folderFromPath(p),
          size: st.size,
          mtime: st.mtime.toISOString(),
          ctime: st.birthtime.toISOString(),
          preview: extractPreview(raw, 200),
          tags: extractTags(raw),
        });
      }
    }
    if (matches.length >= maxResults) break;
  }

  return matches;
}

/** Get a single note with full content. */
async function getNote(filePath: string): Promise<VaultNote | null> {
  const fullPath = join(VAULT_PATH, filePath);
  // Security: ensure path doesn't escape vault
  if (!fullPath.startsWith(VAULT_PATH)) return null;

  const st = await safeStat(fullPath);
  if (!st) return null;
  const raw = await safeRead(fullPath);
  if (!raw) return null;

  return {
    path: filePath,
    title: titleFromPath(filePath),
    folder: folderFromPath(filePath),
    size: st.size,
    mtime: st.mtime.toISOString(),
    ctime: st.birthtime.toISOString(),
    content: raw,
    preview: extractPreview(raw),
    tags: extractTags(raw),
  };
}

// ── API Handler ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "overview";
  const query = searchParams.get("q") ?? "";
  const path = searchParams.get("path") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "30", 10);

  try {
    switch (action) {
      case "overview":
      case "all": {
        const [sessions, research, artifacts, goalLoop, workLog, stats] =
          await Promise.all([
            getRecentSessions(),
            getResearchEntries(),
            getArtifacts(),
            getGoalLoopProgress(),
            getWorkLog(),
            getVaultStats(),
          ]);

        return NextResponse.json({
          action: "overview",
          sessions: {
            count: sessions.length,
            logs: sessions,
          },
          research: {
            count: research.length,
            entries: research,
          },
          artifacts: {
            count: artifacts.length,
            entries: artifacts,
          },
          goalLoop,
          workLog,
          stats,
          generatedAt: new Date().toISOString(),
        });
      }

      case "sessions": {
        const sessions = await getRecentSessions();
        return NextResponse.json({
          action: "sessions",
          count: sessions.length,
          logs: sessions,
        });
      }

      case "research": {
        const research = await getResearchEntries();
        return NextResponse.json({
          action: "research",
          count: research.length,
          entries: research,
        });
      }

      case "artifacts": {
        const artifacts = await getArtifacts();
        return NextResponse.json({
          action: "artifacts",
          count: artifacts.length,
          entries: artifacts,
        });
      }

      case "goal-loop": {
        const goalLoop = await getGoalLoopProgress();
        return NextResponse.json({
          action: "goal-loop",
          progress: goalLoop,
        });
      }

      case "work-log": {
        const workLog = await getWorkLog();
        return NextResponse.json({
          action: "work-log",
          workLog,
        });
      }

      case "stats": {
        const stats = await getVaultStats();
        return NextResponse.json({
          action: "stats",
          stats,
        });
      }

      case "search": {
        if (!query.trim()) {
          return NextResponse.json(
            { action: "search", count: 0, results: [], error: "Missing query parameter 'q'" },
            { status: 400 }
          );
        }
        const results = await searchVault(query.trim(), limit);
        return NextResponse.json({
          action: "search",
          query,
          count: results.length,
          results,
        });
      }

      case "note": {
        if (!path.trim()) {
          return NextResponse.json(
            { action: "note", error: "Missing path parameter" },
            { status: 400 }
          );
        }
        const note = await getNote(path);
        if (!note) {
          return NextResponse.json(
            { action: "note", error: "Note not found", path },
            { status: 404 }
          );
        }
        return NextResponse.json({ action: "note", note });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use: overview, sessions, research, artifacts, goal-loop, work-log, stats, search, note` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[agency/obsidian] API error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}