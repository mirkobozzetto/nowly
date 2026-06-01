import { metadataToPlatform } from "@/lib/data/presence-adapter";
import { getPresenceStats } from "@/lib/data/presence-stats";
import { getPresence } from "@nowly/websites";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const presence = getPresence(slug);

  if (!presence) {
    return NextResponse.json({ error: "Presence not found" }, { status: 404 });
  }

  const platform = metadataToPlatform(presence);
  const stats = await getPresenceStats(slug);

  return NextResponse.json({
    ...platform,
    totalInstalls: stats.totalInstalls,
    activeUsers: stats.activeUsers,
    rating: stats.rating,
    version: stats.version ?? platform.version,
    addedAt: stats.addedAt ?? platform.addedAt,
    lastUpdated: stats.lastUpdated ?? platform.lastUpdated,
  });
};
