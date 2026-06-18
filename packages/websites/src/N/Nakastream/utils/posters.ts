const POSTER_CACHE_KEY = "nowly:nakastream:posters"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

export const normalizePosterUrl = (poster: string | null | undefined): string | undefined => {
  if (!poster) return undefined

  const trimmed = poster.trim()
  if (!trimmed) return undefined

  if (trimmed.startsWith("https://image.tmdb.org/t/p/")) {
    return trimmed.replace(/\/w\d+\//, "/w500/")
  }

  if (/^https?:\/\//.test(trimmed)) {
    return trimmed
  }

  if (/^\/[^/].*\.(?:jpe?g|png|webp)$/i.test(trimmed)) {
    return `${TMDB_IMAGE_BASE}${trimmed}`
  }

  try {
    return new URL(trimmed, location.href).href
  } catch {
    return undefined
  }
}

const getPosterCache = (): Record<string, string> => {
  try {
    return JSON.parse(sessionStorage.getItem(POSTER_CACHE_KEY) || "{}")
  } catch {
    return {}
  }
}

const setCachedPoster = (key: string | null | undefined, poster: string | undefined) => {
  if (!key || !poster) return

  const cache = getPosterCache()
  cache[key] = poster
  sessionStorage.setItem(POSTER_CACHE_KEY, JSON.stringify(cache))
}

export const getCachedPoster = (key: string | null | undefined): string | undefined => {
  if (!key) return undefined
  return getPosterCache()[key]
}

export const getContentCacheKey = (type: string | null | undefined, id: string | null | undefined): string | undefined => {
  if (!id) return undefined
  return `${type === "movie" ? "movie" : "tv"}:${id}`
}

export const getCurrentContentCacheKey = (): string | undefined => {
  const match = location.pathname.match(/^\/content\/(movie|tv)\/(\d+)/)
  if (!match) return undefined
  return getContentCacheKey(match[1], match[2])
}

export const getContentPageType = (): "movie" | "tv" | undefined => {
  const match = location.pathname.match(/^\/content\/(movie|tv)\/\d+/)
  return match?.[1] as "movie" | "tv" | undefined
}

const cachePosterNearTitle = (title: string | null | undefined, poster: string | undefined) => {
  if (!title) return
  setCachedPoster(title.trim(), poster)
}

export const findContentPosterImage = (): HTMLImageElement | null => {
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>("img[src*='image.tmdb.org/t/p/']"),
  )

  return images.find((img) => {
    const alt = img.alt.trim()
    const src = img.src
    const rect = img.getBoundingClientRect()
    const looksPortrait = rect.height > rect.width || src.includes("/w500/") || src.includes("/w342/")

    return Boolean(alt) && looksPortrait && !src.includes("/w1280/")
  }) ?? images.find((img) => Boolean(img.alt.trim())) ?? null
}

export const cacheVisiblePosters = () => {
  const contentKey = getCurrentContentCacheKey()
  if (contentKey) {
    const img = findContentPosterImage()
    const poster = normalizePosterUrl(img?.src)
    setCachedPoster(contentKey, poster)
    cachePosterNearTitle(img?.alt, poster)
  }

  for (const img of document.querySelectorAll<HTMLImageElement>(".poster-card img[src*='image.tmdb.org/t/p/']")) {
    const poster = normalizePosterUrl(img.src)
    cachePosterNearTitle(img.alt, poster)
  }
}

export const findPoster = (): string | undefined => {
  const videoPoster = normalizePosterUrl(document.querySelector<HTMLVideoElement>("video")?.poster)
  if (videoPoster) return videoPoster

  const selectors = [
    ".nk-poster img",
    ".nk-thumbnail img",
    ".player-poster img",
    "img.nk-cover",
    "img[class*='poster']",
    "img[class*='thumbnail']",
    "img[class*='cover']",
  ] as const

  for (const selector of selectors) {
    const img = document.querySelector<HTMLImageElement>(selector)
    const poster = normalizePosterUrl(img?.src || img?.dataset.src || img?.getAttribute("data-lazy-src"))
    if (poster) return poster
  }

  return undefined
}