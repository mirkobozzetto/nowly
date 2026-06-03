import { describe, it, expect, vi, beforeEach } from "vitest"

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

import {
  getPresenceStats,
  incrementInstalls,
  setActiveUsers,
  submitRating,
  hasRated,
  hasDeviceRated,
  markRated,
  markDeviceRated,
  setVersion,
  getVersion,
  setPresenceMeta,
  getPresenceMeta,
  addVersion,
  getAllPresenceSlugs,
  getVersionHistory,
} from "@/lib/redis"

describe("getPresenceStats", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns defaults when no data", async () => {
    mockRedis.mget.mockResolvedValue([null, null, null, null, null, null, null, null, null])
    const stats = await getPresenceStats("youtube")
    expect(stats.totalInstalls).toBe(0)
    expect(stats.version).toBeNull()
    expect(stats.rating).toBe(0)
    expect(Object.keys(stats.ratingDistribution)).toHaveLength(5)
  })

  it("computes weighted rating", async () => {
    mockRedis.mget.mockResolvedValue([null, null, null, null, null, 10, 20, 30, 20, 10])
    const stats = await getPresenceStats("youtube")
    expect(stats.ratingCount).toBe(90)
    expect(stats.rating).toBeGreaterThan(0)
  })
})

describe("incrementInstalls", () => {
  it("increments and returns", async () => {
    mockRedis.incr.mockResolvedValue(42)
    expect(await incrementInstalls("yt")).toBe(42)
    expect(mockRedis.incr).toHaveBeenCalledWith("presence:yt:installs")
  })
})

describe("hasRated / markRated", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns true/false based on sismember", async () => {
    mockRedis.sismember.mockResolvedValueOnce(0).mockResolvedValueOnce(1)
    expect(await hasRated("yt", "ip")).toBe(false)
    expect(await hasRated("yt", "ip")).toBe(true)
  })

  it("marks IP", async () => {
    await markRated("yt", "ip")
    expect(mockRedis.sadd).toHaveBeenCalledWith("presence:yt:raters", "ip")
  })
})

describe("hasDeviceRated / markDeviceRated", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns based on sismember", async () => {
    mockRedis.sismember.mockResolvedValue(1)
    expect(await hasDeviceRated("yt", "dev")).toBe(true)
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
  })

  it("returns null when missing", async () => {
    mockRedis.get.mockResolvedValue(null)
    expect(await getPresenceMeta("yt")).toBeNull()
  })

  it("returns null on invalid JSON", async () => {
    mockRedis.get.mockResolvedValue("{bad}")
    expect(await getPresenceMeta("yt")).toBeNull()
  })
})

describe("getAllPresenceSlugs", () => {
  it("parses scan results", async () => {
    mockRedis.scan.mockResolvedValueOnce(["0", ["presence:a:version", "presence:b:version"]])
    expect(await getAllPresenceSlugs()).toEqual(["a", "b"])
  })

  it("handles pagination", async () => {
    mockRedis.scan.mockResolvedValueOnce(["1", ["presence:a:version"]]).mockResolvedValueOnce(["0", ["presence:b:version"]])
    expect(await getAllPresenceSlugs()).toEqual(["a", "b"])
  })

  it("returns empty when none", async () => {
    mockRedis.scan.mockResolvedValue(["0", []])
    expect(await getAllPresenceSlugs()).toEqual([])
  })
})

describe("getVersionHistory", () => {
  it("returns empty when none", async () => {
    mockRedis.zrange.mockResolvedValue([])
    expect(await getVersionHistory("yt")).toEqual([])
  })
})

describe("submitRating", () => {
  it("increments and returns stats", async () => {
    mockRedis.incr.mockResolvedValue(1)
    mockRedis.mget.mockResolvedValue([null, null, null, null, null, 1, 0, 0, 0, 0])
    const r = await submitRating("yt", 5)
    expect(r.avg).toBe(5)
    expect(r.count).toBe(1)
  })
})

describe("setVersion / getVersion", () => {
  it("stores version", async () => {
    await setVersion("yt", "1.0.0")
    expect(mockRedis.set).toHaveBeenCalledWith("presence:yt:version", "1.0.0")
  })

  it("retrieves version", async () => {
    mockRedis.get.mockResolvedValue("1.0.0")
    expect(await getVersion("yt")).toBe("1.0.0")
  })
})
