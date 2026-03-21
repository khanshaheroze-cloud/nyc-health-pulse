"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Simplified but recognizable SVG paths for NYC's 5 boroughs.
 * Coordinates are in a 300×300 viewBox, roughly matching NYC's geography:
 * - Bronx: top-center (north)
 * - Manhattan: narrow island, west-center
 * - Queens: large mass, east
 * - Brooklyn: south-center
 * - Staten Island: isolated, southwest
 */
const BOROUGHS = [
  {
    name: "Manhattan",
    color: "#2850AD",
    // Narrow elongated island running NE-SW, with the distinctive thin shape
    path: "M127,52 L130,47 L133,40 L136,33 L140,26 L143,20 L146,15 L148,12 L145,10 L141,11 L138,14 L135,18 L131,24 L128,30 L125,36 L122,42 L120,48 L119,54 L118,60 L117,66 L118,72 L120,76 L123,72 L125,65 L126,58 Z",
    delay: 0,
  },
  {
    name: "Bronx",
    color: "#EE352E",
    // Wider region north of Manhattan, irregular shape
    path: "M146,15 L150,12 L155,8 L162,5 L170,4 L178,5 L185,8 L190,13 L192,19 L190,26 L186,32 L180,37 L174,40 L168,42 L162,42 L156,40 L150,36 L146,32 L143,27 L141,22 L143,17 Z",
    delay: 300,
  },
  {
    name: "Queens",
    color: "#B933AD",
    // Large area east of Manhattan, roughly triangular
    path: "M156,40 L162,42 L168,42 L174,40 L180,42 L186,46 L192,50 L198,56 L204,62 L208,70 L210,78 L208,86 L204,92 L198,96 L190,98 L182,98 L174,96 L168,92 L162,88 L156,82 L150,76 L146,70 L142,64 L140,58 L138,52 L140,46 L146,42 Z",
    delay: 600,
  },
  {
    name: "Brooklyn",
    color: "#FF6319",
    // South of Queens, wide irregular shape extending south
    path: "M118,72 L120,76 L124,80 L130,84 L136,86 L142,88 L150,92 L156,96 L162,98 L168,100 L174,100 L168,106 L162,112 L156,116 L148,120 L140,122 L132,122 L124,120 L118,116 L112,110 L108,104 L106,96 L108,88 L112,82 L116,76 Z",
    delay: 900,
  },
  {
    name: "Staten Island",
    color: "#6CBE45",
    // Isolated island to the southwest, roughly oval
    path: "M78,100 L84,96 L90,94 L96,95 L100,98 L102,104 L100,110 L96,116 L90,120 L84,122 L78,120 L74,116 L72,110 L74,104 Z",
    delay: 1200,
  },
];

const BOROUGH_STATS: Record<string, string[]> = {
  Manhattan: ["Pop: 1.6M", "Best air quality", "10 UHF zones"],
  Brooklyn: ["Pop: 2.7M", "Most populous", "11 UHF zones"],
  Queens: ["Pop: 2.3M", "150+ languages", "7 UHF zones"],
  Bronx: ["Pop: 1.4M", "Highest asthma rate", "6 UHF zones"],
  "Staten Island": ["Pop: 475K", "Most suburban", "4 UHF zones"],
};

export function BoroughHeroMap() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => { setLoaded(true); }, []);

  return (
    <div className="relative w-full max-w-[300px] mx-auto" style={{ aspectRatio: "1.2/1" }}>
      <style>{`
        @keyframes boroughBreathe {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.08); }
        }
      `}</style>

      <svg viewBox="65 0 155 130" className="w-full h-full" role="img" aria-label="Map of NYC boroughs">
        {BOROUGHS.map((borough) => (
          <g key={borough.name}>
            <path
              d={borough.path}
              fill={borough.color}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="0.6"
              strokeLinejoin="round"
              style={{
                opacity: loaded ? (hovered === borough.name ? 1 : 0.75) : 0,
                transition: `opacity 0.4s ease ${borough.delay}ms, filter 0.2s ease`,
                filter: hovered === borough.name
                  ? "brightness(1.25) drop-shadow(0 0 6px rgba(255,255,255,0.25))"
                  : "none",
                cursor: "pointer",
                animation: loaded ? "boroughBreathe 4s ease-in-out infinite" : "none",
                animationDelay: `${borough.delay + 1500}ms`,
              }}
              onMouseEnter={() => setHovered(borough.name)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push("/neighborhood")}
            />
          </g>
        ))}

        {/* Water gap between Staten Island and Brooklyn */}
        {loaded && (
          <text x="100" y="90" fontSize="3" fill="rgba(255,255,255,0.15)" textAnchor="middle">
            ～～～
          </text>
        )}
      </svg>

      {hovered && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-[#1a2e28]/95 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none z-10 whitespace-nowrap backdrop-blur-sm border border-white/10">
          <div className="text-[12px] mb-0.5">{hovered}</div>
          {BOROUGH_STATS[hovered]?.map((stat) => (
            <div key={stat} className="font-normal text-white/60 text-[9px]">{stat}</div>
          ))}
        </div>
      )}
    </div>
  );
}
