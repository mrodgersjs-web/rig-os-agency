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

/**
 * Total word count across the vault.
 *
 * This was labelled "(fast)" and was anything but: `find … -exec cat {} + | wc -w`
 * concatenates and word-counts EVERY .md/.txt/.json in a 65,277-note vault —
 * gigabytes of I/O per request. /api/agency/vault-enrich returned nothing at
 * all inside a 45s probe because of it. The `timeout: 30_000` did not save it
 * either: execSync's timeout kills the shell, not necessarily the whole
 * `find | cat | wc` pipeline, and 30s is already past any sane request budget.
 *
 * Two changes:
 *   • CACHED for 10 minutes with an `as_of` stamp. A vault word count does not
 *     meaningfully change between two page loads, and a cached number labelled
 *     with its age is honest; a live number nobody waits for is useless.
 *   • Bounded to markdown only and given a real timeout. On timeout we return
 *     null → the caller renders UNAVAILABLE rather than a fabricated 0.
 */
const WORDCOUNT_TTL_MS = 10 * 60_000;
let _wordCount: { value: number | null; as_of: string; ts: number } | null = null;

function getTotalWordCount(): number | null {
  const now = Date.now();
  if (_wordCount && now - _wordCount.ts < WORDCOUNT_TTL_MS) return _wordCount.value;
  let value: number | null = null;
  try {
    const out = execSync(
      `find "${VAULT_ROOT}" -type f -name "*.md" -print0 | xargs -0 wc -w 2>/dev/null | tail -1`,
      { encoding: 'utf-8', timeout: 8_000, maxBuffer: 4 * 1024 * 1024 }
    );
    const n = parseInt(out.trim().split(/\s+/)[0], 10);
    value = Number.isFinite(n) ? n : null;
  } catch {
    // Timed out or failed. null, NOT 0 — a missing measurement is not "zero
    // words", and rendering it as 0 is the fabrication class we are removing.
    value = null;
  }
  _wordCount = { value, as_of: new Date().toISOString(), ts: now };
  return value;
}

// ─────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────

// ── Response cache ──────────────────────────────────────────────────────
//
// This handler walks the vault synchronously (readdirSync/readFileSync across
// Research/, agent sessions, artifacts, per-directory tree counts) plus the
// word count. On a 65,277-note vault that measured ~29s cold / ~16s warm, so
// every tab that opened this page waited half a minute for a number that
// changes hourly at best. Cached with an `as_of` stamp; concurrent misses are
// coalesced onto one computation instead of N parallel vault walks.
const ENRICH_TTL_MS = 5 * 60_000;
let _enrichCache: { body: unknown; ts: number } | null = null;
let _enrichInflight: Promise<unknown> | null = null;

export async function GET(_req: NextRequest) {
  const now = Date.now();
  if (_enrichCache && now - _enrichCache.ts < ENRICH_TTL_MS) {
    return NextResponse.json({
      ...(_enrichCache.body as object),
      cached: true,
      as_of: new Date(_enrichCache.ts).toISOString(),
    });
  }
  if (!_enrichInflight) {
    _enrichInflight = computeEnrich().finally(() => { _enrichInflight = null; });
  }
  const body = await _enrichInflight;
  _enrichCache = { body, ts: Date.now() };
  return NextResponse.json({
    ...(body as object),
    cached: false,
    as_of: new Date().toISOString(),
  });
}

async function computeEnrich(): Promise<unknown> {
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

    // Plain object — GET() wraps it and adds cache metadata.
    return {
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
        // null (not 0) when the word count timed out — a missing measurement
        // is not "zero words".
        estimatedWordCount,
        perDirectory: treeCounts,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}