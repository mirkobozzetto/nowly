import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { PlatformDetailClient } from "@/components/library/platform-detail-client";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import { presenceApi } from "@/lib/presence-api";
import { PRESENCE_API_URL } from "@/lib/env";
import type { Metadata as PresenceMetadata } from "@nowly/websites";

const API_URL = PRESENCE_API_URL;

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    item: string
  }>
};

interface EnrichedResponse extends PresenceMetadata {
  totalInstalls?: number
  activeUsers?: number
  rating?: number
  ratingCount?: number
  ratingDistribution?: Record<number, number>
  version?: string
  addedAt?: string
  lastUpdated?: string
}

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { item: raw } = await params;
  const item = raw.toLowerCase();
  const data = await presenceApi.get<EnrichedResponse>(`/${item}`);

  if (!data) {
    return { title: "Not Found" };
  }

  const name = data.name ?? item;
  const title = `${name} Presence — Nowly`;
  const description = `Install the ${name} presence for Nowly and automatically display what you're watching on ${name} in your Discord status.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
    alternates: { canonical: `/library/${item}` },
  };
};

const PlatformDetailPage = async ({ params }: Props): Promise<ReactElement> => {
  const { item: raw } = await params;
  const item = raw.toLowerCase();
  const data: EnrichedResponse | null = await fetch(`${API_URL}/presences/${item}`).then((r) => r.ok ? r.json() : null);

  if (!data) {
    notFound();
  }

  const platform = metadataToPlatform(data);

  return (
    <PlatformDetailClient
      platform={{
        ...platform,
        totalInstalls: data.totalInstalls ?? 0,
        activeUsers: data.activeUsers ?? 0,
        rating: data.rating ?? 0,
        ratingCount: data.ratingCount ?? 0,
        ratingDistribution: data.ratingDistribution ?? {},
        version: data.version ?? platform.version,
        addedAt: data.addedAt ?? platform.addedAt,
        lastUpdated: data.lastUpdated ?? platform.lastUpdated,
      }}
    />
  );
};

export { generateMetadata };
export default PlatformDetailPage;
