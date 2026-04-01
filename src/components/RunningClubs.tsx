"use client";

import { useState } from "react";

interface RunningClub {
  name: string;
  borough: string;
  neighborhood: string;
  schedule: string;
  distance: string;
  pace: string;
  vibe: string;
  meetup: string;
  instagram?: string;
  website?: string;
  free: boolean;
}

const CLUBS: RunningClub[] = [
  {
    name: "New York Road Runners (NYRR)",
    borough: "Manhattan",
    neighborhood: "Central Park",
    schedule: "Daily — various group runs",
    distance: "3–26.2 mi",
    pace: "All paces",
    vibe: "The OG. Organizes the NYC Marathon + 50+ races/year. Free Open Runs every Saturday.",
    meetup: "NYRR RUNCENTER, 320 W 57th St",
    website: "nyrr.org",
    free: true,
  },
  {
    name: "November Project NYC",
    borough: "Manhattan",
    neighborhood: "Various",
    schedule: "Wed 6:30am (stairs), Fri 6:27am (workout)",
    distance: "Varies",
    pace: "All paces",
    vibe: "High-energy, no-excuses outdoor fitness. Lots of hugs. Free forever.",
    meetup: "Rotating — check Instagram",
    instagram: "novemberprojectnyc",
    free: true,
  },
  {
    name: "Orchard Street Runners",
    borough: "Manhattan",
    neighborhood: "Lower East Side",
    schedule: "Tue & Thu 7pm, Sat 9am",
    distance: "3–6 mi",
    pace: "8:00–10:00/mi",
    vibe: "Cool downtown crowd. Bridge loops and waterfront runs. Social drinks after.",
    meetup: "Orchard & Rivington",
    instagram: "orchardstreetrunners",
    free: true,
  },
  {
    name: "Brooklyn Track Club",
    borough: "Brooklyn",
    neighborhood: "Prospect Park",
    schedule: "Tue 6:30pm (speed), Sat 8am (long run)",
    distance: "4–12 mi",
    pace: "6:30–9:00/mi",
    vibe: "Competitive but welcoming. Structured workouts for folks who want to PR.",
    meetup: "Prospect Park Bandshell",
    instagram: "brooklyntrackclub",
    free: true,
  },
  {
    name: "North Brooklyn Runners",
    borough: "Brooklyn",
    neighborhood: "Williamsburg / Greenpoint",
    schedule: "Wed 7pm, Sat 9am",
    distance: "3–10 mi",
    pace: "All paces",
    vibe: "Community-first. Charity fundraising, marathon training, social runs.",
    meetup: "McCarren Park",
    instagram: "northbrooklynrunners",
    website: "northbrooklynrunners.org",
    free: true,
  },
  {
    name: "Dashing Whippets Running Team",
    borough: "Manhattan",
    neighborhood: "Central Park / Citywide",
    schedule: "Tue, Thu, Sat — multiple groups",
    distance: "4–15 mi",
    pace: "6:00–10:00/mi",
    vibe: "LGBTQ+ inclusive racing team. Serious training with a fun, supportive culture.",
    meetup: "Central Park — 72nd St Bandshell",
    instagram: "dashingwhippets",
    website: "dashingwhippets.org",
    free: false,
  },
  {
    name: "Bronx Runners",
    borough: "Bronx",
    neighborhood: "Van Cortlandt Park",
    schedule: "Sat 8am",
    distance: "3–8 mi",
    pace: "All paces",
    vibe: "Bilingual (EN/ES). Welcoming to first-timers. Trail and road runs.",
    meetup: "Van Cortlandt Park — 242nd St entrance",
    instagram: "bronxrunners",
    free: true,
  },
  {
    name: "Prospect Park Track Club",
    borough: "Brooklyn",
    neighborhood: "Prospect Park",
    schedule: "Tue 6:30pm, Thu 6:30pm, Sat 7:30am",
    distance: "3–15 mi",
    pace: "7:00–10:00/mi",
    vibe: "One of Brooklyn's oldest running clubs. Excellent marathon training program.",
    meetup: "Prospect Park — Bartel-Pritchard entrance",
    instagram: "pptc",
    website: "pptc.org",
    free: false,
  },
  {
    name: "Queens Distance Runners",
    borough: "Queens",
    neighborhood: "Flushing Meadows",
    schedule: "Wed 7pm, Sat 8am",
    distance: "3–10 mi",
    pace: "All paces",
    vibe: "Queens pride. Diverse, multilingual, run through the borough's best parks.",
    meetup: "Flushing Meadows — Unisphere",
    instagram: "queensdistancerunners",
    free: true,
  },
  {
    name: "Black Roses NYC",
    borough: "Manhattan",
    neighborhood: "Citywide",
    schedule: "Tue & Thu 7pm",
    distance: "3–5 mi",
    pace: "All paces",
    vibe: "Streetwear meets run culture. Creative community, post-run hangs.",
    meetup: "Rotating — check Instagram",
    instagram: "blackrosesnyc",
    free: true,
  },
];

type BoroughFilter = "All" | "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";
const BOROUGH_FILTERS: BoroughFilter[] = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

export function RunningClubs() {
  const [borough, setBorough] = useState<BoroughFilter>("All");

  const filtered = borough === "All"
    ? CLUBS
    : CLUBS.filter((c) => c.borough === borough);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🏃‍♂️</span>
        <h2 className="text-[15px] font-bold text-text">NYC Running Clubs</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-hp-purple/10 border border-hp-purple/20 text-hp-purple font-bold">
          {CLUBS.length} clubs
        </span>
      </div>
      <p className="text-[12px] text-muted mb-4">
        Find your crew. All clubs welcome new runners unless noted.
      </p>

      {/* Borough filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {BOROUGH_FILTERS.map((b) => (
          <button
            key={b}
            onClick={() => setBorough(b)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all btn-press ${
              borough === b
                ? "bg-hp-green/10 border-hp-green/30 text-hp-green"
                : "bg-surface-sage border-border text-dim hover:border-hp-green/20"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Club cards */}
      <div className="space-y-3">
        {filtered.map((club) => (
          <div key={club.name} className="border border-border rounded-xl p-4 hover:border-hp-green/30 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="text-[13px] font-bold text-text">{club.name}</h3>
                <p className="text-[11px] text-muted">
                  {club.neighborhood}, {club.borough}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {club.free && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-hp-green/10 text-hp-green font-bold">
                    FREE
                  </span>
                )}
              </div>
            </div>

            <p className="text-[12px] text-dim mb-3 leading-relaxed">{club.vibe}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mb-3">
              <div>
                <span className="text-muted font-semibold block">Schedule</span>
                <span className="text-text">{club.schedule}</span>
              </div>
              <div>
                <span className="text-muted font-semibold block">Distance</span>
                <span className="text-text">{club.distance}</span>
              </div>
              <div>
                <span className="text-muted font-semibold block">Pace</span>
                <span className="text-text">{club.pace}</span>
              </div>
              <div>
                <span className="text-muted font-semibold block">Meetup</span>
                <span className="text-text">{club.meetup}</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {club.instagram && (
                <a
                  href={`https://instagram.com/${club.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-hp-blue font-semibold hover:underline"
                >
                  @{club.instagram}
                </a>
              )}
              {club.website && (
                <a
                  href={`https://${club.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-hp-green font-semibold hover:underline"
                >
                  {club.website}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
