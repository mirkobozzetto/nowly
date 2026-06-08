import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { DIST } from "@/discover"

const __filename = fileURLToPath(import.meta.url)
const ROOT = join(dirname(__filename), "..", "..", "..")

const API_BASE = process.env.API_URL ?? "https://api.nowly.me"

function resolveKey(): string | undefined {
  const envKey = process.env.API_SECRET_KEY
  if (envKey) return envKey

  try {
    const envPath = join(ROOT, ".env")
    if (!existsSync(envPath)) return undefined

    const content = readFileSync(envPath, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (trimmed.startsWith("API_SECRET_KEY=")) {
        return trimmed.replace(/^API_SECRET_KEY=/, "").replace(/^["']|["']$/g, "")
      }
    }
  } catch {}

  return undefined
}

const API_KEY = resolveKey()

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`
  return headers
}

export interface PresenceInfo {
  version?: string
  [key: string]: any
}

export interface ReleasePerson {
  name: string
  github?: string
}

export async function fetchPresenceInfo(slug: string): Promise<PresenceInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/presences/${slug}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export interface SyncPayload {
  slug: string
  type: "new" | "modified"
  name: string
  author: string
  authorGithub?: string
  releaseAuthor?: ReleasePerson
  releaseContributors?: ReleasePerson[]
  version: string
  versionType?: "new" | "patch" | "minor" | "manual" | "keep"
  description: Record<string, string>
  color?: string
  url?: string[]
  changelog?: string
  bundle?: string
  source?: "cli" | "pr"
  commitSha?: string
  changedFiles?: string[]
  diffSummary?: string
  metadata?: Record<string, any>
}

export interface SyncResult {
  slug: string
  version: string
  changelog: string
}

export interface SyncResponse {
  results: SyncResult[]
}

export async function pushPresences(payload: SyncPayload[]): Promise<SyncResponse> {
  if (!API_KEY) {
    throw new Error("API_SECRET_KEY is required. Set it in your environment variables.")
  }

  const res = await fetch(`${API_BASE}/presences/sync`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ presences: payload }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error (${res.status}): ${text}`)
  }

  return await res.json()
}

export function getLocalBundle(slug: string): string | null {
  try {
    const bundlePath = join(DIST, "presences", slug, "bundle.js")
    return readFileSync(bundlePath, "utf-8")
  } catch {
    return null
  }
}

export function bumpVersion(current: string, strategy: "patch" | "minor" | "major"): string {
  const parts = current.split(".").map(Number)
  if (strategy === "major") {
    parts[0] = (parts[0] || 0) + 1
    parts[1] = 0
    parts[2] = 0
  } else if (strategy === "minor") {
    parts[1] = (parts[1] || 0) + 1
    parts[2] = 0
  } else {
    parts[2] = (parts[2] || 0) + 1
  }
  return parts.join(".")
}
