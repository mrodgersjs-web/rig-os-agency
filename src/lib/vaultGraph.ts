import { readFile } from "node:fs/promises";
import path from "node:path";
import { noteIndex, VAULT_ROOT } from "./vault";

// Build a knowledge-graph from the vault: nodes = notes, links = [[wikilinks]].
// Folder of the note → color group. Out-degree+in-degree → size.
//
// We resolve wikilinks by note title (basename without .md) which matches
// Obsidian's default linking behavior. Aliases (`[[note|alias]]`) are stripped.

export interface GraphNode {
  id: string;        // relative path (unique key)
  title: string;     // basename (display label)
  group: string;     // top-level folder
  degree: number;    // links in + out
  mtime: number;
}
export interface GraphLink { source: string; target: string; }
export interface VaultGraph { nodes: GraphNode[]; links: GraphLink[]; }

const WIKILINK_RE = /\[\[([^\[\]\n|#]+)(?:#[^\[\]\n|]+)?(?:\|[^\[\]\n]+)?\]\]/g;

/**
 * Cap on notes pulled into the graph.
 *
 * The vault holds 65,277 markdown files. Building a graph over all of them
 * meant a `Promise.all` that `readFile`d every one — /api/memory/graph never
 * answered inside a 45s probe, which is one of the dashboard's eternal spinners.
 * It is also pointless: a force-directed graph with 65k nodes is an unreadable
 * hairball that will hang the browser even if the server does answer.
 *
 * We take the most-recently-modified slice. That is both bounded and the part
 * of the vault anyone actually wants to look at.
 */
const MAX_GRAPH_NOTES = 2500;
/** Never open more than this many descriptors at once. */
const IO_CONCURRENCY = 64;

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

export interface VaultGraphMeta {
  total_notes: number;
  graphed_notes: number;
  truncated: boolean;
}

export async function buildVaultGraph(): Promise<VaultGraph> {
  if (!VAULT_ROOT) return { nodes: [], links: [] };
  // noteIndex() carries mtime and is already sorted newest-first, so keeping
  // the newest slice costs nothing — no per-file stat() pass.
  const idx = await noteIndex();
  const slice = idx.entries.slice(0, MAX_GRAPH_NOTES);
  const files = slice.map((e) => e.file);
  const mtimeOf = new Map(slice.map((e) => [e.file, e.mtime]));

  // Index by title (lowercased) → relative path
  const byTitle = new Map<string, string>();
  const meta = new Map<string, { rel: string; title: string; group: string; mtime: number }>();

  await mapLimit(files, IO_CONCURRENCY, async (abs) => {
    const rel = path.relative(VAULT_ROOT, abs);
    const title = path.basename(abs, ".md");
    // If the file is at the vault root (no folder separator), bucket it as "root"
    // rather than using the filename as a "group" of one.
    const head = rel.split(path.sep)[0] || "root";
    const group = rel.includes(path.sep) ? head : "root";
    // mtime comes from the index — no second stat() per file.
    meta.set(rel, { rel, title, group, mtime: mtimeOf.get(abs) ?? 0 });
    // first-wins so links resolve deterministically when titles collide
    if (!byTitle.has(title.toLowerCase())) byTitle.set(title.toLowerCase(), rel);
  });

  const linkSet = new Set<string>(); // dedupe "a→b"
  const links: GraphLink[] = [];
  const degree = new Map<string, number>();

  await mapLimit(files, IO_CONCURRENCY, async (abs) => {
    const rel = path.relative(VAULT_ROOT, abs);
    let content = "";
    try { content = await readFile(abs, "utf8"); } catch { return; }
    const matches = content.matchAll(WIKILINK_RE);
    for (const m of matches) {
      const targetTitle = m[1].trim();
      if (!targetTitle) continue;
      const targetRel = byTitle.get(targetTitle.toLowerCase());
      if (!targetRel || targetRel === rel) continue;
      const key = rel + "→" + targetRel;
      if (linkSet.has(key)) continue;
      linkSet.add(key);
      links.push({ source: rel, target: targetRel });
      degree.set(rel, (degree.get(rel) ?? 0) + 1);
      degree.set(targetRel, (degree.get(targetRel) ?? 0) + 1);
    }
  });

  const nodes: GraphNode[] = Array.from(meta.values()).map((m) => ({
    id: m.rel,
    title: m.title,
    group: m.group,
    degree: degree.get(m.rel) ?? 0,
    mtime: m.mtime,
  }));

  return { nodes, links };
}
