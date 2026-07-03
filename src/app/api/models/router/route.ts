import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteRequest {
  task: "code" | "reason" | "embed" | "chat";
  prompt: string;
  model?: string; // override
  stream?: boolean;
}

const TASK_ROUTING: Record<string, string[]> = {
  code: ["rig-128gb-coder", "qwen3-coder:30b"],
  reason: ["ornith:35b", "rig-128gb-reasoner"],
  embed: ["nomic-embed-text"],
  chat: ["ornith:35b", "rig-128gb-daily"],
};

const OLLAMA_HOST = "http://localhost:11434";
const TIMEOUT_MS = 30_000;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  let body: RouteRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { task, prompt, model? }" },
      { status: 400 }
    );
  }

  const { task, prompt, model: modelOverride } = body;

  if (!task || !prompt) {
    return NextResponse.json(
      { error: "Missing required fields: task, prompt" },
      { status: 400 }
    );
  }

  if (!TASK_ROUTING[task]) {
    return NextResponse.json(
      {
        error: `Invalid task type: ${task}. Must be one of: ${Object.keys(TASK_ROUTING).join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Determine which model to use
  const preferredModels = modelOverride
    ? [modelOverride]
    : TASK_ROUTING[task];
  const chosenModel = preferredModels[0];

  // Embeddings use a different endpoint
  if (task === "embed") {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const resp = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: chosenModel, prompt }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        throw new Error(`Ollama returned ${resp.status}`);
      }

      const data = await resp.json();
      return NextResponse.json({
        model: chosenModel,
        embedding: data.embedding,
        dimensions: data.embedding?.length || 0,
        latency_ms: Date.now() - startTime,
        source: "local",
        task,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Local model failed and no cloud fallback for embeddings",
          detail: error instanceof Error ? error.message : "Unknown",
          latency_ms: Date.now() - startTime,
        },
        { status: 502 }
      );
    }
  }

  // Chat / code / reason — use /api/chat with streaming option
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const resp = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: chosenModel,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: task === "code" ? { temperature: 0 } : { temperature: 0.3 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      throw new Error(`Ollama returned ${resp.status}`);
    }

    const data = await resp.json();
    const content = data.message?.content || "";
    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      model: chosenModel,
      response: content,
      tokens: data.eval_count || 0,
      latency_ms: responseTimeMs,
      tokens_per_second:
        data.eval_count && data.eval_duration
          ? Math.round((data.eval_count / (data.eval_duration / 1e9)) * 10) / 10
          : 0,
      source: "local",
      task,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Fall back to OpenRouter if local model fails
    const openrouterKey = process.env.OPENROUTER_API_KEY || "";

    if (openrouterKey) {
      try {
        const orResp = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openrouterKey}`,
            },
            body: JSON.stringify({
              model: "z-ai/glm-5.1",
              messages: [{ role: "user", content: prompt }],
              temperature: task === "code" ? 0 : 0.3,
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          }
        );

        if (!orResp.ok) throw new Error(`OpenRouter returned ${orResp.status}`);

        const orData = await orResp.json();
        const content = orData.choices?.[0]?.message?.content || "";
        const responseTimeMs = Date.now() - startTime;

        return NextResponse.json({
          model: "z-ai/glm-5.1",
          response: content,
          tokens: orData.usage?.completion_tokens || 0,
          latency_ms: responseTimeMs,
          source: "cloud",
          fallback_reason:
            error instanceof Error ? error.message : "Local model failed",
          task,
          timestamp: new Date().toISOString(),
        });
      } catch (fallbackError) {
        return NextResponse.json(
          {
            error: "Both local and fallback models failed",
            local_error: error instanceof Error ? error.message : "Unknown",
            fallback_error:
              fallbackError instanceof Error
                ? fallbackError.message
                : "Unknown",
            latency_ms: Date.now() - startTime,
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Local model failed and no cloud fallback configured",
        detail: error instanceof Error ? error.message : "Unknown",
        latency_ms: Date.now() - startTime,
      },
      { status: 502 }
    );
  }
}

// GET — show routing table
export async function GET() {
  return NextResponse.json({
    routing: TASK_ROUTING,
    ollama_endpoint: OLLAMA_HOST,
    timeout: `${TIMEOUT_MS / 1000}s`,
    fallback: "OpenRouter z-ai/glm-5.1 when local fails",
    usage: {
      method: "POST",
      body: {
        task: "code | reason | embed | chat",
        prompt: "your text",
        model: "(optional) override model name",
      },
    },
  });
}
