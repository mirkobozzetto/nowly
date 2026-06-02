import type { FastifyReply, FastifyRequest } from "fastify"

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const secret = process.env.API_SECRET_KEY
  if (!secret) return

  const auth = request.headers.authorization
  if (!auth || auth !== `Bearer ${secret}`) {
    reply.status(401).send({ error: "Unauthorized" })
  }
}
