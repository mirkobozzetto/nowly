import { describe, it, expect } from "vitest"
import { bumpVersion, getLocalBundle } from "../cli/api"

describe("bumpVersion", () => {
  it("bumps patch version", () => {
    expect(bumpVersion("1.0.0", "patch")).toBe("1.0.1")
    expect(bumpVersion("0.0.1", "patch")).toBe("0.0.2")
  })

  it("bumps minor version", () => {
    expect(bumpVersion("1.0.0", "minor")).toBe("1.1.0")
    expect(bumpVersion("2.3.4", "minor")).toBe("2.4.0")
  })

  it("bumps major version", () => {
    expect(bumpVersion("1.0.0", "major")).toBe("2.0.0")
    expect(bumpVersion("0.1.0", "major")).toBe("1.0.0")
  })

  it("handles non-standard versions", () => {
    expect(bumpVersion("0.0.0", "patch")).toBe("0.0.1")
    expect(bumpVersion("0.0.0", "minor")).toBe("0.1.0")
    expect(bumpVersion("0.0.0", "major")).toBe("1.0.0")
  })
})

describe("getLocalBundle", () => {
  it("returns null when bundle not found", () => {
    const result = getLocalBundle("nonexistent-slug")
    expect(result).toBeNull()
  })
})
