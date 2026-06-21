import { createImageProxyUrl } from "@nowly/presence"

const MAX_IMAGE_KEY_LENGTH = 300

type JsonRecord = Record<string, unknown>

type PageMetadata = {
  title?: string
  subtitle?: string
  image?: string
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined
  const text = String(value).replace(/\s+/g, " ").trim()
  return text || undefined
}

const getMetaContent = (selector: string): string | undefined =>
  document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined

const cleanTitle = (value: string | undefined): string | undefined => {
  const title = value
    ?.replace(/\s+en streaming.*$/i, "")
    .replace(/\s+direct et replay.*$/i, "")
    .replace(/\s+\|\s*CANAL\+.*$/i, "")
    .replace(/\s+-\s*CANAL\+.*$/i, "")
    .replace(/^Image:\s*/i, "")
    .trim()

  return title && title !== "CANAL+" ? title : undefined
}

export const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    "[class*='Player'] video",
    "[class*='player'] video",
    "[id*='player'] video",
    "main video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  return null
}

export const isLivePath = (pathname: string, video?: HTMLVideoElement | null): boolean =>
  pathname.startsWith("/live") || video?.duration === Infinity

export const getPageTitle = (): string | undefined => {
  const visibleTitle = getVisibleTitle()
  if (visibleTitle) return visibleTitle

  const ogTitle = cleanTitle(getMetaContent('meta[property="og:title"]'))
  if (ogTitle) return ogTitle

  return cleanTitle(document.title)
}

export const getSearchQuery = (): string | undefined =>
  new URLSearchParams(document.location.search).get("q")?.trim()
  || document.querySelector<HTMLInputElement>("input[type='search']")?.value?.trim()
  || undefined

export const getDetailImage = (): string | undefined =>
  toDiscordImage(
    getMetaContent('meta[property="og:image"]')
    || getStructuredImage()
    || getLargestContentImage(),
  )

export const getPageMetadata = async (): Promise<PageMetadata> => {
  const structured = getStructuredMetadata()
  const title = structured.title || getMediaSessionTitle() || getPageTitle()
  const subtitle = structured.subtitle || getMediaSessionSubtitle() || getEpisodeLabel()
  const image = toDiscordImage(
    getMediaSessionArtwork()
    || structured.image
    || getDetailImage(),
  )

  return { title, subtitle, image }
}

const getVisibleTitle = (): string | undefined => {
  const selectors = [
    "[data-testid*='title' i]",
    "[class*='Title']",
    "[class*='title']",
    "h1",
  ] as const

  for (const selector of selectors) {
    const text = cleanTitle(document.querySelector<HTMLElement>(selector)?.textContent || undefined)
    if (text) return text
  }

  return undefined
}

const getMediaSessionTitle = (): string | undefined =>
  cleanTitle(navigator.mediaSession?.metadata?.title || undefined)

const getMediaSessionSubtitle = (): string | undefined => {
  const metadata = navigator.mediaSession?.metadata
  return [metadata?.artist, metadata?.album]
    .map(part => part?.trim())
    .filter(Boolean)
    .join(" - ")
    || undefined
}

const getMediaSessionArtwork = (): string | undefined => {
  const artwork = navigator.mediaSession?.metadata?.artwork
  return artwork?.[artwork.length - 1]?.src
}

const getStructuredEntries = (): JsonRecord[] => {
  const entries: JsonRecord[] = []

  for (const script of document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(script.textContent || "null") as unknown
      if (Array.isArray(parsed)) {
        entries.push(...parsed.filter(isRecord))
      } else if (isRecord(parsed)) {
        entries.push(parsed)
      }
    } catch {
      // Ignore malformed structured data blocks.
    }
  }

  return entries
}

const getStructuredMetadata = (): PageMetadata => {
  for (const entry of getStructuredEntries()) {
    const title = cleanTitle(asString(entry.name) || asString(entry.headline))
    const episodeNumber = asString(entry.episodeNumber)
    const season = isRecord(entry.partOfSeason)
      ? asString(entry.partOfSeason.seasonNumber) || asString(entry.partOfSeason.name)
      : undefined
    const series = isRecord(entry.partOfSeries)
      ? cleanTitle(asString(entry.partOfSeries.name))
      : undefined

    if (title || series) {
      const episodeLabel = buildEpisodeLabel(season, episodeNumber, title)
      return {
        title: series || title,
        subtitle: episodeLabel,
        image: asString(entry.image),
      }
    }
  }

  return {}
}

const getStructuredImage = (): string | undefined => {
  for (const entry of getStructuredEntries()) {
    const image = entry.image
    if (typeof image === "string") return image
    if (Array.isArray(image)) {
      const value = image.find(item => typeof item === "string")
      if (value) return value
    }
  }

  return undefined
}

const buildEpisodeLabel = (
  season: string | undefined,
  episode: string | undefined,
  episodeTitle: string | undefined,
): string | undefined => {
  if (!season && !episode) return episodeTitle

  const parts: string[] = []
  if (season) parts.push(`S${season}`)
  if (episode) parts.push(`E${episode}`)

  const label = parts.join(":")
  return episodeTitle ? `${label} - ${episodeTitle}` : label
}

const getEpisodeLabel = (): string | undefined => {
  const patterns = [
    /S\s*\d+\s*[:.]?\s*E\s*\d+(?:\s*[-–—]\s*[^|]+)?/i,
    /Saison\s*\d+.*(?:Episode|Épisode|Ep\.?)\s*\d+/i,
  ] as const

  for (const el of document.querySelectorAll<HTMLElement>("[class*='player'] *, [class*='metadata'] *, main *")) {
    if (el.children.length > 0) continue
    const text = el.textContent?.replace(/\s+/g, " ").trim()
    if (!text || text.length > 120) continue

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match?.[0]) return match[0].trim()
    }
  }

  return undefined
}

const getLargestContentImage = (): string | undefined => {
  const images = [...document.images]
    .map(img => ({
      src: img.currentSrc || img.src,
      width: img.naturalWidth,
      height: img.naturalHeight,
      alt: img.alt,
    }))
    .filter(img =>
      img.src.startsWith("https://")
      && !/avatar|logo|sprite|icon/i.test(img.src)
      && !/^CANAL\+$/i.test(img.alt)
      && img.width >= 250
      && img.height >= 100,
    )
    .sort((a, b) => b.width * b.height - a.width * a.height)

  return images[0]?.src
}

const toDiscordImage = (imageUrl: string | undefined): string | undefined => {
  if (!imageUrl?.startsWith("https://")) return undefined

  if (imageUrl.length <= MAX_IMAGE_KEY_LENGTH) return imageUrl

  return createImageProxyUrl("canalplus", imageUrl)
}