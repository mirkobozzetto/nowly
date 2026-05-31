import type { Metadata } from "@presence/websites/types";
import type { Platform, PlatformCategory, Contributor } from "./platforms";

function toContributor(c: { name: string; github?: string }): Contributor {
  return {
    name: c.name,
    github: c.github,
    avatar: c.github ? `https://github.com/${c.github}.png` : undefined,
  };
}

const FALLBACK_LOCALE = "en-US";

export function metadataToPlatform(m: Metadata): Platform {
  const slug = m.slug ?? m.name.toLowerCase().replace(/\s+/g, "-");
  const desc = m.description?.[FALLBACK_LOCALE] ?? "";
  return {
    id: slug,
    slug,
    name: m.name,
    description: desc,
    longDescription: m.longDescription?.[FALLBACK_LOCALE] ?? desc,
    icon: slug,
    iconColor: m.color,
    category: m.category as PlatformCategory,
    status: "available",
    activeUsers: 0,
    totalInstalls: 0,
    rating: 0,
    addedAt: "2024-01-01",
    lastUpdated: new Date().toISOString().split("T")[0],
    supportedUrls: m.url,
    author: toContributor(m.author),
    contributors: (m.contributors ?? []).map(toContributor),
    features: m.features?.[FALLBACK_LOCALE] ?? [],
    localized: {
      description: m.description,
      longDescription: m.longDescription,
      features: m.features,
    },
  };
}
