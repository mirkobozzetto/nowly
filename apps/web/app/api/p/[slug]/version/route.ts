import { NextResponse } from "next/server";
import { presenceApi } from "@/lib/presence-api";
import { API_SECRET_KEY, PRESENCE_API_URL } from "@/lib/env";

const API_URL = PRESENCE_API_URL;

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const body = await request.json();
  if (!body.version) {
    return NextResponse.json({ error: "version is required" }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/presences/${slug}/version`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(API_SECRET_KEY ? { Authorization: `Bearer ${API_SECRET_KEY}` } : {}),
    },
    body: JSON.stringify({ version: body.version }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed" }));
    return NextResponse.json(err, { status: res.status });
  }

  return NextResponse.json({ ok: true });
};
