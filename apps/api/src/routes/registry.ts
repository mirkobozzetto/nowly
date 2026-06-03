import type { FastifyInstance } from "fastify"
import { getAllPresenceSlugs, getPresenceMeta, getVersion } from "@/lib/redis"

export const registryRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", async (_request, _reply) => {
    const slugs = await getAllPresenceSlugs()
    const results = []
    for (const slug of slugs) {
      const meta = await getPresenceMeta(slug)
      const version = await getVersion(slug)
      if (meta) {
        results.push({ ...meta, version: version || "" })
      }
    }
    return results
  })
}
