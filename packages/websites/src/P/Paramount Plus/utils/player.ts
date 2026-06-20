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
  t = t.replace(/\s*[-–—|:]\s*(Regarder|Watch|Ver)\b.*$/i, "")
  t = t.replace(/\s*[-–—|:]\s*Paramount\s*\+?.*$/i, "")
  return t.trim() || undefined
}

const getOg = (prop: string): string | undefined =>
  document.querySelector<HTMLMetaElement>(`meta[property="og:${prop}"]`)?.content?.trim() || undefined

export const getOgTitle = (): string | undefined => cleanTitle(getOg("title"))

export const getPoster = (): string | undefined => {
  // Player overlay poster first, then og:image.
  const img = document.querySelector<HTMLImageElement>(".player-poster img, [class*='poster'] img")
  if (img?.src?.startsWith("https")) return img.src

  const og = getOg("image")
  return og?.startsWith("https") ? og : undefined
}

const getOnScreenTitle = (): string | undefined =>
  document.querySelector<HTMLElement>(
    ".player-title, [class*='show-title'], [class*='title-text']",
  )?.textContent?.trim() || undefined

// Locate the player's on-screen metadata line, e.g. "S1 E2 Yellowstone - Un témoin à abattre".
const findEpisodeRawLabel = (): string | undefined => {
  const re = /S\s*\d+\s*[:.]?\s*E\s*\d+/i

  for (const el of document.querySelectorAll<HTMLElement>("[class*='player'] *, [class*='metadata'] *")) {
    if (el.children.length === 0) {
      const txt = el.textContent?.trim()
      if (txt && re.test(txt)) return txt.replace(/\s+/g, " ")
    }
  }

  const m = document.title.match(/S\s*\d+\s*[:.]?\s*E\s*\d+[^|]*/i)
  return m?.[0]?.trim()
}

type ParsedEpisode = { season: string; episode: string; show?: string; episodeTitle?: string }

// "S1 E2 Yellowstone - Un témoin à abattre" -> { season, episode, show, episodeTitle }
const parseEpisodeLabel = (label: string): ParsedEpisode | null => {
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

export const getPlayerMetadata = (): { title?: string; episode?: string } => {
  const rawLabel = findEpisodeRawLabel()
  const parsed = rawLabel ? parseEpisodeLabel(rawLabel) : null

  // Episode: derive the show title and a compact "S1.E2 Episode title" state.
  if (parsed) {
    const title = parsed.show || getOnScreenTitle() || getOgTitle() || cleanTitle(document.title)
    let episode = `S${parsed.season}.E${parsed.episode}`
    if (parsed.episodeTitle) episode += ` ${parsed.episodeTitle}`
    return { title, episode }
  }

  // Movie / no episode info: just a clean title.
  const title = getOnScreenTitle() || getOgTitle() || cleanTitle(document.title)
  return { title }
}

export const getSearchQuery = (): string | undefined =>
  new URLSearchParams(document.location.search).get("q")?.trim() ||
  document.querySelector<HTMLInputElement>("input[type='search']")?.value?.trim() ||
  undefined
