import type { FastifyInstance } from "fastify"
import { getPresence } from "@nowly/websites"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { PRESENCES_DIR } from "@/lib/paths"
import { canonicalJson, sha256Base64Url, signedPayload, signPresenceRelease } from "@/lib/crypto"
import { requireAuth } from "@/lib/api-auth"
import { getPresenceStats, setVersion, setAdded, setUpdated } from "@/lib/redis"

const buildRelease = async (slug: string) => {
  const metadata = getPresence(slug)
  if (!metadata) return null

  const bundlePath = join(PRESENCES_DIR, slug, "bundle.js")
  if (!existsSync(bundlePath)) return null

  const stats = await getPresenceStats(slug)
  const version = stats.version ?? metadata.version ?? "0.0.0"
  const bundle = readFileSync(bundlePath, "utf-8")
  const releaseMetadata = { ...metadata, slug, version }
  const sha256 = sha256Base64Url(bundle)
  const metadataHash = sha256Base64Url(canonicalJson(releaseMetadata))
  const signedAt = new Date().toISOString()
  const payload = signedPayload({ slug, version, sha256, metadataHash, signedAt })

  return {
    slug,
    version,
    metadata: releaseMetadata,
    bundle,
    sha256,
    metadataHash,
    signature: signPresenceRelease(payload),
    signedAt,
    totalInstalls: stats.totalInstalls,
    activeUsers: stats.activeUsers,
    rating: stats.rating,
    ratingCount: stats.ratingCount,
    addedAt: stats.addedAt,
    lastUpdated: stats.lastUpdated,
  }
}

export const presenceRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Params: { slug: string } }>("/:slug", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const release = await buildRelease(slug)

    if (!release) {
      return reply.status(404).send({ error: "Presence not found" })
    }

    return reply
      .header("Cache-Control", "no-store")
      .send(release)
  })

  fastify.put<{ Params: { slug: string } }>("/:slug", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const slug = request.params.slug.toLowerCase()
    const body = request.body as { version?: string; added?: string; updated?: string }

    if (body.version) await setVersion(slug, body.version)
    if (body.added) await setAdded(slug, body.added)
    if (body.updated) await setUpdated(slug, body.updated)

    return { ok: true }
  })
}
