import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://taleden.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/movies`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/recommendations`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/taste-match`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/passport`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.4 },
    { url: `${base}/watch-rooms`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.4 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
  ];
}
