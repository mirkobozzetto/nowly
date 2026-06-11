import { createMediaTimestamps, PresenceType } from "@nowly/presence"

const settings = Presence.Settings({
  showBrowsing: {
    type: "boolean",
    default: false,
    label: {
      "en-US": "Show browsing activity",
      "fr-FR": "Afficher l'activité de navigation",
      "es-ES": "Mostrar actividad de navegación",
    },
    description: {
      "en-US": "When enabled, your presence will also show when browsing Nakastream (home, search, etc.), not just when watching a video.",
      "fr-FR": "Quand activé, votre présence s'affichera aussi lorsque vous naviguez sur Nakastream (accueil, recherche, etc.), pas seulement quand vous regardez une vidéo.",
      "es-ES": "Cuando está activado, tu presencia también se mostrará al navegar por Nakastream (inicio, búsqueda, etc.), no solo al ver un vídeo.",
    },
  },
})

const presence = new Presence(settings)

const POSTER_CACHE_KEY = "nowly:nakastream:posters"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

const normalizePosterUrl = (poster: string | null | undefined): string | undefined => {
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

const getCachedPoster = (key: string | null | undefined): string | undefined => {
  if (!key) return undefined
  return getPosterCache()[key]
}

const getContentCacheKey = (type: string | null | undefined, id: string | null | undefined): string | undefined => {
  if (!id) return undefined
  return `${type === "movie" ? "movie" : "tv"}:${id}`
}

const getCurrentContentCacheKey = (): string | undefined => {
  const match = location.pathname.match(/^\/content\/(movie|tv)\/(\d+)/)
  if (!match) return undefined
  return getContentCacheKey(match[1], match[2])
}

const getContentPageType = (): "movie" | "tv" | undefined => {
  const match = location.pathname.match(/^\/content\/(movie|tv)\/\d+/)
  return match?.[1] as "movie" | "tv" | undefined
}

const cachePosterNearTitle = (title: string | null | undefined, poster: string | undefined) => {
  if (!title) return
  setCachedPoster(title.trim(), poster)
}

const findContentPosterImage = (): HTMLImageElement | null => {
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

const cacheVisiblePosters = () => {
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

const findPoster = (): string | undefined => {
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

const getNakastreamInfo = () => {
  const params = new URLSearchParams(location.search)
  const title =
    params.get("title") ||
    document.querySelector("span.nk-title")?.textContent?.trim() ||
    null
  const type = params.get("type")
  const id = params.get("id")
  const season = params.get("season") ?? params.get("s")
  const ep = params.get("episode") ?? params.get("ep") ?? params.get("e")
  const episodeTitle =
    params.get("ep_title") ??
    params.get("episode_title") ??
    params.get("etitle") ??
    null
  return {
    title,
    contentType: type === "movie" ? "movie" : "tv",
    id,
    poster: normalizePosterUrl(params.get("poster")),
    season: season ? Number(season) : null,
    episodeNum: ep ? Number(ep) : null,
    episodeTitle,
  }
}

presence.on("UpdateData", async (ctx) => {
  const { pathname } = document.location

  if (pathname.startsWith("/player")) {
    const video = document.querySelector<HTMLVideoElement>("video")
    const nk = getNakastreamInfo()
    const cacheKey = getContentCacheKey(nk.contentType === "movie" ? "movie" : "tv", nk.id)
    const poster = nk.poster || getCachedPoster(cacheKey) || getCachedPoster(nk.title) || findPoster()
    const title = nk.title || "Nakastream"

    let state: string | undefined

    if (nk.contentType === "tv" && nk.season != null && nk.episodeNum != null) {
      state = `S${nk.season}.E${nk.episodeNum}`
      if (nk.episodeTitle) state += ` ${nk.episodeTitle}`
    } else if (nk.episodeTitle) {
      state = nk.episodeTitle
    }

    const data: Parameters<typeof presence.setActivity>[0] = {
      details: title,
      state,
      largeImageKey: poster || Assets.Logo,
      largeImageText: title,
      type: PresenceType.Watching,
      buttons: [
        {
          label: nk.contentType === "movie" ? "View Movie" : "View Episode",
          url: location.href,
        },
      ],
    }

    if (video && !video.paused && !video.ended) {
      data.smallImageKey = "play"
      data.smallImageText = "Playing"
      Object.assign(data, createMediaTimestamps(video))
    } else {
      data.smallImageKey = "pause"
      data.smallImageText = "Paused"
    }

    await presence.setActivity(data)
    return
  }

  cacheVisiblePosters()

  const contentType = getContentPageType()
  if (contentType) {
    const img = findContentPosterImage()
    const title =
      img?.alt.trim() ||
      document.querySelector<HTMLHeadingElement>("h1")?.textContent?.trim() ||
      document.title.replace(/[-|].*$/, "").trim() ||
      "Nakastream"
    const poster = normalizePosterUrl(img?.src) || getCachedPoster(title)

    await presence.setActivity({
      details: contentType === "movie" ? "Viewing movie" : "Viewing TV show",
      state: title,
      largeImageKey: poster || Assets.Logo,
      largeImageText: title,
      type: PresenceType.Watching,
      buttons: [
        {
          label: contentType === "movie" ? "View Movie" : "View TV Show",
          url: location.href,
        },
      ],
    })
    return
  }

  if (!ctx.settings.showBrowsing) {
    presence.clearActivity()
    return
  }

  await presence.setActivity({
    details: "Browsing Nakastream",
    largeImageKey: Assets.Logo,
    type: PresenceType.Watching,
  })
})
