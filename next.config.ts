import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["mapbox-gl", "react-map-gl"],
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
