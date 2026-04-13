import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Should I Run Outside? — Pulse NYC";

export default function OG() {
  return new ImageResponse(
    SectionOG({
      icon: "🏃",
      title: "Should I Run Outside?",
      subtitle: "Real-time Run Score for NYC — air quality, weather, UV, and safety",
      accentColor: "#4A7C59",
      chips: [
        { label: "Live Run Score", color: "#4A7C59" },
        { label: "AQI + Weather", color: "#3B7CB8" },
        { label: "Smart Advice", color: "#8b5cf6" },
        { label: "Top Routes", color: "#C4704A" },
      ],
    }),
    { ...size },
  );
}
