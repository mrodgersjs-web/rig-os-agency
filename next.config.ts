import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin tracing root to THIS project so Next/Turbopack stops inferring
  // /Users/rig128gb (parent package-lock.json) as the workspace root.
  // Without this, `next start` can't find .next and the dev server fails
  // to resolve relative CSS @imports (rig-light-theme.css "missing").
  outputFileTracingRoot: projectRoot,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
