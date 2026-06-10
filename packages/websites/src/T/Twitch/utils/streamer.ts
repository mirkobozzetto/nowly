export const findStreamTitle = (): string | undefined => {
  const selectors = [
    '[data-a-target="stream-title"]',
    ".stream-info-card p a",
    ".channel-info-content h2",
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  return undefined
}

export const findStreamerName = (): string | undefined => {
  const selectors = [
    ".channel-info-content h1",
    ".channel-root__info h1",
    '[class*="channel-header"] h1',
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  return undefined
}

export const findGame = (): string | undefined => {
  const selectors = [
    '[data-a-target="stream-game-link"]',
    ".stream-info-card [data-a-target='stream-game-link']",
  ] as const

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  return undefined
}

const upscaleAvatar = (url: string): string =>
  url.replace(/-\d+x\d+\.(png|jpe?g)$/, "-300x300.$1")

export const findStreamerAvatar = (streamerName?: string): string | undefined => {
  // 1. Channel info area — loads immediately on both stream and VOD pages
  const channelAreaSelectors = [
    ".channel-info-content img.tw-image-avatar",
    "[data-a-target='user-avatar'] img.tw-image-avatar",
    "[class*='channel-header'] img.tw-image-avatar[src*='profile_image']",
  ]

  for (const selector of channelAreaSelectors) {
    const img = document.querySelector<HTMLImageElement>(selector)
    if (img?.src?.includes("profile_image")) return upscaleAvatar(img.src)
  }

  // 2. Sidebar alt match as fallback (lazy-loaded, may not be ready on first tick)
  if (streamerName) {
    const byAlt = document.querySelector<HTMLImageElement>(
      `img.tw-image-avatar[alt="${streamerName}"][src*="profile_image"]`,
    )
    if (byAlt?.src) return upscaleAvatar(byAlt.src)
  }

  return undefined
}
