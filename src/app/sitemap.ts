import type { MetadataRoute } from "next";
import { neighborhoods } from "@/lib/neighborhoodData";

const BASE_URL = "https://pulsenyc.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const mainRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  const sectionRoutes: MetadataRoute.Sitemap = [
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
    "/active",
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
    priority: 0.8,
  }));

  const neighborhoodRoutes: MetadataRoute.Sitemap = neighborhoods.map((n) => ({
    url: `${BASE_URL}/neighborhood/${n.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...mainRoutes, ...sectionRoutes, ...neighborhoodRoutes];
}
