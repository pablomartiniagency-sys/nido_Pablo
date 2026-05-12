import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://nido.app", lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: "https://nido.app/casos/rosa", lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
  ];
}
