import { getPrisma } from "@/db/client"
import type { PresenceMeta, PresenceStats, VersionEntry } from "./presence.types"

const ACTIVE_DEVICE_STALE_MS = 12 * 60 * 1000

const iso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

const distributionFromRows = (rows: Array<{ rating: number; _count: { _all: number } }>): {
  distribution: Record<number, number>;
  total: number;
  weightedSum: number
} => {
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let total = 0
  let weightedSum = 0
  for (const row of rows) {
    distribution[row.rating] = row._count._all
    total += row._count._all
    weightedSum += row.rating * row._count._all
  }
  return { distribution, total, weightedSum }
}

export const markActiveDevice = async (slug: string, deviceId: string, timestamp = Date.now()): Promise<void> => {
  const prisma = getPrisma()
  await prisma.presenceActiveDevice.upsert({
    where: { slug_deviceId: { slug, deviceId } },
    create: { slug, deviceId, lastSeenAt: new Date(timestamp) },
    update: { lastSeenAt: new Date(timestamp) },
  })
}

export const clearActiveDevice = async (slug: string, deviceId: string): Promise<void> => {
  await getPrisma().presenceActiveDevice.deleteMany({ where: { slug, deviceId } })
}

export const clearActiveDevicesForDevice = async (deviceId: string): Promise<void> => {
  await getPrisma().presenceActiveDevice.deleteMany({ where: { deviceId } })
}

export const getActiveUsers = async (slug: string): Promise<number> => {
  const prisma = getPrisma()
  await prisma.presenceActiveDevice.deleteMany({
    where: { slug, lastSeenAt: { lt: new Date(Date.now() - ACTIVE_DEVICE_STALE_MS) } },
  })
  return prisma.presenceActiveDevice.count({ where: { slug } })
}

export const getPresenceStats = async (slug: string): Promise<PresenceStats> => {
  const prisma = getPrisma()
  const [presence, totalInstalls, ratingRows] = await Promise.all([
    prisma.presence.findUnique({ where: { slug } }),
    prisma.devicePresence.count({ where: { slug, installed: true } }),
    prisma.rating.groupBy({ by: ["rating"], where: { slug }, _count: { _all: true } }),
  ])
  const { distribution, total, weightedSum } = distributionFromRows(ratingRows)

  return {
    totalInstalls,
    activeUsers: await getActiveUsers(slug),
    rating: total > 0 ? Number((weightedSum / total).toFixed(1)) : 0,
    ratingCount: total,
    ratingDistribution: distribution,
    version: presence?.version ?? null,
    addedAt: iso(presence?.addedAt),
    lastUpdated: iso(presence?.updatedAt),
  }
}

export const incrementInstalls = async (slug: string, deviceId?: string, version?: string): Promise<number> => {
  const resolvedDeviceId = deviceId?.trim() || `anonymous-install-${crypto.randomUUID()}`
  const prisma = getPrisma()
  await prisma.device.upsert({
    where: { deviceId: resolvedDeviceId },
    create: { deviceId: resolvedDeviceId },
    update: { lastSeenAt: new Date() },
  })
  await prisma.devicePresence.upsert({
    where: { deviceId_slug: { deviceId: resolvedDeviceId, slug } },
    create: { deviceId: resolvedDeviceId, slug, installedVersion: version, installed: true, enabled: true },
    update: { installedVersion: version, installed: true, enabled: true, updatedAt: new Date(), uninstalledAt: null },
  })
  return prisma.devicePresence.count({ where: { slug, installed: true } })
}

export const setActiveUsers = async (_slug: string, _count: number): Promise<void> => {
  return
}

export const submitRating = async (slug: string, _rating: number): Promise<{
  avg: number; count: number; distribution: Record<number, number>
}> => {
  const stats = await getPresenceStats(slug)
  return { avg: stats.rating, count: stats.ratingCount, distribution: stats.ratingDistribution }
}

export const hasDiscordRated = async (slug: string, discordId: string): Promise<boolean> => {
  return (await getPrisma().rating.count({ where: { slug, discordUserId: discordId } })) > 0
}

export const markDiscordRated = async (_slug: string, _discordId: string): Promise<void> => {
  return
}

export const getUserRating = async (slug: string, discordId: string): Promise<{
  rating: number;
  hasComment: boolean;
  commentId?: string
} | null> => {
  const row = await getPrisma().rating.findUnique({
    where: { slug_discordUserId: { slug, discordUserId: discordId } },
  })

  if (!row) return null

  return {
    rating: row.rating,
    hasComment: row.hasComment,
    commentId: row.commentId ?? undefined
  }
}

export const setUserRating = async (
  slug: string,
  discordId: string,
  rating: number,
  hasComment: boolean,
  commentId?: string,
): Promise<void> => {
  await getPrisma().rating.upsert({
    where: { slug_discordUserId: { slug, discordUserId: discordId } },
    create: { slug, discordUserId: discordId, rating, hasComment, commentId },
    update: { rating, hasComment, commentId, updatedAt: new Date() },
  })
}

export const removeUserRating = async (slug: string, discordId: string): Promise<void> => {
  await getPrisma().rating.deleteMany({ where: { slug, discordUserId: discordId } })
}

export const setUpdated = async (slug: string, date?: string): Promise<void> => {
  await getPrisma().presence.upsert({
    where: { slug },
    create: { slug, updatedAt: date ? new Date(date) : new Date() },
    update: { updatedAt: date ? new Date(date) : new Date() },
  })
}

export const setAdded = async (slug: string, date?: string): Promise<void> => {
  const value = date ? new Date(date) : new Date()
  await getPrisma().presence.upsert({
    where: { slug },
    create: { slug, addedAt: value },
    update: { addedAt: value },
  })
}

export const setVersion = async (slug: string, version: string): Promise<void> => {
  await getPrisma().presence.upsert({
    where: { slug },
    create: { slug, version, updatedAt: new Date() },
    update: { version, updatedAt: new Date() },
  })
}

export const getVersion = async (slug: string): Promise<string | null> => {
  return (await getPrisma().presence.findUnique({ where: { slug }, select: { version: true } }))?.version ?? null
}

export const addVersion = async (slug: string, entry: VersionEntry): Promise<void> => {
  const prisma = getPrisma()
  await prisma.presence.upsert({
    where: { slug },
    create: { slug, version: entry.version },
    update: {},
  })
  await prisma.presenceVersion.upsert({
    where: { slug_version: { slug, version: entry.version } },
    create: {
      slug,
      version: entry.version,
      changelog: entry.changelog,
      author: entry.author,
      authorGithub: entry.authorGithub,
      releaseAuthor: entry.releaseAuthor,
      releaseContributors: entry.releaseContributors,
      pr: entry.pr,
      source: entry.source,
      commitSha: entry.commitSha,
      changedFiles: entry.changedFiles,
      bundleSizeBytes: entry.bundleSizeBytes,
      bundleSizeLabel: entry.bundleSizeLabel,
      bundleSha256: entry.bundleSha256,
      versionType: entry.versionType,
      aiGeneratedChangelog: entry.aiGeneratedChangelog,
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(entry.timestamp),
      timestamp: new Date(entry.timestamp),
    },
    update: {
      changelog: entry.changelog,
      author: entry.author,
      authorGithub: entry.authorGithub,
      releaseAuthor: entry.releaseAuthor,
      releaseContributors: entry.releaseContributors,
      pr: entry.pr,
      source: entry.source,
      commitSha: entry.commitSha,
      changedFiles: entry.changedFiles,
      bundleSizeBytes: entry.bundleSizeBytes,
      bundleSizeLabel: entry.bundleSizeLabel,
      bundleSha256: entry.bundleSha256,
      versionType: entry.versionType,
      aiGeneratedChangelog: entry.aiGeneratedChangelog,
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(entry.timestamp),
      timestamp: new Date(entry.timestamp),
    },
  })
}

export const setPresenceMeta = async (slug: string, meta: PresenceMeta): Promise<void> => {
  await getPrisma().presence.upsert({
    where: { slug },
    create: { slug, metadata: meta },
    update: { metadata: meta },
  })
}

export const getPresenceMeta = async (slug: string): Promise<PresenceMeta | null> => {
  const row = await getPrisma().presence.findUnique({ where: { slug }, select: { metadata: true } })
  return (row?.metadata as PresenceMeta | null) ?? null
}

export const getAllPresenceSlugs = async (): Promise<string[]> => {
  const rows = await getPrisma().presence.findMany({ select: { slug: true }, orderBy: { slug: "asc" } })
  return rows.map((row) => row.slug)
}

export const getVersionHistory = async (slug: string): Promise<VersionEntry[]> => {
  const rows = await getPrisma().presenceVersion.findMany({
    where: { slug },
    orderBy: { timestamp: "desc" },
  })
  return rows.map((row) => ({
    version: row.version,
    changelog: row.changelog,
    author: row.author,
    authorGithub: row.authorGithub ?? undefined,
    releaseAuthor: row.releaseAuthor ?? undefined,
    releaseContributors: row.releaseContributors ?? undefined,
    pr: row.pr ?? undefined,
    source: row.source === "cli" || row.source === "pr" ? row.source : undefined,
    commitSha: row.commitSha ?? undefined,
    changedFiles: row.changedFiles ?? undefined,
    bundleSizeBytes: row.bundleSizeBytes ?? undefined,
    bundleSizeLabel: row.bundleSizeLabel ?? undefined,
    bundleSha256: row.bundleSha256 ?? undefined,
    versionType: row.versionType ?? undefined,
    aiGeneratedChangelog: row.aiGeneratedChangelog ?? undefined,
    createdAt: row.createdAt.toISOString(),
    timestamp: row.timestamp.getTime(),
  }))
}
