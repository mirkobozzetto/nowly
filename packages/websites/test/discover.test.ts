import { describe, it, expect } from "vitest"
import { getSlugFromName, getLetterFromName } from "../cli/discover"

describe("getSlugFromName", () => {
  it("converts name to lowercase dashed slug", () => {
    expect(getSlugFromName("Apple TV+")).toBe("apple-tv+")
    expect(getSlugFromName("Disney Plus")).toBe("disney-plus")
    expect(getSlugFromName("YouTube")).toBe("youtube")
  })

  it("trims and collapses whitespace", () => {
    expect(getSlugFromName("  Foo  Bar  ")).toBe("-foo-bar-")
  })

  it("handles empty string", () => {
    expect(getSlugFromName("")).toBe("")
  })
})

describe("getLetterFromName", () => {
  it("returns first letter uppercase", () => {
    expect(getLetterFromName("YouTube")).toBe("Y")
    expect(getLetterFromName("apple TV+")).toBe("A")
    expect(getLetterFromName("twitch")).toBe("T")
  })

  it("handles single character", () => {
    expect(getLetterFromName("A")).toBe("A")
  })

  it("handles empty string", () => {
    expect(getLetterFromName("")).toBe("")
  })
})
