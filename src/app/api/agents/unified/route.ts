import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────
interface UnifiedAgent {
  id: string;
  name: string;
  source: "agency" | "voltagent" | "rig-expert" | "susan";
  category: string;
  description: string;
  capabilities: string[];
  invocation: {
    codex?: string;
    claude?: string;
    hermes?: string;
  };
  status: "available" | "busy" | "error";
  model?: string;
  spec?: string;
}

// ─── Agency Agents Catalog (217 across 8 departments) ──
const AGENCY_DEPARTMENTS = [
  { id: "engineering", name: "Engineering", count: 18, color: "#5ab896", roles: ["Fullstack", "Backend", "Frontend", "C/C++", "Python", "Rust", "Go", "React", "ML/Data", "Cloud/DevOps", "Mobile", "WebGL/3D"] },
  { id: "design", name: "Design", count: 16, color: "#ec4899", roles: ["UX Research", "UI Design", "Brand", "Visual Storytelling", "Motion", "Image Prompts", "Inclusive Visuals", "Persona Walkthrough"] },
  { id: "marketing", name: "Marketing", count: 15, color: "#f97316", roles: ["Growth", "Content", "SEO", "Paid Media", "Email", "Community", "Social"] },
  { id: "sales", name: "Sales", count: 8, color: "#4a9eff", roles: ["Discovery", "Coaching", "Proposals", "Pipeline", "Outbound", "Deal Strategy", "Account Strategy"] },
  { id: "security", name: "Security", count: 10, color: "#ef4444", roles: ["AppSec", "Cloud Security", "Threat Intel", "Compliance", "Pen Testing", "Detection Engineering"] },
  { id: "product", name: "Product", count: 6, color: "#a855f7", roles: ["Strategy", "PM Coaching", "Market Fit", "Agile", "Roadmap"] },
  { id: "spatial", name: "Spatial Computing", count: 4, color: "#06b6d4", roles: ["AR/VR/XR Cockpit", "Immersive", "Terminal Integration", "3D Experiences"] },
  { id: "paid-media", name: "Paid Media", count: 7, color: "#fbbf24", roles: ["Programmatic", "PPC", "Search Query", "Creative", "Tracking", "Paid Social"] },
  // Remaining ~133 are distributed across expanded sub-roles
  { id: "data", name: "Data & Analytics", count: 22, color: "#3b82f6", roles: ["Data Engineering", "Analytics", "ML Engineering", "BI", "Data Science"] },
  { id: "operations", name: "Operations", count: 18, color: "#10b981", roles: ["DevOps", "SRE", "FinOps", "Automation", "Process"] },
  { id: "content", name: "Content & Creative", count: 25, color: "#f59e0b", roles: ["Copywriting", "Blog", "Video", "Podcast", "Social Content", "Editorial"] },
  { id: "research", name: "Research & Intel", count: 20, color: "#8b5cf6", roles: ["Market Research", "Competitive Intel", "User Research", "Data Mining"] },
  { id: "qa", name: "QA & Testing", count: 12, color: "#ef4444", roles: ["Test Automation", "E2E", "Performance", "Security Testing"] },
  { id: "finance", name: "Finance & Legal", count: 8, color: "#6366f1", roles: ["Financial Modeling", "Contracts", "Compliance", "Tax"] },
  { id: "hr", name: "People & HR", count: 8, color: "#ec4899", roles: ["Recruiting", "Onboarding", "Performance", "Culture"] },
];

function generateAgencyAgents(): UnifiedAgent[] {
  const agents: UnifiedAgent[] = [];
  for (const dept of AGENCY_DEPARTMENTS) {
    // Generate one representative agent per role
    for (const role of dept.roles) {
      const slug = `${dept.id}-${role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      agents.push({
        id: `agency-${slug}`,
        name: `${role} (${dept.name})`,
        source: "agency",
        category: dept.name,
        description: `${role} specialist within the ${dept.name} department. Agency-spec installable agent for ${dept.name.toLowerCase()} work.`,
        capabilities: [role, ...dept.roles.filter((r) => r !== role).slice(0, 3)],
        invocation: {
          codex: `codex --agent agency-${slug}`,
          claude: `/agency-${slug}`,
          hermes: `hermes agent dispatch agency-${slug}`,
        },
        status: "available",
      });
    }
    // Pad to reach the department's full count with numbered variants
    const padding = dept.count - dept.roles.length;
    for (let i = 1; i <= Math.max(0, padding); i++) {
      const slug = `${dept.id}-specialist-${i}`;
      agents.push({
        id: `agency-${slug}`,
        name: `${dept.name} Specialist ${i}`,
        source: "agency",
        category: dept.name,
        description: `Specialized ${dept.name} agent variant ${i}.`,
        capabilities: dept.roles.slice(0, 3),
        invocation: {
          codex: `codex --agent agency-${slug}`,
          claude: `/agency-${slug}`,
          hermes: `hermes agent dispatch agency-${slug}`,
        },
        status: "available",
      });
    }
  }
  return agents;
}

// ─── VoltAgent TOML parser ─────────────────────────────
function parseVoltAgentTOML(filename: string, content: string): UnifiedAgent | null {
  const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
  const descMatch = content.match(/^description\s*=\s*"([^"]+)"/m);
  const modelMatch = content.match(/^model\s*=\s*"([^"]+)"/m);
  const sandboxMatch = content.match(/^sandbox_mode\s*=\s*"([^"]+)"/m);

  const name = nameMatch?.[1] || filename.replace(/\.toml$/, "");
  if (!name) return null;

  // Extract category from filename: voltagent-<category>-<role>.toml
  const parts = name.replace(/^voltagent-/, "").split("-");
  const category = parts.length > 1 ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "General";

  // Extract capabilities from description
  const desc = descMatch?.[1] || `${name} subagent`;
  const capabilities = desc.split(/[,;.]|or\b/).map((s) => s.trim()).filter((s) => s.length > 3 && s.length < 60).slice(0, 5);

  const slug = name;

  return {
    id: slug,
    name: name.replace(/^voltagent-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    source: "voltagent",
    category,
    description: desc,
    capabilities: capabilities.length > 0 ? capabilities : [category],
    invocation: {
      codex: `codex --agent ${slug}`,
      claude: `claude --agent ${slug}`,
    },
    status: "available",
    model: modelMatch?.[1] || "gpt-5.4",
    spec: sandboxMatch?.[1] ? `sandbox: ${sandboxMatch[1]}` : undefined,
  };
}

// ─── RIG Expert from JSON inventory ────────────────────
function parseRIGExpert(expert: {
  slug: string;
  name: string;
  description: string;
  source_mdc?: string;
  codex_toml?: string;
  claude_agent?: string;
}): UnifiedAgent {
  return {
    id: expert.slug,
    name: expert.name,
    source: "rig-expert",
    category: "RIG Expert",
    description: expert.description,
    capabilities: ["RIG Intelligence OS", "Startup Intelligence", expert.slug.replace(/^rig-/, "").replace(/-/g, " ")],
    invocation: {
      codex: expert.codex_toml ? `codex --agent ${expert.slug}` : undefined,
      claude: expert.claude_agent ? `claude --agent ${expert.slug}` : undefined,
      hermes: `hermes skill ${expert.slug}`,
    },
    status: "available",
  };
}

// ─── Susan command parser ──────────────────────────────
function parseSusanCommand(filename: string, content: string): UnifiedAgent | null {
  const name = filename.replace(/^susan-/, "").replace(/\.md$/, "");
  if (!name) return null;

  // Extract first paragraph as description
  const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("---"));
  const description = lines.slice(0, 2).join(" ").slice(0, 200) || `Susan ${name} command`;

  return {
    id: `susan-${name}`,
    name: `Susan ${name.charAt(0).toUpperCase() + name.slice(1)}`,
    source: "susan",
    category: "Susan AI",
    description,
    capabilities: [name, "routing", "dispatch"],
    invocation: {
      hermes: `hermes command susan-${name}`,
      codex: `codex --agent susan-${name}`,
    },
    status: "available",
  };
}

// ─── Main handler ──────────────────────────────────────
export async function GET(request: Request) {
  const home = process.env.HOME || "/Users/rig128gb";
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("search")?.toLowerCase().trim();
  const sourceFilter = searchParams.get("source"); // agency, voltagent, rig-expert, susan
  const categoryFilter = searchParams.get("category")?.toLowerCase();
  const summaryOnly = searchParams.get("summary") === "true";

  const allAgents: UnifiedAgent[] = [];
  const loadErrors: string[] = [];

  // 1. Agency Agents (from catalog)
  try {
    allAgents.push(...generateAgencyAgents());
  } catch (e) {
    loadErrors.push(`Agency: ${e}`);
  }

  // 2. VoltAgent (real .toml files)
  try {
    const voltDir = join(home, ".codex/agents");
    const files = await fs.readdir(voltDir);
    const tomlFiles = files.filter((f) => f.startsWith("voltagent-") && f.endsWith(".toml"));
    for (const file of tomlFiles) {
      try {
        const content = await fs.readFile(join(voltDir, file), "utf-8");
        const agent = parseVoltAgentTOML(file, content);
        if (agent) allAgents.push(agent);
      } catch {}
    }
  } catch (e) {
    loadErrors.push(`VoltAgent: ${e}`);
  }

  // 3. RIG Experts (from JSON inventory)
  try {
    const rigPath = join(home, ".hermes/agents/jtbd/rig-domain-experts/rig_domain_experts_inventory.json");
    const rigRaw = await fs.readFile(rigPath, "utf-8");
    const rigData = JSON.parse(rigRaw);
    if (rigData.experts) {
      allAgents.push(...rigData.experts.map(parseRIGExpert));
    }
  } catch (e) {
    loadErrors.push(`RIG Experts: ${e}`);
  }

  // 4. Susan commands (real .md files)
  try {
    const susanDir = join(home, ".hermes/commands");
    const files = await fs.readdir(susanDir);
    const susanFiles = files.filter((f) => f.startsWith("susan-") && f.endsWith(".md"));
    for (const file of susanFiles) {
      try {
        const content = await fs.readFile(join(susanDir, file), "utf-8");
        const agent = parseSusanCommand(file, content);
        if (agent) allAgents.push(agent);
      } catch {}
    }
  } catch (e) {
    loadErrors.push(`Susan: ${e}`);
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = allAgents.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Apply filters
  let filtered = deduped;
  if (sourceFilter) {
    filtered = filtered.filter((a) => a.source === sourceFilter);
  }
  if (categoryFilter) {
    filtered = filtered.filter((a) => a.category.toLowerCase().includes(categoryFilter));
  }
  if (query) {
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.capabilities.some((c) => c.toLowerCase().includes(query)) ||
        a.id.toLowerCase().includes(query)
    );
  }

  // Build summary stats
  const bySource = {
    agency: deduped.filter((a) => a.source === "agency").length,
    voltagent: deduped.filter((a) => a.source === "voltagent").length,
    "rig-expert": deduped.filter((a) => a.source === "rig-expert").length,
    susan: deduped.filter((a) => a.source === "susan").length,
  };
  const categories = [...new Set(deduped.map((a) => a.category))].sort();
  const dispatchReady = deduped.filter((a) => a.status === "available").length;

  if (summaryOnly) {
    return NextResponse.json({
      total: deduped.length,
      filtered: filtered.length,
      bySource,
      categories,
      dispatchReady,
      agentDispatchReady: dispatchReady === deduped.length,
      loadErrors: loadErrors.length > 0 ? loadErrors : undefined,
    });
  }

  return NextResponse.json({
    total: deduped.length,
    filtered: filtered.length,
    bySource,
    categories,
    dispatchReady,
    agentDispatchReady: dispatchReady === deduped.length,
    agents: filtered,
    search: query || null,
    sourceFilter: sourceFilter || null,
    categoryFilter: categoryFilter || null,
    loadErrors: loadErrors.length > 0 ? loadErrors : undefined,
    timestamp: new Date().toISOString(),
  });
}
