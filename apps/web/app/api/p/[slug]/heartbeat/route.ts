import { NextResponse } from "next/server";
import { presenceApi } from "@/lib/presence-api";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const body = await request.json();
  const data = await presenceApi.post(`/${slug}/heartbeat`, body);

  if (!data) {
    return NextResponse.json({ error: "Failed to update heartbeat" }, { status: 500 });
  }

  return NextResponse.json(data);
};
