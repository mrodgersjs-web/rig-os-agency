// Helpers for safely browsing the kanban workspace directory of a single task.
// Workspaces live under ~/.hermes/kanban/workspaces/<task_id>/ (or per-board path).
// We only allow reads strictly inside one validated task workspace — path-traversal blocked.

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const TASK_ID_RE = /^t_[a-z0-9_-]+$/i;
const BOARD_RE = /^[a-z0-9_-]{1,64}$/;

export function taskWorkspaceRoot(taskId: string, board?: string): string | null {
  if (!TASK_ID_RE.test(taskId)) return null;
  if (board && !BOARD_RE.test(board)) return null;
  const base = path.join(os.homedir(), ".hermes", "kanban");
  if (board && board !== "default") {
    return path.join(base, "boards", board, "workspaces", taskId);
  }
  return path.join(base, "workspaces", taskId);
}

export interface WsFile { name: string; relPath: string; bytes: number; mtime: number; isText: boolean; }

const TEXT_EXTS = new Set([
  ".md", ".markdown", ".txt", ".json", ".yaml", ".yml", ".html", ".htm",
  ".css", ".js", ".ts", ".tsx", ".jsx", ".py", ".sh", ".log", ".csv", ".tsv",
  ".xml", ".toml", ".env",
]);

const SKIP_DIRS = new Set([".git", "node_modules", ".venv", "__pycache__", ".next"]);

export async function listWorkspaceFiles(taskId: string, board?: string, maxFiles = 100): Promise<WsFile[]> {
  const maybeRoot = taskWorkspaceRoot(taskId, board);
  if (!maybeRoot) return [];
  // Hoist into a non-nullable local so the nested async walk() closure sees a
  // string (TS 5.9 + Next 16 don't propagate the truthy narrowing across the
  // async closure boundary).
  const root: string = maybeRoot;
  const out: WsFile[] = [];
  async function walk(dir: string, depth: number) {
    if (out.length >= maxFiles || depth > 4) return;
    let items;
    try { items = await readdir(dir, { withFileTypes: true }); }
    catch { return; }
    for (const it of items) {
      if (out.length >= maxFiles) break;
      if (SKIP_DIRS.has(it.name)) continue;
      const full = path.join(dir, it.name);
      if (it.isDirectory()) {
        await walk(full, depth + 1);
      } else if (it.isFile()) {
        try {
          const s = await stat(full);
          const ext = path.extname(it.name).toLowerCase();
          out.push({
            name: it.name,
            relPath: path.relative(root, full),
            bytes: s.size,
            mtime: s.mtimeMs,
            isText: TEXT_EXTS.has(ext),
          });
        } catch {}
      }
    }
  }
  await walk(root, 0);
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

export async function readWorkspaceFile(taskId: string, relPath: string, board?: string): Promise<{ content: string; bytes: number; mtime: number; truncated: boolean } | null> {
  const root = taskWorkspaceRoot(taskId, board);
  if (!root) return null;
  const abs = path.resolve(root, relPath);
  // Must stay inside the workspace — block ../ escape.
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  try {
    const s = await stat(abs);
    if (!s.isFile()) return null;
    // Cap reads at 1MB to keep the dashboard snappy
    const MAX = 1_000_000;
    const truncated = s.size > MAX;
    const buf = await readFile(abs);
    const trimmed = truncated ? buf.subarray(0, MAX) : buf;
    return { content: trimmed.toString("utf8"), bytes: s.size, mtime: s.mtimeMs, truncated };
  } catch { return null; }
}
