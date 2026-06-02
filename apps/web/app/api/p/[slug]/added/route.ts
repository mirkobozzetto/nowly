import { NextResponse } from "next/server";

const API_URL = process.env.PRESENCE_API_URL || "http://localhost:3001";
const API_SECRET_KEY = process.env.API_SECRET_KEY;

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${API_URL}/presences/${slug}/added`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(API_SECRET_KEY ? { Authorization: `Bearer ${API_SECRET_KEY}` } : {}),
    },
    body: JSON.stringify({ date: body.date }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed" }));
    return NextResponse.json(err, { status: res.status });
  }

  return NextResponse.json({ ok: true });
};
