import { requireAnalyticsAccess } from "./analytics.middleware"
import { analyticsRegistry, getAnalyticsMetric } from "./analytics.metric"
import { deleteDeviceAnalytics, getMetricRows, recordAnalyticsEvents, syncDevice, upsertDevice } from "./analytics.service"
import { clearActiveDevicesForDevice } from "@/features/presence/presence.repository"
import {
  analyticsConsentBodySchema,
  analyticsEventsBodySchema,
  deviceSyncBodySchema,
} from "@nowly/shared/schemas"
import type { FastifyInstance } from "fastify"

export const analyticsRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/consent", async (request, reply) => {
    const parsed = analyticsConsentBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body" })

    await upsertDevice({ deviceId: parsed.data.deviceId, analyticsConsent: parsed.data.analyticsConsent === true })
    return { ok: true }
  })

  fastify.post("/events", async (request, reply) => {
    const parsed = analyticsEventsBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body" })

    const result = await recordAnalyticsEvents(parsed.data.events)
    return { ok: true, ...result }
  })

  fastify.get("/metrics", async (_request, _reply) => {
    return analyticsRegistry.map((metric) => metric.toJSON())
  })

  fastify.get<{ Params: { key: string }; Querystring: { slug?: string; from?: string; to?: string } }>("/metrics/:key", async (request, reply) => {
    const metric = getAnalyticsMetric(request.params.key)
    if (!metric) return reply.status(404).send({ error: "Metric not found" })
    if (metric.private && !(await requireAnalyticsAccess(request, reply))) return

    const rows = await getMetricRows(metric.key, request.query)
    return { metric: metric.toJSON(), rows }
  })

  fastify.get<{ Params: { slug: string } }>("/presences/:slug", async (request, _reply) => {
    const slug = request.params.slug.toLowerCase()
    const [installs, activeUsers, ratings] = await Promise.all([
      getMetricRows("presence_install", { slug }),
      getMetricRows("presence_active_heartbeat", { slug }),
      getMetricRows("ratings", { slug }),
    ])

    return { slug, installs, activeUsers, ratings }
  })

  fastify.delete<{ Params: { deviceId: string } }>("/device/:deviceId", async (request, _reply) => {
    const deviceId = request.params.deviceId.trim()
    await deleteDeviceAnalytics(deviceId)
    return { ok: true }
  })
}

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(analyticsRoutes, { prefix: "/analytics" })
  await app.register(deviceRoutes, { prefix: "/devices" })
}

export const deviceRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/sync", async (request, reply) => {
    const parsed = deviceSyncBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body" })

    await syncDevice(parsed.data)
    return { ok: true }
  })

  fastify.delete<{ Params: { deviceId: string } }>("/:deviceId", async (request, _reply) => {
    const deviceId = request.params.deviceId.trim()
    await clearActiveDevicesForDevice(deviceId)
    await recordAnalyticsEvents([{ key: "uninstall_cleanup_received", deviceId, payload: { source: "device-delete" } }])
    return { ok: true }
  })
}
