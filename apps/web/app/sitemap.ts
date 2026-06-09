import { SITE_URL } from "@/lib/seo";
import { buildPresenceRichPresencePath, buildPresenceSeoPath } from "@/lib/seo-presence";
import { clientEnv } from "@nowly/env/client";
import type { MetadataRoute } from "next";

type PresenceSitemapItem = {
  slug?: string
  lastUpdated?: string
  addedAt?: string
};

const fetchPresencePages = async (): Promise<MetadataRoute.Sitemap> => {
  try {
    const res = await fetch(`${clientEnv.NEXT_PUBLIC_API_BASE_URL}/presences`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const presences = await res.json() as PresenceSitemapItem[];

    const validPresences = presences
      .filter((presence): presence is PresenceSitemapItem & { slug: string } => Boolean(presence.slug))
      .flatMap((presence) => {
        const lastModified = presence.lastUpdated ?? presence.addedAt ?? new Date();

        return [
          {
            url: `${SITE_URL}/library/${presence.slug}`,
            lastModified,
            changeFrequency: "weekly" as const,
            priority: 0.85,
          },
          {
            url: `${SITE_URL}${buildPresenceSeoPath(presence.slug)}`,
            lastModified,
            changeFrequency: "weekly" as const,
            priority: 0.95,
          },
          {
            url: `${SITE_URL}${buildPresenceRichPresencePath(presence.slug)}`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.75,
          },
        ];
      });

    return validPresences;
  } catch {
    return [];
  }
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const pages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/host`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/tos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // Documentation pages are intentionally excluded until the MDX content is ready.
  return [...pages, ...await fetchPresencePages()];
};

export default sitemap;