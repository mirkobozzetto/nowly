import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const PRESENCES_DIR = join(resolve(process.cwd(), "..", ".."), "packages", "websites", "dist", "presences");

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string; type: string }> },
) => {
  const { slug: raw, type } = await params;
  const slug = raw.toLowerCase();

  if (!["logo", "icon", "thumbnail"].includes(type)) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  const allowed = ["png", "jpg", "jpeg"];
  const assetsDir = join(PRESENCES_DIR, slug, "assets");

  for (const ext of allowed) {
    const filePath = join(assetsDir, `${type}.${ext}`);
    if (existsSync(filePath)) {
      const buffer = readFileSync(filePath);
      const mime = MIME_TYPES[ext] ?? "application/octet-stream";
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  return NextResponse.json({ error: "Asset not found" }, { status: 404 });
};
