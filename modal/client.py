"""
RIG Modal Client — OpenAI-compatible client for GLM-5.2-FP8 on 8xB200
Used by the 1000x improvement loop for high-speed inference.
"""
import os
import json
import urllib.request
import urllib.error

# The Modal endpoint URL will be set after deployment
# Format: https://<workspace>--ep-rig-server.modal.run/v1/chat/completions
MODAL_ENDPOINT_URL = os.environ.get("RIG_MODAL_ENDPOINT_URL", "")
MODAL_API_KEY = os.environ.get("RIG_MODAL_API_KEY", "")

def chat_completion(
    messages: list[dict],
    model: str = "zai-org/GLM-5.2-FP8",
    max_tokens: int = 4096,
    temperature: float = 0.0,
    stream: bool = False,
) -> dict:
    """Call the Modal GLM-5.2-FP8 endpoint with OpenAI-compatible API."""
    if not MODAL_ENDPOINT_URL:
        raise ValueError("RIG_MODAL_ENDPOINT_URL not set. Deploy the endpoint first.")
    
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": stream,
    }
    
    headers = {"Content-Type": "application/json"}
    if MODAL_API_KEY:
        headers["Authorization"] = f"Bearer {MODAL_API_KEY}"
    
    req = urllib.request.Request(
        f"{MODAL_ENDPOINT_URL}/v1/chat/completions",
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}", "detail": e.read().decode()[:500]}
    except Exception as e:
        return {"error": str(e)}


def improve_code(current_state: str, goal: str, context: str = "") -> dict:
    """Use GLM-5.2-FP8 to generate code improvements for the 1000x loop."""
    messages = [
        {
            "role": "system",
            "content": """You are the RIG 1000x Improvement Engine. Your job is to make RIG OS Agency 
1000x better every 2 hours. You think in code. You output working TypeScript/Python/JSON.
You follow RIG doctrine: deterministic before agentic, ProofPacket or it didn't happen.
You operate at L4-D1-A3 (execution body, physical diamond, agent bounded mode)."""
        },
        {
            "role": "user",
            "content": f"""GOAL: {goal}

CURRENT STATE:
{current_state}

CONTEXT:
{context}

Generate the next highest-impact improvement. Output:
1. What to change (file path + description)
2. The actual code to write
3. How to verify it works
4. Expected impact (what gets 1000x better)"""
        }
    ]
    return chat_completion(messages, max_tokens=8192, temperature=0.0)


if __name__ == "__main__":
    # Quick test
    result = chat_completion([
        {"role": "user", "content": "Reply with exactly: RIG 1000x READY"}
    ], max_tokens=16)
    print(json.dumps(result, indent=2))
