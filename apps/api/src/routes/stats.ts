import type { FastifyInstance } from "fastify"
import { incrementInstalls, setActiveUsers, submitRating } from "@/lib/redis"

export const statsRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/active", async (request, _reply) => {
    const body = request.body as { presences?: string[] }
    const slugs = body?.presences ?? []
    for (const slug of slugs) {
      await setActiveUsers(slug, 1)
    }
    return { ok: true, count: slugs.length }
  })

  fastify.post<{ Params: { slug: string } }>("/:slug/installs", async (request, _reply) => {
    const slug = request.params.slug.toLowerCase()
    const total = await incrementInstalls(slug)
    return { totalInstalls: total }
  })

  fastify.post<{ Params: { slug: string } }>("/:slug/heartbeat", async (request, _reply) => {
    const slug = request.params.slug.toLowerCase()
    const body = request.body as { activeUsers?: number }
    const count = typeof body?.activeUsers === "number" ? body.activeUsers : 1
    await setActiveUsers(slug, count)
    return { activeUsers: count }
  })

  fastify.post<{ Params: { slug: string } }>("/:slug/rating", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const body = request.body as { rating?: number }
    const rating = Number(body?.rating)

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return reply.status(400).send({ error: "Rating must be an integer between 1 and 5" })
    }

    const result = await submitRating(slug, rating)
    return result
  })
}
