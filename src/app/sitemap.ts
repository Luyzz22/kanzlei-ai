import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.kanzlei-ai.com"
  const now = new Date().toISOString()
  
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/produkt`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/preise`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/loesungen`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/loesungen/kanzleien`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/loesungen/rechtsabteilungen`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/trust-center`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/integrationen`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/sicherheit-compliance`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/enterprise-kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/hilfe`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/release-notes`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/datenschutz`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/impressum`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/avv`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]
}
