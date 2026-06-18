export const findVideo = (): HTMLVideoElement | null => {
  const selectors = [
    "#dv-web-player video",
    "#dv-web-player .atvwebplayersdk-video-surface video",
    ".atvwebplayersdk-player-container video",
    "video",
  ] as const

  for (const selector of selectors) {
    const video = document.querySelector<HTMLVideoElement>(selector)
    if (video) return video
  }

  return null
}

export const findSeriesTitle = (): string | null => {
  const el = document.querySelector(".atvwebplayersdk-title-text")
  return el?.textContent?.trim() || null
}

export const findEpisodeInfo = (): { season?: string; episode?: string; episodeTitle?: string } | null => {
  const el = document.querySelector(".atvwebplayersdk-episode-info")
  if (!el?.textContent) return null

  const text = el.textContent.trim()
  const match = text.match(/S\.(\d+)\s*Ép\.(\d+)\s*(.*)/i)
  if (match) {
    return {
      season: match[1],
      episode: match[2],
      episodeTitle: match[3]?.trim() || undefined,
    }
  }

  return null
}

export const findTitleText = (): string | null => {
  const selectors = [
    ".atvwebplayersdk-player-container h1",
    ".atvwebplayersdk-player-container [class*='title']",
    ".DVWebNode-detail-atf-wrapper picture img",
    ".DVWebNode-detail-atf-wrapper h1",
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement | HTMLImageElement>(selector)
    if (!el) continue
    const text = el instanceof HTMLImageElement ? el.alt : el.textContent?.trim()
    if (text) return text
  }

  return null
}

export const findBanner = (): string | undefined => {
  const selectors = [
    '[data-automation-id="hero-background"] img',
    "#atf-full",
    ".atvwebplayersdk-player-container img[src*='https']",
    "main div[data-automation-id='hero-background'] img",
  ] as const

  for (const selector of selectors) {
    const img = document.querySelector<HTMLImageElement>(selector)
    if (img?.src) return img.src
  }

  return undefined
}

export const findDescription = (): string | undefined => {
  const el = document.querySelector('div[class^=synopsis] > span, [data-automation-id="synopsis"]')
  return el?.textContent?.trim() || undefined
}

export const findSearchQuery = (): string | undefined => {
  const searchSummary = document.querySelector(".av-refine-bar-summaries")
  return searchSummary?.textContent?.match(/["„]([^"”]+)/)?.[1] || undefined
}
