import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import type { Metadata } from "./types"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REGISTRY_PATH = join(__dirname, "..", "dist", "registry.json")

function loadRegistry(): Metadata[] {
  if (!existsSync(REGISTRY_PATH)) return []
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"))
}

export function getRegistry(): Metadata[] {
  return loadRegistry()
}

export function getPresence(slug: string): Metadata | undefined {
  return loadRegistry().find((p) => p.slug === slug)
}

export type { Metadata, PlatformStatus, PresenceContext, PresenceData, PresenceFactory } from "./types"
