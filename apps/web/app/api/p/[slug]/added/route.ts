import { requireAuth } from "@/lib/api-auth";
import { setAdded } from "@/lib/data/presence-stats";
import { NextResponse } from "next/server";

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const auth = requireAuth(request);
  if (auth) return auth;

  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const body = await request.json().catch(() => ({}));
  await setAdded(slug, body.date ?? undefined);
  return NextResponse.json({ ok: true });
};
