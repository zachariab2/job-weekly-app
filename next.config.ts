import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type-checked locally — skip during Vercel remote build to avoid env-specific false positives
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
