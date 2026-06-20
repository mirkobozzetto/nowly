import { createCachedImageProxyUrl, createImageProxyUrl } from "@nowly/presence"
import { getMetaContent } from "./dom"

const DISCORD_IMAGE_KEY_MAX_LENGTH = 300

export const getMetaImage = (): string | undefined =>
  getMetaContent("og:image")

export const getAvatarImage = (username?: string): string | undefined => {
  const candidates = [
    document.querySelector<HTMLImageElement>(".avatar-user")?.src,
    document.querySelector<HTMLImageElement>(".avatar")?.src,
    username ? `https://github.com/${encodeURIComponent(username)}.png?size=512` : undefined,
  ]

  return normalizeAvatarUrl(candidates.find((candidate) => candidate?.startsWith("https://")))
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
