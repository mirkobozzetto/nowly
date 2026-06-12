import { redis } from "@/lib/redis"

export type ServiceStatus = "operational" | "slow" | "degraded" | "down" | "unknown"

export type StatusServiceId = "website" | "api" | "library" | "cdn"

export type StatusSample = {
  serviceId: StatusServiceId
  checkedAt: string
  status: Exclude<ServiceStatus, "unknown">
  responseMs: number | null
  httpStatus: number | null
  error: string | null
}

export type StatusServiceReport = {
  id: StatusServiceId
  current: StatusSample | null
  samples: StatusSample[]
}

export type StatusReport = {
  generatedAt: string
  checkIntervalHours: number
  overallStatus: ServiceStatus
  services: StatusServiceReport[]
}

export type StatusCheckResult = {
  report: StatusReport
  skipped: boolean
}

type StatusService = {
  id: StatusServiceId
  url: string
}

const STATUS_PREFIX = "nowly:status"
const REQUEST_TIMEOUT_MS = 5000
const RECENT_SAMPLE_COUNT = 10
const DEFAULT_INTERVAL_HOURS = 1
const DEFAULT_SAMPLE_LIMIT = 168

const sampleKey = (serviceId: StatusServiceId): string => `${STATUS_PREFIX}:service:${serviceId}:samples`
const lastCheckKey = (): string => `${STATUS_PREFIX}:last-check`

const services: StatusService[] = [
  { id: "website", url: process.env.NEXT_PUBLIC_BASE_URL || "https://nowly.me" },
  { id: "api", url: `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nowly.me"}/health` },
  { id: "library", url: `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nowly.me"}/presences` },
  { id: "cdn", url: "https://cdn.nowly.me/installer/latest.json" },
]

const parsePositiveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const getCheckIntervalHours = (): number => parsePositiveNumber(process.env.STATUS_CHECK_INTERVAL_HOURS, DEFAULT_INTERVAL_HOURS)

const getSampleLimit = (): number => Math.max(10, Math.floor(parsePositiveNumber(process.env.STATUS_SAMPLE_LIMIT, DEFAULT_SAMPLE_LIMIT)))

export const classifyResponse = (ok: boolean, httpStatus: number | null, responseMs: number | null): Exclude<ServiceStatus, "unknown"> => {
  if (!ok || httpStatus === null || httpStatus >= 500 || responseMs === null) return "down"
  if (responseMs <= 750) return "operational"
  if (responseMs <= 2000) return "slow"
  return "degraded"
}

const statusWeight: Record<ServiceStatus, number> = {
  operational: 0, slow: 1, degraded: 2, down: 3, unknown: 4,
}

const getWorstStatus = (statuses: ServiceStatus[]): ServiceStatus =>
  statuses.reduce<ServiceStatus>((worst, status) =>
    statusWeight[status] > statusWeight[worst] ? status : worst, "operational")

const parseSample = (value: unknown): StatusSample | null => {
  if (!value) return null
  if (typeof value === "string") { try { return JSON.parse(value) as StatusSample } catch { return null } }
  if (typeof value === "object") return value as StatusSample
  return null
}

const measureService = async (id: StatusServiceId, url: string): Promise<StatusSample> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const startedAt = performance.now()

  try {
    const response = await fetch(url, { cache: "no-store", redirect: "follow", signal: controller.signal })
    const responseMs = Math.round(performance.now() - startedAt)

    return {
      serviceId: id,
      checkedAt: new Date().toISOString(),
      status: classifyResponse(response.ok, response.status, responseMs),
      responseMs,
      httpStatus: response.status,
      error: null,
    }
  } catch (error) {
    const responseMs = Math.round(performance.now() - startedAt)

    return {
      serviceId: id,
      checkedAt: new Date().toISOString(),
      status: "down",
      responseMs,
      httpStatus: null,
      error: error instanceof Error ? error.name : "FetchError",
    }
  } finally {
    clearTimeout(timeout)
  }
}

export const getStatusReport = async (): Promise<StatusReport> => {
  const reports = await Promise.all(
    services.map(async (svc) => {
      const rawSamples = await redis.lrange<unknown>(sampleKey(svc.id), 0, RECENT_SAMPLE_COUNT - 1)
      const samples = rawSamples.map(parseSample).filter((s): s is StatusSample => Boolean(s))

      return { id: svc.id, current: samples[0] ?? null, samples }
    }),
  )

  return {
    generatedAt: new Date().toISOString(),
    checkIntervalHours: getCheckIntervalHours(),
    overallStatus: getWorstStatus(reports.map((s) => s.current?.status ?? "unknown")),
    services: reports,
  }
}

export const runStatusCheck = async (): Promise<StatusCheckResult> => {
  const samples = await Promise.all(
    services.map((svc) => measureService(svc.id, svc.url)),
  )

  const sampleLimit = getSampleLimit()
  await Promise.all([
    redis.set(lastCheckKey(), new Date().toISOString()),
    ...samples.flatMap((sample) => [
      redis.lpush(sampleKey(sample.serviceId), JSON.stringify(sample)),
      redis.ltrim(sampleKey(sample.serviceId), 0, sampleLimit - 1),
    ]),
  ])

  return {
    report: await getStatusReport(),
    skipped: false
  }
}
