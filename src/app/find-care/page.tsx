import type { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";
import { FindCareResults } from "@/components/FindCareResults";

export const metadata: Metadata = {
  title: "Find Care Near You — Doctors, Dentists, Therapists & Clinics in NYC",
  description:
    "Search thousands of NYC healthcare providers — doctors, dentists, mental health therapists, specialists, clinics, and hospitals. Filter by type, location, and insurance. Free tool powered by federal and state registries.",
};

export default function FindCarePage() {
  return (
    <SectionShell
      icon="🏥"
      title="Find Care Near You"
      description="Search thousands of doctors, dentists, therapists, specialists, and facilities across NYC. Data from NPPES (NPI Registry), CMS, and NYS Health Facility Registry."
      accentColor="rgba(45,212,160,.12)"
    >
      {/* Quick help cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted mb-1">No Insurance?</p>
          <p className="text-[12px] text-dim leading-relaxed">
            NYC Health + Hospitals serves <strong className="text-text">all New Yorkers</strong> regardless of insurance or ability to pay. Filter by &ldquo;Facilities&rdquo; to find them.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted mb-1">Need Help Now?</p>
          <p className="text-[12px] text-dim leading-relaxed">
            Call <strong className="text-text">911</strong> for emergencies · <strong className="text-text">988</strong> for mental health crises · Text &ldquo;WELL&rdquo; to <strong className="text-text">65173</strong> for NYC Well.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted mb-1">What&apos;s Included</p>
          <p className="text-[12px] text-dim leading-relaxed">
            PCPs, dentists, psychiatrists, therapists, OB-GYNs, pediatricians, eye doctors, physical therapists, specialists, hospitals, and clinics.
          </p>
        </div>
      </div>

      <FindCareResults />

      {/* Disclaimer */}
      <div className="mt-6 bg-surface border border-border rounded-xl p-4">
        <p className="text-[10px] text-muted leading-relaxed">
          <strong className="text-dim">Disclaimer:</strong> Provider data comes from the NPPES NPI Registry (CMS), Medicare Doctors & Clinicians database, and NYS Health Facility Registry. Listings reflect registered providers and may not indicate current availability, accepting new patients, or specific insurance plans. Always call ahead to confirm. This tool is for informational purposes only.
        </p>
      </div>
    </SectionShell>
  );
}
