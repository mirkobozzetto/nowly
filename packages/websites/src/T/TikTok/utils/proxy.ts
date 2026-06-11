import { createCachedImageProxyUrl, createImageProxyUrl } from "@nowly/presence"

const DISCORD_IMAGE_KEY_MAX_LENGTH = 300
const isTikTokCdnImage = (imageUrl: string): boolean => {
  try {
    const hostname = new URL(imageUrl).hostname.toLowerCase()
    return hostname === "tiktokcdn.com"
      || hostname.endsWith(".tiktokcdn.com")
      || hostname === "tiktokcdn-eu.com"
      || hostname.endsWith(".tiktokcdn-eu.com")
      || hostname === "tiktokcdn-us.com"
      || hostname.endsWith(".tiktokcdn-us.com")
      || hostname === "tiktokcdn-in.com"
      || hostname.endsWith(".tiktokcdn-in.com")
  } catch {
    return false
  }
}

export const toDiscordImage = async (imageUrl: string | undefined): Promise<string | undefined> => {
  if (!imageUrl?.startsWith("https://")) return undefined

  const cached = await createCachedImageProxyUrl("tiktok", imageUrl)
  if (cached) return cached

  const directProxy = createImageProxyUrl("tiktok", imageUrl)
  if (directProxy) return directProxy

  return !isTikTokCdnImage(imageUrl) && imageUrl.length <= DISCORD_IMAGE_KEY_MAX_LENGTH
    ? imageUrl
    : undefined
}
