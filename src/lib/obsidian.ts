// ── RIG OS Agency — Obsidian Vault Integration ──────────────────────
// Reads the JakeStudio vault at ~/Documents/JakeStudio (9,116+ notes, 35+ folders).
// Functions: listNotes, searchNotes, getNote, getRecentNotes, getVaultStats.
//
// The vault folders include: Daily, Memory, Research, Projects, References,
// Logs, Tasks, Artifacts, Doctrines, Knowledge, People, GoalCards,
// ProofPackets, Architecture, Templates, _CLAUDE.md, _AGENTS.md,
// CRITICAL_FACTS.md, Home.md, index.md, JAKE_DIRECTION.md, and more.

import { readFile, readdir, stat } from "fs/promises";
import { join, relative, basename, dirname, extname } from "path";
import os from "os";

const VAULT_PATH = join(os.homedir(), "Documents", "JakeStudio");

export interface ObsidianNote {
  /** Relative path from vault root (e.g. "Research/Deep/2026-06-21.md") */
  path: string;
  /** Display title — derived from filename (without .md) */
  title: string;
  /** Folder the note lives in (first segment of path, or "Root") */
  folder: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp (ISO 8601) */
  mtime: string;
  /** Created timestamp (ISO 8601) */
  ctime: string;
  /** First 300 characters of content (for previews) */
  preview?: string;
  /** Full markdown content (only populated by getNote) */
  content?: string;
  /** Plain-text excerpt (YAML frontmatter stripped, for search) */
  excerpt?: string;
}

export interface VaultStats {
  vaultPath: string;
  totalNotes: number;
  totalFolders: number;
  totalSize: number;
  folders: { name: string; count: number; size: number }[];
  topNotes: { title: string; path: string; mtime: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────

function titleFromPath(filePath: string): string {
  const base = basename(filePath, ".md");
  // Remove ISO date prefix if present (e.g. "2026-06-21 — Hermes...")
  const cleaned = base.replace(/^\d{4}-\d{2}-\d{2}\s*[—–-]\s*/, "");
  return cleaned || base;
}

function folderFromPath(filePath: string): string {
  const dir = dirname(filePath);
  return dir === "." ? "Root" : dir.split("/")[0];
}

function stripYaml(md: string): string {
  // Strip YAML frontmatter (between --- delimiters)
  const lines = md.split("\n");
  if (lines[0]?.trim() === "---") {
    const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (endIdx > 0) {
      const content = lines.slice(endIdx + 1).join("\n").trim();
      return content.length > 0 ? content : lines.join("\n");
    }
  }
  return md;
}

/** Recursively find all .md files in `dir`, up to `maxResults` (0 = unlimited). */
async function findMdFiles(
  dir: string,
  maxResults: number = 0,
  exclude: string[] = [".obsidian", ".git", ".trash"]
): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (exclude.includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (results.length >= maxResults && maxResults > 0) break;
        const sub = await findMdFiles(full, maxResults > 0 ? maxResults - results.length : 0, exclude);
        results.push(...sub);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(relative(VAULT_PATH, full));
        if (maxResults > 0 && results.length >= maxResults) break;
      }
    }
  } catch {
    // Permission errors etc. — skip silently
  }
  return results;
}

/** Build a note object from a file path (without content). */
async function buildNote(filePath: string, includeContent: boolean = false): Promise<ObsidianNote | null> {
  const full = join(VAULT_PATH, filePath);
  try {
    const [st, raw] = await Promise.all([
      stat(full),
      includeContent ? readFile(full, "utf-8") : Promise.resolve(undefined),
    ]);
    const note: ObsidianNote = {
      path: filePath,
      title: titleFromPath(filePath),
      folder: folderFromPath(filePath),
      size: st.size,
      mtime: st.mtime.toISOString(),
      ctime: st.birthtime.toISOString(),
    };
    if (raw !== undefined) {
      note.content = raw;
      note.excerpt = stripYaml(raw).slice(0, 300);
      note.preview = note.excerpt;
    }
    return note;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────

/** List all notes (paths only by default; set `withPreview` for previews). */
export async function listNotes(options?: {
  withPreview?: boolean;
  maxNotes?: number;
}): Promise<ObsidianNote[]> {
  const max = options?.maxNotes ?? 0;
  const paths = await findMdFiles(VAULT_PATH, max);
  const notes = await Promise.all(paths.map(async (p): Promise<ObsidianNote | null> => {
    const full = join(VAULT_PATH, p);
    try {
      const st = await stat(full);
      let preview: string | undefined;
      if (options?.withPreview) {
        const raw = await readFile(full, "utf-8");
        preview = stripYaml(raw).slice(0, 300);
      }
      return {
        path: p,
        title: titleFromPath(p),
        folder: folderFromPath(p),
        size: st.size,
        mtime: st.mtime.toISOString(),
        ctime: st.birthtime.toISOString(),
        preview,
        excerpt: preview,
      };
    } catch {
      return null;
    }
  }));
  return notes.filter((n): n is ObsidianNote => n !== null);
}

/** Search notes by query string (matches title, path, and content excerpt). */
export async function searchNotes(
  query: string,
  maxResults: number = 30
): Promise<ObsidianNote[]> {
  const lower = query.toLowerCase();
  const paths = await findMdFiles(VAULT_PATH);
  const matches: ObsidianNote[] = [];

  for (const p of paths) {
    const title = titleFromPath(p).toLowerCase();
    const pathLower = p.toLowerCase();
    if (title.includes(lower) || pathLower.includes(lower)) {
      const note = await buildNote(p, true);
      if (note) matches.push(note);
    } else {
      // Check content excerpt
      try {
        const raw = await readFile(join(VAULT_PATH, p), "utf-8");
        const stripped = stripYaml(raw).toLowerCase();
        if (stripped.includes(lower)) {
          const note = await buildNote(p, true);
          if (note) matches.push(note);
        }
      } catch { /* skip */ }
    }
    if (matches.length >= maxResults) break;
  }

  return matches;
}

/** Get a single note by relative path, with full content. */
export async function getNote(filePath: string): Promise<ObsidianNote | null> {
  // Resolve any ~ prefix
  const clean = filePath.startsWith("~") ? filePath : filePath;
  // Security: ensure path doesn't escape vault
  const resolved = join(VAULT_PATH, clean);
  if (!resolved.startsWith(VAULT_PATH)) return null;
  return buildNote(clean, true);
}

/** Get most recently modified notes, newest first. */
export async function getRecentNotes(limit: number = 12): Promise<ObsidianNote[]> {
  const paths = await findMdFiles(VAULT_PATH);
  // Stat all files and sort by mtime
  const entries = await Promise.all(
    paths.map(async (p) => {
      try {
        const s = await stat(join(VAULT_PATH, p));
        return { path: p, mtime: s.mtimeMs };
      } catch {
        return null;
      }
    })
  );
  const sorted = entries
    .filter((e): e is { path: string; mtime: number } => e !== null)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);

  const notes = await Promise.all(
    sorted.map(async ({ path }): Promise<ObsidianNote | null> => {
      const full = join(VAULT_PATH, path);
      try {
        const [st, raw] = await Promise.all([stat(full), readFile(full, "utf-8")]);
        return {
          path,
          title: titleFromPath(path),
          folder: folderFromPath(path),
          size: st.size,
          mtime: st.mtime.toISOString(),
          ctime: st.birthtime.toISOString(),
          excerpt: stripYaml(raw).slice(0, 300),
          preview: stripYaml(raw).slice(0, 300),
          content: raw,
        };
      } catch {
        return null;
      }
    })
  );
  return notes.filter((n): n is ObsidianNote => n !== null);
}

/** Get vault statistics: total notes, folder breakdown, top notes. */
export async function getVaultStats(): Promise<VaultStats> {
  const paths = await findMdFiles(VAULT_PATH);

  // Folder breakdown
  const folderMap = new Map<string, { count: number; size: number }>();
  const allNotes: { path: string; title: string; mtime: string; size: number }[] = [];

  await Promise.all(
    paths.slice(0, 5000).map(async (p) => {
      const full = join(VAULT_PATH, p);
      try {
        const st = await stat(full);
        const folder = folderFromPath(p);
        const existing = folderMap.get(folder) ?? { count: 0, size: 0 };
        existing.count++;
        existing.size += st.size;
        folderMap.set(folder, existing);
        allNotes.push({
          path: p,
          title: titleFromPath(p),
          mtime: st.mtime.toISOString(),
          size: st.size,
        });
      } catch { /* skip */ }
    })
  );

  const folders = Array.from(folderMap.entries())
    .map(([name, { count, size }]) => ({ name, count, size }))
    .sort((a, b) => b.count - a.count);

  const totalSize = allNotes.reduce((sum, n) => sum + n.size, 0);

  // Top 10 most recently modified (non-preview)
  const topNotes = allNotes
    .sort((a, b) => b.mtime.localeCompare(a.mtime))
    .slice(0, 10)
    .map(({ path, title, mtime }) => ({ title, path, mtime }));

  // Count unique folders
  const uniqueFolders = folderMap.size;

  return {
    vaultPath: VAULT_PATH,
    totalNotes: paths.length,
    totalFolders: uniqueFolders,
    totalSize,
    folders,
    topNotes,
  };
}