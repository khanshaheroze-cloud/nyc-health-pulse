"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";

interface GeneratedRoute {
  geojson: GeoJSON.LineString;
  distance: number;
  elevationGain: number;
  estimatedMinutes: number;
  runScore: number;
  scoreBreakdown: { airQuality: number; safety: number; scenery: number; terrain: number };
  lowQuality: boolean;
}

export function RouteGeneratorMap({
  route,
  startLat,
  startLng,
}: {
  route: GeneratedRoute;
  startLat: number;
  startLng: number;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [startLng, startLat],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      // Add route line
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: route.geojson,
        },
      });

      map.addLayer({
        id: "route-line-shadow",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#000000",
          "line-width": 6,
          "line-opacity": 0.1,
          "line-blur": 3,
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#4A7C59",
          "line-width": 4,
          "line-opacity": 0.85,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      });

      // Start marker
      new mapboxgl.Marker({ color: "#4A7C59" })
        .setLngLat([startLng, startLat])
        .setPopup(new mapboxgl.Popup().setHTML("<strong>Start / Finish</strong>"))
        .addTo(map);

      // Fit bounds to route
      const coords = route.geojson.coordinates as [number, number][];
      if (coords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        coords.forEach((c) => bounds.extend(c as [number, number]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [route, startLat, startLng]);

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden" />

      {/* Floating stat cards */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-border/50">
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">Distance</p>
          <p className="text-[16px] font-extrabold text-text">{route.distance} mi</p>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-border/50">
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">Elevation</p>
          <p className="text-[16px] font-extrabold text-text">{route.elevationGain} ft</p>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-border/50">
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">Est. Time</p>
          <p className="text-[16px] font-extrabold text-text">{route.estimatedMinutes} min</p>
        </div>
        <div className={`backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border ${route.runScore >= 70 ? "bg-hp-green/10 border-hp-green/30" : route.runScore >= 50 ? "bg-hp-yellow/10 border-hp-yellow/30" : "bg-hp-red/10 border-hp-red/30"}`}>
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">Run Score</p>
          <p className={`text-[16px] font-extrabold ${route.runScore >= 70 ? "text-hp-green" : route.runScore >= 50 ? "text-hp-yellow" : "text-hp-red"}`}>
            {route.runScore}/100
          </p>
        </div>
      </div>

      {/* Low quality warning */}
      {route.lowQuality && (
        <div className="absolute bottom-3 left-3 right-3 bg-hp-yellow/15 border border-hp-yellow/30 rounded-xl px-4 py-2.5 z-10">
          <p className="text-[11px] text-hp-yellow font-semibold">
            ⚠️ We couldn&apos;t find an ideal route here. Try adjusting distance or preferences.
          </p>
        </div>
      )}
    </div>
  );
}
