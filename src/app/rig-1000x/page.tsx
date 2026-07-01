import React from 'react';

export default function Rig1000xCarPage() {
  return (
    <div className="flex flex-col h-full w-full bg-[#050506] text-white p-8 font-sans">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-[#FFCD03] tracking-tight font-serif">
            RIG 1000x CAR
          </h1>
          <p className="text-gray-400 mt-2">Strategic Intelligence Convergence Engine</p>
        </div>
        <div className="flex gap-4">
          <div className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-gray-300">
            L1-D1-A1-S
          </div>
          <div className="px-3 py-1 rounded bg-green-900/20 border border-green-500/50 text-xs text-green-400">
            PHASE 0: ACTIVE
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Substrate Status */}
        <div className="col-span-2 grid grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-[#1a1a1b] border border-zinc-800 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">Knowledge Lattice</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Backend</span>
                <span className="text-gray-300">Supabase + AGE Graph</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Vector Space</span>
                <span className="text-gray-300">pgvector (1536d)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-green-500 font-mono">INITIALIZING...</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1b] border border-zinc-800 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">Control Plane</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Dashboard</span>
                <span className="text-gray-300">Agent OS :3737</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Coordination</span>
                <span className="text-gray-300">BMS A1-A4 Routing</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-green-500 font-mono">CONNECTED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decision Matrix */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-[#FFCD03]/30 shadow-2xl">
          <h2 className="text-lg font-semibold text-[#FFCD03] mb-4">Phase 0 Decisions</h2>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center gap-3 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Repo: rig-1000x-car</span>
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Graph: Supabase + AGE</span>
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Cockpit: Agent OS Extend</span>
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>First Slice: GTM Engine</span>
            </li>
            <li className="flex items-center gap-3 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Sandbox: Docker Isolated</span>
            </li>
          </ul>
          <div className="mt-8 p-3 rounded bg-zinc-800 text-center text-xs text-gray-400 italic">
 la-deterministic-first-agentic
          </div>
        </div>
      </div>

      <div className="mt-12 p-6 rounded-xl bg-[#1a1a1b] border border-zinc-800">
        <h2 className="text-xl font-bold text-gray-200 mb-4">Operational Log</h2>
        <div className="font-mono text-sm text-gray-400 space-y-1">
          <div>[T-00:00] System online. Phase 0 substrate initiated.</div>
          <div>[T-00:01] Root repository created at ~/rig-1000x-car.</div>
          <div>[T-00:02] Schema definitions pushed to docs/SCHEMA.md.</div>
          <div>[T-00:03] Agent OS route /rig-1000x registered.</div>
          <div className="text-[#FFCD03]">[T-00:04] Waiting for GTM Slice implementation...</div>
        </div>
      </div>
    </div>
  );
}
