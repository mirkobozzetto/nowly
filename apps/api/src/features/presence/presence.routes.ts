import { buildLocaleObject } from "@nowly/locales"
import { requireAuth } from "@/features/auth/auth.middleware"
import { generateChangelog, translateChangelog } from "@/shared/openai.service"
import { sha256Base64Url } from "@/shared/crypto.service"
import { serializeJsonField, buildRelease } from "./presence.service"
import {
  addVersion, getAllPresenceSlugs, getPresenceMeta, getPresenceStats, getVersionHistory,
  setAdded, setPresenceMeta, setUpdated, setVersion,
  markActiveDevice, clearActiveDevice, clearActiveDevicesForDevice,
  setActiveUsers,
} from "./presence.repository"
import type { FastifyInstance } from "fastify"

type ReleasePerson = {
  name: string
  github?: string
}

export const presenceRoutes = async (fastify: FastifyInstance) => {
  fastify.get("", async (_request, _reply) => {
    const slugs = await getAllPresenceSlugs()
    const results = await Promise.all(slugs.map(async (slug) => {
      const [meta, stats] = await Promise.all([
        getPresenceMeta(slug),
        getPresenceStats(slug),
      ])

      if (!meta) return null

      return {
        ...meta,
        version: stats.version || "",
        totalInstalls: stats.totalInstalls,
        activeUsers: stats.activeUsers,
        rating: stats.rating,
        ratingCount: stats.ratingCount,
        ratingDistribution: stats.ratingDistribution,
      }
    }))

    return results.filter((result) => result !== null)
  })

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
            ? JSON.stringify(buildLocaleObject(body.changelog))
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

  fastify.post("/active", async (request, _reply) => {
    const body = request.body as { presences?: string[]; deviceId?: string }
    const slugs = body?.presences ?? []
    const deviceId = body?.deviceId?.trim()

    if (!deviceId) {
      for (const slug of slugs) {
        await setActiveUsers(slug, 1)
      }

      return {
        ok: true,
        count: slugs.length,
      }
    }

    for (const slug of slugs) {
      await markActiveDevice(slug, deviceId)
    }

    return {
      ok: true,
      count: slugs.length
    }
  })

  fastify.delete<{ Params: { deviceId: string; slug?: string } }>("/active/:deviceId/:slug?", async (request, _reply) => {
    const deviceId = request.params.deviceId.trim()
    const slug = request.params.slug?.trim()

    if (!deviceId) {
      return { ok: false, error: "deviceId is required" }
    }

    if (slug) {
      await clearActiveDevice(slug, deviceId)
      return { ok: true, removed: 1 }
    }

    await clearActiveDevicesForDevice(deviceId)
    return { ok: true, removed: null }
  })

  fastify.post<{ Params: { slug: string } }>("/:slug/installs", async (_request, reply) => {
    return reply.status(410).send({
      error: "Presence install counters are synced by the extension via /devices/sync",
    })
  })
}

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(presenceRoutes, { prefix: "/presences" })
}
