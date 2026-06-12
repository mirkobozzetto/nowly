import { getPrisma } from "@/db/client"
import type { CommentEntry } from "@/features/presence/presence.types"

export const submitComment = async (
  slug: string,
  entry: Omit<CommentEntry, "id" | "createdAt">,
): Promise<CommentEntry> => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const createdAt = new Date().toISOString()
  const clean = { ...entry, id, createdAt } as unknown as CommentEntry

  await getPrisma().comment.create({
    data: {
      id,
      slug,
      rating: entry.rating,
      comment: entry.comment,
      authorId: entry.authorId,
      authorName: entry.authorName,
      authorAvatar: entry.authorAvatar,
      anonymous: entry.anonymous === true,
      createdAt: new Date(createdAt),
    },
  })
  return clean
}

export const getComments = async (slug: string): Promise<CommentEntry[]> => {
  const rows = await getPrisma().comment.findMany({
    where: { slug },
    orderBy: { createdAt: "desc" },
  })
  return rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment ?? undefined,
    authorId: row.authorId ?? undefined,
    authorName: row.authorName ?? undefined,
    authorAvatar: row.authorAvatar ?? undefined,
    anonymous: row.anonymous,
    createdAt: row.createdAt.toISOString(),
  }))
}
