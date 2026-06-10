import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["mapbox-gl", "react-map-gl"],
  // Static generation hits ~25 live NYC Open Data APIs; throttled environments
  // (CI runners, cold Vercel builds) regularly blow the 60s default and fail
  // the whole build. Fallback data exists for every fetch, so give slow
  // upstreams room instead of failing the build.
  staticPageGenerationTimeout: 180,
  async redirects() {
    return [
      { source: "/neighborhoods", destination: "/neighborhood", permanent: true },
      { source: "/building-safety", destination: "/building-health", permanent: true },
      { source: "/street-safety", destination: "/safety", permanent: true },
      { source: "/fitness", destination: "/workouts", permanent: true },
      { source: "/active", destination: "/run-routes", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
