import { existsSync, readFileSync } from "node:fs";
import { request } from "node:http";
import os from "node:os";
import path from "node:path";

type EnvMap = Record<string, string | undefined>;

const HOME = os.homedir();
const ENV_FILE = path.join(HOME, ".rig", "modal", "modal1.env");
const MODAL_TOML = path.join(HOME, ".modal.toml");
const DEFAULT_MODEL = "zai-org/GLM-5.2-FP8";

export interface ModalModelPlaneStatus {
  alias: "modal1";
  provider: "modal-rig";
  model: string;
  proxyUrl: string;
  endpointConfigured: boolean;
  endpointHost: string | null;
  envFile: string;
  envFileExists: boolean;
  modalTomlExists: boolean;
  proxyTokenPresent: boolean;
  accountTokenIdPresent: boolean;
  accountTokenSecretPresent: boolean;
  proxyReachable: boolean;
  lanes: ModalLaneStatus[];
  readyLanes: string[];
  configuredCount: number;
  totalLanes: number;
  manualOnly: boolean;
  status: "ready" | "configured" | "pending_endpoint" | "pending_auth";
  blockers: string[];
  commands: {
    claude: string;
    proxyCheck: string;
    deploy: string;
  };
}

export interface ModalLaneStatus {
  id: string;
  kind: string;
  purpose: string;
  upstream_model: string;
  endpoint_env: string;
  model_env: string;
  endpoint_configured: boolean;
  endpoint_host: string;
  manual_only: boolean;
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed[0] === trimmed[trimmed.length - 1] && ["'", '"'].includes(trimmed[0])) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readEnvFile(filePath: string): EnvMap {
  if (!existsSync(filePath)) return {};
  const env: EnvMap = {};
  for (const raw of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    let line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice("export ".length).trim();
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    env[key] = stripQuotes(line.slice(idx + 1));
  }
  return env;
}

function readModalProfile(profile = "rig"): EnvMap {
  if (!existsSync(MODAL_TOML)) return {};
  const sections: Record<string, EnvMap> = {};
  let current = "";
  for (const raw of readFileSync(MODAL_TOML, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("[") && line.endsWith("]")) {
      current = line.slice(1, -1).trim();
      sections[current] = sections[current] ?? {};
      continue;
    }
    const idx = line.indexOf("=");
    if (!current || idx <= 0) continue;
    sections[current][line.slice(0, idx).trim()] = stripQuotes(line.slice(idx + 1));
  }
  return sections[profile] ?? sections.default ?? {};
}

function endpointHost(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).host || null;
  } catch {
    return null;
  }
}

async function probeProxy(proxyUrl: string): Promise<{ reachable: boolean; health?: Record<string, unknown> }> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: { reachable: boolean; health?: Record<string, unknown> }) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const req = request(`${proxyUrl.replace(/\/v1$/, "")}/healthz`, { method: "GET", timeout: 2000 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        let health: Record<string, unknown> | undefined;
        try { health = JSON.parse(body); } catch { /* ignore */ }
        finish({ reachable: Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 500), health });
      });
    });
    req.on("timeout", () => {
      req.destroy();
      finish({ reachable: false });
    });
    req.on("error", () => finish({ reachable: false }));
    req.end();
  });
}

export async function getModalModelPlaneStatus(): Promise<ModalModelPlaneStatus> {
  const envFile = readEnvFile(ENV_FILE);
  const env: EnvMap = { ...envFile, ...process.env };
  const modalProfile = readModalProfile(process.env.MODAL_PROFILE ?? "rig");

  const host = env.RIG_MODAL_PROXY_HOST || "127.0.0.1";
  const port = env.RIG_MODAL_PROXY_PORT || "8766";
  const proxyUrl = `http://${host}:${port}/v1`;
  const model = env.RIG_MODAL_MODEL || DEFAULT_MODEL;
  const endpoint = env.RIG_MODAL_ENDPOINT_URL;
  const endpointConfigured = Boolean(endpoint);
  const proxyProbe = await probeProxy(proxyUrl);
  const proxyReachable = proxyProbe.reachable;
  const lanes = Array.isArray(proxyProbe.health?.lanes) ? proxyProbe.health.lanes as ModalLaneStatus[] : [];
  const readyLanes = Array.isArray(proxyProbe.health?.ready_lanes) ? proxyProbe.health.ready_lanes as string[] : [];
  const configuredCount = typeof proxyProbe.health?.configured_count === "number" ? proxyProbe.health.configured_count : readyLanes.length;
  const totalLanes = typeof proxyProbe.health?.total_lanes === "number" ? proxyProbe.health.total_lanes : lanes.length;

  const proxyTokenPresent = Boolean(
    (env.RIG_MODAL_PROXY_TOKEN_ID && env.RIG_MODAL_PROXY_TOKEN_SECRET)
    || (modalProfile.token_id?.startsWith("wk-") && modalProfile.token_secret?.startsWith("ws-"))
  );
  const accountTokenIdPresent = Boolean(
    env.MODAL_TOKEN_ID?.startsWith("ak-") || modalProfile.token_id?.startsWith("ak-")
  );
  const accountTokenSecretPresent = Boolean(
    env.MODAL_TOKEN_SECRET?.startsWith("as-") || modalProfile.token_secret?.startsWith("as-")
  );

  const blockers: string[] = [];
  if (!endpointConfigured) blockers.push("RIG_MODAL_ENDPOINT_URL is not set");
  if (!accountTokenSecretPresent) blockers.push("Modal account token secret (as-...) is not verified for deploys");

  const status =
    endpointConfigured && proxyReachable ? "ready"
    : endpointConfigured ? "configured"
    : accountTokenIdPresent && !accountTokenSecretPresent ? "pending_auth"
    : "pending_endpoint";

  return {
    alias: "modal1",
    provider: "modal-rig",
    model,
    proxyUrl,
    endpointConfigured,
    endpointHost: endpointHost(endpoint),
    envFile: ENV_FILE,
    envFileExists: existsSync(ENV_FILE),
    modalTomlExists: existsSync(MODAL_TOML),
    proxyTokenPresent,
    accountTokenIdPresent,
    accountTokenSecretPresent,
    proxyReachable,
    lanes,
    readyLanes,
    configuredCount,
    totalLanes,
    manualOnly: true,
    status,
    blockers,
    commands: {
      claude: "claude-model modal1 -p \"reply OK\"",
      proxyCheck: "rig-modal1-proxy --check",
      deploy: "modal deploy /Users/rig128gb/Developer/rig-os-agency/modal/glm_endpoint.py",
    },
  };
}

export async function smokeModal1(prompt = "reply OK", lane = "modal1"): Promise<Record<string, unknown>> {
  const status = await getModalModelPlaneStatus();
  const url = `${status.proxyUrl}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: lane,
      messages: [{ role: "user", content: prompt.slice(0, 1000) }],
      max_tokens: 64,
      temperature: 0,
    }),
  }).catch((error) => error);

  if (response instanceof Error) {
    return { ok: false, status: 0, error: response.message, modelPlane: status };
  }

  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    bodyPreview: text.slice(0, 1000),
    modelPlane: status,
  };
}
