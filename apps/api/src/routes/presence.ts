import type { FastifyInstance } from "fastify"
import { getPresence } from "@nowly/websites"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { PRESENCES_DIR } from "@/lib/paths"
import { canonicalJson, sha256Base64Url, signedPayload, signPresenceRelease } from "@/lib/crypto"
import { requireAuth } from "@/lib/api-auth"
import { type VersionEntry, addVersion, getPresenceStats, setVersion, setAdded, setUpdated, getVersionHistory } from "@/lib/redis"
import { generateChangelog } from "@/lib/openai"

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
    ratingDistribution: stats.ratingDistribution,
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

  fastify.get<{ Params: { slug: string } }>("/:slug/versions", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const history = await getVersionHistory(slug)
    return reply.send(history)
  })

  fastify.put<{ Params: { slug: string } }>("/:slug", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const slug = request.params.slug.toLowerCase()
    const body = request.body as { version?: string; added?: string; updated?: string; changelog?: string; author?: string; authorGithub?: string; pr?: string }

    if (body.version) {
      await setVersion(slug, body.version)
      if (body.changelog || body.author) {
        await addVersion(slug, {
          version: body.version,
          changelog: body.changelog ?? "",
          author: body.author ?? "unknown",
          authorGithub: body.authorGithub,
          pr: body.pr,
          timestamp: Date.now(),
        })
      }
    }
    if (body.added) await setAdded(slug, body.added)
    if (body.updated) await setUpdated(slug, body.updated)

    return { ok: true }
  })

  fastify.post("/sync", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const body = request.body as {
      presences: {
        slug: string
        type: "new" | "modified"
        name: string
        author?: string
        authorGithub?: string
        description?: string
      }[]
      pr?: string
      prTitle?: string
    }

    const results: { slug: string; version: string; changelog: string }[] = []

    for (const p of body.presences) {
      const stats = await getPresenceStats(p.slug)
      const currentVersion = stats.version
      const author = p.author || stats.version ? (await getVersionHistory(p.slug))[0]?.author || "unknown" : "unknown"

      if (p.type === "new" || !currentVersion) {
        const version = "1.0.0"
        const changelog = await generateChangelog({
          type: "new",
          name: p.name,
          description: p.description,
        })

        await setVersion(p.slug, version)
        await setAdded(p.slug)
        await addVersion(p.slug, {
          version,
          changelog,
          author,
          authorGithub: p.authorGithub,
          pr: body.pr,
          timestamp: Date.now(),
        })

        results.push({ slug: p.slug, version, changelog })
      } else {
        const parts = currentVersion.split(".").map(Number)
        parts[2] = (parts[2] || 0) + 1
        const nextVersion = parts.join(".")

        const changelog = await generateChangelog({
          type: "modified",
          name: p.name,
          prTitle: body.prTitle,
        })

        await setVersion(p.slug, nextVersion)
        await setUpdated(p.slug)
        await addVersion(p.slug, {
          version: nextVersion,
          changelog,
          author,
          authorGithub: p.authorGithub,
          pr: body.pr,
          timestamp: Date.now(),
        })

        results.push({ slug: p.slug, version: nextVersion, changelog })
      }
    }

    return { ok: true, results }
  })
}
