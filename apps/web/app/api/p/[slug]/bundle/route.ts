import { NextResponse } from "next/server";
import { PRESENCE_API_URL } from "@/lib/env";

const API_URL = PRESENCE_API_URL;

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const res = await fetch(`${API_URL}/presences/${slug}/bundle`);

  if (!res.ok) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  const bundle = await res.text();
  return new NextResponse(bundle, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
