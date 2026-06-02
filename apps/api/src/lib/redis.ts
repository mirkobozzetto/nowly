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
  ratingDistribution: Record<number, number>
  version: string | null
  addedAt: string | null
  lastUpdated: string | null
}

const key = (slug: string, ...parts: string[]): string =>
  ["presence", slug, ...parts].join(":")

const ratingKey = (slug: string, stars: number): string =>
  key(slug, "ratings", String(stars))

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

export const setUpdated = async (slug: string, date?: string): Promise<void> => {
  await redis.set(key(slug, "updated"), date ?? new Date().toISOString())
}

export const setAdded = async (slug: string, date?: string): Promise<void> => {
  await redis.set(key(slug, "added"), date ?? new Date().toISOString())
}

export const setVersion = async (slug: string, version: string): Promise<void> => {
  await redis.set(key(slug, "version"), version)
}

export interface VersionEntry {
  version: string
  changelog: string
  author: string
  pr?: string
  timestamp: number
}

export const addVersion = async (slug: string, entry: VersionEntry): Promise<void> => {
  const ts = entry.timestamp
  const clean = Object.fromEntries(
    Object.entries(entry).filter(([, v]) => v != null),
  ) as unknown as Record<string, unknown>
  await Promise.all([
    redis.zadd(key(slug, "versions"), { score: ts, member: entry.version }),
    redis.hset(key(slug, "version", entry.version), clean),
  ])
}

export const getVersionHistory = async (slug: string): Promise<VersionEntry[]> => {
  const versions = await redis.zrange(key(slug, "versions"), 0, -1, { rev: true })
  if (!versions.length) return []

  const entries = await Promise.all(
    versions.map((v) => redis.hgetall(key(slug, "version", String(v)))),
  )

  return entries.filter((e) => e !== null) as unknown as VersionEntry[]
}
