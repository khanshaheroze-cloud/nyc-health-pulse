import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Wellness Directory — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🧘"
      title="Wellness Directory"
      subtitle="Cold plunge, sauna, yoga, pools, and more"
      accentColor="#3B7CB8"
      chips={[{ label: "Cold Plunge", color: "#3B7CB8" }, { label: "Sauna", color: "#C4704A" }, { label: "Yoga & Pools", color: "#4A7C59" }]}
    />,
    { ...size }
  );
}
