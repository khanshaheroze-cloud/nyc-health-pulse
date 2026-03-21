import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Nutrition — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "🥗",
      title: "Nutrition",
      subtitle: "Vitamin D deficiency, food access, and youth health behaviors in NYC",
      accentColor: "#f5c542",
      chips: [
        { label: "Vitamin D Data", color: "#d48520" },
        { label: "Youth Health", color: "#7c5cbf" },
        { label: "NHANES + YRBS", color: "#1a9a6e" },
      ],
    }),
    { ...size }
  );
}
