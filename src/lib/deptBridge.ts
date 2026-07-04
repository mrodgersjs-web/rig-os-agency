// src/lib/deptBridge.ts
// Generic Node→Python bridge to ANY of the 7 real RIG departments.
//
// Replaces strategyBridge.ts. Maps each of the 50 goal loops to one of the 7 real
// deterministic departments in rig-jtbd-packs (strategy/market/app/design/linkedin/
// forecast/companyos), shells out to its frozen Python harness, and returns a real,
// hash-chained ProofPacket. Loops with no clean dept mapping return null — the S-step
// keeps an honest stub (realArtifact:false) for them. NEVER fakes an artifact.
//
// Cross-repo coupling: depends on /Users/rig128gb/Developer/rig-jtbd-packs at runtime.
// Override with RIG_JTBD_ROOT env. Fails CLOSED on any error (rejects → step blocks).

import { execFile } from "child_process";
import path from "path";

export type DeptId =
  | "strategy"
  | "market"
  | "app"
  | "design"
  | "linkedin"
  | "forecast"
  | "companyos";

const RIG_JTBD_ROOT =
  process.env.RIG_JTBD_ROOT || "/Users/rig128gb/Developer/rig-jtbd-packs";
const PYTHON = path.join(RIG_JTBD_ROOT, ".venv", "bin", "python");
const SHIM = path.join(process.cwd(), "scripts", "dept_bridge.py");

// 50 goal loops → 7 real departments. Mapped by closest semantic fit.
// A mapping here means "this loop's S-step produces a real artifact from this dept."
// Loops absent from the map return null (S-step stays an honest stub).
const LOOP_TO_DEPT: Record<string, DeptId> = {
  // reasoning → strategy (strategic reasoning hops)
  "reason-hard": "strategy", "tot-search": "strategy", "got-synthesize": "strategy",
  "gear-train": "strategy", "reason-evolve": "strategy", "consensus-vote": "strategy",
  // deviation → forecast (scoring / evaluation / calibration)
  "score-artifact": "forecast", "repair-rescore": "forecast", "physics-audit": "forecast",
  "baseline-recalibrate": "forecast", "gate-promote": "forecast", "engine-verify": "forecast",
  // gtm → market (ICP/dossier/email/proposal) ; forecast → forecast
  "lead-score": "market", "operator-dossier": "market", "cold-email": "market",
  "followup-cascade": "market", "proposal-factory": "market", "competitor-audit": "market",
  "gtm-distill": "market", "gtm-forecast": "forecast",
  // strategy → strategy
  "strategy-7powers": "strategy", "orthodoxy-map": "strategy", "scenario-tree": "strategy",
  "mechanism-map": "strategy", "decision-memo": "strategy", "strategy-evolve": "strategy",
  // operations → companyos
  "ops-cadence": "companyos", "exception-route": "companyos", "bottleneck-find": "companyos",
  "sop-compile": "companyos", "incident-triage": "companyos", "ops-healthcheck": "companyos",
  // finance → forecast (modeling / risk / calibration)
  "unit-economics": "forecast", "three-statement": "forecast", "valuation": "forecast",
  "finops-meter": "forecast", "risk-sim": "forecast", "finance-forecast": "forecast",
  // product → app (spec / build / test)
  "spec-synthesize": "app", "plan-chunk": "app", "build-evolve": "app",
  "digital-twin-test": "app", "build-vs-buy": "app", "retrofit-studio": "app",
  // studios → design / linkedin / market / companyos
  "design-studio": "design", "website-goal": "design",
  "linkedin-studio": "linkedin",
  "research-studio": "market",
  "mission-control": "companyos", "rig-fullbuild": "companyos",
};

export function deptForLoop(loopId: string): DeptId | null {
  return LOOP_TO_DEPT[loopId] ?? null;
}

export interface DeptHop {
  worker: string;
  verdict: string;
  gate: string;
  artifact_hash: string;
  self_hash: string;
  proof_packet: Record<string, unknown>;
}

export interface DeptArtifact {
  department: string;
  dept: DeptId;
  verdict: string | null;
  halted: boolean | null;
  halted_at: string | null;
  final_hash: string;
  n_hops: number;
  hops: DeptHop[];
  bridgeSource: string;
  bridgedAt: string;
}

interface DeptBridgeError {
  error: string;
}

function isArtifact(v: DeptArtifact | DeptBridgeError): v is DeptArtifact {
  return (v as DeptArtifact).final_hash !== undefined;
}

export function runDept(dept: DeptId): Promise<DeptArtifact> {
  return new Promise((resolve, reject) => {
    execFile(
      PYTHON,
      [SHIM, RIG_JTBD_ROOT, dept],
      { cwd: RIG_JTBD_ROOT, maxBuffer: 10 * 1024 * 1024, timeout: 90_000 },
      (err, stdout, stderr) => {
        if (err) {
          return reject(
            new Error(
              `dept bridge exec failed (${dept}): ${err.message}. stderr=${(stderr || "").slice(0, 300)}`
            )
          );
        }
        let parsed: DeptArtifact | DeptBridgeError;
        try {
          parsed = JSON.parse(stdout);
        } catch (e: any) {
          return reject(
            new Error(`dept bridge JSON parse failed (${dept}): ${e.message}. stdout=${stdout.slice(0, 300)}`)
          );
        }
        if (!isArtifact(parsed)) {
          return reject(new Error(`dept ${dept} errored: ${parsed.error}`));
        }
        resolve({
          ...parsed,
          bridgeSource: `rig-jtbd-packs/${parsed.department}`,
          bridgedAt: new Date().toISOString(),
        });
      }
    );
  });
}

export async function runDeptForLoop(loopId: string): Promise<DeptArtifact | null> {
  const dept = deptForLoop(loopId);
  if (!dept) return null;
  return runDept(dept);
}
