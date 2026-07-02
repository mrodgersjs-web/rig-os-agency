import { NextResponse } from "next/server";
import { FULL_AGENT_REGISTRY, getAgentStats, routeAgent } from "@/lib/agent-registry";
import { GOAL_LOOPS, getGoalStats } from "@/lib/goal-harnesses";
import { RIG_SKILLS, RIG_SKILL_COUNT } from "@/lib/rig-skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agency/agents — full agent registry with goal harnesses and skills
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "all";
  const query = url.searchParams.get("q") || "";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  if (action === "route") {
    const agents = routeAgent(query);
    return NextResponse.json({ query, routed: agents });
  }

  if (action === "goal-loops") {
    return NextResponse.json({ loops: GOAL_LOOPS, stats: getGoalStats() });
  }

  if (action === "skills") {
    return NextResponse.json({ 
      skills: RIG_SKILLS.slice(0, limit), 
      total: RIG_SKILL_COUNT,
      showing: Math.min(limit, RIG_SKILLS.length),
    });
  }

  // Default: return full registry
  const stats = getAgentStats();
  let agents = FULL_AGENT_REGISTRY;
  
  if (query) {
    const q = query.toLowerCase();
    agents = agents.filter(a => 
      a.name.toLowerCase().includes(q) || 
      a.role.toLowerCase().includes(q) ||
      a.capabilities.some(c => c.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    agents: agents.slice(0, limit),
    total: FULL_AGENT_REGISTRY.length,
    showing: Math.min(limit, agents.length),
    stats,
    goalLoops: getGoalStats(),
    skills: RIG_SKILL_COUNT,
    repos: 120, // RIGIntelligence org repos
  });
}