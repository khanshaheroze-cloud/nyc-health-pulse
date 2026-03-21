import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Demographics — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "📊",
      title: "Demographics",
      subtitle: "Population, income, poverty, and insurance coverage by borough",
      accentColor: "#5b9cf5",
      chips: [
        { label: "Census ACS", color: "#2850AD" },
        { label: "Race & Ethnicity", color: "#7c5cbf" },
        { label: "Health Equity", color: "#1a9a6e" },
      ],
    }),
    { ...size }
  );
}
