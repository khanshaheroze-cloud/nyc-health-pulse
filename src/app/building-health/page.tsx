import type { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";
import { BuildingHealthSearch } from "@/components/BuildingHealthSearch";

export const metadata: Metadata = {
  title: "Is My Building Safe? — Full Building Dossier",
  description:
    "Look up any NYC building across 5 datasets: HPD violations & complaints, DOB violations, ECB fines, and 311 history. Building health score, open violations, and outstanding penalties.",
};

export default function BuildingHealthPage() {
  return (
    <SectionShell
      icon="🏢"
      title="Is My Building Safe?"
      description="Look up any NYC building to get a complete safety dossier — HPD violations & complaints, DOB construction violations, ECB fines, and 311 history. Data from 5 NYC Open Data sources."
      accentColor="rgba(14,165,233,.12)"
    >
      {/* Info cards — colored left border */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
        <div className="bg-surface border border-border-light rounded-3xl p-5 card-hover animate-fade-in-up" style={{ borderLeft: "3px solid var(--color-hp-green)", animationDelay: "100ms" }}>
          <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted mb-1">
            Violation Classes
          </p>
          <p className="text-[12px] text-dim leading-relaxed">
            <strong className="text-dim">A</strong> = Non-hazardous (peeling paint, minor repairs).{" "}
            <strong className="text-hp-orange">B</strong> = Hazardous (broken window, no hot water).{" "}
            <strong className="text-hp-red">C</strong> = Immediately hazardous (no heat, lead paint, rats, gas leak).
          </p>
        </div>
        <div className="bg-surface border border-border-light rounded-3xl p-5 card-hover animate-fade-in-up" style={{ borderLeft: "3px solid var(--color-hp-blue)", animationDelay: "150ms" }}>
          <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted mb-1">
            File a Complaint
          </p>
          <p className="text-[12px] text-dim leading-relaxed">
            Call <strong className="text-text">311</strong> or visit{" "}
            <a
              href="https://portal.311.nyc.gov/sr-step1/702a6af7-a44e-ef11-a317-0022481a7bab"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hp-blue underline underline-offset-2 hover:text-hp-blue/80"
            >
              NYC 311 Online
            </a>{" "}
            to report building issues. HPD will schedule an inspection.
          </p>
        </div>
        <div className="bg-surface border border-border-light rounded-3xl p-5 card-hover animate-fade-in-up" style={{ borderLeft: "3px solid var(--color-hp-orange)", animationDelay: "200ms" }}>
          <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted mb-1">
            Tenant Rights
          </p>
          <p className="text-[12px] text-dim leading-relaxed">
            NYC tenants have a right to safe, livable conditions. Landlords must fix Class C violations within{" "}
            <strong className="text-text">24 hours</strong>, Class B within{" "}
            <strong className="text-text">30 days</strong>, and Class A within{" "}
            <strong className="text-text">90 days</strong>.
          </p>
        </div>
      </div>

      {/* Search component */}
      <BuildingHealthSearch />

      {/* Disclaimer */}
      <div className="mt-6 bg-surface border border-border-light rounded-3xl p-6">
        <p className="text-[10px] text-muted leading-relaxed">
          <strong className="text-dim">Disclaimer:</strong> Data comes from 5 NYC Open Data sources (HPD, DOB, ECB/OATH, 311)
          and may not reflect the most recent inspections or corrections. Building Health Scores are computed estimates
          based on violation severity, open complaints, and outstanding fines — they are not official ratings.
          Class C violations require correction within 24 hours but the listed status depends on HPD re-inspection.
          This tool is for informational purposes only. For emergencies, call 911.
        </p>
      </div>
    </SectionShell>
  );
}
