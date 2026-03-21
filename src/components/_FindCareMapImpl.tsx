"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

/* Fix default marker icon path issue in Next.js */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type FacilityType = "hospital" | "clinic" | "mental-health" | "substance-use" | "nursing" | "urgent-care" | "other";
type InsuranceCategory = "accepts-all" | "sliding-scale" | "most-insurance" | "contact";

interface Facility {
  name: string;
  type: FacilityType;
  typeLabel: string;
  address: string;
  city: string;
  zip: string;
  borough: string;
  phone: string | null;
  lat: number;
  lng: number;
  insurance: InsuranceCategory;
  insuranceLabel: string;
  ownership: string;
  distance?: number;
}

const TYPE_MARKER_COLORS: Record<FacilityType, string> = {
  hospital: "#f07070",
  clinic: "#2dd4a0",
  "mental-health": "#5b9cf5",
  "substance-use": "#a78bfa",
  "urgent-care": "#f59e42",
  nursing: "#22d3ee",
  other: "#8ba89c",
};

function FitBounds({ facilities, userLat, userLng }: { facilities: Facility[]; userLat: number | null; userLng: number | null }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = facilities.map((f) => [f.lat, f.lng]);
    if (userLat && userLng) points.push([userLat, userLng]);
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [facilities, userLat, userLng, map]);

  return null;
}

export function FindCareMapImpl({
  facilities,
  userLat,
  userLng,
  onSelect,
}: {
  facilities: Facility[];
  userLat: number | null;
  userLng: number | null;
  onSelect: (f: Facility) => void;
}) {
  const center: [number, number] = userLat && userLng ? [userLat, userLng] : [40.7128, -74.006];

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds facilities={facilities} userLat={userLat} userLng={userLng} />

        {/* User location marker */}
        {userLat && userLng && (
          <CircleMarker
            center={[userLat, userLng]}
            radius={8}
            pathOptions={{ color: "#2dd4a0", fillColor: "#2dd4a0", fillOpacity: 0.8, weight: 2 }}
          >
            <Popup>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Your location</span>
            </Popup>
          </CircleMarker>
        )}

        {/* Facility markers */}
        {facilities.slice(0, 200).map((f, i) => (
          <CircleMarker
            key={`${f.name}-${f.lat}-${f.lng}-${i}`}
            center={[f.lat, f.lng]}
            radius={6}
            pathOptions={{
              color: TYPE_MARKER_COLORS[f.type],
              fillColor: TYPE_MARKER_COLORS[f.type],
              fillOpacity: 0.7,
              weight: 1.5,
            }}
            eventHandlers={{ click: () => onSelect(f) }}
          >
            <Popup>
              <div style={{ fontSize: 12, maxWidth: 200 }}>
                <strong>{f.name}</strong>
                <br />
                <span style={{ color: "#5a7a6e" }}>{f.typeLabel}</span>
                {f.distance != null && (
                  <>
                    <br />
                    <span style={{ color: "#2dd4a0", fontWeight: 600 }}>{f.distance} mi</span>
                  </>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
