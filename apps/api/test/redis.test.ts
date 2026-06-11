import { describe, it, expect, vi, beforeEach } from "vitest"

const mockRedis = vi.hoisted(() => ({
  mget: vi.fn(),
  incr: vi.fn(),
  sismember: vi.fn(),
  sadd: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  zadd: vi.fn(),
  zcard: vi.fn(),
  hset: vi.fn(),
  hgetall: vi.fn(),
  zrange: vi.fn(),
  scan: vi.fn(),
  srem: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  zremrangebyscore: vi.fn(),
  zrem: vi.fn(),
}))

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => mockRedis),
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
  submitComment,
  getComments,
  getVersionHistory,
} from "@/lib/redis"

describe("getPresenceStats", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns defaults when no data", async () => {
    mockRedis.mget.mockResolvedValue([null, null, null, null, null, null, null, null, null])
    mockRedis.exists.mockResolvedValue(0)
    const stats = await getPresenceStats("youtube")
    expect(stats.totalInstalls).toBe(0)
    expect(stats.activeUsers).toBe(0)
    expect(stats.version).toBeNull()
    expect(stats.addedAt).toBeNull()
    expect(stats.lastUpdated).toBeNull()
    expect(stats.rating).toBe(0)
    expect(stats.ratingCount).toBe(0)
    expect(Object.keys(stats.ratingDistribution)).toHaveLength(5)
    expect(stats.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
    expect(mockRedis.mget).toHaveBeenCalledWith(
      "presence:youtube:installs", "presence:youtube:active",
      "presence:youtube:version", "presence:youtube:added", "presence:youtube:updated",
      "presence:youtube:ratings:5", "presence:youtube:ratings:4",
      "presence:youtube:ratings:3", "presence:youtube:ratings:2",
      "presence:youtube:ratings:1",
    )
  })

  it("computes weighted rating", async () => {
    mockRedis.mget.mockResolvedValue([null, null, null, null, null, 10, 20, 30, 20, 10])
    mockRedis.exists.mockResolvedValue(0)
    const stats = await getPresenceStats("youtube")
    expect(stats.ratingCount).toBe(90)
    expect(stats.rating).toBe(3)
    expect(stats.ratingDistribution).toEqual({ 5: 10, 4: 20, 3: 30, 2: 20, 1: 10 })
  })

  it("returns integer fields when present", async () => {
    mockRedis.mget.mockResolvedValue([100, 25, "1.2.3", "2024-01-01", "2024-06-01", 0, 0, 0, 0, 0])
    mockRedis.exists.mockResolvedValue(0)
    const stats = await getPresenceStats("youtube")
    expect(stats.totalInstalls).toBe(100)
    expect(stats.activeUsers).toBe(25)
    expect(stats.version).toBe("1.2.3")
    expect(stats.addedAt).toBe("2024-01-01")
    expect(stats.lastUpdated).toBe("2024-06-01")
  })

  it("returns active users from tracked devices when present", async () => {
    mockRedis.mget.mockResolvedValue([100, 0, "1.2.3", "2024-01-01", "2024-06-01", 0, 0, 0, 0, 0])
    mockRedis.exists.mockResolvedValue(1)
    mockRedis.zremrangebyscore.mockResolvedValue(0)
    mockRedis.zcard.mockResolvedValue(7)

    const stats = await getPresenceStats("youtube")

    expect(stats.activeUsers).toBe(7)
    expect(mockRedis.zremrangebyscore).toHaveBeenCalledWith("presence:youtube:active-devices", 0, expect.any(Number))
    expect(mockRedis.zcard).toHaveBeenCalledWith("presence:youtube:active-devices")
  })
})

describe("incrementInstalls", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("increments and returns", async () => {
    mockRedis.incr.mockResolvedValue(42)
    expect(await incrementInstalls("yt")).toBe(42)
    expect(mockRedis.incr).toHaveBeenCalledWith("presence:yt:installs")
  })
})

describe("setActiveUsers", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("sets active users count", async () => {
    await setActiveUsers("yt", 10)
    expect(mockRedis.set).toHaveBeenCalledWith("presence:yt:active", 10)
  })
})

describe("markActiveDevice / clearActiveDevice", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("tracks active devices in a sorted set", async () => {
    await markActiveDevice("yt", "device-1", 123)
    expect(mockRedis.zadd).toHaveBeenCalledWith("presence:yt:active-devices", {
      score: 123,
      member: "device-1",
    })
  })

  it("removes an active device from a presence", async () => {
    await clearActiveDevice("yt", "device-1")
    expect(mockRedis.zrem).toHaveBeenCalledWith("presence:yt:active-devices", "device-1")
  })

  it("clears a device across every presence", async () => {
    mockRedis.scan.mockResolvedValue(["0", ["presence:a:version", "presence:b:version"]])
    mockRedis.zrem.mockResolvedValue(1)

    await clearActiveDevicesForDevice("device-1")

    expect(mockRedis.zrem).toHaveBeenCalledWith("presence:a:active-devices", "device-1")
    expect(mockRedis.zrem).toHaveBeenCalledWith("presence:b:active-devices", "device-1")
  })
})

describe("submitRating", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("increments and returns stats", async () => {
    mockRedis.incr.mockResolvedValue(1)
    mockRedis.mget.mockResolvedValue([null, null, null, null, null, 1, 0, 0, 0, 0])
    const r = await submitRating("yt", 5)
    expect(mockRedis.incr).toHaveBeenCalledWith("presence:yt:ratings:5")
    expect(r.avg).toBe(5)
    expect(r.count).toBe(1)
    expect(r.distribution).toEqual({ 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 })
  })

  it("computes correct average with multiple ratings", async () => {
    mockRedis.incr.mockResolvedValue(1)
    mockRedis.mget.mockResolvedValue([null, null, null, null, null, 5, 3, 1, 0, 0])
    const r = await submitRating("yt", 4)
    expect(r.avg).toBe(4.4)
    expect(r.count).toBe(9)
  })
})

describe("hasDiscordRated / markDiscordRated", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns true/false based on sismember", async () => {
    mockRedis.sismember.mockResolvedValueOnce(0).mockResolvedValueOnce(1)
    expect(await hasDiscordRated("yt", "discord_123")).toBe(false)
    expect(await hasDiscordRated("yt", "discord_123")).toBe(true)
    expect(mockRedis.sismember).toHaveBeenCalledWith("presence:yt:discord-raters", "discord_123")
  })

  it("marks discord user as rater", async () => {
    await markDiscordRated("yt", "discord_123")
    expect(mockRedis.sadd).toHaveBeenCalledWith("presence:yt:discord-raters", "discord_123")
  })
})

describe("getUserRating / setUserRating", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns null when no rating exists", async () => {
    mockRedis.hgetall.mockResolvedValue(null)
    expect(await getUserRating("yt", "discord_123")).toBeNull()
  })

  it("returns null when rating field missing", async () => {
    mockRedis.hgetall.mockResolvedValue({ hasComment: "true" })
    expect(await getUserRating("yt", "discord_123")).toBeNull()
  })

  it("returns parsed rating", async () => {
    mockRedis.hgetall.mockResolvedValue({ rating: "4", hasComment: "true", commentId: "cmt_1" })
    const r = await getUserRating("yt", "discord_123")
    expect(r).toEqual({ rating: 4, hasComment: true, commentId: "cmt_1" })
    expect(mockRedis.hgetall).toHaveBeenCalledWith("presence:yt:discord-user:discord_123")
  })

  it("omits commentId when empty string", async () => {
    mockRedis.hgetall.mockResolvedValue({ rating: "5", hasComment: "false", commentId: "" })
    const r = await getUserRating("yt", "discord_123")
    expect(r).toEqual({ rating: 5, hasComment: false, commentId: undefined })
  })

  it("stores rating fields", async () => {
    await setUserRating("yt", "discord_123", 5, true, "cmt_1")
    expect(mockRedis.hset).toHaveBeenCalledWith("presence:yt:discord-user:discord_123", {
      rating: "5", hasComment: "true", commentId: "cmt_1",
    })
  })

  it("omits commentId when not provided", async () => {
    await setUserRating("yt", "discord_123", 3, false)
    expect(mockRedis.hset).toHaveBeenCalledWith("presence:yt:discord-user:discord_123", {
      rating: "3", hasComment: "false",
    })
  })
})

describe("removeUserRating", () => {
  beforeEach(() => vi.clearAllMocks())

  it("removes rater from set and deletes hash", async () => {
    await removeUserRating("yt", "discord_123")
    expect(mockRedis.srem).toHaveBeenCalledWith("presence:yt:discord-raters", "discord_123")
    expect(mockRedis.del).toHaveBeenCalledWith("presence:yt:discord-user:discord_123")
  })
})

describe("setUpdated / setAdded", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sets updated with provided date", async () => {
    await setUpdated("yt", "2024-06-01")
    expect(mockRedis.set).toHaveBeenCalledWith("presence:yt:updated", "2024-06-01")
  })

  it("sets updated with auto date when not provided", async () => {
    const before = new Date().toISOString()
    await setUpdated("yt")
    expect(mockRedis.set).toHaveBeenCalled()
    const key = mockRedis.set.mock.calls[0][0]
    const val = mockRedis.set.mock.calls[0][1]
    expect(key).toBe("presence:yt:updated")
    expect(new Date(val).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime())
  })

  it("sets added with provided date", async () => {
    await setAdded("yt", "2024-01-01")
    expect(mockRedis.set).toHaveBeenCalledWith("presence:yt:added", "2024-01-01")
  })

  it("sets added with auto date when not provided", async () => {
    await setAdded("yt")
    expect(mockRedis.set).toHaveBeenCalledWith("presence:yt:added", expect.any(String))
  })
})

describe("setVersion / getVersion", () => {
  beforeEach(() => vi.clearAllMocks())

  it("stores version", async () => {
    await setVersion("yt", "1.0.0")
    expect(mockRedis.set).toHaveBeenCalledWith("presence:yt:version", "1.0.0")
  })

  it("retrieves version", async () => {
    mockRedis.get.mockResolvedValue("1.0.0")
    expect(await getVersion("yt")).toBe("1.0.0")
    expect(mockRedis.get).toHaveBeenCalledWith("presence:yt:version")
  })
})

describe("addVersion", () => {
  beforeEach(() => vi.clearAllMocks())

  it("adds version to sorted set and stores details", async () => {
    const entry = { version: "1.0.0", changelog: "Initial", author: "dev", timestamp: 123 }
    await addVersion("yt", entry)
    expect(mockRedis.zadd).toHaveBeenCalledWith("presence:yt:versions", { score: 123, member: "1.0.0" })
    expect(mockRedis.hset).toHaveBeenCalledWith("presence:yt:version:1.0.0", entry)
  })

  it("strips null values", async () => {
    const entry = {
      version: "1.0.0", changelog: "Initial", author: "dev",
      authorGithub: undefined, pr: undefined, timestamp: 456,
    }
    await addVersion("yt", entry)
    expect(mockRedis.hset).toHaveBeenCalledWith("presence:yt:version:1.0.0", {
      version: "1.0.0", changelog: "Initial", author: "dev", timestamp: 456,
    })
  })
})

describe("setPresenceMeta / getPresenceMeta", () => {
  beforeEach(() => vi.clearAllMocks())

  it("stores JSON string", async () => {
    await setPresenceMeta("yt", { name: "YT" })
    expect(mockRedis.set).toHaveBeenCalledWith("presence:yt:meta", '{"name":"YT"}')
  })

  it("retrieves parsed object", async () => {
    mockRedis.get.mockResolvedValue('{"name":"YT"}')
    expect(await getPresenceMeta("yt")).toEqual({ name: "YT" })
    expect(mockRedis.get).toHaveBeenCalledWith("presence:yt:meta")
  })

  it("returns null when missing", async () => {
    mockRedis.get.mockResolvedValue(null)
    expect(await getPresenceMeta("yt")).toBeNull()
  })

  it("returns parsed object when already object (not JSON string)", async () => {
    const obj = { name: "YT" }
    mockRedis.get.mockResolvedValue(obj)
    expect(await getPresenceMeta("yt")).toEqual(obj)
  })

  it("returns null on invalid JSON", async () => {
    mockRedis.get.mockResolvedValue("{bad}")
    expect(await getPresenceMeta("yt")).toBeNull()
  })
})

describe("getAllPresenceSlugs", () => {
  beforeEach(() => vi.clearAllMocks())

  it("parses scan results", async () => {
    mockRedis.scan.mockResolvedValueOnce(["0", ["presence:a:version", "presence:b:version"]])
    expect(await getAllPresenceSlugs()).toEqual(["a", "b"])
  })

  it("handles pagination", async () => {
    mockRedis.scan
      .mockResolvedValueOnce(["1", ["presence:a:version"]])
      .mockResolvedValueOnce(["0", ["presence:b:version"]])
    expect(await getAllPresenceSlugs()).toEqual(["a", "b"])
    expect(mockRedis.scan).toHaveBeenCalledTimes(2)
  })

  it("deduplicates slugs", async () => {
    mockRedis.scan.mockResolvedValueOnce(["0", ["presence:a:version", "presence:a:version"]])
    expect(await getAllPresenceSlugs()).toEqual(["a"])
  })

  it("returns empty when none", async () => {
    mockRedis.scan.mockResolvedValue(["0", []])
    expect(await getAllPresenceSlugs()).toEqual([])
  })
})

describe("submitComment / getComments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates and returns a comment entry", async () => {
    const entry = await submitComment("yt", {
      rating: 5, comment: "Great!", authorName: "User",
    })
    expect(entry.id).toBeDefined()
    expect(entry.createdAt).toBeDefined()
    expect(entry.rating).toBe(5)
    expect(entry.comment).toBe("Great!")
    expect(entry.authorName).toBe("User")
    expect(mockRedis.zadd).toHaveBeenCalledWith(
      "presence:yt:comments", { score: expect.any(Number), member: entry.id },
    )
    expect(mockRedis.hset).toHaveBeenCalledWith("presence:yt:comment:" + entry.id, {
      id: entry.id, rating: 5, comment: "Great!", authorName: "User",
      createdAt: entry.createdAt,
    })
  })

  it("strips null/undefined optional fields in submitComment", async () => {
    const entry = await submitComment("yt", {
      rating: 3, authorName: undefined, authorAvatar: undefined,
      anonymous: undefined, authorId: undefined, comment: undefined,
    })
    expect(entry.authorName).toBeUndefined()
  })

  it("returns empty array when no comments", async () => {
    mockRedis.zrange.mockResolvedValue([])
    expect(await getComments("yt")).toEqual([])
    expect(mockRedis.zrange).toHaveBeenCalledWith(
      "presence:yt:comments", 0, -1, { rev: true },
    )
  })

  it("fetches and returns comments in reverse order", async () => {
    mockRedis.zrange.mockResolvedValue(["id1", "id2"])
    mockRedis.hgetall
      .mockResolvedValueOnce({ id: "id1", rating: "5", comment: "Great", authorName: "A", createdAt: "t1" })
      .mockResolvedValueOnce({ id: "id2", rating: "3", comment: "Ok", authorName: "B", createdAt: "t2" })
    const comments = await getComments("yt")
    expect(comments).toHaveLength(2)
    expect(comments[0].id).toBe("id1")
    expect(comments[1].rating).toBe(3)
    expect(mockRedis.hgetall).toHaveBeenCalledWith("presence:yt:comment:id1")
    expect(mockRedis.hgetall).toHaveBeenCalledWith("presence:yt:comment:id2")
  })

  it("filters out null entries", async () => {
    mockRedis.zrange.mockResolvedValue(["id1", "id2"])
    mockRedis.hgetall.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "id2", rating: "4", createdAt: "t" })
    const comments = await getComments("yt")
    expect(comments).toHaveLength(1)
    expect(comments[0].id).toBe("id2")
  })

  it("parses anonymous flag", async () => {
    mockRedis.zrange.mockResolvedValue(["id1"])
    mockRedis.hgetall.mockResolvedValue({ id: "id1", rating: "5", anonymous: "true", createdAt: "t" })
    const comments = await getComments("yt")
    expect(comments[0].anonymous).toBe(true)
  })
})

describe("getVersionHistory", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns empty when none", async () => {
    mockRedis.zrange.mockResolvedValue([])
    expect(await getVersionHistory("yt")).toEqual([])
    expect(mockRedis.zrange).toHaveBeenCalledWith(
      "presence:yt:versions", 0, -1, { rev: true },
    )
  })

  it("returns version entries", async () => {
    mockRedis.zrange.mockResolvedValue(["1.0.0", "0.9.0"])
    mockRedis.hgetall
      .mockResolvedValueOnce({ version: "1.0.0", changelog: "Release", author: "dev", timestamp: "200" })
      .mockResolvedValueOnce({ version: "0.9.0", changelog: "Beta", author: "dev", timestamp: "100" })
    const history = await getVersionHistory("yt")
    expect(history).toHaveLength(2)
    expect(history[0].version).toBe("1.0.0")
    expect(history[1].version).toBe("0.9.0")
    expect(mockRedis.hgetall).toHaveBeenCalledWith("presence:yt:version:1.0.0")
    expect(mockRedis.hgetall).toHaveBeenCalledWith("presence:yt:version:0.9.0")
  })

  it("filters out null entries", async () => {
    mockRedis.zrange.mockResolvedValue(["1.0.0", "bad"])
    mockRedis.hgetall
      .mockResolvedValueOnce({ version: "1.0.0", changelog: "Release", author: "dev", timestamp: "200" })
      .mockResolvedValueOnce(null)
    const history = await getVersionHistory("yt")
    expect(history).toHaveLength(1)
  })
})
