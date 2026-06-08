import { describe, it, expect, vi, beforeEach } from "vitest"
import Fastify from "fastify"
import cors from "@fastify/cors"

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
  srem: vi.fn(),
  del: vi.fn(),
  decr: vi.fn(),
  zrem: vi.fn(),
}))

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => mockRedis),
}))

const mockRedisModule = vi.hoisted(() => ({
  redis: mockRedis,
  getAllPresenceSlugs: vi.fn(),
  getPresenceMeta: vi.fn(),
  getVersion: vi.fn(),
  getPresenceStats: vi.fn(),
  incrementInstalls: vi.fn(),
  setActiveUsers: vi.fn(),
  hasDiscordRated: vi.fn(),
  markDiscordRated: vi.fn(),
  submitRating: vi.fn(),
  setPresenceMeta: vi.fn(),
  setVersion: vi.fn(),
  setAdded: vi.fn(),
  setUpdated: vi.fn(),
  addVersion: vi.fn(),
  getVersionHistory: vi.fn(),
  setUserRating: vi.fn(),
  submitComment: vi.fn(),
  getComments: vi.fn(),
  getUserRating: vi.fn(),
  removeUserRating: vi.fn(),
}))

vi.mock("@/lib/redis", () => mockRedisModule)

const mockAuth = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  hashDiscordId: vi.fn(),
}))

vi.mock("@/lib/auth", () => mockAuth)

const mockCrypto = vi.hoisted(() => ({
  sha256Base64Url: vi.fn(),
  canonicalJson: vi.fn(),
  signedPayload: vi.fn(),
  signPresenceRelease: vi.fn(),
}))

vi.mock("@/lib/crypto", () => mockCrypto)

vi.mock("@nowly/websites", () => ({
  getPresence: vi.fn(() => undefined),
  getRegistry: vi.fn(() => []),
}))

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(),
}))

vi.mock("fs", () => mockFs)

vi.mock("@/lib/paths", () => ({
  PRESENCES_DIR: "C:\\presences",
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
    delete process.env.API_SECRET_KEY
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
    delete process.env.API_SECRET_KEY
  })

  it("GET /presences returns empty array when no slugs", async () => {
    mockRedisModule.getAllPresenceSlugs.mockResolvedValue([])

    const res = await app.inject({ method: "GET", url: "/presences" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual([])
  })

  it("GET /presences returns registry with metadata and stats", async () => {
    const meta = {
      name: "YouTube",
      slug: "youtube",
      author: { name: "Gaëtan H", github: "steellgold" },
      category: "streaming",
      description: { "en-US": "Watch videos" },
      color: "#FF0033",
      url: ["youtube.com"],
      assets: { logo: "logo.png", icon: "icon.png", thumbnail: "thumbnail.jpg" },
      tags: ["video"],
    }
    const stats = {
      totalInstalls: 500, activeUsers: 42, rating: 4.5, ratingCount: 100,
      ratingDistribution: { 5: 60, 4: 25, 3: 10, 2: 3, 1: 2 },
    }

    mockRedisModule.getAllPresenceSlugs.mockResolvedValue(["youtube"])
    mockRedisModule.getPresenceMeta.mockResolvedValue(meta)
    mockRedisModule.getPresenceStats.mockResolvedValue(stats)
    mockRedisModule.getVersion.mockResolvedValue("1.0.0")

    const res = await app.inject({ method: "GET", url: "/presences" })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveLength(1)
    expect(body[0].slug).toBe("youtube")
    expect(body[0].name).toBe("YouTube")
    expect(body[0].version).toBe("1.0.0")
    expect(body[0].totalInstalls).toBe(500)
    expect(body[0].activeUsers).toBe(42)
    expect(body[0].rating).toBe(4.5)
    expect(body[0].ratingCount).toBe(100)
    expect(body[0].ratingDistribution).toEqual({ 5: 60, 4: 25, 3: 10, 2: 3, 1: 2 })
  })
})

describe("Presence Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    delete process.env.API_SECRET_KEY
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
    delete process.env.API_SECRET_KEY
  })

  it("GET /presences/:slug returns 404 for unknown", async () => {
    mockRedisModule.getPresenceMeta.mockResolvedValue(null)

    const res = await app.inject({ method: "GET", url: "/presences/nonexistent" })

    expect(res.statusCode).toBe(404)
  })

  it("GET /presences/:slug returns 200 with release data", async () => {
    const { getPresence } = await import("@nowly/websites")
    const websites = await import("@nowly/websites")

    vi.mocked(getPresence).mockReturnValue({
      name: "YouTube",
      author: "test",
      category: "streaming",
      description: "Watch videos",
      settings: {},
    })

    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue("console.log('hello')")

    mockRedisModule.getPresenceStats.mockResolvedValue({
      totalInstalls: 100, activeUsers: 10, rating: 4.5, ratingCount: 20,
      ratingDistribution: { 5: 10, 4: 5, 3: 3, 2: 1, 1: 1 },
      version: "1.0.0", addedAt: "2024-01-01", lastUpdated: "2024-06-01",
    })

    mockCrypto.sha256Base64Url.mockReturnValue("abc123")
    mockCrypto.canonicalJson.mockReturnValue('{"name":"YouTube"}')
    mockCrypto.signedPayload.mockReturnValue("signed-payload")
    mockCrypto.signPresenceRelease.mockReturnValue("signature-value")

    const res = await app.inject({ method: "GET", url: "/presences/youtube" })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.slug).toBe("youtube")
    expect(body.version).toBe("1.0.0")
    expect(body.bundle).toBe("console.log('hello')")
    expect(body.sha256).toBe("abc123")
    expect(body.metadataHash).toBeDefined()
    expect(body.signature).toBe("signature-value")
    expect(body.totalInstalls).toBe(100)
    expect(body.activeUsers).toBe(10)
    expect(body.rating).toBe(4.5)
  })

  it("GET /presences/:slug/versions returns version history", async () => {
    const history = [
      { version: "1.0.0", changelog: '{"en-US":"First release","fr-FR":"Première version","es-ES":"Primera versión"}', author: "test", timestamp: 1700000000000 },
      { version: "0.0.1", changelog: "", author: "test", timestamp: 1690000000000 },
    ]

    mockRedisModule.getVersionHistory.mockResolvedValue(history)

    const res = await app.inject({ method: "GET", url: "/presences/youtube/versions" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual(history)
  })

  it("PUT /presences/:slug returns 401 without auth when secret is configured", async () => {
    process.env.API_SECRET_KEY = "test-secret"

    const res = await app.inject({
      method: "PUT",
      url: "/presences/youtube",
      payload: { version: "1.0.0" },
    })

    expect(res.statusCode).toBe(401)
  })

  it("PUT /presences/:slug returns 200 with valid auth", async () => {
    process.env.API_SECRET_KEY = "test-secret"

    mockRedisModule.setVersion.mockResolvedValue(undefined as any)
    mockRedisModule.addVersion.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "PUT",
      url: "/presences/youtube",
      headers: { authorization: "Bearer test-secret" },
      payload: {
        version: "2.0.0",
        changelog: "Big update",
        author: "dev",
        authorGithub: "dev-github",
        pr: "42",
        added: "2024-01-01",
        updated: "2024-06-01",
      },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true })
    expect(mockRedisModule.setVersion).toHaveBeenCalledWith("youtube", "2.0.0")
    expect(mockRedisModule.addVersion).toHaveBeenCalled()
    expect(mockRedisModule.setAdded).toHaveBeenCalledWith("youtube", "2024-01-01")
    expect(mockRedisModule.setUpdated).toHaveBeenCalledWith("youtube", "2024-06-01")
  })

  it("POST /presences/sync returns 401 without auth", async () => {
    process.env.API_SECRET_KEY = "test-secret"

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: { presences: [] },
    })

    expect(res.statusCode).toBe(401)
  })

  it("POST /presences/sync processes presences and returns results", async () => {
    mockRedisModule.getPresenceStats.mockResolvedValue({
      totalInstalls: 0, activeUsers: 0, rating: 0, ratingCount: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      version: null, addedAt: null, lastUpdated: null,
    })
    mockRedisModule.setVersion.mockResolvedValue(undefined as any)
    mockRedisModule.setPresenceMeta.mockResolvedValue(undefined as any)
    mockRedisModule.setAdded.mockResolvedValue(undefined as any)
    mockRedisModule.addVersion.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: {
        presences: [{
          slug: "youtube",
          type: "new",
          name: "YouTube",
          category: "streaming",
          author: "dev",
          description: { "en-US": "Watch videos" },
        }],
        pr: "42",
        prTitle: "Add YouTube presence",
      },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.ok).toBe(true)
    expect(body.results).toHaveLength(1)
    expect(body.results[0].slug).toBe("youtube")
    expect(body.results[0].version).toBe("1.0.0")
    expect(body.results[0].changelog).toBeTruthy()
    expect(mockRedisModule.setVersion).toHaveBeenCalledWith("youtube", "1.0.0")
    expect(mockRedisModule.setAdded).toHaveBeenCalledWith("youtube")
    expect(mockRedisModule.setPresenceMeta).toHaveBeenCalledWith("youtube", expect.objectContaining({
      slug: "youtube", name: "YouTube", author: "dev", category: "streaming",
    }))
  })
})

describe("Stats Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    delete process.env.API_SECRET_KEY
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
    delete process.env.API_SECRET_KEY
  })

  it("POST /presences/active updates multiple presences", async () => {
    mockRedisModule.setActiveUsers.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "POST",
      url: "/presences/active",
      payload: { presences: ["youtube", "twitch"] },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, count: 2 })
    expect(mockRedisModule.setActiveUsers).toHaveBeenCalledTimes(2)
    expect(mockRedisModule.setActiveUsers).toHaveBeenCalledWith("youtube", 1)
    expect(mockRedisModule.setActiveUsers).toHaveBeenCalledWith("twitch", 1)
  })

  it("POST /presences/:slug/installs increments and returns count", async () => {
    mockRedisModule.incrementInstalls.mockResolvedValue(42)

    const res = await app.inject({ method: "POST", url: "/presences/youtube/installs" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ totalInstalls: 42 })
  })

  it("POST /presences/:slug/comments rejects invalid rating (>5)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/presences/youtube/comments",
      payload: { rating: 6 },
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toBe("Rating must be an integer between 1 and 5")
  })

  it("POST /presences/:slug/comments rejects rating below 1", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/presences/youtube/comments",
      payload: { rating: 0 },
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toBe("Rating must be an integer between 1 and 5")
  })

  it("POST /presences/:slug/comments returns 401 without auth", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/presences/youtube/comments",
      payload: { rating: 3 },
    })

    expect(res.statusCode).toBe(401)
  })

  it("POST /presences/:slug/comments accepts valid rating with auth", async () => {
    const discordUser = {
      discordId: "12345",
      username: "testuser",
      globalName: "TestUser",
      avatar: null,
      avatar_url: null,
    }

    mockAuth.verifyToken.mockReturnValue(discordUser)
    mockRedisModule.hasDiscordRated.mockResolvedValue(false)
    mockRedisModule.markDiscordRated.mockResolvedValue(undefined as any)
    mockRedisModule.submitRating.mockResolvedValue({
      avg: 4.2, count: 15,
      distribution: { 5: 8, 4: 4, 3: 2, 2: 1, 1: 0 },
    })
    mockRedisModule.submitComment.mockResolvedValue({
      id: "comment-123",
      rating: 4,
      comment: "Great presence!",
      anonymous: false,
      authorId: "12345",
      authorName: "TestUser",
      createdAt: "2024-01-01T00:00:00.000Z",
    })
    mockRedisModule.setUserRating.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "POST",
      url: "/presences/youtube/comments",
      headers: { authorization: "Bearer valid-token" },
      payload: { rating: 4, comment: "Great presence!", anonymous: false },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.comment).toBe("Great presence!")
    expect(body.stats.avg).toBe(4.2)
    expect(body.stats.count).toBe(15)

    expect(mockRedisModule.hasDiscordRated).toHaveBeenCalledWith("youtube", "12345")
    expect(mockRedisModule.markDiscordRated).toHaveBeenCalledWith("youtube", "12345")
    expect(mockRedisModule.submitRating).toHaveBeenCalledWith("youtube", 4)
    expect(mockRedisModule.submitComment).toHaveBeenCalledWith("youtube", expect.objectContaining({
      rating: 4, comment: "Great presence!", anonymous: false,
    }))
    expect(mockRedisModule.setUserRating).toHaveBeenCalledWith("youtube", "12345", 4, true, expect.any(String))
  })

  it("POST /presences/:slug/comments returns stats when already rated", async () => {
    const discordUser = {
      discordId: "12345",
      username: "testuser",
      globalName: "TestUser",
      avatar: null,
      avatar_url: null,
    }

    mockAuth.verifyToken.mockReturnValue(discordUser)
    mockRedisModule.hasDiscordRated.mockResolvedValue(true)
    mockRedisModule.getPresenceStats.mockResolvedValue({
      totalInstalls: 0, activeUsers: 0, rating: 4.5, ratingCount: 10,
      ratingDistribution: { 5: 5, 4: 3, 3: 1, 2: 1, 1: 0 },
      version: null, addedAt: null, lastUpdated: null,
    })
    mockRedisModule.setUserRating.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "POST",
      url: "/presences/youtube/comments",
      headers: { authorization: "Bearer valid-token" },
      payload: { rating: 4 },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.stats.avg).toBe(4.5)
    expect(body.stats.count).toBe(10)
    expect(mockRedisModule.markDiscordRated).not.toHaveBeenCalled()
    expect(mockRedisModule.submitRating).not.toHaveBeenCalled()
  })

  it("GET /presences/:slug/comments returns comments", async () => {
    const comments = [
      { id: "c1", rating: 5, comment: "Great!", authorId: "user1", authorName: "User1", anonymous: false, createdAt: "2024-01-01T00:00:00.000Z" },
      { id: "c2", rating: 3, comment: "OK", authorId: "user2", authorName: "User2", anonymous: false, createdAt: "2024-01-02T00:00:00.000Z" },
    ]

    mockRedisModule.getComments.mockResolvedValue(comments)

    const res = await app.inject({ method: "GET", url: "/presences/youtube/comments" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual(comments)
  })

  it("GET /presences/:slug/comments marks own comments with x-user-token", async () => {
    const comments = [
      { id: "c1", rating: 5, comment: "Great!", authorId: "user1", authorName: "User1", anonymous: false, createdAt: "2024-01-01T00:00:00.000Z" },
      { id: "c2", rating: 3, comment: "OK", authorId: "hashed_other", authorName: "User2", anonymous: true, createdAt: "2024-01-02T00:00:00.000Z" },
    ]

    mockRedisModule.getComments.mockResolvedValue(comments)
    mockAuth.verifyToken.mockReturnValue({
      discordId: "user1",
      username: "testuser",
      globalName: "TestUser",
      avatar: null,
      avatar_url: null,
    })
    mockAuth.hashDiscordId.mockReturnValue("hashed_user1")

    const res = await app.inject({
      method: "GET",
      url: "/presences/youtube/comments",
      headers: { "x-user-token": "Bearer valid-token" },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body[0].isOwn).toBe(true)
    expect(body[1].isOwn).toBe(false)
  })

  it("GET /presences/:slug/my-rating returns 401 without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/presences/youtube/my-rating" })

    expect(res.statusCode).toBe(401)
  })

  it("GET /presences/:slug/my-rating returns rating data", async () => {
    mockAuth.verifyToken.mockReturnValue({
      discordId: "12345",
      username: "testuser",
      globalName: "TestUser",
      avatar: null,
      avatar_url: null,
    })
    mockRedisModule.getUserRating.mockResolvedValue({
      rating: 4,
      hasComment: true,
      commentId: "c1",
    })

    const res = await app.inject({
      method: "GET",
      url: "/presences/youtube/my-rating",
      headers: { authorization: "Bearer valid-token" },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      rated: true, rating: 4, hasComment: true,
    })
  })

  it("GET /presences/:slug/my-rating returns rated false when no rating", async () => {
    mockAuth.verifyToken.mockReturnValue({
      discordId: "12345",
      username: "testuser",
      globalName: "TestUser",
      avatar: null,
      avatar_url: null,
    })
    mockRedisModule.getUserRating.mockResolvedValue(null)

    const res = await app.inject({
      method: "GET",
      url: "/presences/youtube/my-rating",
      headers: { authorization: "Bearer valid-token" },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      rated: false, rating: 0, hasComment: false,
    })
  })

  it("DELETE /presences/:slug/comments returns 401 without auth", async () => {
    const res = await app.inject({ method: "DELETE", url: "/presences/youtube/comments" })

    expect(res.statusCode).toBe(401)
  })

  it("DELETE /presences/:slug/comments returns 404 when no rating", async () => {
    mockAuth.verifyToken.mockReturnValue({
      discordId: "12345",
      username: "testuser",
      globalName: "TestUser",
      avatar: null,
      avatar_url: null,
    })
    mockRedisModule.getUserRating.mockResolvedValue(null)

    const res = await app.inject({
      method: "DELETE",
      url: "/presences/youtube/comments",
      headers: { authorization: "Bearer valid-token" },
    })

    expect(res.statusCode).toBe(404)
  })

  it("DELETE /presences/:slug/comments deletes rating", async () => {
    mockAuth.verifyToken.mockReturnValue({
      discordId: "12345",
      username: "testuser",
      globalName: "TestUser",
      avatar: null,
      avatar_url: null,
    })
    mockRedisModule.getUserRating.mockResolvedValue({
      rating: 3,
      hasComment: true,
      commentId: "comment-abc",
    })
    mockRedis.get.mockResolvedValue(5)
    mockRedis.zrem.mockResolvedValue(1)
    mockRedis.del.mockResolvedValue(1)
    mockRedis.decr.mockResolvedValue(4)
    mockRedisModule.removeUserRating.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "DELETE",
      url: "/presences/youtube/comments",
      headers: { authorization: "Bearer valid-token" },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true })

    expect(mockRedis.zrem).toHaveBeenCalledWith("presence:youtube:comments", "comment-abc")
    expect(mockRedis.del).toHaveBeenCalledWith("presence:youtube:comment:comment-abc")
    expect(mockRedis.get).toHaveBeenCalled()
    expect(mockRedis.decr).toHaveBeenCalledWith("presence:youtube:ratings:3")
    expect(mockRedisModule.removeUserRating).toHaveBeenCalledWith("youtube", "12345")
  })

  it("DELETE /presences/:slug/comments skips zrem when no commentId", async () => {
    mockAuth.verifyToken.mockReturnValue({
      discordId: "12345",
      username: "testuser",
      globalName: "TestUser",
      avatar: null,
      avatar_url: null,
    })
    mockRedisModule.getUserRating.mockResolvedValue({
      rating: 5,
      hasComment: false,
    })
    mockRedis.get.mockResolvedValue(3)
    mockRedis.decr.mockResolvedValue(2)
    mockRedisModule.removeUserRating.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "DELETE",
      url: "/presences/youtube/comments",
      headers: { authorization: "Bearer valid-token" },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true })
    expect(mockRedis.zrem).not.toHaveBeenCalled()
    expect(mockRedis.del).not.toHaveBeenCalled()
    expect(mockRedis.decr).toHaveBeenCalledWith("presence:youtube:ratings:5")
    expect(mockRedisModule.removeUserRating).toHaveBeenCalledWith("youtube", "12345")
  })
})
