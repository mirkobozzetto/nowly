import { NextResponse } from "next/server";
import { presenceApi } from "@/lib/presence-api";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const data = await presenceApi.get(`/${slug}/metadata`);

  if (!data) {
    return NextResponse.json({ error: "Presence not found" }, { status: 404 });
  }

  return NextResponse.json(data);
};
