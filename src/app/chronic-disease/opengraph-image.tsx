import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Chronic Disease — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "💊",
      title: "Chronic Disease",
      subtitle: "Obesity, diabetes, asthma, and hypertension across NYC boroughs",
      accentColor: "#f07070",
      chips: [
        { label: "CDC PLACES Data", color: "#d44" },
        { label: "Borough Comparison", color: "#2850AD" },
        { label: "8 Health Measures", color: "#1a9a6e" },
      ],
    }),
    { ...size }
  );
}
