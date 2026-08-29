import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { recentPersons } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/persons`, priority: 0.9 },
    { url: `${SITE_URL}/report`, priority: 0.8 },
    { url: `${SITE_URL}/updates`, priority: 0.7 },
    { url: `${SITE_URL}/official`, priority: 0.6 },
    { url: `${SITE_URL}/about`, priority: 0.3 },
  ];

  try {
    const recent = await recentPersons(500);
    return [
      ...staticPages,
      ...recent.map((p) => ({
        url: `${SITE_URL}/persons/${p.id}`,
        lastModified: p.updatedAt,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticPages;
  }
}
