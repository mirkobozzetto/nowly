import { attr } from "./text"

export const normalizeArtworkUrl = (url: string | undefined): string | undefined => {
  if (!url?.startsWith("https://")) return undefined
  const videoId = url.match(/\/vi\/([^/?#]+)/)?.[1]
  if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return url
    .replace(/=w\d+-h\d+(-[a-z0-9-]+)?$/i, "=w544-h544-l90-rj")
    .replace(/=s\d+(-[a-z0-9-]+)?$/i, "=w544-h544-l90-rj")
}

export const findArtwork = (playerBar: Element | null): string | undefined => {
  const mediaSessionArtwork = navigator.mediaSession.metadata?.artwork
  const largestMediaSessionArtwork = mediaSessionArtwork?.[mediaSessionArtwork.length - 1]?.src
  const normalizedMediaSessionArtwork = normalizeArtworkUrl(largestMediaSessionArtwork)
  if (normalizedMediaSessionArtwork) return normalizedMediaSessionArtwork

  const selectors = [
    "img.image",
    "yt-img-shadow.image img",
    ".thumbnail-image img",
    "img[src*='googleusercontent.com']",
    "img[src*='ytimg.com']",
  ]

  for (const selector of selectors) {
    const src = attr(selector, "src", playerBar ?? document)
    const normalized = normalizeArtworkUrl(src)
    if (normalized) return normalized
  }

  const metaImage = document.querySelector<HTMLMetaElement>("meta[property='og:image']")?.content
  const normalizedMetaImage = normalizeArtworkUrl(metaImage)
  if (normalizedMetaImage) return normalizedMetaImage

  const videoId = new URLSearchParams(document.location.search).get("v")
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined
}
