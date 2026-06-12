import { describe, it, expect } from "vitest"
import { readFileSync, existsSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const PKG_ROOT = join(dirname(__filename), "..")
const SRC = join(PKG_ROOT, "src")

function getMetadataFiles(): string[] {
  if (!existsSync(SRC)) return []
  const files: string[] = []
  const letters = readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^[A-Z]$/.test(d.name))
  for (const letter of letters) {
    const presences = readdirSync(join(SRC, letter.name), { withFileTypes: true })
      .filter((d) => d.isDirectory())
    for (const p of presences) {
      const metaPath = join(SRC, letter.name, p.name, "metadata.json")
      if (existsSync(metaPath)) files.push(metaPath)
    }
  }
  return files
}

describe("Metadata validation", () => {
  const files = getMetadataFiles()

  it("discovers at least one metadata file", () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const filePath of files) {
    const parts = filePath.replace(/\\/g, "/").split("/")
    const slug = parts[parts.length - 2]

    describe(`${slug} (metadata.json)`, () => {
      let meta: any
      beforeAll(() => {
        meta = JSON.parse(readFileSync(filePath, "utf-8"))
      })

      it("has required fields", () => {
        expect(meta.name).toBeTypeOf("string")
        expect(meta.name.length).toBeGreaterThan(0)
        expect(meta.color).toBeTypeOf("string")
        expect(meta.category).toBeTypeOf("string")
        expect(Array.isArray(meta.url)).toBe(true)
        expect(meta.url.length).toBeGreaterThan(0)
      })

      it("has valid author", () => {
        expect(meta.author).toBeTypeOf("object")
        expect(meta.author.name).toBeTypeOf("string")
      })

      it("has locale-keyed description with en-US", () => {
        expect(meta.description).toBeTypeOf("object")
        expect(meta.description["en-US"]).toBeTypeOf("string")
        expect(meta.description["en-US"].length).toBeGreaterThan(0)
      })

      it("has assets with logo, icon, thumbnail", () => {
        expect(meta.assets).toBeTypeOf("object")
        expect(meta.assets.logo).toBeTypeOf("string")
        expect(meta.assets.icon).toBeTypeOf("string")
        expect(meta.assets.thumbnail).toBeTypeOf("string")
      })

      it("has valid color hex", () => {
        expect(meta.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })

      it("has valid category", () => {
        const valid = ["streaming", "music", "tv", "anime", "other"]
        expect(valid).toContain(meta.category)
      })

      it("has longDescription for every description locale", () => {
        if (meta.longDescription && meta.description) {
          for (const locale of Object.keys(meta.description)) {
            expect(meta.longDescription[locale]).toBeTypeOf("string")
          }
        }
      })

      it("has features for every description locale", () => {
        if (meta.features && meta.description) {
          for (const locale of Object.keys(meta.description)) {
            expect(Array.isArray(meta.features[locale])).toBe(true)
          }
        }
      })
    })
  }
})
