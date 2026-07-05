// src/components/CalibrationNav.tsx
// Navigation component for the Calibration Dashboard

"use client";

import Link from "next/link";

export default function CalibrationNav() {
  return (
    <Link href="/agency/calibration">
      <div className="bg-[#161B3D] rounded-lg p-4 border border-gray-800 hover:border-cyan-500 transition-all cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold">CAL</span>
          </div>
          <div>
            <div className="font-bold text-white">Department Calibration</div>
            <div className="text-sm text-gray-400">Agent status, memory, quality gates</div>
          </div>
        </div>
      </div>
    </Link>
  );
}