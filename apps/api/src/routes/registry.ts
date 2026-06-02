import type { FastifyInstance } from "fastify"
import { getRegistry } from "@nowly/websites"

export const registryRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", async (_request, _reply) => {
    return getRegistry()
  })
}
