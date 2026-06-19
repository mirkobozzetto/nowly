// Netflix exposes a same-origin member API that returns rich metadata for a
// given video id. Presences run as content scripts on netflix.com, so this
// fetch is same-origin and carries the user's session — far more reliable than
// scraping the obfuscated player DOM.
const METADATA_ENDPOINT = "https://www.netflix.com/nq/website/memberapi/release/metadata?movieid="
const MAX_IMAGE_KEY_LENGTH = 300

export type NetflixBoxart = { w: number; h: number; url: string }

export type NetflixEpisode = {
  episodeId: number
  seq: number
  title: string
  synopsis: string
}

export type NetflixSeason = {
  seq: number
  episodes: NetflixEpisode[]
}

export type NetflixVideo = {
  id: number
  title: string
  synopsis?: string
  type: "show" | "movie"
  boxart?: NetflixBoxart[]
  // show only
  currentEpisode?: number
  seasons?: NetflixSeason[]
  // movie only
  year?: number
  runtime?: number
}

export type NetflixMetadata = { video: NetflixVideo }

// Pull the numeric video id from any Netflix URL shape.
export const getVideoId = (href: string): string | null => {
  const match
    = href.match(/\/watch\/(\d+)/)
    ?? href.match(/\/title\/(\d+)/)
    ?? href.match(/[?&]jbv=(\d+)/)
  return match?.[1] ?? null
}

let cache: { url: string; data?: NetflixMetadata } | null = null
let pending: Promise<void> | null = null

// Fetch once per URL, serialized so rapid UpdateData ticks don't spam the API.
export const fetchMetadata = async (id: string): Promise<NetflixMetadata | undefined> => {
  const url = document.location.href

  if (cache?.url === url) return cache.data

  if (!pending) {
    cache = { url }
    pending = fetch(`${METADATA_ENDPOINT}${id}`)
      .then(res => (res.ok ? res.json() : undefined))
      .then((data: NetflixMetadata | undefined) => {
        if (cache?.url === url) cache.data = data
      })
      .catch(() => {
        // Network/auth failure — caller falls back to the logo + basic activity.
      })
      .finally(() => {
        pending = null
      })
  }

  await pending
  return cache?.data
}

export const clearMetadata = (): void => {
  cache = null
}

// Discord rejects overly long or non-https image keys, so guard before use.
export const getBoxart = (video: NetflixVideo | undefined): string | undefined => {
  const url = video?.boxart?.[0]?.url
  if (url && url.startsWith("https://") && url.length <= MAX_IMAGE_KEY_LENGTH) return url
  return undefined
}

export const findCurrentEpisode = (
  video: NetflixVideo,
): { season: NetflixSeason; episode: NetflixEpisode } | null => {
  const season = video.seasons?.find(s =>
    s.episodes.some(e => e.episodeId === video.currentEpisode),
  )
  const episode = season?.episodes.find(e => e.episodeId === video.currentEpisode)
  return season && episode ? { season, episode } : null
}