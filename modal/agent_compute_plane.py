"""RIG Agentic Compute Plane for Modal.

This is the cloud-side scaffold for the local lanes exposed by
`rig-modal1-proxy`:

- modal-code
- modal-test
- modal-build
- modal-review

Deploy only after Modal account auth is complete and the cost/GPU shape is
explicitly approved. The local router can be tested without deploying this app.
"""

from __future__ import annotations

import time
import uuid
from typing import Any

import modal


app = modal.App("rig-agentic-compute-plane")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("bash", "build-essential", "curl", "git", "ripgrep")
    .pip_install("fastapi[standard]")
)

job_queue = modal.Queue.from_name("rig-agentic-compute-plane-jobs", create_if_missing=True)


def _choice(content: str, model: str) -> dict[str, Any]:
    return {
        "id": f"chatcmpl-rig-{uuid.uuid4().hex[:12]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
        ],
    }


def _submit_lane(lane: str, payload: dict[str, Any]) -> dict[str, Any]:
    job_id = f"modaljob-{uuid.uuid4().hex[:12]}"
    job = {
        "id": job_id,
        "lane": lane,
        "status": "queued",
        "created_at": int(time.time()),
        "payload": payload,
    }
    job_queue.put(job)
    return _choice(f"{lane} accepted {job_id}. Worker execution scaffold is queued.", lane)


@app.function(image=image, timeout=150)
@modal.fastapi_endpoint(method="POST")
def code(payload: dict[str, Any]) -> dict[str, Any]:
    return _submit_lane("modal-code", payload)


@app.function(image=image, timeout=150)
@modal.fastapi_endpoint(method="POST")
def test(payload: dict[str, Any]) -> dict[str, Any]:
    return _submit_lane("modal-test", payload)


@app.function(image=image, timeout=150)
@modal.fastapi_endpoint(method="POST")
def build(payload: dict[str, Any]) -> dict[str, Any]:
    return _submit_lane("modal-build", payload)


@app.function(image=image, timeout=150)
@modal.fastapi_endpoint(method="POST")
def review(payload: dict[str, Any]) -> dict[str, Any]:
    return _submit_lane("modal-review", payload)


@app.function(image=image, timeout=3600)
def worker_once() -> dict[str, Any]:
    """Drain one queued job.

    The first deployment keeps this conservative: it records the accepted job
    shape and returns it. Actual repo checkout, command execution, artifacts,
    and ProofPacket upload should be added behind a done-test before enabling
    autonomous worker execution.
    """

    job = job_queue.get(timeout=1)
    job["status"] = "received"
    job["received_at"] = int(time.time())
    return job
