import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync, existsSync } from "fs"

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

import { getRegistry, getPresence } from "../src/index"

describe("getRegistry", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns empty array when registry.json does not exist", () => {
    vi.mocked(existsSync).mockReturnValue(false)
    expect(getRegistry()).toEqual([])
  })
})

describe("getPresence", () => {
  it("returns undefined for unknown slug when registry is empty", () => {
    expect(getPresence("nonexistent")).toBeUndefined()
  })
})
