import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 120_000; // 2 minutes

// Z.AI / GLM chat — uses the Z.AI API key from Hermes .env
// This is the working model (glm-5.2) that doesn't time out

export async function POST(req: Request) {
  const { messages, system, model } = await req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "missing messages" }, { status: 400 });
  }

  // Read Z.AI API key from Hermes .env
  const envPath = process.env.HOME + "/.hermes/.env";
  let apiKey = "";
  try {
    const fs = await import("fs");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/ZAI_API_KEY=(.+)/);
    apiKey = match ? match[1].trim() : "";
  } catch {}

  if (!apiKey) {
    return NextResponse.json({ error: "Z.AI API key not configured" }, { status: 503 });
  }

  const apiURL = "https://api.z.ai/api/paas/v4/chat/completions";
  const body = {
    model: model || "glm-4.6",
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 4096,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const resp = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `Z.AI API error: ${resp.status}`, detail: errText.slice(0, 500) },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || "(no response)";
    const usage = data.usage || {};

    return NextResponse.json({
      ok: true,
      text,
      model: data.model || model || "glm-4.6",
      usage,
      durationMs: data.usage?.total_tokens ? undefined : undefined,
    });
  } catch (e) {
    const error = e as Error;
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
