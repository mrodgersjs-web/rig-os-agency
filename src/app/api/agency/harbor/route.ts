import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommandResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  code: number;
};

type ContainerStatus = {
  name: string;
  service: string;
  state: "running" | "completed" | "stopped" | "unknown";
  health: "healthy" | "starting" | "unhealthy" | "none";
  status: string;
  ports: string;
};

type EndpointStatus = {
  id: string;
  label: string;
  role: string;
  url: string;
  status: "online" | "degraded" | "offline";
  httpStatus: number | null;
  note: string;
};

const HOME = process.env.HOME || "/Users/rig128gb";
const HARBOR_BIN = join(HOME, ".local", "bin", "harbor");
const HARBOR_HOME = join(HOME, ".harbor");
const HARBOR_SOURCE = join(HOME, "Developer", "harbor");
const CAN_RUN_HARBOR = existsSync(HARBOR_BIN);
const PROBE_HOST = process.env.HARBOR_PROBE_HOST || (CAN_RUN_HARBOR ? "127.0.0.1" : "host.docker.internal");
const PUBLIC_HOST = process.env.HARBOR_PUBLIC_HOST || "127.0.0.1";

const SAFE_ENV = {
  ...process.env,
  PATH: `${join(HOME, ".local", "bin")}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ""}`,
};

function redact(value: string): string {
  return value
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "[redacted-key]")
    .replace(/(password|token|secret|api[_-]?key)=([^,\s]+)/gi, "$1=[redacted]");
}

function runFile(command: string, args: string[], timeout = 5_000): CommandResult {
  try {
    const stdout = execFileSync(command, args, {
      encoding: "utf8",
      env: SAFE_ENV,
      stdio: ["ignore", "pipe", "pipe"],
      timeout,
    }).trim();
    return { ok: true, stdout: redact(stdout), stderr: "", code: 0 };
  } catch (error) {
    const err = error as { status?: number; stderr?: Buffer | string; stdout?: Buffer | string; message?: string };
    const stdout = typeof err.stdout === "string" ? err.stdout : err.stdout?.toString("utf8") || "";
    const stderr = typeof err.stderr === "string" ? err.stderr : err.stderr?.toString("utf8") || err.message || "";
    return {
      ok: false,
      stdout: redact(stdout.trim()),
      stderr: redact(stderr.trim()).slice(0, 500),
      code: err.status ?? 1,
    };
  }
}

function runHarbor(args: string[], timeout = 5_000): CommandResult {
  if (!existsSync(HARBOR_BIN)) {
    return { ok: false, stdout: "", stderr: "Harbor CLI not installed", code: 127 };
  }
  return runFile(HARBOR_BIN, args, timeout);
}

function harborConfig(key: string, fallback: string): string {
  const result = runHarbor(["config", "get", key], 3_000);
  const value = result.stdout.trim();
  return result.ok && /^\d+$/.test(value) ? value : fallback;
}

function gitValue(path: string, args: string[], fallback = "unknown"): string {
  if (!existsSync(path)) return "missing";
  const result = runFile("git", ["-C", path, ...args], 4_000);
  return result.ok && result.stdout ? result.stdout : fallback;
}

function parseContainers(output: string): ContainerStatus[] {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", status = "", ports = ""] = line.split("\t");
      const service = name.replace(/^harbor\./, "");
      const state = status.includes("Up")
        ? "running"
        : status.includes("Exited (0)")
          ? "completed"
          : status.includes("Exited") || status.includes("Created")
            ? "stopped"
            : "unknown";
      const health = status.includes("healthy")
        ? "healthy"
        : status.includes("health: starting")
          ? "starting"
          : status.includes("unhealthy")
            ? "unhealthy"
            : "none";
      return { name, service, state, health, status, ports };
    });
}

async function probe(url: string): Promise<{ ok: boolean; status: number | null; note: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3_500);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    return {
      ok: response.status >= 200 && response.status < 500,
      status: response.status,
      note: response.status >= 300 && response.status < 400 ? "redirect" : "http",
    };
  } catch (error) {
    const err = error as { name?: string };
    return { ok: false, status: null, note: err.name === "AbortError" ? "timeout" : "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

function containerFor(containers: ContainerStatus[], id: string): ContainerStatus | undefined {
  return containers.find((container) => container.service === id);
}

export async function GET() {
  const cliVersion = runHarbor(["--version"]);
  const doctor = runHarbor(["doctor", "--check"], 10_000);
  const defaults = runHarbor(["defaults"]);

  const dockerRows = runFile("docker", ["ps", "-a", "--format", "{{.Names}}\t{{.Status}}\t{{.Ports}}"], 5_000);
  const containers = parseContainers(dockerRows.stdout)
    .filter((container) => container.name.startsWith("harbor."))
    .sort((a, b) => a.service.localeCompare(b.service));

  const ports = {
    webui: harborConfig("webui.host_port", "33801"),
    ollama: harborConfig("ollama.host_port", "33821"),
    llamacpp: harborConfig("llamacpp.host_port", "33831"),
    searxng: harborConfig("searxng.host_port", "33811"),
    metamcp: harborConfig("metamcp.host_port", "34421"),
    metamcpSse: harborConfig("metamcp.sse.host_port", "34423"),
    mcpo: harborConfig("mcpo.host_port", "34431"),
  };

  const endpointSpecs = [
    { id: "webui", label: "Open WebUI", role: "chat workspace", path: "/" },
    { id: "ollama", label: "Ollama API", role: "model runtime", path: "/api/tags" },
    { id: "llamacpp", label: "llama.cpp", role: "local server", path: "/health" },
    { id: "searxng", label: "SearXNG", role: "search backend", path: "/search?q=rig&format=json" },
    { id: "metamcp", label: "MetaMCP", role: "MCP control app", path: "/" },
    { id: "mcpo", label: "MCPO", role: "OpenAPI bridge", path: "/docs" },
  ];

  const portById: Record<string, string> = {
    webui: ports.webui,
    ollama: ports.ollama,
    llamacpp: ports.llamacpp,
    searxng: ports.searxng,
    metamcp: ports.metamcp,
    mcpo: ports.mcpo,
  };

  const hasContainerSignal = dockerRows.ok && containers.length > 0;

  const probed = await Promise.all(
    endpointSpecs.map(async (endpoint): Promise<EndpointStatus> => {
      const port = portById[endpoint.id];
      const displayUrl = `http://${PUBLIC_HOST}:${port}${endpoint.path}`;
      const probeUrl = `http://${PROBE_HOST}:${port}${endpoint.path}`;
      const result = await probe(probeUrl);
      const container = containerFor(containers, endpoint.id);
      const running = hasContainerSignal ? container?.state === "running" : true;
      return {
        id: endpoint.id,
        label: endpoint.label,
        role: endpoint.role,
        url: displayUrl,
        status: result.ok && running ? "online" : running ? "degraded" : "offline",
        httpStatus: result.status,
        note: hasContainerSignal ? result.note : `${result.note}; endpoint-only probe`,
      };
    }),
  );

  const sseContainer = containerFor(containers, "metamcp-sse");
  const mcpoOnline = probed.some((endpoint) => endpoint.id === "mcpo" && endpoint.status === "online");
  const sseEndpoint: EndpointStatus = {
    id: "metamcp-sse",
    label: "MetaMCP SSE",
    role: "MCP SSE transport",
    url: `http://${PUBLIC_HOST}:${ports.metamcpSse}/sse`,
    status: hasContainerSignal
      ? sseContainer?.health === "healthy"
        ? "online"
        : sseContainer?.state === "running"
          ? "degraded"
          : "offline"
      : mcpoOnline
        ? "online"
        : "degraded",
    httpStatus: null,
    note: hasContainerSignal ? "MCP client transport" : "inferred from MCPO endpoint",
  };

  const endpoints = [...probed, sseEndpoint];
  const onlineEndpoints = endpoints.filter((endpoint) => endpoint.status === "online").length;
  const offlineEndpoints = endpoints.filter((endpoint) => endpoint.status === "offline").length;
  const runningServices = hasContainerSignal
    ? containers.filter((container) => container.state === "running").length
    : endpoints.filter((endpoint) => endpoint.status === "online").length;
  const unhealthyServices = containers.filter((container) => container.health === "unhealthy").length;

  const overall = !doctor.ok && CAN_RUN_HARBOR
    ? "degraded"
    : unhealthyServices > 0
      ? "degraded"
      : offlineEndpoints > 0
        ? "partial"
        : "ready";

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    overall,
    exposure: "local-only",
    cli: {
      installed: cliVersion.ok,
      version: cliVersion.stdout || "missing",
      path: HARBOR_BIN,
      doctorOk: doctor.ok,
      doctorSummary: doctor.ok
        ? "essential checks passed"
        : CAN_RUN_HARBOR
          ? doctor.stderr || doctor.stdout || "doctor failed"
          : "host CLI not visible from this runtime",
    },
    install: {
      path: HARBOR_HOME,
      exists: existsSync(HARBOR_HOME),
      commit: gitValue(HARBOR_HOME, ["rev-parse", "--short", "HEAD"]),
      branch: gitValue(HARBOR_HOME, ["branch", "--show-current"]),
    },
    source: {
      path: HARBOR_SOURCE,
      exists: existsSync(HARBOR_SOURCE),
      commit: gitValue(HARBOR_SOURCE, ["rev-parse", "--short", "HEAD"]),
      clean: gitValue(HARBOR_SOURCE, ["status", "--short"], "") === "",
    },
    profile: {
      defaults: defaults.ok ? defaults.stdout.split(/\s+/).filter(Boolean) : [],
      requested: ["searxng", "metamcp", "mcpo"],
    },
    counts: {
      runningServices,
      totalServices: hasContainerSignal ? containers.length : endpoints.length,
      onlineEndpoints,
      totalEndpoints: endpoints.length,
    },
    endpoints,
    containers,
    notes: [
      "SearXNG uses a local minimal settings.yml because Harbor v0.5.2's bundled engine list is incompatible with the current searxng image.",
      "MetaMCP SSE was bootstrapped with a local RIG Node API key stored only in the MetaMCP Postgres container.",
      CAN_RUN_HARBOR ? "Host Harbor CLI is visible to this API runtime." : "Host Harbor CLI is not visible to this API runtime; endpoint probes use host.docker.internal.",
      "No tunnels are enabled by this tab.",
    ],
  });
}
