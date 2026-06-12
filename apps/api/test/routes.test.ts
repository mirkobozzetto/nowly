import cors from "@fastify/cors"
import { imageProxyRoutes } from "@/features/image-proxy/image-proxy.routes"
import { presenceRoutes } from "@/features/presence/presence.routes"
import { ratingRoutes } from "@/features/rating/rating.routes"
import { registryRoutes } from "@/features/registry/registry.routes"
import { getPresence } from "@nowly/websites"
import Fastify from "fastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockPresenceRepo = vi.hoisted(() => ({
  getAllPresenceSlugs: vi.fn(),
  getPresenceMeta: vi.fn(),
  getVersion: vi.fn(),
  getPresenceStats: vi.fn(),
  incrementInstalls: vi.fn(),
  setActiveUsers: vi.fn(),
  markActiveDevice: vi.fn(),
  clearActiveDevice: vi.fn(),
  clearActiveDevicesForDevice: vi.fn(),
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
  getUserRating: vi.fn(),
  removeUserRating: vi.fn(),
}))

const mockRatingRepo = vi.hoisted(() => ({
  submitComment: vi.fn(),
  getComments: vi.fn(),
}))

vi.mock("@/features/presence/presence.repository", () => mockPresenceRepo)
vi.mock("@/features/rating/rating.repository", () => mockRatingRepo)

const mockPrisma = vi.hoisted(() => ({
  comment: { delete: vi.fn() },
}))

vi.mock("@/db/client", () => ({
  getPrisma: vi.fn(() => mockPrisma),
  hasDatabase: vi.fn(() => true),
}))

const mockAuth = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  hashDiscordId: vi.fn(),
}))

vi.mock("@/features/auth/auth.service", () => mockAuth)

const mockCrypto = vi.hoisted(() => ({
  sha256Base64Url: vi.fn(),
  canonicalJson: vi.fn(),
  signedPayload: vi.fn(),
  signPresenceRelease: vi.fn(),
}))

vi.mock("@/shared/crypto.service", () => mockCrypto)

vi.mock("@nowly/websites", () => ({
  getPresence: vi.fn(() => undefined),
  getRegistry: vi.fn(() => []),
}))

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(),
}))

vi.mock("fs", () => mockFs)

vi.mock("@/shared/paths", () => ({
  PRESENCES_DIR: "C:\\presences",
}))

async function buildApp() {
  const app = Fastify()
  await app.register(cors, { origin: true })
  await app.register(registryRoutes, { prefix: "/presences" })
  await app.register(presenceRoutes, { prefix: "/presences" })
  await app.register(ratingRoutes, { prefix: "/presences" })
  await app.register(imageProxyRoutes)
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
    mockPresenceRepo.getAllPresenceSlugs.mockResolvedValue([])

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
      version: "1.0.0", addedAt: null, lastUpdated: null,
    }

    mockPresenceRepo.getAllPresenceSlugs.mockResolvedValue(["youtube"])
    mockPresenceRepo.getPresenceMeta.mockResolvedValue(meta)
    mockPresenceRepo.getPresenceStats.mockResolvedValue(stats)

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
    mockPresenceRepo.getPresenceMeta.mockResolvedValue(null)

    const res = await app.inject({ method: "GET", url: "/presences/nonexistent" })

    expect(res.statusCode).toBe(404)
  })

  it("GET /presences/:slug returns 200 with release data", async () => {
    vi.mocked(getPresence).mockReturnValue({
      name: "YouTube",
      author: { name: "test" },
      category: "streaming",
      description: { "en-US": "Watch videos" },
      url: ["youtube.com"],
      color: "#FF0033",
      assets: { logo: "logo.png", icon: "icon.png", thumbnail: "thumbnail.jpg" },
      settings: {},
    })

    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue("console.log('hello')")

    mockPresenceRepo.getPresenceStats.mockResolvedValue({
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

    mockPresenceRepo.getVersionHistory.mockResolvedValue(history)

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

    mockPresenceRepo.setVersion.mockResolvedValue(undefined as any)
    mockPresenceRepo.addVersion.mockResolvedValue(undefined as any)

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
    expect(mockPresenceRepo.setVersion).toHaveBeenCalledWith("youtube", "2.0.0")
    expect(mockPresenceRepo.addVersion).toHaveBeenCalled()
    expect(mockPresenceRepo.setAdded).toHaveBeenCalledWith("youtube", "2024-01-01")
    expect(mockPresenceRepo.setUpdated).toHaveBeenCalledWith("youtube", "2024-06-01")
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
    mockPresenceRepo.getPresenceStats.mockResolvedValue({
      totalInstalls: 0, activeUsers: 0, rating: 0, ratingCount: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      version: null, addedAt: null, lastUpdated: null,
    })
    mockPresenceRepo.setVersion.mockResolvedValue(undefined as any)
    mockPresenceRepo.setPresenceMeta.mockResolvedValue(undefined as any)
    mockPresenceRepo.setAdded.mockResolvedValue(undefined as any)
    mockPresenceRepo.addVersion.mockResolvedValue(undefined as any)

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
    expect(mockPresenceRepo.setVersion).toHaveBeenCalledWith("youtube", "1.0.0")
    expect(mockPresenceRepo.setAdded).toHaveBeenCalledWith("youtube")
    expect(mockPresenceRepo.setPresenceMeta).toHaveBeenCalledWith("youtube", expect.objectContaining({
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
    mockPresenceRepo.markActiveDevice.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "POST",
      url: "/presences/active",
      payload: { presences: ["youtube", "twitch"], deviceId: "device-123" },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, count: 2 })
    expect(mockPresenceRepo.markActiveDevice).toHaveBeenCalledTimes(2)
    expect(mockPresenceRepo.markActiveDevice).toHaveBeenCalledWith("youtube", "device-123")
    expect(mockPresenceRepo.markActiveDevice).toHaveBeenCalledWith("twitch", "device-123")
  })

  it("DELETE /presences/active/:deviceId/:slug clears one tracked presence", async () => {
    mockPresenceRepo.clearActiveDevice.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "DELETE",
      url: "/presences/active/device-123/youtube",
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, removed: 1 })
    expect(mockPresenceRepo.clearActiveDevice).toHaveBeenCalledWith("youtube", "device-123")
  })

  it("DELETE /presences/active/:deviceId clears every tracked presence", async () => {
    mockPresenceRepo.clearActiveDevicesForDevice.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "DELETE",
      url: "/presences/active/device-123",
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, removed: null })
    expect(mockPresenceRepo.clearActiveDevicesForDevice).toHaveBeenCalledWith("device-123")
  })

  it("POST /presences/:slug/installs increments and returns count", async () => {
    mockPresenceRepo.incrementInstalls.mockResolvedValue(42)

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
    mockPresenceRepo.hasDiscordRated.mockResolvedValue(false)
    mockPresenceRepo.markDiscordRated.mockResolvedValue(undefined as any)
    mockPresenceRepo.submitRating.mockResolvedValue({
      avg: 4.2, count: 15,
      distribution: { 5: 8, 4: 4, 3: 2, 2: 1, 1: 0 },
    })
    mockRatingRepo.submitComment.mockResolvedValue({
      id: "comment-123",
      rating: 4,
      comment: "Great presence!",
      anonymous: false,
      authorId: "12345",
      authorName: "TestUser",
      createdAt: "2024-01-01T00:00:00.000Z",
    })
    mockPresenceRepo.setUserRating.mockResolvedValue(undefined as any)

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

    expect(mockPresenceRepo.hasDiscordRated).toHaveBeenCalledWith("youtube", "12345")
    expect(mockPresenceRepo.markDiscordRated).toHaveBeenCalledWith("youtube", "12345")
    expect(mockPresenceRepo.submitRating).toHaveBeenCalledWith("youtube", 4)
    expect(mockRatingRepo.submitComment).toHaveBeenCalledWith("youtube", expect.objectContaining({
      rating: 4, comment: "Great presence!", anonymous: false,
    }))
    expect(mockPresenceRepo.setUserRating).toHaveBeenCalledWith("youtube", "12345", 4, true, expect.any(String))
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
    mockPresenceRepo.hasDiscordRated.mockResolvedValue(true)
    mockPresenceRepo.getPresenceStats.mockResolvedValue({
      totalInstalls: 0, activeUsers: 0, rating: 4.5, ratingCount: 10,
      ratingDistribution: { 5: 5, 4: 3, 3: 1, 2: 1, 1: 0 },
      version: null, addedAt: null, lastUpdated: null,
    })
    mockPresenceRepo.setUserRating.mockResolvedValue(undefined as any)

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
    expect(mockPresenceRepo.markDiscordRated).not.toHaveBeenCalled()
    expect(mockPresenceRepo.submitRating).not.toHaveBeenCalled()
  })

  it("GET /presences/:slug/comments returns comments", async () => {
    const comments = [
      { id: "c1", rating: 5, comment: "Great!", authorId: "user1", authorName: "User1", anonymous: false, createdAt: "2024-01-01T00:00:00.000Z" },
      { id: "c2", rating: 3, comment: "OK", authorId: "user2", authorName: "User2", anonymous: false, createdAt: "2024-01-02T00:00:00.000Z" },
    ]

    mockRatingRepo.getComments.mockResolvedValue(comments)

    const res = await app.inject({ method: "GET", url: "/presences/youtube/comments" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual(comments)
  })

  it("GET /presences/:slug/comments marks own comments with x-user-token", async () => {
    const comments = [
      { id: "c1", rating: 5, comment: "Great!", authorId: "user1", authorName: "User1", anonymous: false, createdAt: "2024-01-01T00:00:00.000Z" },
      { id: "c2", rating: 3, comment: "OK", authorId: "hashed_other", authorName: "User2", anonymous: true, createdAt: "2024-01-02T00:00:00.000Z" },
    ]

    mockRatingRepo.getComments.mockResolvedValue(comments)
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
    mockPresenceRepo.getUserRating.mockResolvedValue({
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
    mockPresenceRepo.getUserRating.mockResolvedValue(null)

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
    mockPresenceRepo.getUserRating.mockResolvedValue(null)

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
    mockPresenceRepo.getUserRating.mockResolvedValue({
      rating: 3,
      hasComment: true,
      commentId: "comment-abc",
    })
    mockPresenceRepo.removeUserRating.mockResolvedValue(undefined as any)
    mockPrisma.comment.delete.mockResolvedValue({} as any)

    const res = await app.inject({
      method: "DELETE",
      url: "/presences/youtube/comments",
      headers: { authorization: "Bearer valid-token" },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true })

    expect(mockPresenceRepo.removeUserRating).toHaveBeenCalledWith("youtube", "12345")
    expect(mockPrisma.comment.delete).toHaveBeenCalledWith({ where: { id: "comment-abc" } })
  })

  it("DELETE /presences/:slug/comments skips comment deletion when no commentId", async () => {
    mockAuth.verifyToken.mockReturnValue({
      discordId: "12345",
      username: "testuser",
      globalName: "TestUser",
      avatar: null,
      avatar_url: null,
    })
    mockPresenceRepo.getUserRating.mockResolvedValue({
      rating: 5,
      hasComment: false,
    })
    mockPresenceRepo.removeUserRating.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "DELETE",
      url: "/presences/youtube/comments",
      headers: { authorization: "Bearer valid-token" },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true })
    expect(mockPresenceRepo.removeUserRating).toHaveBeenCalledWith("youtube", "12345")
  })
})

describe("Image Proxy Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  const originalFetch = globalThis.fetch

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
    globalThis.fetch = originalFetch
  })

  it("GET /image-proxy rejects non-TikTok CDN URLs", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?url=${encodeURIComponent("https://example.com/image.jpg")}`,
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: "Invalid image URL" })
  })

  it("GET /image-proxy rejects unencoded nested query parameters", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/image-proxy?service=tiktok&url=https://p16-common-sign.tiktokcdn-eu.com/image.jpg?dr=1&x-signature=abc",
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({
      error: "Image URL must be encoded",
      message: "Encode the full image URL with encodeURIComponent before passing it to the url parameter.",
    })
  })

  it("GET /image-proxy returns fetched TikTok CDN images", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/jpeg", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?url=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.jpg")}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/jpeg")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([1, 2, 3]))
    const fetchMock = vi.mocked(globalThis.fetch)
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://p16-common-sign.tiktokcdn-eu.com/image.jpg",
    )
    expect(fetchMock.mock.calls[0][1]).toBeTruthy()
  })

  it("GET /i returns fetched supported CDN images with a short URL", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([16, 17, 18]), {
      status: 200,
      headers: { "content-type": "image/jpeg", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "GET",
      url: `/i?u=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.jpg?x=1&y=2")}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/jpeg")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([16, 17, 18]))
    const fetchMock = vi.mocked(globalThis.fetch)
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://p16-common-sign.tiktokcdn-eu.com/image.jpg?x=1&y=2",
    )
    expect(fetchMock.mock.calls[0][1]).toBeTruthy()
  })

  it("POST /images-proxy caches fetched images and returns a short public URL", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([21, 22, 23]), {
      status: 200,
      headers: { "content-type": "image/png", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/image.png?x=1&y=2",
      },
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["access-control-allow-origin"]).toBe("*")

    const body = JSON.parse(res.body) as { url: string; expiresIn: number }
    expect(body.url).toMatch(
      /^http:\/\/localhost(?::\d+)?\/images-proxy\/[a-zA-Z0-9_-]{32}$/,
    )
    expect(body.expiresIn).toBe(300)
  })

  it("POST /images-proxy reuses a cached image URL without refetching", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/jpeg", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/image.jpg",
      },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { url: string }
    expect(body.url).toContain("/images-proxy/")

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    globalThis.fetch = vi.fn()

    const res2 = await app.inject({
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/image.jpg",
      },
    })

    expect(res2.statusCode).toBe(200)
    const body2 = JSON.parse(res2.body) as { url: string }
    expect(body2.url).toBe(body.url)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("GET /images-proxy/:id returns a cached image", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([31, 32, 33]), {
      status: 200,
      headers: { "content-type": "image/webp", "content-length": "3" },
    }))

    const postRes = await app.inject({
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/cached-image.webp",
      },
    })
    const { url: imageUrl } = JSON.parse(postRes.body) as { url: string }
    const id = imageUrl.split("/").pop()!

    const res = await app.inject({
      method: "GET",
      url: `/images-proxy/${id}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/webp")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([31, 32, 33]))
  })

  it("GET /images-proxy/:id returns 404 when the cached image does not exist", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/images-proxy/nonexistent_id_1234567890abc",
    })

    expect(res.statusCode).toBe(404)
    expect(JSON.parse(res.body)).toEqual({ error: "Image not found" })
  })

  it("GET /image-proxy supports explicit service matching", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([4, 5, 6]), {
      status: 200,
      headers: { "content-type": "image/webp", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?service=tiktok&url=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.webp")}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/webp")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([4, 5, 6]))
  })

  it("GET /image-proxy rejects URLs that do not match the explicit service", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?service=unknown&url=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.jpg")}`,
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: "Invalid image URL" })
  })
})
