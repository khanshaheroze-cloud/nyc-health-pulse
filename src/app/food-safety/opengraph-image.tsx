import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Food Safety — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🍽️"
      title="NYC Food Safety"
      subtitle="Restaurant inspection grades and violation tracking"
      accentColor="#8b5cf6"
      chips={[{ label: "Grades A-C", color: "#8b5cf6" }, { label: "By Cuisine", color: "#4A7C59" }, { label: "LIVE", color: "#C45A4A" }]}
    />,
    { ...size }
  );
}
