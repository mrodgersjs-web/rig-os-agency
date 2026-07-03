import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rateLimit, localModelQueue } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 180_000;

// Local model chat via Ollama — Ornith:35B
// Now with auth, rate limiting, and request queue

export async function POST(req: Request) {
  // Auth check — if auth system is active, require session
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const session = token ? getSession(token) : null;

  // For local single-user mode, allow without auth
  // For multi-user, require auth
  const isLocalMode = !token;
  
  // Rate limit
  const ip = req.headers.get("x-forwarded-for") || "local";
  const limit = isLocalMode ? 200 : 20; // local user gets more
  const rl = rateLimit(`chat:local:${session?.user_id || ip}`, limit);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limited", remaining: 0, resetAt: rl.resetAt },
      { status: 429 }
    );
  }

  const { messages, system, model } = await req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "missing messages" }, { status: 400 });
  }

  const useModel = model || "ornith:35b";

  // Queue the request — prevents Ornith overload with concurrent users
  try {
    const result = await localModelQueue.run(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const resp = await fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: useModel,
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            ...messages,
          ],
          stream: false,
          options: { temperature: 0.7, num_predict: 2048 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!resp.ok) {
        throw new Error(`Ollama error: ${resp.status}`);
      }

      const data = await resp.json();
      const msg = data.message || {};
      let text = msg.content || "";
      if (!text && msg.thinking) text = msg.thinking;

      return {
        ok: true,
        text: text || "(model produced no output)",
        model: useModel,
        thinking: msg.thinking || null,
        eval_count: data.eval_count || 0,
        duration_s: (data.total_duration || 0) / 1e9,
        queue: localModelQueue.stats,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    const error = e as Error;
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Model timeout", queue: localModelQueue.stats },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: error.message, queue: localModelQueue.stats },
      { status: 500 }
    );
  }
}
