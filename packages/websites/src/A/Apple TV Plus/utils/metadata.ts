import { $ } from "./dom"

export const getPageTitle = (): string | undefined => {
  const og = $<HTMLMetaElement>('meta[property="og:title"]')
  if (og?.content) return og.content.replace(/ – Apple TV\+$/, "").trim()
  const title = document.title.replace(/ – Apple TV\+$/, "").trim()
  return title || undefined
}

export const getPageDescription = (): string | undefined => {
  const og = $<HTMLMetaElement>('meta[property="og:description"]')
  if (og?.content) return og.content
  const meta = $<HTMLMetaElement>('meta[name="description"]')
  return meta?.content || undefined
}

export const getThumbnail = (): string | undefined => {
  const artwork = navigator.mediaSession.metadata?.artwork
  if (artwork && artwork.length > 0) {
    return artwork[artwork.length - 1].src
  }
  const og = $<HTMLMetaElement>('meta[property="og:image"]')
  return og?.content || undefined
}

export const parseSubtitle = (subtitle: string) => {
  const parts = subtitle.split(/, | · | • /)
  const seasonRaw = parts[0]
  const episodeRaw = parts[1]
  const episodeTitle = parts.slice(2).join(", ") || undefined

  const seasonNum = seasonRaw ? parseInt(seasonRaw.replace(/^\D/, ""), 10) : undefined
  const episodeNum = episodeRaw ? parseInt(episodeRaw.replace(/^\D/, ""), 10) : undefined

  return { seasonNum, episodeNum, episodeTitle }
}