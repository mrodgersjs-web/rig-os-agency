import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Model status — calls the RIG model health monitor script
export async function GET() {
  const startTime = Date.now();

  try {
    // Try the RIG model health script first
    const resp = await fetch("http://localhost:11434/api/tags", {
      signal: AbortSignal.timeout(5000),
    });

    if (!resp.ok) {
      return NextResponse.json({
        online: false,
        models: [],
        message: "Ollama not responding on :11434",
      });
    }

    const data = await resp.json();
    const models = (data.models || []).map((m: any) => ({
      name: m.name,
      size: `${(m.size / 1e9).toFixed(1)}GB`,
      modified: m.modified,
      parameterSize: m.details?.parameter_size || "unknown",
      quantization: m.details?.quantization_level || "unknown",
      family: m.details?.family || "unknown",
    }));

    // Check which models are currently loaded in VRAM
    let loadedModels: any[] = [];
    try {
      const psResp = await fetch("http://localhost:11434/api/ps", {
        signal: AbortSignal.timeout(3000),
      });
      if (psResp.ok) {
        const psData = await psResp.json();
        loadedModels = (psData.models || []).map((m: any) => ({
          name: m.name,
          vram: `${(m.size_vram / 1e9).toFixed(1)}GB`,
          expiresAt: m.expires_at,
        }));
      }
    } catch {}

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      online: true,
      endpoint: "http://localhost:11434",
      totalModels: models.length,
      loadedCount: loadedModels.length,
      totalVRAMGB:
        loadedModels.length > 0
          ? loadedModels
              .reduce((sum: number, m: any) => {
                const gb = parseFloat(m.vram);
                return sum + (isNaN(gb) ? 0 : gb);
              }, 0)
              .toFixed(1)
          : "0",
      models,
      loaded: loadedModels,
      responseTimeMs,
      routing: {
        code: ["rig-128gb-coder", "qwen3-coder:30b"],
        reason: ["ornith:35b", "rig-128gb-reasoner"],
        embed: ["nomic-embed-text"],
        chat: ["ornith:35b", "rig-128gb-daily"],
      },
      fallback: "OpenRouter (z-ai/glm-5.1) when local model fails or times out (30s)",
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      online: false,
      error: error instanceof Error ? error.message : "Unknown error",
      models: [],
      message: "Ollama not reachable. Check if service is running on :11434",
    });
  }
}
