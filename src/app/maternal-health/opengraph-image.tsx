import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Maternal Health — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "🤰",
      title: "Maternal Health",
      subtitle: "Pregnancy-related mortality, C-section rates, and birth outcome disparities",
      accentColor: "#f472b6",
      chips: [
        { label: "Racial Disparities", color: "#7c5cbf" },
        { label: "C-Section Rates", color: "#d44" },
        { label: "Infant Mortality", color: "#d48520" },
      ],
    }),
    { ...size }
  );
}
