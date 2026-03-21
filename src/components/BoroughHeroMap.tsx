"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Real NYC borough outlines extracted from borough-boundaries.json GeoJSON.
 * Paths are projected into a ~280×220 SVG viewBox matching actual geography.
 */
const BOROUGHS = [
  {
    name: "Manhattan",
    color: "#2850AD",
    path: "M175.9,29.1 L177.8,29.5 L179,31.4 L179.6,31.2 L180.3,30.9 L183.9,31.9 L183.4,33.8 L181.2,35.9 L179.9,38 L178.4,38.5 L178.9,39 L178,39.7 L176.6,42 L172.3,49.2 L171.7,53.2 L172.1,62 L174.5,67.7 L170.2,74.2 L167.1,77.5 L157.4,91.7 L153.7,96 L152.8,98.1 L151.7,100.5 L152,101.8 L153.2,104.3 L150.5,112.9 L139.2,114.6 L136.5,116.2 L133.1,118.3 L131.3,118.3 L129.8,116.3 L129.4,114.6 L132.2,109 L133.3,101.8 L132.6,98.4 L134.1,95.3 L134.3,92.3 L137,88.5 L138.6,84.1 L140.8,81.4 L144.8,77.6 L152,67.2 L159.3,57.7 L163.4,51.8 L165.6,46.7 L165.6,43.2 L166.3,42.3 L168.7,40.1 L172.9,34 Z",
    delay: 0,
  },
  {
    name: "Bronx",
    color: "#EE352E",
    path: "M202.8,15.6 L213.5,12.7 L240.8,25.6 L246.3,30.8 L242.5,39.6 L238.7,43 L236,37.8 L234.7,37.5 L232.9,36.4 L231,42.2 L232.5,44.5 L233.3,45.1 L232.8,46 L231.6,46 L231.9,47.3 L231.7,50.8 L232.3,52.5 L233.9,54.2 L232.5,55.2 L235.8,55.2 L236.7,57.3 L240.8,60.4 L238,61.5 L239.6,63.3 L241.5,65.2 L234.2,61.8 L231.2,61.3 L228.7,61.8 L223.5,65.2 L219.4,61.4 L219.4,56 L219.3,58.3 L212.5,61.4 L214.5,65.7 L210.1,65.2 L209.4,63.5 L203.5,67.3 L197.3,67.2 L193.6,65.7 L190.3,65.1 L186.7,66.9 L183.8,69.7 L172.9,58.4 L175.8,44.3 L185.9,30 L176.8,28.4 L184,10 Z",
    delay: 200,
  },
  {
    name: "Queens",
    color: "#B933AD",
    path: "M229.3,67.7 L231.3,68.7 L235.2,69.9 L239.8,70.1 L242.6,73.5 L250.9,69.9 L253.6,73.1 L266.7,88.9 L262.3,84.3 L262.4,80.3 L276,136.4 L267.5,150.2 L265.1,146.4 L264.3,151.7 L259.4,153.6 L255,157.9 L253.7,157.3 L247.2,163 L239.3,163 L241.2,160.1 L244.3,151.8 L231.5,138.4 L227.8,143.7 L224.9,143.9 L224.5,139.2 L214,144.1 L210.6,142.4 L208.9,139.4 L210.8,133.7 L177.1,109 L176.6,107.2 L178.8,106.8 L169,101.6 L161.3,98.6 L159.4,96.3 L183.1,73.6 L191.5,76.5 L193.4,80 L209.9,81.3 L210.6,86.8 L218.3,85.4 L214.5,78.7 L210.4,76.1 L211.2,74.8 L212.5,71.4 L220.7,72.9 L225.5,71 L227,69.6 Z",
    delay: 400,
  },
  {
    name: "Brooklyn",
    color: "#FF6319",
    path: "M161.8,98.9 L168.5,101.7 L173,111.1 L177,109.7 L208.5,130.4 L204,146.4 L199.1,148.2 L194.5,144.4 L195.3,146.3 L193.8,156.3 L187.8,157.2 L190.9,160.2 L193.6,164.2 L191.1,166.1 L188.3,166.1 L181.7,162.2 L183.4,167.8 L191.1,167.3 L195.7,166.3 L196.1,180 L189,175.2 L183.2,175.6 L182.7,171.2 L180.8,169.2 L177.5,168.5 L174.2,167.1 L177.6,170.8 L181.1,173.6 L179.9,175.9 L175.4,175 L173.7,171.9 L173.9,174.9 L178.5,176.8 L182,177.7 L179.4,177.8 L170.7,177.6 L173.1,179.3 L153.2,182.9 L137.3,183.1 L141.9,177.6 L129.6,167.8 L126,142.5 L135.9,136.6 L129.7,131.5 L141.3,117 L153.1,115.5 L159.6,99.6 Z",
    delay: 600,
  },
  {
    name: "Staten Island",
    color: "#6CBE45",
    path: "M97.4,144.7 L103.4,147.9 L103.9,158.5 L111.6,166.5 L101.5,179.7 L85.1,192.1 L68,201.8 L71.9,200.8 L70.2,196.7 L69,197.5 L67.8,198.5 L67.3,199.3 L62.7,202.9 L57.1,205.7 L47.1,209.1 L37.5,212.9 L31.1,216.2 L24.7,218.3 L21.3,218.9 L12.4,220.4 L11.1,213.6 L14.4,211.3 L16.4,207.3 L16.7,202.6 L15.3,200.6 L16.5,195.7 L19.6,193.2 L23.2,191.3 L27.7,191.3 L31.9,190.1 L32.6,186.8 L34,183.8 L35.8,177.1 L37,173.6 L39.1,170.8 L37.5,158.7 L37.9,153.2 L40.8,150.7 L46,147.2 L48.4,147.3 L50.4,146.8 L52.3,148.3 L56.2,148.9 L62.6,149.6 L73.3,148.5 L78.3,148.2 L91.9,145.9 Z",
    delay: 800,
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
    <div className="relative w-full max-w-[300px] mx-auto" style={{ aspectRatio: "1.3/1" }}>
      <svg viewBox="0 0 290 230" className="w-full h-full" role="img" aria-label="Map of NYC boroughs">
        {BOROUGHS.map((borough) => (
          <g key={borough.name}>
            <path
              d={borough.path}
              fill={borough.color}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1"
              strokeLinejoin="round"
              style={{
                opacity: loaded ? (hovered === borough.name ? 1 : 0.78) : 0,
                transform: loaded ? "scale(1)" : "scale(0.92)",
                transformOrigin: "center",
                transition: `opacity 0.5s ease ${borough.delay}ms, transform 0.5s ease ${borough.delay}ms, filter 0.2s ease`,
                filter: hovered === borough.name
                  ? "brightness(1.2) drop-shadow(0 2px 8px rgba(0,0,0,0.2))"
                  : "none",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(borough.name)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push("/neighborhood")}
            />
          </g>
        ))}
      </svg>

      {hovered && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-white/95 text-text text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none z-10 whitespace-nowrap backdrop-blur-sm border border-border">
          <div className="text-[12px] mb-0.5">{hovered}</div>
          {BOROUGH_STATS[hovered]?.map((stat) => (
            <div key={stat} className="font-normal text-dim text-[9px]">{stat}</div>
          ))}
        </div>
      )}
    </div>
  );
}
