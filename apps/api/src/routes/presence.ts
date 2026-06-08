import { requireAuth } from "@/lib/api-auth"
import { canonicalJson, sha256Base64Url, signedPayload, signPresenceRelease } from "@/lib/crypto"
import { generateChangelog, translateChangelog } from "@/lib/openai"
import { PRESENCES_DIR } from "@/lib/paths"
import { addVersion, getPresenceMeta, getPresenceStats, getVersionHistory, setAdded, setPresenceMeta, setUpdated, setVersion } from "@/lib/redis"
import { getPresence } from "@nowly/websites"
import type { FastifyInstance } from "fastify"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

type ReleasePerson = {
  name: string
  github?: string
}

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

const serializeJsonField = (value: unknown): string | undefined => {
  if (value == null) return undefined
  if (Array.isArray(value) && value.length === 0) return undefined
  return JSON.stringify(value)
}

const buildRelease = async (slug: string, version?: string) => {
  const localMeta = getPresence(slug)
  const redisMeta = await getPresenceMeta(slug)
  const metadata = { ...(localMeta ?? {}), ...(redisMeta ?? {}) } as Record<string, unknown>
  if (!Object.keys(metadata).length) return null

  const bundlePath = join(PRESENCES_DIR, slug, "bundle.js")

  let bundle: string | null = null

  if (existsSync(bundlePath)) {
    bundle = readFileSync(bundlePath, "utf-8")
  } else {
    try {
      const res = await fetch(`https://cdn.nowly.me/presences/${slug}/bundle.js`)
      if (res.ok) bundle = await res.text()
    } catch {}
  }

  if (!bundle) return null

  if (!metadata.settings) {
    try {
      const res = await fetch(`https://cdn.nowly.me/presences/${slug}/settings.json`)
      if (res.ok) {
        const raw = await res.text()
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object") {
          metadata.settings = parsed
          await setPresenceMeta(slug, metadata as Record<string, unknown>)
        }
      }
    } catch {}
  }

  const stats = await getPresenceStats(slug)
  const resolvedVersion = version ?? stats.version ?? metadata.version ?? "0.0.0"

  const releaseMetadata = {
    ...metadata,
    slug,
    version: resolvedVersion
  }
  
  const sha256 = sha256Base64Url(bundle)
  const metadataHash = sha256Base64Url(canonicalJson(releaseMetadata))
  const signedAt = new Date().toISOString()
  const payload = signedPayload({
    slug,
    version: String(resolvedVersion),
    sha256,
    metadataHash,
    signedAt
  })

  return {
    slug,
    version: resolvedVersion,
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

  fastify.get<{ Params: { slug: string; version: string } }>("/:slug/versions/:version", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const version = request.params.version
    const release = await buildRelease(slug, version)

    if (!release) {
      return reply.status(404).send({ error: "Version not found" })
    }

    return reply
      .header("Cache-Control", "no-store")
      .send(release)
  })

  fastify.put<{ Params: { slug: string } }>("/:slug", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const slug = request.params.slug.toLowerCase()
    const body = request.body as {
      version?: string;
      added?: string;
      updated?: string;
      changelog?: string;
      author?: string;
      authorGithub?: string;
      pr?: string
    }

    if (body.version) {
      await setVersion(slug, body.version)
      if (body.changelog || body.author) {
        await addVersion(slug, {
          version: body.version,
          changelog: body.changelog
            ? JSON.stringify({
              "en-US": body.changelog,
              "fr-FR": body.changelog,
              "es-ES": body.changelog
            })
            : "",
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
        category?: string
        author?: string
        authorGithub?: string
        releaseAuthor?: ReleasePerson
        releaseContributors?: ReleasePerson[]
        version?: string
        versionType?: string
        description?: Record<string, string>
        color?: string
        url?: string[]
        changelog?: string
        bundle?: string
        source?: "cli" | "pr"
        commitSha?: string
        changedFiles?: string[]
        diffSummary?: string
        metadata?: Record<string, any>
      }[]
      pr?: string
      prTitle?: string
      changes?: string
    }

    const results: { slug: string; version: string; changelog: string }[] = []
    const seen = new Set<string>()

    for (const p of body.presences) {
      if (seen.has(p.slug)) continue
      seen.add(p.slug)
      const stats = await getPresenceStats(p.slug)
      const currentVersion = stats.version
      const author = p.author || (stats.version ? (await getVersionHistory(p.slug))[0]?.author || "unknown" : "unknown")
      const aiGeneratedChangelog = !p.changelog
      const changelogs = p.changelog
        ? await translateChangelog(p.changelog)
        : await generateChangelog({
          type: p.type,
          name: p.name,
          prTitle: body.prTitle,
          changes: body.changes,
          changedFiles: p.changedFiles,
          diffSummary: p.diffSummary,
          ...(p.type === "new" ? { descriptions: p.description } : {}),
        })
      const changelog = JSON.stringify(changelogs)
      const displayChangelog = changelogs["en-US"] || ""
      const timestamp = Date.now()
      const createdAt = new Date(timestamp).toISOString()
      const bundleSizeBytes = p.bundle ? Buffer.byteLength(p.bundle, "utf-8") : undefined
      const bundleSha256 = p.bundle ? sha256Base64Url(p.bundle) : undefined
      const versionEntryMeta = {
        changelog,
        author,
        authorGithub: p.authorGithub,
        releaseAuthor: serializeJsonField(p.releaseAuthor),
        releaseContributors: serializeJsonField(p.releaseContributors),
        pr: body.pr,
        source: p.source ?? (body.pr ? "pr" as const : "cli" as const),
        commitSha: p.commitSha,
        changedFiles: serializeJsonField(p.changedFiles),
        bundleSizeBytes,
        bundleSizeLabel: bundleSizeBytes != null ? formatBytes(bundleSizeBytes) : undefined,
        bundleSha256,
        versionType: p.versionType,
        aiGeneratedChangelog,
        createdAt,
        timestamp,
      }

      if (p.type === "new" || !currentVersion) {
        const version = p.version ?? "1.0.0"

        await setVersion(p.slug, version)
        await setAdded(p.slug)
        await addVersion(p.slug, {
          version,
          ...versionEntryMeta,
          versionType: p.versionType ?? "new",
        })

        results.push({ slug: p.slug, version, changelog: displayChangelog })
      } else {
        const parts = currentVersion.split(".").map(Number)
        parts[2] = (parts[2] || 0) + 1
        const nextVersion = p.version ?? parts.join(".")

        await setVersion(p.slug, nextVersion)
        await setUpdated(p.slug)
        await addVersion(p.slug, {
          version: nextVersion,
          ...versionEntryMeta,
          versionType: p.versionType ?? "patch",
        })

        results.push({ slug: p.slug, version: nextVersion, changelog: displayChangelog })
      }

      if (p.metadata) {
        await setPresenceMeta(p.slug, p.metadata as any)
      } else {
        await setPresenceMeta(p.slug, {
          slug: p.slug,
          name: p.name,
          author,
          category: p.category || "",
          description: p.description || {},
          color: p.color,
          url: p.url,
        })
      }
    }

    return { ok: true, results }
  })
}
