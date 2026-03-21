import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Air Quality — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "🌬️",
      title: "Air Quality",
      subtitle: "PM2.5, NO2, and ozone trends across NYC neighborhoods",
      accentColor: "#2dd4a0",
      chips: [
        { label: "PM2.5 Tracking", color: "#1a9a6e" },
        { label: "59 Neighborhoods", color: "#2850AD" },
        { label: "NYCCAS Data", color: "#7c5cbf" },
      ],
    }),
    { ...size }
  );
}
