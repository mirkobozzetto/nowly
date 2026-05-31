import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const PRESENCES_DIR = join(resolve(process.cwd(), "..", ".."), "packages", "websites", "dist", "presences");

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const bundlePath = join(PRESENCES_DIR, slug, "bundle.js");

  if (!existsSync(bundlePath)) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  const bundle = readFileSync(bundlePath, "utf-8");
  return new NextResponse(bundle, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
