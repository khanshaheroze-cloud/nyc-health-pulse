import type { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { ActiveRoutesGuide } from "@/components/ActiveRoutesGuide";

export const metadata: Metadata = {
  title: "Running & Walking Routes — NYC's Best Paths by Borough",
  description:
    "Find the best running and walking routes in NYC. Central Park, Prospect Park, Hudson River Greenway, and more — with distance, surface type, and real-time air quality.",
};

export default function ActivePage() {
  return (
    <SectionShell
      icon="🏃"
      title="Active NYC"
      description="Running, walking, and cycling routes across all five boroughs — with live air quality so you know when it's safe to go"
      accentColor="rgba(45,212,160,.12)"
    >
      {/* KPI cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard
          index={0}
          label="Routes Mapped"
          value="14"
          sub="Across all 5 boroughs"
          color="green"
        />
        <KPICard
          index={1}
          label="Total Distance"
          value="65+ mi"
          sub="Of mapped running/walking paths"
          color="blue"
        />
        <KPICard
          index={2}
          label="Car-Free Paths"
          value="8"
          sub="Dedicated greenways & park loops"
          color="purple"
        />
        <KPICard
          index={3}
          label="Trail Running"
          value="4"
          sub="Dirt/gravel off-road routes"
          color="orange"
        />
      </div>

      {/* Routes guide — client component with filters */}
      <ActiveRoutesGuide />

      {/* Tips */}
      <div className="bg-hp-green/5 border border-hp-green/20 rounded-xl p-4 mt-6">
        <h3 className="text-[13px] font-bold text-text mb-2">NYC Running Tips</h3>
        <ul className="space-y-1.5 text-[11px] text-dim">
          <li>• <strong>Check AQI before you go</strong> — our Air Quality page shows real-time PM2.5. If AQI is above 100, consider indoor exercise</li>
          <li>• <strong>Central Park runs counterclockwise</strong> — follow the flow or you&apos;ll be running against traffic (bikes, runners, horses)</li>
          <li>• <strong>Dawn and dusk are prime time</strong> — the High Line, Brooklyn Bridge, and popular paths are packed midday. Early morning is magic</li>
          <li>• <strong>NYC Parks restrooms</strong> close at dusk. Plan water stops — drinking fountains are turned off November through March</li>
          <li>• <strong>Shape Up NYC</strong> offers free outdoor fitness classes in parks across the city — yoga, boot camp, Zumba, and more</li>
          <li>• <strong>Citi Bike</strong> is great for active commuting — check the Environment page for live station data near you</li>
        </ul>
      </div>

      <div className="flex items-center gap-1.5 mt-4">
        <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-heartbeat" />
        <p className="text-[10px] text-hp-green font-semibold">
          Routes curated by local runners · Air quality live from EPA AirNow + NYCCAS
        </p>
      </div>
    </SectionShell>
  );
}
