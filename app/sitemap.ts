import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://realitydiffusion.ai",
      lastModified: new Date("2026-08-19T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
