"use client";

import { useRef, useEffect } from "react";
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
}

function createPinMarker(icon: string, isChain: boolean): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.15s ease;";
  wrapper.addEventListener("mouseenter", () => { wrapper.style.transform = "scale(1.15)"; });
  wrapper.addEventListener("mouseleave", () => { wrapper.style.transform = "scale(1)"; });

  const circle = document.createElement("div");
  circle.style.cssText = `width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);background:${isChain ? "#4A7C59" : "#ffffff"};`;
  circle.textContent = icon;

  const tail = document.createElement("div");
  tail.style.cssText = `width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${isChain ? "#4A7C59" : "#ffffff"};margin-top:-1px;`;

  wrapper.appendChild(circle);
  wrapper.appendChild(tail);
  return wrapper;
}

export default function EatSmartMiniMap({ center, restaurants }: Props) {
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

      // Restaurant markers
      restaurants.forEach((r) => {
        const el = createPinMarker(r.icon, r.isChain);

        new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([r.lng, r.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: "280px" }).setHTML(r.popupHtml)
          )
          .addTo(map);
      });

      // Fit bounds
      if (restaurants.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([center[1], center[0]]);
        restaurants.forEach((r) => bounds.extend([r.lng, r.lat]));
        map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
      }
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], restaurants]);

  return <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />;
}
