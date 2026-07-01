import { spawnStream } from "@/lib/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gemini CLI streaming: `gemini -p "..." -o stream-json` emits one JSON object per line.
// Event shape (verified by probe):
//   {"type":"init", session_id, model}
//   {"type":"message", role:"user"|"assistant", content, delta?:bool}
//   {"type":"tool_call", name, args}
//   {"type":"tool_result", ...}
//   {"type":"result", status, stats}
//
// We pass the prompt via -p arg (small) and let stdin remain closed.
export async function POST(req: Request) {
  const { prompt, model, yolo, resume } = await req.json();
  if (typeof prompt !== "string" || prompt.length === 0) {
    return new Response("missing prompt", { status: 400 });
  }
  if (prompt.length > 32_000) {
    return new Response("prompt too long", { status: 413 });
  }

  const args: string[] = ["-p", prompt, "-o", "stream-json"];
  if (typeof model === "string" && /^[A-Za-z0-9._-]+$/.test(model)) args.push("-m", model);
  if (yolo === true) args.push("-y");
  if (typeof resume === "string" && /^[A-Za-z0-9._-]+$/.test(resume)) args.push("--resume", resume);

  const child = spawnStream("gemini", args);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Node sometimes flushes stderr after the child's close event has fired and we've
      // already closed the controller. Guard every send so a late chunk doesn't throw
      // "Invalid state: Controller is already closed".
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(chunk)); }
        catch { closed = true; }
      };
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try { controller.close(); } catch {}
      };
      child.stdout.on("data", (b: Buffer) => send(b.toString()));
      child.stderr.on("data", (b: Buffer) => {
        send(JSON.stringify({ type: "stderr", text: b.toString() }) + "\n");
      });
      child.on("close", (code) => {
        send(JSON.stringify({ type: "done", code }) + "\n");
        safeClose();
      });
      child.on("error", (e) => {
        send(JSON.stringify({ type: "error", message: String(e) }) + "\n");
        safeClose();
      });
    },
    cancel() { try { child.kill("SIGTERM"); } catch {} },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
