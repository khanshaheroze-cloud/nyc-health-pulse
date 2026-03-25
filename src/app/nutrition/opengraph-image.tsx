import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Nutrition Data — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🥦"
      title="NYC Nutrition"
      subtitle="Vitamin deficiencies, food access, and youth health"
      accentColor="#4A7C59"
      chips={[{ label: "NHANES Data", color: "#4A7C59" }, { label: "Youth Health", color: "#3B7CB8" }, { label: "Food Access", color: "#C4704A" }]}
    />,
    { ...size }
  );
}
