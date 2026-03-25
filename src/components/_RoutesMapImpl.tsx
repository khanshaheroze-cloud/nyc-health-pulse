"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ROUTES } from "@/lib/routes";

const BOROUGH_COLORS: Record<string, string> = {
  Manhattan: "#2850AD",
  Brooklyn: "#FF6319",
  Queens: "#B933AD",
  Bronx: "#EE352E",
  "Staten Island": "#6CBE45",
};

function makeIcon(borough: string) {
  const color = BOROUGH_COLORS[borough] ?? "#3B7CB8";
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center"><span style="font-size:13px;line-height:1">🏃</span></div>`,
  });
}

export default function RoutesMapImpl() {
  return (
    <MapContainer
      center={[40.7128, -73.98]}
      zoom={11}
      style={{ height: "100%", width: "100%", borderRadius: 12 }}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {ROUTES.map((r) => (
        <Marker key={r.name} position={[r.lat, r.lng]} icon={makeIcon(r.borough)}>
          <Popup>
            <div style={{ minWidth: 200, fontFamily: "system-ui" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                {r.icon} {r.name}
              </div>
              <div style={{ fontSize: 11, color: "#5C635C", marginBottom: 6 }}>
                {r.borough} · {r.distance} · {r.surface} · {r.difficulty}
              </div>
              <div style={{ fontSize: 11, color: "#1A1D1A", marginBottom: 6 }}>
                {r.description}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {r.highlights.map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 6,
                      background: "rgba(45,212,160,.1)",
                      color: "#2dd4a0",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </span>
                ))}
                {r.carFree && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 6,
                      background: "rgba(91,156,245,.1)",
                      color: "#3B7CB8",
                      fontWeight: 600,
                    }}
                  >
                    Car-free
                  </span>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
