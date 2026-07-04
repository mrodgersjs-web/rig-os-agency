#!/usr/bin/env python3
"""
dept_bridge.py — generic Node→Python bridge to ANY of the 7 RIG departments.

Invoked by src/lib/deptBridge.ts via child_process.execFile. Imports the named
dept's frozen harness from rig-jtbd-packs, runs the full department, and emits
a structured JSON artifact on stdout. Same contract for all 7 depts because they
share the engine runtime, verify-artifact.py gate, and hash-chain ProofPacket format.

Usage: .venv/bin/python dept_bridge.py <rig_jtbd_root> <dept>
  <dept> ∈ {strategy, market, app, design, linkedin, forecast, companyos}

Emits: one JSON object on stdout. Fails closed (JSON {error: ...}) on any problem;
the Node bridge rejects on error and the S-step never produces a stub.
"""
from __future__ import annotations

import importlib
import json
import sys
from pathlib import Path

DEPTS = {
    "strategy":  ("strategy-studio-v2",       "strategy_dept",  "run_strategy_department"),
    "market":    ("market-studio-v2",         "market_dept",    "run_market_department"),
    "app":       ("app-studio-v2",            "app_dept",       "run_app_department"),
    "design":    ("design-studio-v2",         "design_dept",    "run_design_department"),
    "linkedin":  ("linkedin-studio-v2",       "linkedin_dept",  "run_linkedin_department"),
    "forecast":  ("forecast-eval-studio-v2",  "forecast_dept",  "run_forecast_department"),
    "companyos": ("companyos-v2",             "companyos_dept", "run_companyos_department"),
}


def _emit(obj: dict) -> None:
    print(json.dumps(obj, default=str))


def main() -> int:
    if len(sys.argv) < 3:
        _emit({"error": "usage: dept_bridge.py <rig_jtbd_root> <dept>"})
        return 2
    rig_jtbd_root = Path(sys.argv[1]).resolve()
    dept = sys.argv[2]
    if dept not in DEPTS:
        _emit({"error": f"unknown dept '{dept}'; known: {sorted(DEPTS)}"})
        return 3
    studio, module_name, func_name = DEPTS[dept]
    harness_dir = rig_jtbd_root / studio / "harness"
    if not harness_dir.is_dir():
        _emit({"error": f"harness dir not found: {harness_dir}"})
        return 4

    sys.path.insert(0, str(harness_dir))
    try:
        mod = importlib.import_module(module_name)
    except Exception as e:  # noqa: BLE001
        _emit({"error": f"import {module_name} failed: {e!r}"})
        return 5
    runner = getattr(mod, func_name, None)
    if runner is None:
        _emit({"error": f"{module_name}.{func_name} not found"})
        return 6

    try:
        res = runner()
    except Exception as e:  # noqa: BLE001
        _emit({"error": f"{func_name} failed: {e!r}"})
        return 7

    hops = []
    for h in res.hops:
        hops.append({
            "worker": h.get("worker") if isinstance(h, dict) else getattr(h, "worker", None),
            "verdict": h.get("verdict") if isinstance(h, dict) else getattr(h, "verdict", None),
            "gate": h.get("gate") if isinstance(h, dict) else getattr(h, "gate", None),
            "artifact_hash": h.get("artifact_hash") if isinstance(h, dict) else getattr(h, "artifact_hash", None),
            "self_hash": h.get("self_hash") if isinstance(h, dict) else getattr(h, "self_hash", None),
            "proof_packet": h.get("proof_packet") if isinstance(h, dict) else getattr(h, "proof_packet", {}),
        })

    _emit({
        "department": studio,
        "dept": dept,
        "verdict": getattr(res, "verdict", None),
        "halted": getattr(res, "halted", None),
        "halted_at": getattr(res, "halted_at", None),
        "final_hash": getattr(res, "final_hash", None),
        "n_hops": len(hops),
        "hops": hops,
    })
    return 0


if __name__ == "__main__":
    sys.exit(main())
