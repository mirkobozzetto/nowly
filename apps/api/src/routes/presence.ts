import type { FastifyInstance } from "fastify"
import { getPresence } from "@nowly/websites"
import { getPresenceStats } from "@/lib/redis"

export const presenceRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Params: { slug: string } }>("/:slug", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const metadata = getPresence(slug)

    if (!metadata) {
      return reply.status(404).send({ error: "Presence not found" })
    }

    const stats = await getPresenceStats(slug)

    return {
      ...metadata,
      totalInstalls: stats.totalInstalls,
      activeUsers: stats.activeUsers,
      rating: stats.rating,
      version: stats.version ?? metadata.version,
      addedAt: stats.addedAt,
      lastUpdated: stats.lastUpdated,
    }
  })

  fastify.get<{ Params: { slug: string } }>("/:slug/metadata", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const metadata = getPresence(slug)

    if (!metadata) {
      return reply.status(404).send({ error: "Presence not found" })
    }

    const stats = await getPresenceStats(slug)

    return { ...metadata, version: stats.version ?? null }
  })
}
