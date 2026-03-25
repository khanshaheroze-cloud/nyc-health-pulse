import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Street Safety — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🚗"
      title="Street Safety"
      subtitle="Vision Zero crash data and traffic safety"
      accentColor="#C4704A"
      chips={[{ label: "Vision Zero", color: "#C4704A" }, { label: "Crashes", color: "#C45A4A" }, { label: "NYPD Data", color: "#3B7CB8" }]}
    />,
    { ...size }
  );
}
