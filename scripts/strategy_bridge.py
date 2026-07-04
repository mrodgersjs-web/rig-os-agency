#!/usr/bin/env python3
"""
strategy_bridge.py — Node→Python bridge to the REAL deterministic Strategy department.

Invoked by src/lib/strategyBridge.ts via child_process.execFile. Imports the frozen,
hash-chained Strategy harness from rig-jtbd-packs, runs the full 7-worker department
on its golden params, and emits a structured JSON artifact on stdout (one line).

This is NOT a reimplementation. It calls the canonical pinned Python (.venv/bin/python)
so the hash chain, GEV separation, and verify-artifact gates are the real ones.

Usage: .venv/bin/python strategy_bridge.py <rig_jtbd_root>
Emits: one JSON object on stdout.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "rig_jtbd_root argv missing"}))
        return 2
    rig_jtbd_root = Path(sys.argv[1]).resolve()
    harness_dir = rig_jtbd_root / "strategy-studio-v2" / "harness"
    if not harness_dir.is_dir():
        print(json.dumps({"error": f"harness dir not found: {harness_dir}"}))
        return 3

    sys.path.insert(0, str(harness_dir))
    try:
        import strategy_dept as SD  # type: ignore
    except Exception as e:  # noqa: BLE001
        print(json.dumps({"error": f"import strategy_dept failed: {e!r}"}))
        return 4

    try:
        res = SD.run_strategy_department()
    except Exception as e:  # noqa: BLE001
        print(json.dumps({"error": f"run_strategy_department failed: {e!r}"}))
        return 5

    # Access attributes explicitly (verdict is a property, not in __dict__).
    hops = []
    for h in res.hops:
        pp = h.get("proof_packet") if isinstance(h, dict) else getattr(h, "proof_packet", {})
        hops.append({
            "worker": h.get("worker") if isinstance(h, dict) else getattr(h, "worker", None),
            "verdict": h.get("verdict") if isinstance(h, dict) else getattr(h, "verdict", None),
            "gate": h.get("gate") if isinstance(h, dict) else getattr(h, "gate", None),
            "artifact_hash": h.get("artifact_hash") if isinstance(h, dict) else getattr(h, "artifact_hash", None),
            "self_hash": h.get("self_hash") if isinstance(h, dict) else getattr(h, "self_hash", None),
            "proof_packet": pp,
        })

    out = {
        "department": "strategy-studio-v2",
        "verdict": getattr(res, "verdict", None),
        "halted": getattr(res, "halted", None),
        "halted_at": getattr(res, "halted_at", None),
        "final_hash": getattr(res, "final_hash", None),
        "n_hops": len(hops),
        "hops": hops,
    }
    print(json.dumps(out, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
