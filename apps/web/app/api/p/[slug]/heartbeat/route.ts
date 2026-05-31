import { setActiveUsers } from "@/lib/data/presence-stats";
import { NextResponse } from "next/server";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const body = await request.json();
  const count = typeof body.activeUsers === "number" ? body.activeUsers : 1;
  await setActiveUsers(slug, count);
  return NextResponse.json({ activeUsers: count });
};
