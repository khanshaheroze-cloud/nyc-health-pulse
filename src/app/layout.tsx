import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "NYC Health Pulse",
  description:
    "Real-time public health intelligence across all five NYC boroughs — air quality, disease trends, food safety, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable}`}>
        <div className="max-w-[1400px] mx-auto px-5 py-6 pb-16">
          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-1">
              <h1
                className="font-display font-black text-3xl"
                style={{
                  background: "linear-gradient(135deg, #fff 40%, #2dd4a0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "clamp(22px, 4vw, 36px)",
                }}
              >
                NYC Health Pulse
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] uppercase text-hp-green bg-hp-green/10 border border-hp-green/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
                Live Data
              </span>
            </div>
            <p className="text-dim text-[13px]">
              Public health intelligence across all five boroughs · 14,500+
              data points from 16 sources · Updated Feb 2026
            </p>
          </div>

          {/* Navigation */}
          <Nav />

          {/* Page content */}
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
