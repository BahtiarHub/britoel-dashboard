import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_STANDALONE === "false" ? undefined : "standalone",
  outputFileTracingRoot: __dirname,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
