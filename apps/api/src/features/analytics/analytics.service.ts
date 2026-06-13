import { getPrisma, hasDatabase } from "@/db/client"
import { getAnalyticsMetric } from "@/features/analytics/analytics.metric"
import { Prisma } from "../../generated/prisma/client"

type DeviceSyncPresence = {
  slug: string
  version?: string | null
  enabled?: boolean
  installed?: boolean
}

export type DeviceSyncInput = {
  deviceId: string
  analyticsConsent?: boolean
  extensionVersion?: string
  nativeVersion?: string
  browser?: string
  os?: string
  locale?: string
  presences?: DeviceSyncPresence[]
}

export type AnalyticsEventInput = {
  key: string
  deviceId?: string
  slug?: string
  version?: string
  payload?: Record<string, unknown>
  createdAt?: string
}

export type AnalyticsRecordResult = {
  inserted: number
  rejected: number
}

const MAX_EVENTS_PER_BATCH = 100
const MAX_EVENTS_PER_DEVICE_PER_MINUTE = 120
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()
const forbiddenPayloadKeys = new Set([
  "url",
  "href",
  "title",
  "query",
  "search",
  "content",
  "channel",
  "profile",
  "ip",
  "userAgent",
  "history",
  "discordId",
  "discordUserId",
])

const cleanText = (value: unknown, max = 120): string | undefined => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, max)
}

const normalizeCreatedAt = (value: unknown): Date | undefined => {
  if (typeof value !== "string") return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  const now = Date.now()
  const time = date.getTime()
  if (time > now + 5 * 60 * 1000) return undefined
  if (time < now - 7 * 24 * 60 * 60 * 1000) return undefined
  return date
}

const parseMetricDate = (value: unknown): Date | undefined => {
  if (typeof value !== "string") return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const takeRateLimitSlot = (deviceId: string | undefined): boolean => {
  if (!deviceId) return true
  const now = Date.now()
  const current = rateLimitBuckets.get(deviceId)
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(deviceId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (current.count >= MAX_EVENTS_PER_DEVICE_PER_MINUTE) return false
  current.count += 1
  return true
}

const allowedPayload = (key: string, payload: Record<string, unknown> = {}): Prisma.InputJsonObject => {
  const metric = getAnalyticsMetric(key)
  const allowedKeys = new Set(metric?.allowedPayloadKeys ?? [])

  return Object.fromEntries(
    Object.entries(payload)
      .filter(([payloadKey]) => allowedKeys.has(payloadKey) && !forbiddenPayloadKeys.has(payloadKey))
      .map(([payloadKey, value]) => [payloadKey, typeof value === "string" ? cleanText(value, 160) : value])
      .filter(([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean")
      .filter(([, value]) => value !== undefined),
  ) as Prisma.InputJsonObject
}

export const upsertDevice = async (input: DeviceSyncInput): Promise<void> => {
  if (!hasDatabase()) return

  const prisma = getPrisma()
  await prisma.device.upsert({
    where: { deviceId: input.deviceId },
    create: {
      deviceId: input.deviceId,
      analyticsConsent: input.analyticsConsent === true,
      extensionVersion: cleanText(input.extensionVersion),
      nativeVersion: cleanText(input.nativeVersion),
      browser: cleanText(input.browser, 60),
      os: cleanText(input.os, 60),
      locale: cleanText(input.locale, 20),
    },
    update: {
      analyticsConsent: input.analyticsConsent === true,
      extensionVersion: cleanText(input.extensionVersion),
      nativeVersion: cleanText(input.nativeVersion),
      browser: cleanText(input.browser, 60),
      os: cleanText(input.os, 60),
      locale: cleanText(input.locale, 20),
      lastSeenAt: new Date(),
    },
  })
}

export const syncDevice = async (input: DeviceSyncInput): Promise<void> => {
  await upsertDevice(input)
  if (!hasDatabase() || !input.presences?.length) return

  const prisma = getPrisma()
  for (const presence of input.presences) {
    const slug = cleanText(presence.slug, 80)?.toLowerCase()
    if (!slug) continue
    const installed = presence.installed !== false
    const enabled = installed && presence.enabled !== false
    const uninstalledAt = installed ? null : new Date()

    await prisma.devicePresence.upsert({
      where: { deviceId_slug: { deviceId: input.deviceId, slug } },
      create: {
        deviceId: input.deviceId,
        slug,
        installedVersion: cleanText(presence.version ?? undefined, 60),
        installed,
        enabled,
        uninstalledAt,
      },
      update: {
        installedVersion: cleanText(presence.version ?? undefined, 60),
        installed,
        enabled,
        updatedAt: new Date(),
        uninstalledAt,
      },
    })
  }
}

export const getDeviceConsent = async (deviceId: string): Promise<boolean> => {
  if (!hasDatabase()) return false
  const device = await getPrisma().device.findUnique({
    where: { deviceId },
    select: { analyticsConsent: true },
  })
  return device?.analyticsConsent === true
}

export const recordAnalyticsEvents = async (events: AnalyticsEventInput[]): Promise<AnalyticsRecordResult> => {
  if (!hasDatabase()) return { inserted: 0, rejected: 0 }

  const prisma = getPrisma()
  let inserted = 0
  let rejected = 0
  for (const event of events.slice(0, MAX_EVENTS_PER_BATCH)) {
    const key = cleanText(event.key, 100)
    const metric = key ? getAnalyticsMetric(key) : undefined
    if (!key || !metric) {
      rejected += 1
      continue
    }

    const deviceId = cleanText(event.deviceId, 120)
    if (deviceId && !(await getDeviceConsent(deviceId))) continue
    if (!takeRateLimitSlot(deviceId)) {
      rejected += 1
      continue
    }

    await prisma.analyticsEvent.create({
      data: {
        id: crypto.randomUUID(),
        key,
        deviceId,
        slug: cleanText(event.slug, 80)?.toLowerCase(),
        version: cleanText(event.version, 60),
        payload: allowedPayload(key, event.payload),
        createdAt: normalizeCreatedAt(event.createdAt),
      },
    })
    inserted += 1
  }

  return { inserted, rejected }
}

export const deleteDeviceAnalytics = async (deviceId: string): Promise<void> => {
  if (!hasDatabase()) return

  const prisma = getPrisma()
  await prisma.$transaction([
    prisma.analyticsEvent.deleteMany({ where: { deviceId } }),
    prisma.presenceActiveDevice.deleteMany({ where: { deviceId } }),
    prisma.devicePresence.deleteMany({ where: { deviceId } }),
    prisma.device.deleteMany({ where: { deviceId } }),
  ])
}

type MetricRowsFilter = {
  slug?: string
  from?: string
  to?: string
}

export const getMetricRows = async (
  key: string,
  filter: MetricRowsFilter = {}
): Promise<Array<Record<string, unknown>>> => {
  if (!hasDatabase()) return []

  const prisma = getPrisma()
  const slugFilter = filter.slug ? { slug: filter.slug.toLowerCase() } : {}
  const from = parseMetricDate(filter.from)
  const to = parseMetricDate(filter.to)
  const createdAt = {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  }
  const createdAtFilter = Object.keys(createdAt).length ? { createdAt } : {}

  if (key === "presence_install") {
    const rows = await prisma.devicePresence.groupBy({
      by: ["slug", "installedVersion"],
      where: { installed: true, ...slugFilter },
      _count: { _all: true },
      orderBy: { _count: { slug: "desc" } },
    })
    return rows.map((row) => ({
      slug: row.slug,
      version: row.installedVersion,
      count: row._count._all,
    }))
  }

  if (key === "presence_active_heartbeat") {
    const rows = await prisma.presenceActiveDevice.groupBy({
      by: ["slug"],
      where: {
        ...slugFilter,
        lastSeenAt: { gte: new Date(Date.now() - 12 * 60 * 1000) },
      },
      _count: { _all: true },
      orderBy: { _count: { slug: "desc" } },
    })
    return rows.map((row) => ({ slug: row.slug, count: row._count._all }))
  }

  if (key === "ratings") {
    const rows = await prisma.rating.groupBy({
      by: ["slug", "rating"],
      where: slugFilter,
      _count: { _all: true },
      orderBy: [{ slug: "asc" }, { rating: "desc" }],
    })
    return rows.map((row) => ({ slug: row.slug, rating: row.rating, count: row._count._all }))
  }

  const rows = await prisma.analyticsEvent.groupBy({
    by: ["key", "slug", "version", "payload"],
    where: { key, ...slugFilter, ...createdAtFilter },
    _count: { _all: true },
    orderBy: { _count: { key: "desc" } },
    take: 250,
  })

  return rows.map((row) => ({
    key: row.key,
    slug: row.slug,
    version: row.version,
    payload: row.payload,
    count: row._count._all,
  }))
}
