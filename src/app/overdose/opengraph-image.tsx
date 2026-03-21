import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Overdose — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "💉",
      title: "Overdose Crisis",
      subtitle: "Drug overdose deaths, fentanyl trends, and naloxone distribution in NYC",
      accentColor: "#f5c542",
      chips: [
        { label: "Death Trends", color: "#d44" },
        { label: "By Substance", color: "#7c5cbf" },
        { label: "Harm Reduction", color: "#1a9a6e" },
      ],
    }),
    { ...size }
  );
}
