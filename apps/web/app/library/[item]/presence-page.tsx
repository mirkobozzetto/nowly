import { PresenceDetailClient } from "@/components/library/presence-detail/presence-detail-client";
import { PresenceStructuredData } from "@/components/seo/presence-structured-data";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import { createMetadata } from "@/lib/seo";
import { clientEnv } from "@nowly/env/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { fetchPresence, type PresenceRelease } from "./fetch-presence";

export const createPresenceMetadata = (
  item: string,
  data: PresenceRelease,
  canonicalPath: string
): Metadata => {
  const name = data.metadata?.name ?? item;

  return createMetadata({
    title: `${name} Discord Rich Presence`,
    description: `Install the ${name} Discord Rich Presence for Nowly and automatically show what you're watching on ${name} in your Discord status.`,
    path: canonicalPath,
    image: `/api/og/presence/${item}`,
    keywords: [`${name} Discord Rich Presence`, `${name} Discord status`, `${name} presence`],
  });
};

export const renderPresencePage = async (
  item: string,
  structuredDataSlug = item
): Promise<ReactElement> => {
  const data = await fetchPresence(clientEnv.PRESENCE_API_URL, item);

  if (!data) {
    notFound();
  }

  const presence = metadataToPlatform(data.metadata);

  const presenceWithStats = {
    ...presence,
    totalInstalls: data.totalInstalls ?? 0,
    activeUsers: data.activeUsers ?? 0,
    rating: data.rating ?? 0,
    ratingCount: data.ratingCount ?? 0,
    ratingDistribution: data.ratingDistribution ?? {},
    version: data.version ?? presence.version,
    addedAt: data.addedAt ?? presence.addedAt,
    lastUpdated: data.lastUpdated ?? presence.lastUpdated,
  };

  return (
    <>
      <PresenceStructuredData presence={presenceWithStats} slug={structuredDataSlug} />
      <PresenceDetailClient presence={presenceWithStats} />
    </>
  );
};
