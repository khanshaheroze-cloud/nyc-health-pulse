import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Chronic Disease Data — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🫀"
      title="Chronic Disease"
      subtitle="Obesity, diabetes, asthma, and depression rates"
      accentColor="#C45A4A"
      chips={[{ label: "CDC PLACES", color: "#C45A4A" }, { label: "Census Tracts", color: "#3B7CB8" }, { label: "By Borough", color: "#4A7C59" }]}
    />,
    { ...size }
  );
}
