import type { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { WellnessDirectory } from "@/components/WellnessDirectory";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wellness Directory — Cold Plunge, Sauna, Yoga, Pools & More in NYC",
  description:
    "Find wellness services across NYC: cold plunge, infrared sauna, yoga, public pools, massage, acupuncture, and free fitness classes. Curated, ad-free guide with pricing.",
};

export default function WellnessPage() {
  return (
    <SectionShell
      icon="🧘"
      title="Wellness Directory"
      description="Curated guide to NYC wellness — cold plunge, sauna, yoga, pools, and free fitness. No ads, no affiliate links."
      accentColor="rgba(167,139,250,.12)"
    >
      {/* KPI cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard
          index={0}
          label="Wellness Spots"
          value="60+"
          sub="Curated across 9 categories"
          color="purple"
        />
        <KPICard
          index={1}
          label="Free Options"
          value="15+"
          sub="Public pools, Shape Up NYC, parks"
          color="green"
        />
        <KPICard
          index={2}
          label="Public Pools"
          value="53"
          sub="NYC Parks indoor/outdoor · $0"
          color="blue"
          tooltip="NYC Parks operates 53 outdoor pools (open summer) and 12 indoor pools (year-round). Membership is free with NYC Parks recreation center membership ($25/yr adults, free for seniors and youth)."
        />
        <KPICard
          index={3}
          label="Free Fitness Classes"
          value="100+"
          sub="Shape Up NYC · weekly across 5 boroughs"
          color="orange"
          tooltip="NYC Parks Shape Up NYC offers free outdoor fitness classes: yoga, boot camp, Zumba, Pilates, cycling, and more. No registration required."
        />
      </div>

      {/* Wellness directory — client component with category tabs */}
      <WellnessDirectory />

      {/* Connect to health data */}
      <div className="bg-hp-purple/5 border border-hp-purple/20 rounded-xl p-4 mt-6">
        <h3 className="text-[13px] font-bold text-text mb-2">Your Neighborhood&apos;s Mental Health</h3>
        <p className="text-[11px] text-dim mb-2">
          Depression and mental health distress rates vary widely across NYC neighborhoods. Wellness services can complement clinical care.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/chronic-disease"
            className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-hp-purple/10 text-hp-purple border border-hp-purple/20 hover:bg-hp-purple/20 transition-all"
          >
            View Mental Health Data
          </Link>
          <Link
            href="/find-care"
            className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-hp-blue/10 text-hp-blue border border-hp-blue/20 hover:bg-hp-blue/20 transition-all"
          >
            Find Licensed Providers
          </Link>
          <Link
            href="/neighborhood"
            className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-hp-green/10 text-hp-green border border-hp-green/20 hover:bg-hp-green/20 transition-all"
          >
            Check Your Neighborhood
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-hp-yellow/5 border border-hp-yellow/20 rounded-xl p-4 mt-4">
        <p className="text-[10px] text-dim leading-relaxed">
          <strong className="text-text">Disclaimer:</strong> This is an informational directory, not medical advice.
          Wellness services complement but do not replace clinical care. Consult your healthcare provider before
          starting new wellness practices, especially if you have pre-existing conditions. Prices are approximate and may change.
          Listings are curated editorially — PulseNYC has no commercial relationships with any listed businesses.
        </p>
      </div>

      <div className="flex items-center gap-1.5 mt-4">
        <span className="w-1.5 h-1.5 rounded-full bg-hp-purple animate-heartbeat" />
        <p className="text-[10px] text-hp-purple font-semibold">
          Curated quarterly · Pool data: NYC Parks · Free fitness: Shape Up NYC · No ads, no affiliate links
        </p>
      </div>
    </SectionShell>
  );
}
