"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Layer, PathOptions } from "leaflet";
import type { MapMetric } from "./NeighborhoodMap";
import { neighborhoods, geocodeToSlug, cityAvg } from "@/lib/neighborhoodData";

// Build geocode → value lookup
function buildLookup(metric: MapMetric): Record<number, number> {
  return Object.fromEntries(neighborhoods.map(n => [n.geocode, n.metrics[metric]]));
}

const METRIC_CONFIG: Record<MapMetric, { label: string; unit: string; invert: boolean; min: number; max: number }> = {
  asthmaED: { label: "Asthma ED Rate", unit: "/10K",  invert: true,  min: 18,  max: 164 },
  obesity:  { label: "Obesity Rate",   unit: "%",     invert: true,  min: 12,  max: 37  },
  pm25:     { label: "PM2.5",          unit: "μg/m³", invert: true,  min: 6.1, max: 8.0 },
  lifeExp:  { label: "Life Expectancy",unit: "y",     invert: false, min: 76,  max: 90  },
  poverty:      { label: "Poverty Rate",      unit: "%",     invert: true,  min: 10,  max: 43  },
  overdoseRate: { label: "Overdose Deaths",  unit: "/100K", invert: true,  min: 5,   max: 45  },
  pretermBirth: { label: "Preterm Births",   unit: "%",     invert: true,  min: 5,   max: 14  },
};

// green → yellow → red scale
function getColor(value: number, min: number, max: number, invert: boolean): string {
  let t = (value - min) / (max - min);
  t = Math.max(0, Math.min(1, t));
  if (!invert) t = 1 - t;
  if (t < 0.5) {
    const tt = t * 2;
    return `rgb(${Math.round(45 + 200*tt)},${Math.round(212 - 15*tt)},${Math.round(160 - 94*tt)})`;
  } else {
    const tt = (t - 0.5) * 2;
    return `rgb(${Math.round(245 - 5*tt)},${Math.round(197 - 85*tt)},${Math.round(66 + 46*tt)})`;
  }
}

interface Props { metric: MapMetric; height: number }

export default function NeighborhoodMapImpl({ metric, height }: Props) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/uhf42.json")
      .then(r => { if (!r.ok) throw new Error("boundary load failed"); return r.json(); })
      .then(setGeojson)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="flex items-center justify-center h-full text-dim text-sm">{error}</div>;
  if (!geojson) return <div className="flex items-center justify-center h-full text-dim text-sm">Loading map…</div>;

  const lookup = buildLookup(metric);
  const cfg    = METRIC_CONFIG[metric];

  const styleFeature = (feature?: GeoJSON.Feature): PathOptions => {
    const code  = feature?.properties?.GEOCODE as number;
    const value = lookup[code];
    return {
      fillColor:  value != null ? getColor(value, cfg.min, cfg.max, cfg.invert) : "#d1d5db",
      weight:      1.5,
      opacity:     1,
      color:       "#ffffff",
      fillOpacity: 0.72,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    const code  = feature.properties?.GEOCODE as number;
    const name  = feature.properties?.GEONAME  as string;
    const value = lookup[code];

    (layer as unknown as { bindTooltip: (s: string, o: object) => void }).bindTooltip(
      `<div style="font-size:11px;line-height:1.4;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border:1px solid #e2e8e4;border-radius:10px;padding:6px 10px;color:#1e2d2a;box-shadow:0 4px 12px rgba(0,0,0,.12);text-align:center;pointer-events:none">
        <strong style="font-size:11px;display:block;margin-bottom:1px">${name?.split("/")[0]?.split("-")[0]?.trim()}</strong>
        <span style="font-size:16px;font-weight:700;color:${value != null ? getColor(value, cfg.min, cfg.max, cfg.invert) : '#8ba89c'}">${value?.toFixed(1) ?? "—"}</span>
        <span style="font-size:9px;color:#5a7a6e"> ${cfg.unit}</span>
        <div style="font-size:9px;color:#8ba89c;margin-top:1px">avg ${Number(cityAvg[metric]).toFixed(1)} · tap for profile</div>
      </div>`,
      { sticky: false, direction: "center" as "center", className: "leaflet-tooltip-borough" }
    );

    (layer as unknown as { on: (e: string, fn: () => void) => void }).on("click", () => {
      const slug = geocodeToSlug[code];
      if (slug) router.push(`/neighborhood/${slug}`);
    });
    (layer as unknown as { on: (e: string, fn: (e: unknown) => void) => void }).on("mouseover", () => {
      (layer as unknown as { setStyle: (s: PathOptions) => void }).setStyle({ weight: 2.5, fillOpacity: 0.88, color: "#1e2d2a" });
    });
    (layer as unknown as { on: (e: string, fn: (e: unknown) => void) => void }).on("mouseout", () => {
      (layer as unknown as { setStyle: (s: PathOptions) => void }).setStyle({ weight: 1.5, fillOpacity: 0.72, color: "#ffffff" });
    });
  };

  return (
    <MapContainer
      center={[40.7, -73.97]}
      zoom={11}
      style={{ height, width: "100%", background: "#f8fafb" }}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution="© OpenStreetMap © CartoDB"
        maxZoom={18}
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
