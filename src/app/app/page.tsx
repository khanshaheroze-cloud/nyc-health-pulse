import type { Metadata } from "next";
import { AppWaitlistCapture } from "@/components/AppWaitlistCapture";

export const metadata: Metadata = {
  title: "NYC Pulse Smart Eats — Coming Q3 2026",
  description: "Sign up for the NYC Pulse Smart Eats app waitlist. Healthy food near you, right now.",
  alternates: { canonical: "/app" },
  openGraph: {
    title: "NYC Pulse Smart Eats — Coming Q3 2026",
    description: "Sign up for the NYC Pulse Smart Eats app waitlist. Healthy food near you, right now.",
    url: "/app",
  },
  twitter: {
    card: "summary_large_image",
    title: "NYC Pulse Smart Eats — Coming Q3 2026",
    description: "Sign up for the NYC Pulse Smart Eats app waitlist. Healthy food near you, right now.",
  },
};

export default function AppPage() {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <h1 className="font-display text-[clamp(28px,5vw,40px)] text-text leading-tight mb-6">
        NYC Pulse Smart Eats — coming Q3 2026
      </h1>
      <p className="text-dim text-[15px] mb-10 max-w-md mx-auto">
        The fastest way to find healthy food near you in NYC. Sign up to get early access.
      </p>
      <div className="mb-12">
        <AppWaitlistCapture />
      </div>
      <ul className="text-left max-w-sm mx-auto space-y-4 text-[15px] text-text">
        <li className="flex gap-3 items-start">
          <span className="text-hp-green font-bold text-lg leading-none mt-0.5">✓</span>
          <span>5 healthy spots near you in under 30 seconds</span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="text-hp-green font-bold text-lg leading-none mt-0.5">✓</span>
          <span>Subway-stop aware — find food at every stop on your commute</span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="text-hp-green font-bold text-lg leading-none mt-0.5">✓</span>
          <span>Post-workout mode — protein, recovery, refuel window</span>
        </li>
      </ul>
    </div>
  );
}
