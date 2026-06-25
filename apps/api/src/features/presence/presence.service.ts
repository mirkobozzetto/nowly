import { sha256Base64Url, canonicalJson, signedPayload, signPresenceRelease } from "@/shared/crypto.service"
import { getPresence } from "@nowly/websites"
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { PRESENCES_DIR } from "@/shared/paths"
import { getPresenceMeta, getPresenceStats, setPresenceMeta } from "./presence.repository"

export const serializeJsonField = (value: unknown): string | undefined => {
  if (value == null) return undefined
  if (Array.isArray(value) && value.length === 0) return undefined
  return JSON.stringify(value)
}

const fetchText = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url)
    if (res.ok) return await res.text()
  } catch {}

  return null
}

export const buildRelease = async (slug: string, version?: string) => {
  const localMeta = getPresence(slug)
  const storedMeta = await getPresenceMeta(slug)
  const metadata = { ...(localMeta ?? {}), ...(storedMeta ?? {}) } as Record<string, unknown>
  if (!Object.keys(metadata).length) return null

  const stats = await getPresenceStats(slug)
  const resolvedVersion = version ?? stats.version ?? metadata.version ?? "0.0.0"

  const bundlePath = join(PRESENCES_DIR, slug, "bundle.js")

  let bundle: string | null = null

  if (existsSync(bundlePath)) {
    bundle = readFileSync(bundlePath, "utf-8")
  } else {
    bundle = await fetchText(`https://cdn.nowly.me/presences/${slug}/versions/${resolvedVersion}/bundle.js`)
      ?? await fetchText(`https://cdn.nowly.me/presences/${slug}/bundle.js?v=${encodeURIComponent(String(resolvedVersion))}`)
      ?? await fetchText(`https://cdn.nowly.me/presences/${slug}/bundle.js`)
  }

  if (!bundle) return null

  if (!metadata.settings) {
    try {
      const raw = await fetchText(`https://cdn.nowly.me/presences/${slug}/versions/${resolvedVersion}/settings.json`)
        ?? await fetchText(`https://cdn.nowly.me/presences/${slug}/settings.json?v=${encodeURIComponent(String(resolvedVersion))}`)
        ?? await fetchText(`https://cdn.nowly.me/presences/${slug}/settings.json`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object") {
          metadata.settings = parsed
          await setPresenceMeta(slug, metadata as Record<string, unknown>)
        }
      }
    } catch {}
  }

  const releaseMetadata = {
    ...metadata,
    slug,
    version: resolvedVersion
  }

  const sha256 = sha256Base64Url(bundle)
  const metadataHash = sha256Base64Url(canonicalJson(releaseMetadata))
  const signedAt = new Date().toISOString()
  const payload = signedPayload({
    slug,
    version: String(resolvedVersion),
    sha256,
    metadataHash,
    signedAt
  })

  return {
    slug,
    version: resolvedVersion,
    metadata: releaseMetadata,
    bundle,
    sha256,
    metadataHash,
    signature: signPresenceRelease(payload),
    signedAt,
    totalInstalls: stats.totalInstalls,
    activeUsers: stats.activeUsers,
    addedAt: stats.addedAt,
    lastUpdated: stats.lastUpdated,
  }
}
