"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Map, { Source, Layer, Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface GeneratedRoute {
  id: string;
  rank: number;
  geojson: any;
  distance: number;
  estimatedMinutes: number;
  elevationGain?: number;
  runScore: number;
  scoreBreakdown: {
    airQuality: number;
    safety: number;
    scenery: number;
    terrain: number;
  };
  sceneryDetail?: { parkPercent: number; waterPercent: number };
  label: string;
  isTopPick: boolean;
  lowQuality?: boolean;
  candidateLabel?: string;
  exportUrls?: { googleMaps: string; appleMaps: string };
  directions?: { instruction: string; distance: string; streetName: string }[];
  summary?: string;
}

export default function SmartRunRoutes() {
  // Location
  const [startLat, setStartLat] = useState<number | null>(null);
  const [startLng, setStartLng] = useState<number | null>(null);
  const [startName, setStartName] = useState("");
  const [startQuery, setStartQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Form
  const [distance, setDistance] = useState(3);
  const [routeType, setRouteType] = useState<"loop" | "out-and-back">("loop");
  const [difficulty, setDifficulty] = useState<"easy" | "moderate" | "hard">("moderate");
  const [preferParks, setPreferParks] = useState(true);

  // Results
  const [routes, setRoutes] = useState<GeneratedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<GeneratedRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  const mapRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Geocoding search
  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 3 || !MAPBOX_TOKEN) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=-73.98,40.75&bbox=-74.26,40.49,-73.7,40.92&types=address,poi,neighborhood,place&limit=5&access_token=${MAPBOX_TOKEN}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(
        (data.features ?? []).map((f: any) => ({
          name: f.place_name,
          lat: f.center[1],
          lng: f.center[0],
        })),
      );
      setShowSuggestions(true);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(startQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [startQuery, searchPlaces]);

  const selectSuggestion = (s: { name: string; lat: number; lng: number }) => {
    setStartLat(s.lat);
    setStartLng(s.lng);
    setStartName(s.name.split(",")[0]);
    setStartQuery(s.name.split(",")[0]);
    setShowSuggestions(false);
    setSuggestions([]);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [s.lng, s.lat], zoom: 14, duration: 1000 });
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStartLat(pos.coords.latitude);
        setStartLng(pos.coords.longitude);
        setStartName("My Location");
        setStartQuery("My Location");
        setShowSuggestions(false);
        setLocating(false);
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 14, duration: 1000 });
        }
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === 1 ? "Location access denied. Search for an address instead."
            : "Could not get location. Search for an address instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Generate routes
  const generateRoutes = async () => {
    if (startLat === null || startLng === null) {
      setError("Please enter a starting point.");
      return;
    }
    setLoading(true);
    setError(null);
    setRoutes([]);
    setSelectedRoute(null);

    try {
      const res = await fetch("/api/run-routes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: startLat,
          lng: startLng,
          startLat,
          startLng,
          distanceMiles: distance,
          routeType,
          difficulty,
          preferParks,
          optimizeFor: ["air", "safety", preferParks ? "green" : ""].filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to generate routes.");
        return;
      }

      if (!data.routes?.length) {
        setError("No routes found. Try adjusting distance or starting point.");
        return;
      }

      setRoutes(data.routes);
      setSelectedRoute(data.routes[0]);
      setMeta(data.meta);

      // Fit map to route
      if (mapRef.current && data.routes[0]?.geojson?.coordinates?.length) {
        const coords = data.routes[0].geojson.coordinates;
        const lngs = coords.map((c: number[]) => c[0]);
        const lats = coords.map((c: number[]) => c[1]);
        mapRef.current.fitBounds(
          [[Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005],
           [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]],
          { padding: 60, duration: 1000 },
        );
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const selectRoute = (route: GeneratedRoute) => {
    setSelectedRoute(route);
    if (mapRef.current && route.geojson?.coordinates?.length) {
      const coords = route.geojson.coordinates;
      const lngs = coords.map((c: number[]) => c[0]);
      const lats = coords.map((c: number[]) => c[1]);
      mapRef.current.fitBounds(
        [[Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005],
         [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]],
        { padding: 60, duration: 800 },
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: Form */}
      <div className="lg:col-span-1 space-y-3">
        {/* Starting Point */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">Starting Point</label>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={startQuery}
                  onChange={(e) => { setStartQuery(e.target.value); setStartLat(null); setStartLng(null); }}
                  placeholder="Search NYC address or landmark..."
                  className="w-full text-[13px] px-3 py-2.5 rounded-xl bg-bg border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-hp-green/30 focus:border-hp-green/40"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-3 py-2.5 text-[12px] text-text hover:bg-bg transition-colors border-b border-border/50 last:border-b-0"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="shrink-0 px-3 py-2.5 rounded-xl bg-bg border border-border text-[12px] font-semibold text-text hover:bg-accent-bg hover:border-hp-green/30 transition-all disabled:opacity-50"
              >
                {locating ? "..." : "My Location"}
              </button>
            </div>
            {startName && startLat !== null && (
              <p className="text-[10px] text-hp-green font-semibold mt-1.5">
                {startName} ({startLat.toFixed(4)}, {startLng?.toFixed(4)})
              </p>
            )}
            {locationError && <p className="text-[10px] text-hp-red mt-1">{locationError}</p>}
          </div>
        </div>

        {/* Distance */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">
            Distance: <span className="text-text">{distance} mi</span>
          </label>
          <input type="range" min={0.5} max={15} step={0.5} value={distance}
            onChange={(e) => setDistance(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-hp-green)]" />
          <div className="flex justify-between text-[10px] text-muted mt-0.5">
            <span>0.5 mi</span><span>5 mi</span><span>10 mi</span><span>15 mi</span>
          </div>
        </div>

        {/* Route Type + Pace */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-border rounded-2xl p-4">
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">Type</label>
            <div className="flex flex-col gap-1.5">
              {(["loop", "out-and-back"] as const).map((t) => (
                <button key={t} onClick={() => setRouteType(t)}
                  className={`px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all ${
                    routeType === t ? "bg-accent-bg border-hp-green/30 text-hp-green" : "bg-bg border-border text-text hover:border-hp-green/20"
                  }`}
                >
                  {t === "loop" ? "Loop" : "Out & Back"}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4">
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-1.5 block">Pace</label>
            <div className="flex flex-col gap-1.5">
              {(["easy", "moderate", "hard"] as const).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all capitalize ${
                    difficulty === d ? "bg-accent-bg border-hp-green/30 text-hp-green" : "bg-bg border-border text-text hover:border-hp-green/20"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prefer Parks Toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-surface border border-border rounded-2xl">
          <div>
            <span className="text-[12px] font-semibold text-text">Prefer Parks & Waterfront</span>
            <span className="text-[10px] text-muted block mt-0.5">Routes through nearby green spaces</span>
          </div>
          <button type="button" onClick={() => setPreferParks(!preferParks)}
            className={`relative w-11 h-6 rounded-full transition-colors ${preferParks ? "bg-[#4A7C59]" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${preferParks ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <p className="text-[10px] text-muted px-1">
          Routes stay on your side of the water — no ferries or unnecessary bridge crossings.
        </p>

        {/* Generate Button */}
        <button onClick={generateRoutes} disabled={loading || startLat === null}
          className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white bg-hp-green hover:bg-hp-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ background: startLat !== null && !loading ? "var(--color-hp-green)" : undefined }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating routes...
            </span>
          ) : "Generate Smart Routes"}
        </button>

        {error && <p className="text-[12px] text-hp-red font-medium bg-hp-red/5 border border-hp-red/15 p-3 rounded-xl">{error}</p>}

        {/* Meta */}
        {meta && (
          <p className="text-[10px] text-muted text-center">
            {meta.nearbyParks} parks · {meta.nearbyWaterfront} waterfront · {meta.candidatesGenerated} candidates · {meta.processingMs}ms
          </p>
        )}
      </div>

      {/* RIGHT: Map + Results */}
      <div className="lg:col-span-2 space-y-3">
        {/* Map */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden" style={{ height: "420px" }}>
          {MAPBOX_TOKEN ? (
            <Map
              ref={mapRef}
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{ latitude: startLat || 40.7128, longitude: startLng || -74.006, zoom: 13 }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/light-v11"
            >
              <NavigationControl position="top-right" />
              {startLat && startLng && (
                <Marker latitude={startLat} longitude={startLng}>
                  <div className="w-4 h-4 bg-hp-green rounded-full border-2 border-white shadow-lg" />
                </Marker>
              )}
              {routes.map((route) => (
                <Source key={route.id} id={`route-${route.id}`} type="geojson" data={{ type: "Feature", geometry: route.geojson, properties: {} }}>
                  <Layer
                    id={`line-${route.id}`}
                    type="line"
                    paint={{
                      "line-color": selectedRoute?.id === route.id ? "#4A7C59" : "#94a3b8",
                      "line-width": selectedRoute?.id === route.id ? 4 : 2,
                      "line-opacity": selectedRoute?.id === route.id ? 1 : 0.4,
                    }}
                    layout={{ "line-cap": "round", "line-join": "round" }}
                  />
                </Source>
              ))}
            </Map>
          ) : (
            <div className="flex items-center justify-center h-full text-muted text-sm">Map unavailable — Mapbox token not set</div>
          )}
        </div>

        {/* Route Cards */}
        {routes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {routes.map((route) => (
              <button key={route.id} onClick={() => selectRoute(route)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  selectedRoute?.id === route.id ? "border-hp-green bg-accent-bg" : "border-border bg-surface hover:border-hp-green/20"
                }`}
              >
                {route.isTopPick && (
                  <span className="text-[10px] font-bold text-hp-green bg-accent-bg px-2 py-0.5 rounded-full border border-hp-green/20">Top Pick</span>
                )}
                <div className="mt-2">
                  <span className="text-[22px] font-extrabold text-text">{route.runScore}</span>
                  <span className="text-[12px] text-muted">/100</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[12px] text-dim">
                  <span>{route.distance} mi</span>
                  <span className="text-border">|</span>
                  <span>{route.estimatedMinutes} min</span>
                  {route.elevationGain ? (
                    <><span className="text-border">|</span><span>{route.elevationGain}ft</span></>
                  ) : null}
                </div>
                <p className="text-[10px] text-muted mt-1">{route.label}</p>
              </button>
            ))}
          </div>
        )}

        {/* Score Breakdown */}
        {selectedRoute && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <h3 className="text-[13px] font-bold text-text mb-3">Run Score Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Air Quality", icon: "🌬️", score: selectedRoute.scoreBreakdown.airQuality },
                { label: "Street Safety", icon: "🛡️", score: selectedRoute.scoreBreakdown.safety },
                { label: "Scenery", icon: "🏞️", score: selectedRoute.scoreBreakdown.scenery },
                { label: "Terrain", icon: "⛰️", score: selectedRoute.scoreBreakdown.terrain },
              ].map((f) => (
                <div key={f.label} className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-lg mb-1">{f.icon}</p>
                  <p className="text-[18px] font-extrabold text-text">{f.score}/25</p>
                  <p className="text-[10px] text-muted font-semibold mt-0.5">{f.label}</p>
                  <div className="w-full bg-border rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full bg-hp-green transition-all" style={{ width: `${(f.score / 25) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {selectedRoute.sceneryDetail && (selectedRoute.sceneryDetail.parkPercent > 0 || selectedRoute.sceneryDetail.waterPercent > 0) && (
              <div className="mt-3 pt-2 border-t border-border flex gap-3 text-[11px] text-dim">
                {selectedRoute.sceneryDetail.parkPercent > 0 && <span>{selectedRoute.sceneryDetail.parkPercent}% through parks</span>}
                {selectedRoute.sceneryDetail.waterPercent > 0 && <span>{selectedRoute.sceneryDetail.waterPercent}% along water</span>}
              </div>
            )}
          </div>
        )}

        {/* Export to Maps */}
        {selectedRoute?.exportUrls && (
          <div className="flex gap-3">
            <a
              href={selectedRoute.exportUrls.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-[12px] font-semibold text-text hover:bg-bg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
              Open in Google Maps
            </a>
            <a
              href={selectedRoute.exportUrls.appleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-[12px] font-semibold text-text hover:bg-bg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1D1D1F"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
              Open in Apple Maps
            </a>
          </div>
        )}

        {/* Turn-by-Turn Directions */}
        {selectedRoute && selectedRoute.directions && selectedRoute.directions.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {selectedRoute.summary && (
              <div className="p-4 border-b border-border">
                <p className="text-[12px] text-dim leading-relaxed">{selectedRoute.summary}</p>
              </div>
            )}
            <details className="group">
              <summary className="px-4 py-3.5 cursor-pointer text-[13px] font-semibold text-text flex items-center justify-between hover:bg-bg transition-colors">
                <span>Turn-by-Turn Directions ({selectedRoute.directions.length} steps)</span>
                <svg className="w-4 h-4 text-muted transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4">
                <ol className="space-y-2.5">
                  {selectedRoute.directions.map((step: { instruction: string; distance: string; streetName: string }, i: number) => (
                    <li key={i} className="flex gap-3 text-[12px]">
                      <span className="flex-shrink-0 w-6 h-6 bg-accent-bg text-hp-green rounded-full flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-text">{step.instruction}</p>
                        <p className="text-[10px] text-muted mt-0.5">{step.distance}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
