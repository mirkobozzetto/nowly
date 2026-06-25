vi.mock("@/features/analytics/analytics.metric", () => ({
  getAnalyticsMetric: vi.fn((key: string) => {
    const metrics: Record<string, any> = {
      presence_install: { key: "presence_install", allowedPayloadKeys: ["source"] },
      presence_error: { key: "presence_error", allowedPayloadKeys: ["stage"] },
    }
    return metrics[key] ?? undefined
  }),
}))

import { beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  device: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  devicePresence: {
    upsert: vi.fn(),
  },
  analyticsEvent: {
    create: vi.fn(),
  },
}))

vi.mock("@/db/client", () => ({
  hasDatabase: vi.fn(() => true),
  getPrisma: vi.fn(() => mockPrisma),
}))

describe("analytics-store", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.device.findUnique.mockResolvedValue({ analyticsConsent: true })
    mockPrisma.device.upsert.mockResolvedValue({})
    mockPrisma.devicePresence.upsert.mockResolvedValue({})
    mockPrisma.analyticsEvent.create.mockResolvedValue({})
  })

  it("records a known event when device consent is enabled", async () => {
    const { recordAnalyticsEvents } = await import("@/features/analytics/analytics.service")

    const result = await recordAnalyticsEvents([
      {
        key: "presence_install",
        deviceId: "device-1",
        slug: "YouTube",
        version: "1.0.0",
        payload: { source: "extension" },
      },
    ])

    expect(result).toEqual({ inserted: 1, rejected: 0 })
    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: "presence_install",
        deviceId: "device-1",
        slug: "youtube",
        version: "1.0.0",
        payload: { source: "extension" },
      }),
    })
  })

  it("ignores consent-gated events when device consent is disabled", async () => {
    const { recordAnalyticsEvents } = await import("@/features/analytics/analytics.service")
    mockPrisma.device.findUnique.mockResolvedValue({ analyticsConsent: false })

    const result = await recordAnalyticsEvents([
      { key: "presence_install", deviceId: "device-1", slug: "youtube" },
    ])

    expect(result).toEqual({ inserted: 0, rejected: 0 })
    expect(mockPrisma.analyticsEvent.create).not.toHaveBeenCalled()
  })

  it("rejects unknown event keys", async () => {
    const { recordAnalyticsEvents } = await import("@/features/analytics/analytics.service")

    const result = await recordAnalyticsEvents([
      { key: "watched_video_title", deviceId: "device-1" },
    ])

    expect(result).toEqual({ inserted: 0, rejected: 1 })
    expect(mockPrisma.analyticsEvent.create).not.toHaveBeenCalled()
  })

  it("strips forbidden and non-whitelisted payload fields", async () => {
    const { recordAnalyticsEvents } = await import("@/features/analytics/analytics.service")

    await recordAnalyticsEvents([
      {
        key: "presence_error",
        deviceId: "device-1",
        slug: "youtube",
        payload: {
          stage: "presence-error",
          url: "https://example.com/watch?v=secret",
          title: "private title",
          userAgent: "full ua",
          random: "ignored",
        },
      },
    ])

    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        payload: { stage: "presence-error" },
      }),
    })
  })

  it("syncs an uninstall as installed false, enabled false, and uninstalledAt set", async () => {
    const { syncDevice } = await import("@/features/analytics/analytics.service")

    await syncDevice({
      deviceId: "device-1",
      presences: [{ slug: "YouTube", version: "1.2.3", enabled: true, installed: false }],
    })

    expect(mockPrisma.devicePresence.upsert).toHaveBeenCalledWith({
      where: { deviceId_slug: { deviceId: "device-1", slug: "youtube" } },
      create: expect.objectContaining({
        deviceId: "device-1",
        slug: "youtube",
        installedVersion: "1.2.3",
        installed: false,
        enabled: false,
        uninstalledAt: expect.any(Date),
      }),
      update: expect.objectContaining({
        installedVersion: "1.2.3",
        installed: false,
        enabled: false,
        uninstalledAt: expect.any(Date),
      }),
    })
  })
})
