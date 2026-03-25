"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NearbyRestaurant } from "./NearbyFoodMap";

/* ── Custom markers ──────────────────────────────────────────────────── */

function makeIcon(color: string, emoji: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:14px;">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

const chainIcon = makeIcon("#4A7C59", "🌯");
const healthyIcon = makeIcon("#22d3ee", "🥗");
const defaultIcon = makeIcon("#9ca3af", "🍴");
const userIcon = L.divIcon({
  className: "",
  html: `<div style="background:#5b9cf5;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #5b9cf5,0 2px 8px rgba(0,0,0,.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/* ── Component ───────────────────────────────────────────────────────── */

interface Props {
  center: [number, number];
  restaurants: NearbyRestaurant[];
}

export default function NearbyFoodMapImpl({ center, restaurants }: Props) {
  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

      {/* User location */}
      <Marker position={center} icon={userIcon} />
      <Circle
        center={center}
        radius={1600}
        pathOptions={{ color: "#5b9cf5", fillColor: "#5b9cf5", fillOpacity: 0.04, weight: 1.5, dashArray: "6 4" }}
      />

      {/* Restaurant pins */}
      {restaurants.map((r, i) => {
        const icon = r.chainSlug ? chainIcon : r.isHealthy ? healthyIcon : defaultIcon;
        return (
          <Marker key={i} position={[r.lat, r.lng]} icon={icon}>
            <Popup>
              <div style={{ minWidth: 160, fontSize: 12 }}>
                <strong>{r.name}</strong>
                <br />
                <span style={{ color: "#666" }}>{r.cuisine}</span>
                {r.grade && (
                  <span
                    style={{
                      marginLeft: 6,
                      padding: "1px 5px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background: r.grade === "A" ? "#d1fae5" : r.grade === "B" ? "#fef3c7" : "#fecaca",
                      color: r.grade === "A" ? "#059669" : r.grade === "B" ? "#d97706" : "#dc2626",
                    }}
                  >
                    Grade {r.grade}
                  </span>
                )}
                <br />
                <span style={{ color: "#888", fontSize: 10 }}>{r.address}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
