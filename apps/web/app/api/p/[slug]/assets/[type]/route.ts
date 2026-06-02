import { NextResponse } from "next/server";
import { PRESENCE_API_URL } from "@/lib/env";

const API_URL = PRESENCE_API_URL;

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string; type: string }> },
) => {
  const { slug: raw, type } = await params;
  const slug = raw.toLowerCase();

  if (!["logo", "icon", "thumbnail"].includes(type)) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/presences/${slug}/assets/${type}`);

  if (!res.ok) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
