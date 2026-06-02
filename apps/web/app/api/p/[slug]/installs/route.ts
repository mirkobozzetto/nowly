import { NextResponse } from "next/server";
import { presenceApi } from "@/lib/presence-api";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const data = await presenceApi.post(`/${slug}/installs`);

  if (!data) {
    return NextResponse.json({ error: "Failed to increment installs" }, { status: 500 });
  }

  return NextResponse.json(data);
};
