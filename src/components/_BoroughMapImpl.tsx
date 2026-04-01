"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Layer, PathOptions } from "leaflet";

// Metric data keyed by borough name (as it appears in the GeoJSON)
const METRIC_DATA: Record<string, Record<string, number>> = {
  pm25: {
    Bronx: 7.16,
    Brooklyn: 7.08,
    Manhattan: 7.9,
    Queens: 7.07,
    "Staten Island": 6.12,
  },
  obesity: {
    Bronx: 32.1,
    Brooklyn: 28.4,
    Manhattan: 16.2,
    Queens: 27.5,
    "Staten Island": 31.8,
  },
  life_expectancy: {
    Bronx: 79.0,
    Brooklyn: 80.8,
    Manhattan: 82.3,
    Queens: 83.0,
    "Staten Island": 83.1,
  },
  asthma: {
    Bronx: 83.5,
    Brooklyn: 44.8,
    Manhattan: 39.2,
    Queens: 27.4,
    "Staten Island": 25.1,
  },
};

const METRIC_LABELS: Record<string, string> = {
  pm25:            "PM2.5 (μg/m³)",
  obesity:         "Obesity %",
  life_expectancy: "Life Expectancy (yr)",
  asthma:          "Asthma ED Rate/10K",
};

const METRIC_TABS: { key: MapMetric; label: string }[] = [
  { key: "pm25",            label: "PM2.5"    },
  { key: "obesity",         label: "Obesity"  },
  { key: "life_expectancy", label: "Life Exp" },
  { key: "asthma",          label: "Asthma ED"},
];

// For life_expectancy, higher = better (invert color scale)
const INVERT_SCALE = new Set(["life_expectancy"]);

function valueToColor(value: number, min: number, max: number, invert: boolean): string {
  const t = (value - min) / (max - min || 1);
  const ratio = invert ? 1 - t : t;
  // Green (#2dd4a0) → Orange (#f59e42) → Red (#f07070)
  if (ratio < 0.5) {
    const r2 = ratio * 2;
    const r = Math.round(0x2d + (0xf5 - 0x2d) * r2);
    const g = Math.round(0xd4 + (0x9e - 0xd4) * r2);
    const b = Math.round(0xa0 + (0x42 - 0xa0) * r2);
    return `rgb(${r},${g},${b})`;
  } else {
    const r2 = (ratio - 0.5) * 2;
    const r = Math.round(0xf5 + (0xf0 - 0xf5) * r2);
    const g = Math.round(0x9e + (0x70 - 0x9e) * r2);
    const b = Math.round(0x42 + (0x70 - 0x42) * r2);
    return `rgb(${r},${g},${b})`;
  }
}

export type MapMetric = "pm25" | "obesity" | "life_expectancy" | "asthma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJsonData = any;

export default function BoroughMapImpl({ height = 400 }: { height?: number }) {
  const [metric, setMetric] = useState<MapMetric>("pm25");
  const [geoJson, setGeoJson] = useState<GeoJsonData>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/borough-boundaries.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setGeoJson)
      .catch(() => setError(true));
  }, []);

  const metricValues = METRIC_DATA[metric] ?? {};
  const values = Object.values(metricValues);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const invert = INVERT_SCALE.has(metric);

  function style(feature: GeoJsonData): PathOptions {
    const name: string = feature?.properties?.BoroName ?? "";
    const value = metricValues[name] ?? 0;
    return {
      fillColor: valueToColor(value, min, max, invert),
      fillOpacity: 0.65,
      color: "#ffffff",
      weight: 2,
    };
  }

  function onEachFeature(feature: GeoJsonData, layer: Layer) {
    const name: string = feature?.properties?.BoroName ?? "Unknown";
    const value = metricValues[name];
    const label = METRIC_LABELS[metric];
    layer.bindTooltip(
      `<div style="font-size:12px;line-height:1.3;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border:1px solid #E8E4DE;border-radius:10px;padding:6px 10px;color:#1A1D1A;box-shadow:0 4px 12px rgba(0,0,0,.12);text-align:center;pointer-events:none">
        <strong style="font-size:12px;display:block">${name}</strong>
        <span style="font-size:18px;font-weight:700;color:${valueToColor(value ?? 0, min, max, invert)}">${typeof value === "number" ? value.toFixed(1) : "N/A"}</span>
        <span style="font-size:9px;color:#5C635C"> ${label.split("(")[0].trim()}</span>
      </div>`,
      { sticky: false, direction: "center" as "center", className: "leaflet-tooltip-borough" }
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-dim text-sm">
        Could not load borough boundaries. Check network connection.
      </div>
    );
  }

  // Reserve ~36px for the metric tab row + gap
  const mapHeight = height - 44;

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Metric tab row */}
      <div className="flex gap-1.5 flex-wrap">
        {METRIC_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMetric(tab.key)}
            className={
              "px-3 py-1 text-[11px] font-semibold rounded-lg border transition-colors " +
              (metric === tab.key
                ? "bg-hp-blue/15 border-hp-blue/40 text-hp-blue"
                : "bg-surface border-border text-dim hover:text-text")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ height: mapHeight }}>
        <MapContainer
          center={[40.7128, -74.006]}
          zoom={10}
          scrollWheelZoom={false}
          style={{ height: mapHeight, width: "100%", background: "#FAFAF7" }}
          className="rounded-lg"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          {geoJson && (
            <GeoJSON key={metric} data={geoJson} style={style} onEachFeature={onEachFeature} />
          )}
          {!geoJson && (
            <div className="absolute inset-0 flex items-center justify-center z-[1000]">
              <span className="text-dim text-xs">Loading borough data…</span>
            </div>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
