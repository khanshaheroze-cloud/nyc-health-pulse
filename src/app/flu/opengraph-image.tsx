import { ImageResponse } from "next/og";
import { SectionOG } from "@/lib/ogHelpers";

export const runtime = "edge";
export const alt = "Flu & ILI — Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    SectionOG({
      icon: "🤒",
      title: "Flu & ILI",
      subtitle: "Influenza-like illness surveillance from 53 NYC sentinel hospitals",
      accentColor: "#f59e42",
      chips: [
        { label: "ER Visit Rates", color: "#d48520" },
        { label: "By Borough", color: "#2850AD" },
        { label: "Wastewater Signal", color: "#7c5cbf" },
      ],
    }),
    { ...size }
  );
}
