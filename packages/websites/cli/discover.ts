import { existsSync, readdirSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const CLI_DIR = dirname(__filename)
const PKG_ROOT = join(CLI_DIR, "..")
export const SRC = join(PKG_ROOT, "src")
export const DIST = join(PKG_ROOT, "dist")
export const PRESENCE_SDK = join(PKG_ROOT, "..", "presence", "src", "index.ts")

export interface PresenceMeta {
  slug: string
  letter: string
  dirName: string
  dir: string
  name: string
  version: string
  author: string
  authorGithub?: string
  category: string
  description: string
  descriptions: Record<string, string>
  metadata: Record<string, any>
}

export function getPresences(): PresenceMeta[] {
  if (!existsSync(SRC)) return []

  return readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^[A-Z]$/.test(d.name))
    .flatMap((letterDir) =>
      readdirSync(join(SRC, letterDir.name), { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(SRC, letterDir.name, d.name, "metadata.json")))
        .map((d) => {
          const dir = join(SRC, letterDir.name, d.name)
          const meta = JSON.parse(readFileSync(join(dir, "metadata.json"), "utf-8"))
          return {
            slug: d.name.toLowerCase().replace(/\s+/g, "-"),
            letter: letterDir.name,
            dirName: d.name,
            dir,
            name: meta.name || d.name,
            version: meta.version || "0.0.0",
            author: meta.author?.name || "unknown",
            authorGithub: meta.author?.github,
            category: meta.category || "other",
            description: meta.description?.["en-US"] || Object.values(meta.description ?? {})[0] || "",
            descriptions: meta.description || {},
            metadata: meta,
          }
        }),
    )
}

export function getSlugFromName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-")
}

export function getLetterFromName(name: string): string {
  return name.charAt(0).toUpperCase()
}

export function getPresenceBySlug(slug: string): PresenceMeta | undefined {
  return getPresences().find((p) => p.slug === slug)
}
