import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Environment — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "🌿",
      title: "Environment",
      subtitle: "Water quality, rodent activity, noise complaints, and heat vulnerability",
      accentColor: "#2dd4a0",
      chips: [
        { label: "Water Safety", color: "#2850AD" },
        { label: "311 Data", color: "#d48520" },
        { label: "Heat Index", color: "#d44" },
      ],
    }),
    { ...size }
  );
}
