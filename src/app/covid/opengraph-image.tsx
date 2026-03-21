import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "COVID-19 — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "🦠",
      title: "COVID-19",
      subtitle: "Cases, hospitalizations, and wastewater surveillance across NYC",
      accentColor: "#5b9cf5",
      chips: [
        { label: "Live Hospital Data", color: "#2850AD" },
        { label: "By Borough", color: "#1a9a6e" },
        { label: "Wastewater Signal", color: "#7c5cbf" },
      ],
    }),
    { ...size }
  );
}
