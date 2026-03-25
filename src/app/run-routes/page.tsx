import type { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";
import { SmartRouteRecommender } from "@/components/SmartRouteRecommender";
import { RunningClubs } from "@/components/RunningClubs";
import { SmartRunRoutesWrapper } from "@/components/SmartRunRoutesWrapper";

export const metadata: Metadata = {
  title: "Smart Run Routes — AI-Optimized NYC Running Routes",
  description:
    "Generate optimized running routes anywhere in NYC using real-time air quality, street safety, scenery, and terrain data. 20+ curated routes including NYRR race courses, refuel suggestions, amenities, and 10 running clubs.",
};

export default function RunRoutesPage() {
  return (
    <SectionShell
      icon="🏃‍♂️"
      title="Smart Run Routes"
      description="Real-time route scoring for NYC runners — every route scored 0-100 based on air quality, street safety, scenery, and terrain"
      accentColor="rgba(45,212,160,.12)"
    >
      {/* Smart Route Generator — map-first layout */}
      <SmartRunRoutesWrapper />

      {/* Data Factors — how scoring works */}
      <div className="flex items-center gap-3 mt-8 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">How We Score Routes</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🌬️</span>
            <h3 className="text-[13px] font-bold text-text">Air Quality (0-25)</h3>
          </div>
          <p className="text-[11px] text-dim leading-relaxed">
            Real-time AQI from EPA AirNow, adjusted per route. Park routes score higher due to tree canopy filtering; routes near highways are penalized.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🛡️</span>
            <h3 className="text-[13px] font-bold text-text">Street Safety (0-25)</h3>
          </div>
          <p className="text-[11px] text-dim leading-relaxed">
            NYPD Motor Vehicle Collision data from NYC Open Data. Counts crashes within proximity of the route over the past 2 years. Fewer crashes = higher score.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏞️</span>
            <h3 className="text-[13px] font-bold text-text">Scenery (0-25)</h3>
          </div>
          <p className="text-[11px] text-dim leading-relaxed">
            Water proximity (0-10), green space (0-10), and landmarks (0-5). Routes along rivers, through parks, and past scenic landmarks score highest. Uses 7 NYC Open Data sources.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⛰️</span>
            <h3 className="text-[13px] font-bold text-text">Terrain (0-25)</h3>
          </div>
          <p className="text-[11px] text-dim leading-relaxed">
            USGS National Map elevation data. Beginners get higher scores for flat routes; advanced runners score higher with elevation gain for hill training.
          </p>
        </div>
      </div>

      {/* Curated Route Library */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Curated Route Library</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <SmartRouteRecommender />

      {/* Running Clubs */}
      <div className="flex items-center gap-3 mt-8 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Running Clubs</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <RunningClubs />

      {/* Tips */}
      <div className="bg-hp-green/5 border border-hp-green/20 rounded-2xl p-5 mt-6">
        <h3 className="text-[13px] font-bold text-text mb-2">NYC Running Tips</h3>
        <ul className="space-y-1.5 text-[11px] text-dim">
          <li>• <strong>Check AQI before you go</strong> — if AQI is above 100, consider indoor exercise</li>
          <li>• <strong>Central Park runs counterclockwise</strong> — follow the flow of traffic</li>
          <li>• <strong>Dawn and dusk are prime time</strong> — popular paths are packed midday</li>
          <li>• <strong>Water fountains</strong> are turned off November through March</li>
          <li>• <strong>Shape Up NYC</strong> offers free outdoor fitness classes in parks citywide</li>
        </ul>
      </div>

      <div className="flex items-center gap-1.5 mt-4">
        <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
        <p className="text-[10px] text-hp-green font-semibold">
          Powered by EPA AirNow · NYPD Collisions · NYC Parks · NYC Waterfront · LPC Landmarks · USGS Elevation
        </p>
      </div>
    </SectionShell>
  );
}
