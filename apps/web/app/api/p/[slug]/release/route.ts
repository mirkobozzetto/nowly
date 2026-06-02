import { NextResponse } from "next/server";

const API_URL = process.env.PRESENCE_API_URL || "http://localhost:3001";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const res = await fetch(`${API_URL}/presences/${slug}/release`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Not found" }));
    return NextResponse.json(err, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
};
