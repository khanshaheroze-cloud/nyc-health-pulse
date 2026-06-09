"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ResultSpot } from "./LiveResultsStrip";
import { openDirections } from "@/lib/openDirections";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeYouAreHereIcon() {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:white;border:3px solid #2F8F4D;box-shadow:0 0 0 4px rgba(47,143,77,0.25);" class="map-pulse"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function makeSpotIcon(rank: number) {
  const bg = rank === 1 ? "#1A1A1A" : "#4A4A4A";
  return L.divIcon({
    html: `<div style="width:22px;height:22px;border-radius:11px;background:${bg};color:white;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid white;">${rank}</div>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function FitBounds({ center, spots }: { center: { lat: number; lng: number }; spots: ResultSpot[] }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [[center.lat, center.lng]];
    spots.forEach(s => {
      if (s.lat && s.lng) points.push([s.lat, s.lng]);
    });
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 17 });
    } else {
      map.setView([center.lat, center.lng], 17);
    }
  }, [map, center, spots]);
  return null;
}

interface LocalMapProps {
  center: { lat: number; lng: number };
  spots: ResultSpot[];
  isDefault: boolean;
  onSpotClick: (slug: string) => void;
  onVisible: () => void;
  visible: boolean;
}

export function LocalMap({ center, spots, isDefault, onSpotClick, onVisible, visible }: LocalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible || !containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { onVisible(); obs.disconnect(); } },
      { rootMargin: "200px" }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [visible, onVisible]);

  return (
    <div className="bg-white border border-[#E6E5DE] rounded-[18px] overflow-hidden" ref={containerRef}>
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] tracking-[1px] uppercase text-[#6B716B] font-semibold">
          📍 3 block radius
        </span>
        {/* TODO: implement expand radius to 6 blocks */}
        <span className="text-[12px] text-[#2A6BC9] cursor-default opacity-50">
          Expand radius ›
        </span>
      </div>

      {/* Default location hint */}
      {isDefault && (
        <p className="px-3 pb-1 text-[11px] text-[#6B716B] italic">
          Showing near Times Square — set your location for a personalized view.
        </p>
      )}

      {/* Map container */}
      <div className="h-[200px] min-[1100px]:h-[260px]">
        {visible ? (
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={17}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <FitBounds center={center} spots={spots} />

            {/* You are here */}
            <Marker position={[center.lat, center.lng]} icon={makeYouAreHereIcon()}>
              <Popup>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>You are here</span>
              </Popup>
            </Marker>

            {/* Spot pins */}
            {spots.map((spot, i) => {
              if (!spot.lat || !spot.lng) return null;
              return (
                <Marker
                  key={spot.slug + spot.address}
                  position={[spot.lat, spot.lng]}
                  icon={makeSpotIcon(i + 1)}
                >
                  <Popup>
                    <div style={{ minWidth: 160, fontSize: "12px" }}>
                      <strong style={{ fontSize: "13px" }}>{spot.name}</strong>
                      <div style={{ display: "flex", gap: 6, marginTop: 4, marginBottom: 6 }}>
                        <span style={{ color: "#2A6BC9" }}>{spot.walkMinutes} min</span>
                        <span style={{ color: "#2F8F4D" }}>{spot.topPickProtein}g protein</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => onSpotClick(spot.slug)}
                          style={{ color: "#2A6BC9", fontWeight: 500, cursor: "pointer", background: "none", border: "none", padding: 0, fontSize: "12px" }}
                        >
                          Open details
                        </button>
                        <button
                          onClick={() => openDirections({ lat: spot.lat, lng: spot.lng, address: spot.address, name: spot.name })}
                          style={{ color: "#2A6BC9", fontWeight: 500, cursor: "pointer", background: "none", border: "none", padding: 0, fontSize: "12px" }}
                        >
                          Directions
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <div className="w-full h-full bg-[#F5F0EB] flex items-center justify-center text-[12px] text-[#6B716B]">
            Loading map…
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between text-[11px] text-[#6B716B]">
        <span>Click a pin for quick details</span>
        <button
          onClick={() => window.dispatchEvent(new Event("pulse-refresh-location"))}
          className="hover:text-[#1A1A1A] transition-colors"
          aria-label="Refresh map"
        >
          ↻ Refresh
        </button>
      </div>

      {/* SR-only list fallback */}
      <ul className="sr-only" aria-label="Nearby spots list">
        {spots.map((s, i) => (
          <li key={i}>{i + 1}. {s.name} — {s.walkMinutes} min walk, {s.topPickProtein}g protein. {s.address}</li>
        ))}
      </ul>
    </div>
  );
}
