import { getPresence } from "@nowly/websites";
import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { canonicalJson, sha256Base64Url, signedPayload, signPresenceRelease } from "@/lib/crypto/presence-release";
import { getPresenceStats } from "@/lib/data/presence-stats";

const PRESENCES_DIR = join(resolve(process.cwd(), "..", ".."), "packages", "websites", "dist", "presences");

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  const metadata = getPresence(slug);

  if (!metadata) {
    return NextResponse.json({ error: "Presence not found" }, { status: 404 });
  }

  const bundlePath = join(PRESENCES_DIR, slug, "bundle.js");
  if (!existsSync(bundlePath)) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  const stats = await getPresenceStats(slug);
  const version = stats.version ?? metadata.version ?? "0.0.0";
  const bundle = readFileSync(bundlePath, "utf-8");
  const releaseMetadata = { ...metadata, slug, version };
  const sha256 = sha256Base64Url(bundle);
  const metadataHash = sha256Base64Url(canonicalJson(releaseMetadata));
  const signedAt = new Date().toISOString();
  const payload = signedPayload({ slug, version, sha256, metadataHash, signedAt });

  return NextResponse.json(
    {
      slug,
      version,
      metadata: releaseMetadata,
      bundle,
      sha256,
      metadataHash,
      signature: signPresenceRelease(payload),
      signedAt,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};
