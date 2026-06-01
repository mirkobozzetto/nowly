import { getPresence } from "@nowly/websites";
import { NextResponse } from "next/server";
import { getPresenceStats } from "@/lib/data/presence-stats";

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

  const stats = await getPresenceStats(slug);

  return NextResponse.json({ ...presence, version: stats.version ?? null });
};
