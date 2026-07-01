"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Network, Activity, Zap, Cpu, ShieldAlert } from "lucide-react";
import { fetchModelRouting, ModelRoute, RoutingTopology } from "@/lib/telemetry";

const GOLD = "#d4a574";
const BLUE = "#60a5fa";
const EMERALD = "#5ab896";
const PLUM = "#c4607e";
const MUTE = "#a59783";

export default function ModelRoutingMap() {
  const [topology, setTopology] = useState<RoutingTopology | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchModelRouting();
      setTopology(data);
    } catch (e) {
      console.error("Routing map load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) return <div className="h-full grid place-items-center text-muted">Loading topology...</div>;
  if (!topology) return <div className="h-full grid place-items-center text-muted">No routing data available.</div>;

  const routes = topology.routes;
  const centerX = 400;
  const centerY = 200;
  const radius = 140;

  return (
    <div className="relative w-full h-full bg-[#0a070d] rounded-xl border border-white/10 overflow-hidden" 
         style={{ background: "radial-gradient(circle at center, rgba(96,165,250,0.05) 0%, #0a070 la-deterministic-first-agentic 100%)" }}>
      
      {/* Topology Header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="p-2 rounded-md" style={{ background: `${BLUE}20`, color: BLUE, border: `1px solid ${BLUE}40` }}>
          <Activity size={16} />
        </div >
        <div >
          <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Model Routing Topology</div >
          <div className="text-[12px] text-white/70 mono">Throughput: {topology.throughput} req/s</div >
        </div >
      </div >

      <svg viewBox={`0 0 800 400`} className="w-full h-full">
        {/* Gateway Core */}
        <circle cx={centerX} cy={centerY} r={30} fill="none" stroke={GOLD} strokeWidth={2} />
        <circle cx={centerX} cy={centerY} r={24} fill={`${GOLD}10`} stroke={GOLD} strokeWidth={1} />
        <text x={centerX} y={centerY + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill={GOLD}>GATEWAY</text >

        {/* Routes */}
        {routes.map((route, i) => {
          const angle = (i / routes.length) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          const color = route.status === "active" ? EMERALD : route.status === "degraded" ? GOLD : PLUM;
          const isActive = topology.activePath.includes(route.id);

          return (
            <g key={route.id}>
              {/* Connection Line */}
              <motion.line 
                x1={centerX} y1={centerY} x2={x} y2={y} 
                stroke={color} 
                strokeWidth={isActive ? 2 : 1} 
                strokeOpacity={isActive ? 0.6 : 0.2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
              
              {/* Route Node */}
              <motion.g 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: i * 0.1 }}
              >
                <circle cx={x} cy={y} r={18} fill="#1a1625" stroke={color} strokeWidth={2} />
                {isActive && (
                  <circle cx={x} cy={y} r={22} fill="none" stroke={color} strokeWidth={1}>
                    <animate attributeName="r" values="22;28;22" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text x={x} y={y + 30} textAnchor="middle" fontSize="9" fill="#fff" className="mono">
                  {route.model}
                </text>
                <text x={x} y={y + 38} textAnchor="middle" fontSize="7" fill={MUTE} className="mono">
                  {route.latency}ms | {Math.round(route.load * 100)}%
                </text>
              </motion.g>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 flex gap-4 text-[10px] mono text-white/50 bg-black/40 p-2 rounded-md border border-white/5">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: EMERALD }} /> Active</div >
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: GOLD }} /> Degraded</div >
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: PLUM }} /> Offline</div >
      </div >
    </div >
  );
}
