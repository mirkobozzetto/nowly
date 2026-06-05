import { getAllPresenceSlugs, getPresenceMeta, getPresenceStats, getVersion } from "@/lib/redis"
import type { FastifyInstance } from "fastify"

export const registryRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", async (_request, _reply) => {
    const slugs = await getAllPresenceSlugs()
    const results = []
    for (const slug of slugs) {
      const [meta, stats, version] = await Promise.all([
        getPresenceMeta(slug),
        getPresenceStats(slug),
        getVersion(slug),
      ])

      if (meta) {
        results.push({
          ...meta,
          version: version || "",
          totalInstalls: stats.totalInstalls,
          activeUsers: stats.activeUsers,
          rating: stats.rating,
          ratingCount: stats.ratingCount,
          ratingDistribution: stats.ratingDistribution,
        })
      }
    }
    return results
  })
}
