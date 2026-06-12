import { CommentsClient } from "@/components/library/comments-client";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import { createMetadata } from "@/lib/seo";
import { clientEnv } from "@nowly/env/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { fetchPresence } from "../fetch-presence";

type Props = {
  params: Promise<{
    item: string
  }>
};

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { item: raw } = await params;
  const item = raw.toLowerCase();
  const data = await fetchPresence(clientEnv.PRESENCE_API_URL, item);

  if (!data) {
    return { title: "Not Found" };
  }

  const name = data.metadata?.name ?? item;

  return createMetadata({
    title: `${name} Presence Comments`,
    description: `Read community comments and ratings for the ${name} Discord Rich Presence on Nowly.`,
    path: `/library/${item}/comments`,
    image: `/api/og/presence/${item}`,
    noIndex: true,
  });
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
    <CommentsClient
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
