import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Smart Run Routes — Pulse NYC";

export default function OG() {
  return new ImageResponse(
    SectionOG({
      icon: "🏃‍♂️",
      title: "Smart Run Routes",
      subtitle: "AI-optimized running routes scored 0-100 using real-time data",
      accentColor: "#4A7C59",
      chips: [
        { label: "Route Generator", color: "#4A7C59" },
        { label: "AQI-Aware", color: "#3B7CB8" },
        { label: "14 Curated Routes", color: "#8b5cf6" },
        { label: "4 Data Sources", color: "#C4704A" },
      ],
    }),
    { ...size },
  );
}
