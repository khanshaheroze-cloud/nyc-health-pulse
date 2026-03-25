import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Building Health — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🏢"
      title="Building Health"
      subtitle="HPD violations, complaints, and building safety"
      accentColor="#C4704A"
      chips={[{ label: "HPD Data", color: "#C4704A" }, { label: "Violations", color: "#C45A4A" }, { label: "Complaints", color: "#3B7CB8" }]}
    />,
    { ...size }
  );
}
