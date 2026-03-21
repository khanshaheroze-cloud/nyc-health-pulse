import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { NycSkyline } from "@/components/NycSkyline";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  metadataBase: new URL("https://pulsenyc.app"),
  title: {
    default: "Pulse NYC — NYC Health Dashboard | Air Quality, COVID, Food Safety & More",
    template: "%s | Pulse NYC",
  },
  description:
    "Free NYC health dashboard. Check air quality, flu & COVID activity, restaurant safety, and 40+ health metrics for your neighborhood. Updated daily from official city data.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pulse NYC",
  },
  other: {
    "theme-color": "#f8fafb",
  },
  openGraph: {
    title: "Pulse NYC",
    description:
      "Free NYC health dashboard. Check air quality, flu & COVID activity, restaurant safety, and 40+ health metrics for your neighborhood. Updated daily from official city data.",
    url: "https://pulsenyc.app",
    siteName: "Pulse NYC",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse NYC",
    description:
      "Free NYC health dashboard. Check air quality, flu & COVID activity, restaurant safety, and 40+ health metrics for your neighborhood. Updated daily from official city data.",
  },
  alternates: {
    canonical: "https://pulsenyc.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        {/* Prevent flash of wrong theme — runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("pulse-theme");if(!t){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#0f1613")}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Pulse NYC",
              url: "https://pulsenyc.app",
              description: "Free NYC health dashboard with 25+ live APIs. Air quality, COVID, flu, restaurant safety, and 40+ metrics for your neighborhood.",
              publisher: {
                "@type": "Organization",
                name: "Pulse NYC",
                url: "https://pulsenyc.app",
              },
              about: {
                "@type": "Thing",
                name: "Public Health in New York City",
                description: "Air quality, disease surveillance, food safety, maternal health, and neighborhood-level health data for NYC",
              },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://pulsenyc.app/neighborhood/{search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${fraunces.variable}`}>
        <ThemeProvider>
        <ServiceWorkerRegistration />
        <div className="relative z-10 max-w-[1400px] mx-auto px-5 pb-4" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))", paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))" }}>
          {/* Header */}
          <div className="mb-7 relative">
            {/* Subtle green bloom behind the title */}
            <div
              aria-hidden="true"
              className="absolute -top-4 -left-4 w-72 h-24 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 70%)" }}
            />
            <div className="flex items-center gap-2 mb-1 relative">
              <h1
                className="font-display font-black text-3xl"
                style={{
                  background: "linear-gradient(135deg, var(--color-text, #1e2d2a) 20%, var(--color-hp-green, #10b981))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "clamp(22px, 4vw, 36px)",
                }}
              >
                Pulse NYC
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] uppercase text-hp-green bg-hp-green/10 border border-hp-green/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
                Live Data
              </span>
              {/* Theme toggle */}
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>
            <p className="text-dim text-[13px]">
              Public health intelligence across all five boroughs · 25+ live APIs
              from NYC DOHMH, CDC, Census &amp; more
            </p>
          </div>

          {/* Navigation */}
          <Nav />

          {/* Page content */}
          <main>{children}</main>
        </div>

        {/* NYC Skyline footer ribbon */}
        <div className="relative w-full mt-2 overflow-hidden" style={{ height: "180px" }}>
          {/* Fade gradient so skyline blends into background */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-24 pointer-events-none z-10"
            style={{ background: "linear-gradient(to bottom, var(--color-bg, #f8fafb) 0%, transparent 100%)" }}
          />
          {/* Faint sage glow behind the skyline */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(16,185,129,0.07) 0%, rgba(14,165,233,0.04) 40%, transparent 70%)" }}
          />
          <NycSkyline className="absolute inset-x-0 bottom-0 w-full text-border" />
          {/* Slightly darker layer for depth */}
          <NycSkyline className="absolute inset-x-0 bottom-0 w-full opacity-50 text-muted" style={{ transform: "scaleX(1.02) translateX(-1%)" }} />
          {/* Footer text */}
          <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <p className="text-[10px] text-muted tracking-[1px]">
            Pulse NYC · pulsenyc.app · Data updated continuously
            {" · "}
            <a href="/resources" className="hover:text-dim transition-colors pointer-events-auto">Resources</a>
            {" · "}
            <a href="/sources" className="hover:text-dim transition-colors pointer-events-auto">Sources</a>
            {" · "}
            <a href="/changelog" className="hover:text-dim transition-colors pointer-events-auto">Changelog</a>
            {" · "}
            <a href="/nutrition" className="hover:text-dim transition-colors pointer-events-auto">Nutrition</a>
            {" · "}
            <a href="/privacy" className="hover:text-dim transition-colors pointer-events-auto">Privacy</a>
          </p>
          </div>
        </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
