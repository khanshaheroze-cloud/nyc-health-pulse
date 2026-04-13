import type { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";
import { RunOutsideContent } from "@/components/RunOutsideContent";

export const metadata: Metadata = {
  title: "Should I Run Outside? — Real-Time NYC Running Conditions",
  description:
    "Live Run Score for NYC based on air quality, temperature, wind, UV index, and precipitation. Know before you go.",
};

export default function RunOutsidePage() {
  return (
    <SectionShell
      icon="🏃"
      title="Should I Run Outside?"
      description="Real-time conditions scored 0-100 — air quality, weather, UV, and more"
      accentColor="rgba(74,124,89,.12)"
      breadcrumb={[{ label: "Run Outside", href: "/run-outside" }]}
    >
      <RunOutsideContent />
    </SectionShell>
  );
}
