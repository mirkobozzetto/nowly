import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { PlatformDetailClient } from "@/components/library/platform-detail-client";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import { getPresenceStats } from "@/lib/data/presence-stats";
import { getPresence, getRegistry } from "@nowly/websites";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    item: string
  }>
};

const generateStaticParams = () => {
  const registry = getRegistry();
  return registry.map((m) => ({
    item: m.slug,
  }));
};

const PlatformDetailPage = async ({ params }: Props): Promise<ReactElement> => {
  const { item: raw } = await params;
  const item = raw.toLowerCase();
  const metadata = getPresence(item);
  const platform = metadata ? metadataToPlatform(metadata) : undefined;

  if (!platform) {
    notFound();
  }

  const stats = await getPresenceStats(item);

  return (
    <PlatformDetailClient
      platform={{
        ...platform,
        totalInstalls: stats.totalInstalls,
        activeUsers: stats.activeUsers,
        rating: stats.rating,
        version: stats.version ?? platform.version,
        addedAt: stats.addedAt ?? platform.addedAt,
        lastUpdated: stats.lastUpdated ?? platform.lastUpdated,
      }}
    />
  );
};

export { generateStaticParams };
export default PlatformDetailPage;
