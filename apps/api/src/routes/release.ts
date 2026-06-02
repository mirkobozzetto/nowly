import type { FastifyInstance } from "fastify"
import { getPresence } from "@nowly/websites"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { PRESENCES_DIR } from "@/lib/paths"
import { canonicalJson, sha256Base64Url, signedPayload, signPresenceRelease } from "@/lib/crypto"
import { getPresenceStats } from "@/lib/redis"

export const releaseRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Params: { slug: string } }>("/:slug/release", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const metadata = getPresence(slug)

    if (!metadata) {
      return reply.status(404).send({ error: "Presence not found" })
    }

    const bundlePath = join(PRESENCES_DIR, slug, "bundle.js")
    if (!existsSync(bundlePath)) {
      return reply.status(404).send({ error: "Bundle not found" })
    }

    const stats = await getPresenceStats(slug)
    const version = stats.version ?? metadata.version ?? "0.0.0"
    const bundle = readFileSync(bundlePath, "utf-8")
    const releaseMetadata = { ...metadata, slug, version }
    const sha256 = sha256Base64Url(bundle)
    const metadataHash = sha256Base64Url(canonicalJson(releaseMetadata))
    const signedAt = new Date().toISOString()
    const payload = signedPayload({ slug, version, sha256, metadataHash, signedAt })

    return reply
      .header("Cache-Control", "no-store")
      .send({
        slug,
        version,
        metadata: releaseMetadata,
        bundle,
        sha256,
        metadataHash,
        signature: signPresenceRelease(payload),
        signedAt,
      })
  })
}
