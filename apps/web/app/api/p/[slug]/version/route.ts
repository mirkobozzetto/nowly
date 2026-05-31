import { requireAuth } from "@/lib/api-auth";
import { setVersion } from "@/lib/data/presence-stats";
import { NextResponse } from "next/server";

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const auth = requireAuth(request);
  if (auth) return auth;

  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const body = await request.json();
  if (!body.version) {
    return NextResponse.json({ error: "version is required" }, { status: 400 });
  }
  await setVersion(slug, body.version);
  return NextResponse.json({ ok: true });
};
