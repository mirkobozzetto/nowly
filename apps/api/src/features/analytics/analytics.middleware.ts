import { verifyToken } from "@/features/auth/auth.service"
import { serverEnv } from "@nowly/env/server"
import type { FastifyReply, FastifyRequest } from "fastify"

const allowedFromEnv = (): Set<string> => new Set((serverEnv.ANALYTICS_ALLOWED_DISCORD_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean),
)

export const requireAnalyticsAccess = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> => {
  const auth = request.headers.authorization
  if (!auth?.startsWith("Bearer ")) {
    reply.status(401).send({ error: "Authentication required" })
    return false
  }

  const user = verifyToken(auth.slice(7))
  if (!user) {
    reply.status(401).send({ error: "Invalid or expired token" })
    return false
  }

  if (!allowedFromEnv().has(user.discordId)) {
    reply.status(403).send({ error: "Analytics access denied" })
    return false
  }

  return true
}
