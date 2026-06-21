export const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    ".ava-player-wrapper video",
    ".top-player video",
    ".video-js video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  return null
}

// Strip site/CTA noise from a raw page title:
//  "Scary Movie 2 - Regarder le film complet sur Paramount+" -> "Scary Movie 2"
//  "Yellowstone | Paramount+"                                -> "Yellowstone"
const cleanTitle = (raw: string | undefined | null): string | undefined => {
  let t = raw?.trim()
  if (!t) return undefined
  return t.trim() || undefined
}

const getOg = (prop: string): string | undefined =>
  document.querySelector<HTMLMetaElement>(`meta[property="og:${prop}"]`)?.content?.trim() || undefined

export const getOgTitle = (): string | undefined => cleanTitle(getOg("title"))

export const getOgImage = (): string | undefined => {
  const og = getOg("image")
  return og?.startsWith("https") ? og : undefined
}

export const getDetailCover = (): string | undefined => {
  const candidates = [...document.images]
    .map(img => ({
      src: img.currentSrc || img.src,
      w: img.naturalWidth,
      h: img.naturalHeight,
    }))
    .filter(i =>
      i.src.startsWith("https") &&
      /pplusstatic\.com|cbsig\.net/.test(i.src) &&
      !/avatar|logo|sprite|icon/i.test(i.src) &&
      i.w >= 300 &&
      i.h > 0 &&
      i.w / i.h > 1.2,
    )
    .sort((a, b) => b.w * b.h - a.w * a.h)

  return candidates[0]?.src
}

export const getPoster = (): string | undefined => {
  // Player overlay poster first, then og:image.
  const img = document.querySelector<HTMLImageElement>(".player-poster img, [class*='poster'] img")
  if (img?.src?.startsWith("https")) return img.src

  const structuredImage = getStructuredMetadata().image
  if (structuredImage?.startsWith("https")) return structuredImage

  return getOgImage()
}

const getOnScreenTitle = (): string | undefined =>
  document.querySelector<HTMLElement>(
    ".player-title, [class*='show-title'], [class*='title-text']",
  )?.textContent?.trim() || undefined

type EpisodeInfo = { season?: string; episode?: string; show?: string; episodeTitle?: string }

type StructuredData = Record<string, any>

const asString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined
  const string = String(value).trim()
  return string || undefined
}

const getStructuredData = (): StructuredData | undefined => {
  for (const script of document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(script.textContent || "{}") as StructuredData | StructuredData[]
      const entries = Array.isArray(parsed) ? parsed : [parsed]
      const data = entries.find(item => item?.partOfSeries || item?.episodeNumber || item?.name)
      if (data) return data
    } catch {
      // Ignore malformed structured data blocks from third-party scripts.
    }
  }

  return undefined
}

const getStructuredMetadata = (): EpisodeInfo & { image?: string; title?: string } => {
  const data = getStructuredData()
  if (!data) return {}

  return {
    show: asString(data.partOfSeries?.name),
    season: asString(data.partOfSeason?.seasonNumber),
    episode: asString(data.episodeNumber),
    episodeTitle: asString(data.name),
    title: asString(data.name),
    image: asString(data.image),
  }
}

const decodeJsonString = (value: string): string => {
  try {
    return JSON.parse(`"${value}"`) as string
  } catch {
    return value
  }
}

const getTrackingField = (field: string): string | undefined => {
  const re = new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`)

  for (const script of document.scripts) {
    const match = script.textContent?.match(re)
    const value = match?.[1] ? decodeJsonString(match[1]).trim() : undefined
    if (value) return value
  }

  return undefined
}

const getFirstTrackingField = (...fields: string[]): string | undefined => {
  for (const field of fields) {
    const value = getTrackingField(field)
    if (value) return value
  }

  return undefined
}

// The player overlay exposes a clean metadata line, e.g. "S1 E1 Fire Country - Au Cal Fire".
const findEpisodeRawLabel = (): string | undefined => {
  const re = /S\s*\d+\s*[:.]?\s*E\s*\d+/i

  const overlay = document.querySelector<HTMLElement>(".skin-metadata-manager-body")?.textContent?.trim()
  if (overlay && re.test(overlay)) return overlay.replace(/\s+/g, " ")

  for (const el of document.querySelectorAll<HTMLElement>("[class*='player'] *, [class*='metadata'] *")) {
    if (el.children.length === 0) {
      const txt = el.textContent?.trim()
      if (txt && re.test(txt)) return txt.replace(/\s+/g, " ")
    }
  }

  return undefined
}

const parseEpisodeLabel = (label: string): EpisodeInfo | null => {
  const m = label.match(/S\s*(\d+)\s*[:.]?\s*E\s*(\d+)\s*(.*)$/i)
  if (!m) return null

  const [, season, episode, restRaw] = m
  const rest = restRaw?.trim()
  if (!rest) return { season, episode }

  // Split "{show} - {episode title}" on the first dash.
  const dash = rest.match(/^(.*?)\s+[-–—]\s+(.*)$/)
  if (dash) return { season, episode, show: dash[1].trim(), episodeTitle: dash[2].trim() }

  return { season, episode, episodeTitle: rest }
}

const parseTrackingTitle = (title: string | undefined): EpisodeInfo | null => {
  if (!title) return null

  const head = (s: string) => s.split(/\s+[-\u2013\u2014|]\s+/)[0].trim()

  let m = title.match(/(?:\u00e9|e)pisode\s*(\d+),\s*saison\s*(\d+)\s+de\s+(.+?)\s*:\s*(.+)$/i)
  if (m) return { episode: m[1], season: m[2], show: head(m[3]), episodeTitle: head(m[4]) }

  m = title.match(/Watch\s+(.+?)\s+Season\s+(\d+)\s+Episode\s+(\d+):\s*(.+)$/i)
  if (m) return { show: head(m[1]), season: m[2], episode: m[3], episodeTitle: head(m[4]) }

  return null
}

const getTrackingMetadata = (): EpisodeInfo => {
  const titleInfo = parseTrackingTitle(getFirstTrackingField("articleTitle", "meta_title"))
  const show = getFirstTrackingField("showSeriesTitle", "showTitle") || titleInfo?.show
  const explicitEpisodeTitle = getFirstTrackingField("showEpisodeLabel")
  const fullEpisodeTitle = getFirstTrackingField("showEpisodeTitle", "videoTitle")
  const episodeTitleFromFull =
    show && fullEpisodeTitle?.startsWith(`${show} - `)
      ? fullEpisodeTitle.slice(show.length + 3).trim()
      : fullEpisodeTitle

  return {
    season: titleInfo?.season,
    episode: titleInfo?.episode,
    show,
    episodeTitle: explicitEpisodeTitle || episodeTitleFromFull || titleInfo?.episodeTitle,
  }
}

// Page-level metadata block under the player (stable, doesn't need the overlay):
//   .video__metadata__topline -> episode (or movie) title, e.g. "Au Cal Fire"
//   .video__metadata .subTitle -> "S1 E1"
const getVideoMeta = (): { topline?: string; season?: string; episode?: string } => {
  const root = document.querySelector(".video__metadata")
  if (!root) return {}

  const topline = root.querySelector(".video__metadata__topline")?.textContent?.replace(/\s+/g, " ").trim() || undefined
  const se = root.querySelector(".subTitle")?.textContent?.match(/S\s*(\d+)\s*[:.]?\s*E\s*(\d+)/i)
  return { topline, season: se?.[1], episode: se?.[2] }
}

export const getPlayerMetadata = (): { title?: string; episode?: string } => {
  const structured = getStructuredMetadata()
  const vm = getVideoMeta()
  const rawLabel = findEpisodeRawLabel()
  const overlay = rawLabel ? parseEpisodeLabel(rawLabel) : null
  const tracking = getTrackingMetadata()

  const season = structured.season || vm.season || overlay?.season || tracking.season
  const episodeNum = structured.episode || vm.episode || overlay?.episode || tracking.episode

  // Episode: follow the JSON-LD structured data approach.
  if (season && episodeNum) {
    const show = structured.show || overlay?.show || tracking.show || getOnScreenTitle()
    const episodeTitle = structured.episodeTitle || vm.topline || overlay?.episodeTitle || tracking.episodeTitle

    let episode = `S${season}:E${episodeNum}`
    if (episodeTitle) episode += ` - ${episodeTitle}`

    return { title: show, episode }
  }

  // Movie / single video: the page block topline is the title.
  return {
    title: structured.title || vm.topline || overlay?.show || tracking.show || getOnScreenTitle() || getOgTitle(),
  }
}

export const getSearchQuery = (): string | undefined =>
  new URLSearchParams(document.location.search).get("q")?.trim() ||
  document.querySelector<HTMLInputElement>("input[type='search']")?.value?.trim() ||
  undefined
