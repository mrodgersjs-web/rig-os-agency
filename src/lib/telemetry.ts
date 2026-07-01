// Telemetry service for Agent OS
// Fetches real-time routing and swarm data from the RIG IDE Bridge
import { 
  RufloAgent, 
  RufloSwarm, 
  RufloState 
} from "@/lib/ruflo";

const BASE_URL = "http://localhost:3000";

export interface ModelRoute {
  id: string;
  model: string;
  status: "active" | "degraded" | "offline";
  latency: number;
  load: number; // 0-1
  type: "local" | "cloud";
}

export interface RoutingTopology {
  routes: ModelRoute[];
  activePath: string[];
  throughput: number;
}

export async function fetchSwarmTelemetry(): Promise<RufloState> {
  const response = await fetch(`${BASE_URL}/api/ruflo/swarm`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch swarm telemetry");
  return response.json();
}

export async function fetchModelRouting(): Promise<RoutingTopology> {
  // Note: This is a mock implementation based on the spec since the 
  // actual endpoint might be under a different path or requires specific auth
  try {
    const response = await fetch(`${BASE_URL}/api/routing`, { cache: "no-store" });
    if (!response.ok) throw new Error("Routing API unreachable");
    return response.json();
  } catch (e) {
    console.warn("Routing API mock fallback triggered");
    return {
      routes: [
        { id: "route-1", model: "gpt-4o", status: "active", latency: 120, load: 0.4, type: "cloud" },
        { id: "route-2", model: "claude-3.5-sonnet", status: "active", latency: 150, load: 0.6, type: "cloud" },
        { id: "route-3", model: "llama-3-70b", status: "degraded", latency: 400, load: 0.9, type: "local" },
        { id: "route-4", model: "mixtral-8x7b", status: "offline", latency: 0, load: 0, type: "local" },
      ],
      activePath: ["route-1", "route-2"],
      throughput: 45.2,
    };
  }
}
