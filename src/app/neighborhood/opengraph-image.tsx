import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Neighborhood Health Profiles — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🏘️"
      title="NYC Neighborhoods"
      subtitle="Health profiles for all 42 districts"
      accentColor="#4A7C59"
      chips={[{ label: "42 Districts", color: "#4A7C59" }, { label: "Health Score", color: "#3B7CB8" }, { label: "Compare", color: "#C4704A" }]}
    />,
    { ...size }
  );
}
