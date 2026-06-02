import type { FastifyInstance } from "fastify"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { PRESENCES_DIR } from "@/lib/paths"

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
}

export const assetsRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Params: { slug: string; type: string } }>("/:slug/assets/:type", async (request, reply) => {
    const { slug: raw, type } = request.params
    const slug = raw.toLowerCase()

    if (!["logo", "icon", "thumbnail"].includes(type)) {
      return reply.status(400).send({ error: "Invalid asset type" })
    }

    const allowed = ["png", "jpg", "jpeg"]
    const assetsDir = join(PRESENCES_DIR, slug, "assets")

    for (const ext of allowed) {
      const filePath = join(assetsDir, `${type}.${ext}`)
      if (existsSync(filePath)) {
        const buffer = readFileSync(filePath)
        const mime = MIME_TYPES[ext] ?? "application/octet-stream"
        return reply
          .header("Content-Type", mime)
          .header("Cache-Control", "public, max-age=31536000, immutable")
          .send(buffer)
      }
    }

    return reply.status(404).send({ error: "Asset not found" })
  })
}
