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
      {/* Emergency care banner */}
      <div className="bg-surface-peach border border-hp-red/15 rounded-3xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-hp-red/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[18px]">🚨</span>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-text mb-1">Need Help Right Now?</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[22px] font-display font-bold text-hp-red">911</span>
                <span className="text-[11px] text-dim">Emergency</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[22px] font-display font-bold text-hp-blue">988</span>
                <span className="text-[11px] text-dim">Mental Health Crisis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-display font-bold text-hp-green">65173</span>
                <span className="text-[11px] text-dim">Text &ldquo;WELL&rdquo; for NYC Well</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick help cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-surface border border-border-light rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-hp-green/10 flex items-center justify-center">
              <span className="text-[14px]">💚</span>
            </div>
            <p className="text-[12px] font-bold text-text">No Insurance? No Problem.</p>
          </div>
          <p className="text-[12px] text-dim leading-relaxed">
            NYC Health + Hospitals serves <strong className="text-text">all New Yorkers</strong> regardless of insurance or ability to pay. Filter by &ldquo;Facilities&rdquo; to find them.
          </p>
        </div>
        <div className="bg-surface border border-border-light rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-hp-blue/10 flex items-center justify-center">
              <span className="text-[14px]">📋</span>
            </div>
            <p className="text-[12px] font-bold text-text">What&apos;s Included</p>
          </div>
          <p className="text-[12px] text-dim leading-relaxed">
            PCPs, dentists, psychiatrists, therapists, OB-GYNs, pediatricians, eye doctors, physical therapists, specialists, hospitals, and clinics.
          </p>
        </div>
      </div>

      <FindCareResults />

      {/* Disclaimer */}
      <div className="mt-6 bg-surface border border-border-light rounded-3xl p-6">
        <p className="text-[10px] text-muted leading-relaxed">
          <strong className="text-dim">Disclaimer:</strong> Provider data comes from the NPPES NPI Registry (CMS), Medicare Doctors & Clinicians database, and NYS Health Facility Registry. Listings reflect registered providers and may not indicate current availability, accepting new patients, or specific insurance plans. Always call ahead to confirm. This tool is for informational purposes only.
        </p>
      </div>
    </SectionShell>
  );
}
