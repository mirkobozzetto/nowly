import { getPrisma } from "@/db/client"
import { hashDiscordId, verifyToken, type DiscordUser } from "@/features/auth/auth.service"
import {
  getPresenceStats, getUserRating,
  hasDiscordRated, markDiscordRated,
  removeUserRating, setUserRating,
  submitRating,
} from "@/features/presence/presence.repository"
import { submitComment, getComments } from "@/features/rating/rating.repository"
import { ratingCommentBodySchema } from "@nowly/shared/schemas"
import type { FastifyInstance, FastifyRequest } from "fastify"

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(ratingRoutes, { prefix: "/presences" })
}

// SEC-10: accept the user JWT from either the standard `Authorization` header
// or the legacy `x-user-token` header so every route uses one consistent path.
const getBearerUser = (request: FastifyRequest): DiscordUser | null => {
  const header = request.headers.authorization ?? (request.headers["x-user-token"] as string | undefined)
  if (!header?.startsWith("Bearer ")) return null
  return verifyToken(header.slice(7))
}

export const ratingRoutes = async (fastify: FastifyInstance) => {
  fastify.post<{ Params: { slug: string } }>("/:slug/comments", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()

    // SEC-06 / SEC-07: validate body and cap comment length via shared schema.
    const parsed = ratingCommentBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: "Rating must be an integer between 1 and 5" })
    }
    const rating = parsed.data.rating
    const commentText = parsed.data.comment?.trim() ?? ""
    const anonymous = parsed.data.anonymous === true

    const discordUser = getBearerUser(request)
    if (!discordUser) {
      return reply.status(401).send({ error: "Authentication required" })
    }

    const alreadyRated = await hasDiscordRated(slug, discordUser.discordId)

    let avg = 0
    let count = 0
    let distribution: Record<number, number> = {}

    if (!alreadyRated) {
      await markDiscordRated(slug, discordUser.discordId)
      const result = await submitRating(slug, rating)
      avg = result.avg
      count = result.count
      distribution = result.distribution
    } else {
      const stats = await getPresenceStats(slug)
      avg = stats.rating
      count = stats.ratingCount
      distribution = stats.ratingDistribution
    }

    let commentId: string | undefined

    if (commentText) {
      const created = await submitComment(slug, {
        rating,
        comment: commentText,
        anonymous,
        authorId: anonymous ? hashDiscordId(discordUser.discordId) : discordUser.discordId,
        authorName: anonymous ? undefined : discordUser.globalName,
        authorAvatar: anonymous ? undefined : (discordUser.avatar_url ?? undefined),
      })
      commentId = created.id
    }

    await setUserRating(slug, discordUser.discordId, rating, !!commentText, commentId)

    return {
      comment: commentText || null,
      stats: {
        avg,
        count,
        distribution
      }
    }
  })

  fastify.get<{ Params: { slug: string } }>("/:slug/comments", async (request, _reply) => {
    const slug = request.params.slug.toLowerCase()
    const comments = await getComments(slug)

    const discordUser = getBearerUser(request)
    const currentRawId: string | null = discordUser?.discordId ?? null

    if (currentRawId) {
      const currentHash = hashDiscordId(currentRawId)
      return comments.map((c) => ({
        ...c,
        isOwn: c.authorId === currentRawId || c.authorId === currentHash,
      }))
    }

    return comments
  })

  fastify.get<{ Params: { slug: string } }>("/:slug/my-rating", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const discordUser = getBearerUser(request)
    if (!discordUser) {
      return reply.status(401).send({ error: "Authentication required" })
    }

    const data = await getUserRating(slug, discordUser.discordId)
    return {
      rated: !!data,
      rating: data?.rating ?? 0,
      hasComment: data?.hasComment ?? false
    }
  })

  fastify.delete<{ Params: { slug: string } }>("/:slug/comments", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const discordUser = getBearerUser(request)
    if (!discordUser) {
      return reply.status(401).send({ error: "Authentication required" })
    }

    const userData = await getUserRating(slug, discordUser.discordId)
    if (!userData) {
      return reply.status(404).send({ error: "No rating found" })
    }

    if (userData.commentId) {
      await getPrisma().comment.delete({ where: { id: userData.commentId } })
    }

    await removeUserRating(slug, discordUser.discordId)

    return { ok: true }
  })
}
