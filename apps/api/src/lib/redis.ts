import { Redis } from "@upstash/redis"
import { serverEnv } from "@nowly/env/server"
import "dotenv/config"

export const redis = new Redis({
  url: serverEnv.UPSTASH_REDIS_REST_URL,
  token: serverEnv.UPSTASH_REDIS_REST_TOKEN,
})

export interface PresenceStats {
  totalInstalls: number
  activeUsers: number
  rating: number
  ratingCount: number
  ratingDistribution: Record<number, number>
  version: string | null
  addedAt: string | null
  lastUpdated: string | null
}

const key = (slug: string, ...parts: string[]): string => ["presence", slug, ...parts].join(":")

const ratingKey = (slug: string, stars: number): string => key(slug, "ratings", String(stars))

const STARS = [5, 4, 3, 2, 1] as const

export const getPresenceStats = async (slug: string): Promise<PresenceStats> => {
  const [installs, active, version, added, updated, ...perStar] = await redis.mget<
    [number | null, number | null, string | null, string | null, string | null, ...(number | null)[]]
  >(
    key(slug, "installs"),
    key(slug, "active"),
    key(slug, "version"),
    key(slug, "added"),
    key(slug, "updated"),
    ...STARS.map((s) => ratingKey(slug, s)),
  )

  const distribution: Record<number, number> = {}
  let total = 0
  let weightedSum = 0

  for (let i = 0; i < STARS.length; i++) {
    const count = perStar[i] ?? 0
    distribution[STARS[i]] = count
    total += count
    weightedSum += STARS[i] * count
  }

  return {
    totalInstalls: installs ?? 0,
    activeUsers: active ?? 0,
    rating: total > 0 ? Number((weightedSum / total).toFixed(1)) : 0,
    ratingCount: total,
    ratingDistribution: distribution,
    version: version ?? null,
    addedAt: added ?? null,
    lastUpdated: updated ?? null,
  }
}

export const incrementInstalls = async (slug: string): Promise<number> => {
  return redis.incr(key(slug, "installs"))
}

export const setActiveUsers = async (slug: string, count: number): Promise<void> => {
  await redis.set(key(slug, "active"), count)
}

export const submitRating = async (
  slug: string,
  rating: number,
): Promise<{ avg: number; count: number; distribution: Record<number, number> }> => {
  await redis.incr(ratingKey(slug, rating))
  const stats = await getPresenceStats(slug)
  return { avg: stats.rating, count: stats.ratingCount, distribution: stats.ratingDistribution }
}

const discordRaterKey = (slug: string) => `presence:${slug}:discord-raters`
const discordRatingKey = (slug: string, discordId: string) => `presence:${slug}:discord-user:${discordId}`

export const hasDiscordRated = async (slug: string, discordId: string): Promise<boolean> => {
  return (await redis.sismember(discordRaterKey(slug), discordId)) === 1
}

export const markDiscordRated = async (slug: string, discordId: string): Promise<void> => {
  await redis.sadd(discordRaterKey(slug), discordId)
}

export const getUserRating = async (slug: string, discordId: string): Promise<{
  rating: number;
  hasComment: boolean;
  commentId?: string
} | null> => {
  const raw = await redis.hgetall(discordRatingKey(slug, discordId))
  if (!raw || !raw.rating) return null
  
  return {
    rating: Number(raw.rating),
    hasComment: raw.hasComment === "true",
    commentId: String(raw.commentId ?? "") || undefined
  }
}

export const setUserRating = async (
  slug: string,
  discordId: string,
  rating: number,
  hasComment: boolean,
  commentId?: string
): Promise<void> => {
  const fields: Record<string, string> = {
    rating: String(rating),
    hasComment: String(hasComment)
  }
  
  if (commentId) fields.commentId = commentId
  await redis.hset(discordRatingKey(slug, discordId), fields)
}

export const removeUserRating = async (slug: string, discordId: string): Promise<void> => {
  await Promise.all([
    redis.srem(discordRaterKey(slug), discordId),
    redis.del(discordRatingKey(slug, discordId)),
  ])
}

export const setUpdated = async (slug: string, date?: string): Promise<void> => {
  await redis.set(key(slug, "updated"), date ?? new Date().toISOString())
}

export const setAdded = async (slug: string, date?: string): Promise<void> => {
  await redis.set(key(slug, "added"), date ?? new Date().toISOString())
}

export const setVersion = async (slug: string, version: string): Promise<void> => {
  await redis.set(key(slug, "version"), version)
}

export const getVersion = async (slug: string): Promise<string | null> => {
  return redis.get(key(slug, "version"))
}

export interface VersionEntry {
  version: string
  changelog: string
  author: string
  authorGithub?: string
  releaseAuthor?: string
  releaseContributors?: string
  pr?: string
  source?: "cli" | "pr"
  commitSha?: string
  changedFiles?: string
  bundleSizeBytes?: number
  bundleSizeLabel?: string
  bundleSha256?: string
  versionType?: string
  aiGeneratedChangelog?: boolean
  createdAt?: string
  timestamp: number
}

export const addVersion = async (slug: string, entry: VersionEntry): Promise<void> => {
  const ts = entry.timestamp
  const clean = Object.fromEntries(
    Object.entries(entry).filter(([, v]) => v != null),
  ) as unknown as Record<string, unknown>

  await Promise.all([
    redis.zadd(key(slug, "versions"), {
      score: ts,
      member: entry.version
    }),

    redis.hset(key(slug, "version", entry.version), clean),
  ])
}

const metaKey = (slug: string) => `presence:${slug}:meta`

export type PresenceMeta = Record<string, any>

export const setPresenceMeta = async (slug: string, meta: PresenceMeta): Promise<void> => {
  await redis.set(metaKey(slug), JSON.stringify(meta))
}

export const getPresenceMeta = async (slug: string): Promise<PresenceMeta | null> => {
  const raw = await redis.get<any>(metaKey(slug))
  if (!raw) return null

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as PresenceMeta
    } catch {
      return null
    }
  }
  return raw as PresenceMeta
}

export const getAllPresenceSlugs = async (): Promise<string[]> => {
  let cursor = 0
  const slugs: string[] = []

  do {
    const [next, keys] = await redis.scan(cursor, { match: "presence:*:version" })
    cursor = parseInt(next)
    for (const k of keys) {
      const parts = k.split(":")
      slugs.push(parts[1])
    }
  } while (cursor !== 0)
  return [...new Set(slugs)]
}

export interface CommentEntry {
  id: string
  rating: number
  comment?: string
  authorId?: string
  authorName?: string
  authorAvatar?: string
  anonymous?: boolean
  createdAt: string
  isOwn?: boolean
}

export const submitComment = async (
  slug: string,
  entry: Omit<CommentEntry, "id" | "createdAt">,
): Promise<CommentEntry> => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const createdAt = new Date().toISOString()
  const clean = Object.fromEntries(
    Object.entries({
      ...entry,
      id,
      createdAt
    }).filter(([, v]) => v != null),
  ) as unknown as Record<string, unknown>

  await redis.zadd(key(slug, "comments"), { score: Date.now(), member: id })
  await redis.hset(key(slug, "comment", id), clean)
  return clean as unknown as CommentEntry
}

export const getComments = async (slug: string): Promise<CommentEntry[]> => {
  const ids = await redis.zrange(key(slug, "comments"), 0, -1, { rev: true })
  if (!ids.length) return []

  const entries = await Promise.all(
    ids.map((id) => redis.hgetall(key(slug, "comment", String(id)))),
  )

  return entries
    .filter((e): e is Record<string, string> => e !== null)
    .map((e) => ({
      id: e.id,
      rating: Number(e.rating),
      comment: e.comment,
      authorId: e.authorId,
      authorName: e.authorName,
      authorAvatar: e.authorAvatar,
      anonymous: String(e.anonymous) === "true",
      createdAt: e.createdAt,
    }))
}

export const getVersionHistory = async (slug: string): Promise<VersionEntry[]> => {
  const versions = await redis.zrange(key(slug, "versions"), 0, -1, { rev: true })
  if (!versions.length) return []

  const entries = await Promise.all(
    versions.map((v) => redis.hgetall(key(slug, "version", String(v)))),
  )

  return entries
    .filter((e) => e !== null)
    .map((e) => e as unknown as VersionEntry)
}


