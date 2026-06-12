import { getPrisma } from "@/db/client"
import { hashDiscordId, verifyToken } from "@/features/auth/auth.service"
import {
  getPresenceStats, getUserRating,
  hasDiscordRated, markDiscordRated,
  removeUserRating, setUserRating,
  submitRating,
} from "@/features/presence/presence.repository"
import { submitComment, getComments } from "@/features/rating/rating.repository"
import type { FastifyInstance } from "fastify"

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(ratingRoutes, { prefix: "/presences" })
}

export const ratingRoutes = async (fastify: FastifyInstance) => {
  fastify.post<{ Params: { slug: string } }>("/:slug/comments", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const body = request.body as { rating?: number; comment?: string; anonymous?: boolean }
    const rating = Number(body?.rating)
    const commentText = body?.comment?.trim() ?? ""
    const anonymous = body?.anonymous === true

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return reply.status(400).send({
        error: "Rating must be an integer between 1 and 5"
      })
    }

    const auth = request.headers.authorization
    if (!auth?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Authentication required" })
    }

    const discordUser = verifyToken(auth.slice(7))
    if (!discordUser) {
      return reply.status(401).send({
        error: "Invalid or expired token"
      })
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

    const userToken = (request.headers as Record<string, string>)["x-user-token"]
    let currentRawId: string | null = null
    if (userToken?.startsWith("Bearer ")) {
      const discordUser = verifyToken(userToken.slice(7))
      if (discordUser) {
        currentRawId = discordUser.discordId
      }
    }

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
    const auth = request.headers.authorization
    if (!auth?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Authentication required" })
    }

    const discordUser = verifyToken(auth.slice(7))
    if (!discordUser) {
      return reply.status(401).send({ error: "Invalid or expired token" })
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
    const auth = request.headers.authorization
    if (!auth?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Authentication required" })
    }

    const discordUser = verifyToken(auth.slice(7))
    if (!discordUser) {
      return reply.status(401).send({ error: "Invalid or expired token" })
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
