import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

// ─────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────

const VAULT_ROOT = '/Users/rig128gb/Documents/JakeStudio';

const RESEARCH_SUBDIRS = ['Deep', 'Web', 'X-reads', 'YouTube', 'Podcasts'] as const;
const MEMORY_AGENT_SESSIONS = 'Memory/Agent Sessions';
const GOAL_LOOP_DIR = 'goal-loop-global-capability';
const ARTIFACTS_DIR = 'Artifacts';

const RECENT_FILE_LIMIT = 20;          // max files per Research subdirectory
const SNIPPET_LENGTH = 200;             // first N chars of each file
const AGENT_SESSION_DAYS = 7;           // look-back window for Agent Sessions

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

interface FileInfo {
  fileName: string;
  relativePath: string;
  snippet: string;
  wordCount: number;
  sizeBytes: number;
  modified: string;
}

/** Read the first `length` characters of a file safely. */
function readSnippet(filePath: string, length: number): string {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const snippet = content.slice(0, length);
    // Collapse whitespace + newlines for a clean preview
    return snippet.replace(/\n+/g, ' ⏎ ').trim();
  } catch {
    return '';
  }
}

/** Count words in a file (best-effort, reads whole file). */
function countWords(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

/** List markdown / JSON files in a directory sorted by mtime desc. */
function listFilesByMtime(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  try {
    return readdirSync(dirPath)
      .filter((f) => {
        const ext = extname(f).toLowerCase();
        return ['.md', '.json', '.txt', '.csv', '.yaml', '.yml'].includes(ext);
      })
      .map((f) => ({ name: f, mtime: statSync(join(dirPath, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/** Build a FileInfo array from a directory (capped at `limit`). */
function buildFileInfo(dirPath: string, limit: number): FileInfo[] {
  const files = listFilesByMtime(dirPath).slice(0, limit);
  return files.map((fileName) => {
    const fullPath = join(dirPath, fileName);
    const stat = statSync(fullPath);
    return {
      fileName,
      relativePath: fullPath.replace(VAULT_ROOT + '/', ''),
      snippet: readSnippet(fullPath, SNIPPET_LENGTH),
      wordCount: countWords(fullPath),
      sizeBytes: stat.size,
      modified: new Date(stat.mtimeMs).toISOString(),
    };
  });
}

/** Recursively count all files + words in a directory tree. */
function countTree(dirPath: string): { fileCount: number; wordCount: number } {
  if (!existsSync(dirPath)) return { fileCount: 0, wordCount: 0 };
  let fileCount = 0;
  let wordCount = 0;

  const walk = (dir: string) => {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          fileCount++;
          wordCount += countWords(fullPath);
        }
      }
    } catch {
      // ignore unreadable entries
    }
  };

  walk(dirPath);
  return { fileCount, wordCount };
}

/** Get total file count for the entire vault via find (fast). */
function getTotalFileCount(): number {
  try {
    const out = execSync(
      `find "${VAULT_ROOT}" -type f -not -path '*/\\.*' | wc -l`,
      { encoding: 'utf-8', timeout: 10_000 }
    );
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/** Get total word count for all markdown files in the vault via find + wc (fast). */
function getTotalWordCount(): number {
  try {
    const out = execSync(
      `find "${VAULT_ROOT}" -type f \\( -name "*.md" -o -name "*.txt" -o -name "*.json" \\) -exec cat {} + | wc -w`,
      { encoding: 'utf-8', timeout: 30_000 }
    );
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    // ── (1) Research/ subdirectories ──────────────────────
    const research: Record<string, FileInfo[]> = {};
    for (const subdir of RESEARCH_SUBDIRS) {
      const dirPath = join(VAULT_ROOT, 'Research', subdir);
      research[subdir] = buildFileInfo(dirPath, RECENT_FILE_LIMIT);
    }

    // ── (2) Memory/Agent Sessions/ — last 7 days ─────────
    const agentSessionsDir = join(VAULT_ROOT, MEMORY_AGENT_SESSIONS);
    const allSessionFiles = listFilesByMtime(agentSessionsDir);
    const sevenDaysAgo = Date.now() - AGENT_SESSION_DAYS * 24 * 60 * 60 * 1000;
    const recentSessions = allSessionFiles
      .filter((f) => {
        const stat = statSync(join(agentSessionsDir, f));
        return stat.mtimeMs >= sevenDaysAgo;
      })
      .map((fileName) => {
        const fullPath = join(agentSessionsDir, fileName);
        const stat = statSync(fullPath);
        return {
          fileName,
          relativePath: fullPath.replace(VAULT_ROOT + '/', ''),
          snippet: readSnippet(fullPath, SNIPPET_LENGTH),
          wordCount: countWords(fullPath),
          sizeBytes: stat.size,
          modified: new Date(stat.mtimeMs).toISOString(),
        } as FileInfo;
      });

    // ── (3) goal-loop-global-capability/ ─────────────────
    const goalLoopPath = join(VAULT_ROOT, GOAL_LOOP_DIR);
    const goalLoop = existsSync(goalLoopPath)
      ? buildFileInfo(goalLoopPath, RECENT_FILE_LIMIT)
      : [];

    // ── (4) Artifacts/ ───────────────────────────────────
    const artifactsPath = join(VAULT_ROOT, ARTIFACTS_DIR);
    const artifacts = buildFileInfo(artifactsPath, RECENT_FILE_LIMIT);

    // ── (5) Total file count + estimated word count ──────
    const totalFileCount = getTotalFileCount();
    const estimatedWordCount = getTotalWordCount();

    // ── Per-directory tree counts (bonus detail) ────────
    const treeCounts: Record<string, { fileCount: number; wordCount: number }> = {};
    for (const [label, relPath] of Object.entries({
      Research: 'Research',
      Memory: 'Memory',
      Artifacts: 'Artifacts',
      'goal-loop-global-capability': GOAL_LOOP_DIR,
    })) {
      treeCounts[label] = countTree(join(VAULT_ROOT, relPath));
    }

    return NextResponse.json({
      ok: true,
      vaultRoot: VAULT_ROOT,
      timestamp: new Date().toISOString(),
      research,
      agentSessions: {
        directory: MEMORY_AGENT_SESSIONS,
        daysLookback: AGENT_SESSION_DAYS,
        totalFiles: allSessionFiles.length,
        recentFiles: recentSessions,
      },
      goalLoopGlobalCapability: {
        exists: existsSync(goalLoopPath),
        files: goalLoop,
      },
      artifacts: {
        files: artifacts,
      },
      totals: {
        totalFileCount,
        estimatedWordCount,
        perDirectory: treeCounts,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}