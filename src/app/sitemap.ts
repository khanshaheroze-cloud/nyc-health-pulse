import type { MetadataRoute } from "next";
import { neighborhoods } from "@/lib/neighborhoodData";
import { CHAINS } from "@/lib/restaurantData";

const BASE_URL = "https://pulsenyc.app";

// Sitemap is FOOD-FIRST: the wedge surfaces (/; /eat-smart; /app; every live
// /restaurants/*; /guides/*) carry the priority. The 42 neighborhood health
// pages and legacy dashboards remain indexed but explicitly lower-priority —
// they were dominating the sitemap while /eat-smart and /app were omitted
// entirely (Jun 9 audit).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const foodRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/eat-smart`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/app`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/guides/healthy-lunch-under-15-long-island-city`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/restaurants`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const restaurantRoutes: MetadataRoute.Sitemap = CHAINS.map((c) => ({
    url: `${BASE_URL}/restaurants/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const healthRoutes: MetadataRoute.Sitemap = [
    "/air-quality",
    "/covid",
    "/flu",
    "/food-safety",
    "/grocery",
    "/environment",
    "/chronic-disease",
    "/overdose",
    "/maternal-health",
    "/nutrition",
    "/demographics",
    "/safety",
    "/health-data",
    "/neighborhood",
    "/workouts",
    "/nutrition-tracker",
    "/run-routes",
    "/run-outside",
    "/wellness",
    "/find-care",
    "/building-health",
    "/resources",
    "/sources",
    "/changelog",
    "/privacy",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  const neighborhoodRoutes: MetadataRoute.Sitemap = neighborhoods.map((n) => ({
    url: `${BASE_URL}/neighborhood/${n.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.3,
  }));

  return [...foodRoutes, ...restaurantRoutes, ...healthRoutes, ...neighborhoodRoutes];
}
