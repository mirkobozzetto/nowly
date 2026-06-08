import { PresenceDetailClient } from "@/components/library/presence-detail/presence-detail-client";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import { presenceApi } from "@/lib/presence-api";
import { clientEnv } from "@nowly/env/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { fetchPresence, type PresenceRelease } from "./fetch-presence";

type Props = {
  params: Promise<{
    item: string
  }>
};

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { item: raw } = await params;
  const item = raw.toLowerCase();
  const data = await presenceApi.get<PresenceRelease>(`/${item}`).catch(() => null);

  if (!data) {
    return { title: "Not Found" };
  }

  const name = data.metadata?.name ?? item;
  const title = `${name} — Nowly`;
  const description = `Install the ${name} presence for Nowly and automatically display what you're watching on ${name} in your Discord status.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
    alternates: { canonical: `/library/${item}` },
  };
};

const Page = async ({ params }: Props): Promise<ReactElement> => {
  const { item: raw } = await params;
  const item = raw.toLowerCase();
  const data = await fetchPresence(clientEnv.PRESENCE_API_URL, item);

  if (!data) {
    notFound();
  }

  const presence = metadataToPlatform(data.metadata);

  return (
    <PresenceDetailClient
      presence={{
        ...presence,
        totalInstalls: data.totalInstalls ?? 0,
        activeUsers: data.activeUsers ?? 0,
        rating: data.rating ?? 0,
        ratingCount: data.ratingCount ?? 0,
        ratingDistribution: data.ratingDistribution ?? {},
        version: data.version ?? presence.version,
        addedAt: data.addedAt ?? presence.addedAt,
        lastUpdated: data.lastUpdated ?? presence.lastUpdated,
      }}
    />
  );
};

export { generateMetadata };

export default Page;