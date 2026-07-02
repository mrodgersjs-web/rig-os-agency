import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function run(cmd: string): string {
  try {
    return execSync(cmd, { timeout: 8000, encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

interface LaunchdService {
  name: string;
  pid: string;
  exitCode: string;
  status: "running" | "loaded" | "failed" | "unknown";
  label: string;
}

function parseService(line: string): LaunchdService | null {
  const parts = line.split("\t");
  if (parts.length < 3) return null;
  const pid = parts[0];
  const exitCode = parts[1];
  const fullName = parts[2];

  let status: LaunchdService["status"];
  if (pid && pid !== "-") status = "running";
  else if (exitCode && exitCode !== "0" && exitCode !== "-") status = "failed";
  else status = "loaded";

  return {
    name: fullName.replace(/^com\.rig\./, "").replace(/^ai\.rig\./, "").replace(/^application\./, ""),
    pid,
    exitCode,
    status,
    label: fullName,
  };
}

export async function GET() {
  const list = run("launchctl list 2>/dev/null");
  const lines = list.split("\n").filter((l) => l.trim() && !l.includes("PID"));

  // Parse all rig-related services
  const allRigServices: LaunchdService[] = [];
  for (const line of lines) {
    if (/rig/i.test(line) || /voice/i.test(line) || /jarvis/i.test(line)) {
      const svc = parseService(line);
      if (svc) allRigServices.push(svc);
    }
  }

  // Key voice/Jarvis services
  const keyVoiceServices = [
    "com.rig.voice-command-router",
    "com.rig.jarvis",
    "com.apple.voicebankingd",
    "sh.voicebox.app",
    "com.apple.voicememod",
    "com.apple.VoiceOver",
  ];

  const keyServices = keyVoiceServices.map((label) => {
    const svc = allRigServices.find((s) => s.label === label);
    if (svc) return svc;
    return {
      name: label.replace(/^com\.(rig|apple)\./, "").replace(/^sh\./, "").replace(/\.app$/, ""),
      pid: "-",
      exitCode: "0",
      status: "unknown" as const,
      label,
    };
  });

  // Voicebox app specifically
  const voiceboxLine = lines.find((l) => l.includes("voicebox"));
  const voiceboxParsed = voiceboxLine ? parseService(voiceboxLine) : null;

  // Jarvis service
  const jarvisPid = keyServices.find((s) => s.label === "com.rig.jarvis")?.pid || "-";
  const jarvisRunning = jarvisPid !== "-";

  // Voice command router
  const vcrPid = keyServices.find((s) => s.label === "com.rig.voice-command-router")?.pid || "-";
  const vcrRunning = vcrPid !== "-";

  // Count running rig services
  const runningCount = allRigServices.filter((s) => s.status === "running").length;
  const failedCount = allRigServices.filter((s) => s.status === "failed").length;

  // Voice-related Apple services
  const voicebankingd = keyServices.find((s) => s.label === "com.apple.voicebankingd");
  const voiceOver = keyServices.find((s) => s.label === "com.apple.VoiceOver");
  const voicememod = keyServices.find((s) => s.label === "com.apple.voicememod");

  return NextResponse.json({
    _real: true,
    _source: "launchctl list — live macOS service registry",
    summary: {
      totalRigServices: allRigServices.length,
      running: runningCount,
      loaded: allRigServices.length - runningCount - failedCount,
      failed: failedCount,
      jarvisRunning,
      voiceCommandRouterRunning: vcrRunning,
      voiceboxRunning: !!voiceboxParsed && voiceboxParsed.status === "running",
    },
    jarvis: {
      service: "com.rig.jarvis",
      pid: jarvisPid,
      running: jarvisRunning,
      status: jarvisRunning ? "RUNNING (PID " + jarvisPid + ")" : "loaded (not currently executing)",
    },
    voicebox: voiceboxParsed
      ? {
          service: voiceboxParsed.label,
          pid: voiceboxParsed.pid,
          status: voiceboxParsed.status,
          label: voiceboxParsed.name,
        }
      : {
          service: "sh.voicebox.app",
          pid: "-",
          status: "not_found",
          label: "Not registered with launchctl",
        },
    voiceCommandRouter: {
      service: "com.rig.voice-command-router",
      pid: vcrPid,
      running: vcrRunning,
      status: vcrRunning
        ? "RUNNING (PID " + vcrPid + ")"
        : "loaded (not currently executing)",
    },
    appleVoiceServices: {
      voicebankingd: voicebankingd
        ? {
            pid: voicebankingd.pid,
            running: voicebankingd.status === "running",
          }
        : { pid: "-", running: false },
      voiceOver: voiceOver
        ? {
            pid: voiceOver.pid,
            running: voiceOver.status === "running",
          }
        : { pid: "-", running: false },
      voicememod: voicememod
        ? {
            pid: voicememod.pid,
            running: voicememod.status === "running",
          }
        : { pid: "-", running: false },
    },
    allServices: allRigServices.map((s) => ({
      name: s.name,
      pid: s.pid,
      status: s.status,
      exitCode: s.exitCode,
    })),
    generated_at: new Date().toISOString(),
  });
}