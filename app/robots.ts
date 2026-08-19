import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://realitydiffusion.ai/sitemap.xml",
    host: "https://realitydiffusion.ai",
  };
}
