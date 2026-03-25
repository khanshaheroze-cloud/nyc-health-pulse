import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "NYC Grocery Prices — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🛒"
      title="Grocery & Food"
      subtitle="Prices, stores, and healthy eating on a budget"
      accentColor="#4A7C59"
      chips={[{ label: "BLS Prices", color: "#4A7C59" }, { label: "SNAP Stores", color: "#3B7CB8" }, { label: "Monthly", color: "#C4704A" }]}
    />,
    { ...size }
  );
}
