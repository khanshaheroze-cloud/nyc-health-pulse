import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Running & Walking Routes — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🏃"
      title="Run & Walk NYC"
      subtitle="Best running and walking routes by borough"
      accentColor="#4A7C59"
      chips={[{ label: "Routes", color: "#4A7C59" }, { label: "By Borough", color: "#3B7CB8" }, { label: "Air Quality", color: "#C4704A" }]}
    />,
    { ...size }
  );
}
