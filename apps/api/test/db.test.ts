import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  presence: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  presenceVersion: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  device: {
    upsert: vi.fn(),
  },
  devicePresence: {
    upsert: vi.fn(),
    count: vi.fn(),
  },
  presenceActiveDevice: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
  rating: {
    count: vi.fn(),
    groupBy: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  comment: {
    create: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("@/db/client", () => ({
  getPrisma: vi.fn(() => mockPrisma),
  hasDatabase: vi.fn(() => true),
}))

import {
  getPresenceStats,
  incrementInstalls,
  setActiveUsers,
  markActiveDevice,
  clearActiveDevice,
  clearActiveDevicesForDevice,
  submitRating,
  hasDiscordRated,
  markDiscordRated,
  getUserRating,
  setUserRating,
  removeUserRating,
  setUpdated,
  setAdded,
  setVersion,
  getVersion,
  addVersion,
  setPresenceMeta,
  getPresenceMeta,
  getAllPresenceSlugs,
  getVersionHistory,
} from "@/features/presence/presence.repository"

import {
  submitComment,
  getComments,
} from "@/features/rating/rating.repository"

describe("getPresenceStats", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns defaults when no data", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    mockPrisma.devicePresence.count.mockResolvedValue(0)
    mockPrisma.rating.groupBy.mockResolvedValue([])
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.presenceActiveDevice.count.mockResolvedValue(0)

    const stats = await getPresenceStats("youtube")
    expect(stats.totalInstalls).toBe(0)
    expect(stats.activeUsers).toBe(0)
    expect(stats.version).toBeNull()
    expect(stats.addedAt).toBeNull()
    expect(stats.lastUpdated).toBeNull()
    expect(stats.rating).toBe(0)
    expect(stats.ratingCount).toBe(0)
    expect(stats.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
  })

  it("computes weighted rating", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    mockPrisma.devicePresence.count.mockResolvedValue(0)
    mockPrisma.rating.groupBy.mockResolvedValue([
      { rating: 5, _count: { _all: 10 } },
      { rating: 4, _count: { _all: 20 } },
      { rating: 3, _count: { _all: 30 } },
      { rating: 2, _count: { _all: 20 } },
      { rating: 1, _count: { _all: 10 } },
    ])
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.presenceActiveDevice.count.mockResolvedValue(0)

    const stats = await getPresenceStats("youtube")
    expect(stats.ratingCount).toBe(90)
    expect(stats.rating).toBe(3)
    expect(stats.ratingDistribution).toEqual({ 5: 10, 4: 20, 3: 30, 2: 20, 1: 10 })
  })

  it("returns presence fields when present", async () => {
    const addedAt = new Date("2024-01-01")
    const updatedAt = new Date("2024-06-01")
    mockPrisma.presence.findUnique.mockResolvedValue({
      slug: "youtube", version: "1.2.3", addedAt, updatedAt,
    })
    mockPrisma.devicePresence.count.mockResolvedValue(100)
    mockPrisma.rating.groupBy.mockResolvedValue([])
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.presenceActiveDevice.count.mockResolvedValue(25)

    const stats = await getPresenceStats("youtube")
    expect(stats.totalInstalls).toBe(100)
    expect(stats.activeUsers).toBe(25)
    expect(stats.version).toBe("1.2.3")
    expect(stats.addedAt).toBe("2024-01-01T00:00:00.000Z")
    expect(stats.lastUpdated).toBe("2024-06-01T00:00:00.000Z")
  })

  it("returns active users from tracked devices when present", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    mockPrisma.devicePresence.count.mockResolvedValue(100)
    mockPrisma.rating.groupBy.mockResolvedValue([])
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 5 })
    mockPrisma.presenceActiveDevice.count.mockResolvedValue(7)

    const stats = await getPresenceStats("youtube")
    expect(stats.activeUsers).toBe(7)
    expect(mockPrisma.presenceActiveDevice.deleteMany).toHaveBeenCalled()
    expect(mockPrisma.presenceActiveDevice.count).toHaveBeenCalledWith({ where: { slug: "youtube" } })
  })
})

describe("incrementInstalls", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("increments and returns", async () => {
    mockPrisma.device.upsert.mockResolvedValue({ deviceId: "dev-1" })
    mockPrisma.devicePresence.upsert.mockResolvedValue({ deviceId: "dev-1", slug: "yt" })
    mockPrisma.devicePresence.count.mockResolvedValue(42)

    expect(await incrementInstalls("yt", "dev-1")).toBe(42)
    expect(mockPrisma.device.upsert).toHaveBeenCalled()
    expect(mockPrisma.devicePresence.upsert).toHaveBeenCalled()
    expect(mockPrisma.devicePresence.count).toHaveBeenCalledWith({ where: { slug: "yt", installed: true } })
  })
})

describe("setActiveUsers", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("is a no-op", async () => {
    await expect(setActiveUsers("yt", 10)).resolves.toBeUndefined()
  })
})

describe("markActiveDevice / clearActiveDevice", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("tracks active devices via upsert", async () => {
    mockPrisma.presenceActiveDevice.upsert.mockResolvedValue({ slug: "yt", deviceId: "device-1" })
    await markActiveDevice("yt", "device-1", 123)
    expect(mockPrisma.presenceActiveDevice.upsert).toHaveBeenCalledWith({
      where: { slug_deviceId: { slug: "yt", deviceId: "device-1" } },
      create: { slug: "yt", deviceId: "device-1", lastSeenAt: expect.any(Date) },
      update: { lastSeenAt: expect.any(Date) },
    })
  })

  it("removes an active device from a presence", async () => {
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 1 })
    await clearActiveDevice("yt", "device-1")
    expect(mockPrisma.presenceActiveDevice.deleteMany).toHaveBeenCalledWith({
      where: { slug: "yt", deviceId: "device-1" },
    })
  })

  it("clears a device across every presence", async () => {
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 2 })
    await clearActiveDevicesForDevice("device-1")
    expect(mockPrisma.presenceActiveDevice.deleteMany).toHaveBeenCalledWith({
      where: { deviceId: "device-1" },
    })
  })
})

describe("submitRating", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns stats from getPresenceStats", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    mockPrisma.devicePresence.count.mockResolvedValue(0)
    mockPrisma.rating.groupBy.mockResolvedValue([
      { rating: 5, _count: { _all: 1 } },
    ])
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.presenceActiveDevice.count.mockResolvedValue(0)

    const r = await submitRating("yt", 5)
    expect(r.avg).toBe(5)
    expect(r.count).toBe(1)
    expect(r.distribution).toEqual({ 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 })
  })

  it("computes correct average with multiple ratings", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    mockPrisma.devicePresence.count.mockResolvedValue(0)
    mockPrisma.rating.groupBy.mockResolvedValue([
      { rating: 5, _count: { _all: 5 } },
      { rating: 4, _count: { _all: 3 } },
      { rating: 3, _count: { _all: 1 } },
    ])
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.presenceActiveDevice.count.mockResolvedValue(0)

    const r = await submitRating("yt", 4)
    expect(r.avg).toBe(4.4)
    expect(r.count).toBe(9)
  })
})

describe("hasDiscordRated / markDiscordRated", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns true/false based on count", async () => {
    mockPrisma.rating.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1)
    expect(await hasDiscordRated("yt", "discord_123")).toBe(false)
    expect(await hasDiscordRated("yt", "discord_123")).toBe(true)
    expect(mockPrisma.rating.count).toHaveBeenCalledWith({
      where: { slug: "yt", discordUserId: "discord_123" },
    })
  })

  it("markDiscordRated is a no-op", async () => {
    await expect(markDiscordRated("yt", "discord_123")).resolves.toBeUndefined()
  })
})

describe("getUserRating / setUserRating", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns null when no rating exists", async () => {
    mockPrisma.rating.findUnique.mockResolvedValue(null)
    expect(await getUserRating("yt", "discord_123")).toBeNull()
  })

  it("returns parsed rating", async () => {
    mockPrisma.rating.findUnique.mockResolvedValue({
      slug: "yt",
      discordUserId: "discord_123",
      rating: 4,
      hasComment: true,
      commentId: "cmt_1",
    })
    const r = await getUserRating("yt", "discord_123")
    expect(r).toEqual({ rating: 4, hasComment: true, commentId: "cmt_1" })
    expect(mockPrisma.rating.findUnique).toHaveBeenCalledWith({
      where: { slug_discordUserId: { slug: "yt", discordUserId: "discord_123" } },
    })
  })

  it("omits commentId when null in db", async () => {
    mockPrisma.rating.findUnique.mockResolvedValue({
      slug: "yt",
      discordUserId: "discord_123",
      rating: 5,
      hasComment: false,
      commentId: null,
    })
    const r = await getUserRating("yt", "discord_123")
    expect(r).toEqual({ rating: 5, hasComment: false, commentId: undefined })
  })

  it("upserts rating fields", async () => {
    mockPrisma.rating.upsert.mockResolvedValue({})
    await setUserRating("yt", "discord_123", 5, true, "cmt_1")
    expect(mockPrisma.rating.upsert).toHaveBeenCalledWith({
      where: { slug_discordUserId: { slug: "yt", discordUserId: "discord_123" } },
      create: { slug: "yt", discordUserId: "discord_123", rating: 5, hasComment: true, commentId: "cmt_1" },
      update: { rating: 5, hasComment: true, commentId: "cmt_1", updatedAt: expect.any(Date) },
    })
  })

  it("omits commentId when not provided", async () => {
    mockPrisma.rating.upsert.mockResolvedValue({})
    await setUserRating("yt", "discord_123", 3, false)
    expect(mockPrisma.rating.upsert).toHaveBeenCalledWith({
      where: { slug_discordUserId: { slug: "yt", discordUserId: "discord_123" } },
      create: { slug: "yt", discordUserId: "discord_123", rating: 3, hasComment: false, commentId: undefined },
      update: { rating: 3, hasComment: false, commentId: undefined, updatedAt: expect.any(Date) },
    })
  })
})

describe("removeUserRating", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deletes rating by slug and discordId", async () => {
    mockPrisma.rating.deleteMany.mockResolvedValue({ count: 1 })
    await removeUserRating("yt", "discord_123")
    expect(mockPrisma.rating.deleteMany).toHaveBeenCalledWith({
      where: { slug: "yt", discordUserId: "discord_123" },
    })
  })
})

describe("setUpdated / setAdded", () => {
  beforeEach(() => vi.clearAllMocks())

  it("upserts updated with provided date", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setUpdated("yt", "2024-06-01")
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", updatedAt: new Date("2024-06-01") },
      update: { updatedAt: new Date("2024-06-01") },
    })
  })

  it("upserts updated with auto date when not provided", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    const before = Date.now()
    await setUpdated("yt")
    expect(mockPrisma.presence.upsert).toHaveBeenCalled()
    const call = mockPrisma.presence.upsert.mock.calls[0][0]
    expect(call.where.slug).toBe("yt")
    expect(call.create.updatedAt.getTime()).toBeGreaterThanOrEqual(before)
  })

  it("upserts added with provided date", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setAdded("yt", "2024-01-01")
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", addedAt: new Date("2024-01-01") },
      update: { addedAt: new Date("2024-01-01") },
    })
  })

  it("upserts added with auto date when not provided", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setAdded("yt")
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", addedAt: expect.any(Date) },
      update: { addedAt: expect.any(Date) },
    })
  })
})

describe("setVersion / getVersion", () => {
  beforeEach(() => vi.clearAllMocks())

  it("upserts version", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setVersion("yt", "1.0.0")
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", version: "1.0.0", updatedAt: expect.any(Date) },
      update: { version: "1.0.0", updatedAt: expect.any(Date) },
    })
  })

  it("retrieves version", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue({ version: "1.0.0" })
    expect(await getVersion("yt")).toBe("1.0.0")
    expect(mockPrisma.presence.findUnique).toHaveBeenCalledWith({
      where: { slug: "yt" }, select: { version: true },
    })
  })

  it("returns null when no version", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    expect(await getVersion("yt")).toBeNull()
  })
})

describe("addVersion", () => {
  beforeEach(() => vi.clearAllMocks())

  it("upserts presence and presenceVersion", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    mockPrisma.presenceVersion.upsert.mockResolvedValue({})

    const entry = { version: "1.0.0", changelog: "Initial", author: "dev", timestamp: 123 }
    await addVersion("yt", entry)

    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", version: "1.0.0" },
      update: {},
    })

    expect(mockPrisma.presenceVersion.upsert).toHaveBeenCalledWith({
      where: { slug_version: { slug: "yt", version: "1.0.0" } },
      create: {
        slug: "yt", version: "1.0.0", changelog: "Initial", author: "dev",
        timestamp: new Date(123), createdAt: new Date(123),
      },
      update: {
        changelog: "Initial", author: "dev",
        timestamp: new Date(123), createdAt: new Date(123),
      },
    })
  })

  it("handles optional fields", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    mockPrisma.presenceVersion.upsert.mockResolvedValue({})

    const entry = {
      version: "1.0.0", changelog: "Initial", author: "dev",
      authorGithub: undefined, pr: undefined, timestamp: 456,
    }
    await addVersion("yt", entry)

    const createCall = mockPrisma.presenceVersion.upsert.mock.calls[0][0].create
    expect(createCall.authorGithub).toBeUndefined()
    expect(createCall.pr).toBeUndefined()
  })
})

describe("setPresenceMeta / getPresenceMeta", () => {
  beforeEach(() => vi.clearAllMocks())

  it("stores JSON metadata", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setPresenceMeta("yt", { name: "YT" })
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", metadata: { name: "YT" } },
      update: { metadata: { name: "YT" } },
    })
  })

  it("retrieves metadata", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue({ metadata: { name: "YT" } })
    expect(await getPresenceMeta("yt")).toEqual({ name: "YT" })
    expect(mockPrisma.presence.findUnique).toHaveBeenCalledWith({
      where: { slug: "yt" }, select: { metadata: true },
    })
  })

  it("returns null when missing", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    expect(await getPresenceMeta("yt")).toBeNull()
  })
})

describe("getAllPresenceSlugs", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns slugs from all presences ordered alphabetically", async () => {
    mockPrisma.presence.findMany.mockResolvedValue([
      { slug: "youtube" }, { slug: "twitch" },
    ])
    expect(await getAllPresenceSlugs()).toEqual(["youtube", "twitch"])
    expect(mockPrisma.presence.findMany).toHaveBeenCalledWith({
      select: { slug: true }, orderBy: { slug: "asc" },
    })
  })

  it("returns empty when none", async () => {
    mockPrisma.presence.findMany.mockResolvedValue([])
    expect(await getAllPresenceSlugs()).toEqual([])
  })
})

describe("submitComment / getComments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates and returns a comment entry", async () => {
    mockPrisma.comment.create.mockResolvedValue({})
    const entry = await submitComment("yt", {
      rating: 5, comment: "Great!", authorName: "User",
    })
    expect(entry.id).toBeDefined()
    expect(entry.createdAt).toBeDefined()
    expect(entry.rating).toBe(5)
    expect(entry.comment).toBe("Great!")
    expect(entry.authorName).toBe("User")
    expect(mockPrisma.comment.create).toHaveBeenCalledWith({
      data: {
        id: entry.id,
        slug: "yt",
        rating: 5,
        comment: "Great!",
        authorName: "User",
        authorId: undefined,
        authorAvatar: undefined,
        anonymous: false,
        createdAt: expect.any(Date),
      },
    })
  })

  it("handles undefined optional fields in submitComment", async () => {
    mockPrisma.comment.create.mockResolvedValue({})
    const entry = await submitComment("yt", {
      rating: 3, authorName: undefined, authorAvatar: undefined,
      anonymous: undefined, authorId: undefined, comment: undefined,
    })
    expect(entry.authorName).toBeUndefined()
  })

  it("returns empty array when no comments", async () => {
    mockPrisma.comment.findMany.mockResolvedValue([])
    expect(await getComments("yt")).toEqual([])
    expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
      where: { slug: "yt" },
      orderBy: { createdAt: "desc" },
    })
  })

  it("fetches and returns comments in reverse order", async () => {
    mockPrisma.comment.findMany.mockResolvedValue([
      { id: "id1", rating: 5, comment: "Great", authorName: "A", authorId: null, authorAvatar: null, anonymous: false, createdAt: new Date("2024-01-02") },
      { id: "id2", rating: 3, comment: "Ok", authorName: "B", authorId: null, authorAvatar: null, anonymous: false, createdAt: new Date("2024-01-01") },
    ])
    const comments = await getComments("yt")
    expect(comments).toHaveLength(2)
    expect(comments[0].id).toBe("id1")
    expect(comments[1].rating).toBe(3)
  })
})

describe("getVersionHistory", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns empty when none", async () => {
    mockPrisma.presenceVersion.findMany.mockResolvedValue([])
    expect(await getVersionHistory("yt")).toEqual([])
    expect(mockPrisma.presenceVersion.findMany).toHaveBeenCalledWith({
      where: { slug: "yt" },
      orderBy: { timestamp: "desc" },
    })
  })

  it("returns version entries", async () => {
    mockPrisma.presenceVersion.findMany.mockResolvedValue([
      { version: "1.0.0", changelog: "Release", author: "dev", timestamp: new Date(200), createdAt: new Date(200), authorGithub: null, releaseAuthor: null, releaseContributors: null, pr: null, source: null, commitSha: null, changedFiles: null, bundleSizeBytes: null, bundleSizeLabel: null, bundleSha256: null, versionType: null, aiGeneratedChangelog: null },
      { version: "0.9.0", changelog: "Beta", author: "dev", timestamp: new Date(100), createdAt: new Date(100), authorGithub: null, releaseAuthor: null, releaseContributors: null, pr: null, source: null, commitSha: null, changedFiles: null, bundleSizeBytes: null, bundleSizeLabel: null, bundleSha256: null, versionType: null, aiGeneratedChangelog: null },
    ])
    const history = await getVersionHistory("yt")
    expect(history).toHaveLength(2)
    expect(history[0].version).toBe("1.0.0")
    expect(history[1].version).toBe("0.9.0")
  })
})
