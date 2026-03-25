import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Environment Data — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🌿"
      title="NYC Environment"
      subtitle="Water quality, rodents, noise, and more"
      accentColor="#4A7C59"
      chips={[{ label: "Water Quality", color: "#3B7CB8" }, { label: "311 Data", color: "#C4704A" }, { label: "LIVE", color: "#C45A4A" }]}
    />,
    { ...size }
  );
}
