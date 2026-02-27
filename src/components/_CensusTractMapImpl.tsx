"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { PathOptions } from "leaflet";
import { TRACT_METRIC_CONFIG, type TractMetric } from "./CensusTractMap";

type PlacesLookup = Record<string, Record<string, number>>;

// green → yellow → red
function getColor(value: number, min: number, max: number, invert: boolean): string {
  let t = (value - min) / (max - min);
  t = Math.max(0, Math.min(1, t));
  if (!invert) t = 1 - t;
  if (t < 0.5) {
    const tt = t * 2;
    return `rgb(${Math.round(45 + 200*tt)},${Math.round(212 - 15*tt)},${Math.round(160 - 94*tt)})`;
  }
  const tt = (t - 0.5) * 2;
  return `rgb(${Math.round(245 - 5*tt)},${Math.round(197 - 85*tt)},${Math.round(66 + 46*tt)})`;
}

interface Props { metric: TractMetric; height: number }

export default function CensusTractMapImpl({ metric, height }: Props) {
  const [geojson,  setGeojson]  = useState<GeoJSON.FeatureCollection | null>(null);
  const [places,   setPlaces]   = useState<PlacesLookup | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/nyc-tracts.json").then(r => { if (!r.ok) throw new Error("tract boundaries failed"); return r.json(); }),
      fetch("/api/places").then(r => { if (!r.ok) throw new Error("CDC PLACES API failed"); return r.json(); }),
    ])
      .then(([geo, pl]) => { setGeojson(geo); setPlaces(pl); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-full bg-surface text-dim text-sm text-center p-6">
      <div>
        <p className="font-semibold text-hp-red mb-1">Map failed to load</p>
        <p className="text-xs">{error}</p>
      </div>
    </div>
  );

  if (loading || !geojson || !places) return (
    <div className="flex flex-col items-center justify-center h-full bg-surface text-dim text-sm gap-2">
      <div className="w-5 h-5 border-2 border-hp-blue/30 border-t-hp-blue rounded-full animate-spin" />
      <p className="text-xs">Loading {loading ? "census tract data" : "…"}</p>
    </div>
  );

  const cfg = TRACT_METRIC_CONFIG[metric];

  const styleFeature = (feature?: GeoJSON.Feature): PathOptions => {
    const id    = feature?.properties?.id as string;
    const value = places[id]?.[metric];
    return {
      fillColor:  value != null ? getColor(value, cfg.min, cfg.max, cfg.invert) : "#1d2640",
      weight:      0.4,
      opacity:     0.6,
      color:       "#0a0e17",
      fillOpacity: value != null ? 0.75 : 0.2,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: import("leaflet").Layer) => {
    const id    = feature.properties?.id as string;
    const boro  = feature.properties?.b  as string;
    const value = places[id]?.[metric];

    (layer as unknown as { bindTooltip: (s: string, o: object) => void }).bindTooltip(
      `<div style="font-size:11px;line-height:1.5;background:#171e2c;border:1px solid #1d2640;border-radius:6px;padding:5px 9px;color:#e2e7f0">
        <span style="color:#6b7a94;font-size:10px">Tract ${id?.slice(-6)} · ${boro}</span><br/>
        ${cfg.label}: <strong>${value?.toFixed(1) ?? "No data"} ${value != null ? cfg.unit : ""}</strong>
      </div>`,
      { sticky: true }
    );

    (layer as unknown as { on: (e: string, fn: () => void) => void }).on("mouseover", () => {
      (layer as unknown as { setStyle: (s: PathOptions) => void }).setStyle({ weight: 1.5, fillOpacity: 0.9 });
    });
    (layer as unknown as { on: (e: string, fn: () => void) => void }).on("mouseout", () => {
      (layer as unknown as { setStyle: (s: PathOptions) => void }).setStyle({ weight: 0.4, fillOpacity: 0.75 });
    });
  };

  return (
    <MapContainer
      center={[40.7, -73.97]}
      zoom={11}
      style={{ height, width: "100%", background: "#0a0e17" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png"
        attribution="© OpenStreetMap © CartoDB"
        maxZoom={16}
      />
      <GeoJSON
        key={metric}
        data={geojson}
        style={styleFeature}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
}
