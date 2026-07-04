// src/lib/strategyBridge.ts
// Node → Python bridge to the REAL deterministic Strategy department.
//
// Shells out to the canonical pinned Python (.venv/bin/python) in rig-jtbd-packs,
// running the full 7-worker Strategy harness on its golden params. Returns a real,
// hash-chained StrategyProofPacket — NOT a stub, NOT a reimplementation. The verify-artifact
// gate, GEV separation, and SHA-256 chain are the frozen Python ones.
//
// Cross-repo coupling note: this bridge depends on /Users/rig128gb/Developer/rig-jtbd-packs
// existing at runtime. Override the root with RIG_JTBD_ROOT env. If the venv or harness is
// missing, the bridge fails closed (rejects) — the S-step never silently produces a fake artifact.

import { execFile } from "child_process";
import path from "path";

const RIG_JTBD_ROOT =
  process.env.RIG_JTBD_ROOT || "/Users/rig128gb/Developer/rig-jtbd-packs";
const PYTHON = path.join(RIG_JTBD_ROOT, ".venv", "bin", "python");
const SHIM = path.join(process.cwd(), "scripts", "strategy_bridge.py");

export interface StrategyHop {
  worker: string;
  verdict: string;
  gate: string;
  artifact_hash: string;
  self_hash: string;
  proof_packet: Record<string, unknown>;
}

export interface StrategyArtifact {
  department: string;
  verdict: string | null;
  halted: boolean | null;
  halted_at: string | null;
  final_hash: string;
  n_hops: number;
  hops: StrategyHop[];
  bridgeSource: "rig-jtbd-packs/strategy-studio-v2";
  bridgedAt: string;
}

export interface StrategyBridgeError {
  error: string;
}

export function isStrategyArtifact(
  v: StrategyArtifact | StrategyBridgeError
): v is StrategyArtifact {
  return (v as StrategyArtifact).final_hash !== undefined;
}

/**
 * Run the Strategy department end-to-end and return its sealed artifact.
 * Rejects on any failure (missing venv, import error, dept runtime error, JSON parse).
 * Never resolves to a stub.
 */
export function runStrategyDepartment(): Promise<StrategyArtifact> {
  return new Promise((resolve, reject) => {
    execFile(
      PYTHON,
      [SHIM, RIG_JTBD_ROOT],
      {
        cwd: RIG_JTBD_ROOT,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60_000,
      },
      (err, stdout, stderr) => {
        if (err) {
          return reject(
            new Error(
              `strategy bridge exec failed: ${err.message}. stderr=${(stderr || "").slice(0, 300)}`
            )
          );
        }
        let parsed: StrategyArtifact | StrategyBridgeError;
        try {
          parsed = JSON.parse(stdout);
        } catch (e: any) {
          return reject(
            new Error(
              `strategy bridge JSON parse failed: ${e.message}. stdout=${stdout.slice(0, 300)}`
            )
          );
        }
        if (!isStrategyArtifact(parsed)) {
          return reject(new Error(`strategy department errored: ${parsed.error}`));
        }
        resolve({ ...parsed, bridgeSource: "rig-jtbd-packs/strategy-studio-v2", bridgedAt: new Date().toISOString() });
      }
    );
  });
}
