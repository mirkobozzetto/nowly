import { metadataToPlatform } from "@/lib/data/presence-adapter";
import { presenceApi } from "@/lib/presence-api";
import type { Metadata } from "@nowly/websites";
import { NextResponse } from "next/server";

interface EnrichedResponse extends Metadata {
  totalInstalls?: number
  activeUsers?: number
  rating?: number
  version?: string
  addedAt?: string
  lastUpdated?: string
}

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const data = await presenceApi.get<EnrichedResponse>(`/${slug}`);

  if (!data) {
    return NextResponse.json({ error: "Presence not found" }, { status: 404 });
  }

  const platform = metadataToPlatform(data);

  return NextResponse.json({
    ...platform,
    totalInstalls: data.totalInstalls ?? 0,
    activeUsers: data.activeUsers ?? 0,
    rating: data.rating ?? 0,
    version: data.version ?? platform.version,
    addedAt: data.addedAt ?? platform.addedAt,
    lastUpdated: data.lastUpdated ?? platform.lastUpdated,
  });
};
