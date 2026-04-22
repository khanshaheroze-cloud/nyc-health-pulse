import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { Nav } from "@/components/Nav";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { NycSkyline } from "@/components/NycSkyline";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingTrigger } from "@/components/OnboardingTrigger";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: ["400"],
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
    "theme-color": "#FAFAF7",
  },
  openGraph: {
    title: "Pulse NYC",
    description:
      "Free NYC health dashboard. Check air quality, flu & COVID activity, restaurant safety, and 40+ health metrics for your neighborhood. Updated daily from official city data.",
    url: "https://pulsenyc.app",
    siteName: "Pulse NYC",
    locale: "en_US",
    type: "website",
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
    <html lang="en" className={`${plusJakarta.variable} ${dmSerifDisplay.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        {/* Prevent flash of wrong theme — runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("pulse-theme");if(!t){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");document.documentElement.classList.add("dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#0F1410")}}catch(e){}})()`,
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
      <body>
        <ThemeProvider>
        <AuthProvider>
        <ServiceWorkerRegistration />
        <OnboardingTrigger />

        {/* ── Sticky Header ─────────────────────────────── */}
        <header
          className="sticky top-0 z-[100] border-b border-border-light"
          style={{
            overflow: "visible",
            background: "rgba(250,250,247,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
            paddingRight: "max(1.25rem, env(safe-area-inset-right))",
            paddingTop: "env(safe-area-inset-top, 0px)",
          }}
        >
          <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2" style={{ overflow: "visible" }}>
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              {/* Logo mark */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--color-hp-green) 0%, var(--color-hp-green-light) 100%)" }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M9 15.3C8.4 14.7 2 10.2 2 6.5 2 4.2 3.8 2.5 5.8 2.5c1.2 0 2.3.6 3.2 1.7.9-1.1 2-1.7 3.2-1.7 2 0 3.8 1.7 3.8 4 0 3.7-6.4 8.2-7 8.8z" fill="white" opacity="0.95"/>
                </svg>
              </div>
              {/* Logo text */}
              <div className="hidden sm:flex items-baseline gap-0.5" style={{ letterSpacing: "-0.5px" }}>
                <span className="text-[18px] font-extrabold text-text">Pulse</span>
                <span className="text-[18px] font-extrabold text-hp-green">NYC</span>
              </div>
            </a>

            {/* LIVE badge — hidden on smaller screens to save space */}
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[2px] uppercase text-hp-green bg-accent-bg border border-hp-green/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
              Live
            </span>

            {/* Navigation — single instance, handles both desktop + mobile */}
            <div className="flex-1 min-w-0" style={{ overflow: "visible" }}>
              <Nav />
            </div>

            {/* User menu + Theme toggle */}
            <UserMenu />
            <ThemeToggle />
          </div>
        </header>

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 pb-4 pt-4 sm:pt-5" style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}>
          {/* Page content */}
          <main>{children}</main>
        </div>

        {/* NYC Skyline + Footer */}
        <div className="relative w-full mt-8 overflow-hidden">
          {/* Skyline ribbon */}
          <div className="relative" style={{ height: "140px" }}>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-20 pointer-events-none z-10"
              style={{ background: "linear-gradient(to bottom, var(--color-bg, #FAFAF7) 0%, transparent 100%)" }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(74,124,89,0.06) 0%, rgba(59,124,184,0.03) 40%, transparent 70%)" }}
            />
            <NycSkyline className="absolute inset-x-0 bottom-0 w-full text-border" />
          </div>

          {/* Structured footer */}
          <footer className="bg-surface-warm border-t border-border" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
            <div className="max-w-[1200px] mx-auto py-12 px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                {/* Brand */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--color-hp-green) 0%, var(--color-hp-green-light) 100%)" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M9 15.3C8.4 14.7 2 10.2 2 6.5 2 4.2 3.8 2.5 5.8 2.5c1.2 0 2.3.6 3.2 1.7.9-1.1 2-1.7 3.2-1.7 2 0 3.8 1.7 3.8 4 0 3.7-6.4 8.2-7 8.8z" fill="white" opacity="0.95"/>
                      </svg>
                    </div>
                    <div className="flex items-baseline gap-0.5" style={{ letterSpacing: "-0.5px" }}>
                      <span className="text-[19px] font-extrabold text-text">Pulse</span>
                      <span className="text-[19px] font-extrabold text-hp-green">NYC</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-dim leading-relaxed">Public health intelligence for NYC</p>
                  <p className="text-[12px] text-muted leading-relaxed mt-1">Data from NYC DOHMH, CDC, EPA &amp; more</p>
                </div>

                {/* Explore */}
                <div>
                  <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-3">Explore</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { href: "/", label: "Overview" },
                      { href: "/air-quality", label: "Air Quality" },
                      { href: "/food-safety", label: "Food Safety" },
                      { href: "/neighborhood", label: "Neighborhoods" },
                      { href: "/find-care", label: "Find Care" },
                      { href: "/building-health", label: "Building Safety" },
                      { href: "/nutrition-tracker", label: "Nutrition Tracker" },
                      { href: "/run-routes", label: "Run Routes" },
                    ].map((link) => (
                      <a key={link.href} href={link.href} className="text-[12px] text-dim hover:text-hp-green transition-colors">{link.label}</a>
                    ))}
                  </div>
                </div>

                {/* Health Data */}
                <div>
                  <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-3">Health Data</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { href: "/covid", label: "COVID-19" },
                      { href: "/flu", label: "Flu Tracker" },
                      { href: "/chronic-disease", label: "Chronic Disease" },
                      { href: "/maternal-health", label: "Maternal Health" },
                      { href: "/overdose", label: "Overdose" },
                      { href: "/demographics", label: "Demographics" },
                    ].map((link) => (
                      <a key={link.href} href={link.href} className="text-[12px] text-dim hover:text-hp-green transition-colors">{link.label}</a>
                    ))}
                  </div>
                </div>

                {/* About */}
                <div>
                  <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-3">About</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { href: "/sources", label: "Data Sources" },
                      { href: "/resources", label: "Resources" },
                      { href: "/privacy", label: "Privacy" },
                      { href: "/changelog", label: "Changelog" },
                    ].map((link) => (
                      <a key={link.href} href={link.href} className="text-[12px] text-dim hover:text-hp-green transition-colors">{link.label}</a>
                    ))}
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[12px] text-dim hover:text-hp-green transition-colors">GitHub ↗</a>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-border pt-4 flex justify-between items-center">
                <p className="text-[11px] text-muted">© 2026 Pulse NYC</p>
                <p className="text-[11px] text-muted">Open data, open health</p>
              </div>
            </div>
          </footer>
        </div>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
