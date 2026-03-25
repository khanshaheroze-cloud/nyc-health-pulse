import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Demographics — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="📊"
      title="NYC Demographics"
      subtitle="Race, income, poverty, and insurance by borough"
      accentColor="#3B7CB8"
      chips={[{ label: "Census ACS", color: "#3B7CB8" }, { label: "LIVE", color: "#C45A4A" }, { label: "By Borough", color: "#4A7C59" }]}
    />,
    { ...size }
  );
}
