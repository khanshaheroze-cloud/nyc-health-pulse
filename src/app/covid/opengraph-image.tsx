import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC COVID-19 Tracker — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🦠"
      title="NYC COVID-19"
      subtitle="Hospitalizations, cases, and wastewater surveillance"
      accentColor="#C45A4A"
      chips={[{ label: "Hospitalizations", color: "#C45A4A" }, { label: "By Borough", color: "#4A7C59" }, { label: "Wastewater", color: "#3B7CB8" }]}
    />,
    { ...size }
  );
}
