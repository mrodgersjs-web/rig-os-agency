import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { RIG_CORE_AGENTS, getFleetStats } from "@/lib/rig-fleet";
import type { AgentEntry } from "@/lib/rig-fleet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InventoryAgent {
  id?: string;
  name?: string;
  role?: string;
  description?: string;
  capabilities?: string[];
  category?: string;
  status?: string;
}

async function loadInventoryFile(
  filePath: string
): Promise<InventoryAgent[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    // Inventory files may have agents array or be an object with agents key
    if (Array.isArray(data)) return data;
    if (data.agents && Array.isArray(data.agents)) return data.agents;
    if (data.items && Array.isArray(data.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}

function mapInventoryToAgents(
  inventory: InventoryAgent[],
  category: AgentEntry["category"],
  invocationPath: string
): AgentEntry[] {
  return inventory.map((item, i) => ({
    id: item.id || `${category}-${i}`,
    name: item.name || item.role || `Unnamed ${category} agent`,
    category,
    role: item.role || item.description || "",
    capabilities: item.capabilities || [],
    invocationPath,
    status: (item.status as AgentEntry["status"]) || "unloaded",
  }));
}

// GET /api/agency/fleet — load full fleet from JSON inventory files
export async function GET() {
  const baseStats = getFleetStats();
  const allAgents: AgentEntry[] = [...RIG_CORE_AGENTS];

  // Load Agency Agents inventory
  const agencyPath = path.join(
    process.env.HOME || "/Users/rig128gb",
    ".hermes",
    "skills",
    "agency-agents",
    "agency_agents_inventory.json"
  );
  const agencyInventory = await loadInventoryFile(agencyPath);
  const agencyAgents = mapInventoryToAgents(
    agencyInventory,
    "agency",
    "/Users/rig128gb/Developer/agency-agents"
  );
  allAgents.push(...agencyAgents);

  // Load RIG Domain Experts inventory
  const rigPath = path.join(
    process.env.HOME || "/Users/rig128gb",
    ".hermes",
    "agents",
    "jtbd",
    "rig-domain-experts",
    "rig_domain_experts_inventory.json"
  );
  const rigInventory = await loadInventoryFile(rigPath);
  const rigExperts = mapInventoryToAgents(
    rigInventory,
    "rig_expert",
    "~/.cursor/rules/rig-*.mdc"
  );
  allAgents.push(...rigExperts);

  // Load VoltAgent inventory
  const voltPath = path.join(
    process.env.HOME || "/Users/rig128gb",
    ".hermes",
    "skills",
    "awesome-codex-subagents",
    "voltagent_inventory.json"
  );
  const voltInventory = await loadInventoryFile(voltPath);
  const voltAgents = mapInventoryToAgents(
    voltInventory,
    "voltagent",
    "~/.codex/agents/voltagent-*.toml"
  );
  allAgents.push(...voltAgents);

  // Compute stats from actual loaded data
  const stats = {
    total: allAgents.length,
    byCategory: {
      rig_core: allAgents.filter((a) => a.category === "rig_core").length,
      agency: allAgents.filter((a) => a.category === "agency").length,
      rig_expert: allAgents.filter((a) => a.category === "rig_expert").length,
      voltagent: allAgents.filter((a) => a.category === "voltagent").length,
    },
    byStatus: {
      active: allAgents.filter((a) => a.status === "active").length,
      idle: allAgents.filter((a) => a.status === "idle").length,
      errored: allAgents.filter((a) => a.status === "errored").length,
      unloaded: allAgents.filter((a) => a.status === "unloaded").length,
    },
    inventoryCounts: {
      agency: agencyInventory.length,
      rig_expert: rigInventory.length,
      voltagent: voltInventory.length,
    },
  };

  return NextResponse.json({ agents: allAgents, stats });
}