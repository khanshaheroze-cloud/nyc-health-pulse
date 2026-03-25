import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Air Quality — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🌬️"
      title="NYC Air Quality"
      subtitle="PM2.5, NO2, and ozone levels across all boroughs"
      accentColor="#3B7CB8"
      chips={[{ label: "PM2.5 Levels", color: "#3B7CB8" }, { label: "By Borough", color: "#4A7C59" }, { label: "LIVE", color: "#C45A4A" }]}
    />,
    { ...size }
  );
}
