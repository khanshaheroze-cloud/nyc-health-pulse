import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Food Safety — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "🍽️",
      title: "Food Safety",
      subtitle: "Restaurant inspection grades, violations, and trends across NYC",
      accentColor: "#a78bfa",
      chips: [
        { label: "Live Inspections", color: "#7c5cbf" },
        { label: "By Cuisine", color: "#d48520" },
        { label: "Grade Distribution", color: "#1a9a6e" },
      ],
    }),
    { ...size }
  );
}
