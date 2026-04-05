"use client";

import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface MiniMapRestaurant {
  name: string;
  cuisine: string;
  grade: string | null;
  lat: number;
  lng: number;
  distance: number;
  isChain: boolean;
  icon: string;
  popupHtml: string;
}

interface Props {
  center: [number, number]; // [lat, lng]
  restaurants: MiniMapRestaurant[];
  selectedIndex?: number | null;
}

function createPinMarker(icon: string, isChain: boolean): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";

  const circle = document.createElement("div");
  const bg = isChain ? "#4A7C59" : "#ffffff";
  const textColor = isChain ? "white" : "#374151";
  circle.style.cssText = `width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25);background:${bg};color:${textColor};transition:transform 0.15s ease,box-shadow 0.15s ease;`;
  circle.textContent = icon;

  const tail = document.createElement("div");
  tail.style.cssText = `width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${bg};margin-top:-1px;`;

  // Hover effect on the CIRCLE only — not the wrapper (avoids Mapbox transform conflict)
  wrapper.addEventListener("mouseenter", () => {
    circle.style.transform = "scale(1.15)";
    circle.style.boxShadow = "0 4px 12px rgba(0,0,0,.35)";
  });
  wrapper.addEventListener("mouseleave", () => {
    circle.style.transform = "scale(1)";
    circle.style.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
  });

  wrapper.appendChild(circle);
  wrapper.appendChild(tail);
  return wrapper;
}

export default function EatSmartMiniMap({ center, restaurants, selectedIndex }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center[1], center[0]],
      zoom: 15,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      // User location dot
      const userEl = document.createElement("div");
      userEl.style.cssText = "width:14px;height:14px;border-radius:50%;background:#5b9cf5;border:3px solid white;box-shadow:0 0 0 2px #5b9cf5,0 2px 8px rgba(0,0,0,.3);";
      new mapboxgl.Marker({ element: userEl }).setLngLat([center[1], center[0]]).addTo(map);
      setMapReady(true);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; setMapReady(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);

  // Update markers when restaurants change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    restaurants.forEach((r) => {
      const el = createPinMarker(r.icon, r.isChain);
      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([r.lng, r.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: "280px" }).setHTML(r.popupHtml)
        )
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (restaurants.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([center[1], center[0]]);
      restaurants.forEach((r) => bounds.extend([r.lng, r.lat]));
      map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
    }
  }, [restaurants, center, mapReady]);

  // Fly to selected restaurant
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedIndex == null || selectedIndex < 0) return;
    const marker = markersRef.current[selectedIndex];
    if (!marker) return;

    markersRef.current.forEach((m) => m.getPopup()?.isOpen() && m.togglePopup());
    const lngLat = marker.getLngLat();
    map.flyTo({ center: lngLat, zoom: 16, duration: 600 });
    setTimeout(() => {
      if (!marker.getPopup()?.isOpen()) marker.togglePopup();
    }, 650);
  }, [selectedIndex]);

  return <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />;
}
