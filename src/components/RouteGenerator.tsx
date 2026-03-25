"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { RefuelNearby } from "./RefuelNearby";
import { RouteAmenities } from "./RouteAmenities";

// Lazy-load the map to avoid SSR issues with mapbox-gl
const RouteGeneratorMap = dynamic(
  () => import("./RouteGeneratorMap").then((m) => ({ default: m.RouteGeneratorMap })),
  { ssr: false },
);

interface GeneratedRoute {
  geojson: GeoJSON.LineString;
  distance: number;
  elevationGain: number;
  estimatedMinutes: number;
  runScore: number;
  scoreBreakdown: { airQuality: number; safety: number; greenSpace: number; terrain: number };
  lowQuality: boolean;
}

const OPTIMIZE_OPTIONS = [
  { id: "air", label: "Best Air Quality", icon: "🌬️" },
  { id: "safety", label: "Safest Streets", icon: "🛡️" },
  { id: "green", label: "Most Green Space", icon: "🌳" },
  { id: "scenic", label: "Scenic / Landmarks", icon: "📸" },
  { id: "flat", label: "Flattest Terrain", icon: "➡️" },
  { id: "water", label: "Water Fountains", icon: "🚰" },
  { id: "restrooms", label: "Restrooms", icon: "🚻" },
];

const TIME_TIPS: Record<string, { tips: string[]; color: string; icon: string }> = {
  morning: {
    icon: "🌅",
    color: "hp-green",
    tips: [
      "Best air quality — pollution levels are lowest before 9am",
      "UV index is low — sunscreen optional for early starts",
      "Popular routes (Central Park, Prospect Park) are less crowded before 7am",
      "Hydrate before you go — cafes aren't all open yet",
    ],
  },
  midday: {
    icon: "☀️",
    color: "hp-orange",
    tips: [
      "UV index peaks between 11am–2pm — wear sunscreen SPF 30+",
      "Shaded routes score higher: park loops with tree canopy are best",
      "Bring water — fountain lines can be long in summer",
      "Tourist crowds peak on bridges and waterfront paths",
    ],
  },
  evening: {
    icon: "🌇",
    color: "hp-blue",
    tips: [
      "Air quality often dips in late afternoon — check AQI before heading out",
      "Great time for waterfront routes — sunset views on Hudson/East River",
      "Running clubs meet 6–7pm — consider joining a group run",
      "Citi Bike docks refill around 5pm if you need a ride home",
    ],
  },
  night: {
    icon: "🌙",
    color: "hp-purple",
    tips: [
      "Stick to well-lit routes: greenways and park drives with streetlights",
      "Wear reflective gear or a headlamp — drivers can't see you",
      "Avoid isolated park trails after dark — waterfront paths are safer",
      "Central Park and Prospect Park drives are lit; interior trails are not",
    ],
  },
};

function TimeOfDayTips({ timeOfDay }: { timeOfDay: string }) {
  const info = TIME_TIPS[timeOfDay];
  if (!info) return null;

  return (
    <div className={`bg-${info.color}/5 border border-${info.color}/15 rounded-2xl p-4 mb-4 animate-fade-in-up`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{info.icon}</span>
        <span className="text-[12px] font-bold text-text capitalize">{timeOfDay} Run Tips</span>
      </div>
      <div className="space-y-1.5">
        {info.tips.map((tip, i) => (
          <p key={i} className="text-[11px] text-dim leading-relaxed">
            <span className="text-muted mr-1">•</span>
            {tip}
          </p>
        ))}
      </div>
    </div>
  );
}

export function RouteGenerator() {
  // Form state
  const [startQuery, setStartQuery] = useState("");
  const [startLat, setStartLat] = useState<number | null>(null);
  const [startLng, setStartLng] = useState<number | null>(null);
  const [startName, setStartName] = useState("");
  const [distance, setDistance] = useState(3);
  const [routeType, setRouteType] = useState<"loop" | "out-back">("loop");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [optimizeFor, setOptimizeFor] = useState<string[]>(["air", "safety"]);
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "midday" | "evening" | "night">("morning");

  // Geocoder state
  const [suggestions, setSuggestions] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [generating, setGenerating] = useState(false);
  const [routes, setRoutes] = useState<GeneratedRoute[]>([]);
  const [activeRoute, setActiveRoute] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // Geocode search with Mapbox
  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=-73.98,40.75&bbox=-74.26,40.49,-73.7,40.92&types=address,poi,neighborhood,place&limit=5&access_token=${token}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(
        (data.features ?? []).map((f: { place_name: string; center: [number, number] }) => ({
          name: f.place_name,
          lat: f.center[1],
          lng: f.center[0],
        })),
      );
      setShowSuggestions(true);
    } catch {
      // ignore
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(startQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [startQuery, searchPlaces]);

  // Use my location
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStartLat(pos.coords.latitude);
        setStartLng(pos.coords.longitude);
        setStartName("My Location");
        setStartQuery("My Location");
        setShowSuggestions(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Could not get your location. Please search for an address.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Select a suggestion
  const selectSuggestion = (s: { name: string; lat: number; lng: number }) => {
    setStartLat(s.lat);
    setStartLng(s.lng);
    setStartName(s.name.split(",")[0]);
    setStartQuery(s.name.split(",")[0]);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Toggle optimization preference
  const toggleOptimize = (id: string) => {
    setOptimizeFor((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  // Generate route
  const generate = async () => {
    if (startLat === null || startLng === null) {
      setError("Please enter a starting point");
      return;
    }

    setGenerating(true);
    setError(null);
    setRoutes([]);
    setActiveRoute(0);

    try {
      const res = await fetch("/api/run-routes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLat,
          startLng,
          distanceMiles: distance,
          routeType,
          difficulty,
          optimizeFor,
        }),
      });

      const data = await res.json();

      if (data.error && (!data.routes || data.routes.length === 0)) {
        setError(data.error);
      } else if (data.routes?.length > 0) {
        setRoutes(data.routes);
      } else {
        setError("No routes found. Try a different location or distance.");
      }
    } catch {
      setError("Failed to generate route. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const currentRoute = routes[activeRoute];

  return (
    <div>
      {/* Generator form */}
      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 mb-4 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🗺️</span>
          <h2 className="text-[15px] font-bold text-text">Generate a Route</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-hp-green/10 border border-hp-green/20 text-hp-green font-bold uppercase tracking-wide">New</span>
        </div>

        {/* Starting point */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">
            Starting Point
          </label>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={startQuery}
                  onChange={(e) => {
                    setStartQuery(e.target.value);
                    setStartLat(null);
                    setStartLng(null);
                  }}
                  placeholder="Search NYC address or landmark..."
                  className="w-full text-[13px] px-3 py-2.5 rounded-xl bg-surface-sage border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-hp-green/30 focus:border-hp-green/40"
                />
                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-3 py-2.5 text-[12px] text-text hover:bg-surface-sage transition-colors border-b border-border/50 last:border-b-0"
                      >
                        📍 {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="shrink-0 px-3 py-2.5 rounded-xl bg-surface-sage border border-border text-[12px] font-semibold text-text hover:bg-hp-green/10 hover:border-hp-green/30 transition-all btn-press disabled:opacity-50"
              >
                {locating ? "Locating..." : "📍 Use My Location"}
              </button>
            </div>
            {startName && startLat !== null && (
              <p className="text-[10px] text-hp-green font-semibold mt-1.5">
                ✓ {startName} ({startLat.toFixed(4)}, {startLng?.toFixed(4)})
              </p>
            )}
          </div>
        </div>

        {/* Distance slider */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">
            Target Distance: <span className="text-text">{distance} mi</span>
          </label>
          <input
            type="range"
            min={1}
            max={15}
            step={0.5}
            value={distance}
            onChange={(e) => setDistance(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-hp-green)]"
          />
          <div className="flex justify-between text-[10px] text-muted mt-0.5">
            <span>1 mi</span>
            <span>5 mi</span>
            <span>10 mi</span>
            <span>15 mi</span>
          </div>
        </div>

        {/* Route type + Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">
              Route Type
            </label>
            <div className="flex gap-2">
              {(["loop", "out-back"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setRouteType(type)}
                  className={`flex-1 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all btn-press ${
                    routeType === type
                      ? "bg-hp-green/10 border-hp-green/30 text-hp-green"
                      : "bg-surface-sage border-border text-text hover:border-hp-green/20"
                  }`}
                >
                  {type === "loop" ? "🔄 Loop" : "↔️ Out & Back"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">
              Difficulty
            </label>
            <div className="flex gap-2">
              {(["beginner", "intermediate", "advanced"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 px-2 py-2 rounded-xl text-[11px] font-semibold border transition-all btn-press capitalize ${
                    difficulty === d
                      ? "bg-hp-green/10 border-hp-green/30 text-hp-green"
                      : "bg-surface-sage border-border text-text hover:border-hp-green/20"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time of day */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">
            When Are You Running?
          </label>
          <div className="flex gap-2">
            {([
              { id: "morning", label: "🌅 Morning", sub: "5–10am" },
              { id: "midday", label: "☀️ Midday", sub: "10am–3pm" },
              { id: "evening", label: "🌇 Evening", sub: "3–7pm" },
              { id: "night", label: "🌙 Night", sub: "7pm+" },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeOfDay(t.id)}
                className={`flex-1 px-2 py-2 rounded-xl text-center border transition-all btn-press ${
                  timeOfDay === t.id
                    ? "bg-hp-green/10 border-hp-green/30 text-hp-green"
                    : "bg-surface-sage border-border text-text hover:border-hp-green/20"
                }`}
              >
                <span className="text-[12px] font-semibold block">{t.label}</span>
                <span className="text-[9px] text-muted">{t.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optimize for chips */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">
            Optimize For
          </label>
          <div className="flex flex-wrap gap-2">
            {OPTIMIZE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleOptimize(opt.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all btn-press ${
                  optimizeFor.includes(opt.id)
                    ? "bg-hp-green/10 border-hp-green/30 text-hp-green"
                    : "bg-surface-sage border-border text-dim hover:border-hp-green/20"
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={generating || startLat === null}
          className="w-full py-3 rounded-xl text-[14px] font-bold text-white bg-hp-green hover:bg-hp-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-press"
          style={{ background: startLat !== null && !generating ? "var(--color-hp-green)" : undefined }}
        >
          {generating ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating your route...
            </span>
          ) : (
            "🏃 Generate Smart Route"
          )}
        </button>

        {error && (
          <p className="text-[12px] text-hp-red mt-3 font-medium">{error}</p>
        )}
      </div>

      {/* Generated route result */}
      {currentRoute && (
        <div className="animate-fade-in-up">
          {/* Map */}
          <div className="mb-4">
            <RouteGeneratorMap
              route={currentRoute}
              startLat={startLat!}
              startLng={startLng!}
            />
          </div>

          {/* Time-of-day tips */}
          <TimeOfDayTips timeOfDay={timeOfDay} />

          {/* Route amenities */}
          <RouteAmenities
            lat={currentRoute.geojson.coordinates[Math.floor(currentRoute.geojson.coordinates.length / 2)][1]}
            lng={currentRoute.geojson.coordinates[Math.floor(currentRoute.geojson.coordinates.length / 2)][0]}
            radius={600}
          />

          {/* Score breakdown */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-text">Score Breakdown</h3>
              <div className={`text-[18px] font-extrabold ${currentRoute.runScore >= 70 ? "text-hp-green" : currentRoute.runScore >= 50 ? "text-hp-yellow" : "text-hp-red"}`}>
                {currentRoute.runScore}/100
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Air Quality", value: currentRoute.scoreBreakdown.airQuality, icon: "🌬️", color: "hp-green" },
                { label: "Street Safety", value: currentRoute.scoreBreakdown.safety, icon: "🛡️", color: "hp-blue" },
                { label: "Green Space", value: currentRoute.scoreBreakdown.greenSpace, icon: "🌳", color: "hp-green" },
                { label: "Terrain", value: currentRoute.scoreBreakdown.terrain, icon: "⛰️", color: "hp-purple" },
              ].map((f) => (
                <div key={f.label} className="bg-surface-sage rounded-xl p-3 text-center">
                  <p className="text-lg mb-1">{f.icon}</p>
                  <p className="text-[18px] font-extrabold text-text">{f.value}/25</p>
                  <p className="text-[10px] text-muted font-semibold mt-0.5">{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Refuel Nearby — Eat Smart integration */}
          <RefuelNearby
            endLat={currentRoute.geojson.coordinates[currentRoute.geojson.coordinates.length - 1][1]}
            endLng={currentRoute.geojson.coordinates[currentRoute.geojson.coordinates.length - 1][0]}
            routeDistanceMi={currentRoute.distance}
          />

          {/* Try another route button */}
          {routes.length > 1 && (
            <button
              onClick={() => setActiveRoute(activeRoute === 0 ? 1 : 0)}
              className="w-full py-2.5 rounded-xl text-[12px] font-semibold text-hp-blue bg-hp-blue/8 border border-hp-blue/20 hover:bg-hp-blue/12 transition-all btn-press mb-4"
            >
              🔄 Try Another Route (Option {activeRoute === 0 ? 2 : 1})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
