import { NextResponse } from "next/server";
import { execSync } from "child_process";

// RIG Fleet API — live status of all 9 RIG nodes via Tailscale

interface FleetNode {
  id: string;
  name: string;
  hostname: string;
  tailscaleIP: string;
  role: string;
  ram: string;
  storage: string;
  gpus?: { name: string; vram: string; utilization: string }[];
  status: "online" | "offline";
  sshAccessible: boolean;
  services: string[];
  uptime?: string;
  loadAvg?: string;
  models?: string[];
  cpuCores?: number;
}

function pingHost(ip: string): boolean {
  try {
    execSync(`ping -c 1 -t 2 ${ip}`, { timeout: 5000, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function sshExec(ip: string, cmd: string, timeout = 5): string {
  try {
    return execSync(
      `ssh -o ConnectTimeout=${timeout} -o StrictHostKeyChecking=no -o PasswordAuthentication=no ${ip} "${cmd}" 2>/dev/null`,
      { timeout: (timeout + 2) * 1000, encoding: "utf-8", stdio: "pipe" }
    ).trim();
  } catch {
    return "";
  }
}

async function checkNode(node: Omit<FleetNode, "status" | "sshAccessible">): Promise<FleetNode> {
  const online = pingHost(node.tailscaleIP);
  const sshOk = online ? sshExec(node.tailscaleIP, "hostname", 3) !== "" : false;

  let services: string[] = [];
  let uptime = "";
  let loadAvg = "";
  let models: string[] = [];
  let gpus = node.gpus;
  let ram = node.ram;
  let storage = node.storage;
  let cpuCores = node.cpuCores;

  if (sshOk) {
    // Check services
    const dockerPs = sshExec(node.tailscaleIP, 'docker ps --format "{{.Names}}" 2>/dev/null', 3);
    if (dockerPs) services.push(...dockerPs.split("\n").filter(Boolean).map(s => `docker:${s}`));

    const systemctl = sshExec(node.tailscaleIP, 'systemctl list-units --type=service --state=running 2>/dev/null | grep -oE "[a-z-]+\.(service)" | head -10', 3);
    if (systemctl) {
      const found = systemctl.split("\n").filter(Boolean).map(s => s.replace(".service", ""));
      services.push(...found);
    }

    const launchd = sshExec(node.tailscaleIP, 'launchctl list 2>/dev/null | grep -oE "com\\.[a-z.]+\\.[a-z-]+" | head -10', 3);
    if (launchd) {
      const found = launchd.split("\n").filter(Boolean);
      services.push(...found);
    }

    // Uptime
    uptime = sshExec(node.tailscaleIP, "uptime 2>/dev/null | sed 's/.*up/up/' | sed 's/,.*//'", 3);

    // Load average
    loadAvg = sshExec(node.tailscaleIP, "cat /proc/loadavg 2>/dev/null | cut -d' ' -f1-3 || sysctl -n vm.loadavg 2>/dev/null", 3);

    // RAM (Linux)
    const ramLinux = sshExec(node.tailscaleIP, "free -h 2>/dev/null | awk '/^Mem:/ {print $2\" total, \"$3\" used\"}'", 3);
    if (ramLinux) ram = ramLinux;

    // RAM (macOS)
    const ramMac = sshExec(node.tailscaleIP, "sysctl -n hw.memsize 2>/dev/null | awk '{printf \"%.0f GB\", $1/1073741824}'", 3);
    if (ramMac && !ramLinux) ram = ramMac + " GB";

    // Storage
    const diskLinux = sshExec(node.tailscaleIP, "df -h / 2>/dev/null | awk 'NR==2 {print $2\" total, \"$4\" free\"}'", 3);
    if (diskLinux) storage = diskLinux;

    // CPU cores
    const cpuL = sshExec(node.tailscaleIP, "nproc 2>/dev/null", 3);
    const cpuM = sshExec(node.tailscaleIP, "sysctl -n hw.ncpu 2>/dev/null", 3);
    cpuCores = parseInt(cpuL || cpuM || "0") || cpuCores;

    // Ollama models
    const ollamaModels = sshExec(node.tailscaleIP, "ollama list 2>/dev/null | awk 'NR>1 {print $1}'", 3);
    if (ollamaModels) models = ollamaModels.split("\n").filter(Boolean);

    // GPU live status
    const nvidiaSmi = sshExec(node.tailscaleIP, 'nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader 2>/dev/null', 3);
    if (nvidiaSmi) {
      gpus = nvidiaSmi.split("\n").map(line => {
        const [name, util, memUsed, memTotal, temp] = line.split(",").map(s => s.trim());
        return { name, vram: `${memUsed} / ${memTotal}`, utilization: `${util}% (${temp}°C)` };
      });
    }
  }

  return {
    ...node,
    status: online ? "online" : "offline",
    sshAccessible: sshOk,
    services: [...new Set(services)].slice(0, 20),
    uptime,
    loadAvg,
    models,
    ram,
    storage,
    gpus,
    cpuCores,
  };
}

export async function GET() {
  const nodeDefs: Omit<FleetNode, "status" | "sshAccessible">[] = [
    {
      id: "rig-128gb",
      name: "RIG 128GB MacBook Pro",
      hostname: "RIG128GBs-MacBook-Pro.local",
      tailscaleIP: "100.77.193.77",
      role: "Orchestrator / Hermes Desktop / Daily Driver",
      ram: "128 GB",
      storage: "Local SSD",
      cpuCores: 14,
    },
    {
      id: "rig-256gb",
      name: "RIG 256GB Mac Studio",
      hostname: "rig-256gb-mac-studio",
      tailscaleIP: "100.91.39.12",
      role: "Heavy Training Node",
      ram: "256 GB",
      storage: "Mac Studio SSD",
      cpuCores: 24,
    },
    {
      id: "rig-96gb",
      name: "RIG 96GB Mac Studio",
      hostname: "rig-96gb-mac-studio-2327",
      tailscaleIP: "100.102.142.84",
      role: "Secondary Training Node",
      ram: "96 GB",
      storage: "Mac Studio SSD",
      cpuCores: 24,
    },
    {
      id: "rig-36gb",
      name: "RIG 36GB Mac Studio",
      hostname: "rig-36gb-mac-studio-2754",
      tailscaleIP: "100.89.143.27",
      role: "Code Build Node",
      ram: "36 GB",
      storage: "Mac Studio SSD",
      cpuCores: 12,
    },
    {
      id: "rig-48gb",
      name: "RIG 48GB MacBook Pro",
      hostname: "rig-48gb-mbp",
      tailscaleIP: "100.76.209.22",
      role: "Mobile Field Unit",
      ram: "48 GB",
      storage: "MacBook SSD",
      cpuCores: 12,
    },
    {
      id: "blackwell",
      name: "Blackwell Workstation",
      hostname: "blackwell",
      tailscaleIP: "100.67.126.117",
      role: "GPU Training (3x RTX PRO 6000)",
      ram: "125 GB",
      storage: "3.6TB NVMe",
      cpuCores: 48,
      gpus: [
        { name: "NVIDIA RTX PRO 6000 Blackwell", vram: "97887 MiB", utilization: "0%" },
        { name: "NVIDIA RTX PRO 6000 Blackwell", vram: "97887 MiB", utilization: "0%" },
        { name: "NVIDIA RTX PRO 6000 Blackwell", vram: "97887 MiB", utilization: "0%" },
      ],
    },
    {
      id: "nas",
      name: "QNAP NAS",
      hostname: "nas94f2ae",
      tailscaleIP: "100.64.83.55",
      role: "Network Storage (QTS 5.2.9)",
      ram: "—",
      storage: "NAS RAID",
    },
    {
      id: "ai-linux",
      name: "AI Linux Server",
      hostname: "ai",
      tailscaleIP: "100.127.217.107",
      role: "Linux AI Server",
      ram: "—",
      storage: "Linux Server",
    },
    {
      id: "rigs-mbp",
      name: "RIG's MacBook Pro (legacy)",
      hostname: "rigs-macbook-pro",
      tailscaleIP: "100.100.57.82",
      role: "Legacy Field Unit",
      ram: "—",
      storage: "MacBook SSD",
    },
  ];

  // Check all nodes in parallel
  const nodes = await Promise.all(nodeDefs.map(checkNode));

  const onlineCount = nodes.filter(n => n.status === "online").length;
  const sshCount = nodes.filter(n => n.sshAccessible).length;
  const totalRAM = nodes.reduce((sum, n) => {
    const match = n.ram.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);
  const totalGPUs = nodes.reduce((sum, n) => sum + (n.gpus?.length || 0), 0);

  return NextResponse.json({
    nodes,
    summary: {
      total: nodes.length,
      online: onlineCount,
      offline: nodes.length - onlineCount,
      sshAccessible: sshCount,
      totalRAMGB: totalRAM,
      totalGPUs,
      network: "Tailscale (100.x.x.x)",
      orchestrator: "rig-128gb-mbp",
    },
    timestamp: new Date().toISOString(),
  });
}
