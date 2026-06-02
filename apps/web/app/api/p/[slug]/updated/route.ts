import { NextResponse } from "next/server";
import { API_SECRET_KEY, PRESENCE_API_URL } from "@/lib/env";

const API_URL = PRESENCE_API_URL;

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${API_URL}/presences/${slug}/updated`, {
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
