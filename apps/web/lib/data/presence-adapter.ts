import type { Metadata } from "@nowly/websites/types";
import type { Contributor, Presence, PresenceCategory } from "./presences";

type ContributorInput = {
  name: string;
  github?: string;
  avatar?: string;
};

type MetadataWithStats = Metadata & {
  totalInstalls?: number
  activeUsers?: number
  rating?: number
  ratingCount?: number
  ratingDistribution?: Record<number, number>
};

const toContributor = (c: ContributorInput): Contributor => {
  return {
    name: c.name,
    github: c.github,
    avatar: c.github ? `https://github.com/${c.github}.png` : undefined,
  };
};

const FALLBACK_LOCALE = "en-US";

export const metadataToPlatform = (m: MetadataWithStats): Presence => {
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
    category: m.category as PresenceCategory,
    status: "available",
    version: m.version ?? null,
    activeUsers: m.activeUsers ?? 0,
    totalInstalls: m.totalInstalls ?? 0,
    rating: m.rating ?? 0,
    ratingCount: m.ratingCount ?? 0,
    ratingDistribution: m.ratingDistribution ?? {},
    addedAt: "2024-01-01",
    lastUpdated: new Date().toISOString().split("T")[0],
    supportedUrls: m.url,
    author: toContributor(m.author),
    contributors: (m.contributors ?? []).map(toContributor),
    features: m.features?.[FALLBACK_LOCALE] ?? [],
    settings: m.settings ?? undefined,
    localized: {
      description: m.description,
      longDescription: m.longDescription,
      features: m.features,
    },
  };
};