import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface PresenceStats {
  totalInstalls: number
  activeUsers: number
  rating: number
  ratingCount: number
  version: string | null
  addedAt: string | null
  lastUpdated: string | null
}

const key = (slug: string, ...parts: string[]): string =>
  ["presence", slug, ...parts].join(":")

export const getPresenceStats = async (slug: string): Promise<PresenceStats> => {
  const [installs, active, ratingSum, ratingCount, version, added, updated] = await redis.mget<
    [number | null, number | null, number | null, number | null, string | null, string | null, string | null]
  >(
    key(slug, "installs"),
    key(slug, "active"),
    key(slug, "rating_sum"),
    key(slug, "rating_count"),
    key(slug, "version"),
    key(slug, "added"),
    key(slug, "updated"),
  )

  return {
    totalInstalls: installs ?? 0,
    activeUsers: active ?? 0,
    rating: ratingSum && ratingCount ? Number((ratingSum / ratingCount).toFixed(1)) : 0,
    ratingCount: ratingCount ?? 0,
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
): Promise<{ avg: number; count: number }> => {
  const [sum, count] = await Promise.all([
    redis.incrbyfloat(key(slug, "rating_sum"), rating),
    redis.incr(key(slug, "rating_count")),
  ])
  return { avg: Number(((sum as number) / (count as number)).toFixed(1)), count: count as number }
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
