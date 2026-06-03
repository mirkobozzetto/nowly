import { describe, it, expect, vi, beforeEach } from "vitest"
import Fastify from "fastify"
import cors from "@fastify/cors"
import { z } from "zod"

const RegistryResponse = z.array(z.object({
  slug: z.string(),
  name: z.string(),
  version: z.string(),
  author: z.union([z.string(), z.object({ name: z.string(), github: z.string().optional() })]),
  category: z.string(),
  description: z.union([z.string(), z.record(z.string())]),
}))

const mockRedis = vi.hoisted(() => ({
  mget: vi.fn(),
  incr: vi.fn(),
  sismember: vi.fn(),
  sadd: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  zadd: vi.fn(),
  hset: vi.fn(),
  hgetall: vi.fn(),
  zrange: vi.fn(),
  scan: vi.fn(),
}))

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => mockRedis),
}))

const mockRedisModule = vi.hoisted(() => ({
  getAllPresenceSlugs: vi.fn(),
  getPresenceMeta: vi.fn(),
  getVersion: vi.fn(),
  getPresenceStats: vi.fn(),
  incrementInstalls: vi.fn(),
  setActiveUsers: vi.fn(),
  hasRated: vi.fn(),
  hasDeviceRated: vi.fn(),
  markRated: vi.fn(),
  markDeviceRated: vi.fn(),
  submitRating: vi.fn(),
  setPresenceMeta: vi.fn(),
  setVersion: vi.fn(),
  setAdded: vi.fn(),
  setUpdated: vi.fn(),
  addVersion: vi.fn(),
  getVersionHistory: vi.fn(),
}))

vi.mock("@/lib/redis", () => mockRedisModule)

vi.mock("@nowly/websites", () => ({
  getPresence: vi.fn(() => undefined),
  getRegistry: vi.fn(() => []),
}))

async function buildApp() {
  const app = Fastify()
  await app.register(cors, { origin: true })
  const { registryRoutes } = await import("@/routes/registry")
  const { presenceRoutes } = await import("@/routes/presence")
  const { statsRoutes } = await import("@/routes/stats")
  await app.register(registryRoutes, { prefix: "/presences" })
  await app.register(presenceRoutes, { prefix: "/presences" })
  await app.register(statsRoutes, { prefix: "/presences" })
  return app
}

describe("Registry Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it("GET /presences returns empty array", async () => {
    mockRedisModule.getAllPresenceSlugs.mockResolvedValue([])
    const res = await app.inject({ method: "GET", url: "/presences" })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual([])
  })

  it("GET /presences returns registry with metadata", async () => {
    mockRedisModule.getAllPresenceSlugs.mockResolvedValue(["youtube"])
    mockRedisModule.getPresenceMeta.mockResolvedValue({
      name: "YouTube",
      slug: "youtube",
      author: { name: "Gaëtan H", github: "steellgold" },
      category: "streaming",
      description: { "en-US": "Watch videos" },
      color: "#FF0033",
      url: ["youtube.com"],
      assets: { logo: "logo.png", icon: "icon.png", thumbnail: "thumbnail.jpg" },
      tags: ["video"],
    })
    mockRedisModule.getVersion.mockResolvedValue("1.0.0")

    const res = await app.inject({ method: "GET", url: "/presences" })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveLength(1)
    const parsed = RegistryResponse.parse(body)
    expect(parsed[0].slug).toBe("youtube")
    expect(parsed[0].name).toBe("YouTube")
  })
})

describe("Presence Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it("GET /presences/:slug returns 404 for unknown", async () => {
    mockRedisModule.getPresenceStats.mockResolvedValue({
      totalInstalls: 0, activeUsers: 0, rating: 0, ratingCount: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      version: null, addedAt: null, lastUpdated: null,
    })
    mockRedisModule.getPresenceMeta.mockResolvedValue(null)
    const res = await app.inject({ method: "GET", url: "/presences/nonexistent" })
    expect(res.statusCode).toBe(404)
  })

  it("POST /presences/sync returns 401 without auth when secret is configured", async () => {
    process.env.API_SECRET_KEY = "test-secret"
    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: { presences: [] },
    })
    expect(res.statusCode).toBe(401)
    delete process.env.API_SECRET_KEY
  })

  it("POST /presences/:slug returns 401 without auth when secret is configured", async () => {
    process.env.API_SECRET_KEY = "test-secret"
    const res = await app.inject({
      method: "PUT",
      url: "/presences/youtube",
      payload: { version: "1.0.0" },
    })
    expect(res.statusCode).toBe(401)
    delete process.env.API_SECRET_KEY
  })
})

describe("Stats Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it("POST /presences/active updates active users", async () => {
    mockRedisModule.setActiveUsers.mockResolvedValue(undefined)
    const res = await app.inject({
      method: "POST",
      url: "/presences/active",
      payload: { presences: ["yt", "tw"] },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, count: 2 })
  })

  it("POST /presences/:slug/installs increments", async () => {
    mockRedisModule.incrementInstalls.mockResolvedValue(42)
    const res = await app.inject({ method: "POST", url: "/presences/yt/installs" })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ totalInstalls: 42 })
  })

  it("POST /presences/:slug/rating rejects invalid", async () => {
    const res = await app.inject({
      method: "POST", url: "/presences/yt/rating", payload: { rating: 6 },
    })
    expect(res.statusCode).toBe(400)
  })

  it("POST /presences/:slug/rating rejects below 1", async () => {
    const res = await app.inject({
      method: "POST", url: "/presences/yt/rating", payload: { rating: 0 },
    })
    expect(res.statusCode).toBe(400)
  })

  it("POST /presences/:slug/rating accepts valid", async () => {
    mockRedisModule.hasRated.mockResolvedValue(false)
    mockRedisModule.hasDeviceRated.mockResolvedValue(false)
    mockRedisModule.markRated.mockResolvedValue(undefined)
    mockRedisModule.markDeviceRated.mockResolvedValue(undefined)
    mockRedisModule.submitRating.mockResolvedValue({
      avg: 4.5, count: 10,
      distribution: { 5: 5, 4: 3, 3: 1, 2: 1, 1: 0 },
    })
    const res = await app.inject({
      method: "POST", url: "/presences/yt/rating", payload: { rating: 5 },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.avg).toBe(4.5)
  })

  it("POST /presences/:slug/rating rejects duplicate", async () => {
    mockRedisModule.hasRated.mockResolvedValue(true)
    const res = await app.inject({
      method: "POST", url: "/presences/yt/rating", payload: { rating: 5 },
    })
    expect(res.statusCode).toBe(409)
  })
})
