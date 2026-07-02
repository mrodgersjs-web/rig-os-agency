"""RIG Agency-backed swarm apps for Modal.

This is a deployable scaffold for ten RIG coding-acceleration apps. It accepts
OpenAI-compatible chat requests, routes each request to a named app contract,
and queues work for later workers. It intentionally does not execute arbitrary
repo commands yet.

Deploy only after Modal account auth and cost approval are complete.
"""

from __future__ import annotations

import time
import uuid
from typing import Any

import modal
from fastapi import FastAPI, HTTPException


app = modal.App("rig-agency-swarm-apps")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("bash", "build-essential", "curl", "git", "nodejs", "npm", "ripgrep")
    .pip_install("fastapi[standard]")
)

job_queue = modal.Queue.from_name("rig-agency-swarm-jobs", create_if_missing=True)
job_results = modal.Dict.from_name("rig-agency-swarm-results", create_if_missing=True)

SWARM_APPS: dict[str, dict[str, Any]] = {
    "swarm-router": {
        "model": "modal-swarm-router",
        "name": "Swarm Router",
        "roles": [
            "engineering-multi-agent-systems-architect",
            "specialized-workflow-architect",
            "project-management-project-shepherd",
            "product-sprint-prioritizer",
        ],
        "contract": "Return a routed job graph with lanes, done-tests, risks, and sequencing.",
    },
    "repo-map": {
        "model": "modal-repo-map",
        "name": "Repo Cartographer",
        "roles": ["engineering-software-architect", "engineering-backend-architect", "engineering-technical-writer"],
        "contract": "Return repo map, command inventory, risk hotspots, and first safe task slices.",
    },
    "patch-factory": {
        "model": "modal-patch-factory",
        "name": "Patch Factory",
        "roles": [
            "engineering-senior-developer",
            "engineering-frontend-developer",
            "engineering-backend-architect",
            "engineering-code-reviewer",
        ],
        "contract": "Return a bounded patch plan, changed files, rationale, and verification command.",
    },
    "test-forge": {
        "model": "modal-test-forge",
        "name": "Test Forge",
        "roles": [
            "testing-api-tester",
            "testing-test-results-analyzer",
            "testing-reality-checker",
            "testing-workflow-optimizer",
        ],
        "contract": "Return test additions, execution plan, failure triage, and coverage or risk note.",
    },
    "build-farm": {
        "model": "modal-build-farm",
        "name": "Build Farm",
        "roles": ["engineering-devops-automator", "engineering-sre", "testing-performance-benchmarker"],
        "contract": "Return build log summary, artifact manifest, failure summary, and cache note.",
    },
    "review-gate": {
        "model": "modal-review-gate",
        "name": "Review Gate",
        "roles": ["engineering-code-reviewer", "testing-reality-checker", "engineering-software-architect"],
        "contract": "Return severity-ranked findings, file references, missing tests, and residual risk.",
    },
    "security-sentinel": {
        "model": "modal-security-sentinel",
        "name": "Security Sentinel",
        "roles": [
            "security-appsec-engineer",
            "security-cloud-security-architect",
            "security-compliance-auditor",
            "security-threat-detection-engineer",
        ],
        "contract": "Return threat model, scan summary, findings, and release gate status.",
    },
    "refactor-foundry": {
        "model": "modal-refactor-foundry",
        "name": "Refactor Foundry",
        "roles": ["engineering-software-architect", "engineering-database-optimizer", "engineering-backend-architect"],
        "contract": "Return migration plan, patch or codemod plan, rollback note, and verification matrix.",
    },
    "ux-lab": {
        "model": "modal-ux-lab",
        "name": "UX Lab",
        "roles": [
            "engineering-frontend-developer",
            "design-ui-designer",
            "design-ux-architect",
            "design-ux-researcher",
            "testing-accessibility-auditor",
        ],
        "contract": "Return UI implementation plan, screenshots checklist, accessibility notes, and responsive checks.",
    },
    "docs-proof": {
        "model": "modal-docs-proof",
        "name": "Docs Proof",
        "roles": ["engineering-technical-writer", "support-analytics-reporter", "project-management-experiment-tracker"],
        "contract": "Return source-grounded docs, artifact hashes, command evidence, and next actions.",
    },
}

MODEL_TO_SLUG = {spec["model"]: slug for slug, spec in SWARM_APPS.items()}
api = FastAPI(title="RIG Agency Swarm Apps", version="0.1.0")


def _prompt_from_payload(payload: dict[str, Any]) -> str:
    messages = payload.get("messages")
    if isinstance(messages, list):
        parts = []
        for message in messages:
            if not isinstance(message, dict):
                continue
            content = message.get("content")
            if isinstance(content, str):
                parts.append(content)
            elif isinstance(content, list):
                parts.extend(str(item.get("text", "")) for item in content if isinstance(item, dict))
        return "\n".join(part for part in parts if part).strip()
    prompt = payload.get("prompt")
    return prompt if isinstance(prompt, str) else ""


def _chat_response(model: str, content: str, job_id: str | None = None) -> dict[str, Any]:
    return {
        "id": f"chatcmpl-rig-swarm-{uuid.uuid4().hex[:12]}",
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
        "rig": {"job_id": job_id, "manual_only": True},
    }


def _submit(slug: str, payload: dict[str, Any]) -> dict[str, Any]:
    spec = SWARM_APPS.get(slug)
    if not spec:
        raise HTTPException(status_code=404, detail=f"unknown swarm app: {slug}")

    job_id = f"rigswarm-{uuid.uuid4().hex[:12]}"
    prompt = _prompt_from_payload(payload)
    job = {
        "id": job_id,
        "app": slug,
        "model": spec["model"],
        "name": spec["name"],
        "roles": spec["roles"],
        "contract": spec["contract"],
        "status": "queued",
        "created_at": int(time.time()),
        "payload": payload,
        "prompt_preview": prompt[:2000],
        "external_side_effects": False,
    }
    job_queue.put(job)
    job_results[job_id] = {"status": "queued", "job": job}

    content = (
        f"{spec['name']} accepted {job_id}.\n"
        f"Agency roles: {', '.join(spec['roles'])}\n"
        f"Contract: {spec['contract']}\n"
        "Execution is queued and side-effect free until a worker is explicitly enabled."
    )
    return _chat_response(spec["model"], content, job_id=job_id)


@api.get("/healthz")
def healthz() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "rig-agency-swarm-apps",
        "app_count": len(SWARM_APPS),
        "apps": sorted(SWARM_APPS),
        "manual_only": True,
    }


@api.get("/apps")
def list_apps() -> dict[str, Any]:
    return {"apps": SWARM_APPS}


@api.post("/apps/{slug}/v1/chat/completions")
def app_chat(slug: str, payload: dict[str, Any]) -> dict[str, Any]:
    return _submit(slug, payload)


@api.post("/v1/chat/completions")
def model_chat(payload: dict[str, Any]) -> dict[str, Any]:
    model = str(payload.get("model") or "")
    slug = MODEL_TO_SLUG.get(model) or model.removeprefix("modal-")
    if slug.startswith("rig-"):
        slug = slug.removeprefix("rig-")
    slug = slug.replace("_", "-")
    if slug not in SWARM_APPS:
        raise HTTPException(status_code=404, detail=f"unknown swarm model: {model}")
    return _submit(slug, payload)


@api.get("/jobs/{job_id}")
def get_job(job_id: str) -> dict[str, Any]:
    value = job_results.get(job_id)
    if not value:
        raise HTTPException(status_code=404, detail=f"unknown job: {job_id}")
    return value


@app.function(image=image, timeout=150)
@modal.asgi_app()
def web():
    return api


@app.function(image=image, timeout=3600)
def worker_once() -> dict[str, Any]:
    """Drain one queued job and mark it received.

    Later worker versions can add repo fetch, sandbox execution, artifact
    upload, and ProofPacket sealing behind this narrow job contract.
    """

    job = job_queue.get(timeout=1)
    job["status"] = "received"
    job["received_at"] = int(time.time())
    job_results[job["id"]] = {"status": "received", "job": job}
    return job
