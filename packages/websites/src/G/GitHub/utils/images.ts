import { createCachedImageProxyUrl, createImageProxyUrl } from "@nowly/presence"
import { getMetaContent } from "./dom"

const DISCORD_IMAGE_KEY_MAX_LENGTH = 300

export const getMetaImage = (): string | undefined =>
  getMetaContent("og:image")

export const getAvatarImage = (username?: string): string | undefined => {
  const candidates = [
    username ? getGitHubAvatarImage(username) : undefined,
    ...getScopedAvatarCandidates(username),
    username ? undefined : document.querySelector<HTMLImageElement>(".avatar-user")?.src,
    username ? undefined : document.querySelector<HTMLImageElement>(".avatar")?.src,
  ]

  return normalizeAvatarUrl(candidates.find((candidate) => candidate?.startsWith("https://")))
}

export const getGitHubAvatarImage = (username: string): string | undefined => {
  const normalized = normalizeUsername(username)
  if (!normalized) return undefined

  return normalizeAvatarUrl(`https://github.com/${encodeURIComponent(normalized)}.png?size=512`)
}

export const toDiscordImage = async (imageUrl: string | undefined): Promise<string | undefined> => {
  if (!imageUrl?.startsWith("https://")) return undefined
  if (imageUrl.length <= DISCORD_IMAGE_KEY_MAX_LENGTH) return imageUrl

  return await createCachedImageProxyUrl("github", imageUrl)
    || createImageProxyUrl("github", imageUrl)
}

const normalizeAvatarUrl = (imageUrl: string | undefined): string | undefined => {
  if (!imageUrl?.startsWith("https://")) return undefined

  try {
    const url = new URL(imageUrl)
    if (url.hostname === "avatars.githubusercontent.com") {
      url.searchParams.set("s", "512")
      return url.toString()
    }

    if (url.hostname === "github.com" && url.pathname.endsWith(".png")) {
      url.searchParams.set("size", "512")
      return url.toString()
    }
  } catch {
    return imageUrl
  }

  return imageUrl
}

const getScopedAvatarCandidates = (username: string | undefined): Array<string | undefined> => {
  const normalized = normalizeUsername(username)
  if (!normalized) return []

  const selectors = [
    `a[href="/${cssEscape(normalized)}"] img.avatar`,
    `a[href="/${cssEscape(normalized)}"] img.avatar-user`,
    `img[alt="@${cssEscape(normalized)}"]`,
    `[data-login="${cssEscape(normalized)}"] img.avatar`,
    `[data-hovercard-url*="/users/${cssEscape(normalized)}/"] img.avatar`,
  ]

  return selectors.map((selector) => document.querySelector<HTMLImageElement>(selector)?.src)
}

const normalizeUsername = (username: string | undefined): string | undefined => {
  const normalized = username?.replace(/^@/, "").trim()
  return normalized || undefined
}

const cssEscape = (value: string): string => {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value)
  return value.replace(/["\\]/g, "\\$&")
}