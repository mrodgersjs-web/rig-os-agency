import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROOF_ROOTS: string[] = [
  "/Users/rig128gb/Developer/ai-company/logs/proofpackets/operator",
  "/Users/rig128gb/Documents/JakeStudio/ProofPackets",
  "/Users/rig128gb/Documents/JakeStudio/Artifacts",
  "/Users/rig128gb/Developer/rig-os-agency/proof",
];

const MAX_FILES = 50;
const MAX_BYTES = 200_000;

interface NormalizedPacket {
  source: string;
  filename: string;
  run_id: string;
  agent: string;
  coordinate: string;
  intent: string;
  verdict: string;
  status: string;
  proof_hash: string;
  timestamp: string;
  signer: string;
  chain_link_self_hash: string;
  hops_count: number;
  blocks: number;
  gate_summary: { pass: number; fail: number; other: number };
  file_bytes: number;
}

function summarizeGates(obj: Record<string, unknown>): NormalizedPacket["gate_summary"] {
  const out = { pass: 0, fail: 0, other: 0 };
  function walk(v: unknown) {
    if (!v) return;
    if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.verdict === "string") {
        const vLower = o.verdict.toLowerCase();
        if (vLower === "pass") out.pass++;
        else if (vLower === "fail" || vLower === "no-go" || vLower === "blocked")
          out.fail++;
        else out.other++;
      }
      for (const k of Object.keys(o)) walk(o[k]);
    }
  }
  walk(obj);
  return out;
}

function normalize(raw: unknown, filePath: string, fileBytes: number): NormalizedPacket {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const filename = path.basename(filePath);

  const verdictRaw =
    (typeof o.verdict === "string" && o.verdict) ||
    (typeof o.status === "string" && o.status) ||
    "UNKNOWN";

  const verdict = String(verdictRaw).toUpperCase();

  const runId =
    (typeof o.run_id === "string" && o.run_id) ||
    (typeof o.outcome_id === "string" && o.outcome_id) ||
    (typeof o.id === "string" && o.id) ||
    filename.replace(/\.[^.]+$/, "");

  const agent =
    (typeof o.agent === "string" && o.agent) ||
    (typeof o.signer === "string" && o.signer) ||
    (typeof o.route === "object" &&
      o.route &&
      (o.route as Record<string, unknown>).department &&
      String((o.route as Record<string, unknown>).department)) ||
    "unknown";

  const coordinate =
    (typeof o.coordinate === "string" && o.coordinate) || "";

  const intent =
    (typeof o.intent === "string" && o.intent) ||
    (typeof o.job_type === "string" && o.job_type) ||
    filename;

  const proofHash =
    (typeof o.proof_hash === "string" && o.proof_hash) ||
    (typeof o.chain_link_self_hash === "string" && o.chain_link_self_hash) ||
    "";

  const chainLink =
    (typeof o.chain_link_self_hash === "string" && o.chain_link_self_hash) ||
    proofHash;

  const signer =
    (typeof o.signer === "string" && o.signer) ||
    (typeof o.generator_family === "string" &&
      `${o.generator_family}->${o.verifier_family ?? "?"}`) ||
    "";

  const timestamp =
    (typeof o.timestamp === "string" && o.timestamp) ||
    (typeof o.created === "string" && o.created) ||
    "";

  const hopsCount =
    (typeof o.outcomes === "object" &&
      o.outcomes &&
      typeof (o.outcomes as Record<string, unknown>).hops_count === "number" &&
      ((o.outcomes as Record<string, unknown>).hops_count as number)) ||
    (typeof o.hops === "object" && Array.isArray(o.hops) && o.hops.length) ||
    0;

  const blocks =
    (typeof o.blocks === "number" && o.blocks) ||
    (Array.isArray(o.blocks) && o.blocks.length) ||
    (typeof o.outcomes === "object" &&
      o.outcomes &&
      typeof (o.outcomes as Record<string, unknown>).blocks === "number" &&
      ((o.outcomes as Record<string, unknown>).blocks as number)) ||
    0;

  const gateVerdicts = o.gate_verdicts || o.gates || {};
  const gate_summary = summarizeGates(gateVerdicts as Record<string, unknown>);

  return {
    source: filePath,
    filename,
    run_id: runId,
    agent,
    coordinate,
    intent,
    verdict,
    status: typeof o.status === "string" ? o.status : verdict,
    proof_hash: proofHash,
    timestamp,
    signer,
    chain_link_self_hash: chainLink,
    hops_count: hopsCount,
    blocks,
    gate_summary,
    file_bytes: fileBytes,
  };
}

export async function GET() {
  const collected: NormalizedPacket[] = [];
  const errors: string[] = [];

  for (const root of PROOF_ROOTS) {
    try {
      const stat = await fs.stat(root).catch(() => null);
      if (!stat || !stat.isDirectory()) continue;

      const entries = await fs.readdir(root, { withFileTypes: true });
      const jsonFiles = entries
        .filter((e) => e.isFile() && e.name.endsWith(".json"))
        .map((e) => path.join(root, e.name));

      // newest first by mtime
      const withStat = await Promise.all(
        jsonFiles.map(async (p) => {
          try {
            const s = await fs.stat(p);
            return { p, mtime: s.mtimeMs, size: s.size };
          } catch {
            return null;
          }
        })
      );
      withStat
        .filter((x): x is { p: string; mtime: number; size: number } => !!x)
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, MAX_FILES)
        .forEach(({ p, size }) => {
          if (size > MAX_BYTES) return;
        });

      const sorted = withStat
        .filter((x): x is { p: string; mtime: number; size: number } => !!x)
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, MAX_FILES);

      for (const { p, size } of sorted) {
        if (size > MAX_BYTES) continue;
        try {
          const text = await fs.readFile(p, "utf-8");
          const parsed = JSON.parse(text);
          collected.push(normalize(parsed, p, size));
        } catch (e) {
          errors.push(`parse:${p}: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      errors.push(`root:${root}: ${(e as Error).message}`);
    }
  }

  // final cap, newest first
  collected.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const capped = collected.slice(0, MAX_FILES);

  const totals = capped.reduce(
    (acc, p) => {
      acc.packets++;
      acc.gates_pass += p.gate_summary.pass;
      acc.gates_fail += p.gate_summary.fail;
      if (p.verdict === "PASS" || p.verdict === "GO" || p.verdict === "COMPLETED")
        acc.verdict_go++;
      else if (
        p.verdict === "FAIL" ||
        p.verdict === "NO-GO" ||
        p.verdict === "BLOCKED"
      )
        acc.verdict_no_go++;
      else acc.verdict_other++;
      return acc;
    },
    { packets: 0, gates_pass: 0, gates_fail: 0, verdict_go: 0, verdict_no_go: 0, verdict_other: 0 }
  );

  return NextResponse.json({
    schema_version: 1,
    timestamp: new Date().toISOString(),
    roots: PROOF_ROOTS,
    totals,
    count: capped.length,
    packets: capped,
    errors: errors.slice(0, 10),
  });
}