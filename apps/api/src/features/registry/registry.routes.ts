import { getAllPresenceSlugs, getPresenceMeta, getPresenceStats } from "@/features/presence/presence.repository"
import type { FastifyInstance } from "fastify"

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(registryRoutes, { prefix: "/presences" })
}

export const registryRoutes = async (fastify: FastifyInstance) => {
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
}
