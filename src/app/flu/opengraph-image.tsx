import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Flu Tracker — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🤒"
      title="NYC Flu Tracker"
      subtitle="Weekly flu-like illness surveillance from 53 hospitals"
      accentColor="#C4704A"
      chips={[{ label: "ILI Rates", color: "#C4704A" }, { label: "Weekly", color: "#4A7C59" }, { label: "53 Hospitals", color: "#3B7CB8" }]}
    />,
    { ...size }
  );
}
