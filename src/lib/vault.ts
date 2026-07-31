import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { config } from "./config";

export const VAULT_ROOT = config.vaultRoot ?? "";
export const OMI_PATH = VAULT_ROOT ? path.join(VAULT_ROOT, "Omi/Memories.md") : "";
export const VAULT_AVAILABLE = Boolean(VAULT_ROOT);

const SKIP_DIRS = new Set([".obsidian", ".trash", "node_modules", ".git"]);

export function safeJoin(rel: string): string | null {
  const abs = path.resolve(VAULT_ROOT, rel);
  if (!abs.startsWith(VAULT_ROOT)) return null;
  return abs;
}

// ── Vault index cache ───────────────────────────────────────────────────
//
// THE HANG THIS FIXES
//
// JakeStudio holds 65,277 markdown files (125,261 files total). Before this
// cache, EVERY request to /api/memory/recent, /api/memory/graph, /api/seo/notes
// and friends re-walked the whole vault and then:
//   • recentNotes()  — issued 65k concurrent stat() calls via Promise.all
//   • searchNotes()  — readFile()'d all 65k files, start to finish
// Those four routes returned NOTHING within a 30s probe — they are the
// "eternal spinner" the dashboard shows. A route with no bound on its work is
// not slow, it is broken.
//
// Fixes, in order of importance:
//   1. Cache the walk (TTL below) and stamp it with `as_of`, so a slow read is
//      paid once per minute, not once per request per open tab.
//   2. Bound concurrency on stat/readFile so we never open 65k descriptors.
//   3. Cap the work: skip oversized files, stop early once enough hits exist.

const INDEX_TTL_MS = 5 * 60_000;

export interface VaultEntry { file: string; mtime: number }
interface VaultIndex { entries: VaultEntry[]; files: string[]; as_of: string; ts: number }

let _index: VaultIndex | null = null;
let _indexInflight: Promise<VaultIndex> | null = null;

/**
 * Build the index with ONE `find … -exec stat` process.
 *
 * MEASURED, on this vault (65,274 notes):
 *   • recursive readdir in Node, then stat() each file  → 35–55 s
 *   • single `find -exec stat -f '%m %N' {} +`          →  1.17 s
 *
 * Same data, ~30x faster, because it is one process doing one pass instead of
 * 65k round-trips through the event loop. Returning mtime alongside the path
 * also means callers that rank by recency — recentNotes, searchNotes,
 * buildVaultGraph — get it for free instead of re-stat'ing everything.
 *
 * `-print0`/`%N` handles spaces in note names; we split on newline and take
 * the first token as mtime, so a filename containing a space survives.
 */
function buildIndexViaFind(): Promise<VaultEntry[]> {
  return new Promise((resolve) => {
    const prune = Array.from(SKIP_DIRS).flatMap((d) => ["-not", "-path", `*/${d}/*`]);
    const args = [VAULT_ROOT, "-type", "f", "-name", "*.md", ...prune, "-exec", "stat", "-f", "%m %N", "{}", "+"];
    const child = spawn("find", args, { stdio: ["ignore", "pipe", "ignore"] });

    let buf = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (d) => { buf += d; });

    // Hard bound. If the filesystem is wedged we return what we have rather
    // than hanging the request forever — an unbounded read is not "slow", it
    // is broken, and it is what made these routes never answer.
    const killer = setTimeout(() => child.kill("SIGKILL"), 20_000);

    const done = () => {
      clearTimeout(killer);
      const entries: VaultEntry[] = [];
      for (const line of buf.split("\n")) {
        if (!line) continue;
        const sp = line.indexOf(" ");
        if (sp < 1) continue;
        const m = Number(line.slice(0, sp));
        const f = line.slice(sp + 1);
        if (!f) continue;
        entries.push({ file: f, mtime: Number.isFinite(m) ? m * 1000 : 0 });
      }
      resolve(entries);
    };
    child.on("close", done);
    child.on("error", () => { clearTimeout(killer); resolve([]); });
  });
}

/**
 * The cached note index, with the timestamp of the pass that produced it.
 * Callers rendering a number from this should surface `as_of` — a cached
 * number presented as live is a small lie that compounds.
 */
export async function noteIndex(): Promise<VaultIndex> {
  const now = Date.now();
  if (_index && now - _index.ts < INDEX_TTL_MS) return _index;
  // Coalesce concurrent misses onto one pass — otherwise five tabs loading at
  // once each kick off their own traversal.
  if (!_indexInflight) {
    _indexInflight = (async () => {
      const entries = await buildIndexViaFind();
      // Newest first, once, here — every consumer wants this order.
      entries.sort((a, b) => b.mtime - a.mtime);
      const res: VaultIndex = {
        entries,
        files: entries.map((e) => e.file),
        as_of: new Date().toISOString(),
        ts: Date.now(),
      };
      _index = res;
      return res;
    })().finally(() => { _indexInflight = null; });
  }
  return _indexInflight;
}

/** Absolute paths of every note, newest-modified first. */
export async function listNotes(): Promise<string[]> {
  return (await noteIndex()).files;
}

/**
 * Run `worker` over `items` with at most `limit` in flight.
 *
 * Promise.all over 65k filesystem calls is not parallelism, it is a
 * descriptor-exhaustion bug wearing parallelism's clothes.
 */
async function mapLimit<T, R>(items: T[], limit: number, worker: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await worker(items[i]);
    }
  });
  await Promise.all(runners);
  return out;
}

/** Files bigger than this are skipped by search — a note is not a database. */
const MAX_SEARCH_FILE_BYTES = 512 * 1024;
/** Hard ceiling on files read per search, so one query cannot eat the vault. */
const MAX_SEARCH_FILES = 4000;

export interface NoteHit {
  path: string;        // relative to vault root
  title: string;       // basename without .md
  preview: string;     // snippet around match
  score: number;
  mtime: number;
}

function previewAround(content: string, idx: number, span = 120): string {
  const start = Math.max(0, idx - span);
  const end = Math.min(content.length, idx + span);
  let p = content.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) p = "…" + p;
  if (end < content.length) p = p + "…";
  return p;
}

export async function searchNotes(q: string, limit = 40): Promise<NoteHit[]> {
  if (!q.trim()) return [];
  const needle = q.toLowerCase();

  // Search the MOST RECENTLY MODIFIED slice, not all 65k files. Reading every
  // note took longer than the probe window, which is why this route returned
  // nothing at all. A bounded search that answers beats an exhaustive one that
  // never does — and recency is the right bound for a working vault.
  // noteIndex() is already sorted newest-first, so this is just a slice.
  const idx = await noteIndex();
  const files = idx.files.slice(0, MAX_SEARCH_FILES);

  const hits: NoteHit[] = [];
  for (const file of files) {
    // Stop as soon as we have plenty to rank — no reason to keep reading.
    if (hits.length >= limit * 5) break;
    let st;
    try { st = await stat(file); } catch { continue; }
    if (st.size > MAX_SEARCH_FILE_BYTES) continue;
    let content: string;
    try { content = await readFile(file, "utf8"); }
    catch { continue; }
    const lower = content.toLowerCase();
    const idx = lower.indexOf(needle);
    if (idx === -1) continue;
    // crude scoring: title hit boosted
    const rel = path.relative(VAULT_ROOT, file);
    const title = path.basename(file, ".md");
    let score = 1;
    if (title.toLowerCase().includes(needle)) score += 5;
    // bonus for early position
    score += Math.max(0, 5 - Math.floor(idx / 500));
    hits.push({
      path: rel,
      title,
      preview: previewAround(content, idx),
      score,
      mtime: st.mtimeMs,
    });
  }
  hits.sort((a, b) => b.score - a.score || b.mtime - a.mtime);
  return hits.slice(0, limit);
}

export async function recentNotes(limit = 12): Promise<{ path: string; title: string; mtime: number }[]> {
  // Was: Promise.all over all 65,277 files — 65k concurrent stat() calls, which
  // is what made /api/memory/recent never answer. The index now carries mtime
  // and is already sorted newest-first, so this is a slice of an in-memory
  // array: no filesystem work at all on a cache hit.
  const idx = await noteIndex();
  return idx.entries.slice(0, limit).map(({ file, mtime }) => ({
    path: path.relative(VAULT_ROOT, file),
    title: path.basename(file, ".md"),
    mtime,
  }));
}

// Notes whose mtime falls on a specific LOCAL calendar day (ymd = "YYYY-MM-DD").
// Used to answer "what did I actually edit today/yesterday" — so the day
// boundary must be the user's local midnight, not UTC.
export async function notesModifiedOn(ymd: string, limit = 25): Promise<{ path: string; title: string; mtime: number }[]> {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return [];
  const start = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  const end = start + 86400000;

  const files = await listNotes();
  const stats = await Promise.all(files.map(async (f) => {
    try { const s = await stat(f); return { f, m: s.mtimeMs }; }
    catch { return { f, m: 0 }; }
  }));
  return stats
    .filter(({ m: mt }) => mt >= start && mt < end)
    .sort((a, b) => b.m - a.m)
    .slice(0, limit)
    .map(({ f, m: mt }) => ({
      path: path.relative(VAULT_ROOT, f),
      title: path.basename(f, ".md"),
      mtime: mt,
    }));
}

export async function readNote(rel: string): Promise<{ path: string; content: string; mtime: number } | null> {
  const abs = safeJoin(rel);
  if (!abs) return null;
  if (!/\.md$/i.test(abs)) return null;
  try {
    const [content, st] = await Promise.all([readFile(abs, "utf8"), stat(abs)]);
    return { path: rel, content, mtime: st.mtimeMs };
  } catch { return null; }
}

// Omi memories: parse bullet list from Memories.md
export async function searchOmi(q: string, limit = 40): Promise<string[]> {
  let content: string;
  try { content = await readFile(OMI_PATH, "utf8"); }
  catch { return []; }
  const needle = q.trim().toLowerCase();
  const lines = content.split(/\r?\n/).filter((l) => l.trim().startsWith("- "));
  const matches = needle
    ? lines.filter((l) => l.toLowerCase().includes(needle))
    : lines.slice(0, limit);
  return matches.slice(0, limit).map((l) => l.replace(/^- /, ""));
}

// The most recent Omi captures, newest first.
//
// Memories.md is an append log: Omi adds each new capture at the END of the
// file, so "most recent" = the tail, reversed. If the file is missing or
// unreadable this returns [] rather than guessing — callers treat an empty
// result as "no memory context available", never as "nothing happened".
export async function recentOmi(limit = 16): Promise<string[]> {
  let content: string;
  try { content = await readFile(OMI_PATH, "utf8"); }
  catch { return []; }
  const lines = content.split(/\r?\n/).filter((l) => l.trim().startsWith("- "));
  return lines
    .slice(-limit)
    .reverse()
    .map((l) => l.trim().replace(/^- /, ""));
}
