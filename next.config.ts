import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent the build output from being placed in a nested `app/` directory
  // which causes recursive module resolution on subsequent builds
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
