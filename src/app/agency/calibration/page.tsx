// src/app/agency/calibration/page.tsx
// Department Calibration Dashboard — shows substrate, telos, memory, quality gates, proof paths

"use client";

import { useState, useEffect } from "react";

interface DepartmentCalibration {
  department_id: string;
  department_name: string;
  substrate: {
    identity: string;
    role: string;
    boundaries: string[];
    load_order: string[];
  };
  telos: {
    outcome: string;
    success_metrics: string[];
    failure_modes: string[];
  };
  memory: {
    good_examples: any[];
    weak_examples: any[];
    decisions: any[];
    patterns: any[];
    total_count: number;
  };
  quality_gates: {
    name: string;
    description: string;
    weight: number;
    passed: boolean | null;
  }[];
  calibration_score: number | null;
  calibration_history: any[];
  worker_slots: any[];
}

interface RegistrySummary {
  total: number;
  active: number;
  by_department: Record<string, number>;
  by_kind: Record<string, number>;
  avg_calibration: number | null;
}

export default function CalibrationDashboard() {
  const [calibrations, setCalibrations] = useState<DepartmentCalibration[]>([]);
  const [registry, setRegistry] = useState<RegistrySummary | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/departments/calibration").then(r => r.json()),
      fetch("/api/agents/registry").then(r => r.json())
    ]).then(([calibData, regData]) => {
      setCalibrations(calibData.calibrations || []);
      setRegistry(regData.summary || null);
      setLoading(false);
    });
  }, []);

  const selected = calibrations.find(c => c.department_id === selectedDept);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] text-white p-8">
        <div className="animate-pulse text-center py-20">
          <div className="text-2xl font-bold mb-4">Loading Calibration Data...</div>
          <div className="text-gray-400">Reading from PAI database</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Department Calibration System
        </h1>
        <p className="text-gray-400 mt-2">
          Real-time agent status, calibration scores, memory, and quality gates
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 p-6">
        <div className="bg-[#161B3D] rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm">Total Agents</div>
          <div className="text-3xl font-bold text-cyan-400">{registry?.total || 0}</div>
        </div>
        <div className="bg-[#161B3D] rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm">Active Agents</div>
          <div className="text-3xl font-bold text-green-400">{registry?.active || 0}</div>
        </div>
        <div className="bg-[#161B3D] rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm">Departments</div>
          <div className="text-3xl font-bold text-purple-400">{calibrations.length}</div>
        </div>
        <div className="bg-[#161B3D] rounded-lg p-4 border border-gray-800">
          <div className="text-gray-400 text-sm">Avg Calibration</div>
          <div className="text-3xl font-bold text-yellow-400">
            {registry?.avg_calibration ? (registry.avg_calibration * 100).toFixed(1) + "%" : "N/A"}
          </div>
        </div>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-7 gap-4 px-6">
        {calibrations.map((cal) => (
          <button
            key={cal.department_id}
            onClick={() => setSelectedDept(cal.department_id)}
            className={`bg-[#161B3D] rounded-lg p-4 border transition-all text-left ${
              selectedDept === cal.department_id
                ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                : "border-gray-800 hover:border-gray-600"
            }`}
          >
            <div className="font-bold text-sm mb-2">{cal.department_name}</div>
            <div className="text-xs text-gray-400 mb-2">
              {cal.memory.total_count} memory entries
            </div>
            <div className="text-xs text-gray-400 mb-2">
              {cal.worker_slots.length} worker slots
            </div>
            <div className="text-xs text-gray-400">
              {cal.quality_gates.length} quality gates
            </div>
            {cal.calibration_score !== null && (
              <div className={`text-xs font-bold mt-2 ${
                cal.calibration_score >= 0.7 ? "text-green-400" :
                cal.calibration_score >= 0.4 ? "text-yellow-400" : "text-red-400"
              }`}>
                Calibration: {(cal.calibration_score * 100).toFixed(1)}%
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected Department Detail */}
      {selected && (
        <div className="p-6 border-t border-gray-800 mt-6">
          <h2 className="text-2xl font-bold mb-6">{selected.department_name}</h2>
          
          {/* Substrate */}
          <div className="bg-[#161B3D] rounded-lg p-6 border border-gray-800 mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">Substrate</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Identity</div>
                <div className="font-medium">{selected.substrate.identity}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Role</div>
                <div className="font-medium">{selected.substrate.role}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Boundaries</div>
                <ul className="space-y-1">
                  {selected.substrate.boundaries.map((b, i) => (
                    <li key={i} className="text-sm text-gray-300">• {b}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Load Order</div>
                <ul className="space-y-1">
                  {selected.substrate.load_order.map((l, i) => (
                    <li key={i} className="text-sm text-gray-300 font-mono">{l}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Telos */}
          <div className="bg-[#161B3D] rounded-lg p-6 border border-gray-800 mb-6">
            <h3 className="text-lg font-bold text-purple-400 mb-4">Telos</h3>
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-1">Outcome</div>
              <div className="font-medium">{selected.telos.outcome}</div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">Success Metrics</div>
                <ul className="space-y-1">
                  {selected.telos.success_metrics.map((m, i) => (
                    <li key={i} className="text-sm text-green-400">✓ {m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Failure Modes</div>
                <ul className="space-y-1">
                  {selected.telos.failure_modes.map((f, i) => (
                    <li key={i} className="text-sm text-red-400">✗ {f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Quality Gates */}
          <div className="bg-[#161B3D] rounded-lg p-6 border border-gray-800 mb-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">Quality Gates</h3>
            <div className="space-y-3">
              {selected.quality_gates.map((gate, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#0A0E27] rounded">
                  <div>
                    <div className="font-medium">{gate.name}</div>
                    <div className="text-sm text-gray-400">{gate.description}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">Weight: {(gate.weight * 100).toFixed(0)}%</div>
                    <div className={`w-3 h-3 rounded-full ${
                      gate.passed === true ? "bg-green-400" :
                      gate.passed === false ? "bg-red-400" : "bg-gray-500"
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Memory */}
          <div className="bg-[#161B3D] rounded-lg p-6 border border-gray-800 mb-6">
            <h3 className="text-lg font-bold text-green-400 mb-4">Memory</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{selected.memory.good_examples.length}</div>
                <div className="text-xs text-gray-400">Good Examples</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{selected.memory.weak_examples.length}</div>
                <div className="text-xs text-gray-400">Weak Examples</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{selected.memory.patterns.length}</div>
                <div className="text-xs text-gray-400">Patterns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{selected.memory.decisions.length}</div>
                <div className="text-xs text-gray-400">Decisions</div>
              </div>
            </div>
          </div>

          {/* Worker Slots */}
          <div className="bg-[#161B3D] rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-bold text-orange-400 mb-4">Worker Slots</h3>
            <div className="grid grid-cols-3 gap-3">
              {selected.worker_slots.map((slot, i) => (
                <div key={i} className="p-3 bg-[#0A0E27] rounded border border-gray-800">
                  <div className="font-medium text-sm">{slot.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{slot.role}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${
                      slot.status === "active" ? "bg-green-400" :
                      slot.status === "idle" ? "bg-yellow-400" : "bg-gray-500"
                    }`} />
                    <span className="text-xs text-gray-400">{slot.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}