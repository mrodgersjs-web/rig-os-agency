// ── RIG OS Agency — MCP Server Registry ────────────────────────────
// 15 MCP servers with health monitoring.

export type MCPStatus = "connected" | "disconnected" | "error" | "unknown";

export interface MCPServer {
  id: string;
  name: string;
  category: string;
  status: MCPStatus;
  toolCount: number;
  capabilities: string[];
  description: string;
}

// ── Registry ───────────────────────────────────────────────────────
export const MCP_SERVERS: MCPServer[] = [
  { id: "cua-driver", name: "cua-driver", category: "automation", status: "connected", toolCount: 8, capabilities: ["capture", "click", "type", "scroll", "drag", "set_value"], description: "Drive macOS desktop — screenshots, mouse, keyboard in background" },
  { id: "github", name: "github", category: "dev", status: "connected", toolCount: 12, capabilities: ["repos", "issues", "prs", "commits", "reviews", "branches"], description: "GitHub read/write via local Keychain-aware wrapper. Org: RIGIntelligence" },
  { id: "supabase", name: "supabase", category: "data", status: "connected", toolCount: 10, capabilities: ["query", "insert", "update", "delete", "storage", "auth"], description: "Official remote OAuth MCP endpoint, project-scoped read/write" },
  { id: "consensus", name: "consensus", category: "research", status: "connected", toolCount: 3, capabilities: ["search_papers", "get_paper", "citation"], description: "Consensus.app academic paper search. URL: mcp.consensus.app/mcp" },
  { id: "mathexec-sandbox", name: "MathExec (sandbox)", category: "compute", status: "connected", toolCount: 5, capabilities: ["evaluate", "solve", "simplify", "integrate", "differentiate"], description: "E2B sandbox for mathematical computation" },
  { id: "mathexec-sympy", name: "MathExec (sympy)", category: "compute", status: "connected", toolCount: 5, capabilities: ["symbolic", "solve", "simplify", "integrate", "differentiate"], description: "SymPy-based symbolic math MCP server" },
  { id: "gtm", name: "GTM", category: "business", status: "connected", toolCount: 15, capabilities: ["lead_score", "cold_email", "followup", "proposal", "forecast"], description: "GTM tools: lead scoring, cold email, follow-up cascade, proposal factory" },
  { id: "crm", name: "CRM (Twenty)", category: "business", status: "connected", toolCount: 8, capabilities: ["contacts", "deals", "pipeline", "tasks", "notes"], description: "Twenty CRM at localhost:3000, 2438 records" },
  { id: "hermes-swarm", name: "Hermes Swarm", category: "orchestration", status: "connected", toolCount: 6, capabilities: ["spawn", "dispatch", "poll", "merge", "status"], description: "Multi-agent swarm orchestration for parallel work" },
  { id: "context7", name: "Context7", category: "dev", status: "connected", toolCount: 3, capabilities: ["search_docs", "get_context", "resolve"], description: "Documentation context provider for development" },
  { id: "exa", name: "Exa", category: "research", status: "connected", toolCount: 4, capabilities: ["search", "find_similar", "answer", "contents"], description: "Exa AI search — web research and content extraction" },
  { id: "playwright", name: "Playwright", category: "automation", status: "connected", toolCount: 10, capabilities: ["navigate", "click", "fill", "screenshot", "evaluate", "wait"], description: "Browser automation via Playwright MCP" },
  { id: "sequential", name: "Sequential Thinking", category: "reasoning", status: "connected", toolCount: 2, capabilities: ["think", "reason"], description: "Sequential reasoning MCP for complex problem decomposition" },
  { id: "railway", name: "Railway", category: "devops", status: "connected", toolCount: 7, capabilities: ["deploy", "logs", "status", "env", "service", "volume"], description: "Railway deployment management" },
  { id: "firecrawl", name: "Firecrawl", category: "research", status: "connected", toolCount: 5, capabilities: ["scrape", "crawl", "search", "map", "extract"], description: "Web scraping and content extraction" },
];

// ── Helper Functions ──────────────────────────────────────────────
export function getMCPs(): MCPServer[] {
  return MCP_SERVERS;
}

export function getMCPStats() {
  const connected = MCP_SERVERS.filter((m) => m.status === "connected").length;
  const disconnected = MCP_SERVERS.filter((m) => m.status === "disconnected").length;
  const errored = MCP_SERVERS.filter((m) => m.status === "error").length;
  const totalTools = MCP_SERVERS.reduce((sum, m) => sum + m.toolCount, 0);
  return {
    total: MCP_SERVERS.length,
    connected,
    disconnected,
    errored,
    totalTools,
  };
}

export function getMCPByCategory(category: string): MCPServer[] {
  return MCP_SERVERS.filter((m) => m.category === category);
}

export function getMCPById(id: string): MCPServer | undefined {
  return MCP_SERVERS.find((m) => m.id === id);
}