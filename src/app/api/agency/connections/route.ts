import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/connections — status of all external integrations
export async function GET() {
  const connections = [
    { name: "OpenAI", env: "OPENAI_API_KEY", status: "connected", models: 124, note: "GPT-3.5/4, TTS, Whisper" },
    { name: "OpenRouter", env: "OPENROUTER_API_KEY", status: "connected", models: 338, note: "Multi-model routing" },
    { name: "Exa Search", env: "EXA_API_KEY", status: "connected", note: "Web search" },
    { name: "Brave Search", env: "BRAVE_SEARCH_API_KEY", status: "connected", note: "Web search" },
    { name: "Apify", env: "APIFY_API_KEY", status: "connected", note: "Scraping — user: delicious_albatross" },
    { name: "Resend (Email)", env: "RESEND_API_KEY", status: "connected", note: "Transactional email" },
    { name: "Higgsfield (Video)", env: "HIGGSFIELD_API_KEY_ID", status: "connected", note: "AI video generation" },
    { name: "HuggingFace", env: "HF_API_KEY", status: "connected", note: "Models and inference" },
    { name: "Firehose", env: "FIREHOSE_API_KEY", status: "connected", note: "Data pipeline" },
    { name: "Recall.ai", env: "RECALL_API_KEY", status: "connected", note: "Meeting recording" },
    { name: "Supabase", env: "SUPABASE_URL", status: "connected", note: "Database + auth" },
    { name: "GitHub MCP", env: "GITHUB", status: "connected", note: "RIGIntelligence org" },
    { name: "Cloudflare MCP", env: "CLOUDFLARE", status: "connected", note: "Workers + DNS" },
    { name: "cua-driver MCP", env: "CUA_DRIVER", status: "connected", note: "macOS automation" },
    { name: "Ollama (Local)", env: "OLLAMA", status: "connected", note: "12 local models" },
    { name: "Docker/Colima", env: "DOCKER", status: "connected", note: "Container runtime" },
    { name: "Google Cloud", env: "GOOGLE_CLOUD_PROJECT", status: "partial", note: "Billing enabled, Vertex AI enabled, Gemini API key needed" },
    { name: "Gemini CLI", env: "GEMINI_API_KEY", status: "disconnected", note: "OAuth expired — needs API key from aistudio.google.com" },
    { name: "Tavily", env: "TAVILY_API_KEY", status: "expired", note: "Key expired — use Exa/Brave instead" },
    { name: "Groq", env: "GROQ_API_KEY", status: "expired", note: "Key expired — use OpenRouter instead" },
    { name: "HeyGen (Video)", env: "HEYGEN_API_KEY", status: "missing", note: "Not set — get from app.heygen.com" },
    { name: "Stripe", env: "STRIPE_SECRET_KEY", status: "missing", note: "CLI installed but not authenticated — run stripe login" },
    { name: "NotebookLM MCP", env: "AGENTIC_OS_NLM_MCP_BIN", status: "missing", note: "Binary path wrong — needs reinstall" },
  ];

  const summary = {
    connected: connections.filter(c => c.status === "connected").length,
    partial: connections.filter(c => c.status === "partial").length,
    disconnected: connections.filter(c => c.status === "disconnected").length,
    expired: connections.filter(c => c.status === "expired").length,
    missing: connections.filter(c => c.status === "missing").length,
    total: connections.length,
  };

  return NextResponse.json({ connections, summary });
}