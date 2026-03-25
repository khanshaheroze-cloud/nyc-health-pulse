import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Find Care in NYC — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SectionOG
      icon="🏥"
      title="Find Care"
      subtitle="Doctors, dentists, therapists, and clinics near you"
      accentColor="#4A7C59"
      chips={[{ label: "Providers", color: "#4A7C59" }, { label: "By Specialty", color: "#3B7CB8" }, { label: "Map View", color: "#C4704A" }]}
    />,
    { ...size }
  );
}
