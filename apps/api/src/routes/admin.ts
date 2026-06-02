import type { FastifyInstance } from "fastify"
import { requireAuth } from "@/lib/api-auth"
import { setVersion, setAdded, setUpdated } from "@/lib/redis"

export const adminRoutes = async (fastify: FastifyInstance) => {
  fastify.put<{ Params: { slug: string } }>("/:slug/version", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const slug = request.params.slug.toLowerCase()
    const body = request.body as { version?: string }
    if (!body.version) {
      return reply.status(400).send({ error: "version is required" })
    }
    await setVersion(slug, body.version)
    return { ok: true }
  })

  fastify.put<{ Params: { slug: string } }>("/:slug/added", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const slug = request.params.slug.toLowerCase()
    const body = request.body as { date?: string }
    await setAdded(slug, body.date ?? undefined)
    return { ok: true }
  })

  fastify.put<{ Params: { slug: string } }>("/:slug/updated", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const slug = request.params.slug.toLowerCase()
    const body = request.body as { date?: string }
    await setUpdated(slug, body.date ?? undefined)
    return { ok: true }
  })
}
