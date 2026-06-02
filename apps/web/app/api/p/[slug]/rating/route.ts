import { NextResponse } from "next/server";
import { presenceApi } from "@/lib/presence-api";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const body = await request.json();
  const rating = Number(body.rating);

  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
  }

  const data = await presenceApi.post(`/${slug}/rating`, { rating });

  if (!data) {
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }

  return NextResponse.json(data);
};
