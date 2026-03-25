import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Maternal Health — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🤰"
      title="Maternal Health"
      subtitle="Pregnancy mortality, C-sections, and infant health"
      accentColor="#ec4899"
      chips={[{ label: "Mortality", color: "#C45A4A" }, { label: "By Race", color: "#ec4899" }, { label: "Birth Outcomes", color: "#3B7CB8" }]}
    />,
    { ...size }
  );
}
