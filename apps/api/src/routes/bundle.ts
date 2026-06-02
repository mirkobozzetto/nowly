import type { FastifyInstance } from "fastify"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { PRESENCES_DIR } from "@/lib/paths"

export const bundleRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Params: { slug: string } }>("/:slug/bundle", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const bundlePath = join(PRESENCES_DIR, slug, "bundle.js")

    if (!existsSync(bundlePath)) {
      return reply.status(404).send({ error: "Bundle not found" })
    }

    const bundle = readFileSync(bundlePath, "utf-8")
    return reply
      .header("Content-Type", "application/javascript; charset=utf-8")
      .header("Cache-Control", "no-store")
      .send(bundle)
  })
}
