import { incrementInstalls } from "@/lib/data/presence-stats";
import { NextResponse } from "next/server";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const total = await incrementInstalls(slug);
  return NextResponse.json({ totalInstalls: total });
};
