import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Eat Smart NYC — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🥗"
      title="Eat Smart NYC"
      subtitle="Low-calorie menu picks at 30+ NYC chains"
      accentColor="#C4704A"
      chips={[{ label: "30+ Chains", color: "#C4704A" }, { label: "USDA Data", color: "#4A7C59" }, { label: "500K+ Foods", color: "#3B7CB8" }]}
    />,
    { ...size }
  );
}
