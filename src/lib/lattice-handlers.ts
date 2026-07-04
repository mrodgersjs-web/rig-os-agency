// src/lib/lattice-handlers.ts
// Register deterministic A1/A2/A3/A4 handlers for the RIG lattice runtime

import { registerA1, registerA2, registerA3, registerA4 } from "./lattice";

// A1 — deterministic, typed, no LLM
registerA1("sum", (input: { a: number; b: number }) => {
  if (typeof input.a !== "number" || typeof input.b !== "number") {
    throw new Error("A1 sum requires numeric a and b");
  }
  return { sum: input.a + input.b, deterministic: true };
});

registerA1("health-check", () => {
  return { status: "ok", timestamp: new Date().toISOString(), deterministic: true };
});

registerA1("deal-weighted-value", (input: { value: number; stage: string }) => {
  const weights: Record<string, number> = { discovery: 0.1, qualified: 0.25, proposal: 0.5, negotiation: 0.75, closed: 1.0 };
  const w = weights[input.stage] || 0;
  return { weighted: Math.round(input.value * w), weight: w, deterministic: true };
});

// A2 — bounded LLM with forced JSON schema (currently deterministic mock; wire to /api/local/chat)
registerA2("summarize", async (input: { text: string }) => {
  const words = input.text.split(/\s+/).length;
  return {
    result: {
      summary: `Summary of ${words} words: ${input.text.slice(0, 80)}...`,
      wordCount: words,
      mode: "A2",
    },
    schema: { type: "object", properties: { summary: "string", wordCount: "number", mode: "string" } },
  };
});

registerA2("score-deal", async (input: { deal: any }) => {
  const stageScores: Record<string, number> = { discovery: 20, qualified: 40, proposal: 60, negotiation: 80, closed: 100 };
  const score = stageScores[input.deal?.stage] || 0;
  return {
    result: { score, tier: score >= 80 ? "hot" : score >= 50 ? "warm" : "cold", mode: "A2" },
    schema: { type: "object", properties: { score: "number", tier: "string", mode: "string" } },
  };
});

// A3 — governed agent workflow with tool allowlist
registerA3("research-agent", async (input: any, tools: string[]) => {
  if (!tools.includes("web") && !tools.includes("terminal")) {
    throw new Error("A3 research-agent requires 'web' or 'terminal' in tool allowlist");
  }
  return {
    completed: true,
    toolsUsed: tools,
    findings: [`Found ${input.topic || "topic"} via ${tools.join(", ")}`],
    mode: "A3",
  };
});

registerA3("pipeline-agent", async (input: any, tools: string[]) => {
  if (!tools.includes("api-write")) {
    throw new Error("A3 pipeline-agent requires 'api-write' tool for stage changes");
  }
  return {
    moved: input.dealId,
    fromStage: input.fromStage,
    toStage: input.toStage,
    mode: "A3",
  };
});

// A4 — strategic/adversarial reasoning with human approval required
registerA4("strategic-decision", async (input: any) => {
  return {
    recommendation: `Proceed with ${input.option || "Option A"} based on available data`,
    confidence: 0.72,
    risks: ["Market uncertainty", "Execution bandwidth", "Competitive response"],
    mode: "A4",
  };
});

export {};
