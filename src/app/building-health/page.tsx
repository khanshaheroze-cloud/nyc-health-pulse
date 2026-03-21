import type { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";
import { BuildingHealthSearch } from "@/components/BuildingHealthSearch";

export const metadata: Metadata = {
  title: "Is My Building Safe? — HPD Violations & Complaints",
  description:
    "Look up any NYC residential building to see HPD housing violations, complaints, and safety ratings. Check for hazardous conditions, open violations, and tenant complaint history.",
};

export default function BuildingHealthPage() {
  return (
    <SectionShell
      icon="🏢"
      title="Is My Building Safe?"
      description="Look up any NYC residential building to see HPD housing violations and complaints. Data from the NYC Department of Housing Preservation and Development (HPD)."
      accentColor="rgba(14,165,233,.12)"
    >
      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted mb-1">
            Violation Classes
          </p>
          <p className="text-[12px] text-dim leading-relaxed">
            <strong className="text-dim">A</strong> = Non-hazardous (peeling paint, minor repairs).{" "}
            <strong className="text-hp-orange">B</strong> = Hazardous (broken window, no hot water).{" "}
            <strong className="text-hp-red">C</strong> = Immediately hazardous (no heat, lead paint, rats, gas leak).
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3">
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
        <div className="bg-surface border border-border rounded-xl p-3">
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
      <div className="mt-6 bg-surface border border-border rounded-xl p-4">
        <p className="text-[10px] text-muted leading-relaxed">
          <strong className="text-dim">Disclaimer:</strong> Violation and complaint data comes from the NYC HPD
          Open Data portal and may not reflect the most recent inspections. Some violations may have been
          corrected but not yet updated in the system. Class C violations require immediate correction but the
          listed status depends on HPD re-inspection. This tool is for informational purposes only and should
          not replace a professional building inspection. For emergencies, call 911.
        </p>
      </div>
    </SectionShell>
  );
}
