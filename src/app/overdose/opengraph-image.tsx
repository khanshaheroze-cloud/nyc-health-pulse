import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Overdose Data — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="⚠️"
      title="Overdose & Lead"
      subtitle="Drug overdose mortality and childhood lead screening"
      accentColor="#C45A4A"
      chips={[{ label: "Fentanyl Crisis", color: "#C45A4A" }, { label: "Lead Levels", color: "#C4704A" }, { label: "By Borough", color: "#4A7C59" }]}
    />,
    { ...size }
  );
}
