import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 180_000; // 3 minutes for local models

// Local model chat via Ollama — Ornith:35B, rig-128gb-coder, etc.
// This makes RIG OS Agency independent of external APIs

export async function POST(req: Request) {
  const { messages, system, model } = await req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "missing messages" }, { status: 400 });
  }

  const ollamaURL = "http://127.0.0.1:11434/api/chat";
  const useModel = model || "ornith:35b";

  const body = {
    model: useModel,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ],
    stream: false,
    options: {
      temperature: 0.7,
      num_predict: 2048,
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const resp = await fetch(ollamaURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `Ollama error: ${resp.status}`, detail: errText.slice(0, 500) },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const msg = data.message || {};
    let text = msg.content || "";

    // For thinking models, if content is empty but thinking has content,
    // use the thinking output
    if (!text && msg.thinking) {
      text = msg.thinking;
    }

    return NextResponse.json({
      ok: true,
      text: text || "(model produced no output — try increasing num_predict)",
      model: useModel,
      thinking: msg.thinking || null,
      eval_count: data.eval_count || 0,
      duration_s: (data.total_duration || 0) / 1e9,
    });
  } catch (e) {
    const error = e as Error;
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out (local model took too long)" }, { status: 504 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
